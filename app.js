const express=require('./core/web'),cookie=()=>(q,s,n)=>n(),crypto=require('crypto'),{db,tx,hash,verify,code}=require('./db');
const SEC=require('./secure'),app=express();SEC.harden(app);app.use((req,res,next)=>{res.on('error',e=>console.error('response error:',req.path,e.code||e.message));next()});app.use(express.json({limit:'300kb'}),cookie(),express.static('public'));
const REF=require('./referral'),SECT=require('./sections'),B=require('./billing'),BK=require('./backup'),now=()=>new Date().toISOString(),E=(res,s,e)=>res.status(s).json({error:e});
const audit=(u,a,d='')=>db.prepare('INSERT INTO audit(school_id,user_id,action,detail) VALUES(?,?,?,?)').run(u.school_id,u.id,a,d);
const LIFE=role=>12*36e5; // everyone signs in again for every new session: the cookie ends when the browser closes, and the server drops it after 12 h
function session(res,u,role='principal'){const t=crypto.randomBytes(32).toString('hex');db.prepare('INSERT INTO sessions(token,user_id) VALUES(?,?)').run(t,u.id);res.cookie('t',t,SEC.cookieOpts(res,{httpOnly:true,sameSite:'lax'}))}
const supportUser=tok=>{const x=db.prepare("SELECT x.*,s.support_until FROM support_sessions x JOIN schools s ON s.id=x.school_id WHERE x.token=? AND x.ended IS NULL").get(tok);if(!x)return null;
 const t=now();if(x.expires<t||!x.support_until||x.support_until<t){db.prepare('UPDATE support_sessions SET ended=? WHERE id=?').run(t,x.id);return null}
 const p=db.prepare("SELECT u.*,s.name school,s.code scode,s.trial_ends,s.paid_until FROM users u JOIN schools s ON s.id=u.school_id WHERE u.school_id=? AND u.role='principal' AND u.active=1 ORDER BY u.id LIMIT 1").get(x.school_id);
 return p?{...p,support:true,support_id:x.id,support_owner:x.owner_name,support_expires:x.expires,areas:x.areas}:null};
const A2=require('./auth2');
const userOf=tok=>{if(String(tok||'').startsWith('sp_'))return supportUser(tok);const u=db.prepare('SELECT u.*,s.name school,s.code scode,s.trial_ends,s.paid_until,s.demo sdemo,x.created sess FROM sessions x JOIN users u ON u.id=x.user_id JOIN schools s ON s.id=u.school_id WHERE x.token=? AND u.active=1').get(tok||'');
 if(u&&Date.now()-Date.parse(u.sess.replace(' ','T')+'Z')>LIFE(u.role)){db.prepare('DELETE FROM sessions WHERE token=?').run(tok);return null}
 if(u&&!u.email_ok&&!u.sdemo)return null;   // no verified email, no access
 return u};
const auth=(roles=[],free=false)=>(req,res,next)=>{
 const u=userOf(req.cookies.t);
 if(!u)return E(res,401,'auth');if(roles.length&&!roles.includes(u.role))return E(res,403,'role');
 if(u.support){if(req.method!='GET'&&req.path!='/api/logout')return E(res,403,'support_readonly');
  if(req.method=='GET'&&!/^\/api\/(me|badges|announcements|billing)/.test(req.path)){const a=req.path.split('/')[2]||'',L=(u.areas||'').split(',').filter(Boolean);if(a&&!L.includes(a))L.push(a);db.prepare("UPDATE support_sessions SET reads=reads+1,last_seen=?,areas=? WHERE id=?").run(now(),L.join(','),u.support_id)}}
 if(!u.support&&!free&&req.method!='GET'&&!READ_OK.test(req.path)){const g=B.gate(u.school_id);if(g)return E(res,402,g)}
 if(!u.support&&!free&&req.method=='GET'&&OUT.test(req.path)&&B.lockedOut(u.school_id))return E(res,402,'locked');   // Term 3 unpaid: no file downloads, no statistics
 req.user=u;next()};
// outputs withheld while a Term 3 invoice is unpaid (entering data stays open)
const OUT=/^\/api\/(report(\/pdf|\/share)?|hours(\/pdf)?|fees\/receipt\/pdf|classes\/stats|dashboard|honour\/pdf|acct\/export|tprofile(\/.*)?)$/;
const LK=req=>!req.user.support&&B.lockedOut(req.user.school_id);
const READ_OK=/^\/api\/(report\/publish|logout)$/; // term-end report cards are never blocked
const TRK=/^\/api\/(structure|closed|unavail|timetable|mytimetable|classes\/qr|qr|today|gate|lesson|spot|hours|rates|myhours)(\/|$)/,FEE=/^\/api\/fees(\/|$)/,ROLL=/^\/api\/(roll|honour)(\/|$)/;
app.use((req,res,next)=>{const f=FEE.test(req.path)?'fees':TRK.test(req.path)?'tracking':ROLL.test(req.path)?'reports':'';if(!f)return next();
 const u=userOf(req.cookies.t);if(!u)return next();const m=(db.prepare('SELECT modules FROM schools WHERE id=?').get(u.school_id).modules||'reports,fees,tracking').split(',');
 m.includes(f)?next():E(res,403,'module')});
app.use('/api',(req,res,next)=>{if(req.method!='GET'){const u=userOf(req.cookies.t);if(u)res.on('finish',()=>{if(res.statusCode<300)try{B.touchPeak(u.school_id);BK.countWrite();if(!/^\/api\/(login|logout|auth|ai\/chat|me)/.test(req.path))require('./core/memo').clear(u.school_id)}catch{}})}next()}); // keep the term's peak counts current
const strong=p=>typeof p=='string'&&p.length>=8;
// --- schools & login
app.get('/api/prices',(req,res)=>{const p=B.P();res.json(Object.fromEntries(['reports','fees','tracking'].flatMap(m=>['solo','pair','bundle'].map(x=>[m+'_'+x,p[m+'_'+x]??p[m+'_solo']]))))});
app.post('/api/signup',async(req,res)=>{if(SEC.hit('su'+req.ip,10,36e5))return E(res,429,'many');const{school='',name='',phone='',city=''}=req.body,password=req.body.password||'',email=String(req.body.email||'').trim().toLowerCase();
 let username=String(req.body.username||'').trim();if(!username)username=String(name).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/^(mrs?|mme|mr|dr)\.?\s+/,'').replace(/[^a-z0-9]+/g,'.').replace(/^\.|\.$/g,'').slice(0,24)||'admin';
 const MODS=['reports','fees','tracking'],mods=req.body.modules==null?'reports,fees,tracking':MODS.filter(m=>String(req.body.modules).split(',').includes(m)).join(',');
 if(!school.trim()||!name.trim()||!mods)return E(res,400,'required');
 let refId=null;const rc=String(req.body.ref||'').trim();if(rc){const rr=REF.byCode(rc);if(!rr)return E(res,400,'refcode');if(rr.email==email)return E(res,400,'refself');refId=rr.id}if(!A2.okEmail(email))return E(res,400,'email');if(!strong(password))return E(res,400,'pw');
 const u=tx(()=>{let c;do c=code();while(db.prepare('SELECT 1 FROM schools WHERE code=?').get(c));
  const s=db.prepare('INSERT INTO schools(code,name,trial_ends,modules) VALUES(?,?,?,?)').run(c,school.trim(),'',mods);
  db.prepare('UPDATE schools SET trial_ends=? WHERE id=?').run(B.freeUntil(SC.school(s.lastInsertRowid),SC.clock(SC.school(s.lastInsertRowid)).date),s.lastInsertRowid);
  const r=db.prepare('INSERT INTO users(school_id,username,pw,name,role,phone,email,email_ok) VALUES(?,?,?,?,?,?,?,0)').run(s.lastInsertRowid,username.trim(),hash(password),name.trim(),'principal',String(phone).trim().slice(0,30),email);
  if(refId)db.prepare('UPDATE schools SET ref_id=?,ref_until=? WHERE id=?').run(refId,REF.until(SC.clock(SC.school(s.lastInsertRowid)).date),s.lastInsertRowid);
  db.prepare('UPDATE schools SET city=? WHERE id=?').run(String(city).trim().slice(0,60),s.lastInsertRowid);
  B.feeInvoice(s.lastInsertRowid);
  return{id:r.lastInsertRowid,school_id:s.lastInsertRowid,code:c,username}})();
 const tk=A2.make({user_id:u.id,kind:'signup'}),sent=await A2.sendCode(A2.get(tk),email,req.body.lang=='fr'?'fr':'en','verify');
 res.json({step:'code',ticket:tk,hint:A2.hint(email),sent:sent=='ok',username:u.username})});
