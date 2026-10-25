// Regular timetable generator API (principal only). Loaded after phase4 routes so /api/timetable/* module gating applies.
const{db,tx}=require('./db'),SC=require('./sched'),G=require('./ttgen'),W=require('./ttswap');
module.exports=(app,{auth,E,audit})=>{
 const P=auth(['principal']),sid=req=>req.user.school_id,num=(v,a,b)=>Number.isInteger(+v)&&v!==''&&v!==null&&+v>=a&&+v<=b;
 const clk=req=>SC.clock(SC.school(sid(req)));
 // ---- requirements
 app.get('/api/timetable/gen/req',P,(req,res)=>{const s=sid(req),sc=SC.school(s),lay=SC.layout(s,sc),cells=lay.days.length*lay.periods.length;
  const subs=db.prepare('SELECT b.id,b.class_id,b.name,b.coef,b.parts,b.teacher_id,u.name teacher,r.per_week,r.max_day,r.doubles,r.split_ok FROM subjects b LEFT JOIN users u ON u.id=b.teacher_id LEFT JOIN gen_req r ON r.subject_id=b.id WHERE b.school_id=? ORDER BY b.id').all(s),
   team=db.prepare('SELECT t.subject_id,t.teacher_id,t.per_week,u.name teacher FROM subject_teachers t JOIN subjects b ON b.id=t.subject_id JOIN users u ON u.id=t.teacher_id WHERE b.school_id=? ORDER BY u.name').all(s),
   prac=db.prepare('SELECT p.subject_id,p.teacher_id,p.per_week,p.doubles,u.name teacher FROM subject_prac p JOIN subjects b ON b.id=p.subject_id LEFT JOIN users u ON u.id=p.teacher_id WHERE b.school_id=?').all(s);
  const cur={};for(const x of SC.slotsOn(s,clk(req).date))cur[x.subject_id]=(cur[x.subject_id]||0)+1;
  res.json({cfg:G.cfgOf(sc),cells,days:lay.days.length,periods:lay.periods.length,
   classes:db.prepare('SELECT id,name FROM classes WHERE school_id=? ORDER BY name').all(s).map(c=>({...c,subjects:subs.filter(b=>b.class_id==c.id).map(b=>{const tm=team.filter(x=>x.subject_id==b.id),pr=prac.find(x=>x.subject_id==b.id);
    return{id:b.id,name:b.name,coef:b.coef,teacher_id:b.teacher_id,teacher:b.teacher,per_week:b.per_week,max_day:b.max_day||2,doubles:b.doubles||0,split_ok:b.split_ok||0,current:cur[b.id]||0,parts:b.parts||0,
     team:tm.map(x=>({teacher_id:x.teacher_id,teacher:x.teacher,per_week:x.per_week})),prac:pr?{teacher_id:pr.teacher_id,teacher:pr.teacher,per_week:pr.per_week,doubles:pr.doubles}:null}})}))})});
 app.post('/api/timetable/gen/req',P,(req,res)=>{const s=sid(req),lay=SC.layout(s),cells=lay.days.length*lay.periods.length,it=req.body&&req.body.items;
  if(!Array.isArray(it)||!it.length||it.length>600)return E(res,400,'invalid');
  const own=new Set(db.prepare('SELECT id FROM subjects WHERE school_id=?').all(s).map(r=>r.id)),tch=new Set(db.prepare("SELECT id FROM users WHERE school_id=? AND role='teacher' AND active=1").all(s).map(r=>r.id));
  for(const x of it){if(!own.has(+x.subject_id)||!num(x.per_week,0,cells)||!num(x.max_day,1,4)||!num(x.doubles,0,10)||(x.split_ok!=null&&!num(x.split_ok,0,1)))return E(res,400,'invalid');
   if(x.teachers!=null){if(!Array.isArray(x.teachers)||x.teachers.length>8||!x.teachers.every(t=>tch.has(+t.teacher_id)&&num(t.per_week,0,cells)))return E(res,400,'invalid');
    if(new Set(x.teachers.map(t=>+t.teacher_id)).size!=x.teachers.length)return E(res,400,'invalid');
    if(x.teachers.reduce((n,t)=>n+ +t.per_week,0)>+x.per_week)return E(res,400,'invalid')}
   if(x.prac!=null&&x.prac!==false&&!(x.prac&&num(x.prac.per_week,1,cells)&&num(x.prac.doubles||0,0,10)&&(!x.prac.teacher_id||tch.has(+x.prac.teacher_id))))return E(res,400,'invalid')}
  tx(()=>{for(const x of it){const pw=+x.per_week,dbl=Math.min(+x.doubles,Math.floor(pw/2)),md=Math.max(+x.max_day,dbl?2:1);
   db.prepare('INSERT INTO gen_req(subject_id,school_id,per_week,max_day,doubles,split_ok) VALUES(?,?,?,?,?,?) ON CONFLICT(subject_id) DO UPDATE SET per_week=excluded.per_week,max_day=excluded.max_day,doubles=excluded.doubles,split_ok=COALESCE(?,split_ok)').run(+x.subject_id,s,pw,md,dbl,x.split_ok?1:0,x.split_ok==null?null:(x.split_ok?1:0));
   if(x.teachers!=null){db.prepare('DELETE FROM subject_teachers WHERE subject_id=?').run(+x.subject_id);for(const t of x.teachers)db.prepare('INSERT INTO subject_teachers(subject_id,teacher_id,per_week) VALUES(?,?,?)').run(+x.subject_id,+t.teacher_id,+t.per_week)}
   if(x.prac===false||x.prac===null&&'prac'in x)db.prepare('DELETE FROM subject_prac WHERE subject_id=?').run(+x.subject_id);
   else if(x.prac)db.prepare('INSERT INTO subject_prac(subject_id,teacher_id,per_week,doubles) VALUES(?,?,?,?) ON CONFLICT(subject_id) DO UPDATE SET teacher_id=excluded.teacher_id,per_week=excluded.per_week,doubles=excluded.doubles').run(+x.subject_id,+x.prac.teacher_id||null,+x.prac.per_week,Math.min(+x.prac.doubles||0,Math.floor(+x.prac.per_week/2)))}})();
  audit(req.user,'timetable.gen.req',it.length+' subjects');res.json({ok:1,n:it.length})});
 // take the weekly counts from the timetable in force today (only subjects with no requirement yet, unless overwrite)
 app.post('/api/timetable/gen/req/fill',P,(req,res)=>{const s=sid(req),ow=!!(req.body&&req.body.overwrite),cur={};
  for(const x of SC.slotsOn(s,clk(req).date))cur[x.subject_id]=(cur[x.subject_id]||0)+1;let n=0;
  for(const b of db.prepare('SELECT b.id,r.subject_id has FROM subjects b LEFT JOIN gen_req r ON r.subject_id=b.id WHERE b.school_id=?').all(s)){
   if(!cur[b.id]||(b.has&&!ow))continue;
   db.prepare('INSERT INTO gen_req(subject_id,school_id,per_week,max_day,doubles) VALUES(?,?,?,2,0) ON CONFLICT(subject_id) DO UPDATE SET per_week=excluded.per_week').run(b.id,s,cur[b.id]);n++}
  audit(req.user,'timetable.gen.fill',n+' subjects');res.json({ok:1,n})});
 app.post('/api/timetable/gen/cfg',P,(req,res)=>{const b=req.body||{};
  if(!num(b.heavy,1,10)||!num(b.tmax,0,14))return E(res,400,'invalid');
  const c={morning:b.morning?1:0,gaps:b.gaps?1:0,heavy:+b.heavy,tmax:+b.tmax,split:b.split?1:0};
  db.prepare('UPDATE schools SET gen_cfg=? WHERE id=?').run(JSON.stringify(c),sid(req));res.json({ok:1,cfg:c})});
 // ---- check, preview, apply
 const argsOf=(req,res)=>{const b=req.body||{},q=req.query||{},from=b.from||q.from||clk(req).date,mode=(b.mode||q.mode)=='fill'?'fill':'fresh';
  if(!SC.isDate(from)){E(res,400,'invalid');return null}
  // who the timetable is for: classes (ids, also used for a section), one teacher, or nobody given = every class with requirements
  let cl=b.classes!=null?b.classes:q.classes;if(typeof cl=='string')cl=cl.split(',').filter(Boolean);
  const own=new Set(db.prepare('SELECT id FROM classes WHERE school_id=?').all(sid(req)).map(r=>r.id)),opt={};
  if(Array.isArray(cl)&&cl.length){if(cl.length>200||!cl.every(x=>own.has(+x))){E(res,400,'invalid');return null}opt.classes=cl.map(Number)}
  const tid=+(b.teacher_id||q.teacher_id)||0;if(tid){if(!db.prepare("SELECT 1 FROM users WHERE id=? AND school_id=? AND role='teacher'").get(tid,sid(req))){E(res,400,'invalid');return null}opt.teacher=tid}
  return{from,mode,opt}};
 app.get('/api/timetable/gen/check',P,(req,res)=>{const a=argsOf(req,res);if(!a)return;res.json(G.check(G.gather(sid(req),a.from,a.mode,a.opt)))});
 app.post('/api/timetable/gen',P,(req,res)=>{const a=argsOf(req,res);if(!a)return;const s=sid(req),ck=clk(req);
  if(a.from<ck.date)return E(res,400,'gen_past');if(SC.lockedFrom(s,a.from))return E(res,409,'mlocked');
  const g=G.gather(s,a.from,a.mode,a.opt),chk=G.check(g);
  if(!g.subs.some(b=>b.lines.some(l=>l.n>0&&(!g.only||g.only.has(b.class_id))&&(!g.tmode||l.t==g.tmode))))return E(res,400,'gen_noreq');
  const seed=Number.isInteger(+req.body.seed)?+req.body.seed:Math.floor(Math.random()*1e9),r=G.build(g,seed),ops=G.diff(g,r.cells,r.scope);
  db.prepare("DELETE FROM gen_prop WHERE school_id=? AND at<?").run(s,new Date(Date.now()-864e5).toISOString());
  const id=db.prepare('INSERT INTO gen_prop(school_id,at,by_id,from_date,mode,seed,cells,stats) VALUES(?,?,?,?,?,?,?,?)').run(s,new Date().toISOString(),req.user.id,a.from,a.mode,seed,JSON.stringify({cells:r.cells,scope:r.scope,opt:a.opt}),JSON.stringify(r.stats)).lastInsertRowid;
  res.json(view(s,id,g,r.cells,r.scope,r.stats,{seed,from:a.from,mode:a.mode,ops:ops.length,chk}))});
 // proposal as the screen needs it
 const view=(s,id,g,cells,scope,stats,x)=>{const cn=Object.fromEntries(g.cls.map(c=>[c.id,c.name])),sn=Object.fromEntries(g.subs.map(b=>[b.id,b.name])),tn=Object.fromEntries(db.prepare('SELECT id,name FROM users WHERE school_id=?').all(s).map(u=>[u.id,u.name]));
  return{id,seed:x.seed,from:x.from,mode:x.mode,changes:x.ops,stats,days:g.lay.days,periods:g.lay.periods,breaks:g.lay.breaks,off:Object.fromEntries(g.cls.filter(c=>g.off[c.id].size).map(c=>[c.id,[...g.off[c.id]]])),split:g.cfg.split||0,adj:x.adj,scope,check:x.chk?{bad:x.chk.bad,noreq:x.chk.noreq.length,noteacher:x.chk.noteacher.length}:undefined,
   cells:cells.map(c=>({c:c.c,cls:cn[c.c],d:c.d,p:c.p,s:c.s,k:c.k||0,subject:sn[c.s],t:c.t,teacher:c.t?tn[c.t]:null}))}};
 const prop=(req,res)=>{const s=sid(req),row=db.prepare('SELECT * FROM gen_prop WHERE id=? AND school_id=?').get(+req.params.id||0,s);if(!row){E(res,404,'invalid');return null}
  const ck=clk(req);if(row.from_date<ck.date){E(res,400,'gen_past');return null}const P_=JSON.parse(row.cells),g=G.gather(s,row.from_date,row.mode,P_.opt||{});return{s,row,g,P_}};
 // what can go in one cell of the proposal: by class (teaching lines of that class) or by teacher (that teacher's lines in classes of the proposal)
 const tnames=s=>Object.fromEntries(db.prepare('SELECT id,name FROM users WHERE school_id=?').all(s).map(u=>[u.id,u.name]));
 const lineKey=(b,l)=>b.id+'.'+l.k+'.'+(l.t||0);
 app.get('/api/timetable/gen/:id/options',P,(req,res)=>{const o=prop(req,res);if(!o)return;const{g,P_}=o,q=req.query,d=+q.day,p=+q.period;
  if(!g.days.includes(d)||!(p>=1&&p<=g.np))return E(res,400,'invalid');
  const sc=new Set(P_.scope),at={},tbusy={},tn=tnames(o.s);for(const c of P_.cells){at[c.c+':'+c.d+':'+c.p]=c;if(c.t)tbusy[c.t+':'+c.d+':'+c.p]=c.c}
  for(const x of g.cur)if(!sc.has(x.class_id)&&x.teacher_id)tbusy[x.teacher_id+':'+x.day+':'+x.period]=x.class_id;
  const cn=Object.fromEntries(g.cls.map(c=>[c.id,c.name])),cnt={};for(const c of P_.cells){const k=c.s+'.'+(c.k||0)+'.'+(c.t||0);cnt[k]=(cnt[k]||0)+1}
  const lns=b=>b.lines.length?b.lines.map(l=>({b,l,has:1})):[{b,l:{k:0,t:b.teacher_id||0,n:null},has:0}];
  const item=({b,l},cid)=>{const bz=l.t?tbusy[l.t+':'+d+':'+p]:null,here=at[cid+':'+d+':'+p],key=lineKey(b,l);
   return{key,id:b.id,k:l.k,name:b.name,class_id:b.class_id,cls:cn[b.class_id],teacher_id:l.t||null,teacher:l.t?tn[l.t]:null,want:l.n,have:cnt[key]||0,
    busy:l.t&&bz&&bz!=cid?cn[bz]:null,unavail:!!(l.t&&g.un.has(l.t+':'+d+':'+p)),taken:here&&lineKey(b,{k:here.k||0,t:here.t})!=key?here.s:null}};
  const hereKey=c=>c?c.s+'.'+(c.k||0)+'.'+(c.t||0):'';
  if(q.teacher_id){const t=+q.teacher_id;const items=g.subs.filter(b=>sc.has(b.class_id)).flatMap(lns).filter(x=>x.l.t==t).map(x=>{const i=item(x,x.b.class_id),h=at[x.b.class_id+':'+d+':'+p];i.classBusy=h&&lineKey(x.b,{k:h.k||0,t:h.t})!=i.key?g.subs.find(z=>z.id==h.s)?.name:null;return i});
   return res.json({teacher_id:t,items,here:hereKey(Object.values(at).find(c=>c.t==t&&c.d==d&&c.p==p))})}
  const cid=+q.class_id;if(!sc.has(cid))return E(res,400,'invalid');
  res.json({class_id:cid,cls:cn[cid],items:g.subs.filter(b=>b.class_id==cid).flatMap(lns).map(x=>item(x,cid)),here:hereKey(at[cid+':'+d+':'+p])})});
 // edit one cell: subject_id null clears it. teacher_id / kind pick the teaching line (main teacher, a team member or the practical session)
 app.post('/api/timetable/gen/:id/set',P,(req,res)=>{const o=prop(req,res);if(!o)return;const{s,row,g,P_}=o,b=req.body||{},cid=+b.class_id,d=+b.day,p=+b.period,sc=new Set(P_.scope);
  if(!sc.has(cid)||!g.days.includes(d)||!(p>=1&&p<=g.np))return E(res,400,'invalid');
  let cells=P_.cells.filter(c=>!(c.c==cid&&c.d==d&&c.p==p));
  if(b.subject_id){const sub=g.subs.find(z=>z.id==+b.subject_id&&z.class_id==cid);if(!sub)return E(res,400,'invalid');
   if(g.off[cid]&&g.off[cid].has(d))return E(res,409,'classoff');
   const k=b.kind?1:0,t=+b.teacher_id||(k?((sub.prac||{}).teacher_id||0):sub.teacher_id||0),ok=new Set([sub.teacher_id,...sub.lines.map(l=>l.t)].filter(Boolean));
   if(t&&!ok.has(t))return E(res,400,'invalid');
   if(t){const other=cells.find(c=>c.t==t&&c.d==d&&c.p==p)||g.cur.find(x=>!sc.has(x.class_id)&&x.teacher_id==t&&x.day==d&&x.period==p);if(other)return E(res,409,'busy');
    if(g.un.has(t+':'+d+':'+p)&&!b.force)return E(res,409,'unavail')}
   cells.push({c:cid,d,p,s:sub.id,k,t:t||null})}
  const ops=G.diff(g,cells,P_.scope),stats=G.restat(g,cells);
  db.prepare('UPDATE gen_prop SET cells=?,stats=? WHERE id=?').run(JSON.stringify({cells,scope:P_.scope,opt:P_.opt}),JSON.stringify(stats),row.id);
  res.json(view(s,row.id,g,cells,P_.scope,stats,{seed:row.seed,from:row.from_date,mode:row.mode,ops:ops.length}))});
 // Bring the proposal in line with changed requirements / availability: only lessons that must go are removed, only missing ones are added.
 // body: {subject_id?: one subject, drop?: also remove lessons that now break a rule}
 app.post('/api/timetable/gen/:id/adjust',P,(req,res)=>{const o=prop(req,res);if(!o)return;const{s,row,g,P_}=o,b=req.body||{};
  if(b.subject_id&&!g.subs.some(z=>z.id==+b.subject_id))return E(res,400,'invalid');
  const r=G.reconcile(g,P_.cells,P_.scope,{subject:+b.subject_id||0,drop:!!b.drop}),ops=G.diff(g,r.cells,P_.scope),stats=G.restat(g,r.cells);
  db.prepare('UPDATE gen_prop SET cells=?,stats=? WHERE id=?').run(JSON.stringify({cells:r.cells,scope:P_.scope,opt:P_.opt}),JSON.stringify(stats),row.id);
  res.json(view(s,row.id,g,r.cells,P_.scope,stats,{seed:row.seed,from:row.from_date,mode:row.mode,ops:ops.length,adj:{added:r.added.length,removed:r.removed.length,short:r.short.reduce((n,x)=>n+x.n,0),moved:r.removed.filter(x=>r.added.some(y=>y.s==x.s&&y.c==x.c)).length}}))});
 // days a class does not come to school (empty = every school day). Classes are given as ids; days are school days.
 app.get('/api/timetable/class-days',P,(req,res)=>{const s=sid(req),lay=SC.layout(s),SEC=require('./sections'),secs=SEC.ensure(s);
  res.json({days:lay.days,sections:secs.map(x=>({id:x.id,name:x.name})),classes:db.prepare('SELECT id,name,section_id sec,off_days FROM classes WHERE school_id=? ORDER BY name').all(s).map(c=>({id:c.id,name:c.name,sec:c.sec,off:String(c.off_days||'').split(',').filter(Boolean).map(Number).filter(d=>lay.days.includes(d))}))})});
 app.post('/api/timetable/class-days',P,(req,res)=>{const s=sid(req),lay=SC.layout(s),b=req.body||{},own=new Set(db.prepare('SELECT id FROM classes WHERE school_id=?').all(s).map(r=>r.id)),
   norm=a=>Array.isArray(a)?[...new Set(a.map(Number))].sort():null;
  // either one list of days for several classes, or a list per class: items:[{class_id,off}]
  let items=Array.isArray(b.items)?b.items.map(x=>({id:+x.class_id,off:norm(x.off)})):(Array.isArray(b.class_ids)?b.class_ids.map(i=>({id:+i,off:norm(b.off)})):[]);
  if(!items.length||items.length>300||!items.every(x=>own.has(x.id)&&x.off&&x.off.every(d=>lay.days.includes(d))&&x.off.length<lay.days.length))return E(res,400,'invalid');
  for(const x of items)db.prepare('UPDATE classes SET off_days=? WHERE id=? AND school_id=?').run(x.off.join(','),x.id,s);
  audit(req.user,'classes.days',`${items.length} classes`);res.json({ok:1,n:items.length})});
 app.post('/api/timetable/gen/apply',P,(req,res)=>{const s=sid(req),ck=clk(req),row=db.prepare('SELECT * FROM gen_prop WHERE id=? AND school_id=?').get(+(req.body||{}).id||0,s);
  if(!row)return E(res,404,'invalid');if(row.from_date<ck.date)return E(res,400,'gen_past');if(SC.lockedFrom(s,row.from_date))return E(res,409,'mlocked');
  const P_=JSON.parse(row.cells),g=G.gather(s,row.from_date,row.mode,P_.opt||{}),ops=G.diff(g,P_.cells,P_.scope);
  // the proposal must still fit the current rules (teachers made unavailable, subjects removed since the preview)
  const own=new Set(g.subs.map(b=>b.id));
  for(const o of ops)if(o.s&&(!own.has(o.s)||g.un.has(o.t+':'+o.d+':'+o.p)))return E(res,409,'gen_stale');
  for(const o of ops)SC.applySlot(s,o.c,o.d,o.p,o.s,o.t,row.from_date,o.k);
  db.prepare('DELETE FROM gen_prop WHERE id=?').run(row.id);
  audit(req.user,'timetable.gen.apply',`${ops.length} cells from ${row.from_date} (${row.mode})`);
  res.json({ok:1,changed:ops.length,clashes:SC.clashes(s,row.from_date).length})});

 // a block of n consecutive periods starting at A swaps with the n periods starting at B, lesson by lesson
 const nArg=(v,g)=>Math.max(1,Math.min(g.np,Math.floor(+v)||1));
 const pairsOf=(A,B,n)=>Array.from({length:n},(_,i)=>[{d:A.d,p:A.p+i},{d:B.d,p:B.p+i}]);
 const fits=(A,B,n,g)=>A.p+n-1<=g.np&&B.p+n-1<=g.np;
 const evalB=(ctx,g,A,B,n)=>fits(A,B,n,g)?W.evaluateMany(ctx,pairsOf(A,B,n)):[{code:'range'}];
 const allMap=(ctx,g,A,n=1)=>{const m={};for(const d of g.days)for(let p=1;p<=g.np;p++){if(d==A.d&&p==A.p)continue;const R=evalB(ctx,g,A,{d,p},n);if(R.length)m[d+':'+p]=R}return m};
 // ---- swap two cells of one class (drag and drop). check:1 only answers; otherwise the swap is made when it is valid.
 const cellArg=(v,g)=>v&&g.days.includes(+v.d)&&+v.p>=1&&+v.p<=g.np?{d:+v.d,p:+v.p}:null;
 const subCtx=(g)=>{const m=Object.fromEntries(g.subs.map(b=>[b.id,b])),tn=Object.fromEntries(db.prepare('SELECT id,name FROM users WHERE school_id=?').all(g.sc.id).map(u=>[u.id,u.name]));
  return{np:g.np,ok2:g.ok2,tmax:g.cfg.tmax,sub:(id,k)=>({name:(m[id]||{}).name||'?',md:k?2:Math.max((m[id]||{}).max_day||2,(m[id]||{}).doubles?2:1),sp:G.splitOk(g,m[id])}),un:(t,d,p)=>g.un.has(t+':'+d+':'+p),tname:t=>tn[t]||'?'}};
 app.post('/api/timetable/gen/:id/swap',P,(req,res)=>{const o=prop(req,res);if(!o)return;const{s,row,g,P_}=o,b=req.body||{},cid=+b.class_id,A=cellArg(b.a,g),B=b.all?A:cellArg(b.b,g),sc=new Set(P_.scope);
  if(!sc.has(cid)||!A||!B)return E(res,400,'invalid');
  const cells={},cn=Object.fromEntries(g.cls.map(c=>[c.id,c.name])),tbz={};
  for(const c of P_.cells){if(c.c==cid)cells[c.d+':'+c.p]={s:c.s,t:c.t,k:c.k||0};else if(c.t)tbz[c.t+':'+c.d+':'+c.p]=c.c}
  for(const x of g.cur)if(!sc.has(x.class_id)&&x.teacher_id)tbz[x.teacher_id+':'+x.day+':'+x.period]=x.class_id;
  const ctx={...subCtx(g),coff:d=>!!(g.off[cid]&&g.off[cid].has(d)),cells,tbusy:(t,d,p)=>tbz[t+':'+d+':'+p]?cn[tbz[t+':'+d+':'+p]]:null,tother:(t,d)=>P_.cells.filter(c=>c.c!=cid&&c.t==t&&c.d==d).length},n=nArg(b.n,g),R=evalB(ctx,g,A,B,n);
  if(b.all)return res.json({map:allMap(ctx,g,A,n)});
  if(R.length)return res.status(b.check?200:409).json({ok:false,error:'swap',reasons:R});
  if(b.check)return res.json({ok:true});
  const PR=pairsOf(A,B,n),hit=new Set(PR.flat().map(x=>x.d+':'+x.p));let out=P_.cells.filter(c=>!(c.c==cid&&hit.has(c.d+':'+c.p)));
  for(const[X,Y]of PR){const a=cells[X.d+':'+X.p],z=cells[Y.d+':'+Y.p];if(a)out.push({c:cid,d:Y.d,p:Y.p,s:a.s,t:a.t,k:a.k||0});if(z)out.push({c:cid,d:X.d,p:X.p,s:z.s,t:z.t,k:z.k||0})}
  const ops=G.diff(g,out,P_.scope),stats=G.restat(g,out);db.prepare('UPDATE gen_prop SET cells=?,stats=? WHERE id=?').run(JSON.stringify({cells:out,scope:P_.scope,opt:P_.opt}),JSON.stringify(stats),row.id);
  res.json(view(s,row.id,g,out,P_.scope,stats,{seed:row.seed,from:row.from_date,mode:row.mode,ops:ops.length}))});
 // the same for the timetable in force (from a date onward)
 app.post('/api/timetable/swap',P,(req,res)=>{const s=sid(req),ck=clk(req),b=req.body||{},from=b.from||ck.date,g=G.gather(s,SC.isDate(from)?from:ck.date,'fresh'),cid=+b.class_id,A=cellArg(b.a,g),B=b.all?A:cellArg(b.b,g);
  if(!SC.isDate(from)||!A||!B||!g.cls.some(c=>c.id==cid))return E(res,400,'invalid');
  if(SC.lockedFrom(s,from))return E(res,409,'mlocked');
  if(from<ck.date&&db.prepare("SELECT 1 FROM lessons WHERE class_id=? AND date>=? AND status!='pending' LIMIT 1").get(cid,from))return E(res,409,'past');
  const cells={};for(const x of g.cur)if(x.class_id==cid)cells[x.day+':'+x.period]={s:x.subject_id,t:x.teacher_id,k:x.kind||0};
  const cn=Object.fromEntries(g.cls.map(c=>[c.id,c.name])),ctx={...subCtx(g),coff:d=>!!(g.off[cid]&&g.off[cid].has(d)),cells,tbusy:(t,d,p)=>{const r=SC.busyWith(s,t,d,p,from,cid);return r[0]?r[0].cls:null},tother:(t,d)=>g.cur.filter(x=>x.class_id!=cid&&x.teacher_id==t&&x.day==d).length},n=nArg(b.n,g),R=evalB(ctx,g,A,B,n);
  if(b.all)return res.json({map:allMap(ctx,g,A,n)});
  if(R.length)return res.status(b.check?200:409).json({ok:false,error:'swap',reasons:R});
  if(b.check)return res.json({ok:true});
  for(const[X,Y]of pairsOf(A,B,n)){const a=cells[X.d+':'+X.p],z=cells[Y.d+':'+Y.p];
   SC.applySlot(s,cid,Y.d,Y.p,a?a.s:null,a?a.t:null,from,a?a.k:0);SC.applySlot(s,cid,X.d,X.p,z?z.s:null,z?z.t:null,from,z?z.k:0)}
  audit(req.user,'timetable.swap',`${cn[cid]} d${A.d}p${A.p} <-> d${B.d}p${B.p} x${n} from ${from}`);res.json({ok:true})});
};
