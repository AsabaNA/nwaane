// Exam timetable: generator and editor. Papers sit between the school's fixed breaks, on the bell by default; a subject is written once, on one day.
// Classes in a group write their shared subjects together. Invigilators: the subject teacher or an automatically chosen teacher (or "Other", set by hand).
const{db,tx}=require('./db'),SC=require('./sched'),SECT=require('./sections'),R=require('./report');
const key=s=>String(s||'').trim().toLowerCase();
const MINDUR=15,MAXDUR=300,DAYS_MAX=31;
const blocksFor=(lay,ds,de)=>{let cur=ds;const out=[];for(const b of lay.breaks.filter(b=>b.end>ds&&b.start<de).sort((a,b)=>a.start-b.start)){if(b.start>cur)out.push([cur,b.start]);cur=Math.max(cur,b.end)}if(cur<de)out.push([cur,de]);return out};
// a paper sits between breaks; one longer than any gap (a 3 hour paper) may run through the break instead
const fitsDay=(bl,s,d)=>bl.some(b=>b[0]<=s&&s+d<=b[1])||(bl.length>0&&d>Math.max(...bl.map(b=>b[1]-b[0]))&&s>=bl[0][0]&&s+d<=bl[bl.length-1][1]);
const ov=(a,b,c,d)=>a<d&&c<b;
// ---- context shared by generate, repack, check and invigilator assignment
// an exam day is the school's own day by default; a timetable may carry its own day (cfg.day = {start, blocks:[{kind:'period'|'break',minutes,label}]})
function dayOf(tt){let d=tt.day;if(!d&&tt.cfg){try{d=(typeof tt.cfg=='string'?JSON.parse(tt.cfg):tt.cfg).day}catch(e){}}return d&&Array.isArray(d.blocks)&&d.blocks.length?d:null}
function dayLayout(d){let t=d.start;const periods=[],breaks=[];for(const b of d.blocks){if(b.kind=='period')periods.push({n:periods.length+1,start:t,end:t+b.minutes,s:SC.hh(t),e:SC.hh(t+b.minutes)});else breaks.push({start:t,end:t+b.minutes,s:SC.hh(t),e:SC.hh(t+b.minutes),label:b.label||null});t+=b.minutes}return{periods,breaks,end:t}}
function context(sid,tt){const sc=SC.school(sid),lay=SC.layout(sid,sc),ds=tt.day_start,de=tt.day_end,dd=dayOf(tt),xl=dd?dayLayout(dd):lay,bl=blocksFor(xl,ds,de);
 const un=new Set(db.prepare('SELECT teacher_id||\':\'||day||\':\'||period k FROM unavail WHERE school_id=?').all(sid).map(r=>r.k));
 const secOf=Object.fromEntries(db.prepare('SELECT id,section_id FROM classes WHERE school_id=?').all(sid).map(c=>[c.id,c.section_id]));
 const teachers=db.prepare("SELECT id,name FROM users WHERE school_id=? AND role='teacher' AND active=1 ORDER BY name").all(sid).map(u=>({...u,sec:SECT.ofUser(sid,u.id)}));
 return{sid,sc,lay,xl,tt,ds,de,bl,un,secOf,teachers,slotCache:{},multi:SECT.ensure(sid).length>1}}
const periodsOver=(cx,s,e)=>cx.lay.periods.filter(p=>ov(p.start,p.end,s,e));
const unavailAt=(cx,t,date,s,e)=>{const d=SC.dow(date);return periodsOver(cx,s,e).some(p=>cx.un.has(t+':'+d+':'+p.n))};
function slotsFor(cx,date){return cx.slotCache[date]??=SC.slotsOn(cx.sid,date).filter(x=>x.day==SC.dow(date))}
// a lesson of mine that still takes place: its class is not writing at that time
function lessonAt(cx,t,date,s,e,papers){if(cx.tt.lessons=='none')return false;
 for(const x of slotsFor(cx,date)){if(x.teacher_id!=t)continue;const p=cx.lay.periods[x.period-1];if(!p||!ov(p.start,p.end,s,e))continue;
  const writing=papers.some(q=>q.class_id==x.class_id&&q.date==date&&q.start!=null&&ov(q.start,q.start+q.dur,p.start,p.end));if(!writing)return true}
 return false}
function poolFor(cx,classId){if(cx.tt.pool_all||!cx.multi)return cx.teachers;const s=cx.secOf[classId];return cx.teachers.filter(t=>t.sec.includes(s))}
// problems with putting teacher t on paper p (not counting other invigilators)
function teacherIssues(cx,t,p,papers){const o=[];if(p.date==null||p.start==null)return o;
 if(unavailAt(cx,t,p.date,p.start,p.start+p.dur))o.push('inv_unavail');
 if(lessonAt(cx,t,p.date,p.start,p.start+p.dur,papers))o.push('inv_lesson');return o}
