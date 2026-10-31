// Bulk import of students from an Excel (.xlsx) or CSV file: preview with row-by-row errors, then commit the valid rows.
// Teachers and marks are not imported: staff need a verified email each, and marks belong to the teacher who submits them.
const{db,tx}=require('./db'),SC=require('./sched'),SECT=require('./sections'),express=require('./core/web'),{unzipSync,strFromU8}=require('fflate');
const MAXROWS=2000,KEEP=30*6e4,store=new Map();
const norm=s=>String(s??'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const SYN={name:['name','fullname','studentname','student','nom','noms','nomcomplet','nomprenom','nomprenoms','nometprenom','nometprenoms','nomsetprenoms','eleve','prenometnom','prenomsetnom'],
 sex:['sex','sexe','gender','genre'],dob:['dob','dateofbirth','birthdate','birthday','datedenaissance','datenaissance','naissance','nele','neele','nelele','born'],
 class:['class','classe','form','level','niveau','classroom'],matricule:['matricule','matr','studentid','id','regno','registration','registrationnumber','numero'],
 guardian:['guardian','parent','parents','tuteur','parentname','guardianname','nomduparent','nomdututeur','parenttuteur','tuteurparent'],
 phone:['phone','tel','telephone','phonenumber','contact','guardianphone','parentphone','telephoneparent','telparent'],
 first:['firstname','prenom','prenoms','givenname','forename'],last:['lastname','surname','familyname']};
// ---- readers
function parseCSV(text){text=text.replace(/^﻿/,'');const first=text.split(/\r?\n/,1)[0]||'',cnt=c=>first.split(c).length-1,d=cnt(';')>cnt(',')&&cnt(';')>=cnt('\t')?';':cnt('\t')>cnt(',')?'\t':',';
 const rows=[];let row=[],f='',q=false;
 for(let i=0;i<text.length;i++){const c=text[i];
  if(q){if(c=='"'){if(text[i+1]=='"'){f+='"';i++}else q=false}else f+=c}
  else if(c=='"'&&!f)q=true;else if(c==d){row.push(f);f=''}else if(c=='\n'||c=='\r'){if(c=='\r'&&text[i+1]=='\n')i++;row.push(f);f='';rows.push(row);row=[]}else f+=c}
 if(f||row.length){row.push(f);rows.push(row)}return rows}
const unxml=s=>s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&amp;/g,'&');
const colIdx=r=>{let n=0;for(const ch of r.replace(/\d/g,''))n=n*26+ch.charCodeAt(0)-64;return n-1};
function parseXLSX(buf){const z=unzipSync(buf,{filter:f=>f.originalSize<30e6&&/^xl\/(sharedStrings\.xml|worksheets\/sheet\d+\.xml)$/.test(f.name)});
 const sh=Object.keys(z).filter(k=>k.startsWith('xl/worksheets/')).sort((a,b)=>parseInt(a.match(/\d+/)[0])-parseInt(b.match(/\d+/)[0]))[0];if(!sh)throw new Error('xlsx');
 const ss=z['xl/sharedStrings.xml']?[...strFromU8(z['xl/sharedStrings.xml']).matchAll(/<si>([\s\S]*?)<\/si>/g)].map(m=>unxml([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(x=>x[1]).join(''))):[];
 const rows=[];
 for(const rm of strFromU8(z[sh]).matchAll(/<row\b[^>]*?(?:\/>|>([\s\S]*?)<\/row>)/g)){const row=[];
  for(const cm of(rm[1]||'').matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)){const at=cm[1],r=(at.match(/\br="([A-Z]+)\d+"/)||[])[1],t=(at.match(/\bt="(\w+)"/)||[])[1],body=cm[2]||'';if(!r)continue;
   let v=(body.match(/<v>([\s\S]*?)<\/v>/)||[])[1];
   if(t=='inlineStr')v=[...body.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(x=>unxml(x[1])).join('');
   else if(t=='s')v=ss[+v]??'';else if(t=='str')v=unxml(v||'');else if(t=='b')v=v=='1'?'TRUE':'FALSE';else v=v==null?'':v;
   row[colIdx(r)]=String(v)}
  rows.push(Array.from(row,x=>x??''))}
 return rows}
const isZip=b=>b.length>3&&b[0]==0x50&&b[1]==0x4b;
// ---- value cleaners
const SEXM={f:'F',fille:'F',feminin:'F',female:'F',femme:'F',woman:'F',girl:'F',m:'M',g:'M',h:'M',garcon:'M',masculin:'M',male:'M',homme:'M',man:'M',boy:'M'};
const sexOf=v=>SEXM[norm(v)]||'';
function dateOf(v){v=String(v||'').trim();if(!v)return{v:''};let y,m,d,x;
 if(/^\d{4,6}(\.\d+)?$/.test(v)&&+v>1000&&+v<80000){const t=new Date(Date.UTC(1899,11,30)+Math.floor(+v)*864e5);y=t.getUTCFullYear();m=t.getUTCMonth()+1;d=t.getUTCDate()}
 else if(x=v.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/)){y=+x[1];m=+x[2];d=+x[3]}
 else if(x=v.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/)){d=+x[1];m=+x[2];y=+x[3]}
 else return{err:1};
 const t=new Date(Date.UTC(y,m-1,d));if(t.getUTCFullYear()!=y||t.getUTCMonth()!=m-1||t.getUTCDate()!=d||y<1970||y>new Date().getFullYear())return{err:1};
 return{v:`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`}}
