// Roll the Cloudflare database back to an earlier moment (up to 30 days). Everything the app stores moves back together:
// marks, payments, users, sessions. Files in R2 (exam PDFs) are not touched.
//   node cloudflare/restore-point.js --url https://<your-app> --key <ADMIN_KEY> --at 2026-10-24T09:30:00Z
// The answer contains an "undo" bookmark: run again with --bookmark <undo> to return to where you were before the restore.
// Tip: take the time from the nightly exports (exports/school-<id>-<date>.json in the R2 bucket) or from the audit log.
const arg=n=>{const i=process.argv.indexOf('--'+n);return i<0?null:process.argv[i+1]};
const base=String(arg('url')||'').replace(/\/$/,''),key=arg('key')||process.env.ADMIN_KEY,at=arg('at'),bookmark=arg('bookmark');
if(!base||!key||(!at&&!bookmark)){console.error('usage: node cloudflare/restore-point.js --url <app url> --key <ADMIN_KEY> (--at <ISO time, UTC> | --bookmark <bookmark>)');process.exit(1)}
(async()=>{const r=await fetch(base+'/__admin/restore',{method:'POST',headers:{'content-type':'application/json','x-admin-key':key},body:JSON.stringify({at,bookmark})});const t=await r.text();
 if(!r.ok){console.error('refused: '+t);process.exit(1)}console.log(t);console.log('The database restarts on the next request and comes back at that moment. Keep the "undo" value if you want to go back.')})().catch(e=>{console.error(e.message);process.exit(1)});
