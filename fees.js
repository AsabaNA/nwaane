// Phase 5: school fees — plan per class and term, payments with receipts, balances, unpaid list, report-card rule.
const{db,tx,code}=require('./db'),SC=require('./sched'),{PDFDocument,pipe}=require('./core/pdfkit'),HEAD=require('./head'),QR=require('./core/qr');
const rcode=()=>'RP-'+code().slice(0,4)+'-'+code().slice(0,4);
const METHODS=['cash','momo','om','bank','other'];
// Cumulative rule: a payment counts toward the oldest unpaid term first. Balance through term T = Σ dues up to T − Σ payments.
function rows(sid,{class_id=null,q='',id=null}={}){
 const plan={};for(const p of db.prepare('SELECT class_id,term,amount FROM fee_plan WHERE school_id=?').all(sid))(plan[p.class_id]??=[0,0,0])[p.term-1]=p.amount;
 const paid=Object.fromEntries(db.prepare('SELECT student_id,SUM(amount) a FROM payments WHERE school_id=? AND void=0 GROUP BY student_id').all(sid).map(r=>[r.student_id,r.a])),
 rel={};for(const r of db.prepare('SELECT student_id,term FROM releases WHERE school_id=?').all(sid))(rel[r.student_id]??=new Set()).add(r.term);
 const f='%'+q+'%';
 return db.prepare('SELECT s.id,s.name,s.matricule,s.guardian,s.phone,s.class_id,s.fee_discount disc,c.name cls,COALESCE(c.short,c.name) cs FROM students s JOIN classes c ON c.id=s.class_id WHERE s.school_id=? AND s.active=1 AND (? IS NULL OR s.class_id=?) AND (? IS NULL OR s.id=?) AND (s.name LIKE ? OR s.matricule LIKE ?) ORDER BY c.name,s.name').all(sid,class_id,class_id,id,id,f,f).map(s=>{
  const per=(plan[s.class_id]||[0,0,0]).map(a=>a>0?Math.max(0,a-s.disc):0);let c=0;const due=per.map(x=>c+=x),p=paid[s.id]||0;
  return{...s,per,due,paid:p,bal:due.map(d=>d-p),released:[1,2,3].map(t=>!!rel[s.id]?.has(t))}})}
const status=(r,term)=>r.due[term-1]==0?'nofee':r.bal[term-1]<=0?'paid':r.paid>0?'partial':'unpaid';
// students whose report card must be held back (rule = paid only, balance through that term > 0, not released)
function blocked(sid,cid,term){const out=new Set();if(!(db.prepare('SELECT modules FROM schools WHERE id=?').get(sid).modules||'reports,fees,tracking').includes('fees'))return out;if((db.prepare('SELECT card_rule FROM schools WHERE id=?').get(sid).card_rule||'all')!='paid')return out;
 for(const r of rows(sid,{class_id:cid}))if(r.bal[term-1]>0&&!r.released[term-1])out.add(r.id);return out}