const clean=(v,n)=>String(v??'').replace(/\s+/g,' ').trim().slice(0,n);
// ---- understanding class names: "Form 1 A", "F1A" and "1A" are one class; "6ème" belongs to the French system; "Lower Sixth Arts" = "L6A"
const FRW={sixieme:'6',cinquieme:'5',quatrieme:'4',troisieme:'3'};
function parseCls(s){const n=norm(s);if(!n)return null;let m;
 if(m=n.match(/^(sixieme|cinquieme|quatrieme|troisieme)(.*)$/))return{sys:'fr',lvl:FRW[m[1]],st:m[2]};
 if(m=n.match(/^(?:seconde|2nde)(.*)$/))return{sys:'fr',lvl:'2nde',st:m[1]};
 if(m=n.match(/^(?:premiere|1ere)(.*)$/))return{sys:'fr',lvl:'1ere',st:m[1]};
 if(m=n.match(/^(?:terminale|tle)(.*)$/))return{sys:'fr',lvl:'tle',st:m[1]};
 if(m=n.match(/^(?:classe)?(\d)eme(.*)$/)||n.match(/^(?:classe)?(6)e(.*)$/))return{sys:'fr',lvl:m[1],st:m[2]};
 if(m=n.match(/^(?:lowersixth|lower6|l6|lsixth)(.*)$/))return{sys:'en',lvl:'l6',st:m[1]};
 if(m=n.match(/^(?:uppersixth|upper6|u6|usixth)(.*)$/))return{sys:'en',lvl:'u6',st:m[1]};
 if(m=n.match(/^(?:form|f|class|classe|cl)?(\d{1,2})(?:st|nd|rd|th)?(.*)$/))return{sys:'en',lvl:m[1],st:m[2]};
 return null}
// 'eq' = same class, 'weak' = same level but one side has no stream, null = different
function rel(a,b){if(!a||!b||a.sys!=b.sys||a.lvl!=b.lvl)return null;const x=a.st,y=b.st;
 if(x==y)return'eq';if(x&&y&&((x.length==1&&y.startsWith(x))||(y.length==1&&x.startsWith(y))))return'eq';return!x||!y?'weak':null}
function lev1(a,b){if(a==b)return true;if(Math.abs(a.length-b.length)>1)return false;let i=0;while(i<a.length&&a[i]==b[i])i++;
 if(a.length==b.length)return a.slice(i+1)==b.slice(i+1);return a.length>b.length?a.slice(i+1)==b.slice(i):a.slice(i)==b.slice(i+1)}
