// Bulk import of students from an Excel (.xlsx) or CSV file: preview with row-by-row errors, then commit the valid rows.
// Teachers and marks are not imported: staff need a verified email each, and marks belong to the teacher who submits them.
const{db,tx}=require('./db'),SC=require('./sched'),express=require('./core/web'),{unzipSync,strFromU8}=require('fflate');
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
// ---- map file rows to students
function build(raw,sid,defClass){const hi=raw.findIndex(r=>r.some(c=>SYN.name.includes(norm(c))||(SYN.last.includes(norm(c)))));if(hi<0)return{err:'nohead'};
 const H=raw[hi].map(norm),col={};
 for(const k of Object.keys(SYN))col[k]=H.findIndex(h=>SYN[k].includes(h));
 // surname + first name in two columns
 const split=col.first>=0&&(col.last>=0||col.name>=0);
 if(col.name<0&&col.last<0)return{err:'nohead'};
 const classes=db.prepare('SELECT id,name,short FROM classes WHERE school_id=?').all(sid),byC={};for(const c of classes){byC[norm(c.name)]=c;if(c.short)byC[norm(c.short)]??=c}
 const have=new Set(db.prepare('SELECT lower(name) n FROM students WHERE school_id=? AND active=1').all(sid).map(r=>r.n)),
  mats=new Set(db.prepare('SELECT matricule m FROM students WHERE school_id=?').all(sid).map(r=>r.m)),seenN=new Set(),seenM=new Set(),out=[];
 for(let i=hi+1;i<raw.length;i++){const r=raw[i];if(!r||r.every(c=>!String(c).trim()))continue;if(out.length>=MAXROWS)return{err:'toobig'};
  const g=k=>col[k]>=0?r[col[k]]:'',e=[];
  let name=split?clean([g('last')||(col.name>=0?r[col.name]:''),g('first')].filter(Boolean).join(' '),200):clean(g('name'),200);
  if(!name)e.push('name');else if(name.length>120)e.push('namelen');
  const sx=sexOf(g('sex'));if(!sx)e.push('sex');
  const dt=dateOf(g('dob'));if(dt.err)e.push('dob');
  let cl=null,ct=clean(g('class'),60);if(ct){cl=byC[norm(ct)]||null;if(!cl)e.push('class')}else if(defClass)cl=defClass;else e.push('noclass');
  let mat=clean(g('matricule'),30);if(mat){if(mats.has(mat))e.push('matdup');else if(seenM.has(mat))e.push('matfile');else seenM.add(mat)}
  const gu=clean(g('guardian'),120),ph=clean(g('phone'),40);
  let dup='';if(!e.length){const k=name.toLowerCase();if(have.has(k))dup='school';else if(seenN.has(k+'|'+cl.id))dup='file';seenN.add(k+'|'+cl.id)}
  out.push({n:i+1,name,sex:sx,dob:dt.v||'',class_id:cl?cl.id:0,cls:cl?cl.name:ct,matricule:mat,guardian:gu,phone:ph,errors:e,dup})}
 return{rows:out}}
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
  purge();const token=require('crypto').randomBytes(12).toString('hex');for(const[k,v]of store)if(v.sid==sid(req))store.delete(k);store.set(token,{sid:sid(req),rows:r.rows,at:Date.now()});
  const bad=r.rows.filter(x=>x.errors.length).length,dups=r.rows.filter(x=>x.dup).length;
  res.json({token,total:r.rows.length,ok:r.rows.length-bad-dups,errors:bad,dups,rows:r.rows.slice(0,500),more:Math.max(0,r.rows.length-500)})});
 // commit: valid rows only; duplicates only when asked
 app.post('/api/import/students/commit',adm,(req,res)=>{const j=store.get(String(req.body.token||''));if(!j||j.sid!=sid(req)||Date.now()-j.at>KEEP)return E(res,410,'imp_expired');
  const sc=school(req),date=SC.clock(sc).date,dups=!!req.body.dups,todo=j.rows.filter(x=>!x.errors.length&&(dups||!x.dup));
  const ins=db.prepare('INSERT INTO students(school_id,matricule,name,dob,sex,class_id,enrolled,guardian,phone) VALUES(?,?,?,?,?,?,?,?,?)'),has=db.prepare('SELECT 1 FROM students WHERE school_id=? AND matricule=?'),yy=date.slice(2,4);
  let added;try{added=tx(()=>{let n=db.prepare('SELECT COUNT(*) n FROM students WHERE school_id=?').get(sid(req)).n;
   for(const x of todo){let m=x.matricule;if(!m){do{n++;m=yy+'-'+String(n).padStart(4,'0')}while(has.get(sid(req),m))}else if(has.get(sid(req),m))throw new Error('mat');
    ins.run(sid(req),m,x.name,x.dob||null,x.sex,x.class_id,date,x.guardian||null,x.phone||null)}return todo.length})()}catch(e){return E(res,409,e.message=='mat'?'imp_matdup':'imp_fail')}
  store.delete(req.body.token);try{require('./billing').touchPeak(sid(req))}catch{}
  audit(req.user,'student.import',added+' students');res.json({added,skipped:j.rows.length-added})});
};
