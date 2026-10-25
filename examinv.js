// Exam timetable, part 3: publish (suspends lessons of classes that write), invigilation confirmation, pay switch.
const{db,tx}=require('./db'),SC=require('./sched'),X=require('./examtt');
module.exports=(app,{auth,E,audit,school})=>{
 const adm=auth(['principal','secretary']),boss=auth(['principal','surveillant']),tch=auth(['teacher']),sid=req=>req.user.school_id;
 const nowOf=req=>SC.clock(school(req));
 // ---- publish / unpublish. Published = lessons of writing classes are suspended and teachers can confirm their invigilation.
 app.post('/api/examtt/:id/publish',adm,(req,res)=>{const tt=X.rowTT(sid(req),req.params.id);if(!tt)return E(res,404,'ett_404');const on=req.body?.on===false?0:1;
  if(on&&!db.prepare('SELECT 1 FROM exam_paper WHERE tt_id=? AND date IS NOT NULL').get(tt.id))return E(res,409,'pub_empty');
  db.prepare('UPDATE exam_tt SET published=? WHERE id=?').run(on,tt.id);const n=X.syncTT(sid(req),{...tt});audit(req.user,on?'examtt.publish':'examtt.unpublish',tt.name);res.json({ok:1,published:!!on,lessons:n})});
 // pay for invigilation: off by default
 app.post('/api/examtt/pay',auth(['principal']),(req,res)=>{db.prepare('UPDATE schools SET inv_pay=? WHERE id=?').run(req.body?.on?1:0,sid(req));audit(req.user,'examtt.pay',String(!!req.body?.on));res.json({ok:1,inv_pay:!!req.body?.on})});
 // ---- a teacher's duties (published timetables only), from a few days back to two weeks ahead
 const duties=(req,tid)=>{const sc=school(req),ck=nowOf(req),from=SC.addDays(ck.date,-3),to=SC.addDays(ck.date,14);
  return db.prepare("SELECT i.paper_id,i.slot,i.status,i.conf_at,p.date,p.start,p.dur,p.subject,c.name cls,t.name tt FROM exam_inv i JOIN exam_paper p ON p.id=i.paper_id JOIN exam_tt t ON t.id=p.tt_id JOIN classes c ON c.id=p.class_id WHERE t.school_id=? AND t.published=1 AND i.teacher_id=? AND p.start IS NOT NULL AND p.date BETWEEN ? AND ? ORDER BY p.date,p.start").all(sid(req),tid,from,to)
  .map(d=>{const end=d.start+d.dur,open=d.date==ck.date&&ck.min>=d.start-sc.win_before&&ck.min<end,over=d.date<ck.date||(d.date==ck.date&&ck.min>=end);
   return{paper_id:d.paper_id,slot:d.slot,date:d.date,start:d.start,end,dur:d.dur,cls:d.cls,subject:d.subject,tt:d.tt,conf_at:d.conf_at,state:d.status=='confirmed'?'confirmed':d.status=='absent'?'absent':open?'open':over?'missed':'upcoming'}})};
 app.get('/api/invig/mine',tch,(req,res)=>{const g=db.prepare('SELECT in_at,out_at FROM gate WHERE user_id=? AND date=?').get(req.user.id,nowOf(req).date);
  res.json({duties:duties(req,req.user.id),gate:!!(g&&g.in_at&&!g.out_at),pay:!!school(req).inv_pay,geo:school(req).geo_lat!=null})});
 // one tap confirms every duty that is open now; one location reading covers them all
 app.post('/api/invig/confirm',tch,(req,res)=>{const sc=school(req),ck=nowOf(req),b=req.body||{};
  const want=new Set((Array.isArray(b.items)?b.items:[]).map(x=>(+x.paper_id)+':'+(+x.slot)));const open=duties(req,req.user.id).filter(d=>d.state=='open'&&(!want.size||want.has(d.paper_id+':'+d.slot)));
  if(!open.length)return E(res,409,'inv_none_open');
  const g=db.prepare('SELECT in_at,out_at FROM gate WHERE user_id=? AND date=?').get(req.user.id,ck.date);if(!g||!g.in_at||g.out_at)return E(res,409,'inv_nogate');
  const gc=app.locals.geoCheck?app.locals.geoCheck(db.prepare('SELECT * FROM schools WHERE id=?').get(sid(req)),b):null;if(gc&&gc.error)return res.status(403).json(gc);
  tx(()=>{for(const d of open)db.prepare("UPDATE exam_inv SET status='confirmed',conf_at=?,conf_by=?,conf_geo=? WHERE paper_id=? AND slot=? AND teacher_id=? AND status IS NULL").run(ck.at,req.user.id,gc?gc.m:null,d.paper_id,d.slot,req.user.id)})();
  audit(req.user,'invig.confirm',String(open.length));res.json({ok:1,n:open.length})});
 // the office can confirm or mark absent for someone (reason required), like for lessons
 app.post('/api/invig/set',boss,(req,res)=>{const b=req.body||{},st=['confirmed','absent','pending'].includes(b.status)?b.status:null,reason=String(b.reason||'').trim();
  if(!st||!reason||reason.length>200)return E(res,400,'invalid');
  const r=db.prepare("SELECT i.*,p.date,t.school_id FROM exam_inv i JOIN exam_paper p ON p.id=i.paper_id JOIN exam_tt t ON t.id=p.tt_id WHERE i.paper_id=? AND i.slot=? AND t.school_id=?").get(+b.paper_id,+b.slot,sid(req));
  if(!r||r.teacher_id==null)return E(res,404,'ett_404');if(SC.lockedMonth(sid(req),r.date))return E(res,409,'mlocked');
  if(st!='pending'&&r.date>nowOf(req).date)return E(res,409,'future');
  db.prepare('UPDATE exam_inv SET status=?,conf_at=?,conf_by=?,conf_geo=NULL,reason=? WHERE paper_id=? AND slot=?').run(st=='pending'?null:st,st=='pending'?null:nowOf(req).at,req.user.id,reason,r.paper_id,r.slot);
  audit(req.user,'invig.set',`${r.paper_id}/${r.slot} ${st}`);res.json({ok:1})});
};
