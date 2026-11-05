// Fapshi payments for the platform's own invoices (schools paying Meridian). The platform never handles the schools' fee money.
// Secrets (never in files): FAPSHI_API_USER, FAPSHI_API_KEY, FAPSHI_WEBHOOK_SECRET (optional but recommended). FAPSHI_LIVE=1 switches from sandbox to live.
const crypto=require('crypto'),{db}=require('./db'),B=require('./billing'),SC=require('./sched');
db.exec(`CREATE TABLE IF NOT EXISTS fapshi_tx(id INTEGER PRIMARY KEY,school_id INTEGER NOT NULL,invoice_id INTEGER NOT NULL,trans_id TEXT UNIQUE,amount INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'CREATED',link TEXT,medium TEXT,revenue INTEGER,settled INTEGER NOT NULL DEFAULT 0,created TEXT,confirmed TEXT,by_name TEXT)`);
const BASE=()=>process.env.FAPSHI_BASE||(process.env.FAPSHI_LIVE=='1'?'https://live.fapshi.com':'https://sandbox.fapshi.com'),
 configured=()=>!!(process.env.FAPSHI_API_USER&&process.env.FAPSHI_API_KEY),live=()=>process.env.FAPSHI_LIVE=='1',MIN=100;
const hdr=()=>({apiuser:process.env.FAPSHI_API_USER,apikey:process.env.FAPSHI_API_KEY,'Content-Type':'application/json'});
async function call(path,body){const r=await fetch(BASE()+path,{method:body?'POST':'GET',headers:hdr(),body:body?JSON.stringify(body):undefined});let d={};try{d=await r.json()}catch{}return{ok:r.ok,s:r.status,d}}
const eq=(a,b)=>{a=Buffer.from(String(a||''));b=Buffer.from(String(b||''));return a.length==b.length&&crypto.timingSafeEqual(a,b)};
// ask Fapshi (never trust a webhook body) and, if the payment succeeded, record it once on the invoice
async function settle(transId){const x=db.prepare('SELECT * FROM fapshi_tx WHERE trans_id=?').get(String(transId||''));if(!x)return null;if(x.settled)return x;
 const r=await call('/payment-status/'+encodeURIComponent(x.trans_id));if(!r.ok||!r.d||!r.d.status)return x;const st=String(r.d.status).toUpperCase();
 if(st!='SUCCESSFUL'){if(st!=x.status)db.prepare('UPDATE fapshi_tx SET status=? WHERE id=?').run(st,x.id);return{...x,status:st}}
 if(+r.d.amount!==x.amount){db.prepare("UPDATE fapshi_tx SET status='MISMATCH' WHERE id=?").run(x.id);console.error('fapshi: amount mismatch',x.trans_id);return{...x,status:'MISMATCH'}}
 const u=db.prepare("UPDATE fapshi_tx SET status='SUCCESSFUL',settled=1,medium=?,revenue=?,confirmed=? WHERE id=? AND settled=0").run(String(r.d.medium||''),+r.d.revenue||null,new Date().toISOString(),x.id);
 if(u.changes==1){const sc=SC.school(x.school_id);B.recordPayment(x.invoice_id,{amount:x.amount,date:SC.clock(sc).date,method:'Fapshi'+(r.d.medium?' ('+r.d.medium+')':''),ref:x.trans_id,by:'Fapshi'})}
 return db.prepare('SELECT * FROM fapshi_tx WHERE id=?').get(x.id)}
