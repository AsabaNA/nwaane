// Timetable page helpers (principal only): teachers' days as tap states, and "what can go in this cell" for the change-a-lesson window.
// Loaded after ttgenapi so /api/timetable/* module gating applies.
const{db,tx}=require('./db'),SC=require('./sched');
module.exports=(app,{auth,E,audit})=>{
 const P=auth(['principal']),sid=req=>req.user.school_id,clk=req=>SC.clock(SC.school(sid(req)));
 // "afternoon" = periods starting at 12:00 or later; if that would be none or all of them, the second half of the day
 const aft=lay=>{const N=lay.periods.length;let a=lay.periods.filter(p=>p.start>=720).map(p=>p.n);if(!a.length||a.length==N)a=lay.periods.slice(Math.ceil(N/2)).map(p=>p.n);return a};
 const morn=lay=>{const A=new Set(aft(lay));return lay.periods.map(p=>p.n).filter(n=>!A.has(n))};
 // states: on, off (all day), half (mornings only = afternoon blocked), pm (afternoons only = morning blocked), part (custom hours)
 const stateOf=(set,N,A,M)=>{if(!set||!set.size)return'on';if(set.size==N)return'off';if(set.size==A.length&&A.every(p=>set.has(p)))return'half';if(M&&set.size==M.length&&M.every(p=>set.has(p)))return'pm';return'part'};
 app.get('/api/timetable/wiz/status',P,(req,res)=>res.json({slots:db.prepare('SELECT COUNT(*) n FROM slots WHERE school_id=?').get(sid(req)).n}));
 app.get('/api/timetable/wiz/teachers',P,(req,res)=>{const s=sid(req),lay=SC.layout(s),N=lay.periods.length,A=aft(lay),M=morn(lay),ps=new Set(lay.periods.map(p=>p.n)),SEC=require('./sections');
  const only=req.query.classes?new Set(String(req.query.classes).split(',').map(Number).filter(Boolean)):null,tonly=+req.query.teacher_id||0,secs=SEC.ensure(s),sn=Object.fromEntries(secs.map(x=>[x.id,x.name]));
  const us=db.prepare("SELECT id,name FROM users WHERE school_id=? AND role='teacher' AND active=1 ORDER BY name").all(s),un={},sb={};
  for(const x of db.prepare('SELECT teacher_id,day,period FROM unavail WHERE school_id=?').all(s)){if(!lay.days.includes(x.day)||!ps.has(x.period))continue;((un[x.teacher_id]=un[x.teacher_id]||{})[x.day]=(un[x.teacher_id][x.day]||new Set())).add(x.period)}
  const outside={};   // classes outside the chosen scope each teacher also teaches in
  {const GG=require('./ttgen').gather(s,clk(req).date,'fresh'),cnm=Object.fromEntries(GG.cls.map(c=>[c.id,c.name])),csec=Object.fromEntries(db.prepare('SELECT id,section_id FROM classes WHERE school_id=?').all(s).map(c=>[c.id,c.section_id])),
   members=db.prepare('SELECT t.subject_id,t.teacher_id FROM subject_teachers t JOIN subjects b ON b.id=t.subject_id WHERE b.school_id=?').all(s);
   const put=(b,t,label,n)=>{if(!t)return;if(only&&!only.has(b.class_id)){(outside[t]??=new Set()).add(csec[b.class_id]);return}const o=sb[t]=sb[t]||{subs:{},need:0},a=o.subs[label]??=[];if(!a.includes(cnm[b.class_id]))a.push(cnm[b.class_id]);o.need+=n};
   for(const b of GG.subs){for(const l of b.lines)put(b,l.t,b.name+(l.k?' (practical)':''),l.n);
    if(!b.lines.length)put(b,b.teacher_id,b.name,0);
    for(const m of members.filter(m=>m.subject_id==b.id))if(!b.lines.some(l=>l.t==m.teacher_id))put(b,m.teacher_id,b.name,0)}}
  const list=us.filter(u=>(!only&&!tonly)||(tonly?u.id==tonly:sb[u.id]));
  res.json({days:lay.days,periods:N,teachers:list.map(u=>{const d={};let away=0;for(const k of lay.days){const st=(un[u.id]||{})[k];d[k]=stateOf(st,N,A,M);away+=st?st.size:0}
   const o=sb[u.id]||{subs:{},need:0},ns=Object.keys(o.subs),mine=SEC.ofUser(s,u.id),also=secs.length>1?[...(outside[u.id]||[])].filter(i=>sn[i]).map(i=>sn[i]):[];
   const line=ns.slice(0,3).map(n=>({n,cls:o.subs[n]}));
   return{id:u.id,name:u.name,subjects:ns.slice(0,4),more:Math.max(0,ns.length-4),line,need:o.need,free:lay.days.length*N-away,days:d,also:[...new Set(also)],nsec:mine.length}})})});
 app.post('/api/timetable/wiz/day',P,(req,res)=>{const s=sid(req),lay=SC.layout(s),{teacher_id,day,state}=req.body||{},
  t=db.prepare("SELECT id,name FROM users WHERE id=? AND school_id=? AND role='teacher' AND active=1").get(+teacher_id||0,s);
  if(!t||!lay.days.includes(+day)||!['on','off','half','pm'].includes(state))return E(res,400,'invalid');
  const ps=state=='off'?lay.periods.map(p=>p.n):state=='half'?aft(lay):state=='pm'?morn(lay):[];
  tx(()=>{db.prepare('DELETE FROM unavail WHERE teacher_id=? AND day=?').run(t.id,+day);for(const p of ps)db.prepare('INSERT OR IGNORE INTO unavail(school_id,teacher_id,day,period) VALUES(?,?,?,?)').run(s,t.id,+day,p)})();
  audit(req.user,'unavail.day',`${t.name} d${day} ${state}`);
  res.json({ok:1,clashes:SC.clashes(s,clk(req).date).filter(x=>x.kind=='unavail'&&x.teacher_id==t.id).length})});
 app.get('/api/timetable/wiz/options',P,(req,res)=>{const s=sid(req),q=req.query,date=SC.isDate(q.date)?q.date:clk(req).date,day=+q.day,period=+q.period,
  c=db.prepare('SELECT id,name FROM classes WHERE id=? AND school_id=?').get(+q.class_id||0,s);if(!c||!(day>=1&&day<=7)||!(period>=1&&period<=14))return E(res,400,'invalid');
  const g=require('./ttgen').gather(s,date,'fresh',{classes:[c.id]}),sl=SC.slotsOn(s,date,'AND s.class_id=?',c.id),tn=Object.fromEntries(db.prepare('SELECT id,name FROM users WHERE school_id=?').all(s).map(u=>[u.id,u.name])),cnt={};
  for(const x of sl){const k=x.subject_id+'.'+(x.kind||0)+'.'+(x.teacher_id||0);cnt[k]=(cnt[k]||0)+1}
  const here=sl.find(x=>x.day==day&&x.period==period),items=[];
  for(const b of g.subs.filter(z=>z.class_id==c.id).sort((a,b)=>a.name.localeCompare(b.name))){
   for(const l of(b.lines.length?b.lines:[{k:0,t:b.teacher_id||0,n:null}])){const busy=l.t?SC.busyWith(s,l.t,day,period,date,c.id):[],key=b.id+'.'+l.k+'.'+(l.t||0);
    items.push({key,id:b.id,k:l.k,name:b.name,teacher_id:l.t||null,teacher:l.t?tn[l.t]:null,want:l.n,have:cnt[key]||0,busy:busy[0]?busy[0].cls:null,unavail:!!(l.t&&SC.unavailable(l.t,day,period))})}}
  res.json({cls:c.name,here:here?here.subject_id+'.'+(here.kind||0)+'.'+(here.teacher_id||0):null,items})});

 // Overview: who has a timetable. Classes grouped by section (one box "all" when the school has a single section), teachers likewise.
 app.get('/api/timetable/overview',P,(req,res)=>{const s=sid(req),ck=clk(req),SEC=require('./sections'),secs=SEC.ensure(s),multi=secs.length>1,lay=SC.layout(s);
  const sl=SC.slotsOn(s,ck.date).filter(x=>lay.days.includes(x.day)),teamOf={};{const A=(i,t)=>t&&(teamOf[i]??=new Set()).add(t);for(const b of db.prepare('SELECT id,teacher_id FROM subjects WHERE school_id=?').all(s))A(b.id,b.teacher_id);for(const b of db.prepare('SELECT t.subject_id,t.teacher_id FROM subject_teachers t JOIN subjects b ON b.id=t.subject_id WHERE b.school_id=?').all(s))A(b.subject_id,b.teacher_id);for(const b of db.prepare('SELECT p.subject_id,p.teacher_id FROM subject_prac p JOIN subjects b ON b.id=p.subject_id WHERE b.school_id=?').all(s))A(b.subject_id,b.teacher_id)}
   
   const un=new Set(db.prepare('SELECT teacher_id||\':\'||day||\':\'||period k FROM unavail WHERE school_id=?').all(s).map(r=>r.k)),tm={};
  for(const x of sl)if(x.teacher_id)(tm[x.teacher_id+':'+x.day+':'+x.period]??=new Set()).add(x.class_id);
  const cl={},tl={};
  for(const x of sl){const c=cl[x.class_id]??={n:0,attn:0};c.n++;
   if(x.teacher_id){const t=tl[x.teacher_id]??={n:0,attn:0};t.n++;
    if(tm[x.teacher_id+':'+x.day+':'+x.period].size>1||un.has(x.teacher_id+':'+x.day+':'+x.period)||!(teamOf[x.subject_id]||new Set()).has(x.teacher_id)){c.attn++;t.attn++}}}
  const classes=db.prepare('SELECT id,name,section_id FROM classes WHERE school_id=? ORDER BY name').all(s).map(c=>({id:c.id,name:c.name,sec:c.section_id,n:(cl[c.id]||{}).n||0,attn:(cl[c.id]||{}).attn||0}));
  const teachers=db.prepare("SELECT id,name FROM users WHERE school_id=? AND role='teacher' AND active=1 ORDER BY name").all(s).map(u=>({id:u.id,name:u.name,secs:SEC.ofUser(s,u.id),n:(tl[u.id]||{}).n||0,attn:(tl[u.id]||{}).attn||0}));
  const numc=(a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true});
  res.json({multi,date:ck.date,sections:secs.map(x=>({id:x.id,name:x.name,classes:classes.filter(c=>c.sec==x.id).sort(numc),teachers:teachers.filter(t=>t.secs.includes(x.id))})),
   total:classes.length,done:classes.filter(c=>c.n>0).length,teachers_total:teachers.length,teachers_done:teachers.filter(t=>t.n>0).length})});
};
