// Bulk import of teachers from Excel or CSV: accounts, subjects (created per class when missing) and who teaches what.
// Preview and plan save nothing. Commit creates the accounts (temporary password, email verified at first sign-in), the missing classes and subjects, and the assignments.
const{db,tx}=require('./db'),SECT=require('./sections'),express=require('./core/web'),crypto=require('crypto');
const{norm,parseCSV,parseXLSX,isZip,clean,parseCls,rel,matchCls,suggestShort}=require('./imp').H;
const MAXT=500,KEEP=30*6e4,store=new Map();
const SYN={name:['name','fullname','teacher','teachername','nom','noms','nomcomplet','enseignant','enseignante','nomenseignant','nomprenom','nomprenoms','nometprenom','nometprenoms','nomsetprenoms','staff'],
 first:['firstname','prenom','prenoms','givenname','forename'],last:['lastname','surname','familyname'],
 email:['email','mail','courriel','emailaddress','adresseemail','adressemail','adressecourriel','adresseelectronique'],
 phone:['phone','tel','telephone','phonenumber','mobile','whatsapp','contact'],user:['username','login','identifiant','user','pseudo'],
 subject:['subject','subjects','matiere','matieres','discipline','disciplines','course','courses','cours','teaches','enseigne'],
 class:['class','classes','classe','form','forms','level','levels','niveau','niveaux','classesenseignees'],
 coef:['coef','coefficient','coeff','coefs','coefficients'],section:['section','sections','soussysteme','systeme','system']};
// the same subject written differently: Maths / Mathematics / Mathématiques
const SUBJ=[['mathematics','maths','math','mathematiques','mathematique'],['english','englishlanguage','englishlang','anglais','langueanglaise'],['french','frenchlanguage','frenchlang','francais','languefrancaise'],
 ['physics','physique'],['chemistry','chimie'],['biology','biologie','svt','sciencesdelavieetdelaterre','sciencesdelaviedelaterre'],['history','histoire'],['geography','geographie'],
 ['ict','informatique','computerscience','computing','tic'],['literature','literatureinenglish','litterature','literatureenglish'],['economics','economie'],['philosophy','philosophie'],
 ['civiceducation','educationcivique','educationciviqueetmorale','ecm','citizenship'],['physicaleducation','pe','eps','sport','sports','educationphysique','educationphysiqueetsportive'],['religiousstudies','religion','religiousknowledge']];
