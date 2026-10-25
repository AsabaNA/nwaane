// Student ID badges (office only: principal and secretary). Photo per student, a verifiable code per badge, printing, lost-card replacement.
const express=require('./core/web'),crypto=require('crypto'),{db,tx}=require('./db'),SC=require('./sched'),B=require('./billing'),PB=require('./pdfbadge');
const AL='23456789ABCDEFGHJKLMNPQRSTUVWXYZ',g4=()=>Array.from(crypto.randomBytes(4),b=>AL[b%AL.length]).join(''),newCode=()=>{for(;;){const c='ID-'+g4()+'-'+g4();if(!db.prepare('SELECT 1 FROM badges WHERE code=?').get(c))return c}};
const IMG=require('./core/image'),{isWebp,MAXPHOTO,MAXIN}=IMG,MAXPRINT=1500;
for(const c of['print','thumb'])try{db.exec(`ALTER TABLE student_photos ADD COLUMN ${c} BLOB`)}catch{}   // print = JPEG for the PDF, thumb = 96x128 for lists
const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
// Node only: older photos (JPEG main, or no print/thumb copy) are brought up to date a few at a time. On Cloudflare IMG.can() is false and this does nothing.
async function backfill(){if(!IMG.can())return;
 for(const r of db.prepare('SELECT student_id id,jpg,print,thumb FROM student_photos WHERE print IS NULL OR thumb IS NULL OR substr(jpg,1,2)=x\'FFD8\' LIMIT 100').all()){try{let m=Buffer.from(r.jpg);if(!isWebp(m)){const w=await IMG.webp(m);if(w.err)continue;m=w.buf}
  db.prepare('UPDATE student_photos SET jpg=?,print=COALESCE(print,?),thumb=COALESCE(thumb,?) WHERE student_id=?').run(m,r.print||await IMG.jpeg(m),r.thumb||await IMG.thumb(m),r.id)}catch{}}}
