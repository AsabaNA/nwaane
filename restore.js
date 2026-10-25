// Restore the database from a nightly backup. Stop the server first.
//   node restore.js                      list the backups
//   node restore.js backup-2026-10-18T02-00-00-000Z.db   put that backup in place (the current database is kept as school.db.before-restore)
const fs=require('fs'),path=require('path');
const DBFILE=path.resolve(process.env.DB||'school.db'),DIR=process.env.BACKUP_DIR||path.join(path.dirname(DBFILE),'backups');
const list=()=>fs.existsSync(DIR)?fs.readdirSync(DIR).filter(n=>/^backup-.*\.db$/.test(n)).sort().reverse():[];
const a=process.argv[2];
if(!a){const l=list();console.log(l.length?l.map(n=>`${n}  ${Math.round(fs.statSync(path.join(DIR,n)).size/1024)} KB`).join('\n'):'No backups found in '+DIR);process.exit(0)}
const src=path.join(DIR,path.basename(a));if(!fs.existsSync(src)){console.error('Not found: '+src);process.exit(1)}
const{DatabaseSync}=require('node:sqlite'),c=new DatabaseSync(src,{readOnly:true});const r=c.prepare('PRAGMA integrity_check').get();c.close();if(Object.values(r)[0]!=='ok'){console.error('This backup failed its integrity check. Nothing was changed.');process.exit(1)}
if(fs.existsSync(DBFILE))fs.copyFileSync(DBFILE,DBFILE+'.before-restore');for(const x of['-wal','-shm'])try{fs.unlinkSync(DBFILE+x)}catch{}
fs.copyFileSync(src,DBFILE);console.log('Restored '+path.basename(src)+' to '+DBFILE+'. The previous database is saved as '+path.basename(DBFILE)+'.before-restore. Start the server again.');