// ---- placement
function candidates(cx,U,date,minStart,occ){const set=new Set();
 for(const p of cx.xl.periods)if(p.start>=cx.ds&&p.start<cx.de)set.add(p.start);
 if(!cx.tt.align){for(const b of cx.bl)set.add(b[0]);for(const c of U.classes)for(const x of(occ[c]?.[date]||[]))set.add(x[1])}
 return[...set].filter(s=>s>=minStart).sort((a,b)=>a-b)}
const dayLoad=(load,classes,date)=>classes.reduce((a,c)=>a+(load[c]?.[date]||0),0);
function fitUnit(cx,U,date,minStart,occ,load,ok){
 for(const s of candidates(cx,U,date,minStart,occ)){const e=s+U.dur;if(!fitsDay(cx.bl,s,U.dur))continue;
  if(U.classes.some(c=>(occ[c]?.[date]||[]).some(x=>ov(x[0],x[1],s,e))))continue;
  if(U.classes.some(c=>(load[c]?.[date]||0)+U.dur>cx.tt.max_min))continue;
  if(ok&&!ok(s,e))continue;return s}
 return-1}
function put(U,date,s,occ,load){U.date=date;U.start=s;for(const c of U.classes){((occ[c]??={})[date]??=[]).push([s,s+U.dur]);(load[c]??={})[date]=(load[c][date]||0)+U.dur}}
function take(U,occ,load){if(U.date==null)return;for(const c of U.classes){const a=occ[c]?.[U.date];if(a){const i=a.findIndex(x=>x[0]==U.start);if(i>=0)a.splice(i,1)}load[c][U.date]-=U.dur}U.date=null;U.start=null}
function examDays(cx,from,to){const out=[];for(let d=from;d<=to&&out.length<DAYS_MAX;d=SC.addDays(d,1))if(SC.schoolDay(cx.sid,cx.sc,d))out.push(d);return out}
// place every unit that has no place yet. `teachers` (subject-teacher mode) lets us keep a teacher off two papers at once when we can.
function placeAll(cx,units,days,occ,load){const tOcc={};
 const tk=(U,t,date,s,e)=>!unavailAt(cx,t,date,s,e)&&!(tOcc[t]?.[date]||[]).some(x=>ov(x[0],x[1],s,e));
 for(const U of units.filter(u=>u.date==null).sort((a,b)=>b.dur-a.dur||b.classes.length-a.classes.length||a.name.localeCompare(b.name))){
  const order=[...days].sort((a,b)=>dayLoad(load,U.classes,a)-dayLoad(load,U.classes,b)||a.localeCompare(b));let done=false;
  for(const tier of cx.tt.inv_mode=='subject'?[1,0]:[0]){
   for(const d of order){const ok=tier?(s,e)=>U.teachers.every(t=>!t||tk(U,t,d,s,e)):null,s=fitUnit(cx,U,d,cx.ds,occ,load,ok);if(s>=0){put(U,d,s,occ,load);if(tier)for(const t of U.teachers)if(t)((tOcc[t]??={})[d]??=[]).push([s,s+U.dur]);done=true;break}}
   if(done)break}}}
// ---- invigilators
function assignInv(cx,papers,mode,perRoom,keep={}){const res={},load={};
 if(mode=='none'){for(const p of papers)if(p.date!=null&&p.start!=null)res[p.id]=[];return res}
 const placed=papers.filter(p=>p.date!=null&&p.start!=null),busy=(t,p)=>placed.some(q=>q.id!=p.id&&q.date==p.date&&ov(q.start,q.start+q.dur,p.start,p.start+p.dur)&&(res[q.id]||[]).includes(t));
 for(const p of placed)if(keep[p.id]){res[p.id]=keep[p.id].slice();for(const t of res[p.id])if(t!=null)load[t]=(load[t]||0)+p.dur}
 const feas=p=>poolFor(cx,p.class_id).filter(t=>!teacherIssues(cx,t.id,p,papers).length);
 const order=placed.filter(p=>!keep[p.id]).map(p=>({p,n:feas(p).length})).sort((a,b)=>a.n-b.n||a.p.date.localeCompare(b.p.date)||a.p.start-b.p.start).map(x=>x.p);
 for(const p of order){const list=[],F=feas(p),min=p.dur;
  const pick=t=>{list.push(t);load[t]=(load[t]||0)+min};
  if(mode=='subject'&&p.teacher&&F.some(t=>t.id==p.teacher)&&!busy(p.teacher,p))pick(p.teacher);
  while(list.length<perRoom){const c=F.filter(t=>!list.includes(t.id)&&!busy(t.id,p)).sort((a,b)=>(load[a.id]||0)-(load[b.id]||0)||a.name.localeCompare(b.name))[0];if(!c)break;pick(c.id)}
  res[p.id]=list}
 return res}
