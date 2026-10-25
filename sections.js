// Sections: labels that group classes and teachers (Anglophone, Francophone, Primary...). A school with one section never sees them.
const{db,tx}=require('./db');
const NAME=v=>String(v??'').trim().replace(/\s+/g,' ').slice(0,40);
// every school has at least one section; classes made elsewhere (seed, old data) with no section join the first one
function ensure(sid){let s=db.prepare('SELECT id,name FROM sections WHERE school_id=? ORDER BY pos,id').all(sid);
 if(!s.length){const r=db.prepare('INSERT INTO sections(school_id,name,pos) VALUES(?,?,0)').run(sid,'Main');s=[{id:Number(r.lastInsertRowid),name:'Main'}]}
 db.prepare('UPDATE classes SET section_id=? WHERE school_id=? AND section_id IS NULL').run(s[0].id,sid);return s}
const valid=(sid,id)=>{const s=ensure(sid);return s.some(x=>x.id==+id)?+id:0};
// teachers' sections. With a single section everybody belongs to it.
function ofUser(sid,uid){const s=ensure(sid);if(s.length==1)return[s[0].id];return db.prepare('SELECT section_id id FROM user_sections WHERE user_id=?').all(uid).map(r=>r.id).filter(i=>s.some(x=>x.id==i))}
function setUser(sid,uid,ids){const s=ensure(sid),ok=[...new Set((ids||[]).map(Number))].filter(i=>s.some(x=>x.id==i));
 if(s.length>1&&!ok.length)return false;   // callers run this inside their own transaction when they need one
 db.prepare('DELETE FROM user_sections WHERE user_id=?').run(uid);for(const i of ok)db.prepare('INSERT INTO user_sections(user_id,section_id) VALUES(?,?)').run(uid,i);return true}
module.exports=Object.assign((app,{auth,E,audit})=>{
 const any=auth(['principal','secretary','teacher']),adm=auth(['principal']),sid=req=>req.user.school_id;
 const list=req=>{const s=ensure(sid(req)),T=db.prepare("SELECT id FROM users WHERE school_id=? AND role='teacher' AND active=1").all(sid(req)).map(x=>x.id);
  return s.map(x=>({id:x.id,name:x.name,classes:db.prepare('SELECT COUNT(*) n FROM classes WHERE section_id=?').get(x.id).n,students:db.prepare('SELECT COUNT(*) n FROM students st JOIN classes c ON c.id=st.class_id WHERE c.section_id=? AND st.active=1').get(x.id).n,
   teachers:s.length==1?T.length:db.prepare('SELECT COUNT(*) n FROM user_sections WHERE section_id=? AND user_id IN('+(T.join(',')||'0')+')').get(x.id).n}))};
 app.get('/api/sections',any,(req,res)=>{const l=list(req);res.json({multi:l.length>1,sections:l})});
 // add a section. The first time, the existing classes are renamed into their own section (rename_first) and every teacher joins it.
 app.post('/api/sections',adm,(req,res)=>{const n=NAME(req.body.name);if(!n)return E(res,400,'sec_name');const cur=ensure(sid(req));
  if(cur.some(x=>x.name.toLowerCase()==n.toLowerCase()))return E(res,409,'sec_dup');if(cur.length>=8)return E(res,400,'sec_many');
  const rf=NAME(req.body.rename_first);if(cur.length==1&&rf&&rf.toLowerCase()==n.toLowerCase())return E(res,409,'sec_dup');
  let id;tx(()=>{if(cur.length==1){if(rf)db.prepare('UPDATE sections SET name=? WHERE id=?').run(rf,cur[0].id);
    for(const u of db.prepare("SELECT id FROM users WHERE school_id=? AND role='teacher' AND active=1").all(sid(req)))db.prepare('INSERT OR IGNORE INTO user_sections(user_id,section_id) VALUES(?,?)').run(u.id,cur[0].id)}
   id=Number(db.prepare('INSERT INTO sections(school_id,name,pos) VALUES(?,?,?)').run(sid(req),n,cur.length).lastInsertRowid)})();
  audit(req.user,'section.add',n);res.json({ok:1,id})});
 app.post('/api/sections/:id',adm,(req,res)=>{const n=NAME(req.body.name),id=valid(sid(req),req.params.id);if(!id)return E(res,404,'sec_404');if(!n)return E(res,400,'sec_name');
  if(ensure(sid(req)).some(x=>x.id!=id&&x.name.toLowerCase()==n.toLowerCase()))return E(res,409,'sec_dup');db.prepare('UPDATE sections SET name=? WHERE id=?').run(n,id);audit(req.user,'section.rename',n);res.json({ok:1})});
 app.delete('/api/sections/:id',adm,(req,res)=>{const s=ensure(sid(req)),id=valid(sid(req),req.params.id);if(!id)return E(res,404,'sec_404');if(s.length<2)return E(res,400,'sec_last');
  if(db.prepare('SELECT 1 FROM classes WHERE section_id=?').get(id))return E(res,409,'sec_busy');
  tx(()=>{db.prepare('DELETE FROM user_sections WHERE section_id=?').run(id);db.prepare('DELETE FROM sections WHERE id=?').run(id)})();audit(req.user,'section.delete',String(id));res.json({ok:1})});
 // a teacher's sections (also settable when adding or editing staff)
 app.post('/api/users/sections',adm,(req,res)=>{const u=db.prepare("SELECT id FROM users WHERE id=? AND school_id=? AND role='teacher' AND active=1").get(+req.body.id,sid(req));if(!u)return E(res,404,'invalid');
  if(!tx(()=>setUser(sid(req),u.id,req.body.sections))())return E(res,400,'sec_teacher');res.json({ok:1})});
},{ensure,valid,ofUser,setUser});
