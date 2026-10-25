// Shared by the demo seeds: remove the demo school and everything that belongs to it, whatever tables later versions added.
const{db}=require('./db');
function wipe(code){
 const old=db.prepare('SELECT id FROM schools WHERE code=?').get(code);if(!old)return;
 db.exec('PRAGMA foreign_keys=OFF');   // (no-op inside a transaction, so this runs on its own)
 try{
  const i=old.id;
  for(const{name}of db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all()){
   if(name=='schools')continue;if(db.prepare(`PRAGMA table_info("${name}")`).all().some(c=>c.name=='school_id'))db.prepare(`DELETE FROM "${name}" WHERE school_id=?`).run(i)}
  db.prepare('DELETE FROM schools WHERE id=?').run(i);
  // rows that pointed at what was just removed (sessions, section memberships, exam papers, print items ...)
  for(let n=0;n<20;n++){const v=db.prepare('PRAGMA foreign_key_check').all();if(!v.length)break;
   for(const r of v)if(r.rowid!=null)db.prepare(`DELETE FROM "${r.table}" WHERE rowid=?`).run(r.rowid)}
 }finally{db.exec('PRAGMA foreign_keys=ON')}}
module.exports={wipe};