const attempts={},DUMMY=hash('x'+crypto.randomBytes(8).toString('hex'));
app.post('/api/login',async(req,res)=>{const{code='',username='',password=''}=req.body,k=req.ip+code.toUpperCase()+username,lang=req.body.lang=='fr'?'fr':'en';
 if((attempts[k]||0)>=5||SEC.hit('lg'+req.ip,60,6e5))return E(res,429,'many');
 const u=db.prepare('SELECT u.* FROM users u JOIN schools s ON s.id=u.school_id WHERE s.code=? AND u.username=? AND u.active=1').get(code.trim().toUpperCase(),username.trim());
 if(u&&db.prepare('SELECT flag FROM schools WHERE id=?').get(u.school_id).flag=='cancelled')return E(res,403,'cancelled');
 if(!u)verify(password,DUMMY);   // same work whether or not the account exists
 if(!u||!verify(password,u.pw)){attempts[k]=(attempts[k]||0)+1;setTimeout(()=>delete attempts[k],6e5);return E(res,401,'login')}
 if(require('./pwhash').legacy(u.pw))db.prepare('UPDATE users SET pw=? WHERE id=?').run(hash(password),u.id);
 const demo=db.prepare('SELECT demo FROM schools WHERE id=?').get(u.school_id).demo;   // the demo school skips email checks
 if(demo||(u.email_ok&&A2.trusted(req,{id:u.id}))){session(res,u,u.role);audit(u,'login');return res.json({ok:1})}
 if(!u.email){const tk=A2.make({user_id:u.id,kind:'email'});return res.json({step:'email',ticket:tk})}
 const tk=A2.make({user_id:u.id,kind:'login'}),s=await A2.sendCode(A2.get(tk),u.email,lang,u.email_ok?'login':'verify');
 res.json({step:'code',ticket:tk,hint:A2.hint(u.email),sent:s=='ok'})});
A2.routes(app,{session,audit});
app.get('/api/me',auth([],true),(req,res)=>{const u=req.user;const sc=school(req),ck=SC.clock(sc);res.json({uid:u.id,gate:isGate(u),demo:!!sc.demo,now:ck,can_gate:!!u.can_gate,heads:db.prepare('SELECT COUNT(*) n FROM classes WHERE head_id=?').get(u.id).n,seqs:R.seqs(school(req)),year:school(req).year,name:u.name,role:u.role,roll:school(req).roll_mode||'off',honour:!!school(req).hr_on,sections:SECT.ensure(req.user.school_id).length,school:u.school,code:u.scode,support:u.support?{owner:u.support_owner,expires:u.support_expires}:null,modules:(school(req).modules||'reports,fees,tracking').split(','),ai:require('./ai').flag(u),bill:B.status(u.school_id),readonly:!!B.gate(u.school_id),active:true})});
app.post('/api/logout',auth([],true),(req,res)=>{if(req.user.support){db.prepare('UPDATE support_sessions SET ended=? WHERE id=?').run(now(),req.user.support_id);res.clearCookie('t');return res.json({ok:1})}
 db.prepare('DELETE FROM sessions WHERE token=?').run(req.cookies.t);res.clearCookie('t');res.json({ok:1})});
// --- classes (principal manages)
app.get('/api/classes',auth(),(req,res)=>{SECT.ensure(req.user.school_id);res.json(db.prepare('SELECT id,school_id,name,short,head_id,section_id,(SELECT name FROM sections s WHERE s.id=classes.section_id) section,(SELECT name FROM users u WHERE u.id=classes.head_id) head,(SELECT COUNT(*) FROM students x WHERE x.class_id=classes.id AND x.active=1) n FROM classes WHERE school_id=? ORDER BY (SELECT pos FROM sections s WHERE s.id=classes.section_id),name').all(req.user.school_id))});
// class cards: boys/girls and class / top / bottom average for the latest sequence with marks, with the change since the sequence before
app.get('/api/classes/stats',auth(),(req,res)=>{const sid=req.user.school_id,num=v=>typeof v=='number'&&isFinite(v),
 st=(cid,b)=>{const m=R.averages(sid,cid,b),v=Object.values(m).filter(num);if(!v.length)return null;const ids=Object.keys(m).filter(k=>num(m[k])),nm=Object.fromEntries(db.prepare('SELECT id,name FROM students WHERE class_id=? AND active=1').all(cid).map(x=>[x.id,x.name])),act=ids.filter(k=>nm[k]!=null).map(k=>+k).filter(k=>num(m[k]));if(!act.length)return null;const vs=act.map(k=>m[k]),hi=Math.max(...vs),lo=Math.min(...vs),pass=vs.filter(x=>x>=10).length;return{avg:vs.reduce((a,x)=>a+x,0)/vs.length,top:hi,bottom:lo,pass,graded:vs.length,pct:pass/vs.length*100,top_name:nm[act.find(k=>m[k]==hi)],bottom_name:nm[act.find(k=>m[k]==lo)]}},
 prevOf=b=>{const m=/^([ST])(\d+)$/.exec(b);return m&&+m[2]>1?m[1]+(+m[2]-1):null},dir=(a,b)=>b==null||a==null||Math.abs(a-b)<.005?0:a>b?1:-1;
 res.json(db.prepare('SELECT id FROM classes WHERE school_id=?').all(sid).map(c=>{const g=db.prepare("SELECT sex,COUNT(*) n FROM students WHERE class_id=? AND active=1 GROUP BY sex").all(c.id),b=R.defaultBasis(sid,[c.id]),cur=st(c.id,b),pb=prevOf(b),pv=pb?st(c.id,pb):null;
  return{id:c.id,boys:(g.find(x=>x.sex=='M')||{}).n||0,girls:(g.find(x=>x.sex=='F')||{}).n||0,basis:b,avg:cur&&cur.avg,top:cur&&cur.top,bottom:cur&&cur.bottom,d_avg:cur?dir(cur.avg,pv&&pv.avg):0,pct:cur&&cur.pct,pass:cur&&cur.pass,graded:cur&&cur.graded,top_name:cur&&cur.top_name,bottom_name:cur&&cur.bottom_name,d_pct:cur?dir(cur.pct,pv&&pv.pct):0,d_top:cur?dir(cur.top,pv&&pv.top):0,d_bottom:cur?dir(cur.bottom,pv&&pv.bottom):0}})) });
app.post('/api/classes',auth(['principal']),(req,res)=>{const n=(req.body.name||'').trim(),sh=String(req.body.short??'').trim();if(!n||!sh)return E(res,400,'required');if(sh.length>8||/[\x00-\x1f]/.test(sh))return E(res,400,'invalid');
 const sec=req.body.section_id?SECT.valid(req.user.school_id,req.body.section_id):SECT.ensure(req.user.school_id)[0].id;if(!sec)return E(res,400,'sec_404');
 db.prepare('INSERT INTO classes(school_id,name,short,qr,section_id) VALUES(?,?,?,?,?)').run(req.user.school_id,n,sh,crypto.randomBytes(12).toString('hex'),sec);audit(req.user,'class.add',n+' ('+sh+')');res.json({ok:1})});
app.post('/api/classes/short',auth(['principal']),(req,res)=>{const sh=String(req.body.short??'').trim();if(!sh)return E(res,400,'required');if(sh.length>8||/[\x00-\x1f]/.test(sh))return E(res,400,'invalid');
 if(!db.prepare('UPDATE classes SET short=? WHERE id=? AND school_id=?').run(sh,+req.body.class_id||0,req.user.school_id).changes)return E(res,400,'invalid');audit(req.user,'class.short',req.body.class_id+'->'+sh);res.json({ok:1})});
// edit a class in one go: name, short name, head teacher
app.post('/api/classes/update',auth(['principal']),(req,res)=>{const sid=req.user.school_id,id=+req.body.class_id||0,n=String(req.body.name??'').trim(),sh=String(req.body.short??'').trim(),h=req.body.head_id?+req.body.head_id:null;
 if(!db.prepare('SELECT 1 FROM classes WHERE id=? AND school_id=?').get(id,sid))return E(res,404,'invalid');if(!n||!sh)return E(res,400,'required');if(n.length>60||sh.length>8||/[\x00-\x1f]/.test(n+sh))return E(res,400,'invalid');
 if(h&&!db.prepare("SELECT 1 FROM users WHERE id=? AND school_id=? AND role='teacher' AND active=1").get(h,sid))return E(res,400,'invalid');
 const sec=req.body.section_id?SECT.valid(sid,req.body.section_id):0;if(req.body.section_id&&!sec)return E(res,400,'sec_404');
 try{db.prepare('UPDATE classes SET name=?,short=?,head_id=?,section_id=COALESCE(?,section_id) WHERE id=? AND school_id=?').run(n,sh,h,sec||null,id,sid)}catch(e){return res.status(409).json({error:'duplicate'})}
 audit(req.user,'class.edit',id+' '+n+' ('+sh+') head '+h);res.json({ok:1})});
