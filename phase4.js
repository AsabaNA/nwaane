// Phase 4 routes: day structure, timetable, presence (gate + class QR + rounds), hours & pay.
const{db,tx}=require('./db'),SC=require('./sched'),crypto=require('crypto'),P4=require('./pdf4'),QR=require('./core/qr'),T4=P4.T;
module.exports=(app,{auth,userOf,E,audit,school,isGate})=>{
const ANY=auth(),ADM=auth(['principal']),VIEW=auth(['principal','secretary','surveillant']),SEE=(req,res,next)=>isGate(req.user)?next():E(res,403,'role');
const GATE=[auth(),SEE],BOSS=auth(['principal','surveillant']);
const sid=req=>req.user.school_id,clk=req=>SC.clock(school(req)),base=req=>process.env.PUBLIC_URL||req.protocol+'://'+req.get('host'),ok=(res,x={})=>res.json({ok:1,...x});
const num=(v,a,b)=>Number.isInteger(+v)&&+v>=a&&+v<=b;
const myClass=(req,id)=>db.prepare('SELECT * FROM classes WHERE id=? AND school_id=?').get(+id||0,sid(req));
const teacher=(req,id)=>db.prepare("SELECT * FROM users WHERE id=? AND school_id=? AND role='teacher' AND active=1").get(+id||0,sid(req));
const teachers=req=>db.prepare("SELECT id,name FROM users WHERE school_id=? AND role='teacher' AND active=1 ORDER BY name").all(sid(req));
// ---------- day structure
app.get('/api/structure',ANY,(req,res)=>{const x=school(req),lay=SC.layout(sid(req),x);
 res.json({geo:x.geo_lat==null?null:{lat:x.geo_lat,lng:x.geo_lng},geo_r:x.geo_r||150,day_start:x.day_start,days:lay.days,win_before:x.win_before,win_after:x.win_after,spot_n:x.spot_n,blocks:SC.blocksOf(sid(req)),periods:lay.periods,breaks:lay.breaks,closed:db.prepare('SELECT date,label FROM closed WHERE school_id=? ORDER BY date').all(sid(req))})});
app.post('/api/structure',ADM,(req,res)=>{const{day_start,days,win_before,win_after,spot_n,blocks}=req.body;
 if(!/^\d{1,2}:\d{2}$/.test(day_start||'')||SC.toMin(day_start)>=1200||!Array.isArray(days)||!days.length||!days.every(d=>num(d,1,7))||!num(win_before,0,60)||!num(win_after,0,90)||!num(spot_n,0,10)||!Array.isArray(blocks)||blocks.length>30)return E(res,400,'invalid');
 const b=blocks.map(x=>({kind:x.kind,minutes:+x.minutes,label:String(x.label||'').slice(0,30)||null}));
 if(!b.every(x=>['period','break'].includes(x.kind)&&num(x.minutes,5,180))||!b.some(x=>x.kind=='period')||b.filter(x=>x.kind=='period').length>14)return E(res,400,'invalid');
 const n=b.filter(x=>x.kind=='period').length,used=db.prepare('SELECT MAX(period) m FROM slots WHERE school_id=? AND (to_date IS NULL OR to_date>=?)').get(sid(req),clk(req).date).m||0;
 if(n<used)return E(res,409,'inuse');
 tx(()=>{db.prepare('DELETE FROM blocks WHERE school_id=?').run(sid(req));b.forEach((x,i)=>db.prepare('INSERT INTO blocks(school_id,pos,kind,minutes,label) VALUES(?,?,?,?,?)').run(sid(req),i,x.kind,x.minutes,x.label));
  db.prepare('UPDATE schools SET day_start=?,days=?,win_before=?,win_after=?,spot_n=? WHERE id=?').run(day_start,[...new Set(days.map(Number))].sort().join(','),+win_before,+win_after,+spot_n,sid(req))})();
 audit(req.user,'structure.update');ok(res)});
app.post('/api/closed',ADM,(req,res)=>{const{date,to,label=''}=req.body,end=to||date;
 if(!SC.isDate(date)||!SC.isDate(end)||end<date||SC.addDays(date,60)<end||label.length>60)return E(res,400,'invalid');
 tx(()=>{for(let d=date;d<=end;d=SC.addDays(d,1)){if(SC.lockedMonth(sid(req),d))continue;db.prepare('INSERT OR REPLACE INTO closed(school_id,date,label) VALUES(?,?,?)').run(sid(req),d,label.trim()||'—');
  db.prepare("DELETE FROM lessons WHERE school_id=? AND date=? AND status='pending' AND via IS NULL AND flag IS NULL").run(sid(req),d)}})();audit(req.user,'closed.add',date+'..'+end);ok(res)});
app.post('/api/closed/delete',ADM,(req,res)=>{if(SC.lockedMonth(sid(req),req.body.date||''))return E(res,409,'mlocked');db.prepare('DELETE FROM closed WHERE school_id=? AND date=?').run(sid(req),req.body.date||'');ok(res)});
app.get('/api/unavail',ADM,(req,res)=>{const t=teacher(req,req.query.teacher_id);if(!t)return E(res,400,'invalid');res.json(db.prepare('SELECT day,period FROM unavail WHERE teacher_id=?').all(t.id))});
app.post('/api/unavail',ADM,(req,res)=>{const t=teacher(req,req.body.teacher_id),c=req.body.cells;if(!t||!Array.isArray(c)||c.length>200||!c.every(x=>num(x.day,1,7)&&num(x.period,1,14)))return E(res,400,'invalid');
 tx(()=>{db.prepare('DELETE FROM unavail WHERE teacher_id=?').run(t.id);for(const x of c)db.prepare('INSERT OR IGNORE INTO unavail(school_id,teacher_id,day,period) VALUES(?,?,?,?)').run(sid(req),t.id,x.day,x.period)})();ok(res,{clashes:SC.clashes(sid(req),clk(req).date).filter(x=>x.kind=='unavail'&&x.teacher_id==t.id)})});
// ---------- timetable
const dateQ=req=>SC.isDate(req.query.date)?req.query.date:clk(req).date;
app.get('/api/timetable',VIEW,(req,res)=>{const date=dateQ(req),s=sid(req),lay=SC.layout(s);let slots,subjects=[],off=[];
 if(req.query.class_id){if(!myClass(req,req.query.class_id))return E(res,404,'invalid');slots=SC.slotsOn(s,date,'AND s.class_id=?',+req.query.class_id);
  subjects=db.prepare('SELECT b.id,b.name,b.teacher_id,u.name teacher FROM subjects b LEFT JOIN users u ON u.id=b.teacher_id WHERE b.class_id=? ORDER BY b.id').all(+req.query.class_id);
  off=String((db.prepare('SELECT off_days FROM classes WHERE id=?').get(+req.query.class_id)||{}).off_days||'').split(',').filter(Boolean).map(Number)}
 else if(req.query.teacher_id){if(!teacher(req,req.query.teacher_id))return E(res,404,'invalid');slots=SC.slotsOn(s,date,'AND s.teacher_id=?',+req.query.teacher_id)}else return E(res,400,'invalid');
 res.json({date,days:lay.days,periods:lay.periods,breaks:lay.breaks,slots,subjects,off,clashes:SC.clashes(s,date).length})});
app.get('/api/mytimetable',auth(['teacher']),(req,res)=>{const ck=clk(req),s=sid(req),lay=SC.layout(s);SC.ensure(s,ck.date);
 res.json({date:ck.date,in_at:((db.prepare('SELECT in_at FROM gate WHERE user_id=? AND date=?').get(req.user.id,ck.date)||{}).in_at||'').slice(11,16)||null,days:lay.days,periods:lay.periods,breaks:lay.breaks,slots:SC.slotsOn(s,ck.date,'AND s.teacher_id=?',req.user.id),
  today:db.prepare('SELECT l.period,l.status,l.appr,c.name cls,b.name subject,l.sched_id,l.actual_id FROM lessons l JOIN classes c ON c.id=l.class_id JOIN subjects b ON b.id=l.subject_id WHERE l.school_id=? AND l.date=? AND (l.sched_id=? OR l.actual_id=?) ORDER BY l.period').all(s,ck.date,req.user.id,req.user.id)})});
app.get('/api/timetable/clashes',VIEW,(req,res)=>{const nm=['','Mon','Tue','Wed','Thu','Fri','Sat','Sun'];res.json(SC.clashes(sid(req),dateQ(req)))});
app.post('/api/timetable/set',ADM,(req,res)=>{const{class_id,day,period,subject_id,force}=req.body,s=sid(req),ck=clk(req),from=req.body.from||ck.date,lay=SC.layout(s);
 const c=myClass(req,class_id);if(!c||!lay.days.includes(+day)||!num(period,1,lay.periods.length)||!SC.isDate(from))return E(res,400,'invalid');
 const sub=subject_id?db.prepare('SELECT * FROM subjects WHERE id=? AND class_id=?').get(+subject_id,c.id):null;if(subject_id&&!sub)return E(res,400,'invalid');
 if(SC.lockedFrom(s,from))return E(res,409,'mlocked');
 if(from<ck.date&&db.prepare("SELECT 1 FROM lessons WHERE class_id=? AND date>=? AND status!='pending' LIMIT 1").get(c.id,from))return E(res,409,'past');
 const kind=req.body.kind?1:0,pt=sub?(db.prepare('SELECT teacher_id FROM subject_prac WHERE subject_id=?').get(sub.id)||{}).teacher_id:null,tid=sub?(+req.body.teacher_id||(kind?pt:sub.teacher_id)||null):null;
 if(sub&&tid){const team=new Set([sub.teacher_id,pt,...db.prepare('SELECT teacher_id FROM subject_teachers WHERE subject_id=?').all(sub.id).map(r=>r.teacher_id)].filter(Boolean));if(!team.has(tid))return E(res,400,'invalid');
  const b=SC.busyWith(s,tid,+day,+period,from,c.id);if(b.length)return res.status(409).json({error:'clash',cls:b[0].cls});
  if(!force&&SC.unavailable(tid,+day,+period))return res.status(409).json({error:'unavail'})}
 SC.applySlot(s,c.id,+day,+period,sub&&sub.id,tid,from,kind);audit(req.user,'timetable.set',`${c.name} d${day} p${period} ${sub?sub.name:'-'} from ${from}`);ok(res)});
app.get('/api/timetable/pdf',auth(['principal','secretary','surveillant','teacher']),async(req,res,next)=>{try{const s=sid(req),q=req.query,date=dateQ(req),lang=q.lang=='fr'?'fr':'en';let kind,ids;
 if(req.user.role=='teacher'){kind='teacher';ids=[req.user.id]}
 else if(q.classes){kind='class';const w=new Set(String(q.classes).split(',').map(Number));ids=db.prepare('SELECT id FROM classes WHERE school_id=? ORDER BY name').all(s).map(x=>x.id).filter(i=>w.has(i))}
 else if(q.all=='classes'){kind='class';ids=db.prepare('SELECT id FROM classes WHERE school_id=? ORDER BY name').all(s).map(x=>x.id)}
 else if(q.all=='teachers'){kind='teacher';ids=teachers(req).map(x=>x.id)}
 else if(q.class_id&&myClass(req,q.class_id)){kind='class';ids=[+q.class_id]}else if(q.teacher_id&&teacher(req,q.teacher_id)){kind='teacher';ids=[+q.teacher_id]}else return E(res,400,'invalid');
 if(!ids.length)return E(res,404,'invalid');await P4.timetable(res,{sid:s,kind,ids,date,lang})}catch(e){next(e)}});
app.post('/api/timetable/reassign',ADM,(req,res)=>{const{subject_id,teacher_id}=req.body,b=db.prepare('SELECT * FROM subjects WHERE id=? AND school_id=?').get(+subject_id||0,sid(req));
 if(!b||(teacher_id&&!teacher(req,teacher_id)))return E(res,400,'invalid');res.json({ok:1,clashes:SC.reassign(sid(req),b.id,teacher_id||null,req.body.from||clk(req).date)})});
// ---------- class QR codes
const qrOf=c=>base=>`${base}/c/${c.qr}`;
app.get('/api/classes/qr',ADM,(req,res)=>{const c=myClass(req,req.query.class_id);if(!c)return E(res,404,'invalid');res.json({url:base(req)+'/c/'+c.qr})});
app.post('/api/classes/qr/rotate',ADM,(req,res)=>{const c=myClass(req,req.body.class_id);if(!c)return E(res,404,'invalid');db.prepare('UPDATE classes SET qr=? WHERE id=?').run(crypto.randomBytes(12).toString('hex'),c.id);audit(req.user,'class.qr.rotate',c.name);ok(res)});
app.get('/api/qr/pdf',ADM,async(req,res,next)=>{try{const cs=req.query.all?db.prepare('SELECT * FROM classes WHERE school_id=? ORDER BY name').all(sid(req)):[myClass(req,req.query.class_id)].filter(Boolean);
 if(!cs.length)return E(res,404,'invalid');await P4.qrSheet(res,{school:school(req),classes:cs,base:base(req),lang:req.query.lang=='fr'?'fr':'en'})}catch(e){next(e)}});
app.get('/c/:token',(req,res)=>res.sendFile(require('path').join(__dirname,'public','class.html')));
const clsByTok=t=>db.prepare('SELECT c.*,s.name school,s.code scode FROM classes c JOIN schools s ON s.id=c.school_id WHERE c.qr=?').get(String(t||''));
// ---------- school location: a lesson can only be confirmed from the school (phones only; the QR link alone proves nothing)
const GEO_TOL=50,GEO_WEAK=150;   // doubt allowed for GPS error (m, capped); readings worse than this are refused
const dist=(a,b,c,d)=>{const r=x=>x*Math.PI/180,h=Math.sin(r(c-a)/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(r(d-b)/2)**2;return 12742000*Math.asin(Math.sqrt(h))};
const okPt=(la,ln)=>Number.isFinite(la)&&Number.isFinite(ln)&&Math.abs(la)<=90&&Math.abs(ln)<=180;
app.post('/api/structure/geo',ADM,(req,res)=>{const b=req.body,r=Math.round(+b.r);
 if(!Number.isFinite(r)||r<20||r>1000)return E(res,400,'invalid');
 if(b.clear){db.prepare('UPDATE schools SET geo_lat=NULL,geo_lng=NULL,geo_r=? WHERE id=?').run(r,sid(req));return res.json({ok:1})}
 if(b.lat==null&&b.lng==null){db.prepare('UPDATE schools SET geo_r=? WHERE id=?').run(r,sid(req));return res.json({ok:1})}
 const la=+b.lat,ln=+b.lng,ac=+b.acc;if(!okPt(la,ln))return E(res,400,'invalid');if(Number.isFinite(ac)&&ac>GEO_WEAK)return E(res,400,'loc_weak');
 db.prepare('UPDATE schools SET geo_lat=?,geo_lng=?,geo_r=? WHERE id=?').run(la,ln,r,sid(req));res.json({ok:1})});
// null = fine / not checked; otherwise the refusal
function geoCheck(sc,b){if(sc.geo_lat==null)return null;const la=+b.lat,ln=+b.lng,ac=+b.acc;
 if(b.lat==null||!okPt(la,ln))return{error:'loc_none'};
 if(Number.isFinite(ac)&&ac>GEO_WEAK)return{error:'loc_weak'};
 const d=dist(sc.geo_lat,sc.geo_lng,la,ln),slack=Math.min(Number.isFinite(ac)&&ac>0?ac:0,GEO_TOL);
 return d-slack>(sc.geo_r||150)?{error:'loc_far',m:Math.round(d)}:{m:Math.round(d)}}
app.locals.geoCheck=geoCheck;
// What would happen if this teacher confirmed now? (shared by the info and confirm endpoints)
function qrState(u,c){const sc=db.prepare('SELECT * FROM schools WHERE id=?').get(c.school_id),ck=SC.clock(sc),lay=SC.layout(sc.id,sc);
 if(u.school_id!=c.school_id||u.role!='teacher')return{state:'who'};
 if(!SC.schoolDay(sc.id,sc,ck.date))return{state:'noschool',label:SC.closedLabel(sc.id,ck.date)?.label||null};
 SC.ensure(sc.id,ck.date,sc);
 const cur=lay.periods.find(p=>p.start<=ck.min&&ck.min<p.end)||lay.periods.find(p=>p.start-sc.win_before<=ck.min&&ck.min<p.start);
 const next=lay.periods.filter(p=>p.start>ck.min&&db.prepare('SELECT 1 FROM lessons WHERE class_id=? AND date=? AND period=?').get(c.id,ck.date,p.n))[0];
 if(!cur)return{state:'noperiod',next:next&&{period:next.n,start:next.s}};
 const L=db.prepare('SELECT l.*,b.name subject,u.name sched FROM lessons l JOIN subjects b ON b.id=l.subject_id LEFT JOIN users u ON u.id=l.sched_id WHERE l.class_id=? AND l.date=? AND l.period=?').get(c.id,ck.date,cur.n);
 if(!L)return{state:'nolesson',period:cur.n};
 const info={period:cur.n,start:cur.s,end:cur.e,subject:L.subject,sched:L.sched,mine:L.sched_id==u.id,lesson:L.id};
  if(L.status=='suspended')return{state:'suspended',...info};
 if(L.status!='pending'){const who=L.actual_id&&L.actual_id!=u.id;return{state:who?'taken':'done',...info,status:L.status,at:L.at,appr:L.appr}}
 const g=db.prepare('SELECT * FROM gate WHERE user_id=? AND date=?').get(u.id,ck.date);if(!g||!g.in_at||g.out_at)return{state:'nogate',...info};
 const busy=db.prepare("SELECT c.name FROM lessons l JOIN classes c ON c.id=l.class_id WHERE l.date=? AND l.period=? AND l.actual_id=? AND l.status!='pending'").get(ck.date,cur.n,u.id);if(busy)return{state:'busy',cls:busy.name,...info};
 const hh=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
 return{state:'ready',...info,arrived:String(g.in_at).slice(11,16),until:hh(cur.start+sc.win_after),late:L.sched_id==u.id&&ck.min>cur.start+sc.win_after,ck,L}}
app.get('/api/qr/info',(req,res)=>{const c=clsByTok(req.query.token);if(!c)return E(res,404,'invalid');const u=userOf(req.cookies.t),out={school:c.school,code:c.scode,cls:c.name};
 if(!u)return res.json({...out,state:'login'});const st=qrState(u,c);delete st.L;delete st.ck;const sch=db.prepare('SELECT * FROM schools WHERE id=?').get(c.school_id);res.json({...out,cid:c.id,roll:sch.roll_mode||'off',rdate:SC.clock(sch).date,me:u.name,geo:db.prepare('SELECT geo_lat FROM schools WHERE id=?').get(c.school_id).geo_lat!=null,...st})});
app.post('/api/qr/confirm',(req,res)=>{const c=clsByTok(req.body.token),u=c&&userOf(req.cookies.t);if(!u)return E(res,c?401:404,c?'auth':'invalid');
 const st=qrState(u,c);if(st.state!='ready')return res.status(409).json({error:'state',state:st.state});
 const gc=geoCheck(db.prepare('SELECT * FROM schools WHERE id=?').get(c.school_id),req.body);if(gc&&gc.error)return res.status(403).json(gc);
 const sum=String(req.body.summary??'').trim();if(sum.length<3||sum.length>500)return E(res,400,'summary');
 const mine=st.mine,status=mine?(st.late?'late':'present'):'replaced';
 const r=db.prepare("UPDATE lessons SET status=?,actual_id=?,via='qr',at=?,by_id=?,geo_m=?,summary=? WHERE id=? AND status='pending'").run(status,u.id,st.ck.at,u.id,gc?gc.m:null,sum,st.lesson);
 if(!r.changes)return E(res,409,'state');audit(u,'lesson.qr',`${c.name} p${st.period} ${status}`);res.json({ok:1,status})});
// ---------- today: gate, rounds, replacements, spot checks
function pickSpots(s,sc,ck){const have=db.prepare('SELECT COUNT(*) n FROM lessons WHERE school_id=? AND date=? AND spot=1').get(s,ck.date).n;if(have>=sc.spot_n)return;
 db.prepare("UPDATE lessons SET spot=1 WHERE id IN(SELECT id FROM lessons WHERE school_id=? AND date=? AND status IN('present','late') AND via='qr' AND spot IS NULL ORDER BY random() LIMIT ?)").run(s,ck.date,sc.spot_n-have)}
app.get('/api/today',GATE,(req,res)=>{const s=sid(req),sc=school(req),ck=SC.clock(sc),lay=SC.layout(s,sc),day=SC.schoolDay(s,sc,ck.date);if(day)SC.ensure(s,ck.date,sc);pickSpots(s,sc,ck);
 const nm=SC.names(s),gate=Object.fromEntries(db.prepare('SELECT * FROM gate WHERE school_id=? AND date=?').all(s,ck.date).map(g=>[g.user_id,g])),
 lessons=db.prepare('SELECT l.*,c.name cls,b.name subject FROM lessons l JOIN classes c ON c.id=l.class_id JOIN subjects b ON b.id=l.subject_id WHERE l.school_id=? AND l.date=? ORDER BY l.period,c.name').all(s,ck.date).map(l=>({id:l.id,period:l.period,cls:l.cls,subject:l.subject,sched_id:l.sched_id,sched:nm[l.sched_id]||'—',actual_id:l.actual_id,actual:nm[l.actual_id]||'',status:l.status,appr:l.appr,via:l.via,flag:l.flag,at:l.at,spot:l.spot,spot_res:l.spot_res,summary:l.summary})),
 busy=new Set(lessons.map(l=>l.sched_id));
 res.json({now:ck,schoolDay:day,closed:SC.closedLabel(s,ck.date)?.label||null,periods:lay.periods,breaks:lay.breaks,boss:['principal','surveillant'].includes(req.user.role),
  gate:db.prepare("SELECT id,name FROM users WHERE school_id=? AND role='teacher' AND active=1 ORDER BY name").all(s).map(t=>({...t,in_at:gate[t.id]?.in_at||null,out_at:gate[t.id]?.out_at||null,flag:gate[t.id]?.flag||null,lessons:lessons.filter(l=>l.sched_id==t.id&&l.status!='suspended').length})),lessons})});
app.post('/api/gate',GATE,(req,res)=>{const{user_id,action,time,reason=''}=req.body,s=sid(req),ck=clk(req),date=req.body.date||ck.date,t=teacher(req,user_id);
 if(!t||!['in','out','undo'].includes(action)||!SC.isDate(date)||date>ck.date||reason.length>200)return E(res,400,'invalid');
 if(SC.lockedMonth(s,date))return E(res,409,'mlocked');
 if(date!=ck.date&&req.user.role!='principal')return E(res,403,'role');
 let at=ck.at,flag=null;
 if(time||date!=ck.date){const tm=time||'';if(!/^\d{1,2}:\d{2}$/.test(tm)||SC.toMin(tm)>=1440)return E(res,400,'invalid');at=date+'T'+SC.hh(SC.toMin(tm));
  if(at>ck.at)return E(res,400,'future');if(date!=ck.date||ck.min-SC.toMin(tm)>10){if(!reason.trim())return E(res,400,'reason');flag='backfill'}}
 const g=db.prepare('SELECT * FROM gate WHERE user_id=? AND date=?').get(t.id,date);
 if(action=='in'){if(g?.in_at)return E(res,409,'already');db.prepare('INSERT OR REPLACE INTO gate(id,school_id,user_id,date,in_at,by_id,flag,reason) VALUES((SELECT id FROM gate WHERE user_id=? AND date=?),?,?,?,?,?,?,?)').run(t.id,date,s,t.id,date,at,req.user.id,flag,reason.trim()||null)}
 else if(action=='out'){if(!g?.in_at)return E(res,409,'noin');if(at<g.in_at)return E(res,400,'invalid');db.prepare('UPDATE gate SET out_at=?,flag=COALESCE(flag,?),reason=COALESCE(?,reason) WHERE id=?').run(at,flag,reason.trim()||null,g.id)}
 else{if(!g)return E(res,409,'noin');if(date!=ck.date)return E(res,403,'role');db.prepare('DELETE FROM gate WHERE id=?').run(g.id)}
 audit(req.user,'gate.'+action,t.username+' '+date+' '+at.slice(11));ok(res)});
const lessonOf=(req,id)=>db.prepare('SELECT l.*,p.name FROM lessons l JOIN classes p ON p.id=l.class_id WHERE l.id=? AND l.school_id=?').get(+id||0,sid(req));
const conflict=(l,actual)=>actual&&db.prepare("SELECT 1 FROM lessons WHERE date=? AND period=? AND actual_id=? AND status!='pending' AND id!=?").get(l.date,l.period,actual,l.id);
app.post('/api/lesson/set',GATE,(req,res)=>{const{id,status,actual_id,reason=''}=req.body,L=lessonOf(req,id),s=sid(req),sc=school(req),ck=SC.clock(sc),lay=SC.layout(s,sc);
 if(!L||!['present','late','absent','replaced','pending'].includes(status)||reason.length>200)return E(res,400,'invalid');
 if(L.status=='suspended')return E(res,409,'suspended');
 if(SC.lockedMonth(s,L.date))return E(res,409,'mlocked');const per=lay.periods[L.period-1];
 if(L.date>ck.date||(L.date==ck.date&&ck.min<per.start-sc.win_before))return E(res,409,'future');
 const past=L.date<ck.date||status=='pending';if(past&&req.user.role!='principal')return E(res,403,'role');if(past&&!reason.trim())return E(res,400,'reason');
 let actual=null,appr=null;
 if(status=='present'||status=='late'){if(!L.sched_id)return E(res,400,'invalid');actual=L.sched_id}
 if(status=='replaced'){const t=teacher(req,actual_id);if(!t||t.id==L.sched_id)return E(res,400,'invalid');actual=t.id;appr=req.user.role=='principal'||req.user.role=='surveillant'?1:null}
 if(conflict(L,actual))return E(res,409,'busy');
 const flag=past&&status!='pending'?'backfill':(L.flag=='spot'?null:L.flag);
 db.prepare('UPDATE lessons SET status=?,actual_id=?,appr=?,via=?,flag=?,reason=?,at=?,by_id=?,spot_res=CASE WHEN flag=\'spot\' THEN \'resolved\' ELSE spot_res END WHERE id=?').run(status,actual,appr,status=='pending'?null:'round',status=='pending'?null:flag,reason.trim()||L.reason,ck.at,req.user.id,L.id);
 audit(req.user,'lesson.set',`${L.name} ${L.date} p${L.period} ${L.status}->${status}`);ok(res)});
app.post('/api/lesson/approve',BOSS,(req,res)=>{const L=lessonOf(req,req.body.id);if(!L||L.status!='replaced'||L.appr!=null)return E(res,400,'invalid');if(SC.lockedMonth(sid(req),L.date))return E(res,409,'mlocked');
 if(req.body.ok)db.prepare('UPDATE lessons SET appr=1,by_id=? WHERE id=?').run(req.user.id,L.id);else db.prepare("UPDATE lessons SET status='pending',actual_id=NULL,via=NULL,appr=NULL,by_id=? WHERE id=?").run(req.user.id,L.id);
 audit(req.user,'lesson.approve',L.id+':'+!!req.body.ok);ok(res)});
app.post('/api/spot',GATE,(req,res)=>{const L=lessonOf(req,req.body.id),r=req.body.res;if(!L||!L.spot||!['ok','notseen'].includes(r)||L.date!=clk(req).date)return E(res,400,'invalid');
 db.prepare('UPDATE lessons SET spot_res=?,flag=CASE WHEN ?=\'notseen\' THEN \'spot\' ELSE flag END WHERE id=?').run(r,r,L.id);audit(req.user,'spot.'+r,L.id);ok(res)});
app.post('/api/lesson/bulk',ADM,(req,res)=>{const{ym,status,reason=''}=req.body,s=sid(req);if(!/^\d{4}-\d{2}$/.test(ym||'')||!['absent','present'].includes(status)||!reason.trim()||reason.length>200)return E(res,400,'invalid');
 if(SC.lockedMonth(s,ym+'-01'))return E(res,409,'mlocked');const d=SC.monthData(s,ym),ids=d.exceptions.filter(x=>x.kind=='unconfirmed'&&(!req.body.teacher_id||db.prepare('SELECT 1 FROM lessons WHERE id=? AND sched_id=?').get(x.id,+req.body.teacher_id))).map(x=>x.id),ck=clk(req);
 tx(()=>{for(const i of ids)db.prepare("UPDATE lessons SET status=?,actual_id=CASE WHEN ?='present' THEN sched_id END,via='bulk',flag=CASE WHEN ?='present' THEN 'backfill' END,reason=?,at=?,by_id=? WHERE id=? AND status='pending'").run(status,status,status,reason.trim(),ck.at,req.user.id,i)})();
 audit(req.user,'lesson.bulk',`${ym} ${status} x${ids.length}`);ok(res,{n:ids.length})});
// ---------- hours & pay
const ymQ=req=>/^\d{4}-\d{2}$/.test(req.query.ym||'')?req.query.ym:clk(req).date.slice(0,7);
app.get('/api/hours',auth(['principal','surveillant']),(req,res)=>{const ym=ymQ(req),d=SC.monthSummary(sid(req),ym),pr=req.user.role=='principal',today=clk(req).date;
 const rt=SC.ratesOf(sid(req));
 res.json({...d,money:pr,inv_pay:!!school(req).inv_pay,show_pay:school(req).show_pay!==0,teachers:d.teachers.map(t=>pr?{...t,rate:SC.rateAt(rt,t.id,today)}:{...t,amount:undefined,rate:undefined}),
  rates:pr?teachers(req).map(t=>({...t,rate:SC.rateAt(rt,t.id,today)})):undefined})});
app.post('/api/rates',ADM,(req,res)=>{const{amount,from_date}=req.body,s=sid(req);if(!num(amount,0,1000000)||!SC.isDate(from_date))return E(res,400,'invalid');
 if(SC.lockedFrom(s,from_date))return E(res,409,'mlocked');const ids=req.body.all?teachers(req).map(t=>t.id):teacher(req,req.body.teacher_id)?[+req.body.teacher_id]:null;if(!ids)return E(res,400,'invalid');
 tx(()=>{for(const i of ids)db.prepare('INSERT OR REPLACE INTO rates(school_id,teacher_id,from_date,amount) VALUES(?,?,?,?)').run(s,i,from_date,+amount)})();audit(req.user,'rate.set',`${ids.length} from ${from_date} = ${amount}`);ok(res)});
app.post('/api/hours/visibility',ADM,(req,res)=>{db.prepare('UPDATE schools SET show_pay=? WHERE id=?').run(req.body.show?1:0,sid(req));audit(req.user,'pay.visibility',String(!!req.body.show));ok(res)});
app.post('/api/hours/approve',ADM,(req,res)=>{const ym=req.body.ym,s=sid(req);if(!/^\d{4}-\d{2}$/.test(ym||''))return E(res,400,'invalid');if(SC.lockedMonth(s,ym+'-01'))return E(res,409,'mlocked');
 const d=SC.monthData(s,ym);if(!d.ended)return E(res,409,'notended');const open=d.exceptions.filter(x=>['unconfirmed','replacement','spot','invig'].includes(x.kind)).length;if(open)return res.status(409).json({error:'open',n:open});
 const rt=SC.ratesOf(s);d.teachers.forEach(t=>{t.rate=SC.rateAt(rt,t.id,ym+'-28')});
 db.prepare('INSERT INTO months(school_id,ym,by_id,at,snap) VALUES(?,?,?,?,?)').run(s,ym,req.user.id,clk(req).at,JSON.stringify({...d,locked:true}));audit(req.user,'hours.approve',ym);ok(res)});
// lesson log: one teacher, a date range, attendance totals and the material covered (what they wrote when they confirmed)
app.get('/api/lessons/log',GATE,async(req,res,next)=>{try{const s=sid(req),tid=+req.query.teacher_id||0,tc=db.prepare("SELECT id,name FROM users WHERE id=? AND school_id=? AND role='teacher'").get(tid,s),from=String(req.query.from||''),to=String(req.query.to||'');
 if(!tc||!SC.isDate(from)||!SC.isDate(to)||from>to||(new Date(to)-new Date(from))/864e5>366)return E(res,400,'invalid');
 const nm=SC.names(s),lg=req.query.lang=='fr'?'fr':'en',l=T4[lg],all=db.prepare("SELECT l.date,l.period,c.name cls,b.name subject,l.status,l.sched_id,l.actual_id,l.appr,l.summary FROM lessons l JOIN classes c ON c.id=l.class_id JOIN subjects b ON b.id=l.subject_id WHERE l.school_id=? AND l.date BETWEEN ? AND ? AND (l.sched_id=? OR l.actual_id=?) ORDER BY l.date,l.period").all(s,from,to,tid,tid),mine=all.filter(x=>x.sched_id==tid),
  st={sched:mine.length,present:mine.filter(x=>x.status=='present').length,late:mine.filter(x=>x.status=='late').length,absent:mine.filter(x=>x.status=='absent').length,out:mine.filter(x=>x.status=='replaced').length,in:all.filter(x=>x.actual_id==tid&&x.sched_id!=tid&&x.status=='replaced').length,pending:mine.filter(x=>x.status=='pending').length},
  lab=x=>x.status=='pending'?l.pending:x.sched_id==tid?(x.status=='replaced'?`${l.out} ${l.by} ${nm[x.actual_id]||'?'}`:l.status_[x.status]||x.status):`${l.in} (${x.sched_id?nm[x.sched_id]||'?':'—'})`;
 const rows=all.filter(x=>x.status!='pending').map(x=>({date:x.date,period:x.period,cls:x.cls,subject:x.subject,stat:lab(x),summary:x.summary||''}));
 if(req.query.json)return res.json({teacher:tc.name,from,to,stats:st,rows});
 await P4.lessonLog(res,{school:school(req),teacher:tc.name,from,to,stats:st,rows,lang:lg})}catch(e){next(e)}});
app.get('/api/hours/pdf',ADM,async(req,res,next)=>{try{const ym=ymQ(req);await P4.pay(res,{school:school(req),data:SC.monthSummary(sid(req),ym),lang:req.query.lang=='fr'?'fr':'en'})}catch(e){next(e)}});
app.get('/api/myhours',auth(['teacher']),(req,res)=>{const ym=ymQ(req),s=sid(req),d=SC.monthSummary(s,ym),sp=school(req).show_pay!==0,me0=d.teachers.find(t=>t.id==req.user.id)||null,me=me0&&(sp?me0:{...me0,amount:undefined,rate:undefined}),rt=SC.ratesOf(s),nm=SC.names(s);
 res.json({ym,show_pay:sp,locked:d.locked,ended:d.ended,total:me,
  lessons:db.prepare('SELECT l.date,l.period,l.status,l.appr,l.sched_id,l.actual_id,c.name cls,b.name subject FROM lessons l JOIN classes c ON c.id=l.class_id JOIN subjects b ON b.id=l.subject_id WHERE l.school_id=? AND l.date BETWEEN ? AND ? AND (l.sched_id=? OR l.actual_id=?) ORDER BY l.date,l.period').all(s,ym+'-01',SC.monthEnd(ym),req.user.id,req.user.id)
   .map(l=>{const paid=(['present','late'].includes(l.status)&&(l.sched_id||l.actual_id)==req.user.id)||(l.status=='replaced'&&l.appr==1&&l.actual_id==req.user.id);return{...l,paid,amount:sp?(paid?SC.rateAt(rt,req.user.id,l.date):0):undefined,replacer:nm[l.actual_id]}})})});
// ---------- demo clock (demo school only)
app.post('/api/demo/clock',ADM,(req,res)=>{const at=req.body.at||'';if(!school(req).demo||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(at)||!SC.isDate(at.slice(0,10)))return E(res,400,'invalid');
 db.prepare('UPDATE schools SET demo_fake=?,demo_real=? WHERE id=?').run(at,new Date().toISOString(),sid(req));ok(res)});
};
