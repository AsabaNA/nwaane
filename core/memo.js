// Small per-school cache for expensive read-only calculations (Cloudflare bills every row a query scans).
// An entry lives for at most `ttl` ms and is dropped for a school as soon as any successful write (POST) to that school goes through.
const store=new Map();   // school_id -> Map(key -> {at,v})
const clone=v=>v==null||typeof v!='object'?v:structuredClone(v);
function memo(sid,key,ttl,fn){const now=Date.now();let m=store.get(sid);if(!m)store.set(sid,m=new Map());const e=m.get(key);if(e&&now-e.at<ttl)return clone(e.v);
 const v=fn();m.set(key,{at:now,v:clone(v)});if(m.size>400)m.delete(m.keys().next().value);return v}
memo.clear=sid=>{if(sid==null)store.clear();else store.delete(sid)};
memo.size=()=>[...store.values()].reduce((a,m)=>a+m.size,0);
module.exports=memo;