// letterhead for printed lists: the lines under Settings → School name / "Under the name", and the logo
app.get('/api/brand',auth(),(req,res)=>{const sc=school(req);res.json({lines:require('./head')(sc),logo:sc.card_logo||''})});
// --- staff (principal manages)
app.get('/api/users',auth(['principal']),(req,res)=>{const sid=req.user.school_id,subs=db.prepare('SELECT s.teacher_id main,s.id,s.name subject,c.id cid,c.name cls,c.short FROM subjects s JOIN classes c ON c.id=s.class_id WHERE s.school_id=?').all(sid),seq=db.prepare('SELECT q.subject_id,q.teacher_id FROM subject_seq q JOIN subjects s ON s.id=q.subject_id WHERE s.school_id=?').all(sid),heads=db.prepare('SELECT id,name,short,head_id FROM classes WHERE school_id=? AND head_id IS NOT NULL').all(sid);
 res.json(db.prepare('SELECT id,username,name,role,active,can_gate,email,email_ok FROM users WHERE school_id=? AND active=1 ORDER BY id').all(sid).map(u=>{const m={};for(const x of subs)if(x.main==u.id||seq.some(q=>q.subject_id==x.id&&q.teacher_id==u.id))(m[x.cid]??={cid:x.cid,cls:x.cls,short:x.short,subjects:[],head:false}).subjects.push(x.subject);for(const h of heads)if(h.head_id==u.id)(m[h.id]??={cid:h.id,cls:h.name,short:h.short,subjects:[],head:false}).head=true;
  return{...u,has_photo:!!db.prepare('SELECT 1 FROM staff_photos WHERE user_id=?').get(u.id),sections:u.role=='teacher'?SECT.ofUser(sid,u.id):[],classes:Object.values(m).sort((a,b)=>a.cls.localeCompare(b.cls))}}))});
app.post('/api/users',auth(['principal']),(req,res)=>{const{username='',name='',role='',password=''}=req.body,email=String(req.body.email||'').trim().toLowerCase();
 if(!username.trim()||!name.trim())return E(res,400,'required');if(!A2.okEmail(email))return E(res,400,'email');if(db.prepare("SELECT 1 FROM users WHERE school_id=? AND active=1 AND lower(email)=?").get(req.user.school_id,email))return E(res,409,'email_used');if(!['secretary','teacher','surveillant'].includes(role))return E(res,400,'invalid');if(!strong(password))return E(res,400,'pw');
 if(role=='teacher'&&SECT.ensure(req.user.school_id).length>1&&!(Array.isArray(req.body.sections)&&req.body.sections.some(i=>SECT.valid(req.user.school_id,i))))return E(res,400,'sec_teacher');
 const nu=db.prepare('INSERT INTO users(school_id,username,pw,name,role,can_gate,email,email_ok) VALUES(?,?,?,?,?,?,?,0)').run(req.user.school_id,username.trim(),hash(password),name.trim(),role,req.body.can_gate?1:0,email);if(role=='teacher')SECT.setUser(req.user.school_id,Number(nu.lastInsertRowid),req.body.sections);audit(req.user,'user.add',username);res.json({ok:1})});
// --- students
app.get('/api/students',auth(['principal','secretary']),(req,res)=>{const f='%'+(req.query.q||'')+'%',c=+req.query.class_id||null;
 res.json(db.prepare('SELECT s.*,c.name cls FROM students s LEFT JOIN classes c ON c.id=s.class_id WHERE s.school_id=? AND s.active=1 AND (s.name LIKE ? OR s.matricule LIKE ?) AND (? IS NULL OR s.class_id=?) ORDER BY s.id DESC').all(req.user.school_id,f,f,c,c))});
app.get('/api/students/next',auth(['principal','secretary']),(req,res)=>res.json({matricule:new Date().getFullYear().toString().slice(2)+'-'+String(db.prepare('SELECT COUNT(*)+1 n FROM students WHERE school_id=?').get(req.user.school_id).n).padStart(4,'0')}));
// everything about one student, for the overlay on the Classes and students page
app.get('/api/students/summary',auth(['principal','secretary','teacher']),(req,res)=>{const sid=req.user.school_id,st=db.prepare('SELECT s.*,c.name cls,c.head_id,(SELECT name FROM users u WHERE u.id=c.head_id) head FROM students s JOIN classes c ON c.id=s.class_id WHERE s.id=? AND s.school_id=?').get(+req.query.id||0,sid);
 if(!st)return E(res,404,'invalid');if(req.user.role=='teacher'&&st.head_id!=req.user.id)return E(res,403,'role');
 const terms=[];if(!LK(req))for(const t of [1,2,3]){const c=R.compute(sid,st.class_id,t),me=c.students.find(x=>x.id==st.id);if(!me||!me.has)continue;terms.push({term:t,annual:c.annual,avg:me.head,rank:me.rank,of:c.size,class_avg:c.stats.avg,published:R.isLocked(st.class_id,t),rows:me.rows.map(r=>({subject:r.subject,coef:r.coef,avg:r.avg,rank:r.rank,of:r.of,teacher:r.teacher}))})}
 res.json({id:st.id,name:st.name,matricule:st.matricule,sex:st.sex,dob:st.dob,enrolled:st.enrolled,guardian:st.guardian,phone:st.phone,class_id:st.class_id,cls:st.cls,head:st.head,terms,roll:(school(req).roll_mode||'off')!='off'?require('./roll').attend(sid,st.id):null,can_edit:req.user.role!='teacher',...(req.user.role!='teacher'?{photo_at:(db.prepare('SELECT at FROM student_photos WHERE student_id=?').get(st.id)||{}).at||null,has_badge:!!db.prepare('SELECT 1 FROM badges WHERE student_id=? AND void=0').get(st.id)}:{})})});
app.post('/api/students/update',auth(['principal','secretary']),(req,res)=>{const sid=req.user.school_id,b=req.body,name=String(b.name||'').trim(),id=+b.id||0;
 if(!name||name.length>120)return E(res,400,'name');if(!['F','M'].includes(b.sex))return E(res,400,'invalid');const cl=v=>String(v??'').trim().slice(0,120);
 if(!db.prepare('UPDATE students SET name=?,sex=?,dob=?,guardian=?,phone=? WHERE id=? AND school_id=?').run(name,b.sex,cl(b.dob),cl(b.guardian),cl(b.phone),id,sid).changes)return E(res,404,'invalid');audit(req.user,'student.edit',id+' '+name);res.json({ok:1})});
app.post('/api/students/deactivate',auth(['principal','secretary']),(req,res)=>{const id=+req.body.id||0;if(!db.prepare('UPDATE students SET active=0 WHERE id=? AND school_id=?').run(id,req.user.school_id).changes)return E(res,404,'invalid');audit(req.user,'student.deactivate',String(id));res.json({ok:1})});
app.post('/api/students',auth(['principal','secretary']),(req,res)=>{const b=req.body,sid=req.user.school_id,name=(b.name||'').trim();
 if(!name)return E(res,400,'name');
 if(!['F','M'].includes(b.sex)||!db.prepare('SELECT 1 FROM classes WHERE id=? AND school_id=?').get(b.class_id,sid))return E(res,400,'invalid');
 if(!b.force&&db.prepare('SELECT 1 FROM students WHERE school_id=? AND lower(name)=lower(?) AND active=1').get(sid,name))return res.status(409).json({error:'duplicate'});
 const mat=tx(()=>{const n=db.prepare('SELECT COUNT(*)+1 n FROM students WHERE school_id=?').get(sid).n,
  m=new Date().getFullYear().toString().slice(2)+'-'+String(n).padStart(4,'0');
  db.prepare('INSERT INTO students(school_id,matricule,name,dob,sex,class_id,enrolled,guardian,phone) VALUES(?,?,?,?,?,?,?,?,?)').run(sid,m,name,b.dob||null,b.sex,b.class_id,b.enrolled||now().slice(0,10),b.guardian||null,b.phone||null);return m})();
 audit(req.user,'student.add',mat);res.json({matricule:mat,id:db.prepare('SELECT id FROM students WHERE school_id=? AND matricule=?').get(sid,mat).id})});
