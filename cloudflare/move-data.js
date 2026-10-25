// Copies a local database (school.db) into the Cloudflare deployment.
//   node cloudflare/move-data.js --db school.db --url https://school-platform.<you>.workers.dev --key <ADMIN_KEY> [--keep]
// Existing rows in the Cloudflare database are replaced (unless --keep). Photos and every other table are included.
// Exam PDFs from the local exams-data folder go to R2 as well (--exams <folder>, default exams-data next to the database; --no-files to skip).
// Run it again later to refresh. The local file is only read.
const{DatabaseSync}=require(['node','sqlite'].join(':'));
const arg=(n,d)=>{const i=process.argv.indexOf('--'+n);return i<0?d:(process.argv[i+1]&&!process.argv[i+1].startsWith('--')?process.argv[i+1]:true)};
const file=arg('db','school.db'),base=String(arg('url','')).replace(/\/$/,''),key=arg('key',process.env.ADMIN_KEY||'');
if(!base||!key){console.error('usage: node cloudflare/move-data.js --db school.db --url https://<your-app> --key <ADMIN_KEY> [--keep]');process.exit(1)}
const db=new DatabaseSync(file,{readOnly:true});
const names=db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(r=>r.name);
// parents before children, so foreign keys hold at every commit
const deps=Object.fromEntries(names.map(t=>[t,new Set(db.prepare(`PRAGMA foreign_key_list("${t}")`).all().map(f=>f.table).filter(x=>x!==t&&names.includes(x)))]));
const order=[],seen=new Set(),visit=t=>{if(seen.has(t))return;seen.add(t);for(const d of deps[t])visit(d);order.push(t)};names.forEach(visit);
const enc=v=>v instanceof Uint8Array?{$b:Buffer.from(v).toString('base64')}:typeof v=='bigint'?Number(v):v;
const post=async(path,body)=>{const r=await fetch(base+path,{method:'POST',headers:{'content-type':'application/json','x-admin-key':key},body:JSON.stringify(body)});if(!r.ok)throw new Error(path+' -> '+r.status+' '+(await r.text()).slice(0,200));return r.json()};
(async()=>{
 const remote=await post('/__admin/tables',{});const missing=order.filter(t=>!remote.includes(t));if(missing.length){console.error('The Cloudflare app does not have these tables yet (deploy the same version first): '+missing.join(', '));process.exit(1)}
 if(!arg('keep',false)){await post('/__admin/import',{reset:[...order].reverse()});console.log('cleared the Cloudflare database')}
 let total=0;
 for(const t of order){const cols=db.prepare(`PRAGMA table_info("${t}")`).all().map(c=>c.name),rows=db.prepare(`SELECT * FROM "${t}"`).all();if(!rows.length)continue;
  let batch=[],size=0;const flush=async()=>{if(batch.length)await post('/__admin/import',{table:t,cols,rows:batch});batch=[];size=0};
  for(const r of rows){const a=cols.map(c=>enc(r[c])),n=JSON.stringify(a).length;if(size+n>1.5e6||batch.length>=2000)await flush();batch.push(a);size+=n}await flush();total+=rows.length;console.log(t.padEnd(24)+rows.length+' rows')}
 console.log('done: '+total+' rows in '+order.length+' tables');
 // exam PDFs: exams-data/<school id>/<exam id>.pdf -> R2 key exams/<school id>/<exam id>.pdf
 const fs=require('fs'),path=require('path');const dir=typeof arg('exams',false)=='string'?arg('exams'):path.join(path.dirname(path.resolve(file)),'exams-data');
 if(!arg('no-files',false)&&fs.existsSync(dir)){let n=0;for(const s of fs.readdirSync(dir)){if(!/^\d+$/.test(s))continue;for(const f of fs.readdirSync(path.join(dir,s))){if(!/^\d+\.pdf$/.test(f))continue;
   const r=await fetch(base+'/__admin/put?key='+encodeURIComponent('exams/'+s+'/'+f),{method:'POST',headers:{'x-admin-key':key},body:fs.readFileSync(path.join(dir,s,f))});if(!r.ok)throw new Error('upload '+s+'/'+f+' -> '+r.status);n++}}
  console.log('exam PDFs uploaded to R2: '+n+' (from '+dir+')')}
})().catch(e=>{console.error(e.message);process.exit(1)});
