// Owners' console API (/owners/api). Owners see money and counts, never school content.
const SEC=require('./secure'),fs=require('fs'),path=require('path'),crypto=require('crypto'),express=require('./core/web'),{db,tx,hash,verify}=require('./db'),B=require('./billing'),SC=require('./sched'),PDF=require('./billpdf'),{PDFDocument:PD,pipe}=require('./core/pdfkit');
const E=(res,s,e)=>res.status(s).json({error:e}),now=()=>new Date().toISOString(),MONEY=['owner','finance'],SCH=['owner','support'],isD=d=>SC.isDate(d);
const loadEnv=()=>{if(require('./core/runtime').driver)return;const envPath=path.join(__dirname,'.env');if(!fs.existsSync(envPath))return;for(const line of fs.readFileSync(envPath,'utf8').split(/\r?\n/)){const m=line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);if(!m)continue;const [,key,val]=m;if(typeof process.env[key]==='undefined')process.env[key]=val.replace(/^['"]|['"]$/g,'');}}
loadEnv();
const OWNER_EMAIL=(process.env.EMAIL||'').trim().toLowerCase();
const OWNER_PASSWORD=String(process.env.PASSWORD||'');
const newSecret=()=>Buffer.from(crypto.randomBytes(20)).toString('base64url');
const codeAt=()=>'';
const ensureOwner=()=>{if(!OWNER_EMAIL||!OWNER_PASSWORD)return;const e=db.prepare('SELECT id FROM owners WHERE email=?').get(OWNER_EMAIL);if(e){db.prepare('UPDATE owners SET pw=?,name=?,role=?,active=1 WHERE email=?').run(hash(OWNER_PASSWORD),'Owner','owner',OWNER_EMAIL);return}db.prepare('INSERT INTO owners(email,name,role,pw,totp,totp_on,last_step,active) VALUES(?,?,?,?,?,?,?,?)').run(OWNER_EMAIL,'Owner','owner',hash(OWNER_PASSWORD),newSecret(),1,0,1)};
if(OWNER_PASSWORD&&OWNER_PASSWORD.length<12){const m='Owner PASSWORD in .env is shorter than 12 characters. Use a long passphrase.';if(SEC.PROD)throw new Error(m);console.warn('WARNING: '+m)}
ensureOwner();
// ---- tamper-evident log: every row carries the hash of the one before; the table refuses UPDATE and DELETE
const hOf=(prev,r)=>crypto.createHash('sha256').update([prev,r.at,r.owner_id,r.owner_name,r.action,r.school_id,r.detail].join('|')).digest('hex');
function log(o,action,school_id=null,detail=''){const r={at:now(),owner_id:o?o.id:null,owner_name:o?o.name:'',action,school_id,detail:String(detail).slice(0,500)},last=db.prepare('SELECT hash FROM owner_audit ORDER BY id DESC LIMIT 1').get();
 const prev=last?last.hash:'';db.prepare('INSERT INTO owner_audit(at,owner_id,owner_name,action,school_id,detail,prev,hash) VALUES(?,?,?,?,?,?,?,?)').run(r.at,r.owner_id,r.owner_name,action,school_id,r.detail,prev,hOf(prev,r))}
function chainOk(){let prev='';for(const r of db.prepare('SELECT * FROM owner_audit ORDER BY id').all()){if(r.prev!=prev||r.hash!=hOf(prev,r))return false;prev=r.hash}return true}
module.exports=function(app){
const R=express.Router(),att={};
const LIFE=12*36e5,PEND=10*6e4;
const ownerOf=(tok,full=true)=>{const x=db.prepare('SELECT o.*,s.stage,s.created sess FROM owner_sessions s JOIN owners o ON o.id=s.owner_id WHERE s.token=? AND o.active=1').get(tok||'');if(!x)return null;
 const age=Date.now()-Date.parse(x.sess.replace(' ','T')+'Z');if(age>(x.stage=='full'?LIFE:PEND)){db.prepare('DELETE FROM owner_sessions WHERE token=?').run(tok);return null}return full&&x.stage!='full'?null:x};
const need=(roles=[])=>(req,res,next)=>{const o=ownerOf(req.cookies.o);if(!o)return E(res,401,'auth');if(roles.length&&!roles.includes(o.role))return E(res,403,'role');req.o=o;next()};
const sess=(res,o,stage='full')=>{const t=crypto.randomBytes(32).toString('hex');db.prepare('DELETE FROM owner_sessions WHERE owner_id=? AND stage!=?').run(o.id,'full');db.prepare('INSERT INTO owner_sessions(token,owner_id,stage) VALUES(?,?,?)').run(t,o.id,stage);res.cookie('o',t,SEC.cookieOpts(res,{httpOnly:true,sameSite:'strict',path:'/owners',maxAge:LIFE}))};
R.post('/login',async(req,res)=>{const{email='',password=''}=req.body,e=String(email).trim().toLowerCase(),k='ow'+req.ip+e,ka='owa'+e;
 // lockouts: 5 wrong tries per address+email, and 10 per email from anywhere, each for 15 minutes
 if(SEC.hit('owi'+req.ip,40,9e5)||(att[k]||0)>=5||(att[ka]||0)>=10)return E(res,429,'many');
 const ok=OWNER_EMAIL&&OWNER_PASSWORD&&SEC.same(e,OWNER_EMAIL)&SEC.same(password,OWNER_PASSWORD)?true:false;   // bitwise &: both compared, always
 const o=ok?db.prepare('SELECT * FROM owners WHERE email=? AND active=1').get(OWNER_EMAIL):null;
 if(!o){att[k]=(att[k]||0)+1;att[ka]=(att[ka]||0)+1;setTimeout(()=>{delete att[k];delete att[ka]},9e5).unref();
  try{log(null,'login.fail',null,(e||'-').slice(0,60)+' from '+req.ip)}catch{}return E(res,401,'login')}
 delete att[k];   // password right: the console always asks for an emailed code too (no remembered devices here)
 const A2=require('./auth2'),tk=A2.make({owner_id:o.id,kind:'owner'}),sent=await A2.sendCode(A2.get(tk),OWNER_EMAIL,'en','login');log(o,'login.password');res.json({step:'code',ticket:tk,hint:A2.hint(OWNER_EMAIL),sent:sent=='ok'})});
R.post('/login/verify',(req,res)=>{if(SEC.hit('owv'+req.ip,20,9e5))return E(res,429,'many');const A2=require('./auth2'),r=A2.check(req.body.ticket,req.body.code);
 if(typeof r=='string')return E(res,r=='code'?401:r=='many'?429:410,r);const o=r.owner_id&&db.prepare('SELECT * FROM owners WHERE id=? AND active=1').get(r.owner_id);if(!o)return E(res,410,'expired');sess(res,o,'full');log(o,'login');res.json({ok:1})});
R.post('/logout',(req,res)=>{db.prepare('DELETE FROM owner_sessions WHERE token=?').run(req.cookies.o||'');res.clearCookie('o',{path:'/owners'});res.json({ok:1})});
R.get('/me',need(),(req,res)=>res.json({name:req.o.name,email:req.o.email,role:req.o.role,today:now().slice(0,10)}));
// ---- helpers
const D=n=>Math.round(n||0),principal=sid=>db.prepare("SELECT name,phone FROM users WHERE school_id=? AND role='principal' AND active=1 ORDER BY id LIMIT 1").get(sid)||{name:'',phone:''};
const lastInv=sid=>db.prepare("SELECT * FROM invoices WHERE school_id=? AND status!='draft' ORDER BY year DESC,term DESC LIMIT 1").get(sid);
const lastPay=sid=>db.prepare('SELECT amount,date,receipt FROM bill_payments WHERE school_id=? ORDER BY date DESC,id DESC LIMIT 1').get(sid);
function stateOf(s,st){if(s.flag=='cancelled')return'cancelled';if(st.state=='readonly')return'readonly';if(st.state=='overdue')return'overdue';if(st.state=='free')return'free';return'paying'}
function row(s,money){B.draftInvoices(s.id);const st=B.status(s.id),pk=B.touchPeak(s.id)||B.counts(s.id,SC.clock(s).date),mods=(s.modules||'reports,fees,tracking').split(','),est=B.price(mods,pk.students,pk.teachers,B.priceFor(s),s.discount_pct||0),pr=principal(s.id),li=lastInv(s.id),lp=lastPay(s.id);
 const r={id:s.id,code:s.code,name:s.name,city:s.city||'',principal:pr.name,phone:pr.phone||'',created:(s.created||'').slice(0,10),modules:mods,students:pk.students,teachers:pk.teachers,state:stateOf(s,st),free_until:(s.trial_ends||'').slice(0,10),flag:s.flag||'',manual:!!st.manual,note:s.owner_note||''};
 if(money)Object.assign(r,{estimate:est.amount,discount_pct:s.discount_pct||0,lock_until:s.price_lock_until||'',days:st.days??null,owing:st.owing||0,due:st.invoice?st.invoice.due:'',last_invoice:li?{id:li.id,number:li.number,amount:li.amount,status:li.status,term:li.term,year:li.year}:null,last_payment:lp||null});return r}
const allRows=money=>db.prepare('SELECT * FROM schools ORDER BY id').all().map(s=>row(s,money));
const reasonOk=r=>typeof r=='string'&&r.trim().length>=3;
// ---- money home
const termKey=()=>{const t=B.termAt({},new Date().toISOString().slice(0,10));return{year:t.year,term:t.term}};
R.get('/home',need(MONEY),(req,res)=>{const rows=allRows(true),cur=termKey(),terms=db.prepare('SELECT DISTINCT year,term FROM invoices WHERE status!=\'draft\' ORDER BY year DESC,term DESC').all();if(!terms.some(x=>x.year==cur.year&&x.term==cur.term))terms.unshift(cur);
 const y=+req.query.year||terms[0].year,t=+req.query.term||terms[0].term,inv=db.prepare("SELECT * FROM invoices WHERE year=? AND term=? AND status IN('sent','paid')").all(y,t);
 const invoiced=inv.reduce((a,i)=>a+i.amount,0),coll=inv.reduce((a,i)=>a+B.paidOf(i.id),0),out=inv.filter(i=>i.status=='sent').reduce((a,i)=>a+Math.max(0,B.owing(i)),0);
 const live=rows.filter(r=>r.state!='cancelled'),cnt=k=>live.filter(r=>r.state==k).length,drafts=db.prepare("SELECT COUNT(*) n FROM invoices WHERE status='draft'").get().n;
 const act=[];for(const r of live){if(r.state=='overdue'||r.state=='readonly')act.push({kind:r.state,school_id:r.id,school:r.name,days:r.days,amount:r.owing,invoice:r.last_invoice&&r.last_invoice.number,manual:r.manual});
  if(r.state=='free'){const left=B.days(SC.clock(db.prepare('SELECT * FROM schools WHERE id=?').get(r.id)).date,r.free_until);if(left<=14)act.push({kind:'free_end',school_id:r.id,school:r.name,left,students:r.students})}}
 act.sort((a,b)=>({readonly:0,overdue:1,free_end:2}[a.kind]-{readonly:0,overdue:1,free_end:2}[b.kind])||((b.days||0)-(a.days||0)));
 res.json({term:{year:y,term:t},terms,counts:{schools:live.length,free:cnt('free'),paying:cnt('paying'),overdue:cnt('overdue'),readonly:cnt('readonly'),cancelled:rows.length-live.length},estimated:live.reduce((a,r)=>a+(r.state=='free'?0:r.estimate),0),estimated_all:live.reduce((a,r)=>a+r.estimate,0),invoiced,collected:coll,outstanding:out,drafts,actions:act,schools:rows})});
// ---- schools registry (support sees no money)
const strip=r=>{const{estimate,discount_pct,lock_until,days,owing,due,last_invoice,last_payment,...x}=r;return x};
R.get('/schools',need(),(req,res)=>{const q=String(req.query.q||'').toLowerCase(),st=String(req.query.state||''),m=MONEY.includes(req.o.role);let r=allRows(m);
 r=r.filter(x=>(!q||(x.name+x.code+x.city+x.principal).toLowerCase().includes(q))&&(!st||x.state==st));res.json(m?r:r.map(strip))});
R.get('/schools/:id',need(),(req,res)=>{const s=db.prepare('SELECT * FROM schools WHERE id=?').get(+req.params.id);if(!s)return E(res,404,'none');const m=MONEY.includes(req.o.role),r=row(s,m);
 const o={school:r,audit:db.prepare('SELECT at,owner_name,action,detail FROM owner_audit WHERE school_id=? ORDER BY id DESC LIMIT 30').all(s.id),terms:B.termsOf(s,B.schoolYear(SC.clock(s).date))};
 if(m)o.invoices=db.prepare("SELECT * FROM invoices WHERE school_id=? ORDER BY year DESC,term DESC").all(s.id).map(i=>invOut(i));res.json(o)});
R.post('/schools/:id/note',need(),(req,res)=>{const s=db.prepare('SELECT * FROM schools WHERE id=?').get(+req.params.id);if(!s)return E(res,404,'none');const n=String(req.body.note||'').slice(0,1000);db.prepare('UPDATE schools SET owner_note=? WHERE id=?').run(n,s.id);log(req.o,'school.note',s.id,'');res.json({ok:1})});
R.post('/schools/:id/action',need(),(req,res)=>{const s=db.prepare('SELECT * FROM schools WHERE id=?').get(+req.params.id);if(!s)return E(res,404,'none');const{action,reason,until,modules,pct}=req.body,role=req.o.role;
 if(!reasonOk(reason))return E(res,400,'reason');const money=['discount','lock','unlock'].includes(action);if(money?!MONEY.includes(role)||role!='owner':!SCH.includes(role))return E(res,403,'role');
 if(action=='extend'){if(!isD(until)||until<=(s.trial_ends||'').slice(0,10))return E(res,400,'date');db.prepare('UPDATE schools SET trial_ends=? WHERE id=?').run(until,s.id);log(req.o,'school.extend',s.id,`until ${until}: ${reason}`)}
 else if(action=='modules'){const m=B.MODS.filter(x=>(modules||[]).includes(x));if(!m.length)return E(res,400,'modules');db.prepare('UPDATE schools SET modules=? WHERE id=?').run(m.join(','),s.id);log(req.o,'school.modules',s.id,`${m.join(',')}: ${reason}`)}
 else if(action=='readonly'||action=='cancel'){db.prepare('UPDATE schools SET flag=? WHERE id=?').run(action=='cancel'?'cancelled':'readonly',s.id);if(action=='cancel')db.prepare('DELETE FROM sessions WHERE user_id IN(SELECT id FROM users WHERE school_id=?)').run(s.id);log(req.o,'school.'+action,s.id,reason)}
 else if(action=='reactivate'){db.prepare("UPDATE schools SET flag='' WHERE id=?").run(s.id);log(req.o,'school.reactivate',s.id,reason)}
 else if(action=='discount'){const p=Math.round(+pct);if(!(p>=0&&p<=100))return E(res,400,'pct');db.prepare('UPDATE schools SET discount_pct=? WHERE id=?').run(p,s.id);log(req.o,'school.discount',s.id,`${p}%: ${reason}`)}
 else if(action=='lock'){if(!isD(until))return E(res,400,'date');db.prepare('UPDATE schools SET price_lock_until=?,locked_prices=? WHERE id=?').run(until,JSON.stringify(B.priceFor(s)),s.id);log(req.o,'school.lock',s.id,`prices frozen until ${until}: ${reason}`)}
 else if(action=='unlock'){db.prepare('UPDATE schools SET price_lock_until=NULL,locked_prices=NULL WHERE id=?').run(s.id);log(req.o,'school.unlock',s.id,reason)}
 else return E(res,400,'action');res.json({ok:1})});
// ---- invoices, payments, credit notes
function invOut(i){const s=db.prepare('SELECT name,code FROM schools WHERE id=?').get(i.school_id);return{id:i.id,school_id:i.school_id,school:s.name,code:s.code,number:i.number,year:i.year,term:i.term,students:i.students,teachers:i.teachers,modules:(i.modules||'').split(','),lines:JSON.parse(i.lines||'[]'),gross:i.gross,discount:i.discount,amount:i.amount,status:i.status,issued:i.issued,due:i.due,adj_note:i.adj_note||'',
 paid:B.paidOf(i.id),credited:db.prepare('SELECT COALESCE(SUM(amount),0) a FROM credit_notes WHERE invoice_id=?').get(i.id).a,owing:i.status=='draft'||i.status=='void'?0:Math.max(0,B.owing(i)),
 payments:db.prepare('SELECT id,receipt,amount,date,method,ref,by_name FROM bill_payments WHERE invoice_id=? ORDER BY id').all(i.id),credits:db.prepare('SELECT number,amount,reason,at FROM credit_notes WHERE invoice_id=? ORDER BY id').all(i.id)}}
R.get('/invoices',need(MONEY),(req,res)=>{for(const s of db.prepare('SELECT id FROM schools').all())B.draftInvoices(s.id);const st=String(req.query.status||'');
 res.json(db.prepare('SELECT * FROM invoices ORDER BY year DESC,term DESC,id DESC').all().filter(i=>!st||i.status==st).map(invOut))});
const inv=(req,res,need_)=>{const i=db.prepare('SELECT * FROM invoices WHERE id=?').get(+req.params.id);if(!i){E(res,404,'none');return null}if(need_&&!need_.includes(i.status)){E(res,409,'status');return null}return i};
R.post('/invoices/:id/adjust',need(MONEY),(req,res)=>{const i=inv(req,res,['draft']);if(!i)return;const d=Math.round(+req.body.discount);if(!(d>=0&&d<=i.gross)||!reasonOk(req.body.note))return E(res,400,'invalid');
 db.prepare('UPDATE invoices SET discount=?,amount=?,adj_note=? WHERE id=?').run(d,i.gross-d,String(req.body.note).trim(),i.id);log(req.o,'invoice.adjust',i.school_id,`${i.number} discount ${d}: ${req.body.note}`);res.json({ok:1})});
R.post('/invoices/:id/send',need(MONEY),(req,res)=>{const i=inv(req,res,['draft']);if(!i)return;const r=B.sendInvoice(i.id,req.o.name,SC.clock(SC.school(i.school_id)).date);log(req.o,'invoice.send',i.school_id,`${i.number} ${i.amount} due ${r.due}`);res.json({ok:1})});
R.post('/invoices/:id/payment',need(MONEY),(req,res)=>{const i=inv(req,res,['sent']);if(!i)return;const a=Math.round(+req.body.amount),d=String(req.body.date||''),sc=SC.school(i.school_id),today=SC.clock(sc).date;
 if(!(a>0)||a>B.owing(i)||!isD(d)||d>today||!['momo','om','bank','cash','other'].includes(req.body.method))return E(res,400,'invalid');
 if(['momo','om','bank'].includes(req.body.method)&&!String(req.body.ref||'').trim())return E(res,400,'ref');
 const r=B.recordPayment(i.id,{amount:a,date:d,method:req.body.method,ref:String(req.body.ref||'').trim().slice(0,60),by:req.o.name});const p=db.prepare('SELECT receipt FROM bill_payments WHERE invoice_id=? ORDER BY id DESC LIMIT 1').get(i.id);
 log(req.o,'payment.record',i.school_id,`${i.number} ${a} ${req.body.method} ${p.receipt}`);res.json({ok:1,receipt:p.receipt,status:r.status})});
R.post('/invoices/:id/credit',need(MONEY),(req,res)=>{const i=inv(req,res,['sent']);if(!i)return;const a=Math.round(+req.body.amount);if(!(a>0)||a>B.owing(i)||!reasonOk(req.body.reason))return E(res,400,'invalid');
 const n=db.prepare('SELECT COUNT(*)+1 n FROM credit_notes').get().n,no='CN-'+String(n).padStart(5,'0');
 tx(()=>{db.prepare('INSERT INTO credit_notes(school_id,invoice_id,amount,reason,number,by_name,at) VALUES(?,?,?,?,?,?,?)').run(i.school_id,i.id,a,String(req.body.reason).trim(),no,req.o.name,now());
  const left=B.owing(db.prepare('SELECT * FROM invoices WHERE id=?').get(i.id));if(left<=0)db.prepare('UPDATE invoices SET status=? WHERE id=?').run(B.paidOf(i.id)>0?'paid':'void',i.id)})();
 log(req.o,'invoice.credit',i.school_id,`${i.number} ${no} ${a}: ${req.body.reason}`);res.json({ok:1,number:no})});
R.get('/invoices/:id/pdf',need(MONEY),(req,res)=>PDF.invoice(res,+req.params.id)||E(res,404,'none'));
R.get('/payments/:id/receipt',need(MONEY),(req,res)=>PDF.receipt(res,+req.params.id)||E(res,404,'none'));
// ---- reminders: prepared WhatsApp messages, sent by hand
const KIND=d=>d<0?'before':d<7?'due':d<14?'after7':'after14';
const MSG={en:{before:(c)=>`Hello ${c.p}, a friendly reminder: invoice ${c.no} for ${c.school} (${c.amt} FCFA) is due on ${c.due}.`,due:c=>`Hello ${c.p}, invoice ${c.no} for ${c.school} (${c.amt} FCFA) is due ${c.d==0?'today':'since '+c.due}.`,after7:c=>`Hello ${c.p}, invoice ${c.no} for ${c.school} (${c.amt} FCFA) is now ${c.d} days overdue.`,after14:c=>`Hello ${c.p}, invoice ${c.no} for ${c.school} (${c.amt} FCFA) is ${c.d} days overdue. ${c.left>0?`The platform becomes read-only in ${c.left} days.`:'The platform is now read-only until it is paid.'}`,tail:' You can pay by mobile money or bank transfer and send us the reference. Thank you!'},
 fr:{before:c=>`Bonjour ${c.p}, petit rappel : la facture ${c.no} de ${c.school} (${c.amt} FCFA) est due le ${c.due}.`,due:c=>`Bonjour ${c.p}, la facture ${c.no} de ${c.school} (${c.amt} FCFA) est due ${c.d==0?'aujourd’hui':'depuis le '+c.due}.`,after7:c=>`Bonjour ${c.p}, la facture ${c.no} de ${c.school} (${c.amt} FCFA) a ${c.d} jours de retard.`,after14:c=>`Bonjour ${c.p}, la facture ${c.no} de ${c.school} (${c.amt} FCFA) a ${c.d} jours de retard. ${c.left>0?`La plateforme passera en lecture seule dans ${c.left} jours.`:'La plateforme est en lecture seule jusqu’au paiement.'}`,tail:' Vous pouvez payer par mobile money ou virement et nous envoyer la référence. Merci !'}};
const fmt=n=>String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
R.get('/reminders',need(MONEY),(req,res)=>{const lang=req.query.lang=='fr'?'fr':'en',out=[],P=B.P();
 for(const i of db.prepare("SELECT * FROM invoices WHERE status='sent'").all()){const s=SC.school(i.school_id),o=B.owing(i);if(o<=0)continue;const d=B.days(i.due,SC.clock(s).date);if(d<-7)continue;
  const pr=principal(s.id),k=KIND(d),c={p:pr.name||'',no:i.number,school:s.name,amt:fmt(o),due:i.due,d,left:Math.max(0,P.grace_days-d)},text=MSG[lang][k](c)+MSG[lang].tail,ph=String(pr.phone||'').replace(/[^\d]/g,'');
  const last=db.prepare("SELECT at,detail FROM owner_audit WHERE action='reminder.sent' AND school_id=? AND detail LIKE ? ORDER BY id DESC LIMIT 1").get(s.id,i.number+' %');
  out.push({invoice_id:i.id,number:i.number,school_id:s.id,school:s.name,principal:pr.name,phone:pr.phone||'',kind:k,days:d,owing:o,text,url:`https://wa.me/${ph}?text=${encodeURIComponent(text)}`,last:last?last.at:null,last_kind:last?last.detail.split(' ')[1]:null})}
 out.sort((a,b)=>b.days-a.days);res.json(out)});
R.post('/reminders/sent',need(MONEY),(req,res)=>{const i=db.prepare('SELECT * FROM invoices WHERE id=?').get(+req.body.invoice_id);if(!i)return E(res,404,'none');log(req.o,'reminder.sent',i.school_id,`${i.number} ${String(req.body.kind||'').slice(0,10)}`);res.json({ok:1})});
// ---- prices (changes start with the next term only)
const nextStart=()=>{const t=B.termAt({},new Date().toISOString().slice(0,10));if(!t.current)return t.start;const L=[...B.termsOf({},t.year),...B.termsOf({},t.year+1)],i=L.findIndex(x=>x.term==t.term&&x.year==t.year);return L[i+1].start};
R.get('/prices',need(MONEY),(req,res)=>res.json({current:B.P(),base:Object.fromEntries(db.prepare('SELECT key,value FROM prices').all().map(r=>[r.key,r.value])),scheduled:db.prepare('SELECT eff,key,value FROM price_plan ORDER BY eff,key').all(),next_start:nextStart(),can_edit:req.o.role=='owner'}));
R.post('/prices',need(['owner']),(req,res)=>{const ok=Object.keys(B.P()),ch=req.body.changes||{},eff=nextStart();const ent=Object.entries(ch);if(!ent.length||ent.some(([k,v])=>!ok.includes(k)||!(Number.isInteger(v)&&v>=0&&v<=1e7)))return E(res,400,'invalid');
 tx(()=>{for(const[k,v]of ent)db.prepare('INSERT INTO price_plan(eff,key,value) VALUES(?,?,?) ON CONFLICT(eff,key) DO UPDATE SET value=excluded.value').run(eff,k,v)})();log(req.o,'prices.change',null,`from ${eff}: ${ent.map(([k,v])=>k+'='+v).join(', ')}`);res.json({ok:1,eff})});
R.post('/prices/cancel',need(['owner']),(req,res)=>{const eff=String(req.body.eff||'');if(eff<=new Date().toISOString().slice(0,10))return E(res,400,'invalid');db.prepare('DELETE FROM price_plan WHERE eff=?').run(eff);log(req.o,'prices.cancel',null,eff);res.json({ok:1})});
// ---- export for the accountant
const csv=rows=>'﻿'+rows.map(r=>r.map(v=>{v=v==null?'':String(v);return/[",\n;]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}).join(',')).join('\r\n');
function expRows(q){const y=+q.year,t=+q.term;if(!y)return null;const w=t?'AND i.term='+t:'';
 const I=db.prepare(`SELECT i.*,s.name sname,s.code scode FROM invoices i JOIN schools s ON s.id=i.school_id WHERE i.year=? ${w} AND i.status!='draft' ORDER BY i.term,i.id`).all(y),
 P=db.prepare(`SELECT p.*,i.number inv,s.name sname,s.code scode FROM bill_payments p JOIN invoices i ON i.id=p.invoice_id JOIN schools s ON s.id=p.school_id WHERE i.year=? ${w} ORDER BY p.date,p.id`).all(y);return{I,P,y,t}}
R.get('/export.csv',need(MONEY),(req,res)=>{const x=expRows(req.query);if(!x)return E(res,400,'invalid');const pay=req.query.scope=='payments';
 const rows=pay?[['Receipt','Date','School','Code','Invoice','Amount','Method','Reference','Recorded by'],...x.P.map(p=>[p.receipt,p.date,p.sname,p.scode,p.inv,p.amount,p.method,p.ref,p.by_name])]
 :[['Invoice','School','Code','Year','Term','Students','Teachers','Gross','Discount','Amount','Status','Issued','Due','Paid','Credited','Owing'],...x.I.map(i=>{const o=invOut(i);return[i.number,i.sname,i.scode,i.year,i.term,i.students,i.teachers,i.gross,i.discount,i.amount,i.status,i.issued,i.due,o.paid,o.credited,o.owing]})];
 res.setHeader('Content-Type','text/csv; charset=utf-8');res.setHeader('Content-Disposition',`attachment; filename="${pay?'payments':'invoices'}-${x.y}${x.t?'-T'+x.t:''}.csv"`);res.send(csv(rows))});
R.get('/export.pdf',need(MONEY),(req,res)=>{const x=expRows(req.query);if(!x)return E(res,400,'invalid');res.setHeader('Content-Type','application/pdf');res.setHeader('Content-Disposition',`attachment; filename="billing-${x.y}${x.t?'-T'+x.t:''}.pdf"`);
 const doc=new PD({size:'A4',margin:40,layout:'landscape'});pipe(doc,res);doc.font('Helvetica-Bold').fontSize(16).text(`Billing ${x.y}/${x.y+1}${x.t?' · Term '+x.t:''}`);doc.moveDown(.5);
 const cols=[[ 'Invoice',110],['School',190],['Amount',80],['Paid',80],['Owing',80],['Status',60],['Due',70]];let y=doc.y+6;const line=(v,b)=>{let X=40;doc.font(b?'Helvetica-Bold':'Helvetica').fontSize(9);v.forEach((c,i)=>{doc.text(String(c),X,y,{width:cols[i][1]-6,lineBreak:false,ellipsis:true,align:i>=2&&i<=4?'right':'left'});X+=cols[i][1]});y+=16;if(y>540){doc.addPage();y=40}};
 line(cols.map(c=>c[0]),1);let T=[0,0,0];for(const i of x.I){const o=invOut(i);T[0]+=i.amount;T[1]+=o.paid;T[2]+=o.owing;line([i.number,i.sname,fmt(i.amount),fmt(o.paid),fmt(o.owing),i.status,i.due||''])}
 y+=6;line(['Total','',fmt(T[0]),fmt(T[1]),fmt(T[2]),'',''],1);doc.end()});

// ---- usage and health: counts only
const RP=require('./report'),BK=require('./backup');
const ago=d=>new Date(Date.now()-d*864e5).toISOString().slice(0,19).replace('T',' ');
function usageOf(s){const ck=SC.clock(s),t=B.termAt(s,ck.date),seqs=RP.seqs(s).filter(q=>q.term==t.term).map(q=>q.id),c=B.counts(s.id,ck.date);
 const last=db.prepare("SELECT MAX(at) a FROM audit WHERE school_id=? AND action='login'").get(s.id).a,act=db.prepare("SELECT COUNT(DISTINCT user_id) n FROM audit WHERE school_id=? AND action='login' AND at>=?").get(s.id,ago(7)).n,
 marks=seqs.length?db.prepare(`SELECT COUNT(*) n FROM marks WHERE school_id=? AND seq IN (${seqs.map(()=>'?').join(',')})`).get(s.id,...seqs).n:0,pub=db.prepare('SELECT COUNT(*) n FROM publications WHERE school_id=? AND term=?').get(s.id,t.term).n;
 const age=B.days((s.created||'').slice(0,10),ck.date),fu=(s.trial_ends||'').slice(0,10),left=fu?B.days(ck.date,fu):null,free=s.flag!='cancelled'&&fu&&ck.date<=fu;let risk='';
 if(s.flag!='cancelled'){if(age>=7&&c.students==0)risk='no_students';else if(free&&left<=14&&(c.students<5||marks==0))risk='low_use'}
 return{id:s.id,name:s.name,code:s.code,city:s.city||'',students:c.students,teachers:c.teachers,last_login:last?last.replace(' ','T')+'Z':null,active7:act,marks,published:pub,age,free_left:free?left:null,risk,term:t.term}}
R.get('/usage',need(),(req,res)=>{const u=db.prepare('SELECT * FROM schools ORDER BY id').all().map(usageOf);res.json({schools:u,atrisk:u.filter(x=>x.risk)})});
R.get('/health',need(['owner','support']),(req,res)=>res.json(BK.health()));
R.get('/schools/:id/export',need(['owner','finance']),(req,res)=>{const x=require('./export').exportSchool(+req.params.id);if(!x)return E(res,404,'none');log(req.o,'school.export',+req.params.id,'');res.set('Content-Disposition',`attachment; filename=school-${x.school.code}-${x.exported.slice(0,10)}.json`).json(x)});
R.post('/backup',need(['owner']),(req,res)=>{const ok=BK.run('manual');log(req.o,'backup.run',null,ok?'ok':'failed');res.json({ok})});
// ---- support mode, reset links
R.post('/schools/:id/support',need(SCH),(req,res)=>{const s=db.prepare('SELECT * FROM schools WHERE id=?').get(+req.params.id);if(!s)return E(res,404,'none');
 if(!s.support_until||s.support_until<=now())return E(res,409,'noconsent');if(!reasonOk(req.body.reason))return E(res,400,'reason');
 const tok='sp_'+crypto.randomBytes(24).toString('hex'),exp=new Date(Math.min(Date.now()+4*36e5,Date.parse(s.support_until))).toISOString();
 db.prepare('INSERT INTO support_sessions(token,school_id,owner_id,owner_name,started,last_seen,expires) VALUES(?,?,?,?,?,?,?)').run(tok,s.id,req.o.id,req.o.name,now(),now(),exp);
 log(req.o,'support.open',s.id,`read-only until ${exp.slice(0,16)}: ${req.body.reason}`);res.json({url:'/support/enter?token='+tok,expires:exp})});
R.post('/schools/:id/reset-link',need(SCH),(req,res)=>{const s=db.prepare('SELECT * FROM schools WHERE id=?').get(+req.params.id);if(!s)return E(res,404,'none');if(!reasonOk(req.body.reason))return E(res,400,'reason');
 const p=db.prepare("SELECT id,name,phone FROM users WHERE school_id=? AND role='principal' AND active=1 ORDER BY id LIMIT 1").get(s.id);if(!p)return E(res,409,'noprincipal');
 const tok=crypto.randomBytes(24).toString('hex');db.prepare('DELETE FROM reset_tokens WHERE user_id=?').run(p.id);
 db.prepare('INSERT INTO reset_tokens(hash,user_id,expires) VALUES(?,?,?)').run(crypto.createHash('sha256').update(tok).digest('hex'),p.id,new Date(Date.now()+864e5).toISOString());
 const url=`${req.protocol}://${req.get('host')}/reset?token=${tok}`,text=`Hello ${p.name}, here is your password reset link for ${s.name}. It works once and expires in 24 hours: ${url}`;
 log(req.o,'school.reset_link',s.id,req.body.reason);res.json({url,principal:p.name,phone:p.phone||'',wa:`https://wa.me/${String(p.phone||'').replace(/[^\d]/g,'')}?text=${encodeURIComponent(text)}`})});
R.get('/schools/:id/support',need(SCH),(req,res)=>{const s=db.prepare('SELECT support_until FROM schools WHERE id=?').get(+req.params.id);if(!s)return E(res,404,'none');const on=!!s.support_until&&s.support_until>now();
 res.json({on,until:on?s.support_until:null,sessions:db.prepare('SELECT owner_name,started,ended,reads,areas FROM support_sessions WHERE school_id=? ORDER BY id DESC LIMIT 10').all(+req.params.id)})});
// ---- announcements
R.get('/announcements',need(['owner']),(req,res)=>res.json(db.prepare('SELECT * FROM announcements ORDER BY id DESC LIMIT 50').all()));
R.post('/announcements',need(['owner']),(req,res)=>{const b=req.body,t=s=>String(s||'').trim();if(!t(b.title_en)||!isD(b.starts)||!isD(b.ends)||b.ends<b.starts||!['info','warn'].includes(b.level))return E(res,400,'invalid');
 const r=db.prepare('INSERT INTO announcements(title_en,body_en,title_fr,body_fr,level,starts,ends,by_name,created) VALUES(?,?,?,?,?,?,?,?,?)').run(t(b.title_en).slice(0,120),t(b.body_en).slice(0,400),t(b.title_fr).slice(0,120),t(b.body_fr).slice(0,400),b.level,b.starts,b.ends,req.o.name,now());
 log(req.o,'announcement.create',null,t(b.title_en).slice(0,80));res.json({ok:1,id:r.lastInsertRowid})});
R.post('/announcements/:id/end',need(['owner']),(req,res)=>{db.prepare('UPDATE announcements SET active=0 WHERE id=?').run(+req.params.id);log(req.o,'announcement.end',null,String(req.params.id));res.json({ok:1})});
// ---- audit (owners only)
R.get('/audit',need(['owner']),(req,res)=>res.json({valid:chainOk(),rows:db.prepare('SELECT id,at,owner_name,action,school_id,detail FROM owner_audit ORDER BY id DESC LIMIT 300').all().map(r=>({...r,school:r.school_id?(db.prepare('SELECT name FROM schools WHERE id=?').get(r.school_id)||{}).name:''}))}));
require('./ai').ownerApi(R,{need,log,E});require('./referral').ownerApi(R,{need,log,E});
app.use('/owners/api',express.json(),R);
app.get('/owners',(req,res)=>res.sendFile(require('path').join(__dirname,'public','owners.html')));
};
module.exports.log=log;module.exports.chainOk=chainOk;module.exports.newSecret=newSecret;module.exports.codeAt=codeAt;