// --- subjects & marks (Phase 2)
const SC=require('./sched'),isGate=u=>u.role=='principal'||u.role=='surveillant'||!!u.can_gate,R=require('./report'),P=require('./pdf'),school=req=>db.prepare('SELECT * FROM schools WHERE id=?').get(req.user.school_id),seqOf=(req,id)=>R.seqs(school(req)).find(q=>q.id==id);
const teamOf=x=>{const nm=id=>(db.prepare('SELECT name FROM users WHERE id=?').get(id)||{}).name||'?',ov=db.prepare('SELECT seq,teacher_id FROM subject_seq WHERE subject_id=? ORDER BY seq').all(x.id),by={};
 for(const r of ov)(by[r.teacher_id]??=[]).push(r.seq);const out=[];if(x.teacher_id)out.push({id:x.teacher_id,name:nm(x.teacher_id),main:true,seqs:by[x.teacher_id]||[]});
 for(const[id,q]of Object.entries(by))if(+id!=x.teacher_id)out.push({id:+id,name:nm(+id),main:false,seqs:q});return out};
app.get('/api/subjects',auth(['principal']),(req,res)=>{const cn=db.prepare('SELECT name FROM classes WHERE id=? AND school_id=?').get(+req.query.class_id||0,req.user.school_id),cl=SC.clashes(req.user.school_id,SC.clock(school(req)).date);
 res.json(db.prepare('SELECT s.*,u.name teacher FROM subjects s LEFT JOIN users u ON u.id=s.teacher_id WHERE s.school_id=? AND s.class_id=? ORDER BY s.id').all(req.user.school_id,+req.query.class_id||0).map(x=>{const m=cl.filter(c=>c.teacher_id==x.teacher_id&&cn&&String(c.classes).split(', ').includes(cn.name));return{...x,marks:db.prepare('SELECT COUNT(*) n FROM marks WHERE subject_id=?').get(x.id).n,lessons:db.prepare('SELECT COUNT(*) n FROM lessons WHERE subject_id=?').get(x.id).n,slots:db.prepare('SELECT COUNT(*) n FROM slots WHERE subject_id=?').get(x.id).n,clash:m.filter(c=>c.kind=='clash').length,unavail:m.filter(c=>c.kind=='unavail').length,seqteach:Object.fromEntries(db.prepare('SELECT seq,teacher_id FROM subject_seq WHERE subject_id=?').all(x.id).map(r=>[r.seq,r.teacher_id])),team:teamOf(x)}}))});
app.post('/api/subjects/update',auth(['principal']),(req,res)=>{const sid=req.user.school_id,n=String(req.body.name??'').trim(),k=+req.body.coef,id=+req.body.id||0;
 if(!n||n.length>60||!(k>0&&k<=10))return E(res,400,'invalid');
 try{if(!db.prepare('UPDATE subjects SET name=?,coef=? WHERE id=? AND school_id=?').run(n,k,id,sid).changes)return E(res,404,'invalid')}catch(e){return res.status(409).json({error:'duplicate'})}
 audit(req.user,'subject.edit',id+' '+n+' x'+k);res.json({ok:1})});
// a subject can only be deleted while nothing depends on it: no marks and no lessons
app.post('/api/subjects/delete',auth(['principal']),(req,res)=>{const sid=req.user.school_id,id=+req.body.id||0,x=db.prepare('SELECT * FROM subjects WHERE id=? AND school_id=?').get(id,sid);if(!x)return E(res,404,'invalid');
 const m=db.prepare('SELECT COUNT(*) n FROM marks WHERE subject_id=?').get(id).n,l=db.prepare('SELECT COUNT(*) n FROM lessons WHERE subject_id=?').get(id).n;if(m||l)return res.status(409).json({error:'inuse',marks:m,lessons:l});
 tx(()=>{for(const t of['subject_seq','mark_sheets','slots','exams'])db.prepare(`DELETE FROM ${t} WHERE subject_id=?`).run(id);db.prepare('DELETE FROM subjects WHERE id=?').run(id)})();audit(req.user,'subject.delete',id+' '+x.name);res.json({ok:1})});
app.post('/api/subjects/seqteacher',auth(['principal']),(req,res)=>{const{subject_id,seq,teacher_id}=req.body,sid=req.user.school_id;
 if(!db.prepare('SELECT 1 FROM subjects WHERE id=? AND school_id=?').get(subject_id,sid)||!seqOf(req,seq))return E(res,400,'invalid');
 if(teacher_id&&!db.prepare("SELECT 1 FROM users WHERE id=? AND school_id=? AND role='teacher' AND active=1").get(teacher_id,sid))return E(res,400,'invalid');
 if(teacher_id)db.prepare('INSERT INTO subject_seq(subject_id,seq,teacher_id) VALUES(?,?,?) ON CONFLICT(subject_id,seq) DO UPDATE SET teacher_id=excluded.teacher_id').run(subject_id,seq,teacher_id);else db.prepare('DELETE FROM subject_seq WHERE subject_id=? AND seq=?').run(subject_id,seq);
 audit(req.user,'subject.seqteacher',`${subject_id}:${seq}->${teacher_id||'main'}`);res.json({ok:1})});
app.post('/api/subjects',auth(['principal']),(req,res)=>{const{class_id,name='',coef}=req.body,k=+coef;
 if(!name.trim()||!(k>0&&k<=10)||!db.prepare('SELECT 1 FROM classes WHERE id=? AND school_id=?').get(class_id,req.user.school_id))return E(res,400,'invalid');
 db.prepare('INSERT INTO subjects(school_id,class_id,name,coef) VALUES(?,?,?,?)').run(req.user.school_id,class_id,name.trim(),k);audit(req.user,'subject.add',name);res.json({ok:1})});
app.post('/api/subjects/teacher',auth(['principal']),(req,res)=>{const{subject_id,teacher_id}=req.body,sid=req.user.school_id;
 if(teacher_id&&!db.prepare("SELECT 1 FROM users WHERE id=? AND school_id=? AND role='teacher' AND active=1").get(teacher_id,sid))return E(res,400,'invalid');
 if(!db.prepare('UPDATE subjects SET teacher_id=? WHERE id=? AND school_id=?').run(teacher_id||null,subject_id,sid).changes)return E(res,400,'invalid');
 audit(req.user,'subject.teacher',subject_id+'->'+teacher_id);res.json({ok:1,clashes:SC.reassign(sid,subject_id,teacher_id||null,SC.clock(school(req)).date)})});
const involved="(s.teacher_id=? OR c.head_id=? OR EXISTS(SELECT 1 FROM subject_seq q WHERE q.subject_id=s.id AND q.teacher_id=?) OR (s.parts=1 AND EXISTS(SELECT 1 FROM subject_teachers t WHERE t.subject_id=s.id AND t.teacher_id=?)))";
// teaching team of a subject: the main teacher and the extra teachers. With parts on, each member enters their own mark and the subject mark is the average.
const teamIds=s=>[...new Set([s.teacher_id,...db.prepare('SELECT teacher_id FROM subject_teachers WHERE subject_id=?').all(s.id).map(r=>r.teacher_id)].filter(Boolean))];
// may this teacher ENTER marks for this sequence? class head always; a sequence given to a specific teacher belongs to them alone; otherwise the subject's main teacher
const canSeq=(s,c,uid,seq)=>s.parts?teamIds(s).includes(uid):c.head_id==uid||(()=>{const o=db.prepare('SELECT teacher_id FROM subject_seq WHERE subject_id=? AND seq=?').get(s.id,seq);return o?o.teacher_id==uid:s.teacher_id==uid})();
app.post('/api/subjects/team',auth(['principal']),(req,res)=>{const{subject_id,teacher_id,mode,seqs=[]}=req.body,sid=req.user.school_id;
 const sub=db.prepare('SELECT * FROM subjects WHERE id=? AND school_id=?').get(subject_id,sid);
 if(!sub||!db.prepare("SELECT 1 FROM users WHERE id=? AND school_id=? AND role='teacher' AND active=1").get(teacher_id,sid))return E(res,400,'invalid');
 let clashes=[];
 if(mode=='main'){db.prepare('UPDATE subjects SET teacher_id=? WHERE id=?').run(teacher_id,sub.id);audit(req.user,'subject.teacher',sub.id+'->'+teacher_id);clashes=SC.reassign(sid,sub.id,teacher_id,SC.clock(school(req)).date)}
 else if(mode=='seqs'){const ok=R.seqs(school(req)).map(q=>q.id);if(!Array.isArray(seqs)||!seqs.length||!seqs.every(q=>ok.includes(q)))return E(res,400,'invalid');
  tx(()=>{for(const q of seqs)db.prepare('INSERT INTO subject_seq(subject_id,seq,teacher_id) VALUES(?,?,?) ON CONFLICT(subject_id,seq) DO UPDATE SET teacher_id=excluded.teacher_id').run(sub.id,q,teacher_id)})();audit(req.user,'subject.seqteacher',`${sub.id}:${seqs.join(',')}->${teacher_id}`)}
 else return E(res,400,'invalid');
 res.json({ok:1,clashes})});
