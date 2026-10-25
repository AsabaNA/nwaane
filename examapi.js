// Exam timetable API: groups, generate, view, edit one paper, change a subject's duration (repacks), re-pick invigilators.
const{db,tx}=require('./db'),SC=require('./sched'),SECT=require('./sections'),R=require('./report'),X=require('./examtt');
const{key}=X;
module.exports=(app,{auth,E,audit,school})=>{
 const adm=auth(['principal','secretary']),sid=req=>req.user.school_id;
 const tmin=v=>{if(typeof v=='number')return Math.round(v);const m=/^(\d{1,2}):(\d{2})$/.exec(String(v||''));return m?+m[1]*60+ +m[2]:NaN};
 const classes=req=>db.prepare('SELECT id,name,section_id FROM classes WHERE school_id=? ORDER BY name').all(sid(req));
 // ---- class groups (classes that write shared subjects together)
 const groups=req=>db.prepare('SELECT * FROM class_groups WHERE school_id=? ORDER BY name').all(sid(req)).map(g=>({...g,class_ids:db.prepare('SELECT class_id FROM class_group_classes WHERE group_id=?').all(g.id).map(r=>r.class_id)}));
 app.get('/api/examtt/groups',adm,(req,res)=>res.json(groups(req)));
 app.post('/api/examtt/groups',adm,(req,res)=>{const b=req.body||{},name=String(b.name||'').trim().slice(0,40),ids=[...new Set((b.class_ids||[]).map(Number))],cl=classes(req);
  if(!name)return E(res,400,'grp_name');if(ids.length<2)return E(res,400,'grp_few');if(ids.some(i=>!cl.some(c=>c.id==i)))return E(res,400,'invalid');
  const id=+b.id||0;if(id&&!db.prepare('SELECT 1 FROM class_groups WHERE id=? AND school_id=?').get(id,sid(req)))return E(res,404,'invalid');
  for(const i of ids){const g=db.prepare('SELECT group_id FROM class_group_classes WHERE class_id=?').get(i);if(g&&g.group_id!=id)return E(res,409,'grp_taken')}
  if(db.prepare('SELECT 1 FROM class_groups WHERE school_id=? AND lower(name)=? AND id!=?').get(sid(req),name.toLowerCase(),id))return E(res,409,'grp_dup');
  const gid=tx(()=>{let g=id;if(g)db.prepare('UPDATE class_groups SET name=?,section_id=? WHERE id=?').run(name,cl.find(c=>c.id==ids[0]).section_id,g);else g=Number(db.prepare('INSERT INTO class_groups(school_id,section_id,name) VALUES(?,?,?)').run(sid(req),cl.find(c=>c.id==ids[0]).section_id,name).lastInsertRowid);
   db.prepare('DELETE FROM class_group_classes WHERE group_id=?').run(g);for(const i of ids)db.prepare('INSERT INTO class_group_classes(group_id,class_id) VALUES(?,?)').run(g,i);return g})();
  audit(req.user,'examgroup.save',name);res.json({ok:1,id:gid})});
 app.delete('/api/examtt/groups/:id',adm,(req,res)=>{if(!db.prepare('DELETE FROM class_groups WHERE id=? AND school_id=?').run(+req.params.id,sid(req)).changes)return E(res,404,'invalid');res.json({ok:1})});
 // ---- what the setup screen needs
 app.get('/api/examtt/options',adm,(req,res)=>{const s=sid(req),sc=school(req),lay=SC.layout(s,sc),per=lay.periods;SECT.ensure(s);
  res.json({classes:classes(req).map(c=>({...c,n:db.prepare('SELECT COUNT(*) n FROM students WHERE class_id=? AND active=1').get(c.id).n})),sections:db.prepare('SELECT id,name FROM sections WHERE school_id=? ORDER BY pos,id').all(s),groups:groups(req),
   subjects:db.prepare('SELECT s.id,s.class_id,s.name,s.teacher_id FROM subjects s WHERE s.school_id=? ORDER BY s.name').all(s),nopaper:db.prepare('SELECT name FROM exam_nopaper WHERE school_id=?').all(s).map(r=>r.name),
   day_start:per.length?per[0].start:450,day_end:per.length?per[per.length-1].end:900,period_min:per.length?per[0].end-per[0].start:40,periods:per,breaks:lay.breaks,days:lay.days,closed:db.prepare("SELECT date,label FROM closed WHERE school_id=? AND date>=date('now','-60 day')").all(s),seqs:R.seqs(sc)})});
 app.get('/api/examtt',adm,(req,res)=>res.json(db.prepare('SELECT id,name,start_date,end_date,classes,created,(SELECT COUNT(*) FROM exam_paper p WHERE p.tt_id=exam_tt.id) papers,(SELECT COUNT(*) FROM exam_paper p WHERE p.tt_id=exam_tt.id AND p.date IS NULL) unplaced FROM exam_tt WHERE school_id=? ORDER BY start_date DESC,id DESC').all(sid(req)).map(r=>({...r,classes:JSON.parse(r.classes)}))));
 // ---- generate
 app.post('/api/examtt/generate',adm,(req,res)=>{const b=req.body||{},s=sid(req),sc=school(req);
  const name=String(b.name||'').trim().slice(0,60);if(!name)return E(res,400,'ett_name');
  if(!SC.isDate(b.start_date)||!SC.isDate(b.end_date)||b.end_date<b.start_date||Date.parse(b.end_date)-Date.parse(b.start_date)>62*864e5)return E(res,400,'ett_dates');
  const cl=classes(req),ids=[...new Set((b.class_ids||[]).map(Number))].filter(i=>cl.some(c=>c.id==i));if(!ids.length)return E(res,400,'ett_classes');
  // an exam day of its own (blocks of papers and breaks), or the school's day
  let day=null;if(b.day){const bk=Array.isArray(b.day.blocks)?b.day.blocks:[],st=tmin(b.day.start);
   if(!(st>=0&&st<1440)||bk.length<1||bk.length>40||bk.some(x=>!['period','break'].includes(x.kind)||!(Math.round(+x.minutes)>=5&&Math.round(+x.minutes)<=480))||!bk.some(x=>x.kind=='period'))return E(res,400,'ett_day');
   day={start:st,blocks:bk.map(x=>({kind:x.kind,minutes:Math.round(+x.minutes),label:x.kind=='break'?String(x.label||'').slice(0,30)||null:null}))};if(st+day.blocks.reduce((a,x)=>a+x.minutes,0)>1439)return E(res,400,'ett_day')}
  const lay=SC.layout(s,sc),per=lay.periods,ds=day?day.start:b.day_start==null?(per[0]?.start??450):tmin(b.day_start),de=day?day.start+day.blocks.reduce((a,x)=>a+x.minutes,0):b.day_end==null?(per.length?per[per.length-1].end:900):tmin(b.day_end);
  if(!(ds>=0&&de<=1439&&de-ds>=30))return E(res,400,'ett_window');
  const maxm=Math.round((+b.max_hours||5)*60);if(maxm<60||maxm>720)return E(res,400,'ett_max');
  const mode=b.inv_mode=='auto'?'auto':b.inv_mode=='none'?'none':'subject',lessons=b.lessons=='none'?'none':'continue',pr=Math.min(2,Math.max(1,Math.round(+b.per_room||1)));
  let seq=null;if(b.seq){if(!R.seqs(sc).some(x=>x.id==b.seq))return E(res,400,'invalid');seq=String(b.seq)}
  const defd=per.length?per[0].end-per[0].start:40,dur={},skip=new Set((b.skip||[]).map(key));
  for(const[k,v]of Object.entries(b.dur||{})){const n=Math.round(+v);if(!(n>=X.MINDUR&&n<=X.MAXDUR))return E(res,400,'ett_dur');dur[key(k)]=n}
  const tt={day,school_id:s,day_start:ds,day_end:de,max_min:maxm,align:b.align===false?0:1,inv_mode:mode,pool_all:b.pool_all?1:0,per_room:pr,lessons,seq,start_date:b.start_date,end_date:b.end_date};
  const cx=X.context(s,tt),days=X.examDays(cx,b.start_date,b.end_date);if(!days.length)return E(res,400,'ett_nodays');
  // units: classes in a group write their shared subjects together
  const subs=db.prepare('SELECT * FROM subjects WHERE school_id=? AND class_id IN('+ids.join(',')+') ORDER BY id').all(s).filter(x=>!skip.has(key(x.name)));
  const gOf=Object.fromEntries(db.prepare('SELECT class_id,group_id FROM class_group_classes WHERE class_id IN('+ids.join(',')+')').all().map(r=>[r.class_id,r.group_id])),byKey={};
  for(const x of subs){const g=gOf[x.class_id],k=(g?'g'+g:'c'+x.class_id)+':'+key(x.name);(byKey[k]??=[]).push(x)}
  const units=Object.entries(byKey).map(([k,rows])=>({tog:k.startsWith('g')&&rows.length>1?k:null,name:rows[0].name,classes:rows.map(r=>r.class_id),rows,teachers:rows.map(r=>X.subjectTeacher({subject_id:r.id,main_teacher:r.teacher_id},tt)),dur:dur[key(rows[0].name)]||defd,date:null,start:null}));
  if(!units.length)return E(res,400,'ett_nosubj');
  const occ={},load={};
  let id;try{id=tx(()=>{const id=Number(db.prepare('INSERT INTO exam_tt(school_id,name,seq,start_date,end_date,day_start,day_end,max_min,align,inv_mode,pool_all,per_room,lessons,classes,cfg,created,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(s,name,seq,b.start_date,b.end_date,ds,de,maxm,tt.align,mode,tt.pool_all,pr,lessons,JSON.stringify(ids),JSON.stringify({dur,skip:[...skip],day}),new Date().toISOString(),req.user.id).lastInsertRowid);
   const ttr=X.rowTT(s,id),cx2=X.context(s,ttr);X.placeAll(cx2,units,days,occ,load);
   if(b.dry){const un=units.filter(u=>u.date==null);throw{dry:{total:units.length,unplaced:un.length,days:days.length,items:un.slice(0,80).map(u=>({subject:u.name,classes:u.rows.map(r=>r.class_id)}))}}}
   for(const U of units)for(const r of U.rows)db.prepare('INSERT INTO exam_paper(tt_id,class_id,subject_id,subject,date,start,dur,tog) VALUES(?,?,?,?,?,?,?,?)').run(id,r.class_id,r.id,r.name,U.date,U.start,U.dur,U.tog);
   const papers=X.papersOf(ttr);X.saveInv(papers,X.assignInv(cx2,papers,mode,pr));return id})()}catch(e){if(e&&e.dry)return res.json({ok:1,dry:1,...e.dry});throw e}
  if(Array.isArray(b.nopaper)){db.prepare('DELETE FROM exam_nopaper WHERE school_id=?').run(s);for(const n of new Set(b.nopaper.map(key)))if(n)db.prepare('INSERT INTO exam_nopaper(school_id,name) VALUES(?,?)').run(s,n)}
  audit(req.user,'examtt.generate',name);res.json({ok:1,id,placed:units.filter(u=>u.date!=null).length,unplaced:units.filter(u=>u.date==null).length})});
 const one=(req,res)=>{const tt=X.rowTT(sid(req),req.params.id);if(!tt)E(res,404,'ett_404');return tt};
 app.get('/api/examtt/:id',adm,(req,res)=>{const tt=one(req,res);if(tt)res.json(X.view(sid(req),tt))});
 app.delete('/api/examtt/:id',adm,(req,res)=>{const tt=one(req,res);if(!tt)return;db.prepare('DELETE FROM exam_tt WHERE id=?').run(tt.id);X.syncTT(sid(req),tt);audit(req.user,'examtt.delete',tt.name);res.json({ok:1})});
 app.post('/api/examtt/:id/rename',adm,(req,res)=>{const tt=one(req,res);if(!tt)return;const n=String(req.body.name||'').trim().slice(0,60);if(!n)return E(res,400,'ett_name');db.prepare('UPDATE exam_tt SET name=? WHERE id=?').run(n,tt.id);res.json({ok:1})});
 // ---- edit one paper (a whole group moves together); invigilators of this paper only
 app.post('/api/examtt/:id/paper/:pid',adm,(req,res)=>{const tt=one(req,res);if(!tt)return;const p=db.prepare('SELECT * FROM exam_paper WHERE id=? AND tt_id=?').get(+req.params.pid,tt.id);if(!p)return E(res,404,'ett_404');const b=req.body||{};
  const cx=X.context(sid(req),tt);let date=p.date,start=p.start,dur=p.dur;
  if('date' in b){if(b.date!=null&&(!SC.isDate(b.date)||b.date<tt.start_date||b.date>tt.end_date))return E(res,400,'ett_dates');date=b.date}
  if('start' in b){if(b.start==null)start=null;else{start=tmin(b.start);if(!(start>=0&&start<1440))return E(res,400,'ett_window')}}
  if('dur' in b){dur=Math.round(+b.dur);if(!(dur>=X.MINDUR&&dur<=X.MAXDUR))return E(res,400,'ett_dur')}
  let inv=null;if(Array.isArray(b.inv)){const ok=new Set(cx.teachers.map(t=>t.id));inv=b.inv.slice(0,2).map(v=>v==null||v===''||v==='other'?null:+v);if(inv.some(v=>v!=null&&!ok.has(v)))return E(res,400,'invalid')}
  tx(()=>{const q=p.tog?db.prepare('SELECT id FROM exam_paper WHERE tt_id=? AND tog=?').all(tt.id,p.tog):[{id:p.id}];for(const r of q)db.prepare('UPDATE exam_paper SET date=?,start=?,dur=? WHERE id=?').run(date,date==null?null:start,dur,r.id);
   if(inv)X.saveInv([p],{[p.id]:inv})})();X.syncTT(sid(req),tt);
  res.json(X.view(sid(req),tt))});
 // ---- one subject's duration: everyone else on those class-days shifts if possible
 app.post('/api/examtt/:id/duration',adm,(req,res)=>{const tt=one(req,res);if(!tt)return;const k=key(req.body.name),d=Math.round(+req.body.dur);if(!k)return E(res,400,'invalid');if(!(d>=X.MINDUR&&d<=X.MAXDUR))return E(res,400,'ett_dur');
  const cx=X.context(sid(req),tt),papers=X.papersOf(tt);if(!papers.some(p=>key(p.subject)==k))return E(res,404,'ett_404');
  const days=X.examDays(cx,tt.start_date,tt.end_date),U={};
  for(const p of papers){const id=p.tog||'p'+p.id;(U[id]??={ids:[],classes:[],dur:p.dur,date:p.date,start:p.start,name:p.subject,teachers:[]});U[id].ids.push(p.id);U[id].classes.push(p.class_id);if(key(p.subject)==k)U[id].dur=d}
  const all=Object.values(U),occ={},load={},aff=all.filter(u=>key(u.name)==k),rel=new Set(aff);
  const oldDur=Object.fromEntries(papers.map(p=>[p.id,p.dur]));
  // units that sit on an affected class-day at or after an affected paper's start get released and re-placed in their old order
  for(const u of aff)if(u.date!=null)for(const o of all)if(o.date!=null&&o.date==u.date&&o.start>=u.start&&o.classes.some(c=>u.classes.includes(c)))rel.add(o);
  const origin=new Map([...rel].map(u=>[u,{date:u.date,start:u.start}]));
  for(const u of all)if(!rel.has(u)&&u.date!=null){const dd=u.ids.length?oldDur[u.ids[0]]:u.dur;for(const c of u.classes){((occ[c]??={})[u.date]??=[]).push([u.start,u.start+dd]);(load[c]??={})[u.date]=(load[c][u.date]||0)+dd}}
  for(const u of [...rel].sort((a,b)=>(origin.get(a).date||'~').localeCompare(origin.get(b).date||'~')||(origin.get(a).start||0)-(origin.get(b).start||0))){const o=origin.get(u);u.date=null;u.start=null;let s=-1;
   if(o.date!=null){s=X.fitUnit(cx,u,o.date,o.start,occ,load,null);if(s>=0)X.put(u,o.date,s,occ,load)}
   if(u.date==null){X.placeAll({...cx,tt:{...tt,inv_mode:'auto'}},[u],o.date?[o.date,...days.filter(x=>x!=o.date)]:days,occ,load)}}
  const moved=[];
  tx(()=>{const c=JSON.parse(tt.cfg);c.dur={...(c.dur||{}),[k]:d};db.prepare('UPDATE exam_tt SET cfg=? WHERE id=?').run(JSON.stringify(c),tt.id);
   for(const u of all)for(const id of u.ids){const was=papers.find(p=>p.id==id);if(key(was.subject)==k||was.date!=u.date||was.start!=u.start){db.prepare('UPDATE exam_paper SET date=?,start=?,dur=? WHERE id=?').run(u.date,u.start,u.dur,id);if(was.date!=u.date||was.start!=u.start)moved.push(id)}}
   // invigilators of moved papers are picked again; the rest stay
   const np=X.papersOf(tt),inv=X.invOf(tt.id),keep={};for(const p of np)if(!moved.includes(p.id)&&inv[p.id])keep[p.id]=inv[p.id].map(x=>x.teacher_id);
   const cx2=X.context(sid(req),tt),r2=X.assignInv(cx2,np,tt.inv_mode,tt.per_room,keep);X.saveInv(np.filter(p=>!keep[p.id]),r2)})();
  X.syncTT(sid(req),tt);res.json({...X.view(sid(req),tt),moved:moved.length})});
 // ---- pick invigilators again (new mode, pool or number per room); only_missing keeps the ones that already work
 app.post('/api/examtt/:id/invigilators',adm,(req,res)=>{const tt=one(req,res);if(!tt)return;const b=req.body||{},mode=b.inv_mode=='auto'?'auto':b.inv_mode=='none'?'none':'subject',pr=Math.min(2,Math.max(1,Math.round(+b.per_room||tt.per_room))),pool=b.pool_all?1:0;
  db.prepare('UPDATE exam_tt SET inv_mode=?,per_room=?,pool_all=? WHERE id=?').run(mode,pr,pool,tt.id);const t2=X.rowTT(sid(req),tt.id),cx=X.context(sid(req),t2),papers=X.papersOf(t2),inv=X.invOf(t2.id),keep={};
  if(b.only_missing){const W=X.check(cx,papers,inv);for(const p of papers)if(inv[p.id]&&!(W[p.id]||[]).some(w=>w.startsWith('inv_')))keep[p.id]=inv[p.id].map(x=>x.teacher_id)}
  tx(()=>{const r=X.assignInv(cx,papers,mode,pr,keep);X.saveInv(papers.filter(p=>!keep[p.id]),r)})();res.json(X.view(sid(req),X.rowTT(sid(req),tt.id)))});

 // ---- drag and drop: move a paper (or swap two papers of one class) to another cell of the grid.
 // a:{d:date,p:start minute} is the paper picked up, b the cell it is dropped on. all:1 + starts:[minutes] answers for every cell (glow), check:1 only answers.
 // Only the class's own rules block a move; invigilators of the papers that moved are picked again.
 const BLOCK=['class_overlap','cap','break'];
 app.post('/api/examtt/:id/swap',adm,(req,res)=>{const tt=one(req,res);if(!tt)return;const b=req.body||{},cid=+b.class_id,cx=X.context(sid(req),tt),papers=X.papersOf(tt),inv=X.invOf(tt.id),days=X.examDays(cx,tt.start_date,tt.end_date);
  const okc=v=>v&&days.includes(v.d)&&Number.isInteger(+v.p)&&+v.p>=0&&+v.p<1440;
  const units=new Map();for(const p of papers){const k=p.tog||'p'+p.id;if(!units.has(k))units.set(k,[]);units.get(k).push(p)}
  const at=(d,s)=>[...units.values()].filter(u=>u.some(p=>p.class_id==cid)&&u[0].date==d&&u[0].start==s);
  if(!okc(b.a))return E(res,400,'invalid');const A=at(b.a.d,+b.a.p)[0];if(!A)return E(res,404,'ett_404');
  const W0=X.check(cx,papers,inv);
  const trial=(d,s)=>{if(d==A[0].date&&s==A[0].start)return{R:[{code:'same'}]};
   const B=at(d,s).filter(u=>u!==A)[0]||null,np=papers.map(p=>({...p})),mv=(u,date,start)=>{for(const q of np)if(u.some(p=>p.id==q.id)){q.date=date;q.start=start}};
   mv(A,d,s);if(B)mv(B,A[0].date,A[0].start);
   const W=X.check(cx,np,inv),moved=new Set([...A,...(B||[])].map(p=>p.id)),R=[];
   for(const id of moved)for(const c of W[id]||[])if(BLOCK.includes(c)&&!(W0[id]||[]).includes(c)&&!R.some(r=>r.code==c))R.push({code:c});
   return{R,np,moved}};
  if(b.all){const map={};for(const d of days)for(const s of(Array.isArray(b.starts)?b.starts:[]).map(Number).filter(x=>x>=0&&x<1440)){const r=trial(d,s).R;if(r.length)map[d+':'+s]=r}return res.json({map})}
  if(!okc(b.b))return E(res,400,'invalid');const T=trial(b.b.d,+b.b.p);
  if(T.R.length)return res.status(b.check?200:409).json({ok:false,error:'swap',reasons:T.R});
  if(b.check)return res.json({ok:true});
  tx(()=>{for(const q of T.np)if(T.moved.has(q.id))db.prepare('UPDATE exam_paper SET date=?,start=? WHERE id=?').run(q.date,q.start,q.id);
   const keep={};for(const p of T.np)if(!T.moved.has(p.id)&&inv[p.id])keep[p.id]=inv[p.id].map(x=>x.teacher_id);
   const t2=X.rowTT(sid(req),tt.id),cx2=X.context(sid(req),t2),np2=X.papersOf(t2),r2=X.assignInv(cx2,np2,t2.inv_mode,t2.per_room,keep);X.saveInv(np2.filter(p=>!keep[p.id]),r2)})();
  X.syncTT(sid(req),tt);res.json(X.view(sid(req),X.rowTT(sid(req),tt.id)))});
};