// what to do with a class label that is not exactly a class of the school: merge (one confident match), ask (several or unsure), new
function matchCls(label,classes){const p=parseCls(label),nl=norm(label),strong=[],weak=[],fuzzy=[];
 for(const c of classes){const ps=[parseCls(c.name),parseCls(c.short)];let best=null;
  for(const q of ps){const r=rel(p,q);if(r=='eq')best='eq';else if(r=='weak'&&best!='eq')best='weak'}
  if(best=='eq')strong.push(c);else if(best=='weak')weak.push(c);
  else if(nl.length>=4&&(!p||!ps[0])&&[norm(c.name),norm(c.short)].some(x=>x.length>=4&&lev1(nl,x)))fuzzy.push(c)}
 if(strong.length==1)return{kind:'merge',class_id:strong[0].id,candidates:[strong[0]]};
 const cand=strong.length?strong:weak.length?weak:fuzzy;
 return cand.length?{kind:'ask',candidates:cand.slice(0,6)}:{kind:'new',candidates:[]}}
// suggested short code for a class that does not exist yet
function suggestShort(label,taken){const p=parseCls(label),init=p&&p.st?p.st[0].toUpperCase():'';let sh;
 if(p&&p.sys=='en'&&p.lvl=='l6')sh='L6'+init;else if(p&&p.sys=='en'&&p.lvl=='u6')sh='U6'+init;
 else if(p&&p.sys=='en'&&/^\d{1,2}$/.test(p.lvl))sh='F'+p.lvl+init;
 else sh=clean(label,40).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\p{L}\p{N}]/gu,'').toUpperCase().slice(0,8);
 sh=(sh||'CLS').slice(0,8);let k=sh,i=2;while(taken.has(k.toLowerCase()))k=sh.slice(0,8-String(i).length)+i++;taken.add(k.toLowerCase());return k}
// ---- map file rows to students
function build(raw,sid,defClass){const hi=raw.findIndex(r=>r.some(c=>SYN.name.includes(norm(c))||(SYN.last.includes(norm(c)))));if(hi<0)return{err:'nohead'};
 const H=raw[hi].map(norm),col={};
 for(const k of Object.keys(SYN))col[k]=H.findIndex(h=>SYN[k].includes(h));
 // surname + first name in two columns
 const split=col.first>=0&&(col.last>=0||col.name>=0);
 if(col.name<0&&col.last<0)return{err:'nohead'};
 const classes=db.prepare('SELECT id,name,short FROM classes WHERE school_id=?').all(sid),byC={};for(const c of classes){byC[norm(c.name)]=c;if(c.short)byC[norm(c.short)]??=c}
 // class labels in the file that are not exactly a class of the school: merge into a similar one, ask, or suggest a new class
 const groups=[],gOf={},taken=new Set(classes.map(c=>(c.short||'').toLowerCase()).filter(Boolean)),freq={};
 for(let i=hi+1;i<raw.length;i++){const r=raw[i];if(!r)continue;const t=clean(col.class>=0?r[col.class]:'',60);if(t)freq[t]=(freq[t]||0)+1}
 for(const t of Object.keys(freq).sort((a,b)=>freq[b]-freq[a])){if(byC[norm(t)])continue;const m=matchCls(t,classes);let g;
  if(m.kind=='merge')g=groups.find(x=>x.kind=='merge'&&x.class_id==m.class_id);
  else if(m.kind=='new'){const pt=parseCls(t);g=groups.find(x=>x.kind=='new'&&(norm(x.labels[0])==norm(t)||rel(parseCls(x.labels[0]),pt)=='eq'))}
  if(!g){g={id:groups.length,labels:[],kind:m.kind,class_id:m.class_id||0,candidates:m.candidates.map(c=>({id:c.id,name:c.name})),count:0,ok:0,dups:0};
   if(m.kind=='new')g.suggest={name:t,short:suggestShort(t,taken)};groups.push(g)}
  g.labels.push(t);gOf[norm(t)]=g}
 const have=new Set(db.prepare('SELECT lower(name) n FROM students WHERE school_id=? AND active=1').all(sid).map(r=>r.n)),
  mats=new Set(db.prepare('SELECT matricule m FROM students WHERE school_id=?').all(sid).map(r=>r.m)),seenN=new Set(),seenM=new Set(),out=[];
 for(let i=hi+1;i<raw.length;i++){const r=raw[i];if(!r||r.every(c=>!String(c).trim()))continue;if(out.length>=MAXROWS)return{err:'toobig'};
  const g=k=>col[k]>=0?r[col[k]]:'',e=[];
  let name=split?clean([g('last')||(col.name>=0?r[col.name]:''),g('first')].filter(Boolean).join(' '),200):clean(g('name'),200);
  if(!name)e.push('name');else if(name.length>120)e.push('namelen');
  const sx=sexOf(g('sex'));if(!sx)e.push('sex');
  const dt=dateOf(g('dob'));if(dt.err)e.push('dob');
  let cl=null,gr=null,ct=clean(g('class'),60);if(ct){cl=byC[norm(ct)]||null;if(!cl)gr=gOf[norm(ct)]||null}else if(defClass)cl=defClass;else e.push('noclass');
  let mat=clean(g('matricule'),30);if(mat){if(mats.has(mat))e.push('matdup');else if(seenM.has(mat))e.push('matfile');else seenM.add(mat)}
  const gu=clean(g('guardian'),120),ph=clean(g('phone'),40);
  let dup='';if(!e.length){const k=name.toLowerCase();if(have.has(k))dup='school';else if(seenN.has(k+'|'+(cl?cl.id:'g'+gr.id)))dup='file';seenN.add(k+'|'+(cl?cl.id:'g'+gr.id))}
  if(gr&&!e.length){if(dup)gr.dups++;else gr.ok++}if(gr)gr.count++;
  out.push({n:i+1,name,sex:sx,dob:dt.v||'',class_id:cl?cl.id:0,gi:gr?gr.id:-1,cls:cl?cl.name:ct,matricule:mat,guardian:gu,phone:ph,errors:e,dup})}
 return{rows:out,groups}}