app.post('/api/subjects/team/remove',auth(['principal']),(req,res)=>{const{subject_id,teacher_id}=req.body,sid=req.user.school_id,sub=db.prepare('SELECT * FROM subjects WHERE id=? AND school_id=?').get(subject_id,sid);if(!sub)return E(res,400,'invalid');
 tx(()=>{db.prepare('DELETE FROM subject_seq WHERE subject_id=? AND teacher_id=?').run(sub.id,teacher_id);if(sub.teacher_id==teacher_id){db.prepare('UPDATE subjects SET teacher_id=NULL WHERE id=?').run(sub.id);SC.reassign(sid,sub.id,null,SC.clock(school(req)).date)}})();
 audit(req.user,'subject.team.remove',sub.id+':'+teacher_id);res.json({ok:1})});
// small profile card for a teacher: contact, what they teach, presence this month
app.get('/api/teacher/card',auth(['principal','surveillant']),(req,res)=>{const sid=req.user.school_id,u=db.prepare("SELECT id,name,username,phone,active,can_gate FROM users WHERE id=? AND school_id=? AND role='teacher'").get(+req.query.teacher_id||0,sid);if(!u)return E(res,404,'invalid');
 const ym=SC.clock(school(req)).date.slice(0,7),pm=(()=>{const[y,m]=ym.split('-').map(Number);return m==1?`${y-1}-12`:`${y}-${String(m-1).padStart(2,'0')}`})(),
  st=m=>{const t=SC.monthSummary(sid,m).teachers.find(x=>x.id==u.id)||{sched:0,present:0,late:0,absent:0,unconf:0},got=t.present+t.late,den=got+t.absent+(t.unconf||0);return{sched:t.sched,present:t.present,late:t.late,absent:t.absent,rate:den?Math.round(100*got/den):null}},
  subs=db.prepare('SELECT s.id,s.name,s.teacher_id,c.name cls FROM subjects s JOIN classes c ON c.id=s.class_id WHERE s.school_id=? AND (s.teacher_id=? OR EXISTS(SELECT 1 FROM subject_seq q WHERE q.subject_id=s.id AND q.teacher_id=?)) ORDER BY c.name,s.name').all(sid,u.id,u.id).map(x=>({id:x.id,name:x.name,cls:x.cls,main:x.teacher_id==u.id,seqs:db.prepare('SELECT seq FROM subject_seq WHERE subject_id=? AND teacher_id=? ORDER BY seq').all(x.id,u.id).map(r=>r.seq)})),
  g=db.prepare('SELECT COUNT(*) n,MAX(date) last FROM gate WHERE user_id=? AND in_at IS NOT NULL AND date LIKE ?').get(u.id,ym+'%');
 res.json({...u,ym,subjects:subs,month:st(ym),prev:st(pm),days_in:g.n,last_in:g.last||null})});
app.get('/api/mysubjects',auth(['teacher']),(req,res)=>{const all=R.seqs(school(req)).map(q=>q.id);res.json(db.prepare(`SELECT s.id,s.name,s.coef,s.parts,s.teacher_id,c.name cls,c.head_id FROM subjects s JOIN classes c ON c.id=s.class_id WHERE ${involved} AND s.school_id=? ORDER BY c.name,s.name`).all(req.user.id,req.user.id,req.user.id,req.user.id,req.user.school_id).map(x=>({id:x.id,name:x.name,coef:x.coef,parts:x.parts,cls:x.cls,can:all.filter(q=>canSeq(x,x,req.user.id,q))})))});
const mySub=(req,id)=>db.prepare(`SELECT s.*,c.head_id FROM subjects s JOIN classes c ON c.id=s.class_id WHERE s.id=? AND s.school_id=? AND ${involved}`).get(+id||0,req.user.school_id,req.user.id,req.user.id,req.user.id,req.user.id);
app.get('/api/marks',auth(['teacher']),(req,res)=>{const s=mySub(req,req.query.subject_id),q=seqOf(req,req.query.seq);if(!s||!q)return E(res,403,'role');
 const base={locked:R.isLocked(s.class_id,q.term),can:canSeq(s,s,req.user.id,q.id)};
 if(s.parts){const team=teamIds(s),nm=Object.fromEntries(db.prepare('SELECT id,name FROM users WHERE id IN('+team.join(',')+')').all().map(u=>[u.id,u.name])),done=new Set(db.prepare('SELECT teacher_id FROM mark_part_sheets WHERE subject_id=? AND seq=?').all(s.id,q.id).map(r=>r.teacher_id));
  return res.json({...base,submitted:done.has(req.user.id),parts:{team:team.map(id=>({id,name:nm[id],main:id==s.teacher_id,done:done.has(id)})),mine:team.includes(req.user.id)},
   rows:db.prepare('SELECT st.id,st.name,p.value,m.value avg,m.status FROM students st LEFT JOIN mark_parts p ON p.student_id=st.id AND p.subject_id=? AND p.seq=? AND p.teacher_id=? LEFT JOIN marks m ON m.student_id=st.id AND m.subject_id=? AND m.seq=? WHERE st.school_id=? AND st.class_id=? AND st.active=1 ORDER BY st.name').all(s.id,q.id,req.user.id,s.id,q.id,req.user.school_id,s.class_id)})}
 res.json({...base,submitted:!!db.prepare('SELECT 1 FROM mark_sheets WHERE subject_id=? AND seq=?').get(s.id,q.id),rows:db.prepare('SELECT st.id,st.name,m.value,m.status FROM students st LEFT JOIN marks m ON m.student_id=st.id AND m.subject_id=? AND m.seq=? WHERE st.school_id=? AND st.class_id=? AND st.active=1 ORDER BY st.name').all(s.id,q.id,req.user.school_id,s.class_id)})});
// parts mode: the subject mark of a student is the average of the team members' marks, once every member has entered theirs
function partsRecompute(s,seq,studentId,team,wasComplete){const rows=db.prepare('SELECT teacher_id,value FROM mark_parts WHERE student_id=? AND subject_id=? AND seq=?').all(studentId,s.id,seq),have=new Set(rows.map(r=>r.teacher_id)),complete=team.every(t=>have.has(t));
 if(complete){const avg=Math.round(rows.filter(r=>team.includes(r.teacher_id)).reduce((n,r)=>n+r.value,0)/team.length*100)/100;
  db.prepare("INSERT INTO marks(school_id,student_id,subject_id,seq,value,status,updated) VALUES(?,?,?,?,?,'draft',?) ON CONFLICT(student_id,subject_id,seq) DO UPDATE SET value=excluded.value,updated=excluded.updated").run(s.school_id,studentId,s.id,seq,avg,now())}
 else if(wasComplete)db.prepare('DELETE FROM marks WHERE student_id=? AND subject_id=? AND seq=?').run(studentId,s.id,seq)}