const T={en:{rc:'RECEIPT',no:'No.',date:'Date',st:'Student',mat:'Matricule',cls:'Class',amt:'Amount received',how:'Paid by',ref:'Reference',paid:'Paid so far this year',due:'Total fees this year',rem:'Remaining',by:'Received by',sign:'Signature and stamp',void:'VOID',cash:'Cash',momo:'MTN MoMo',om:'Orange Money',bank:'Bank',other:'Other'},
fr:{rc:'REÇU',no:'N°',date:'Date',st:'Élève',mat:'Matricule',cls:'Classe',amt:'Montant reçu',how:'Payé par',ref:'Référence',paid:'Payé à ce jour cette année',due:'Total des frais de l’année',rem:'Reste à payer',by:'Reçu par',sign:'Signature et cachet',void:'ANNULÉ',cash:'Espèces',momo:'MTN MoMo',om:'Orange Money',bank:'Banque',other:'Autre'}};
const fmt=n=>String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
module.exports=(app,{auth,E,audit,school})=>{
const FE=auth(['principal','secretary']),ADM=auth(['principal']),sid=req=>req.user.school_id,ok=(res,x={})=>res.json({ok:1,...x}),int=(v,a,b)=>Number.isInteger(+v)&&v!==''&&v!==null&&+v>=a&&+v<=b;
const term=req=>[1,2,3].includes(+req.query.term)?+req.query.term:1;
app.get('/api/fees/plan',FE,(req,res)=>{const m={};for(const p of db.prepare('SELECT class_id,term,amount FROM fee_plan WHERE school_id=?').all(sid(req)))(m[p.class_id]??=[0,0,0])[p.term-1]=p.amount;
 res.json({rule:school(req).card_rule||'all',rw:school(req).receipt_w||80,classes:db.prepare('SELECT id,name FROM classes WHERE school_id=? ORDER BY name').all(sid(req)).map(c=>({...c,t:m[c.id]||[0,0,0]}))})});
app.post('/api/fees/plan',ADM,(req,res)=>{const{class_id,amounts}=req.body,ids=req.body.all?db.prepare('SELECT id FROM classes WHERE school_id=?').all(sid(req)).map(c=>c.id):db.prepare('SELECT id FROM classes WHERE id=? AND school_id=?').all(+class_id||0,sid(req)).map(c=>c.id);
 if(!ids.length||!Array.isArray(amounts)||amounts.length!=3||!amounts.every(a=>int(a,0,5000000)))return E(res,400,'invalid');
 tx(()=>{for(const c of ids)amounts.forEach((a,i)=>db.prepare('INSERT OR REPLACE INTO fee_plan(school_id,class_id,term,amount) VALUES(?,?,?,?)').run(sid(req),c,i+1,+a))})();audit(req.user,'fees.plan',ids.length+' classes '+amounts.join('/'));ok(res)});
app.post('/api/fees/rule',ADM,(req,res)=>{if(!['all','paid'].includes(req.body.rule))return E(res,400,'invalid');db.prepare('UPDATE schools SET card_rule=? WHERE id=?').run(req.body.rule,sid(req));audit(req.user,'fees.rule',req.body.rule);ok(res)});
app.get('/api/fees/list',FE,(req,res)=>{const t=term(req),r=rows(sid(req),{class_id:+req.query.class_id||null,q:String(req.query.q||'').slice(0,60)}).map(x=>({id:x.id,name:x.name,matricule:x.matricule,cls:x.cls,cs:x.cs,cid:x.class_id,guardian:x.guardian,phone:x.phone,due:x.due[t-1],paid:x.paid,bal:x.bal[t-1],status:status(x,t),released:x.released[t-1]}));
 const owing=r.filter(x=>x.bal>0);res.json({term:t,rows:r,totals:{due:r.reduce((a,x)=>a+x.due,0),paid:r.reduce((a,x)=>a+Math.min(x.paid,x.due),0),owed:owing.reduce((a,x)=>a+x.bal,0),owing:owing.length,students:r.length}})});
// money collected per month (last n months, voided payments left out)
app.get('/api/fees/trend',FE,(req,res)=>{const n=Math.min(12,Math.max(2,+req.query.n||6)),end=require('./sched').clock(school(req)).date.slice(0,7),ms=[];let y=+end.slice(0,4),m=+end.slice(5,7);for(let i=0;i<n;i++){ms.unshift(y+'-'+String(m).padStart(2,'0'));if(--m<1){m=12;y--}}
 const q=db.prepare("SELECT COALESCE(SUM(amount),0) a FROM payments WHERE school_id=? AND void=0 AND date LIKE ?");res.json({months:ms,amounts:ms.map(k=>q.get(sid(req),k+'%').a)})});
app.get('/api/fees/student',FE,(req,res)=>{const r=rows(sid(req),{id:+req.query.id||0})[0];if(!r)return E(res,404,'invalid');const nm=Object.fromEntries(db.prepare('SELECT id,name FROM users WHERE school_id=?').all(sid(req)).map(u=>[u.id,u.name]));
 res.json({...r,status:[1,2,3].map(t=>status(r,t)),payments:db.prepare('SELECT * FROM payments WHERE student_id=? ORDER BY receipt DESC').all(r.id).map(p=>({id:p.id,receipt:p.receipt,amount:p.amount,date:p.date,method:p.method,ref:p.ref,void:p.void,void_reason:p.void_reason,by:nm[p.by_id]||''}))})});
app.post('/api/fees/pay',FE,(req,res)=>{const{student_id,amount,method,ref=''}=req.body,s=db.prepare('SELECT id FROM students WHERE id=? AND school_id=? AND active=1').get(+student_id||0,sid(req)),today=SC.clock(school(req)).date,date=req.body.date||today;
 if(!s||!int(amount,1,10000000)||!METHODS.includes(method)||String(ref).length>40||!SC.isDate(date)||date>today)return E(res,400,'invalid');
 const out=tx(()=>{const n=db.prepare('SELECT COALESCE(MAX(receipt),0)+1 n FROM payments WHERE school_id=?').get(sid(req)).n;
  let cd;for(;;){cd=rcode();if(!db.prepare('SELECT 1 FROM payments WHERE code=?').get(cd))break}
  const r=db.prepare('INSERT INTO payments(school_id,student_id,amount,date,method,ref,receipt,by_id,at,code) VALUES(?,?,?,?,?,?,?,?,?,?)').run(sid(req),s.id,+amount,date,method,String(ref).trim()||null,n,req.user.id,SC.clock(school(req)).at,cd);return{id:r.lastInsertRowid,receipt:n}})();
 audit(req.user,'fees.pay',`student ${s.id} ${amount} #${out.receipt}`);ok(res,out)});
app.post('/api/fees/void',ADM,(req,res)=>{const reason=String(req.body.reason||'').trim();if(!reason||reason.length>200)return E(res,400,'reason');
 if(!db.prepare('UPDATE payments SET void=1,void_reason=?,void_by=? WHERE id=? AND school_id=? AND void=0').run(reason,req.user.id,+req.body.id||0,sid(req)).changes)return E(res,400,'invalid');audit(req.user,'fees.void',req.body.id+' '+reason);ok(res)});
app.post('/api/fees/discount',ADM,(req,res)=>{if(!int(req.body.amount,0,5000000)||!db.prepare('UPDATE students SET fee_discount=? WHERE id=? AND school_id=?').run(+req.body.amount,+req.body.student_id||0,sid(req)).changes)return E(res,400,'invalid');audit(req.user,'fees.discount',req.body.student_id+' '+req.body.amount);ok(res)});
app.post('/api/fees/release',ADM,(req,res)=>{const{student_id,term,on}=req.body,reason=String(req.body.reason||'').trim();if(![1,2,3].includes(term)||!db.prepare('SELECT 1 FROM students WHERE id=? AND school_id=?').get(+student_id||0,sid(req)))return E(res,400,'invalid');
 if(on){if(!reason)return E(res,400,'reason');db.prepare('INSERT OR REPLACE INTO releases(school_id,student_id,term,by_id,reason,at) VALUES(?,?,?,?,?,?)').run(sid(req),student_id,term,req.user.id,reason.slice(0,200),SC.clock(school(req)).at)}else db.prepare('DELETE FROM releases WHERE student_id=? AND term=?').run(student_id,term);
 audit(req.user,'fees.release',`${student_id} T${term} ${!!on}`);ok(res)});
// ---- POS receipt (80 or 58 mm roll): the data for the print page. A reprint says DUPLICATE; the QR opens the public check page.
const baseOf=req=>process.env.PUBLIC_URL||req.protocol+'://'+req.get('host');
app.post('/api/fees/rwidth',ADM,(req,res)=>{if(![58,80].includes(+req.body.w))return E(res,400,'invalid');db.prepare('UPDATE schools SET receipt_w=? WHERE id=?').run(+req.body.w,sid(req));audit(req.user,'fees.rwidth',String(req.body.w));ok(res)});
app.get('/api/fees/receipt/data',FE,async(req,res,next)=>{try{const p=db.prepare('SELECT p.*,s.name,s.matricule,c.name cls,u.name byname FROM payments p JOIN students s ON s.id=p.student_id JOIN classes c ON c.id=s.class_id LEFT JOIN users u ON u.id=p.by_id WHERE p.id=? AND p.school_id=?').get(+req.query.id||0,sid(req));if(!p)return E(res,404,'invalid');
 const sc=school(req),r=rows(sid(req),{id:p.student_id})[0],url=baseOf(req)+'/verify.html?code='+p.code;
 res.json({no:String(p.receipt).padStart(5,'0'),date:p.date,amount:p.amount,method:p.method,ref:p.ref||'',student:p.name,matricule:p.matricule,cls:p.cls,by:p.byname||'',void:!!p.void,dup:(p.printed||0)>0,
  due:r.due[2],paid:r.paid,rem:Math.max(0,r.due[2]-r.paid),code:p.code,qr:await QR.toDataURL(url,{margin:0,width:220}),head:HEAD(sc).slice(0,3),w:sc.receipt_w||80})}catch(e){next(e)}});
app.post('/api/fees/receipt/printed',FE,(req,res)=>{db.prepare('UPDATE payments SET printed=printed+1 WHERE id=? AND school_id=?').run(+req.body.id||0,sid(req));ok(res)});
app.get('/api/fees/receipt/pdf',FE,async(req,res,next)=>{try{const p=db.prepare('SELECT p.*,s.name,s.matricule,c.name cls,u.name byname FROM payments p JOIN students s ON s.id=p.student_id JOIN classes c ON c.id=s.class_id LEFT JOIN users u ON u.id=p.by_id WHERE p.id=? AND p.school_id=?').get(+req.query.id||0,sid(req));if(!p)return E(res,404,'invalid');
 const l=T[req.query.lang=='fr'?'fr':'en'],sc=school(req),r=rows(sid(req),{id:p.student_id})[0],head=HEAD(sc);
 res.setHeader('Content-Type','application/pdf');res.setHeader('Content-Disposition',`attachment; filename="receipt-${p.receipt}.pdf"`);
 const doc=new PDFDocument({size:'A5',margin:30});pipe(doc,res);doc.font('Helvetica-Bold').fontSize(12).text(head[0],{align:'center'}).font('Helvetica').fontSize(8);head.slice(1,3).forEach(h=>doc.text(h,{align:'center'}));
 doc.moveDown(.8).font('Helvetica-Bold').fontSize(16).text(`${l.rc} ${l.no} ${String(p.receipt).padStart(5,'0')}`,{align:'center'}).font('Helvetica').fontSize(10).moveDown(.8);
 const line=(a,b)=>doc.font('Helvetica').text(a+': ',{continued:true}).font('Helvetica-Bold').text(b);
 line(l.date,p.date);line(l.st,p.name);line(l.mat,p.matricule);line(l.cls,p.cls);doc.moveDown(.5).fontSize(14);line(l.amt,fmt(p.amount)+' FCFA');doc.fontSize(10);line(l.how,l[p.method]+(p.ref?' — '+p.ref:''));doc.moveDown(.5);
 line(l.due,fmt(r.due[2])+' FCFA');line(l.paid,fmt(r.paid)+' FCFA');line(l.rem,fmt(Math.max(0,r.due[2]-r.paid))+' FCFA');doc.moveDown(1.5);line(l.by,p.byname||'');doc.moveDown(2).font('Helvetica').text(l.sign);
 const qb=await QR.toBuffer(baseOf(req)+'/verify.html?code='+p.code,{margin:1,width:200});doc.image(qb,doc.page.width-30-62,doc.page.height-30-62-14,{width:62});doc.font('Helvetica').fontSize(7).fillColor('#444').text(p.code,doc.page.width-30-62,doc.page.height-30-12,{width:62,align:'center'}).fillColor('#000');
 if(p.void){doc.save().rotate(-25,{origin:[200,250]}).fillColor('#c62828').opacity(.25).font('Helvetica-Bold').fontSize(80).text(l.void,40,200).restore()}
 doc.end()}catch(e){next(e)}});
};
module.exports.blocked=blocked;module.exports.rows=rows;
