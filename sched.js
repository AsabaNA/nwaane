// Phase 4 core: school clock, day structure, effective-dated timetable, lessons, monthly hours.
const{db,tx}=require('./db'),pad=n=>String(n).padStart(2,'0');
const DEFAULT_BLOCKS=[['period',40],['period',40],['period',40],['break',20,'Break'],['period',40],['period',40],['period',40],['break',40,'Lunch'],['period',40],['period',40]].map(([kind,minutes,label])=>({kind,minutes,label:label||null}));
const toMin=h=>{const m=/^(\d{1,2}):(\d{2})$/.exec(h||'');return m?+m[1]*60+ +m[2]:450},hh=m=>pad(Math.floor(m/60))+':'+pad(m%60);
const addDays=(d,n)=>new Date(Date.parse(d+'T00:00:00Z')+n*864e5).toISOString().slice(0,10);
const dow=d=>new Date(d+'T00:00:00Z').getUTCDay()||7,isDate=d=>/^\d{4}-\d{2}-\d{2}$/.test(d||'')&&!isNaN(Date.parse(d+'T00:00:00Z'))&&addDays(d,0)==d;
const monthEnd=ym=>{const[y,m]=ym.split('-').map(Number);return new Date(Date.UTC(y,m,0)).toISOString().slice(0,10)};
const mk=(y,m,d,h,mi)=>{const date=`${y}-${pad(m)}-${pad(d)}`;return{date,min:h*60+mi,hhmm:`${pad(h)}:${pad(mi)}`,dow:dow(date),at:`${date}T${pad(h)}:${pad(mi)}`}};
// "Now" in the school's own time zone. The demo school may run on a set clock (so it can be tried outside school hours).
function clock(sc){
 if(sc.demo&&sc.demo_fake){const d=new Date(Date.parse(sc.demo_fake+':00Z')+(Date.now()-Date.parse(sc.demo_real)));return mk(d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate(),d.getUTCHours(),d.getUTCMinutes())}
 const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:sc.tz||'Africa/Douala',hourCycle:'h23',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).formatToParts(new Date()).map(x=>[x.type,x.value]));
 return mk(+p.year,+p.month,+p.day,+p.hour%24,+p.minute)}
const school=sid=>db.prepare('SELECT * FROM schools WHERE id=?').get(sid);
const blocksOf=sid=>{const b=db.prepare('SELECT kind,minutes,label FROM blocks WHERE school_id=? ORDER BY pos').all(sid);return b.length?b:DEFAULT_BLOCKS};
function layout(sid,sc=school(sid)){let t=toMin(sc.day_start),n=0;const periods=[],breaks=[];
 for(const b of blocksOf(sid)){if(b.kind=='period')periods.push({n:++n,start:t,end:t+b.minutes,s:hh(t),e:hh(t+b.minutes)});else breaks.push({start:t,end:t+b.minutes,s:hh(t),e:hh(t+b.minutes),label:b.label});t+=b.minutes}
 return{periods,breaks,days:(sc.days||'1,2,3,4,5').split(',').map(Number)}}
const closedLabel=(sid,date)=>db.prepare('SELECT label FROM closed WHERE school_id=? AND date=?').get(sid,date);
const schoolDay=(sid,sc,date)=>layout(sid,sc).days.includes(dow(date))&&!closedLabel(sid,date);
const ymOf=d=>d.slice(0,7);
const HOOK={ensure:null,month:null};   // set by examtt.js (exam suspension and invigilation pay) without a circular require
const lockedMonth=(sid,date)=>!!db.prepare('SELECT 1 FROM months WHERE school_id=? AND ym=?').get(sid,ymOf(date));
const lockedFrom=(sid,date)=>!!db.prepare('SELECT 1 FROM months WHERE school_id=? AND ym>=?').get(sid,ymOf(date));
// Lessons for a date are created from the timetable that was valid on that date (never rewritten afterwards).
function ensure(sid,date,sc=school(sid)){if(!schoolDay(sid,sc,date))return;
 db.prepare('INSERT OR IGNORE INTO lessons(school_id,class_id,date,period,subject_id,sched_id) SELECT school_id,class_id,?,period,subject_id,teacher_id FROM slots WHERE school_id=? AND day=? AND from_date<=? AND (to_date IS NULL OR to_date>=?)').run(date,sid,dow(date),date,date);HOOK.ensure&&HOOK.ensure(sid,date)}