// ---- warnings for one timetable (computed, never stored)
function check(cx,papers,inv){const W={},add=(id,c)=>(W[id]??=[]).push(c);
 for(const p of papers){if(p.date==null||p.start==null){add(p.id,'nodate');continue}
  if(!fitsDay(cx.bl,p.start,p.dur))add(p.id,'break');
  for(const q of papers)if(q.id<p.id&&q.class_id==p.class_id&&q.date==p.date&&q.start!=null&&ov(p.start,p.start+p.dur,q.start,q.start+q.dur))add(p.id,'class_overlap');
  const tot=papers.filter(q=>q.class_id==p.class_id&&q.date==p.date).reduce((a,q)=>a+q.dur,0);if(tot>cx.tt.max_min)add(p.id,'cap');
  const L=inv[p.id]||[];if(cx.tt.inv_mode!='none'&&L.filter(x=>x.slot<cx.tt.per_room).length<cx.tt.per_room&&!L.some(x=>x.teacher_id==null))add(p.id,'inv_none');
  for(const x of L){if(x.teacher_id==null)continue;for(const c of teacherIssues(cx,x.teacher_id,p,papers))add(p.id,c);
   if(papers.some(q=>q.id!=p.id&&q.date==p.date&&q.start!=null&&ov(p.start,p.start+p.dur,q.start,q.start+q.dur)&&(inv[q.id]||[]).some(y=>y.teacher_id==x.teacher_id)))add(p.id,'inv_busy')}}
 for(const k of Object.keys(W))W[k]=[...new Set(W[k])];return W}
// ---- load/save a timetable
const rowTT=(sid,id)=>db.prepare('SELECT * FROM exam_tt WHERE id=? AND school_id=?').get(+id,sid);
function papersOf(tt){return db.prepare('SELECT p.*,c.name cls,s.teacher_id main_teacher FROM exam_paper p JOIN classes c ON c.id=p.class_id LEFT JOIN subjects s ON s.id=p.subject_id WHERE p.tt_id=? ORDER BY p.date,p.start,c.name').all(tt.id).map(p=>({...p,teacher:subjectTeacher(p,tt)}))}
function subjectTeacher(p,tt){if(tt.seq){const o=db.prepare('SELECT teacher_id FROM subject_seq WHERE subject_id=? AND seq=?').get(p.subject_id,tt.seq);if(o)return o.teacher_id}return p.main_teacher||null}
const invOf=ttId=>{const m={};for(const r of db.prepare('SELECT i.* FROM exam_inv i JOIN exam_paper p ON p.id=i.paper_id WHERE p.tt_id=? ORDER BY i.slot').all(ttId))(m[r.paper_id]??=[]).push(r);return m};
function saveInv(papers,res){for(const p of papers){const old=db.prepare('SELECT * FROM exam_inv WHERE paper_id=?').all(p.id);db.prepare('DELETE FROM exam_inv WHERE paper_id=?').run(p.id);
  // a duty that was already confirmed (or marked absent) keeps its record when the same teacher stays on the paper
  (res[p.id]||[]).forEach((t,i)=>{const o=t!=null?old.find(x=>x.teacher_id==t&&x.status):null;db.prepare('INSERT INTO exam_inv(paper_id,slot,teacher_id,status,conf_at,conf_by,conf_geo,reason) VALUES(?,?,?,?,?,?,?,?)').run(p.id,i,t,o?o.status:null,o?o.conf_at:null,o?o.conf_by:null,o?o.conf_geo:null,o?o.reason:null)})}}
function view(sid,tt){const cx=context(sid,tt),papers=papersOf(tt),inv=invOf(tt.id),nm=SC.names(sid),W=check(cx,papers,inv);
 return{inv_pay:!!cx.sc.inv_pay,tt:{...tt,classes:JSON.parse(tt.classes),cfg:JSON.parse(tt.cfg)},days:examDays(cx,tt.start_date,tt.end_date),periods:cx.xl.periods,breaks:cx.xl.breaks,custom:!!dayOf(tt),
  papers:papers.map(p=>({id:p.id,class_id:p.class_id,cls:p.cls,subject_id:p.subject_id,subject:p.subject,date:p.date,start:p.start,dur:p.dur,tog:p.tog,nopaper:!!db.prepare('SELECT 1 FROM exam_nopaper WHERE school_id=? AND name=?').get(sid,key(p.subject)),
   inv:(inv[p.id]||[]).map(x=>({slot:x.slot,teacher_id:x.teacher_id,name:x.teacher_id==null?null:nm[x.teacher_id]||'?',conf:x.status||null,conf_at:x.conf_at||null,reason:x.reason||null})),warn:W[p.id]||[]})),
  teachers:cx.teachers.map(t=>({id:t.id,name:t.name,sections:t.sec}))}}
