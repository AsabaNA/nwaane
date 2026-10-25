// Local database: node:sqlite. The Cloudflare Worker supplies its own driver (Durable Object SQLite) through core/runtime.js.
const{DatabaseSync}=require(['node','sqlite'].join(':'));   // not a literal require: the Worker bundle must not look for node:sqlite
module.exports=function open(file){const raw=new DatabaseSync(file);raw.exec('PRAGMA journal_mode=WAL;PRAGMA foreign_keys=ON;');
 return{kind:'node',raw,exec:s=>raw.exec(s),prepare:s=>raw.prepare(s),
  // tx(fn) returns a function; calling it runs fn inside BEGIN/COMMIT (ROLLBACK on error)
  tx:fn=>(...a)=>{raw.exec('BEGIN');try{const r=fn(...a);raw.exec('COMMIT');return r}catch(e){raw.exec('ROLLBACK');throw e}}}};