const effSql="s.from_date<=? AND (s.to_date IS NULL OR s.to_date>=?)";
const slotsOn=(sid,date,w='',...a)=>db.prepare(`SELECT s.*,c.name cls,b.name subject,u.name teacher FROM slots s JOIN classes c ON c.id=s.class_id JOIN subjects b ON b.id=s.subject_id LEFT JOIN users u ON u.id=s.teacher_id WHERE s.school_id=? AND ${effSql} ${w} ORDER BY s.day,s.period`).all(sid,date,date,...a);
const busyWith=(sid,tid,day,period,from,exceptClass)=>db.prepare('SELECT c.name cls FROM slots s JOIN classes c ON c.id=s.class_id WHERE s.school_id=? AND s.teacher_id=? AND s.day=? AND s.period=? AND s.class_id!=? AND (s.to_date IS NULL OR s.to_date>=?)').all(sid,tid,day,period,exceptClass,from);
const unavailable=(tid,day,period)=>!!db.prepare('SELECT 1 FROM unavail WHERE teacher_id=? AND day=? AND period=?').get(tid,day,period);
// Put (or clear) one timetable cell "from this date onward".
function applySlot(sid,cid,day,period,subjectId,teacherId,from,kind){
 tx(()=>{db.prepare('UPDATE slots SET to_date=? WHERE class_id=? AND day=? AND period=? AND from_date<? AND (to_date IS NULL OR to_date>=?)').run(addDays(from,-1),cid,day,period,from,from);
  db.prepare('DELETE FROM slots WHERE class_id=? AND day=? AND period=? AND from_date>=?').run(cid,day,period,from);
  if(subjectId)db.prepare('INSERT INTO slots(school_id,class_id,day,period,subject_id,teacher_id,from_date,kind) VALUES(?,?,?,?,?,?,?,?)').run(sid,cid,day,period,subjectId,teacherId||null,from,kind?1:0);
  db.prepare("DELETE FROM lessons WHERE class_id=? AND period=? AND date>=? AND CAST(strftime('%w',date) AS INT)%7=?%7 AND status IN('pending','suspended') AND via IS NULL AND flag IS NULL AND spot IS NULL AND actual_id IS NULL").run(cid,period,from,day)})()}
// Change who teaches a subject in the timetable from a date; returns clashes it creates.
function reassign(sid,subjectId,teacherId,from){const out=[];
 // only the main teacher's theory lessons: co-teachers and practical sessions keep their own teacher
 for(const s of db.prepare('SELECT * FROM slots WHERE subject_id=? AND kind=0 AND (to_date IS NULL OR to_date>=?) AND (teacher_id IS NULL OR teacher_id NOT IN(SELECT teacher_id FROM subject_teachers WHERE subject_id=?))').all(subjectId,from,subjectId)){
  if(s.from_date>=from)db.prepare('UPDATE slots SET teacher_id=? WHERE id=?').run(teacherId||null,s.id);else applySlot(sid,s.class_id,s.day,s.period,subjectId,teacherId,from);
  if(teacherId)for(const b of busyWith(sid,teacherId,s.day,s.period,from,s.class_id))out.push({day:s.day,period:s.period,cls:b.cls})}
 return out}
function clashes(sid,date){
 const a=db.prepare(`SELECT s.teacher_id,u.name teacher,s.day,s.period,GROUP_CONCAT(c.name,', ') classes FROM slots s JOIN classes c ON c.id=s.class_id JOIN users u ON u.id=s.teacher_id WHERE s.school_id=? AND ${effSql} GROUP BY s.teacher_id,s.day,s.period HAVING COUNT(*)>1`).all(sid,date,date).map(x=>({kind:'clash',...x})),
 b=db.prepare(`SELECT s.teacher_id,u.name teacher,s.day,s.period,c.name classes FROM slots s JOIN classes c ON c.id=s.class_id JOIN users u ON u.id=s.teacher_id JOIN unavail v ON v.teacher_id=s.teacher_id AND v.day=s.day AND v.period=s.period WHERE s.school_id=? AND ${effSql}`).all(sid,date,date).map(x=>({kind:'unavail',...x}));
 return[...a,...b]}