const SK=new Map();for(const g of SUBJ)for(const x of g)SK.set(x,g[0]);
const skey=l=>{const n=norm(l);return SK.get(n)||n};
const splitL=v=>String(v||'').split(/[,;/&+\n]|\s+(?:and|et)\s+/i).map(x=>clean(x,60)).filter(Boolean);
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const mkuser=(name,taken)=>{let u=String(name).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/^(mrs?|mme|mlle|mr|dr|prof)\.?\s+/,'').replace(/[^a-z0-9]+/g,'.').replace(/^\.|\.$/g,'').slice(0,22)||'teacher';let k=u,i=2;while(taken.has(k))k=u+i++;taken.add(k);return k};
const PWA='abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const mkpw=()=>{let p='';for(let i=0;i<10;i++)p+=PWA[crypto.randomInt(PWA.length)];return p};
const okEmail=e=>require('./auth2').okEmail(e);
// ---- file -> teachers
function build(raw,S){const hi=raw.findIndex(r=>r.some(c=>{const n=norm(c);return SYN.name.includes(n)||SYN.last.includes(n)}));if(hi<0)return{err:'nohead'};
 const H=raw[hi].map(norm),col={};for(const k of Object.keys(SYN))col[k]=H.findIndex(h=>SYN[k].includes(h));
 if(col.name<0&&col.last<0)return{err:'nohead'};
 const classes=db.prepare('SELECT id,name,short,section_id FROM classes WHERE school_id=?').all(S),byC={};for(const c of classes){byC[norm(c.name)]=c;if(c.short)byC[norm(c.short)]??=c}
 const users=db.prepare("SELECT id,username,name,role,email FROM users WHERE school_id=? AND active=1").all(S),byE=new Map(users.filter(u=>u.email).map(u=>[u.email.toLowerCase(),u])),taken=new Set(db.prepare('SELECT username FROM users WHERE school_id=?').all(S).map(u=>u.username.toLowerCase()));
 const byN=new Map();for(const u of users.filter(u=>u.role=='teacher')){const k=norm(u.name);byN.set(k,byN.has(k)?null:u)}
 const sections=SECT.ensure(S);
 // class labels not exactly a class of the school: merge / ask / new, like the student import
 const groups=[],gOf={},tk=new Set(classes.map(c=>(c.short||'').toLowerCase()).filter(Boolean)),freq={};
 for(let i=hi+1;i<raw.length;i++){const r=raw[i];if(!r||col.class<0)continue;for(const t of splitL(r[col.class]))freq[t]=(freq[t]||0)+1}
 for(const t of Object.keys(freq).sort((a,b)=>freq[b]-freq[a])){if(byC[norm(t)])continue;const m=matchCls(t,classes);let g;
  if(m.kind=='merge')g=groups.find(x=>x.kind=='merge'&&x.class_id==m.class_id);
  else if(m.kind=='new'){const pt=parseCls(t);g=groups.find(x=>x.kind=='new'&&(norm(x.labels[0])==norm(t)||rel(parseCls(x.labels[0]),pt)=='eq'))}
  if(!g){g={id:groups.length,labels:[],kind:m.kind,class_id:m.class_id||0,candidates:m.candidates.map(c=>({id:c.id,name:c.name})),count:0};if(m.kind=='new')g.suggest={name:t,short:suggestShort(t,tk)};groups.push(g)}
  g.labels.push(t);gOf[norm(t)]=g}
 const T=[],byKey=new Map();let prev=null;
 for(let i=hi+1;i<raw.length;i++){const r=raw[i];if(!r||r.every(c=>!String(c).trim()))continue;const g=k=>col[k]>=0?r[col[k]]:'';
  let name=clean(col.first>=0&&(col.last>=0||col.name>=0)?[g('last')||(col.name>=0?r[col.name]:''),g('first')].filter(Boolean).join(' '):g('name'),120);
  const email=clean(g('email'),120).toLowerCase();let t;
  if(!name&&!email&&prev)t=prev;                           // merged cells: the teacher continues on the next line
  else{const key=email||norm(name);if(!key){continue}t=byKey.get(key);if(!t){if(T.length>=MAXT)return{err:'toobig'};
    t={i:T.length,name,email,phone:clean(g('phone'),40),user:clean(g('user'),30).toLowerCase(),secs:[],asg:[],rows:[],errors:[],warn:[],status:'new',existing:0};T.push(t);byKey.set(key,t)}
   else{if(!t.name&&name)t.name=name;if(!t.email&&email)t.email=email;if(!t.phone)t.phone=clean(g('phone'),40)}}
  prev=t;t.rows.push(i+1);
  for(const s of splitL(g('section')))if(!t.secs.includes(s))t.secs.push(s);
  const sb=splitL(g('subject')),cl=splitL(g('class')),cf=+String(g('coef')).replace(',','.')||null;
  if(sb.length&&!cl.length)t.warn.push('nocls');else if(cl.length&&!sb.length)t.warn.push('nosubj');
  for(const s of sb)for(const c of cl){if(!t.asg.some(a=>skey(a.s)==skey(s)&&norm(a.c)==norm(c)))t.asg.push({s,c,k:cf&&cf>0&&cf<=10?cf:null,cid:(byC[norm(c)]||{}).id||0,gi:byC[norm(c)]?-1:(gOf[norm(c)]?gOf[norm(c)].id:-1)})}}
 for(const t of T){t.warn=[...new Set(t.warn)];
  if(!t.name)t.errors.push('name');
  let u=t.email&&okEmail(t.email)?byE.get(t.email):null;
  if(t.email&&!okEmail(t.email))t.errors.push('email');
  else if(u){if(u.role!='teacher')t.errors.push('emailrole');else{t.status='existing';t.existing=u.id;t.user=u.username;if(!t.name)t.name=u.name}}
  else if(!t.email){const m=t.name&&byN.get(norm(t.name));if(m){t.status='existing';t.existing=m.id;t.user=m.username;t.email=m.email||''}else t.errors.push('noemail')}
  if(t.errors.length)t.status='error';
  else if(t.status=='new'){if(!/^[a-z0-9._-]{3,30}$/.test(t.user)||taken.has(t.user))t.user=mkuser(t.name,taken);else taken.add(t.user)}}
 // the same email written for two different people in the file is merged above; a teacher with no classes still gets an account
 const have=new Set();for(const t of T)if(t.email&&t.status!='error'){if(have.has(t.email))t.errors.push('emaildup');have.add(t.email)}
 return{teachers:T,groups,sections}}
