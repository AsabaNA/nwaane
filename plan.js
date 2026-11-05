// Plan self-service: which modules a school has, adding one (billed on the term invoice), removing one (only with a zero balance, effective at the end of the term).
const{db}=require('./db'),B=require('./billing'),SC=require('./sched');
const MODS=B.MODS;
// route prefix -> modules needed ('any' = at least one of them, 'all' = every one)
const RULES=[
 [/^\/api\/(marks|report|rc|honour|roll|idcards|exams)(\/|$)/,'any',['reports']],
 [/^\/api\/(structure|closed|unavail|timetable|mytimetable|examtt)(\/|$)/,'any',['reports','tracking']],
 [/^\/api\/fees(\/|$)/,'any',['fees']],
 [/^\/api\/(classes\/qr|qr|today|gate|lesson|spot|hours|rates|myhours|staffbadges|tscan|invig)(\/|$)/,'any',['tracking']],
 [/^\/api\/tprofile(\/|$)/,'all',['reports','fees','tracking']]];
const modsOf=sc=>(sc.modules||'reports,fees,tracking').split(',').filter(Boolean);
const need=path=>{const r=RULES.find(x=>x[0].test(path));return r?{mode:r[1],mods:r[2]}:null};
const allowed=(have,n)=>!n||(n.mode=='all'?n.mods.every(m=>have.includes(m)):n.mods.some(m=>have.includes(m)));
const offOf=sc=>{try{return sc.mod_off?JSON.parse(sc.mod_off):{}}catch{return{}}};
// apply removals whose date has passed (the term invoice is drafted first, so the removed module is still billed for that term)
function sweep(sid){const sc=SC.school(sid);if(!sc||!sc.mod_off)return;const off=offOf(sc),ck=SC.clock(sc).date;let due=Object.keys(off).filter(m=>off[m]<ck);if(!due.length)return;
 try{B.draftInvoices(sid)}catch{}
 const have=modsOf(sc).filter(m=>!due.includes(m));if(!have.length)return;
 for(const m of due)delete off[m];db.prepare('UPDATE schools SET modules=?,mod_off=? WHERE id=?').run(have.join(','),Object.keys(off).length?JSON.stringify(off):null,sid)}
const balance=sid=>db.prepare("SELECT * FROM invoices WHERE school_id=? AND status='sent'").all(sid).reduce((a,i)=>a+Math.max(0,B.owing(i)),0);
function overview(sid){sweep(sid);const sc=SC.school(sid),ck=SC.clock(sc),have=modsOf(sc),off=offOf(sc),p=B.priceFor(sc),t=B.termAt(sc,ck.date),pk=B.touchPeak(sid)||B.counts(sid,ck.date),pct=sc.discount_pct||0,
 cur=B.price(have,pk.students,pk.teachers,p,pct).amount,bal=balance(sid);
 const mods=MODS.map(k=>{const on=have.includes(k),next=on?have:[...have,k],add=on?0:B.price(next,pk.students,pk.teachers,p,pct).amount-cur;
  return{k,on,off_on:on&&off[k]?off[k]:null,add_est:add,unit:B.price([k],1,1,p,0).lines[0].unit}});
 return{modules:mods,balance:bal,can_remove:bal<=0&&have.length>1,term_end:t.end,estimate:cur,peak:pk}}
function routes(app,{auth,E,audit}){
 app.get('/api/plan',auth(['principal'],true),(req,res)=>res.json(overview(req.user.school_id)));
 app.post('/api/plan/add',auth(['principal']),(req,res)=>{const sid=req.user.school_id,k=String((req.body||{}).module||'');if(!MODS.includes(k))return E(res,400,'invalid');
  const sc=SC.school(sid),have=modsOf(sc),off=offOf(sc);
  if(have.includes(k)){if(!off[k])return E(res,409,'plan_has');delete off[k];db.prepare('UPDATE schools SET mod_off=? WHERE id=?').run(Object.keys(off).length?JSON.stringify(off):null,sid)}   // un-schedule a removal
  else db.prepare('UPDATE schools SET modules=? WHERE id=?').run(MODS.filter(m=>have.includes(m)||m==k).join(','),sid);
  try{audit(req.user,'plan_add',k)}catch{}res.json(overview(sid))});
 app.post('/api/plan/remove',auth(['principal'],true),(req,res)=>{const sid=req.user.school_id,k=String((req.body||{}).module||'');if(!MODS.includes(k))return E(res,400,'invalid');
  const sc=SC.school(sid),have=modsOf(sc),off=offOf(sc);if(!have.includes(k)||off[k])return E(res,409,'plan_none');
  if(have.filter(m=>!off[m]&&m!=k).length<1)return E(res,409,'plan_last');
  if(balance(sid)>0)return E(res,402,'plan_owing');
  off[k]=B.termAt(sc,SC.clock(sc).date).end;db.prepare('UPDATE schools SET mod_off=? WHERE id=?').run(JSON.stringify(off),sid);
  try{audit(req.user,'plan_remove',k)}catch{}res.json(overview(sid))})}
module.exports={routes,need,allowed,modsOf,sweep,overview,RULES};