module.exports=(app,{auth,E,audit,school})=>{
 const adm=auth(['principal','secretary']),sid=req=>req.user.school_id;
 const purge=()=>{const t=Date.now();for(const[k,v]of store)if(t-v.at>KEEP)store.delete(k)};
 // template: header in the user's language, example rows use the school's own first class
 app.get('/api/import/template',adm,(req,res)=>{const fr=req.query.lang=='fr',d=fr?';':',',c=db.prepare('SELECT name FROM classes WHERE school_id=? ORDER BY id LIMIT 1').get(sid(req)),cn=c?c.name:(fr?'6ème':'Form 1');
  const L=fr?[['Nom','Sexe','Date de naissance','Classe','Matricule','Tuteur','Téléphone'],['NGONO Marie','F','2012-03-14',cn,'','Mme Ngono','677000000'],['TCHOUA Paul','M','14/09/2011',cn,'','M. Tchoua','699000000']]
   :[['Name','Sex','Date of birth','Class','Matricule','Guardian','Phone'],['NGONO Marie','F','2012-03-14',cn,'','Mrs Ngono','677000000'],['TCHOUA Paul','M','14/09/2011',cn,'','Mr Tchoua','699000000']];
  const q=v=>/[";,\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;
  res.set({'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="${fr?'modele-eleves':'students-template'}.csv"`}).send('﻿'+L.map(r=>r.map(q).join(d)).join('\r\n')+'\r\n')});
 // preview: parse and check, nothing is saved
 app.post('/api/import/students/preview',adm,express.raw({type:()=>true,limit:'5mb'}),(req,res)=>{
  const b=req.body;if(!Buffer.isBuffer(b)||!b.length)return E(res,400,'imp_empty');
  const defC=+req.query.class_id?db.prepare('SELECT id,name FROM classes WHERE id=? AND school_id=?').get(+req.query.class_id,sid(req)):null;
  let raw;try{raw=isZip(b)?parseXLSX(new Uint8Array(b)):parseCSV(b.toString('utf8'))}catch{return E(res,400,'imp_badfile')}
  const r=build(raw,sid(req),defC);if(r.err)return E(res,400,'imp_'+r.err);if(!r.rows.length)return E(res,400,'imp_empty');
  const groups=r.groups;purge();const token=require('crypto').randomBytes(12).toString('hex');for(const[k,v]of store)if(v.sid==sid(req))store.delete(k);store.set(token,{sid:sid(req),rows:r.rows,groups,at:Date.now()});
  const bad=r.rows.filter(x=>x.errors.length).length,dups=r.rows.filter(x=>x.dup).length;
  res.json({token,total:r.rows.length,ok:r.rows.length-bad-dups,errors:bad,dups,groups,classes:db.prepare('SELECT id,name FROM classes WHERE school_id=? ORDER BY name').all(sid(req)),rows:r.rows.slice(0,500),more:Math.max(0,r.rows.length-500)})});
 // commit: valid rows only; duplicates only when asked
 app.post('/api/import/students/commit',adm,(req,res)=>{const j=store.get(String(req.body.token||''));if(!j||j.sid!=sid(req)||Date.now()-j.at>KEEP)return E(res,410,'imp_expired');
  const S=sid(req),sc=school(req),date=SC.clock(sc).date,dups=!!req.body.dups,todo=j.rows.filter(x=>!x.errors.length&&(dups||!x.dup)),map=req.body.map&&typeof req.body.map=='object'?req.body.map:{};
  const classes=db.prepare('SELECT id,name,short FROM classes WHERE school_id=?').all(S),byId=new Map(classes.map(c=>[c.id,c])),byN=new Map(classes.map(c=>[norm(c.name),c.id]));
  // one decision per class label group: merge into a class, create a new class, or skip the students
  const dec={};for(const x of todo){if(x.gi<0||dec[x.gi])continue;const g=j.groups[x.gi],d=map[x.gi]||(g.kind=='merge'?{a:'merge',id:g.class_id}:g.kind=='new'?{a:'new',name:g.suggest.name,short:g.suggest.short}:null);
   if(!d||!['merge','new','skip'].includes(d.a))return E(res,400,'imp_undecided');
   if(d.a=='merge'&&!byId.has(+d.id))return E(res,400,'imp_badclass');
   if(d.a=='new'){d.name=clean(d.name,60);d.short=clean(d.short,8);if(!d.name||!d.short)return E(res,400,'imp_badclass')}
   dec[x.gi]=d}
  const ins=db.prepare('INSERT INTO students(school_id,matricule,name,dob,sex,class_id,enrolled,guardian,phone) VALUES(?,?,?,?,?,?,?,?,?)'),has=db.prepare('SELECT 1 FROM students WHERE school_id=? AND matricule=?'),yy=date.slice(2,4),made=[];
  let added=0;try{added=tx(()=>{
   const target={};for(const gi of Object.keys(dec)){const d=dec[gi];if(d.a=='skip')continue;
    if(d.a=='merge'){target[gi]=+d.id;continue}
    let id=byN.get(norm(d.name));       // a class with this name exists already (or was just made for another spelling): use it
    if(!id){id=db.prepare('INSERT INTO classes(school_id,name,short,qr,section_id) VALUES(?,?,?,?,?)').run(S,d.name,d.short,require('crypto').randomBytes(12).toString('hex'),SECT.ensure(S)[0].id).lastInsertRowid;byN.set(norm(d.name),id);made.push(d.name+' ('+d.short+')')}
    target[gi]=id}
   let n=db.prepare('SELECT COUNT(*) n FROM students WHERE school_id=?').get(S).n,k=0;
   for(const x of todo){const cid=x.gi>=0?target[x.gi]:x.class_id;if(!cid)continue;let m=x.matricule;if(!m){do{n++;m=yy+'-'+String(n).padStart(4,'0')}while(has.get(S,m))}else if(has.get(S,m))throw new Error('mat');
    ins.run(S,m,x.name,x.dob||null,x.sex,cid,date,x.guardian||null,x.phone||null);k++}return k})()}catch(e){return E(res,409,e.message=='mat'?'imp_matdup':'imp_fail')}
  store.delete(req.body.token);try{require('./billing').touchPeak(S)}catch{}
  for(const c of made)audit(req.user,'class.add',c+' (import)');
  audit(req.user,'student.import',added+' students');res.json({added,skipped:j.rows.length-added,classes_created:made.length,created:made})});
};
