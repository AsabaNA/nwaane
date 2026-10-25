// Staff ID badges (principal only) and the gate scan: the QR on a staff badge opens /t/<code> on the gate person's phone,
// where one tap marks the teacher arrived or left (same gate log as the Today screen).
const express=require('./core/web'),crypto=require('crypto'),{db}=require('./db'),SC=require('./sched'),B=require('./billing'),PB=require('./pdfbadge'),{IMG}=require('./badges').kit,{isWebp,MAXIN}=IMG;
db.exec(`CREATE TABLE IF NOT EXISTS staff_badges(id INTEGER PRIMARY KEY,school_id INTEGER NOT NULL,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,code TEXT NOT NULL UNIQUE,year INTEGER NOT NULL,created TEXT,printed_at TEXT,prints INTEGER NOT NULL DEFAULT 0,void INTEGER NOT NULL DEFAULT 0,void_reason TEXT);
CREATE INDEX IF NOT EXISTS sb_user ON staff_badges(user_id);
CREATE TABLE IF NOT EXISTS staff_photos(user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,school_id INTEGER NOT NULL,webp BLOB NOT NULL,at TEXT NOT NULL,by_id INTEGER)`);
const AL='23456789ABCDEFGHJKLMNPQRSTUVWXYZ',g4=()=>Array.from(crypto.randomBytes(4),b=>AL[b%AL.length]).join(''),newCode=()=>{for(;;){const c='TC-'+g4()+'-'+g4();if(!db.prepare('SELECT 1 FROM staff_badges WHERE code=?').get(c))return c}};
for(const c of['print','thumb'])try{db.exec(`ALTER TABLE staff_photos ADD COLUMN ${c} BLOB`)}catch{}
const MAXPRINT=500;
module.exports=(app,{auth,userOf,E,audit,school,isGate})=>{
 const ADM=auth(['principal']),sid=req=>req.user.school_id,yearOf=s=>B.schoolYear(SC.clock(SC.school(s)).date),
  base=req=>process.env.PUBLIC_URL||req.protocol+'://'+req.get('host');
 const own=(req,id)=>db.prepare("SELECT id,name,username,role,active FROM users WHERE id=? AND school_id=? AND active=1").get(+id||0,sid(req));
 const active=(uid,y)=>db.prepare('SELECT * FROM staff_badges WHERE user_id=? AND void=0 AND year=? ORDER BY id DESC LIMIT 1').get(uid,y);
 const ensure=(s,uid,y)=>active(uid,y)||(()=>{const c=newCode();db.prepare('INSERT INTO staff_badges(school_id,user_id,code,year,created) VALUES(?,?,?,?,?)').run(s,uid,c,y,new Date().toISOString());return active(uid,y)})();
 // ---- list
 app.get('/api/staffbadges',ADM,(req,res)=>{const s=sid(req),y=yearOf(s),bd=Object.fromEntries(db.prepare('SELECT b.* FROM staff_badges b WHERE b.school_id=? AND b.void=0 AND b.year=?').all(s,y).map(b=>[b.user_id,b]));
  res.json({year:y,label:y+'/'+(y+1),staff:db.prepare("SELECT id,name,role,EXISTS(SELECT 1 FROM staff_photos p WHERE p.user_id=users.id) photo FROM users WHERE school_id=? AND active=1 ORDER BY CASE role WHEN 'principal' THEN 0 WHEN 'secretary' THEN 1 WHEN 'surveillant' THEN 2 ELSE 3 END,name").all(s).map(u=>({...u,photo:!!u.photo,code:bd[u.id]?.code||null,printed_at:bd[u.id]?.printed_at||null}))})});
 // ---- photos
 const photoOf=id=>db.prepare('SELECT webp,print,thumb,at FROM staff_photos WHERE user_id=?').get(id);
 const sendPhoto=async(req,res,u)=>{const p=photoOf(u),buf=p&&Buffer.from(p.webp);if(!p)return E(res,404,'invalid');
  if(req.query.t&&p.thumb){const tb=Buffer.from(p.thumb);res.set({'Content-Type':tb[0]==0xFF?'image/jpeg':'image/webp','Cache-Control':'private, max-age=3600'});return res.send(tb)}
  res.set({'Content-Type':buf[0]==0xFF?'image/jpeg':'image/webp','Cache-Control':'private, max-age=0, must-revalidate',ETag:'"'+p.at+'"'});if(req.headers['if-none-match']=='"'+p.at+'"')return res.status(304).end();res.send(buf)};
 app.get('/api/staff/:id/photo',ADM,async(req,res,next)=>{try{const u=own(req,req.params.id);if(!u)return E(res,404,'invalid');await sendPhoto(req,res,u.id)}catch(e){next(e)}});
 const raw=express.raw({type:()=>true,limit:MAXIN});
 app.post('/api/staff/:id/photo',ADM,(req,res,next)=>raw(req,res,err=>err?E(res,413,'photo_big'):next()),async(req,res,next)=>{try{const u=own(req,req.params.id);if(!u)return E(res,404,'invalid');
  const r=await IMG.take(req.body);if(r.err)return E(res,r.err=='photo_big'?413:400,r.err);
  db.prepare('INSERT INTO staff_photos(user_id,school_id,webp,print,thumb,at,by_id) VALUES(?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET webp=excluded.webp,print=excluded.print,thumb=excluded.thumb,at=excluded.at,by_id=excluded.by_id').run(u.id,sid(req),r.main,r.print,r.thumb,new Date().toISOString(),req.user.id);
  audit(req.user,'staffbadge.photo',u.name);res.json({ok:1,bytes:r.main.length})}catch(e){next(e)}});
 app.post('/api/staff/:id/photo/delete',ADM,(req,res)=>{const u=own(req,req.params.id);if(!u)return E(res,404,'invalid');db.prepare('DELETE FROM staff_photos WHERE user_id=?').run(u.id);audit(req.user,'staffbadge.photo.del',u.name);res.json({ok:1})});
 // ---- print
 app.post('/api/staffbadges/print',ADM,async(req,res,next)=>{try{const s=sid(req),b=req.body||{},y=yearOf(s),sc=SC.school(s);
  const ids=[...new Set((Array.isArray(b.user_ids)?b.user_ids:[]).map(Number).filter(Number.isFinite))];
  let list=db.prepare("SELECT id,name,username,role FROM users WHERE school_id=? AND active=1 ORDER BY name").all(s);if(ids.length)list=list.filter(u=>ids.includes(u.id));
  if(b.only_new)list=list.filter(u=>{const x=active(u.id,y);return!x||!x.printed_at});
  if(!list.length)return E(res,400,'badge_empty');if(list.length>MAXPRINT)return E(res,400,'badge_many');
  const lang=['en','fr','both'].includes(sc.card_lang)?sc.card_lang:'both',pos=r=>{const m={teacher:['Teacher','Enseignant'],principal:['Principal','Principal'],secretary:['Secretary','Secrétaire'],surveillant:['Supervisor','Surveillant']}[r]||[r,r];return lang=='en'?m[0]:lang=='fr'?m[1]:m[0]===m[1]?m[0]:m[0]+' / '+m[1]};
  const codes={};for(const u of list)codes[u.id]=ensure(s,u.id,y).code;
  const stu=list.map(u=>({name:u.name,matricule:'S-'+String(u.id).padStart(4,'0'),cls:pos(u.role),code:codes[u.id],photo:null}));
  for(let i=0;i<list.length;i++){const p=photoOf(list[i].id);if(p)try{if(p.print)stu[i].photo=Buffer.from(p.print);else if(IMG.can()){stu[i].photo=await IMG.jpeg(Buffer.from(p.webp));db.prepare('UPDATE staff_photos SET print=? WHERE user_id=?').run(stu[i].photo,list[i].id)}}catch{}}
  const pdf=await PB.render(sc,stu,{base:base(req)+'/t/',yearLabel:y+'/'+(y+1),layout:b.layout=='card'?'card':'sheet',kind:'staff'}),stamp=new Date().toISOString();
  for(const u of list)db.prepare('UPDATE staff_badges SET printed_at=?,prints=prints+1 WHERE code=?').run(stamp,codes[u.id]);
  audit(req.user,'staffbadge.print',list.length+' badges');
  res.set({'Content-Type':'application/pdf','Content-Disposition':'inline; filename="staff-badges.pdf"','X-Badge-Count':String(list.length)});res.send(pdf)}catch(e){next(e)}});
 app.post('/api/staffbadges/replace',ADM,(req,res)=>{const u=own(req,req.body.user_id);if(!u)return E(res,404,'invalid');const y=yearOf(sid(req)),cur=active(u.id,y);
  if(cur)db.prepare('UPDATE staff_badges SET void=1,void_reason=? WHERE id=?').run(String(req.body.reason||'').slice(0,120),cur.id);const c=ensure(sid(req),u.id,y).code;audit(req.user,'staffbadge.replace',u.name);res.json({ok:1,code:c})});
 // ---- the scan page and its API
 app.get('/t/:code',(req,res)=>res.sendFile(require('path').join(__dirname,'public','t.html')));
 const byCode=c=>db.prepare("SELECT b.*,u.name,u.role,u.active,u.username,s.name school,s.code scode FROM staff_badges b JOIN users u ON u.id=b.user_id JOIN schools s ON s.id=b.school_id WHERE b.code=?").get(String(c||'').trim().toUpperCase());
 const viewer=req=>{const u=userOf(req.cookies.t);return u&&!u.support?u:null};
 // teaching still ahead today (lessons not yet over that the teacher is scheduled for)
 function ahead(s,uid,ck){const lay=SC.layout(s,SC.school(s));return db.prepare("SELECT period FROM lessons WHERE school_id=? AND date=? AND sched_id=? AND status NOT IN('suspended')").all(s,ck.date,uid).filter(l=>{const p=lay.periods[l.period-1];return p&&p.end>ck.min}).length}
 const hits={};
 app.get('/api/tscan/info',(req,res)=>{if(!viewer(req)){if((hits[req.ip]=(hits[req.ip]||0)+1)>60)return E(res,429,'many');setTimeout(()=>{hits[req.ip]--},6e5).unref()}const b=byCode(req.query.code);if(!b)return res.json({state:'invalid'});
  const out={school:b.school,scode:b.scode,name:b.name,role:b.role,state:'public',valid:!b.void&&!!b.active&&b.year==yearOf(b.school_id)};
  if(b.void)out.state='replaced';else if(!b.active)out.state='left';else if(b.year!=yearOf(b.school_id))out.state='expired';
  const u=viewer(req);if(!u||u.school_id!=b.school_id)return res.json({...out,login:!u});
  if(!isGate(u))return res.json({...out,login:false,nogate:true,me:u.name});
  const sc=SC.school(b.school_id),ck=SC.clock(sc),g=db.prepare('SELECT * FROM gate WHERE user_id=? AND date=?').get(b.user_id,ck.date),isT=b.role=='teacher';
  res.json({...out,login:false,me:u.name,photo:!!photoOf(b.user_id),teacher:isT,day:!!SC.schoolDay(b.school_id,sc,ck.date),in_at:g?.in_at?g.in_at.slice(11):null,out_at:g?.out_at?g.out_at.slice(11):null,flag:g?.flag||null,ahead:isT&&out.valid?ahead(b.school_id,b.user_id,ck):0,now:ck.at.slice(11)})});
 app.get('/api/tscan/photo',async(req,res,next)=>{try{const b=byCode(req.query.code),u=viewer(req);if(!b||!u||u.school_id!=b.school_id||!isGate(u))return E(res,401,'auth');req.query.t='1';await sendPhoto(req,res,b.user_id)}catch(e){next(e)}});
 app.post('/api/tscan/mark',(req,res)=>{const b=byCode(req.body.code),u=viewer(req);if(!b)return E(res,404,'invalid');if(!u||u.school_id!=b.school_id)return E(res,401,'auth');if(!isGate(u))return E(res,403,'role');
  const action=req.body.action,s=b.school_id,sc=SC.school(s),ck=SC.clock(sc);
  if(!['in','out'].includes(action)||b.void||!b.active||b.year!=yearOf(s)||b.role!='teacher')return E(res,400,'invalid');
  if(SC.lockedMonth(s,ck.date))return E(res,409,'mlocked');
  const g=db.prepare('SELECT * FROM gate WHERE user_id=? AND date=?').get(b.user_id,ck.date);
  if(action=='in'){if(g?.in_at)return E(res,409,'already');db.prepare('INSERT OR REPLACE INTO gate(id,school_id,user_id,date,in_at,by_id) VALUES((SELECT id FROM gate WHERE user_id=? AND date=?),?,?,?,?,?)').run(b.user_id,ck.date,s,b.user_id,ck.date,ck.at,u.id)}
  else{if(!g?.in_at)return E(res,409,'noin');if(g.out_at)return E(res,409,'already');const n=ahead(s,b.user_id,ck);if(n&&!req.body.confirm_early)return res.status(409).json({error:'early',ahead:n});
   db.prepare('UPDATE gate SET out_at=?,flag=COALESCE(flag,?),reason=COALESCE(?,reason) WHERE id=?').run(ck.at,n?'early':null,n?('left with '+n+' lesson(s) still scheduled'):null,g.id)}
  audit(u,'gate.'+action,b.username+' '+ck.date+' '+ck.at.slice(11)+' (badge)');res.json({ok:1})});
};