// ---- what the import will do, given the decisions on class labels and on conflicts
function plan(job,S,map,choices){map=map||{};choices=choices||{};
 const classes=db.prepare('SELECT id,name,short,section_id FROM classes WHERE school_id=?').all(S),cById=new Map(classes.map(c=>[c.id,c])),cByN=new Map(classes.map(c=>[norm(c.name),c]));
 const subs=db.prepare('SELECT id,class_id,name,coef,teacher_id FROM subjects WHERE school_id=?').all(S),uName=new Map(db.prepare('SELECT id,name FROM users WHERE school_id=?').all(S).map(u=>[u.id,u.name]));
 const secL=SECT.ensure(S),sec1=secL[0].id,tgt={};let undecided=0;
 for(const g of job.groups){const d=map[g.id]||(g.kind=='merge'?{a:'merge',id:g.class_id}:g.kind=='new'?{a:'new',name:g.suggest.name,short:g.suggest.short}:null);
  if(!d||!['merge','new','skip'].includes(d.a)){tgt[g.id]={u:1};continue}
  if(d.a=='skip'){tgt[g.id]={skip:1};continue}
  if(d.a=='merge'){const c=cById.get(+d.id);if(!c)return{err:'imp_badclass'};tgt[g.id]={cid:c.id,name:c.name,sec:c.section_id};continue}
  const name=clean(d.name,60),short=clean(d.short,8);if(!name||!short)return{err:'imp_badclass'};const ex=cByN.get(norm(name));
  tgt[g.id]=ex?{cid:ex.id,name:ex.name,sec:ex.section_id}:{cid:0,name,short,sec:sec1}}
 // coefficient already used for this subject elsewhere in the school
 const coefOf=new Map(),spell=new Map();for(const x of subs){const k=skey(x.name);if(!coefOf.has(k))coefOf.set(k,x.coef);if(!spell.has(k))spell.set(k,x.name)}
 const items=[],at=new Map(),conflicts=[],newCls=new Map();
 for(const t of job.teachers){if(t.status=='error'||t.errors.length)continue;const tsec=new Set();
  for(const a of t.asg){let ci;
   if(a.cid){const c=cById.get(a.cid);if(!c)continue;ci={cid:c.id,name:c.name,sec:c.section_id}}
   else if(a.gi>=0){ci=tgt[a.gi];if(ci&&ci.u){undecided++;continue}if(!ci||ci.skip)continue}
   else continue;
   if(!ci.cid)newCls.set(norm(ci.name),ci);
   const ck=ci.cid?'c'+ci.cid:'n'+norm(ci.name),k=skey(a.s),id=ck+'|'+k,ex=ci.cid?subs.find(x=>x.class_id==ci.cid&&skey(x.name)==k):null;
   if(ci.sec)tsec.add(ci.sec);
   const prior=at.get(id);
   let it={ti:t.i,cid:ci.cid,cname:ci.name,cnew:ci.cid?null:{name:ci.name,short:ci.short},ck,k,sid:ex?ex.id:0,sname:ex?ex.name:(spell.get(k)||cap(a.s)),coef:ex?ex.coef:(a.k||coefOf.get(k)||1),out:''};
   if(prior){if(prior.ti==t.i)continue;const ch=choices[id]=='replace'?'replace':'keep';conflicts.push({id,cls:ci.name,subject:prior.sname,current:job.teachers[prior.ti].name,source:'file',choice:ch,incoming:t.name,ti:t.i});
    if(ch=='replace'){prior.ti=t.i;prior.out=prior.sid?'replace':'create'}continue}
   if(ex){if(ex.teacher_id&&ex.teacher_id==t.existing){it.out='same'}
    else if(ex.teacher_id){const ch=choices[id]=='replace'?'replace':'keep';conflicts.push({id,cls:ci.name,subject:ex.name,current:uName.get(ex.teacher_id)||'?',source:'school',choice:ch,incoming:t.name,ti:t.i});it.out=ch=='replace'?'replace':'keep'}
    else it.out='assign'}
   else it.out='create';
   at.set(id,it);items.push(it)}
  for(const l of t.secs||[]){const x=secL.find(y=>norm(y.name)==norm(l));if(x)tsec.add(x.id)}
  t.tsec=[...tsec]}
 const live=items.filter(x=>!['keep','same'].includes(x.out)),sm=new Map();
 for(const x of live){const g=sm.get(x.k)||{name:x.sname,create:0,assign:0};x.out=='create'?g.create++:g.assign++;sm.set(x.k,g)}
 const tl=job.teachers.filter(t=>t.status!='error'&&!t.errors.length);
 return{items,conflicts,newCls:[...newCls.values()],undecided,
  summary:{teachers_new:tl.filter(t=>t.status=='new').length,teachers_existing:tl.filter(t=>t.status=='existing').length,subjects_new:live.filter(x=>x.out=='create').length,assigned:live.length,kept:items.filter(x=>x.out=='keep').length,classes_new:newCls.size,undecided},
  subjects:[...sm.values()].sort((a,b)=>a.name.localeCompare(b.name))}}