app.post('/api/marks',auth(['teacher']),(req,res)=>{const{subject_id,seq,marks=[],submit}=req.body,s=mySub(req,subject_id),q=seqOf(req,seq);if(!s||!q||!canSeq(s,s,req.user.id,q.id))return E(res,403,'role');
 if(R.isLocked(s.class_id,q.term))return E(res,409,'locked');
 const ids=new Set(db.prepare('SELECT id FROM students WHERE school_id=? AND class_id=? AND active=1').all(req.user.school_id,s.class_id).map(r=>r.id));
 for(const m of marks)if(!ids.has(m.student_id)||(m.value!==null&&!(typeof m.value=='number'&&m.value>=0&&m.value<=20)))return E(res,400,'range');
 if(s.parts){const team=teamIds(s);
  tx(()=>{for(const m of marks){const was=team.every(t=>db.prepare('SELECT 1 FROM mark_parts WHERE student_id=? AND subject_id=? AND seq=? AND teacher_id=?').get(m.student_id,s.id,seq,t));
    if(m.value===null)db.prepare('DELETE FROM mark_parts WHERE student_id=? AND subject_id=? AND seq=? AND teacher_id=?').run(m.student_id,s.id,seq,req.user.id);
    else db.prepare('INSERT INTO mark_parts(student_id,subject_id,seq,teacher_id,value,updated) VALUES(?,?,?,?,?,?) ON CONFLICT(student_id,subject_id,seq,teacher_id) DO UPDATE SET value=excluded.value,updated=excluded.updated').run(m.student_id,s.id,seq,req.user.id,m.value,now());
    partsRecompute(s,seq,m.student_id,team,was)}
   audit(req.user,'marks.part',s.id+':'+seq+' x'+marks.length);
   if(submit)db.prepare('INSERT INTO mark_part_sheets(subject_id,seq,teacher_id,at) VALUES(?,?,?,?) ON CONFLICT(subject_id,seq,teacher_id) DO UPDATE SET at=excluded.at').run(s.id,seq,req.user.id,now());
   else db.prepare('DELETE FROM mark_part_sheets WHERE subject_id=? AND seq=? AND teacher_id=?').run(s.id,seq,req.user.id);
   // the subject sheet counts as submitted when every member has submitted theirs
   const all=team.every(t=>db.prepare('SELECT 1 FROM mark_part_sheets WHERE subject_id=? AND seq=? AND teacher_id=?').get(s.id,seq,t));
   if(all){db.prepare("UPDATE marks SET status='submitted' WHERE subject_id=? AND seq=?").run(s.id,seq);db.prepare('INSERT INTO mark_sheets(school_id,subject_id,seq,by_id,at) VALUES(?,?,?,?,?) ON CONFLICT(subject_id,seq) DO UPDATE SET by_id=excluded.by_id,at=excluded.at').run(req.user.school_id,s.id,seq,req.user.id,now())}
   else{db.prepare("UPDATE marks SET status='draft' WHERE subject_id=? AND seq=?").run(s.id,seq);db.prepare('DELETE FROM mark_sheets WHERE subject_id=? AND seq=?').run(s.id,seq)}})();
  return res.json({ok:1})}
 tx(()=>{let added=0;const st=submit?'submitted':'draft';for(const m of marks){const k=[m.student_id,s.id,seq],old=db.prepare('SELECT value,status FROM marks WHERE student_id=? AND subject_id=? AND seq=?').get(...k);
  if(m.value===null){if(old){db.prepare('DELETE FROM marks WHERE student_id=? AND subject_id=? AND seq=?').run(...k);audit(req.user,'mark.del',k.join(':'))}continue}
  if(old&&old.value===m.value&&old.status===st)continue;
  db.prepare("INSERT INTO marks(school_id,student_id,subject_id,seq,value,status,updated) VALUES(?,?,?,?,?,?,?) ON CONFLICT(student_id,subject_id,seq) DO UPDATE SET value=excluded.value,status=excluded.status,updated=excluded.updated").run(req.user.school_id,...k,m.value,st,now());
  if(!old)added++;else if(old.value!==m.value)audit(req.user,'mark.set',k.join(':')+' '+old.value+' -> '+m.value)}
  if(added)audit(req.user,'marks.add',s.id+':'+seq+' x'+added);
  if(submit)db.prepare('INSERT INTO mark_sheets(school_id,subject_id,seq,by_id,at) VALUES(?,?,?,?,?) ON CONFLICT(subject_id,seq) DO UPDATE SET by_id=excluded.by_id,at=excluded.at').run(req.user.school_id,s.id,seq,req.user.id,now());
  else db.prepare('DELETE FROM mark_sheets WHERE subject_id=? AND seq=?').run(s.id,seq)})();
 res.json({ok:1})});
// switch per-teacher marks on or off for a subject (needs at least two teachers in the team)
app.post('/api/subjects/parts',auth(['principal']),(req,res)=>{const sid=req.user.school_id,sub=db.prepare('SELECT * FROM subjects WHERE id=? AND school_id=?').get(+req.body.subject_id||0,sid);if(!sub)return E(res,400,'invalid');
 const on=req.body.on?1:0;if(on&&teamIds(sub).length<2)return E(res,400,'noteam');
 db.prepare('UPDATE subjects SET parts=? WHERE id=?').run(on,sub.id);audit(req.user,'subject.parts',sub.id+' '+on);res.json({ok:1})});
// who has entered what for a subject with parts
app.get('/api/subjects/parts',auth(['principal']),(req,res)=>{const sid=req.user.school_id,sub=db.prepare('SELECT * FROM subjects WHERE id=? AND school_id=?').get(+req.query.subject_id||0,sid);if(!sub)return E(res,400,'invalid');
 const team=teamIds(sub),n=db.prepare('SELECT COUNT(*) n FROM students WHERE class_id=? AND active=1').get(sub.class_id).n,nm=Object.fromEntries(db.prepare('SELECT id,name FROM users WHERE school_id=?').all(sid).map(u=>[u.id,u.name]));
 res.json({on:!!sub.parts,students:n,seqs:R.seqs(school(req)).map(q=>({id:q.id,team:team.map(id=>({id,name:nm[id],main:id==sub.teacher_id,entered:db.prepare('SELECT COUNT(*) n FROM mark_parts WHERE subject_id=? AND seq=? AND teacher_id=?').get(sub.id,q.id,id).n,submitted:!!db.prepare('SELECT 1 FROM mark_part_sheets WHERE subject_id=? AND seq=? AND teacher_id=?').get(sub.id,q.id,id)}))}))})});
// --- school settings (header text, year, sequences per term)
app.get('/api/settings',auth(['principal']),(req,res)=>{const x=school(req);const y=B.schoolYear(SC.clock(x).date);res.json({card:{c1:x.card_c1||'#1e5d46',c2:x.card_c2||'',lang:x.card_lang||'both',logo:x.card_logo||'',fees:x.card_fees!=0,has_fees:(x.modules||'reports,fees,tracking').includes('fees')},honour:{on:!!x.hr_on,tiers:R.hrTiers(x),top:x.hr_top||0,nofail:x.hr_nofail||0},name:x.name,header:x.header||'',year:x.year||'',seq_plan:x.seq_plan||'2,2,2',term_year:y,terms:B.termsOf(x,y).map(r=>[r.start,r.end])})});
// ---- report card design (logo, up to two colours, languages)
const HEX=/^#[0-9a-f]{6}$/i,lum=h=>{const c=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255).map(v=>v<=.03928?v/12.92:((v+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2]};
function logoOk(u){const m=/^data:(image\/(png|jpeg));base64,([A-Za-z0-9+\/=]+)$/.exec(u||'');if(!m)return false;const b=Buffer.from(m[3],'base64');if(b.length>150e3||b.length<100)return false;
 return m[2]=='png'?b.slice(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):(b[0]==0xff&&b[1]==0xd8)}
app.post('/api/settings/card',auth(['principal']),(req,res)=>{const{c1,c2='',lang,logo,fees}=req.body,sid=req.user.school_id;
 if(!HEX.test(c1||''))return E(res,400,'color');if(lum(c1)>.5)return E(res,400,'too_light');if(c2&&!HEX.test(c2))return E(res,400,'color');if(!['en','fr','both'].includes(lang))return E(res,400,'invalid');
 if(logo&&!logoOk(logo))return E(res,400,'logo');
 db.prepare('UPDATE schools SET card_c1=?,card_c2=?,card_lang=? WHERE id=?').run(c1.toLowerCase(),c2.toLowerCase(),lang,sid);
 if(typeof fees=='boolean')db.prepare('UPDATE schools SET card_fees=? WHERE id=?').run(fees?1:0,sid);
 if(logo!==undefined)db.prepare('UPDATE schools SET card_logo=? WHERE id=?').run(logo||null,sid);audit(req.user,'school.card');res.json({ok:1})});
app.get('/api/report/preview',auth(['principal']),async(req,res,next)=>{try{await P.preview(res,{sc:school(req),n:Math.max(1,Math.min(30,+req.query.n||8)),lang:['en','fr','both'].includes(req.query.lang)?req.query.lang:null,term:[1,2,3].includes(+req.query.term)?+req.query.term:1})}catch(e){next(e)}});
app.post('/api/settings',auth(['principal']),(req,res)=>{const{name='',header='',year='',seq_plan='',terms}=req.body,x=school(req);
 const okT=!terms||(Array.isArray(terms)&&terms.length==3&&terms.every((r,i)=>Array.isArray(r)&&SC.isDate(r[0])&&SC.isDate(r[1])&&r[0]<r[1]&&(!i||terms[i-1][1]<r[0])));
 if(!okT)return E(res,400,'dates');
 if(!name.trim()||!/^[1-4],[1-4],[1-4]$/.test(seq_plan)||header.length>600||year.length>20)return E(res,400,'invalid');
 if(seq_plan!=(x.seq_plan||'2,2,2')&&db.prepare('SELECT 1 FROM publications WHERE school_id=?').get(x.id))return E(res,409,'locked');
 if(terms){let o={};try{o=x.term_dates?JSON.parse(x.term_dates):{}}catch{}o[B.schoolYear(SC.clock(x).date)]=terms;db.prepare('UPDATE schools SET term_dates=? WHERE id=?').run(JSON.stringify(o),x.id)}
 db.prepare('UPDATE schools SET name=?,header=?,year=?,seq_plan=? WHERE id=?').run(name.trim(),header.trim(),year.trim(),seq_plan,x.id);audit(req.user,'settings.update');res.json({ok:1})});
