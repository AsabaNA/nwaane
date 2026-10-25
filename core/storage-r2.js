// File storage on Cloudflare R2 (same interface as core/storage.js). bucket = the R2 binding.
module.exports=bucket=>({kind:'r2',
 put:async(key,buf)=>{await bucket.put(key,buf)},
 get:async key=>{const o=await bucket.get(key);return o?Buffer.from(await o.arrayBuffer()):null},
 del:async key=>{await bucket.delete(key)},
 exists:async key=>!!(await bucket.head(key)),
 list:async prefix=>{const out=[];let cursor;do{const r=await bucket.list({prefix,cursor});for(const o of r.objects)out.push({key:o.key,size:o.size});cursor=r.truncated?r.cursor:undefined}while(cursor);return out.sort((a,b)=>a.key<b.key?-1:1)}});
