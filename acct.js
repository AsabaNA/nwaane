// Accounting export / import for Sage and Ciel (same file layout for both). Principal only.
// Export: CSV, semicolon-separated, UTF-8 with BOM, dates dd/mm/yyyy, decimal-free FCFA, one line per debit and credit.
// Import: chart of accounts, and opening balances of student accounts (carried-over fees owed).
const {db,tx}=require('./db'),SC=require('./sched'),B=require('./billing'),F=require('./fees');
db.exec(`CREATE TABLE IF NOT EXISTS acct_chart(school_id INTEGER NOT NULL,account TEXT NOT NULL,label TEXT,PRIMARY KEY(school_id,account));`);
try{db.exec('ALTER TABLE schools ADD COLUMN acct_json TEXT')}catch{}
// SYSCOHADA defaults; every account number is editable per school
const DEF={cash:'571000',momo:'571100',om:'571200',bank:'521000',revenue:'706100',receivable:'411000',payroll_exp:'661000',payroll_pay:'422000',sub_exp:'628000',sub_pay:'401000',j_cash:'CA',j_bank:'BQ',j_sales:'VT',j_pay:'OD',j_pur:'AC'};
const KEYS=Object.keys(DEF),cfg=sid=>{let o={};try{o=JSON.parse(db.prepare('SELECT acct_json FROM schools WHERE id=?').get(sid).acct_json||'{}')}catch{}return{...DEF,...o}};
const fmtD=d=>d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(0,4),q=v=>{v=String(v??'');return /[;"\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
const HEAD=['Journal','Date','Piece','Compte','Tiers','Libelle','Debit','Credit'];
const csv=rows=>'﻿'+[HEAD,...rows].map(r=>r.map(q).join(';')).join('\r\n')+'\r\n';
const clean=s=>String(s||'').replace(/[\r\n;]+/g,' ').trim().slice(0,60);
const isD=d=>SC.isDate(d||''),mods=sid=>(db.prepare('SELECT modules FROM schools WHERE id=?').get(sid).modules||'reports,fees,tracking').split(',');
function pair(out,j,date,piece,deb,cred,tiersD,tiersC,lab,amt){if(!(amt>0))return;out.push([j,fmtD(date),piece,deb,tiersD,lab,Math.round(amt),'']);out.push([j,fmtD(date),piece,cred,tiersC,lab,'',Math.round(amt)])}
const BUILD={
 // money received from parents: debit cash/bank, credit the student's account
 payments(u,a){const c=cfg(u.school_id),out=[],rows=db.prepare('SELECT p.*,s.name,s.matricule FROM payments p JOIN students s ON s.id=p.student_id WHERE p.school_id=? AND p.void=0 AND p.date BETWEEN ? AND ? ORDER BY p.date,p.id').all(u.school_id,a.from,a.to);
  for(const p of rows){const acc=c[p.method]||c.cash;pair(out,p.method=='bank'?c.j_bank:c.j_cash,p.date,'R'+p.receipt,acc,c.receivable,'',p.matricule||String(p.student_id),clean('Fees '+p.name),p.amount)}return out},
 // fees charged for a term: debit the student's account, credit revenue
 fees(u,a){const c=cfg(u.school_id),sc=SC.school(u.school_id),t=B.termsOf(sc,+a.year)[a.term-1],out=[],rows=F.rows(u.school_id);
  for(const r of rows){const prev=a.term>1?r.due[a.term-2]:0,amt=r.due[a.term-1]-prev;pair(out,c.j_sales,t.start,'FEE'+a.year+'T'+a.term+'-'+(r.matricule||r.id),c.receivable,c.revenue,r.matricule||String(r.id),'',clean('Fees term '+a.term+' '+r.name),amt)}return out},
 // teacher pay for a month: debit payroll expense, credit staff payable
 pay(u,a){const c=cfg(u.school_id),out=[],ym=a.month,d=SC.monthSummary(u.school_id,ym),last=SC.monthEnd(ym);
  for(const t of d.teachers)pair(out,c.j_pay,last,'PAY'+ym.replace('-','')+'-'+t.id,c.payroll_exp,c.payroll_pay,'',clean(t.name),clean('Teaching hours '+ym+' '+t.name),t.amount);return out},
 // what the school owes the platform: invoices (debit expense, credit supplier) and payments made (debit supplier, credit bank)
 subscription(u,a){const c=cfg(u.school_id),out=[];
  for(const i of db.prepare("SELECT * FROM invoices WHERE school_id=? AND status IN('sent','paid') AND COALESCE(issued,created) BETWEEN ? AND ? ORDER BY id").all(u.school_id,a.from,a.to+'z'))pair(out,c.j_pur,(i.issued||i.created).slice(0,10),i.number||('INV'+i.id),c.sub_exp,c.sub_pay,'','Platform',clean('Platform subscription '+i.year+' T'+i.term),i.amount);
  for(const p of db.prepare('SELECT * FROM bill_payments WHERE school_id=? AND date BETWEEN ? AND ? ORDER BY id').all(u.school_id,a.from,a.to))pair(out,c.j_bank,p.date,p.receipt||('BP'+p.id),c.sub_pay,c.bank,'Platform','','Platform subscription payment',p.amount);return out}};
const NEEDS={payments:'fees',fees:'fees',pay:'tracking',subscription:null};
const parseCsv=text=>{text=String(text||'').replace(/^﻿/,'');const first=text.split(/\r?\n/)[0]||'',sep=(first.match(/;/g)||[]).length>=(first.match(/,/g)||[]).length&&first.includes(';')?';':first.includes('\t')?'\t':first.includes(';')?';':',';
 const rows=[];let cur=[],f='',inq=false;for(let i=0;i<text.length;i++){const ch=text[i];if(inq){if(ch=='"'){if(text[i+1]=='"'){f+='"';i++}else inq=false}else f+=ch}else if(ch=='"')inq=true;else if(ch==sep){cur.push(f);f=''}else if(ch=='\n'||ch=='\r'){if(ch=='\r'&&text[i+1]=='\n')i++;cur.push(f);f='';if(cur.some(x=>x.trim()))rows.push(cur);cur=[]}else f+=ch}
 cur.push(f);if(cur.some(x=>x.trim()))rows.push(cur);return rows.map(r=>r.map(x=>x.trim()))};
const num=v=>{const n=Number(String(v||'0').replace(/[\s ]/g,'').replace(',','.'));return Number.isFinite(n)?n:NaN};
const findCol=(h,names)=>h.findIndex(x=>names.some(n=>x.toLowerCase().replace(/[^a-z]/g,'')==n));
module.exports=(app,{auth,E,audit})=>{
 const ADM=auth(['principal']),sid=r=>r.user.school_id;
 app.get('/api/acct/settings',ADM,(req,res)=>res.json({map:cfg(sid(req)),defaults:DEF,chart:db.prepare('SELECT COUNT(*) n FROM acct_chart WHERE school_id=?').get(sid(req)).n,opening:db.prepare('SELECT COUNT(*) n,COALESCE(SUM(amount),0) s FROM fee_opening WHERE school_id=?').get(sid(req)),modules:mods(sid(req)),
  terms:B.termsOf(SC.school(sid(req)),B.schoolYear(SC.clock(SC.school(sid(req))).date)),today:SC.clock(SC.school(sid(req))).date}));
 app.get('/api/acct/chart',ADM,(req,res)=>res.json(db.prepare('SELECT account,label FROM acct_chart WHERE school_id=? ORDER BY account').all(sid(req))));
 app.post('/api/acct/settings',ADM,(req,res)=>{const m=req.body.map||{},o={},chart=new Set(db.prepare('SELECT account FROM acct_chart WHERE school_id=?').all(sid(req)).map(x=>x.account)),bad=[];
  for(const k of KEYS){const v=String(m[k]??DEF[k]).trim();if(!/^[A-Za-z0-9._-]{1,20}$/.test(v))return E(res,400,'invalid');if(v!=DEF[k])o[k]=v;if(!k.startsWith('j_')&&chart.size&&!chart.has(v))bad.push(k+'='+v)}
  if(bad.length&&!req.body.force)return res.status(409).json({error:'not_in_chart',accounts:bad});
  db.prepare('UPDATE schools SET acct_json=? WHERE id=?').run(JSON.stringify(o),sid(req));audit(req.user,'acct.settings',Object.keys(o).join(','));res.json({ok:1})});
 app.get('/api/acct/export',ADM,(req,res)=>{const u=req.user,k=String(req.query.kind||''),a={from:String(req.query.from||''),to:String(req.query.to||''),term:+req.query.term,year:+req.query.year,month:String(req.query.month||'')};
  if(!BUILD[k])return E(res,400,'invalid');if(NEEDS[k]&&!mods(sid(req)).includes(NEEDS[k]))return E(res,403,'module');
  if(B.lockedOut(u.school_id))return E(res,402,'locked');
  if(k=='payments'||k=='subscription'){if(!isD(a.from)||!isD(a.to)||a.from>a.to)return E(res,400,'invalid')}
  if(k=='fees'&&!([1,2,3].includes(a.term)&&a.year>=2000&&a.year<=2100))return E(res,400,'invalid');
  if(k=='pay'&&!/^\d{4}-(0[1-9]|1[0-2])$/.test(a.month))return E(res,400,'invalid');
  const rows=BUILD[k](u,a),name=`${k}-${a.month||(a.term?a.year+'-T'+a.term:a.from+'_'+a.to)}.csv`;audit(u,'acct.export',k+' '+rows.length/2);
  res.set('Content-Type','text/csv; charset=utf-8').set('Content-Disposition',`attachment; filename="${name}"`).set('X-Entries',String(rows.length/2)).send(csv(rows))});
 // import: kind chart (account;label) or opening (matricule;balance, or Sage trial-balance style Compte;Tiers;Debit;Credit). dry=1 only reports.
 app.post('/api/acct/import',ADM,(req,res)=>{const s=sid(req),kind=req.body.kind,rows=parseCsv(req.body.csv);if(!['chart','opening'].includes(kind)||rows.length<1||rows.length>20000)return E(res,400,'invalid');
  const h=rows[0].map(x=>x.toLowerCase()),hasH=h.some(x=>/compte|account|tiers|matricule|debit|libelle|label/.test(x)),body=hasH?rows.slice(1):rows;
  if(kind=='chart'){const ca=hasH?Math.max(0,findCol(h,['compte','account','numero','numro','numerodecompte'])):0,cl=hasH?findCol(h,['libelle','libell','label','intitule','intitul','name','nom']):1,items=[],bad=[];
   for(const r of body){const a=(r[ca]||'').trim(),l=cl>=0?(r[cl]||''):(r[1]||'');if(!a)continue;if(!/^[A-Za-z0-9._-]{1,20}$/.test(a)){bad.push(a.slice(0,20));continue}items.push([a,l.slice(0,80)])}
   if(!req.body.dry){tx(()=>{db.prepare('DELETE FROM acct_chart WHERE school_id=?').run(s);for(const [a,l] of items)db.prepare('INSERT OR REPLACE INTO acct_chart(school_id,account,label) VALUES(?,?,?)').run(s,a,l)})();audit(req.user,'acct.import.chart',String(items.length))}
   return res.json({ok:1,dry:!!req.body.dry,accounts:items.length,skipped:bad.length,sample:items.slice(0,5)})}
  // opening balances of student accounts
  const ct=hasH?findCol(h,['tiers','matricule','auxiliaire','client','compteauxiliaire']):0,cd=hasH?findCol(h,['debit','dbit','debitor']):-1,cc=hasH?findCol(h,['credit','crdit']):-1,cb=hasH?findCol(h,['solde','balance','montant','amount']):1,cacc=hasH?findCol(h,['compte','account']):-1,rc=cfg(s).receivable;
  if(ct<0||(cd<0&&cc<0&&cb<0)||(!hasH&&!Number.isFinite(num(rows[0][1]))))return E(res,400,'columns');
  const stu=db.prepare('SELECT id,name,matricule FROM students WHERE school_id=? AND active=1').all(s),by=new Map(stu.map(x=>[String(x.matricule||'').trim().toLowerCase(),x]));
  const ok=[],unmatched=[],skipped=[],credit=[];
  for(const r of body){const t=(r[ct]||'').trim();if(!t)continue;if(cacc>=0&&r[cacc]&&!String(r[cacc]).startsWith(rc.slice(0,3))){skipped.push(t);continue}
   const bal=cd>=0||cc>=0?(num(r[cd])||0)-(num(r[cc])||0):num(r[cb]);if(!Number.isFinite(bal)){skipped.push(t);continue}
   const st=by.get(t.toLowerCase());if(!st){unmatched.push(t);continue}if(bal<0){credit.push({name:st.name,matricule:st.matricule,amount:-bal});continue}ok.push({id:st.id,name:st.name,matricule:st.matricule,amount:Math.round(bal)})}
  if(!req.body.dry){tx(()=>{for(const x of ok){if(x.amount>0)db.prepare('INSERT OR REPLACE INTO fee_opening(school_id,student_id,amount,at) VALUES(?,?,?,?)').run(s,x.id,x.amount,new Date().toISOString());else db.prepare('DELETE FROM fee_opening WHERE student_id=?').run(x.id)}})();audit(req.user,'acct.import.opening',ok.length+' students '+ok.reduce((a,x)=>a+x.amount,0))}
  res.json({ok:1,dry:!!req.body.dry,students:ok.length,total:ok.reduce((a,x)=>a+x.amount,0),unmatched:unmatched.length,unmatched_sample:unmatched.slice(0,10),skipped:skipped.length,credits_ignored:credit.length,credits_sample:credit.slice(0,5),sample:ok.slice(0,5)})});
 app.post('/api/acct/opening/clear',ADM,(req,res)=>{db.prepare('DELETE FROM fee_opening WHERE school_id=?').run(sid(req));audit(req.user,'acct.opening.clear','');res.json({ok:1})})};
module.exports.BUILD=BUILD;module.exports.DEF=DEF;
