// Cloudflare database: SQLite inside a Durable Object (ctx.storage.sql). Same surface the app uses from node:sqlite:
//   db.exec(sql)  db.prepare(sql).run/get/all(...args)  db.tx(fn)  db.kind  db.size()
// Everything is synchronous, exactly like node:sqlite, so the app code is the same on both runtimes.
module.exports=function makeDriver(ctx0){let ctx=ctx0,sql=ctx.storage.sql;   // rebind(): a restarted Durable Object in the same isolate hands its new context to the modules that already hold this driver
 const bind=v=>v===undefined?null:typeof v=='boolean'?+v:typeof v=='bigint'?Number(v):(v&&v.buffer instanceof ArrayBuffer&&v.byteLength!==undefined&&!(v instanceof ArrayBuffer))?v.buffer.slice(v.byteOffset,v.byteOffset+v.byteLength):v;
 const row=r=>{for(const k in r){const v=r[k];if(v instanceof ArrayBuffer)r[k]=new Uint8Array(v)}return r};   // BLOBs come back as Uint8Array, like node:sqlite
 const stats={read:0,written:0,statements:0},tally=(c,s)=>{stats.read+=c.rowsRead||0;stats.written+=c.rowsWritten||0;stats.statements++;if(stats.by&&s){const k=String(s).replace(/\s+/g,' ').slice(0,170),o=stats.by[k]??={n:0,rows:0};o.n++;o.rows+=c.rowsRead||0}};   // what Cloudflare bills: rows scanned and rows written
 const q=(s,a)=>{const c=sql.exec(s,...a.map(bind)),r=c.toArray();tally(c,s);return r};
 const write=/^\s*(INSERT|UPDATE|DELETE|REPLACE)\b/i;
 const prepare=s=>({
  run:(...a)=>{q(s,a);if(!write.test(s))return{changes:0,lastInsertRowid:0};const r=sql.exec('SELECT changes() c,last_insert_rowid() r').toArray()[0];return{changes:r.c,lastInsertRowid:r.r}},
  get:(...a)=>{const r=q(s,a);return r.length?row(r[0]):undefined},
  all:(...a)=>q(s,a).map(row)});
 return{kind:'do',rebind:c=>{ctx=c;sql=c.storage.sql},stats,exec:s=>{const c=sql.exec(s);c.toArray();tally(c)},prepare,tx:fn=>(...a)=>ctx.storage.transactionSync(()=>fn(...a)),size:()=>sql.databaseSize}};