// deadline: `lead` school days before the exam date (closed days and weekends do not count)
function deadlineOf(sid,lead,date){const sc=SC.school(sid);let d=date,n=lead;for(let i=0;n>0&&i<400;i++){d=SC.addDays(d,-1);if(SC.schoolDay(sid,sc,d))n--}return d}

// ---- Phase 9d: lessons that fall while their class is writing are suspended (status 'suspended': not confirmable, not paid, not missing).
// Only published timetables count. 'none' = no lessons for these classes on any day of the exam period; 'continue' = only the periods that overlap a paper of that class.
function suspendedSet(sid,date,lay){const out=new Set();lay=lay||SC.layout(sid,SC.school(sid));
 for(const tt of db.prepare('SELECT * FROM exam_tt WHERE school_id=? AND published=1 AND start_date<=? AND end_date>=?').all(sid,date,date)){
  if(tt.lessons=='none'){for(const c of JSON.parse(tt.classes))for(const p of lay.periods)out.add(c+':'+p.n);continue}
  for(const q of db.prepare('SELECT class_id,start,dur FROM exam_paper WHERE tt_id=? AND date=? AND start IS NOT NULL').all(tt.id,date))for(const p of lay.periods)if(ov(p.start,p.start+(p.end-p.start),q.start,q.start+q.dur))out.add(q.class_id+':'+p.n)}
 return out}
// bring the lessons of one date in line (never touches a lesson that already has an answer, nor a locked month)
function syncDay(sid,date){if(SC.lockedMonth(sid,date))return 0;const rows=db.prepare("SELECT id,class_id,period,status FROM lessons WHERE school_id=? AND date=? AND status IN('pending','suspended')").all(sid,date);if(!rows.length)return 0;
 const want=suspendedSet(sid,date);let n=0;
 for(const r of rows){const w=want.has(r.class_id+':'+r.period);if(w&&r.status=='pending'){db.prepare("UPDATE lessons SET status='suspended' WHERE id=?").run(r.id);n++}else if(!w&&r.status=='suspended'){db.prepare("UPDATE lessons SET status='pending' WHERE id=?").run(r.id);n++}}
 return n}
function syncTT(sid,tt){let n=0;for(let d=tt.start_date,i=0;d<=tt.end_date&&i<70;d=SC.addDays(d,1),i++)n+=syncDay(sid,d);return n}
SC.HOOK.ensure=syncDay;
// ---- invigilation in the monthly hours: confirmed duties are paid by real paper length when the school switches it on
SC.HOOK.month=({sid,sc,ym,last,ck,lay,nm,rt,get,ex})=>{if(!sc.inv_pay)return;const plen=lay.periods.length?lay.periods[0].end-lay.periods[0].start:40,seen=new Set();
 for(const r of db.prepare("SELECT i.paper_id,i.slot,i.teacher_id,i.status,i.reason,p.date,p.start,p.dur,p.subject,c.name cls FROM exam_inv i JOIN exam_paper p ON p.id=i.paper_id JOIN exam_tt t ON t.id=p.tt_id JOIN classes c ON c.id=p.class_id WHERE t.school_id=? AND t.published=1 AND i.teacher_id IS NOT NULL AND p.start IS NOT NULL AND p.date BETWEEN ? AND ? ORDER BY p.date,p.start").all(sid,ym+'-01',last)){
  const ended=r.date<ck.date||(r.date==ck.date&&ck.min>=r.start+r.dur);
  if(r.status=='confirmed'){const k=r.teacher_id+':'+r.date+':'+r.start;if(seen.has(k))continue;seen.add(k);const t=get(r.teacher_id),a=Math.round(SC.rateAt(rt,r.teacher_id,r.date)*r.dur/plen);t.inv_min=(t.inv_min||0)+r.dur;t.inv_amt=(t.inv_amt||0)+a;t.amount+=a}
  else if(!r.status&&ended)ex.push({kind:'invig',id:r.paper_id,slot:r.slot,date:r.date,period:0,cls:r.cls,subject:r.subject,sched:nm[r.teacher_id]||'—',actual:'',status:'pending',reason:''})}}
module.exports={dayOf,dayLayout,suspendedSet,syncDay,syncTT,deadlineOf,key,context,fitUnit,put,take,placeAll,assignInv,check,examDays,blocksFor,fitsDay,rowTT,papersOf,invOf,saveInv,view,subjectTeacher,MINDUR,MAXDUR};