// --- rates (effective-dated, FCFA per period)
const ratesOf=sid=>{const m={};for(const r of db.prepare('SELECT teacher_id,from_date,amount FROM rates WHERE school_id=? ORDER BY from_date').all(sid))(m[r.teacher_id]??=[]).push(r);return m};
const rateAt=(m,tid,date)=>{let a=0;for(const r of m[tid]||[])if(r.from_date<=date)a=r.amount;return a};
const names=sid=>Object.fromEntries(db.prepare('SELECT id,name FROM users WHERE school_id=?').all(sid).map(u=>[u.id,u.name]));
// --- period helpers
const ended=(L,ck,date,per)=>date<ck.date||(date==ck.date&&per.end<=ck.min);
// --- monthly hours
function monthData(sid,ym){const sc=school(sid),ck=clock(sc),lay=layout(sid,sc),last=monthEnd(ym),stop=last<ck.date?last:ck.date,nm=names(sid),rt=ratesOf(sid);
 for(let d=ym+'-01';d<=stop;d=addDays(d,1))ensure(sid,d,sc);
 const T={},get=id=>T[id]??={id,name:nm[id]||'?',sched:0,present:0,late:0,absent:0,out:0,in:0,unconf:0,pendingRep:0,paid:0,amount:0},ex=[];
 for(const L of db.prepare('SELECT l.*,c.name cls,b.name subject FROM lessons l JOIN classes c ON c.id=l.class_id JOIN subjects b ON b.id=l.subject_id WHERE l.school_id=? AND l.date BETWEEN ? AND ? ORDER BY l.date,l.period').all(sid,ym+'-01',last)){
  const per=lay.periods[L.period-1];if(!per)continue;const e=ended(L,ck,L.date,per),pay=(id)=>{const t=get(id);t.paid++;t.amount+=rateAt(rt,id,L.date)},row=k=>ex.push({kind:k,id:L.id,date:L.date,period:L.period,cls:L.cls,subject:L.subject,sched:nm[L.sched_id]||'—',actual:nm[L.actual_id]||'',status:L.status,flag:L.flag,reason:L.reason});
  if(L.sched_id)get(L.sched_id).sched++;
  if(L.status=='present'||L.status=='late'){const t=get(L.sched_id||L.actual_id);t[L.status]++;pay(L.sched_id||L.actual_id)}
  else if(L.status=='absent'&&L.sched_id)get(L.sched_id).absent++;
  else if(L.status=='replaced'){if(L.appr==1){if(L.sched_id)get(L.sched_id).out++;get(L.actual_id).in++;pay(L.actual_id)}else{if(L.sched_id)get(L.sched_id).pendingRep++;get(L.actual_id).pendingRep++;row('replacement')}}
  else if(L.status=='pending'&&e){if(L.sched_id)get(L.sched_id).unconf++;row('unconfirmed')}
  if(L.spot_res=='notseen'&&L.flag=='spot')row('spot');else if(L.flag=='backfill')row('backfill')}
 for(const g of db.prepare("SELECT g.*,u.name FROM gate g JOIN users u ON u.id=g.user_id WHERE g.school_id=? AND g.date BETWEEN ? AND ? AND g.flag='backfill'").all(sid,ym+'-01',last))ex.push({kind:'backfill',gate:1,date:g.date,sched:g.name,reason:g.reason,id:g.id});
 HOOK.month&&HOOK.month({sid,sc,ym,last,ck,lay,nm,rt,get,ex});
 return{ym,locked:lockedMonth(sid,ym+'-01'),ended:last<ck.date,teachers:Object.values(T).sort((a,b)=>a.name.localeCompare(b.name)),exceptions:ex}}
function monthSummary(sid,ym){const row=db.prepare('SELECT snap,at FROM months WHERE school_id=? AND ym=?').get(sid,ym);
 if(row){const s=JSON.parse(row.snap);return{...s,locked:true,approved_at:row.at}}return monthData(sid,ym)}
module.exports={HOOK,DEFAULT_BLOCKS,toMin,hh,addDays,dow,isDate,monthEnd,clock,school,blocksOf,layout,closedLabel,schoolDay,ymOf,lockedMonth,lockedFrom,ensure,slotsOn,busyWith,unavailable,applySlot,reassign,clashes,ratesOf,rateAt,names,ended,monthData,monthSummary};