require('./core/jobs').every('photo-backfill',36e5,backfill,3000);
module.exports=(app,{auth,E,audit})=>{
 const OFF=auth(['principal','secretary']),sid=req=>req.user.school_id,yearOf=s=>B.schoolYear(SC.clock(SC.school(s)).date);
 const own=(req,id)=>db.prepare('SELECT s.*,c.name cls FROM students s LEFT JOIN classes c ON c.id=s.class_id WHERE s.id=? AND s.school_id=?').get(+id||0,sid(req));
 const active=(sd,y)=>db.prepare('SELECT * FROM badges WHERE student_id=? AND void=0 AND year=? ORDER BY id DESC LIMIT 1').get(sd,y);
 // ---- list
 app.get('/api/idcards',OFF,(req,res)=>{const s=sid(req),y=yearOf(s),q=String(req.query.q||'').trim(),c=+req.query.class_id||null,args=[s];let w='';
  if(c){w+=' AND s.class_id=?';args.push(c)}if(q){w+=' AND (s.name LIKE ? OR s.matricule LIKE ?)';args.push('%'+q+'%','%'+q+'%')}
  const rows=db.prepare(`SELECT s.id,s.name,s.matricule,s.class_id,c.name cls,EXISTS(SELECT 1 FROM student_photos p WHERE p.student_id=s.id) photo,(SELECT at FROM student_photos p WHERE p.student_id=s.id) photo_at FROM students s LEFT JOIN classes c ON c.id=s.class_id WHERE s.school_id=? AND s.active=1${w} ORDER BY c.name,s.name LIMIT 3000`).all(...args);
  const bd=Object.fromEntries(db.prepare('SELECT b.* FROM badges b WHERE b.school_id=? AND b.void=0 AND b.year=? AND b.id=(SELECT MAX(id) FROM badges x WHERE x.student_id=b.student_id AND x.void=0 AND x.year=b.year)').all(s,y).map(b=>[b.student_id,b]));
  res.json({year:y,label:y+'/'+(y+1),classes:db.prepare('SELECT id,name FROM classes WHERE school_id=? ORDER BY name').all(s),
   students:rows.map(r=>({...r,photo:!!r.photo,code:bd[r.id]?.code||null,printed_at:bd[r.id]?.printed_at||null,prints:bd[r.id]?.prints||0}))})});
 // ---- photos
 app.get('/api/students/:id/photo',OFF,async(req,res,next)=>{try{const st=own(req,req.params.id);if(!st)return E(res,404,'invalid');
  let p=db.prepare('SELECT jpg,thumb,at FROM student_photos WHERE student_id=?').get(st.id);if(!p)return E(res,404,'invalid');
  if(IMG.can()&&!isWebp(Buffer.from(p.jpg))){const w=await IMG.webp(Buffer.from(p.jpg));if(!w.err){db.prepare('UPDATE student_photos SET jpg=?,thumb=NULL WHERE student_id=?').run(w.buf,st.id);p={...p,jpg:w.buf,thumb:null}}}   // old JPEG rows become WebP on first read
  if(req.query.t&&!p.thumb&&IMG.can())try{p.thumb=await IMG.thumb(Buffer.from(p.jpg));db.prepare('UPDATE student_photos SET thumb=? WHERE student_id=?').run(p.thumb,st.id)}catch{}
  const main=Buffer.from(p.jpg),ct=b=>b[0]==0xFF?'image/jpeg':'image/webp';
  if(req.query.t&&p.thumb){const tb=Buffer.from(p.thumb);res.set({'Content-Type':ct(tb),'Cache-Control':'private, max-age=3600'});return res.send(tb)}
  res.set({'Content-Type':isWebp(main)?'image/webp':'image/jpeg','Cache-Control':'private, max-age=0, must-revalidate',ETag:'"'+p.at+'"'});if(req.headers['if-none-match']=='"'+p.at+'"')return res.status(304).end();res.send(main)}catch(e){next(e)}});
 const rawPhoto=express.raw({type:()=>true,limit:MAXIN});
 app.post('/api/students/:id/photo',OFF,(req,res,next)=>rawPhoto(req,res,err=>err?E(res,413,'photo_big'):next()),async(req,res,next)=>{try{const st=own(req,req.params.id);if(!st)return E(res,404,'invalid');
  const r=await IMG.take(req.body);if(r.err)return E(res,r.err=='photo_big'?413:400,r.err);
  const at=new Date().toISOString();db.prepare('INSERT INTO student_photos(student_id,school_id,jpg,print,thumb,at,by_id) VALUES(?,?,?,?,?,?,?) ON CONFLICT(student_id) DO UPDATE SET jpg=excluded.jpg,print=excluded.print,thumb=excluded.thumb,at=excluded.at,by_id=excluded.by_id').run(st.id,sid(req),r.main,r.print,r.thumb,at,req.user.id);
  audit(req.user,'badge.photo',st.name);res.json({ok:1,bytes:r.main.length})}catch(e){next(e)}});
 app.post('/api/students/:id/photo/delete',OFF,(req,res)=>{const st=own(req,req.params.id);if(!st)return E(res,404,'invalid');db.prepare('DELETE FROM student_photos WHERE student_id=?').run(st.id);audit(req.user,'badge.photo.del',st.name);res.json({ok:1})});
 // match photo file names to students: by matricule first, then by exact full name when unique
 app.post('/api/idcards/match',OFF,(req,res)=>{const names=req.body&&req.body.names;if(!Array.isArray(names)||names.length>800)return E(res,400,'invalid');
  const st=db.prepare('SELECT id,name,matricule FROM students WHERE school_id=? AND active=1').all(sid(req)),byM={},byN={};
  for(const s of st){if(s.matricule)byM[norm(s.matricule)]=s;(byN[norm(s.name)]??=[]).push(s)}
  res.json({matches:names.map(f=>{const base=String(f).replace(/\.[^.]+$/,''),m=byM[norm(base)];if(m)return{file:f,student_id:m.id,name:m.name};
   const n=byN[norm(base)];if(n&&n.length==1)return{file:f,student_id:n[0].id,name:n[0].name};return{file:f,none:n&&n.length>1?'many':'none'}})})});
 // ---- print
 app.post('/api/idcards/print',OFF,async(req,res,next)=>{try{const s=sid(req),b=req.body||{},y=yearOf(s),sc=SC.school(s);
  let list;const base='SELECT s.id,s.name,s.matricule,s.class_id,c.name cls FROM students s LEFT JOIN classes c ON c.id=s.class_id WHERE s.school_id=? AND s.active=1';
  if(Array.isArray(b.ids)){const ids=[...new Set(b.ids.map(Number))].filter(Number.isInteger).slice(0,MAXPRINT);list=db.prepare(base).all(s).filter(r=>ids.includes(r.id))}
  else if(Array.isArray(b.class_ids)){const cs=new Set(b.class_ids.map(Number));list=db.prepare(base).all(s).filter(r=>cs.has(r.class_id))}
  else if(+b.class_id)list=db.prepare(base+' AND s.class_id=?').all(s,+b.class_id);else list=db.prepare(base).all(s);
  list.sort((a,c)=>String(a.cls).localeCompare(String(c.cls),undefined,{numeric:true})||a.name.localeCompare(c.name));
  if(b.only_new)list=list.filter(r=>{const x=active(r.id,y);return!x||!x.printed_at});
  if(!list.length)return E(res,400,'badge_empty');if(list.length>MAXPRINT)return E(res,413,'badge_many');
  const ph={},want=new Set(list.map(r=>r.id));for(const r of db.prepare('SELECT student_id,jpg,print FROM student_photos WHERE school_id=?').all(s))if(want.has(r.student_id)){if(r.print)ph[r.student_id]=Buffer.from(r.print);else if(IMG.can())try{const j=await IMG.jpeg(Buffer.from(r.jpg));ph[r.student_id]=j;db.prepare('UPDATE student_photos SET print=? WHERE student_id=?').run(j,r.student_id)}catch{}}
  const miss=list.filter(r=>!ph[r.id]);
  if(miss.length&&!b.allow_nophoto)return res.status(409).json({error:'badge_nophoto',n:miss.length,names:miss.slice(0,12).map(r=>r.name)});
  const stamp=new Date().toISOString(),codes={};
  tx(()=>{for(const r of list){let x=active(r.id,y);if(!x){const c=newCode();db.prepare('INSERT INTO badges(school_id,student_id,code,year,created) VALUES(?,?,?,?,?)').run(s,r.id,c,y,stamp);x={code:c}}codes[r.id]=x.code}})();
  const base_=process.env.PUBLIC_URL?process.env.PUBLIC_URL.replace(/\/$/,'')+'/verify.html?code=':req.protocol+'://'+req.get('host')+'/verify.html?code=';
  const pdf=await PB.render(sc,list.map(r=>({name:r.name,matricule:r.matricule,cls:r.cls,code:codes[r.id],photo:ph[r.id]||null})),{layout:b.layout,yearLabel:y+'/'+(y+1),base:base_});
  tx(()=>{for(const r of list)db.prepare('UPDATE badges SET printed_at=?,prints=prints+1 WHERE code=?').run(stamp,codes[r.id])})();
  audit(req.user,'badge.print',`${list.length} badges (${b.layout=='card'?'card':'sheet'})`);
  res.set({'Content-Type':'application/pdf','Content-Disposition':'inline; filename="student-badges.pdf"','X-Badge-Count':String(list.length)});res.send(pdf)}catch(e){next(e)}});
 // ---- lost / damaged card: the old code stops working, a new one is ready for the next print
 app.post('/api/idcards/replace',OFF,(req,res)=>{const st=own(req,(req.body||{}).student_id);if(!st)return E(res,404,'invalid');const y=yearOf(sid(req)),old=active(st.id,y);if(!old)return E(res,400,'badge_none');
  const why=String((req.body||{}).reason||'').trim().slice(0,80)||null,c=newCode(),now=new Date().toISOString();
  tx(()=>{db.prepare('UPDATE badges SET void=1,void_reason=?,void_at=? WHERE id=?').run(why,now,old.id);db.prepare('INSERT INTO badges(school_id,student_id,code,year,created) VALUES(?,?,?,?,?)').run(sid(req),st.id,c,y,now)})();
  audit(req.user,'badge.replace',st.name+(why?' – '+why:''));res.json({ok:1,code:c})});
};
module.exports.kit={IMG};