// --- report cards
const RO=auth(['principal','secretary']),okTerm=t=>[1,2,3].includes(t);
app.get('/api/report',RO,(req,res)=>{const cid=+req.query.class_id,term=+req.query.term,sid=req.user.school_id;if(!okTerm(term))return E(res,400,'invalid');const c=R.compute(sid,cid,term),pub=R.isLocked(cid,term),
 has=new Set(db.prepare('SELECT student_id FROM cards WHERE school_id=? AND term=?').all(sid,term).map(r=>r.student_id));
 res.json({published:pub,annual:c.annual,ready:c.size,pending:pub?[]:R.pending(sid,cid,term),held:[...F.blocked(sid,cid,term)],
  students:c.students.map(s=>({id:s.id,name:s.name,has:s.has,nsub:s.nsub,card:pub?has.has(s.id):null,termAvg:s.head,rank:s.rank}))})});
app.post('/api/report/publish',RO,(req,res)=>{const{class_id,term}=req.body;
 if(!okTerm(term)||!db.prepare('SELECT 1 FROM classes WHERE id=? AND school_id=?').get(class_id,req.user.school_id))return E(res,400,'invalid');
 if(R.isLocked(class_id,term))return E(res,409,'locked');const pr=R.publish(req.user.school_id,class_id,term);if(pr!='ok')return E(res,409,pr);
 audit(req.user,'report.publish',class_id+':T'+term);res.json({ok:1})});
app.get('/api/report/share',auth(['principal','secretary']),(req,res)=>{const cid=+req.query.class_id,term=+req.query.term,sid=req.user.school_id;
 if(!okTerm(term)||!R.isLocked(cid,term)||!db.prepare('SELECT 1 FROM classes WHERE id=? AND school_id=?').get(cid,sid))return E(res,409,'notpub');
 const hold=F.blocked(sid,cid,term),num=p=>{let d=String(p||'').replace(/\D/g,'');if(d.startsWith('00'))d=d.slice(2);if(d.length==9&&d[0]=='6')d='237'+d;return d.length>=11?d:''};
 res.json({school:db.prepare('SELECT name FROM schools WHERE id=?').get(sid).name,cards:db.prepare('SELECT c.code,c.student_id id,st.name,st.guardian,st.phone FROM cards c JOIN students st ON st.id=c.student_id WHERE c.school_id=? AND st.class_id=? AND st.active=1 AND c.term=?').all(sid,cid,term).filter(r=>!hold.has(r.id)).map(r=>({id:r.id,name:r.name,code:r.code,guardian:r.guardian||'',phone:num(r.phone)}))})});
app.get('/api/report/pdf',RO,async(req,res,next)=>{try{const cid=+req.query.class_id,term=+req.query.term;if(!okTerm(term)||!R.isLocked(cid,term))return E(res,409,'notpub');
 const hold=F.blocked(req.user.school_id,cid,term),one=+req.query.student_id||null;if(one&&hold.has(one))return E(res,409,'unpaid');
 const ok=await P.render(res,{skip:hold,base:req.protocol+'://'+req.get('host')+'/verify.html?code=',sid:req.user.school_id,cid,term,student:+req.query.student_id||null,lang:RC.langOf(school(req),cid)});if(!ok)E(res,404,'invalid')}catch(e){next(e)}});
const vh={};
app.get('/api/verify',(req,res)=>{if((vh[req.ip]=(vh[req.ip]||0)+1)>30)return E(res,429,'many');setTimeout(()=>vh[req.ip]--,6e5);
 {const c=String(req.query.code||'').trim().toUpperCase();if(c.startsWith('ID-')){const p=db.prepare('SELECT b.year,b.void,st.name,st.active,k.name cls,sc.id sid,sc.name school FROM badges b JOIN students st ON st.id=b.student_id LEFT JOIN classes k ON k.id=st.class_id JOIN schools sc ON sc.id=b.school_id WHERE b.code=?').get(c);
  if(!p)return res.json({found:false});const cur=B.schoolYear(SC.clock(school({user:{school_id:p.sid}})).date),status=p.void?'replaced':!p.active?'left':p.year!=cur?'expired':'valid';
  return res.json({found:true,kind:'badge',school:p.school,year:p.year+'/'+(p.year+1),name:p.name,cls:p.cls||'',status})}
  if(c.startsWith('RP-')){const p=db.prepare('SELECT p.receipt,p.date,p.amount,p.void,st.name,k.name cls,sc.name school,sc.year FROM payments p JOIN students st ON st.id=p.student_id JOIN classes k ON k.id=st.class_id JOIN schools sc ON sc.id=p.school_id WHERE p.code=?').get(c);
  if(!p)return res.json({found:false});const ini=String(p.name).split(/\s+/).filter(Boolean).map(w=>w[0].toUpperCase()+'.').join(' ');
  return res.json({found:true,kind:'receipt',school:p.school,year:p.year,no:String(p.receipt).padStart(5,'0'),date:p.date,amount:p.amount,void:!!p.void,initials:ini,cls:p.cls})}}
 const r=db.prepare('SELECT c.term,c.snap,st.name,k.name cls,sc.name school,sc.year FROM cards c JOIN students st ON st.id=c.student_id JOIN classes k ON k.id=c.class_id JOIN schools sc ON sc.id=c.school_id WHERE c.code=?').get(String(req.query.code||'').trim().toUpperCase());
 if(!r)return res.json({found:false});res.json({found:true,school:r.school,year:r.year,name:r.name,cls:r.cls,term:r.term,...JSON.parse(r.snap)})});
// --- class heads, staff edit/delete, sortable lists
app.post('/api/classes/head',auth(['principal']),(req,res)=>{const{class_id,teacher_id}=req.body,sid=req.user.school_id;
 if(teacher_id&&!db.prepare("SELECT 1 FROM users WHERE id=? AND school_id=? AND role='teacher' AND active=1").get(teacher_id,sid))return E(res,400,'invalid');
 if(!db.prepare('UPDATE classes SET head_id=? WHERE id=? AND school_id=?').run(teacher_id||null,class_id,sid).changes)return E(res,400,'invalid');audit(req.user,'class.head',class_id+'->'+teacher_id);res.json({ok:1})});
const staffRow=(req,id)=>{const u=db.prepare('SELECT * FROM users WHERE id=? AND school_id=? AND active=1').get(+id||0,req.user.school_id);return u&&u.role!='principal'&&u.id!=req.user.id?u:null};
const unassign=id=>{db.prepare('UPDATE subjects SET teacher_id=NULL WHERE teacher_id=?').run(id);db.prepare('DELETE FROM subject_teachers WHERE teacher_id=?').run(id);db.prepare('UPDATE subject_prac SET teacher_id=NULL WHERE teacher_id=?').run(id);db.prepare('UPDATE classes SET head_id=NULL WHERE head_id=?').run(id)};
app.post('/api/users/update',auth(['principal']),(req,res)=>{const{id,name='',role='',password=''}=req.body,u=staffRow(req,id);
 if(!u||!name.trim()||!['secretary','teacher','surveillant'].includes(role))return E(res,400,'invalid');if(password&&!strong(password))return E(res,400,'pw');
 const email=String(req.body.email??u.email).trim().toLowerCase();if(!A2.okEmail(email))return E(res,400,'email');if(email!=u.email&&db.prepare("SELECT 1 FROM users WHERE school_id=? AND active=1 AND id!=? AND lower(email)=?").get(req.user.school_id,u.id,email))return E(res,409,'email_used');
 if(role=='teacher'&&Array.isArray(req.body.sections)&&SECT.ensure(req.user.school_id).length>1&&!req.body.sections.some(i=>SECT.valid(req.user.school_id,i)))return E(res,400,'sec_teacher');
 tx(()=>{if(role=='teacher'&&Array.isArray(req.body.sections))SECT.setUser(req.user.school_id,u.id,req.body.sections);if(email!=u.email){db.prepare('UPDATE users SET email=?,email_ok=0 WHERE id=?').run(email,u.id);db.prepare('DELETE FROM sessions WHERE user_id=?').run(u.id);A2.forget(u.id)}db.prepare('UPDATE users SET name=?,role=?,can_gate=? WHERE id=?').run(name.trim(),role,req.body.can_gate?1:0,u.id);if(password){db.prepare('UPDATE users SET pw=? WHERE id=?').run(hash(password),u.id);db.prepare('DELETE FROM sessions WHERE user_id=?').run(u.id)}
  if(role!=u.role&&u.role=='teacher')unassign(u.id)})();audit(req.user,'user.edit',u.username);res.json({ok:1})});
