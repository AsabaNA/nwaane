// Phase 6a — plans, free term, running estimate, invoices (drafts), overdue check.
const{db,tx}=require('./db'),SC=require('./sched');
const MODS=['reports','fees','tracking'];
const today=()=>new Date().toISOString().slice(0,10);
// list prices on a date: base prices overlaid by scheduled changes (they only start from the next term)
const P=(on=today())=>{const p=Object.fromEntries(db.prepare('SELECT key,value FROM prices').all().map(r=>[r.key,r.value]));
 for(const r of db.prepare('SELECT key,value FROM price_plan WHERE eff<=? ORDER BY eff').all(on))p[r.key]=r.value;return p};
// a school's prices: a founding-school lock freezes the list it was given
const priceFor=(sc,on)=>{if(sc.price_lock_until&&sc.locked_prices&&(on||today())<=sc.price_lock_until)try{return JSON.parse(sc.locked_prices)}catch{}return P(on)};
const addDays=(d,n)=>SC.addDays(d,n),dstr=(y,m,d)=>`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
// ---- school calendar: three terms per school year; default dates are editable per school
const schoolYear=date=>{const y=+date.slice(0,4);return +date.slice(5,7)>=8?y:y-1};
const defaultTerms=y=>[[dstr(y,9,1),dstr(y,12,20)],[dstr(y+1,1,5),dstr(y+1,3,31)],[dstr(y+1,4,6),dstr(y+1,6,30)]];
function termsOf(sc,y){let o=null;try{o=sc.term_dates?JSON.parse(sc.term_dates):null}catch{}
 const d=defaultTerms(y);return[1,2,3].map(i=>{const t=o&&o[y]&&o[y][i-1];return{year:y,term:i,start:t?t[0]:d[i-1][0],end:t?t[1]:d[i-1][1]}})}
const allTerms=(sc,y)=>[...termsOf(sc,y-1),...termsOf(sc,y),...termsOf(sc,y+1)];
// the term containing date; in a gap between terms, the next one (current:false)
function termAt(sc,date){const y=schoolYear(date),L=allTerms(sc,y);
 const c=L.find(t=>t.start<=date&&date<=t.end);if(c)return{...c,current:true};
 const n=L.find(t=>t.start>date);return{...n,current:false}}
const nextTerm=(sc,t)=>{const L=allTerms(sc,t.year),i=L.findIndex(x=>x.year==t.year&&x.term==t.term);return L[i+1]}
const days=(a,b)=>Math.round((Date.parse(b+'T12:00:00Z')-Date.parse(a+'T12:00:00Z'))/864e5);
// free term: the rest of the term of signup; if fewer than 4 weeks remain, the next term too
function freeUntil(sc,signup){const t=termAt(sc,signup);let end=t.end;if(t.current&&days(signup,t.end)<28)end=nextTerm(sc,t).end;return end}
// ---- price ladder: one module = solo price, two = pair price (~12% off), all three (Complete) = bundle price
function price(modules,students,teachers,p=P(),pct=0){const M=MODS.filter(m=>modules.includes(m)),sfx=M.length>=3?'bundle':M.length==2?'pair':'solo',u=(m)=>p[m+'_'+sfx]??p[m+'_solo'],lines=[];
 if(M.includes('reports'))lines.push({k:'reports',qty:students,unit:u('reports'),per:'student'});
 if(M.includes('fees'))lines.push({k:'fees',qty:students,unit:u('fees'),per:'student'});
 if(M.includes('tracking'))lines.push({k:'tracking',qty:teachers,unit:u('tracking'),per:'teacher'});
 lines.forEach(l=>l.amount=l.qty*l.unit);let gross=lines.reduce((a,l)=>a+l.amount,0);
 if(gross>0&&gross<p.min_term){lines.push({k:'min',qty:1,unit:p.min_term-gross,per:'minimum',amount:p.min_term-gross});gross=p.min_term}
 const discount=Math.round(gross*pct/100);return{lines,gross,discount,amount:gross-discount}}
// ---- usage peaks (highest counts reached during the term)
function counts(sid,date){const students=db.prepare('SELECT COUNT(*) n FROM students WHERE school_id=? AND active=1').get(sid).n,
 teachers=db.prepare("SELECT COUNT(DISTINCT s.teacher_id) n FROM slots s JOIN users u ON u.id=s.teacher_id AND u.active=1 WHERE s.school_id=? AND s.teacher_id IS NOT NULL AND s.from_date<=? AND (s.to_date IS NULL OR s.to_date>=?)").get(sid,date,date).n;return{students,teachers}}
function touchPeak(sid){const sc=SC.school(sid),ck=SC.clock(sc),t=termAt(sc,ck.date),c=counts(sid,ck.date);if(!t.current)return null;
 db.prepare('INSERT INTO usage_peak(school_id,year,term,students,teachers) VALUES(?,?,?,?,?) ON CONFLICT(school_id,year,term) DO UPDATE SET students=MAX(students,excluded.students),teachers=MAX(teachers,excluded.teachers)').run(sid,t.year,t.term,c.students,c.teachers);
 return db.prepare('SELECT students,teachers FROM usage_peak WHERE school_id=? AND year=? AND term=?').get(sid,t.year,t.term)}
const touchAll=()=>{for(const s of db.prepare('SELECT id FROM schools').all())try{touchPeak(s.id);draftInvoices(s.id)}catch(e){console.error('billing',e.message)}};
// ---- invoices
const T3_EARLY=14;
const invNo=(sid,y,t)=>`INV-${y}-T${t}-${String(sid).padStart(4,'0')}`;
function draftInvoices(sid){const sc=SC.school(sid),ck=SC.clock(sc),p=priceFor(sc),made=[],fu=sc.trial_ends?sc.trial_ends.slice(0,10):'',created=sc.created?sc.created.slice(0,10):'';
 for(const t of allTerms(sc,schoolYear(ck.date))){
  if(t.end>=ck.date&&!(t.term==3&&ck.date>=addDays(t.end,-T3_EARLY)))continue;   // term not finished (Term 3 is invoiced 14 days early: schools close for the holidays)
  if(t.end<=fu||t.end<created)continue;              // covered by the free term or before the school existed
  if(db.prepare('SELECT 1 FROM invoices WHERE school_id=? AND year=? AND term=?').get(sid,t.year,t.term))continue;
  const pk=db.prepare('SELECT students,teachers FROM usage_peak WHERE school_id=? AND year=? AND term=?').get(sid,t.year,t.term);
  if(!pk)continue;                                   // no usage recorded that term: nothing to invoice
  const RF=require('./referral'),rf=RF.applies(sc,t.start),pr=price((sc.modules||'reports,fees,tracking').split(','),pk.students,pk.teachers,p,Math.max(sc.discount_pct||0,rf?RF.PCT:0));
  if(pr.amount<=0)continue;
  db.prepare("INSERT INTO invoices(school_id,year,term,number,modules,students,teachers,lines,gross,discount,amount,status,created,ref_pct) VALUES(?,?,?,?,?,?,?,?,?,?,?,'draft',?,?)").run(sid,t.year,t.term,invNo(sid,t.year,t.term),sc.modules||'reports,fees,tracking',pk.students,pk.teachers,JSON.stringify(pr.lines),pr.gross,pr.discount,pr.amount,ck.date,rf?RF.PCT:0);made.push(t)}
 return made}
const paidOf=id=>db.prepare('SELECT COALESCE(SUM(amount),0) a FROM bill_payments WHERE invoice_id=?').get(id).a;
const creditOf=id=>db.prepare('SELECT COALESCE(SUM(amount),0) a FROM credit_notes WHERE invoice_id=?').get(id).a;
function sendInvoice(id,by,date){const i=db.prepare('SELECT * FROM invoices WHERE id=?').get(id);if(!i||i.status!='draft')return null;const sc=SC.school(i.school_id),p=priceFor(sc);
 let due=addDays(date,p.due_days);if(i.term==3){const e=termsOf(sc,i.year)[2].end;if(e>date)due=e}   // Term 3: due at term end
 db.prepare("UPDATE invoices SET status='sent',issued=?,due=? WHERE id=?").run(date,due,id);return db.prepare('SELECT * FROM invoices WHERE id=?').get(id)}
function recordPayment(id,{amount,date,method='',ref='',by=''}){const i=db.prepare('SELECT * FROM invoices WHERE id=?').get(id);if(!i||i.status=='draft'||i.status=='void')return null;
 const n=db.prepare('SELECT COUNT(*)+1 n FROM bill_payments').get().n,pid=db.prepare('INSERT INTO bill_payments(school_id,invoice_id,amount,date,method,ref,receipt,by_name,at) VALUES(?,?,?,?,?,?,?,?,?)').run(i.school_id,id,amount,date,method,ref,'REC-'+String(n).padStart(5,'0'),by,new Date().toISOString()).lastInsertRowid;
 try{require('./referral').earn(pid)}catch(e){console.error('referral',e.message)}
 if(paidOf(id)+creditOf(id)>=i.amount)db.prepare("UPDATE invoices SET status='paid' WHERE id=?").run(id);return db.prepare('SELECT * FROM invoices WHERE id=?').get(id)}
// ---- commitment fee: schools that register after Term 1 pay it before they can use the platform (term 0 = not a school term)
function feeNeeded(sc,date){return termAt(sc,date).term>=2}
function feeInvoice(sid){const sc=SC.school(sid),ck=SC.clock(sc),p=priceFor(sc),a=p.commit_fee??5000;if(!a||!feeNeeded(sc,ck.date))return null;const y=schoolYear(ck.date);
 if(db.prepare('SELECT 1 FROM invoices WHERE school_id=? AND term=0').get(sid))return null;
 db.prepare("INSERT INTO invoices(school_id,year,term,number,modules,students,teachers,lines,gross,discount,amount,status,created,issued,due) VALUES(?,?,0,?,?,0,0,?,?,0,?,'sent',?,?,?)").run(sid,y,'FEE-'+String(sid).padStart(4,'0'),'',JSON.stringify([{k:'commit',qty:1,unit:a,per:'fee',amount:a}]),a,a,ck.date,ck.date,ck.date);return a}
const owing=i=>i.amount-paidOf(i.id)-creditOf(i.id);
// ---- status: free term / active / invoice due / read-only (a sent invoice unpaid 14 days after its due date)
function status(sid){const r=status0(sid);if(r.state!='pending'&&r.state!='free'&&lockedOut(sid))r.locked=true;return r}
// Term 3 outputs (file downloads, statistics) stay locked from the moment the Term 3 invoice is sent until it is paid in full
const lockedOut=sid=>db.prepare("SELECT * FROM invoices WHERE school_id=? AND term=3 AND status='sent'").all(sid).some(i=>owing(i)>0);
function status0(sid){const sc=SC.school(sid),ck=SC.clock(sc),p=priceFor(sc),inv=db.prepare("SELECT * FROM invoices WHERE school_id=? AND status='sent' AND term>0 ORDER BY due").all(sid).filter(i=>owing(i)>0);
 if(sc.flag=='readonly'||sc.flag=='cancelled')return{state:'readonly',manual:true,flag:sc.flag};
 const fee=db.prepare("SELECT * FROM invoices WHERE school_id=? AND term=0 AND status='sent'").all(sid).find(i=>owing(i)>0);if(fee)return{state:'pending',invoice:fee,owing:owing(fee),fee:true};
 const od=inv.find(i=>days(i.due,ck.date)>p.grace_days);if(od)return{state:'readonly',invoice:od,owing:owing(od),days:days(od.due,ck.date)};
 const due=inv[0];if(due)return{state:days(due.due,ck.date)>0?'overdue':'due',invoice:due,owing:owing(due),days:days(due.due,ck.date)};
 const fu=(sc.trial_ends||'').slice(0,10);if(fu&&ck.date<=fu)return{state:'free',until:fu,left:days(ck.date,fu)};return{state:'active'}}
const isReadonly=sid=>status(sid).state=='readonly';
// what blocks changes: 'pending' (commitment fee unpaid), 'readonly' (invoice overdue) or ''
const gate=sid=>{const s=status(sid).state;return s=='pending'||s=='readonly'?s:''};
function overview(sid){const sc=SC.school(sid),ck=SC.clock(sc),p=priceFor(sc),t=termAt(sc,ck.date),pk=touchPeak(sid)||{students:0,teachers:0},mods=(sc.modules||'reports,fees,tracking').split(','),
 est=price(mods,pk.students,pk.teachers,p,Math.max(sc.discount_pct||0,require('./referral').applies(sc,t.start)?require('./referral').PCT:0)),st=status(sid),fu=(sc.trial_ends||'').slice(0,10),free=t.current&&t.end<=fu;
 const inv=db.prepare("SELECT * FROM invoices WHERE school_id=? AND status!='draft' ORDER BY year DESC,term DESC").all(sid).map(i=>({id:i.id,number:i.number,year:i.year,term:i.term,amount:i.amount,status:i.status,issued:i.issued,due:i.due,paid:paidOf(i.id),owing:i.status=='void'?0:owing(i),students:i.students,teachers:i.teachers,lines:JSON.parse(i.lines||'[]'),discount:i.discount,receipts:db.prepare('SELECT id,receipt,amount,date,method,ref FROM bill_payments WHERE invoice_id=? ORDER BY id').all(i.id)}));
 return{today:ck.date,term:{year:t.year,term:t.term,start:t.start,end:t.end,current:t.current},terms:termsOf(sc,t.year),modules:mods,peak:pk,now:counts(sid,ck.date),estimate:{...est,free},status:st,free_until:fu,discount_pct:sc.discount_pct||0,prices:p,invoices:inv}}
module.exports={feeInvoice,lockedOut,gate,MODS,P,priceFor,price,termAt,termsOf,schoolYear,freeUntil,touchPeak,touchAll,draftInvoices,sendInvoice,recordPayment,status,isReadonly,overview,counts,paidOf,owing,days,defaultTerms};
