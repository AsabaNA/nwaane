// Smoke test for a deployed (or `npm run cf:dev`) copy of the platform. Needs only Node 22.
//   node cloudflare/smoke.js --url https://<your-app> --code <SCHOOL CODE> --user <principal username> --password <password>
// Reads a few screens, builds PDFs, and round-trips one small file through R2 (it creates a throw-away exam, uploads a one-page PDF,
// reads it back, then deletes the exam). Nothing else is written. Exit code 1 if anything fails.
const arg=n=>{const i=process.argv.indexOf('--'+n);return i<0?null:process.argv[i+1]};
const base=String(arg('url')||'').replace(/\/$/,''),code=arg('code'),user=arg('user'),pw=arg('password')||process.env.SMOKE_PASSWORD;
if(!base||!code||!user||!pw){console.error('usage: node cloudflare/smoke.js --url <app url> --code <school code> --user <principal> --password <password>');process.exit(2)}
const out=[];let bad=0;const ok=(n,c,x)=>{out.push((c?'PASS ':'FAIL ')+n+(c?'':'  '+String(typeof x=='string'?x:JSON.stringify(x)).slice(0,200)));if(!c)bad++};
let ck='';const call=async(p,m='GET',body,h={})=>{const r=await fetch(base+p,{method:m,headers:{cookie:ck,...h},body,redirect:'manual'});for(const c of r.headers.getSetCookie?.()||[])ck=(ck?ck+'; ':'')+c.split(';')[0];return r};
const js=async(p,m='GET',b)=>{const r=await call(p,m,b&&JSON.stringify(b),{'content-type':'application/json'});let d={};try{d=await r.clone().json()}catch{}return{s:r.status,d,r}};
// a valid one-page PDF made by hand (offsets computed)
const tinyPdf=()=>{const o=['<</Type/Catalog/Pages 2 0 R>>','<</Type/Pages/Kids[3 0 R]/Count 1>>','<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>'];let s='%PDF-1.4\n';const off=[];o.forEach((x,i)=>{off.push(s.length);s+=`${i+1} 0 obj\n${x}\nendobj\n`});const x=s.length;s+=`xref\n0 ${o.length+1}\n0000000000 65535 f \n`+off.map(v=>String(v).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<</Size ${o.length+1}/Root 1 0 R>>\nstartxref\n${x}\n%%EOF\n`;return Buffer.from(s,'latin1')};
(async()=>{
 let r=await call('/');ok('home page',r.status==200&&/<html/i.test(await r.text()),r.status);
 ok('security headers',r.headers.get('x-content-type-options')=='nosniff'&&!!r.headers.get('strict-transport-security')||base.startsWith('http://'),'');
 r=await call('/api/me');ok('API refuses a visitor',r.status==401,r.status);
 r=await call('/__admin/tables','POST','{}');ok('admin door is closed without the key',r.status==404,r.status);
 r=await call('/api/nope');ok('unknown route answers 404',r.status==404,r.status);
 const t0=Date.now();r=await js('/api/login','POST',{code,username:user,password:pw});ok('sign in',r.s==200,[r.s,r.d]);if(r.s!=200){console.log(out.join('\n'));process.exit(1)}
 ok('sign in took under 3 s',Date.now()-t0<3000,Date.now()-t0);
 const sc=r.r.headers.getSetCookie().join(';');ok('session cookie is HttpOnly'+(base.startsWith('https')?' and Secure':''),/HttpOnly/i.test(sc)&&(!base.startsWith('https')||/Secure/i.test(sc)),sc);
 r=await js('/api/me');ok('who am I',r.s==200&&r.d.role,r.d);const role=r.d.role;
 for(const p of['/api/classes','/api/students','/api/exams','/api/settings','/api/fees/list','/api/idcards','/api/dashboard']){r=await js(p);ok('read '+p,r.s==200,r.s)}
 const classes=(await js('/api/classes')).d,cl=Array.isArray(classes)?classes:(classes.classes||[]);
 // PDFs built on the Worker
 r=await js('/api/rc/overview?term=1');const ov=r.d;let pub=null;for(const c of(ov.classes||ov.rows||[])){if(c.published||c.pub||c.locked){pub=c.id||c.class_id;break}}
 if(!pub&&cl.length){for(const c of cl){const x=await call('/api/report/pdf?class_id='+c.id+'&term=1');if(x.status==200){pub=c.id;break}}}
 if(pub){r=await call('/api/report/pdf?class_id='+pub+'&term=1');const b=Buffer.from(await r.arrayBuffer());ok('report card PDF',r.status==200&&b.subarray(0,5).toString()=='%PDF-'&&b.length>5000,[r.status,b.length])}else out.push('SKIP report card PDF (no published class for term 1)');
 r=await call('/api/timetable/pdf?kind=class&class_id='+(cl[0]&&cl[0].id));if(r.status==200){const b=Buffer.from(await r.arrayBuffer());ok('timetable PDF',b.subarray(0,5).toString()=='%PDF-',r.status)}else out.push('SKIP timetable PDF (answered '+r.status+')');
 // file storage round trip
 const sid=((await js('/api/exams')).d.options||[])[0];
 if(sid&&['principal','secretary'].includes(role)){
  const c=await js('/api/exams','POST',{subject_id:sid.id,title:'Smoke test (delete me)'});ok('create a throw-away exam',c.s==200&&c.d.id,c);
  if(c.d.id){const pdf=tinyPdf();let u=await call('/api/exams/'+c.d.id+'/file','POST',pdf,{'content-type':'application/pdf'});ok('upload a PDF (stored in R2)',u.status==200,[u.status,await u.clone().text()]);
   u=await call('/api/exams/'+c.d.id+'/file');const b=Buffer.from(await u.arrayBuffer());ok('read it back, byte for byte',u.status==200&&b.equals(pdf),[u.status,b.length,pdf.length]);
   u=await call('/api/exams/'+c.d.id,'DELETE');ok('delete the throw-away exam',u.status==200,u.status);
   u=await call('/api/exams/'+c.d.id+'/file');ok('the file is gone',u.status==404,u.status)}
 }else out.push('SKIP file storage test (needs a principal or secretary login and at least one subject)');
 r=await call('/owners');ok('owners console page',r.status==200,r.status);
 r=await js('/api/logout','POST',{});ok('sign out',r.s==200,r.s);r=await js('/api/me');ok('signed out',r.s==401,r.s);
 console.log(out.join('\n'));console.log(bad?`\n${bad} check(s) FAILED`:'\nAll checks passed');process.exit(bad?1:0);
})().catch(e=>{console.log(out.join('\n'));console.error('\nerror: '+e.message);process.exit(1)});