app.post('/api/users/delete',auth(['principal']),(req,res)=>{const u=staffRow(req,req.body.id);if(!u)return E(res,400,'invalid');
 tx(()=>{db.prepare("UPDATE users SET active=0,username=username||'#del'||id WHERE id=?").run(u.id);db.prepare('DELETE FROM sessions WHERE user_id=?').run(u.id);unassign(u.id)})();audit(req.user,'user.delete',u.username);res.json({ok:1})});
const basisOf=(req,def)=>{const b=String(req.query.basis||'');return b&&R.okBasis(req.user.school_id,b)?b:def()};
app.get('/api/classlist',auth(['principal','secretary','teacher']),(req,res)=>{const sid=req.user.school_id,cid=+req.query.class_id||0;
 if(cid&&!db.prepare('SELECT 1 FROM classes WHERE id=? AND school_id=?').get(cid,sid))return E(res,404,'invalid');
 if(req.user.role=='teacher'&&(!cid||!db.prepare('SELECT 1 FROM classes WHERE id=? AND head_id=?').get(cid,req.user.id)))return E(res,403,'role');
 const phm=req.user.role=='teacher'?{}:Object.fromEntries(db.prepare('SELECT student_id,at FROM student_photos WHERE school_id=?').all(sid).map(r=>[r.student_id,r.at]));
 const cs=cid?[{id:cid}]:db.prepare('SELECT id FROM classes WHERE school_id=?').all(sid),basis=basisOf(req,()=>R.defaultBasis(sid,cs.map(c=>c.id))),rows=[];
 for(const c of cs){const av=R.averages(sid,c.id,basis);for(const st of db.prepare('SELECT s.id,s.name,s.matricule,s.sex,k.name cls,COALESCE(k.short,k.name) cs FROM students s JOIN classes k ON k.id=s.class_id WHERE s.school_id=? AND s.class_id=? AND s.active=1').all(sid,c.id))rows.push({...st,avg:LK(req)?null:av[st.id]??null,ph:phm[st.id]||null})}
 res.json({basis,rows})});
app.get('/api/sublist',auth(['teacher']),(req,res)=>{const s=mySub(req,req.query.subject_id);if(!s)return E(res,403,'role');const sid=req.user.school_id,basis=basisOf(req,()=>R.defaultBasis(sid,[s.class_id],s.id)),av=R.averages(sid,s.class_id,basis,s.id);
 res.json({basis,rows:db.prepare('SELECT s.id,s.name,s.matricule,s.sex FROM students s WHERE s.school_id=? AND s.class_id=? AND s.active=1').all(sid,s.class_id).map(x=>({...x,avg:LK(req)?null:av[x.id]??null}))})});
app.get('/api/billing',auth(['principal'],true),(req,res)=>{B.draftInvoices(req.user.school_id);res.json(B.overview(req.user.school_id))});
app.get('/api/billing/invoice/:id/pdf',auth(['principal'],true),(req,res)=>{const i=db.prepare("SELECT school_id FROM invoices WHERE id=? AND status!='draft'").get(+req.params.id);i&&i.school_id==req.user.school_id&&require('./billpdf').invoice(res,+req.params.id)||E(res,404,'none')});
app.get('/api/billing/receipt/:id',auth(['principal'],true),(req,res)=>{const p=db.prepare('SELECT school_id FROM bill_payments WHERE id=?').get(+req.params.id);p&&p.school_id==req.user.school_id&&require('./billpdf').receipt(res,+req.params.id)||E(res,404,'none')});
require('./core/jobs').every('billing-touch',36e5,B.touchAll,2000);
// ---- support access consent (principal), reset links, announcements
app.get('/api/support',auth(['principal']),(req,res)=>{const x=school(req),on=!!x.support_until&&x.support_until>now();
 res.json({on,until:on?x.support_until:null,sessions:db.prepare('SELECT owner_name,started,last_seen,ended,reads,areas,expires FROM support_sessions WHERE school_id=? ORDER BY id DESC LIMIT 30').all(x.id)})});
app.post('/api/support',auth(['principal']),(req,res)=>{const x=school(req),on=!!req.body.on;
 db.prepare('UPDATE schools SET support_until=? WHERE id=?').run(on?new Date(Date.now()+864e5).toISOString():null,x.id);
 if(!on)db.prepare('UPDATE support_sessions SET ended=? WHERE school_id=? AND ended IS NULL').run(now(),x.id);audit(req.user,on?'support.allow':'support.revoke');res.json({ok:1})});
app.get('/support/enter',(req,res)=>{const t=String(req.query.token||'');if(!supportUser(t))return res.status(410).send('This support link has expired.');res.cookie('t',t,SEC.cookieOpts(res,{httpOnly:true,sameSite:'lax'}));res.redirect('/')});
app.get('/reset',(req,res)=>res.sendFile(require('path').join(__dirname,'public','reset.html')));
const rl={};
app.post('/api/reset',(req,res)=>{if((rl[req.ip]=(rl[req.ip]||0)+1)>10)return E(res,429,'many');setTimeout(()=>rl[req.ip]--,6e5);const{token='',password=''}=req.body;if(!strong(password))return E(res,400,'pw');
 const h=crypto.createHash('sha256').update(String(token)).digest('hex'),r=db.prepare('SELECT * FROM reset_tokens WHERE hash=? AND used=0').get(h);if(!r||r.expires<now())return E(res,410,'expired');
 tx(()=>{db.prepare('UPDATE users SET pw=? WHERE id=?').run(hash(password),r.user_id);db.prepare('DELETE FROM sessions WHERE user_id=?').run(r.user_id);db.prepare('UPDATE reset_tokens SET used=1 WHERE hash=?').run(h)})();
 const u=db.prepare('SELECT * FROM users WHERE id=?').get(r.user_id);audit(u,'password.reset');res.json({ok:1,code:db.prepare('SELECT code FROM schools WHERE id=?').get(u.school_id).code,username:u.username})});
app.get('/api/announcements',auth([],true),(req,res)=>{const d=now().slice(0,10);res.json(db.prepare('SELECT id,title_en,body_en,title_fr,body_fr,level FROM announcements WHERE active=1 AND starts<=? AND ends>=? ORDER BY id DESC').all(d,d))});
require('./core/jobs').every('backup-tick',36e5,BK.tick,5000);
require('./owners')(app);REF(app);require('./ai')(app,{auth,E,audit:(u,a,d)=>audit(u,a,d)});
const SCx=0;require('./phase4')(app,{auth,userOf,E,audit,school,tx,isGate});
require('./dash')(app,{auth,school});
require('./roll')(app,{auth,E,audit,school});
require('./imp')(app,{auth,E,audit,school});
require('./honour')(app,{auth,E,audit,school});
require('./sections')(app,{auth,E,audit});
require('./examapi')(app,{auth,E,audit,school});
require('./examtt2')(app,{auth,E,audit,school});
require('./ttgenapi')(app,{auth,E,audit,school});
require('./ttwiz')(app,{auth,E,audit});
require('./badges')(app,{auth,E,audit,school});
require('./examinv')(app,{auth,E,audit,school});
require('./examprint')(app,{auth,E,audit,school});
const RC=require('./rcbulk');RC(app,{auth,E,audit,school});
require('./tbadges')(app,{auth,userOf,E,audit,school,isGate});
require('./mydata')(app,{auth,E,audit,school});
require('./search')(app,{auth});
app.get('/api/palette',auth(),(req,res)=>res.json(require('./ttpal').payload(req.user.school_id)));
require('./exam')(app,{auth,E,audit,school});
const F=require('./fees');F(app,{auth,E,audit,school});require('./acct')(app,{auth,E,audit});require('./tprofile')(app,{auth,E,audit,school});
app.use((e,req,res,next)=>/UNIQUE/.test(e.message)?E(res,409,'dup'):(console.error(e),BK.logError(req.path,e),E(res,500,'server')));
module.exports=app;