module.exports=(app,{auth,E,audit,school,hash,SC,M})=>{
 const pr=auth(['principal']),sid=req=>req.user.school_id,purge=()=>{const t=Date.now();for(const[k,v]of store)if(t-v.at>KEEP)store.delete(k)};
 app.get('/api/import/teachers/template',pr,(req,res)=>{const fr=req.query.lang=='fr',d=fr?';':',',cs=db.prepare('SELECT name FROM classes WHERE school_id=? ORDER BY id LIMIT 2').all(sid(req)).map(c=>c.name),a=cs[0]||(fr?'6ème':'Form 1'),b=cs[1]||(fr?'5ème':'Form 2');
  const L=fr?[['Nom','E-mail','Téléphone','Matières','Classes'],['NGONO Marie','marie.ngono@example.com','677000000','Mathématiques, Physique',`${a}, ${b}`],['TCHOUA Paul','paul.tchoua@example.com','699000000','Anglais',a]]
   :[['Name','Email','Phone','Subjects','Classes'],['NGONO Marie','marie.ngono@example.com','677000000','Mathematics, Physics',`${a}, ${b}`],['TCHOUA Paul','paul.tchoua@example.com','699000000','English',a]];
  const q=v=>/[";,\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;
  res.set({'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="${fr?'modele-enseignants':'teachers-template'}.csv"`}).send('﻿'+L.map(r=>r.map(q).join(d)).join('\r\n')+'\r\n')});
 const shape=(j,p)=>({token:j.token,total:j.teachers.length,teachers:j.teachers.map(t=>({i:t.i,name:t.name,email:t.email,phone:t.phone,user:t.user,status:t.status,errors:t.errors,warn:t.warn,rows:t.rows[0],asg:t.asg.map(a=>({s:a.s,c:a.c}))})),groups:j.groups,
  classes:db.prepare('SELECT id,name FROM classes WHERE school_id=? ORDER BY name').all(j.sid),plan:p});
 app.post('/api/import/teachers/preview',pr,express.raw({type:()=>true,limit:'5mb'}),(req,res)=>{const b=req.body;if(!Buffer.isBuffer(b)||!b.length)return E(res,400,'imp_empty');
  let raw;try{raw=isZip(b)?parseXLSX(new Uint8Array(b)):parseCSV(b.toString('utf8'))}catch{return E(res,400,'imp_badfile')}
  const r=build(raw,sid(req));if(r.err)return E(res,400,'impt_'+r.err);if(!r.teachers.length)return E(res,400,'imp_empty');
  purge();const token=require('crypto').randomBytes(12).toString('hex');for(const[k,v]of store)if(v.sid==sid(req))store.delete(k);
  const j={token,sid:sid(req),teachers:r.teachers,groups:r.groups,at:Date.now()};store.set(token,j);
  const p=plan(j,sid(req),{},{});res.json(shape(j,p))});
 // re-plan after the admin changes a class decision or a conflict choice
 app.post('/api/import/teachers/plan',pr,(req,res)=>{const j=store.get(String(req.body.token||''));if(!j||j.sid!=sid(req)||Date.now()-j.at>KEEP)return E(res,410,'imp_expired');
  const p=plan(j,sid(req),req.body.map,req.body.choices);if(p.err)return E(res,400,p.err);res.json({plan:p})});
 app.post('/api/import/teachers/commit',pr,(req,res)=>{const j=store.get(String(req.body.token||''));if(!j||j.sid!=sid(req)||Date.now()-j.at>KEEP)return E(res,410,'imp_expired');
  const S=sid(req),sc=school(req),date=SC.clock(sc).date,p=plan(j,S,req.body.map,req.body.choices),lang=req.body.lang=='fr'?'fr':'en';if(p.err)return E(res,400,p.err);if(p.undecided)return E(res,400,'imp_undecided');
  const made=[],cred=[],reassigned=[],noSec=[];let nsub=0,nasg=0;
  try{tx(()=>{
   const cid={};for(const c of p.newCls){const id=db.prepare('INSERT INTO classes(school_id,name,short,qr,section_id) VALUES(?,?,?,?,?)').run(S,c.name,c.short,require('crypto').randomBytes(12).toString('hex'),c.sec).lastInsertRowid;cid[norm(c.name)]=Number(id);made.push(c.name+' ('+c.short+')')}
   const multi=SECT.ensure(S).length>1,uid={},ins=db.prepare('INSERT INTO users(school_id,username,pw,name,role,can_gate,email,phone,email_ok) VALUES(?,?,?,?,?,?,?,?,0)');
   for(const t of j.teachers){if(t.status=='error'||t.errors.length)continue;
    const secs=new Set(t.tsec||[]);
    if(t.status=='existing'){uid[t.i]=t.existing;for(const s of secs)db.prepare('INSERT OR IGNORE INTO user_sections(user_id,section_id) VALUES(?,?)').run(t.existing,s);continue}
    const pw=mkpw(),r=ins.run(S,t.user,hash(pw),t.name,'teacher',0,t.email,t.phone||null);uid[t.i]=Number(r.lastInsertRowid);
    if(multi&&!secs.size){secs.add(SECT.ensure(S)[0].id);noSec.push(t.name)}SECT.setUser(S,uid[t.i],[...secs]);
    cred.push({name:t.name,username:t.user,password:pw,email:t.email});audit(req.user,'user.add',t.user+' (import)')}
   for(const x of p.items){if(['keep','same'].includes(x.out))continue;const teacher=uid[x.ti];if(!teacher)continue;const c=x.cid||cid[norm(x.cname)];let sidj=x.sid;
    if(x.out=='create'){sidj=Number(db.prepare('INSERT INTO subjects(school_id,class_id,name,coef,teacher_id) VALUES(?,?,?,?,?)').run(S,c,x.sname,x.coef,teacher).lastInsertRowid);nsub++;audit(req.user,'subject.add',x.sname+' (import)')}
    else{db.prepare('UPDATE subjects SET teacher_id=? WHERE id=? AND school_id=?').run(teacher,sidj,S);reassigned.push([sidj,teacher])}
    nasg++}
  })()}catch(e){return E(res,409,'imp_fail')}
  let clashes=0;for(const[s,t]of reassigned)try{clashes+=SC.reassign(S,s,t,date).length}catch{}
  store.delete(req.body.token);try{require('./billing').touchPeak(S)}catch{}
  for(const c of made)audit(req.user,'class.add',c+' (import)');audit(req.user,'teacher.import',`${cred.length} accounts, ${nsub} subjects, ${nasg} assignments`);
  // welcome emails: no password inside, spaced out so the mail provider's rate limit is respected
  const base=process.env.BASE_URL||`${req.protocol}://${req.get('host')}`,q=cred.filter(c=>c.email).slice();let n=0;
  const next=()=>{const c=q.shift();if(!c)return;const m=M.welcome(lang,{name:c.name,school:sc.name,url:base+'/app',code:sc.code,user:c.username});M.send({to:c.email,subject:m.subject,text:m.text}).catch(()=>{}).finally(()=>{n++;setTimeout(next,600)})};
  setTimeout(next,50);
  res.json({accounts:cred.length,subjects:nsub,assigned:nasg,classes_created:made.length,created:made,clashes,no_section:noSec,credentials:cred,emails:cred.length})});
};
