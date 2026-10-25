// Service worker: keeps the app shell available and never touches data. API, owners, support and reset traffic always goes to the network.
const V='sp-v34',SHELL=['/','/style.css','/charts.css','/charts.js','/charts-app.js','/roll.js','/ai.js','/imp.js','/exam.js','/sect.js','/ett.js','/ett2.js','/ettwz.js','/ttgen.js','/ttui.js','/ttwz.js','/ttp10.js','/ttp11.js','/ttp12.js','/ett3.js','/inv.js','/exprint.js','/badge.js','/recpay.js','/ov2.js','/rc.js','/tbadge.js','/mydata.js','/sxcore.js','/sxreg.js','/sx.js','/honour.js','/p4.js','/p5.js','/rcpt.js','/ui.js','/frame.js','/dash.js','/bill.js','/lists.js','/support.js','/pwa.js','/icons/icon-192.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!=V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
const SKIP=/^\/(api|owners|support|reset|c\/)/;
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);if(r.method!='GET'||u.origin!=location.origin||SKIP.test(u.pathname))return;
 e.respondWith(fetch(r).then(res=>{if(res.ok&&res.type=='basic'){const c=res.clone();caches.open(V).then(x=>x.put(r,c))}return res}).catch(()=>caches.match(r).then(m=>m||(r.mode=='navigate'?caches.match('/'):Response.error()))))});
