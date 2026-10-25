// Nightly local backup (VACUUM INTO) and platform health numbers. Also writes the per-school JSON exports (export.js).
const fs=require('fs'),path=require('path'),{db}=require('./db');
const DBFILE=process.env.DB||'school.db',DIR=process.env.BACKUP_DIR||path.join(path.dirname(path.resolve(DBFILE)),'backups'),KEEP=7;
const last=()=>db.prepare('SELECT * FROM backups ORDER BY id DESC LIMIT 1').get();
function run(note='auto'){if(db.kind!='node'){db.prepare('INSERT INTO backups(at,file,bytes,ok,note) VALUES(?,NULL,0,1,?)').run(new Date().toISOString(),'platform point-in-time recovery');return true}try{fs.mkdirSync(DIR,{recursive:true});const f=path.join(DIR,`backup-${new Date().toISOString().replace(/[:.]/g,'-')}.db`);db.exec(`VACUUM INTO '${f.replace(/'/g,"''")}'`);const b=fs.statSync(f).size;{const{DatabaseSync}=require(['node','sqlite'].join(':')),c=new DatabaseSync(f,{readOnly:true});try{const r=c.prepare('PRAGMA integrity_check').get();if(!r||Object.values(r)[0]!=='ok')throw new Error('integrity check failed')}finally{c.close()}}
 db.prepare('INSERT INTO backups(at,file,bytes,ok,note) VALUES(?,?,?,1,?)').run(new Date().toISOString(),path.basename(f),b,note);
 for(const x of fs.readdirSync(DIR).filter(n=>/^backup-.*\.db$/.test(n)).sort().slice(0,-KEEP))fs.unlinkSync(path.join(DIR,x));return true}
 catch(e){db.prepare('INSERT INTO backups(at,ok,note) VALUES(?,0,?)').run(new Date().toISOString(),String(e.message).slice(0,100));return false}}
const due=()=>{const l=last();return!l||Date.now()-Date.parse(l.at)>23*36e5};
const tick=async()=>{if(due()){run();try{await require('./export').all()}catch(e){logError('export',e)}}};
function health(){let size=0;try{size=db.kind=='node'?fs.statSync(DBFILE).size:(db.size?db.size():0)}catch{}const l=last(),days=db.prepare('SELECT day,n FROM daily_writes ORDER BY day DESC LIMIT 14').all().reverse();
 return{db_bytes:size,backup:l?{at:l.at,bytes:l.bytes,ok:!!l.ok,note:l.note}:null,backup_due:due(),writes:days,errors:db.prepare('SELECT at,route,kind FROM errors ORDER BY id DESC LIMIT 20').all(),errors_7d:db.prepare("SELECT COUNT(*) n FROM errors WHERE at>?").get(new Date(Date.now()-7*864e5).toISOString()).n}}
const countWrite=()=>{const d=new Date().toISOString().slice(0,10);db.prepare('INSERT INTO daily_writes(day,n) VALUES(?,1) ON CONFLICT(day) DO UPDATE SET n=n+1').run(d)};
const logError=(route,e)=>{try{db.prepare('INSERT INTO errors(at,route,kind) VALUES(?,?,?)').run(new Date().toISOString(),String(route||'').replace(/\d+/g,':n').slice(0,80),String(e&&(e.code||e.name)||'Error').slice(0,40))}catch{}};
module.exports={run,tick,health,countWrite,logError};
