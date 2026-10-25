// System-wide search: the server only hands out a compact, role-filtered list of what the signed-in user may find.
// The matching itself runs in the browser (public/sxcore.js), so typing costs the server nothing, which is also what keeps
// it cheap on Cloudflare (one batch of D1 reads when the search box opens, none per keystroke).
const{db}=require('./db');
module.exports=(app,{auth})=>{
 app.get('/api/search/index',auth(),(req,res)=>{const u=req.user,sid=u.school_id,role=u.role,adm=role=='principal',off=adm||role=='secretary';
  const out={role,students:[],classes:[],staff:[],subjects:[]};
  const cls=db.prepare('SELECT c.id,c.name,c.short,c.head_id,(SELECT name FROM sections s WHERE s.id=c.section_id) section,(SELECT COUNT(*) FROM students x WHERE x.class_id=c.id AND x.active=1) n FROM classes c WHERE c.school_id=? ORDER BY c.name').all(sid);
  const subs=db.prepare('SELECT s.id,s.name,s.class_id,s.teacher_id FROM subjects s WHERE s.school_id=?').all(sid);
  const me=new Set([...subs.filter(s=>s.teacher_id==u.id).map(s=>s.class_id),...cls.filter(c=>c.head_id==u.id).map(c=>c.id)]);
  const heads=new Set(cls.filter(c=>c.head_id==u.id).map(c=>c.id));
  const ok=c=>off||(role=='teacher'&&me.has(c));
  if(off||role=='teacher'){
   out.classes=cls.filter(c=>ok(c.id)).map(c=>({id:c.id,n:c.name,s:c.short||'',sec:c.section||'',h:c.head_id||0,c:c.n}));
   const ph=new Set(off?db.prepare('SELECT student_id FROM student_photos WHERE school_id=?').all(sid).map(r=>r.student_id):[]);
   out.students=db.prepare('SELECT id,name,matricule,class_id,guardian,phone,sex FROM students WHERE school_id=? AND active=1 ORDER BY name').all(sid).filter(s=>ok(s.class_id)).map(s=>({id:s.id,n:s.name,m:s.matricule||'',c:s.class_id,g:s.guardian||'',p:s.phone||'',x:s.sex||'',ph:ph.has(s.id)?1:0,o:off||heads.has(s.class_id)?1:0}))}
  if(adm){
   const cn=Object.fromEntries(cls.map(c=>[c.id,c.short||c.name])),ph=new Set(db.prepare('SELECT user_id FROM staff_photos WHERE school_id=?').all(sid).map(r=>r.user_id)),mine={};
   for(const s of subs)if(s.teacher_id)((mine[s.teacher_id]??={})[s.class_id]??=[]).push(s.name);
   out.staff=db.prepare('SELECT id,name,username,role,email,phone FROM users WHERE school_id=? AND active=1 ORDER BY name').all(sid).map(x=>({id:x.id,n:x.name,u:x.username,r:x.role,e:x.email||'',p:x.phone||'',ph:ph.has(x.id)?1:0,t:Object.entries(mine[x.id]||{}).map(([c,l])=>({c:+c,n:cn[c]||'',s:l}))}));
   const tn=Object.fromEntries(out.staff.map(x=>[x.id,x.n]));
   out.subjects=subs.map(s=>({id:s.id,n:s.name,c:s.class_id,t:s.teacher_id||0,tn:tn[s.teacher_id]||''}))}
  res.set('Cache-Control','private, no-cache');res.json(out)})};