const baseOf=req=>(process.env.PUBLIC_URL||process.env.BASE_URL||req.protocol+'://'+req.get('host')).replace(/\/$/,'');
function routes(app,{auth,E,audit}){
 // principal: start a payment for one sent invoice (the amount still owing)
 app.post('/api/billing/pay',auth(['principal'],true),async(req,res)=>{try{
  if(!configured())return E(res,503,'pay_off');const sid=req.user.school_id,i=db.prepare("SELECT * FROM invoices WHERE id=? AND school_id=? AND status='sent'").get(+(req.body||{}).invoice_id,sid);if(!i)return E(res,404,'invalid');
  const owe=B.owing(i);if(owe<=0)return E(res,409,'pay_none');if(owe<MIN)return E(res,409,'pay_min');
  const old=db.prepare("SELECT * FROM fapshi_tx WHERE invoice_id=? AND amount=? AND settled=0 AND status IN('CREATED','PENDING') AND link IS NOT NULL ORDER BY id DESC").get(i.id,owe);
  if(old&&Date.now()-Date.parse(old.created)<23*36e5)return res.json({link:old.link,tx:old.id});          // reuse a link that is still open (no duplicates)
  const ins=db.prepare('INSERT INTO fapshi_tx(school_id,invoice_id,amount,status,created,by_name) VALUES(?,?,?,?,?,?)').run(sid,i.id,owe,'CREATED',new Date().toISOString(),req.user.name||''),txid=+ins.lastInsertRowid;
  const r=await call('/initiate-pay',{amount:owe,email:req.user.email||undefined,redirectUrl:baseOf(req)+'/app?paid='+txid,userId:'S'+sid,externalId:'INV'+i.id+'-'+txid,message:('Meridian '+i.number).slice(0,100)});
  if(!r.ok||!r.d.link||!r.d.transId){db.prepare('DELETE FROM fapshi_tx WHERE id=?').run(txid);console.error('fapshi initiate failed',r.s,r.d&&r.d.message);return E(res,502,'pay_fail')}
  db.prepare('UPDATE fapshi_tx SET trans_id=?,link=? WHERE id=?').run(String(r.d.transId),String(r.d.link),txid);try{audit(req.user,'pay_start',i.number+' '+owe)}catch{}
  res.json({link:r.d.link,tx:txid})}catch(e){console.error('fapshi',e.message);E(res,502,'pay_fail')}});
 // principal: check a payment (used when they come back from Fapshi, and as a fallback if the webhook was missed)
 app.post('/api/billing/pay/check',auth(['principal'],true),async(req,res)=>{try{const x=db.prepare('SELECT * FROM fapshi_tx WHERE id=? AND school_id=?').get(+(req.body||{}).tx,req.user.school_id);if(!x||!x.trans_id)return E(res,404,'invalid');
  const r=await settle(x.trans_id);res.json({status:r.status,settled:!!r.settled})}catch(e){E(res,502,'pay_fail')}});
 app.get('/api/billing/pay/open',auth(['principal'],true),async(req,res)=>{try{                                  // pending payments of this school: re-check them all
  const L=db.prepare("SELECT * FROM fapshi_tx WHERE school_id=? AND settled=0 AND trans_id IS NOT NULL AND status IN('CREATED','PENDING')").all(req.user.school_id);for(const x of L.slice(0,5))await settle(x.trans_id);
  res.json({on:configured(),live:live(),open:db.prepare("SELECT id,invoice_id,amount,status FROM fapshi_tx WHERE school_id=? AND settled=0 AND status IN('CREATED','PENDING') AND trans_id IS NOT NULL").all(req.user.school_id)})}catch{res.json({on:configured(),live:live(),open:[]})}});
 // Fapshi -> us. The body is only a hint: we always confirm with Fapshi before recording anything.
 app.post('/api/fapshi/webhook',async(req,res)=>{const sec=process.env.FAPSHI_WEBHOOK_SECRET;if(sec&&!eq(req.get('x-wh-secret'),sec))return res.status(401).json({error:'auth'});
  const id=req.body&&req.body.transId;try{if(id)await settle(id)}catch(e){console.error('fapshi webhook',e.message)}res.json({ok:1})})}   // settle BEFORE answering: on Cloudflare, work after the response may be cut off, and Fapshi does not retry
function ownerApi(R,{need,E,log}){const MONEY=['owner','finance'];
 R.get('/fapshi',need(MONEY),(req,res)=>{const L=db.prepare('SELECT t.*,s.name school,i.number FROM fapshi_tx t JOIN schools s ON s.id=t.school_id JOIN invoices i ON i.id=t.invoice_id ORDER BY t.id DESC LIMIT 200').all();
  const ok=L.filter(x=>x.settled);res.json({schools:db.prepare('SELECT id,name,code FROM schools ORDER BY name').all(),on:configured(),live:live(),webhook:!!process.env.FAPSHI_WEBHOOK_SECRET,total:ok.reduce((a,x)=>a+x.amount,0),fees:ok.reduce((a,x)=>a+(x.revenue!=null?x.amount-x.revenue:0),0),rows:L.map(x=>({id:x.id,at:x.created,school:x.school,invoice:x.number,amount:x.amount,status:x.status,medium:x.medium||'',ref:x.trans_id||'',revenue:x.revenue}))})});
 // a small invoice to try Fapshi end to end (minimum 100 FCFA); void it afterwards from the Invoices tab
 R.post('/fapshi/test-invoice',need(['owner']),(req,res)=>{const sc=db.prepare('SELECT * FROM schools WHERE id=?').get(+req.body.school_id),a=Math.round(+req.body.amount);if(!sc)return E(res,404,'none');if(!(a>=100&&a<=5000))return E(res,400,'amount');
  const d=SC.clock(sc).date,n=db.prepare("SELECT COUNT(*)+1 n FROM invoices WHERE school_id=? AND term=9").get(sc.id).n;
  db.prepare("INSERT INTO invoices(school_id,year,term,number,modules,students,teachers,lines,gross,discount,amount,status,created,issued,due) VALUES(?,?,9,?,'',0,0,?,?,0,?,'sent',?,?,?)").run(sc.id,B.schoolYear(d),'TEST-'+String(sc.id).padStart(4,'0')+'-'+n+'-'+Date.now().toString(36).slice(-3),JSON.stringify([{k:'min',qty:1,unit:a,per:'test',amount:a}]),a,a,d,d,SC.addDays(d,30));
  log&&log(req.o,'invoice.test',sc.id,a+' FCFA');res.json({ok:1})});
 R.post('/fapshi/:id/check',need(MONEY),async(req,res)=>{const x=db.prepare('SELECT trans_id FROM fapshi_tx WHERE id=?').get(+req.params.id);if(!x||!x.trans_id)return E(res,404,'none');const r=await settle(x.trans_id);res.json({status:r.status,settled:!!r.settled})})}
module.exports={routes,ownerApi,settle,configured};
