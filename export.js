// Per-school data export: one JSON file with everything a school owns (no password hashes, no tokens).
// Written nightly for every school (kept 7 days) so the owners hold a copy outside the database,
// and downloadable per school from the owners' console. CLI: node export.js [school_id|all]
const{db}=require('./db'),ST=require('./core/storage'),KEEP=7;
const SKIP=new Set(['sessions','owners','owner_sessions','owner_audit','prices','price_plan','daily_writes','backups','errors','reset_tokens','announcements','schools','sqlite_sequence']);
const HIDE={users:['pw'],support_sessions:['token']};
const tables0=()=>db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t=>t.name),tables=()=>db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(t=>t.name).filter(n=>!SKIP.has(n));
// tables that belong to a school only through a parent row
const CHILD={user_sections:'user_id IN(SELECT id FROM users WHERE school_id=?)',subject_seq:'subject_id IN(SELECT id FROM subjects WHERE school_id=?)',class_group_classes:'group_id IN(SELECT id FROM class_groups WHERE school_id=?)',
 roll_absent:'call_id IN(SELECT id FROM roll_calls WHERE school_id=?)',exam_paper:'tt_id IN(SELECT id FROM exam_tt WHERE school_id=?)',exam_inv:'paper_id IN(SELECT id FROM exam_paper WHERE tt_id IN(SELECT id FROM exam_tt WHERE school_id=?))',
 exam_print_items:'print_id IN(SELECT id FROM exam_prints WHERE school_id=?)'};
// photos are binary: the JSON keeps only a note, the files travel separately (mydata.js)
const noBlob=r=>{for(const k in r)if(r[k]instanceof Uint8Array)r[k]={bytes:r[k].length};return r};
function exportSchool(id){const s=db.prepare('SELECT * FROM schools WHERE id=?').get(id);if(!s)return null;const out={format:'school-export-1',exported:new Date().toISOString(),school:s,tables:{}};
 for(const t of tables()){const cols=db.prepare(`PRAGMA table_info(${t})`).all().map(c=>c.name);if(!cols.includes('school_id'))continue;
  out.tables[t]=db.prepare(`SELECT * FROM ${t} WHERE school_id=?`).all(id).map(r=>{for(const h of HIDE[t]||[])delete r[h];return noBlob(r)})}
 for(const t in CHILD)if(tables0().includes(t))out.tables[t]=db.prepare(`SELECT * FROM ${t} WHERE ${CHILD[t]}`).all(id).map(noBlob)
 return out}
async function all(){const day=new Date().toISOString().slice(0,10);let n=0;
 for(const s of db.prepare('SELECT id FROM schools').all()){await ST.put(`exports/school-${s.id}-${day}.json`,Buffer.from(JSON.stringify(exportSchool(s.id))));n++}
 for(const f of await ST.list('exports/')){const m=f.key.match(/school-\d+-(\d{4}-\d\d-\d\d)\.json$/);if(m&&Date.parse(m[1])<Date.now()-KEEP*864e5)await ST.del(f.key)}return n}
module.exports={exportSchool,all,DIR:ST.ROOTS.exports};
if(require.main===module){const a=process.argv[2]||'all';if(a=='all')all().then(n=>console.log(n+' school(s) exported to '+ST.ROOTS.exports));else console.log(JSON.stringify(exportSchool(+a),null,1))}
