// File storage seam. Every stored file (exam PDFs, nightly exports) goes through here, always async.
// Node: files in folders on disk (same folders as before, same env overrides). Cloudflare: an R2 bucket (runtime.storage is set by the Worker entry).
// Keys look like  exams/<school>/<id>.pdf   exports/school-<id>-<day>.json   backups/<file>
const fs=require('fs'),path=require('path'),R=require('./runtime');
const DBF=process.env.DB||'school.db',base=path.dirname(path.resolve(DBF));
const ROOTS={exams:process.env.EXAM_DIR||path.join(__dirname,'..','exams-data'),exports:process.env.EXPORT_DIR||path.join(base,'exports'),backups:process.env.BACKUP_DIR||path.join(base,'backups')};
const where=key=>{const i=key.indexOf('/'),root=ROOTS[key.slice(0,i)];if(!root||key.includes('..'))throw new Error('bad storage key');return path.join(root,key.slice(i+1))};
const nodeStore={kind:'node',
 async put(key,buf){const f=where(key);await fs.promises.mkdir(path.dirname(f),{recursive:true});await fs.promises.writeFile(f,buf)},
 async get(key){try{return await fs.promises.readFile(where(key))}catch(e){if(e.code=='ENOENT')return null;throw e}},
 async del(key){try{await fs.promises.unlink(where(key))}catch(e){if(e.code!='ENOENT')throw e}},
 async exists(key){try{await fs.promises.access(where(key));return true}catch{return false}},
 // list('exams/') -> [{key,size}] (one level of folders is walked, which is all we use)
 async list(prefix){const i=prefix.indexOf('/'),top=prefix.slice(0,i),root=ROOTS[top],sub=prefix.slice(i+1),out=[];if(!root)return out;
  const walk=async(dir,rel)=>{let ents;try{ents=await fs.promises.readdir(dir,{withFileTypes:true})}catch{return}
   for(const e of ents){const k=rel+e.name;if(e.isDirectory())await walk(path.join(dir,e.name),k+'/');else if((top+'/'+k).startsWith(prefix)){const st=await fs.promises.stat(path.join(dir,e.name));out.push({key:top+'/'+k,size:st.size})}}};
  await walk(root,'');return out.sort((a,b)=>a.key<b.key?-1:1)}};
module.exports=new Proxy({nodeStore,ROOTS},{get:(t,k)=>k in t?t[k]:(R.storage||nodeStore)[k]});
