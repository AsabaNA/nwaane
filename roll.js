// Student roll call. The school picks who takes it (settings): off | lesson (the teacher of each lesson) | head (class head, once a day) | admin (office staff, once a day).
// Only absences are stored; a roll that was taken with nobody absent is a roll_calls row with no roll_absent rows.
const{db,tx}=require('./db'),SC=require('./sched');
const MODES=['off','lesson','head','admin'],OFFICE=['principal','secretary','surveillant'];
module.exports=(app,{auth,E,audit,school})=>{
const sid=req=>req.user.school_id,office=u=>OFFICE.includes(u.role),mode=req=>school(req).roll_mode||'off',today=req=>SC.clock(school(req)).date;
const cls=(req,id)=>db.prepare('SELECT * FROM classes WHERE id=? AND school_id=?').get(+id||0,sid(req));
const studs=cid=>db.prepare('SELECT id,name,matricule,sex FROM students WHERE class_id=? AND active=1 ORDER BY name').all(cid);
const resp=l=>l.actual_id||l.sched_id;
const lessonAt=(cid,date,p)=>db.prepare('SELECT l.*,s.name subject FROM lessons l JOIN subjects s ON s.id=l.subject_id WHERE l.class_id=? AND l.date=? AND l.period=?').get(cid,date,p);
// can this user take (and edit) this roll? offices always (so a mistake can be corrected); teachers only as the mode says, on the day itself
function can(req,c,date,p,m=mode(req)){const u=req.user;if(m=='off')return false;
 if(m=='lesson'){if(!(p>0))return false}else if(p!==0)return false;
 if(office(u))return true;if(u.role!='teacher'||date!=today(req))return false;
 if(m=='lesson'){const l=lessonAt(c.id,date,p);return!!l&&resp(l)==u.id}
 return m=='head'&&c.head_id==u.id}
const callOf=(cid,date,p)=>db.prepare('SELECT * FROM roll_calls WHERE class_id=? AND date=? AND period=?').get(cid,date,p);
const absOf=call=>call?db.prepare('SELECT student_id FROM roll_absent WHERE call_id=?').all(call.id).map(x=>x.student_id):[];
app.post('/api/roll/mode',auth(['principal']),(req,res)=>{const m=req.body.mode;if(!MODES.includes(m))return E(res,400,'invalid');db.prepare('UPDATE schools SET roll_mode=? WHERE id=?').run(m,sid(req));audit(req.user,'roll.mode',m);res.json({ok:1})});
// today's board: what can be taken, what is done, and (offices) who is absent
app.get('/api/roll/today',auth(),(req,res)=>{const m=mode(req),u=req.user,date=today(req);if(m=='off')return res.json({mode:m,date,items:[],absent:[]});
 const sc=school(req);if(m=='lesson')SC.ensure(sid(req),date,sc);
 let items=[];
 if(m=='lesson')items=db.prepare('SELECT l.*,c.name cls,c.short,c.head_id,s.name subject,(SELECT name FROM users WHERE id=COALESCE(l.actual_id,l.sched_id)) teacher FROM lessons l JOIN classes c ON c.id=l.class_id JOIN subjects s ON s.id=l.subject_id WHERE l.school_id=? AND l.date=? AND l.status NOT IN(\'absent\',\'suspended\') ORDER BY l.period,c.name').all(sid(req),date).map(l=>({class_id:l.class_id,cls:l.cls,period:l.period,subject:l.subject,teacher:l.teacher||'',resp:resp(l)}));
 else items=db.prepare('SELECT id class_id,name cls,head_id,(SELECT name FROM users WHERE id=head_id) teacher FROM classes WHERE school_id=? ORDER BY name').all(sid(req)).map(c=>({...c,period:0,resp:c.head_id}));
 items=items.filter(i=>studs(i.class_id).length).map(i=>{const c=callOf(i.class_id,date,i.period);return{class_id:i.class_id,cls:i.cls,period:i.period,subject:i.subject||'',teacher:i.teacher||'',taken:!!c,absent:c?absOf(c).length:0,can:can(req,{id:i.class_id,head_id:i.head_id??null},date,i.period,m)}});
 if(!office(u))items=items.filter(i=>i.can);
 let absent=[];if(office(u))absent=db.prepare("SELECT s.id,s.name,c.name cls,GROUP_CONCAT(r.period) periods FROM roll_absent a JOIN roll_calls r ON r.id=a.call_id JOIN students s ON s.id=a.student_id JOIN classes c ON c.id=r.class_id WHERE r.school_id=? AND r.date=? GROUP BY s.id ORDER BY c.name,s.name").all(sid(req),date).map(x=>({...x,periods:String(x.periods).split(',').map(Number).filter(p=>p>0).sort((a,b)=>a-b)}));
 res.json({mode:m,date,items,absent})});
app.get('/api/roll/sheet',auth(),(req,res)=>{const c=cls(req,req.query.class_id),date=SC.isDate(req.query.date)?req.query.date:today(req),p=+req.query.period||0;
 if(!c)return E(res,404,'invalid');if(date>today(req))return E(res,400,'invalid');if(!can(req,c,date,p))return E(res,403,'role');
 const call=callOf(c.id,date,p),ab=new Set(absOf(call)),l=p>0?lessonAt(c.id,date,p):null;
 res.json({class_id:c.id,cls:c.name,date,period:p,subject:l?l.subject:'',taken:!!call,students:studs(c.id).map(s=>({...s,absent:ab.has(s.id)}))})});
app.post('/api/roll/save',auth(),(req,res)=>{const c=cls(req,req.body.class_id),date=req.body.date,p=+req.body.period||0,ab=req.body.absent;
 if(!c||!SC.isDate(date)||date>today(req)||!Array.isArray(ab)||ab.length>500)return E(res,400,'invalid');if(!can(req,c,date,p))return E(res,403,'role');
 if(p>0&&!lessonAt(c.id,date,p))return E(res,400,'invalid');
 const ok=new Set(studs(c.id).map(s=>s.id)),ids=[...new Set(ab.map(Number))];if(!ids.every(i=>ok.has(i)))return E(res,400,'invalid');
 tx(()=>{let call=callOf(c.id,date,p);if(call)db.prepare('UPDATE roll_calls SET taken_by=?,taken_at=? WHERE id=?').run(req.user.id,new Date().toISOString(),call.id);
  else call={id:db.prepare('INSERT INTO roll_calls(school_id,class_id,date,period,taken_by,taken_at) VALUES(?,?,?,?,?,?)').run(sid(req),c.id,date,p,req.user.id,new Date().toISOString()).lastInsertRowid};
  db.prepare('DELETE FROM roll_absent WHERE call_id=?').run(call.id);for(const i of ids)db.prepare('INSERT INTO roll_absent(call_id,student_id) VALUES(?,?)').run(call.id,i)})();
 audit(req.user,'roll.save',`${c.name} ${date} p${p} absent ${ids.length}`);res.json({ok:1,absent:ids.length})});
// students absent per day, school-wide, for the last n days that had a roll
app.get('/api/roll/trend',auth(['principal','secretary','surveillant']),(req,res)=>{const n=Math.min(60,Math.max(5,+req.query.n||14)),to=today(req),from=SC.addDays(to,-(n-1));
 const rows=db.prepare('SELECT r.date,COUNT(DISTINCT a.student_id) n FROM roll_calls r LEFT JOIN roll_absent a ON a.call_id=r.id WHERE r.school_id=? AND r.date BETWEEN ? AND ? GROUP BY r.date ORDER BY r.date').all(sid(req),from,to);res.json({mode:mode(req),rows})});
// register for one class and date range (offices and the class head): one row per student, one column per day with a roll
app.get('/api/roll/report',auth(['principal','secretary','surveillant','teacher']),(req,res)=>{const c=cls(req,req.query.class_id),m=mode(req);if(!c)return E(res,404,'invalid');
 if(req.user.role=='teacher'&&c.head_id!=req.user.id)return E(res,403,'role');
 const to=SC.isDate(req.query.to)?req.query.to:today(req),from=SC.isDate(req.query.from)?req.query.from:SC.addDays(to,-29);if(from>to||SC.addDays(from,370)<to)return E(res,400,'invalid');
 const calls=db.prepare('SELECT id,date,period FROM roll_calls WHERE class_id=? AND date BETWEEN ? AND ?').all(c.id,from,to),by={};for(const k of calls)(by[k.date]=by[k.date]||[]).push(k);
 const dates=Object.keys(by).sort(),ab=db.prepare('SELECT a.student_id,r.date FROM roll_absent a JOIN roll_calls r ON r.id=a.call_id WHERE r.class_id=? AND r.date BETWEEN ? AND ?').all(c.id,from,to),cnt={};for(const a of ab){const k=a.student_id+'|'+a.date;cnt[k]=(cnt[k]||0)+1}
 const students=studs(c.id).map(s=>{const cells=dates.map(d=>cnt[s.id+'|'+d]||0);return{id:s.id,name:s.name,matricule:s.matricule,cells,days:cells.filter(x=>x>0).length,periods:cells.reduce((a,x)=>a+x,0)}});
 res.json({class_id:c.id,cls:c.name,short:c.short||c.name,mode:m,from,to,dates,taken:dates.map(d=>by[d].length),students})});
};
module.exports.attend=(sid,student)=>{const r=db.prepare('SELECT r.date,r.period FROM roll_absent a JOIN roll_calls r ON r.id=a.call_id WHERE a.student_id=? AND r.school_id=? ORDER BY r.date DESC').all(student,sid),days=[...new Set(r.map(x=>x.date))];return{days:days.length,periods:r.filter(x=>x.period>0).length,recent:days.slice(0,8)}};
