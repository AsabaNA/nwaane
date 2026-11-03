// Help center: short tutorials (4 YouTube videos each: computer/phone x English/French, plus a flow of steps or an article).
// Users read them from the app; the owners write them in the Owners' console.
const{db,tx}=require('./db'),express=require('./core/web');
const now=()=>new Date().toISOString(),pj=s=>{try{const v=JSON.parse(s);return Array.isArray(v)?v:[]}catch{return[]}};
db.exec(`CREATE TABLE IF NOT EXISTS help_cats(id INTEGER PRIMARY KEY AUTOINCREMENT,name_en TEXT NOT NULL,name_fr TEXT NOT NULL,icon TEXT DEFAULT 'help',color INTEGER DEFAULT 1,pos INTEGER DEFAULT 0,visible INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS help_tuts(id INTEGER PRIMARY KEY AUTOINCREMENT,cat_id INTEGER NOT NULL,status TEXT DEFAULT 'draft',minutes INTEGER DEFAULT 2,keywords TEXT DEFAULT '',popular INTEGER DEFAULT 0,fmt TEXT DEFAULT 'steps',v_dc_en TEXT DEFAULT '',v_dc_fr TEXT DEFAULT '',v_mb_en TEXT DEFAULT '',v_mb_fr TEXT DEFAULT '',created TEXT,updated TEXT,views INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS help_text(tut_id INTEGER NOT NULL,lang TEXT NOT NULL,title TEXT DEFAULT '',steps TEXT DEFAULT '[]',tip TEXT DEFAULT '',article TEXT DEFAULT '',PRIMARY KEY(tut_id,lang));
CREATE TABLE IF NOT EXISTS help_imgs(id INTEGER PRIMARY KEY AUTOINCREMENT,tut_id INTEGER NOT NULL,mime TEXT,b64 TEXT,created TEXT);
CREATE TABLE IF NOT EXISTS help_votes(id INTEGER PRIMARY KEY AUTOINCREMENT,tut_id INTEGER NOT NULL,yes INTEGER,reason TEXT DEFAULT '',note TEXT DEFAULT '',lang TEXT,device TEXT,created TEXT);
CREATE TABLE IF NOT EXISTS help_views(tut_id INTEGER NOT NULL,day TEXT NOT NULL,n INTEGER DEFAULT 0,PRIMARY KEY(tut_id,day));
CREATE TABLE IF NOT EXISTS help_search(q TEXT PRIMARY KEY,n INTEGER DEFAULT 0,found INTEGER DEFAULT 0,last TEXT);
CREATE TABLE IF NOT EXISTS help_set(k TEXT PRIMARY KEY,v TEXT)`);
if(!db.prepare('SELECT COUNT(*) n FROM help_cats').get().n){const w=db.prepare('INSERT INTO help_cats(name_en,name_fr,icon,color,pos) VALUES(?,?,?,?,?)');
 [['Getting started','Pour commencer','rocket',1],['Students','Élèves','users',2],['Report cards','Bulletins','cap',3],['School fees','Frais de scolarité','wallet',4],['Classes & timetable','Classes et emploi du temps','cal',5],['Account & settings','Compte et paramètres','sliders',6]].forEach((c,i)=>w.run(...c,i))}
const ICONS=['rocket','users','cap','wallet','cal','sliders','book','grid','shield','check','clock','list','help','pencil'],VK=['dc_en','dc_fr','mb_en','mb_fr'];
const fold=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim().replace(/\s+/g,' '),cl=(s,n)=>String(s??'').slice(0,n);
const L2=l=>l=='fr'?'fr':'en',O2=l=>l=='fr'?'en':'fr';
const ytId=v=>{v=String(v||'').trim();if(!v)return'';if(/^[\w-]{11}$/.test(v))return v;const m=/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/.exec(v);return m?m[1]:null};
const txt=(id,l)=>db.prepare('SELECT * FROM help_text WHERE tut_id=? AND lang=?').get(id,l)||{title:'',steps:'[]',tip:'',article:''};
const title=(id,l)=>txt(id,l).title||'';
const catMap=()=>new Map(db.prepare('SELECT * FROM help_cats').all().map(c=>[c.id,c]));
const nvid=t=>VK.filter(k=>t['v_'+k]).length;
const setting=()=>Object.fromEntries(db.prepare('SELECT k,v FROM help_set').all().map(r=>[r.k,r.v]));
const pct=id=>{const r=db.prepare('SELECT COUNT(*) n,COALESCE(SUM(yes),0) y FROM help_votes WHERE tut_id=?').get(id);return{votes:r.n,pct:r.n>=3?Math.round(100*r.y/r.n):null}};
// a tutorial in the reader's language, falling back to the other one
const pick=(id,l)=>{const a=txt(id,l),b=txt(id,O2(l)),T=a.title?a:b;return{lang:T===a?l:O2(l),title:T.title,steps:pj(T.steps),tip:T.tip||'',article:T.article||''}};
const sum=(t,l,cm)=>{const p=pick(t.id,l),c=cm.get(t.cat_id);return{id:t.id,title:p.title,cat:c?(l=='fr'?c.name_fr:c.name_en):'',minutes:t.minutes,helpful:pct(t.id).pct}};
const pubs=()=>db.prepare("SELECT t.* FROM help_tuts t JOIN help_cats c ON c.id=t.cat_id WHERE t.status='published' AND c.visible=1").all();
const popular=(l,cm,n=6)=>pubs().sort((a,b)=>b.popular-a.popular||b.views-a.views||a.id-b.id).slice(0,n).filter(t=>pick(t.id,l).title).map(t=>sum(t,l,cm));
const search=(q,l,catId)=>{const cm=catMap(),tk=fold(q).split(' ').filter(Boolean);if(!tk.length)return[];
 return pubs().filter(t=>!catId||t.cat_id==catId).map(t=>{const c=cm.get(t.cat_id),hay=fold([title(t.id,'en'),title(t.id,'fr'),t.keywords,c.name_en,c.name_fr,...['en','fr'].flatMap(x=>pj(txt(t.id,x).steps).map(s=>s.t))].join(' '));
  if(!tk.every(w=>hay.includes(w)))return null;const ti=fold(title(t.id,l)+' '+title(t.id,O2(l)));return{t,score:(tk.every(w=>ti.includes(w))?10:0)+t.popular*2+Math.min(t.views,50)/50}}).filter(Boolean).sort((a,b)=>b.score-a.score).map(x=>sum(x.t,l,cm))};

// three starter drafts for the owner to review, add videos to and publish (nothing is visible to users until published)
if(!db.prepare('SELECT COUNT(*) n FROM help_tuts').get().n){const cat=n=>(db.prepare('SELECT id FROM help_cats WHERE name_en=?').get(n)||{}).id,t=now(),
 S=[['School fees',['sort fees owing balance unpaid'],{en:['How to show only students who owe fees',[['Open Fees','Left menu'],['Open the list of students','Tab at the top'],['Filter by “Owing”','The dropdown above the list'],['Sort by balance','Click the Balance heading']],'Click the heading again to reverse the order.'],fr:['Comment afficher uniquement les élèves qui doivent',[['Ouvrez Frais','Menu de gauche'],['Ouvrez la liste des élèves','Onglet en haut'],['Filtrez sur « Redevable »','Menu au-dessus de la liste'],['Triez par solde','Cliquez sur le titre Solde']],'Cliquez de nouveau sur le titre pour inverser l’ordre.']}],
 ['Students',['import excel csv upload students'],{en:['How to import students',[['Open Students','Left menu'],['Click Import','Top right'],['Choose your Excel or CSV file','Download the template if you need one'],['Check the preview','Fix anything marked in red'],['Confirm the import','Students are added to their classes']],'Use the template so the columns match.'],fr:['Comment importer des élèves',[['Ouvrez Élèves','Menu de gauche'],['Cliquez sur Importer','En haut à droite'],['Choisissez votre fichier Excel ou CSV','Téléchargez le modèle si besoin'],['Vérifiez l’aperçu','Corrigez ce qui est en rouge'],['Confirmez l’importation','Les élèves sont ajoutés à leurs classes']],'Utilisez le modèle pour que les colonnes correspondent.']}],
 ['Report cards',['report cards bulletins download pdf print'],{en:['How to download report cards',[['Open Reports','Left menu'],['Pick the class and the term',''],['Click Download','Choose one student or the whole class']],'The whole class downloads as a single PDF.'],fr:['Comment télécharger les bulletins',[['Ouvrez Bulletins','Menu de gauche'],['Choisissez la classe et le trimestre',''],['Cliquez sur Télécharger','Un élève ou toute la classe']],'Toute la classe se télécharge en un seul PDF.']}]];
 for(const[c,kw,x]of S){const id=Number(db.prepare('INSERT INTO help_tuts(cat_id,keywords,created,updated) VALUES(?,?,?,?)').run(cat(c)||1,kw[0],t,t).lastInsertRowid);
  for(const l of['en','fr'])db.prepare('INSERT INTO help_text(tut_id,lang,title,steps,tip) VALUES(?,?,?,?,?)').run(id,l,x[l][0],JSON.stringify(x[l][1].map(([a,h])=>({t:a,h,img:0}))),x[l][2])}}
module.exports=(app,{auth,E})=>{const A=auth([],true);
 app.get('/api/help/home',A,(req,res)=>{const l=L2(req.query.lang),cm=catMap(),n={};for(const t of pubs())n[t.cat_id]=(n[t.cat_id]||0)+1;
  const pop=popular(l,cm);res.json({cats:db.prepare('SELECT * FROM help_cats WHERE visible=1 ORDER BY pos,id').all().filter(c=>n[c.id]).map(c=>({id:c.id,name:l=='fr'?c.name_fr:c.name_en,icon:c.icon,color:c.color,n:n[c.id]})),popular:pop,ideas:pop.slice(0,4).map(x=>x.title),contact:setting()})});
 app.get('/api/help/cat/:id',A,(req,res)=>{const l=L2(req.query.lang),cm=catMap(),c=cm.get(+req.params.id);if(!c||!c.visible)return E(res,404,'help_nocat');
  res.json({cat:{id:c.id,name:l=='fr'?c.name_fr:c.name_en,icon:c.icon,color:c.color},tuts:pubs().filter(t=>t.cat_id==c.id).sort((a,b)=>b.popular-a.popular||b.views-a.views||a.id-b.id).filter(t=>pick(t.id,l).title).map(t=>sum(t,l,cm))})});
 app.get('/api/help/search',A,(req,res)=>{const l=L2(req.query.lang),q=cl(req.query.q,80),tuts=search(q,l,+req.query.cat||0),k=fold(q);
  if(k.length>=2&&!req.query.cat)db.prepare('INSERT INTO help_search(q,n,found,last) VALUES(?,1,?,?) ON CONFLICT(q) DO UPDATE SET n=n+1,found=?,last=?').run(k,tuts.length?1:0,now(),tuts.length?1:0,now());
  res.json({tuts})});
 app.get('/api/help/tut/:id',A,(req,res)=>{const l=L2(req.query.lang),t=db.prepare("SELECT * FROM help_tuts WHERE id=? AND status='published'").get(+req.params.id),cm=catMap(),c=t&&cm.get(t.cat_id);if(!t||!c||!c.visible)return E(res,404,'help_notut');
  if(!req.query.quiet){const d=now().slice(0,10);db.prepare('INSERT INTO help_views(tut_id,day,n) VALUES(?,?,1) ON CONFLICT(tut_id,day) DO UPDATE SET n=n+1').run(t.id,d);db.prepare('UPDATE help_tuts SET views=views+1 WHERE id=?').run(t.id)}
  const p=pick(t.id,l);res.json({id:t.id,title:p.title,cat:{id:c.id,name:l=='fr'?c.name_fr:c.name_en},minutes:t.minutes,updated:(t.updated||'').slice(0,10),fmt:t.fmt,steps:p.steps,tip:p.tip,article:p.article,videos:Object.fromEntries(VK.map(k=>[k,t['v_'+k]])),text_lang:p.lang,
   related:pubs().filter(x=>x.cat_id==t.cat_id&&x.id!=t.id).slice(0,4).filter(x=>pick(x.id,l).title).map(x=>({id:x.id,title:pick(x.id,l).title})),contact:setting(),helpful:pct(t.id).pct})});
 app.post('/api/help/vote',A,(req,res)=>{const b=req.body||{},t=db.prepare("SELECT id FROM help_tuts WHERE id=? AND status='published'").get(+b.id);if(!t)return E(res,404,'help_notut');
  const reason=['fast','unclear','notmine','video'].includes(b.reason)?b.reason:'';db.prepare('INSERT INTO help_votes(tut_id,yes,reason,note,lang,device,created) VALUES(?,?,?,?,?,?,?)').run(t.id,b.yes?1:0,b.yes?'':reason,b.yes?'':cl(b.note,300),L2(b.lang),b.device=='mb'?'mb':'dc',now());res.json({ok:1})});
 app.get('/help-img/:id',(req,res)=>{const r=db.prepare('SELECT mime,b64 FROM help_imgs WHERE id=?').get(+req.params.id);if(!r)return res.status(404).end('Not found');res.set({'Content-Type':r.mime,'Cache-Control':'public, max-age=86400, immutable','X-Content-Type-Options':'nosniff'});res.end(Buffer.from(r.b64,'base64'))});
};
// ---------------------------------------------------------------- owners' console
module.exports.ownerApi=(R,{need,log,E})=>{const O=need(['owner']);
 const full=id=>{const t=db.prepare('SELECT * FROM help_tuts WHERE id=?').get(id);if(!t)return null;const v=db.prepare('SELECT yes,reason,note,created FROM help_votes WHERE tut_id=? ORDER BY id DESC').all(id),why={};for(const x of v)if(!x.yes&&x.reason)why[x.reason]=(why[x.reason]||0)+1;
  const p=pct(id),all=db.prepare('SELECT COUNT(*) n,COALESCE(SUM(yes),0) y FROM help_votes WHERE tut_id=?').get(id);return{id:t.id,cat_id:t.cat_id,status:t.status,minutes:t.minutes,keywords:t.keywords,popular:!!t.popular,fmt:t.fmt,videos:Object.fromEntries(VK.map(k=>[k,t['v_'+k]])),views:t.views,updated:t.updated,
   text:Object.fromEntries(['en','fr'].map(l=>{const x=txt(id,l);return[l,{title:x.title,steps:pj(x.steps),tip:x.tip,article:x.article}]})),votes:all.n,helpful:all.n?Math.round(100*all.y/all.n):null,why,notes:v.filter(x=>!x.yes&&x.note).slice(0,8).map(x=>({note:x.note,at:x.created.slice(0,10)}))}};
 R.get('/help/overview',O,(req,res)=>{const cm=catMap(),since=new Date(Date.now()-30*864e5).toISOString().slice(0,10),views=db.prepare('SELECT COALESCE(SUM(n),0) n FROM help_views WHERE day>=?').get(since).n,v=db.prepare('SELECT COUNT(*) n,COALESCE(SUM(yes),0) y FROM help_votes').get();
  const tuts=db.prepare('SELECT * FROM help_tuts ORDER BY id DESC').all().map(t=>{const p=pct(t.id),c=cm.get(t.cat_id);return{id:t.id,title:title(t.id,'en')||title(t.id,'fr')||'(untitled)',cat:c?c.name_en:'',videos:nvid(t),status:t.status,helpful:p.pct,votes:p.votes,views:t.views}});
  const missed=db.prepare('SELECT q,n FROM help_search WHERE found=0 ORDER BY n DESC,last DESC LIMIT 12').all();
  res.json({views,helpful:v.n?Math.round(100*v.y/v.n):null,votes:v.n,nores:db.prepare('SELECT COALESCE(SUM(n),0) n FROM help_search WHERE found=0').get().n,missing:tuts.filter(t=>t.status=='published'&&t.videos<4).length,tuts,missed,settings:setting()})});
 R.post('/help/settings',O,(req,res)=>{const b=req.body||{},w=db.prepare('INSERT INTO help_set(k,v) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=?');for(const k of['whatsapp','phone','hours']){const v=cl(b[k],60).trim();w.run(k,v,v)}log(req.o,'help.settings');res.json({ok:1})});
 R.post('/help/missed/clear',O,(req,res)=>{db.prepare('DELETE FROM help_search WHERE q=?').run(fold(req.body.q));res.json({ok:1})});
 // ---- categories
 R.get('/help/cats',O,(req,res)=>{const n=Object.fromEntries(db.prepare('SELECT cat_id,COUNT(*) n FROM help_tuts GROUP BY cat_id').all().map(r=>[r.cat_id,r.n]));res.json({cats:db.prepare('SELECT * FROM help_cats ORDER BY pos,id').all().map(c=>({...c,visible:!!c.visible,n:n[c.id]||0})),icons:ICONS})});
 R.post('/help/cat/save',O,(req,res)=>{const b=req.body||{},en=cl(b.name_en,50).trim(),fr=cl(b.name_fr,50).trim(),ic=ICONS.includes(b.icon)?b.icon:'help',co=Math.max(1,Math.min(6,+b.color||1)),vis=b.visible===false||b.visible===0||b.visible==='0'?0:1;
  if(!en||!fr)return E(res,400,'help_name');
  if(+b.id){if(!db.prepare('SELECT 1 FROM help_cats WHERE id=?').get(+b.id))return E(res,404,'help_nocat');db.prepare('UPDATE help_cats SET name_en=?,name_fr=?,icon=?,color=?,visible=? WHERE id=?').run(en,fr,ic,co,vis,+b.id);log(req.o,'help.cat.edit',null,en);return res.json({ok:1,id:+b.id})}
  const pos=db.prepare('SELECT COALESCE(MAX(pos),-1)+1 p FROM help_cats').get().p,id=Number(db.prepare('INSERT INTO help_cats(name_en,name_fr,icon,color,pos,visible) VALUES(?,?,?,?,?,?)').run(en,fr,ic,co,pos,vis).lastInsertRowid);log(req.o,'help.cat.add',null,en);res.json({ok:1,id})});
 R.post('/help/cat/order',O,(req,res)=>{const ids=(req.body.ids||[]).map(Number);tx(()=>ids.forEach((id,i)=>db.prepare('UPDATE help_cats SET pos=? WHERE id=?').run(i,id)))();res.json({ok:1})});
 R.post('/help/cat/delete',O,(req,res)=>{const id=+req.body.id,to=+req.body.move_to||0,n=db.prepare('SELECT COUNT(*) n FROM help_tuts WHERE cat_id=?').get(id).n;if(!db.prepare('SELECT 1 FROM help_cats WHERE id=?').get(id))return E(res,404,'help_nocat');
  if(n){if(!to||to==id||!db.prepare('SELECT 1 FROM help_cats WHERE id=?').get(to))return E(res,400,'help_moveto');db.prepare('UPDATE help_tuts SET cat_id=? WHERE cat_id=?').run(to,id)}
  db.prepare('DELETE FROM help_cats WHERE id=?').run(id);log(req.o,'help.cat.delete');res.json({ok:1})});
 // ---- tutorials
 R.post('/help/tut/new',O,(req,res)=>{const c=+req.body.cat_id||(db.prepare('SELECT id FROM help_cats ORDER BY pos,id LIMIT 1').get()||{}).id;if(!c)return E(res,400,'help_nocat');const t=now();const id=Number(db.prepare('INSERT INTO help_tuts(cat_id,created,updated) VALUES(?,?,?)').run(c,t,t).lastInsertRowid);
  for(const l of['en','fr'])db.prepare('INSERT INTO help_text(tut_id,lang) VALUES(?,?)').run(id,l);res.json({id})});
 R.get('/help/tut/:id',O,(req,res)=>{const t=full(+req.params.id);if(!t)return E(res,404,'help_notut');res.json({tut:t,cats:db.prepare('SELECT id,name_en,name_fr FROM help_cats ORDER BY pos,id').all()})});
 R.post('/help/tut/save',O,(req,res)=>{const b=req.body||{},id=+b.id,cur=db.prepare('SELECT * FROM help_tuts WHERE id=?').get(id);if(!cur)return E(res,404,'help_notut');
  if(!db.prepare('SELECT 1 FROM help_cats WHERE id=?').get(+b.cat_id))return E(res,400,'help_nocat');
  const vid={};for(const k of VK){const y=ytId((b.videos||{})[k]);if(y===null)return E(res,400,'help_badvideo');vid[k]=y}
  const T={};for(const l of['en','fr']){const x=(b.text||{})[l]||{};T[l]={title:cl(x.title,120).trim(),tip:cl(x.tip,200).trim(),article:cl(x.article,20000),steps:(Array.isArray(x.steps)?x.steps:[]).slice(0,20).map(s=>({t:cl(s.t,120).trim(),h:cl(s.h,240).trim(),img:+s.img||0})).filter(s=>s.t||s.img)}}
  const st=b.status=='published'?'published':'draft';if(st=='published'&&!(T.en.title||T.fr.title))return E(res,400,'help_title');
  tx(()=>{db.prepare('UPDATE help_tuts SET cat_id=?,status=?,minutes=?,keywords=?,popular=?,fmt=?,v_dc_en=?,v_dc_fr=?,v_mb_en=?,v_mb_fr=?,updated=? WHERE id=?').run(+b.cat_id,st,Math.max(1,Math.min(60,+b.minutes||2)),cl(b.keywords,200),b.popular?1:0,b.fmt=='article'?'article':'steps',vid.dc_en,vid.dc_fr,vid.mb_en,vid.mb_fr,now(),id);
   for(const l of['en','fr'])db.prepare('INSERT INTO help_text(tut_id,lang,title,steps,tip,article) VALUES(?,?,?,?,?,?) ON CONFLICT(tut_id,lang) DO UPDATE SET title=?,steps=?,tip=?,article=?').run(id,l,T[l].title,JSON.stringify(T[l].steps),T[l].tip,T[l].article,T[l].title,JSON.stringify(T[l].steps),T[l].tip,T[l].article);
   // pictures nobody uses any more
   const used=new Set(),re=/img:(\d+)/g;for(const l of['en','fr']){T[l].steps.forEach(s=>s.img&&used.add(s.img));let m;while((m=re.exec(T[l].article)))used.add(+m[1])}
   for(const r of db.prepare('SELECT id FROM help_imgs WHERE tut_id=?').all(id))if(!used.has(r.id))db.prepare('DELETE FROM help_imgs WHERE id=?').run(r.id)})();
  log(req.o,'help.tut.save',null,T.en.title||T.fr.title);res.json({ok:1})});
 R.post('/help/tut/delete',O,(req,res)=>{const id=+req.body.id;tx(()=>{for(const t of['help_text','help_imgs','help_votes','help_views'])db.prepare(`DELETE FROM ${t} WHERE tut_id=?`).run(id);db.prepare('DELETE FROM help_tuts WHERE id=?').run(id)})();log(req.o,'help.tut.delete');res.json({ok:1})});
 R.post('/help/tut/status',O,(req,res)=>{const id=+req.body.id,pub=req.body.status=='published';if(pub&&!(title(id,'en')||title(id,'fr')))return E(res,400,'help_title');db.prepare('UPDATE help_tuts SET status=?,updated=? WHERE id=?').run(pub?'published':'draft',now(),id);res.json({ok:1})});
 R.post('/help/img',O,express.raw({type:()=>true,limit:'400kb'}),(req,res)=>{const id=+req.query.tut,b=req.body;if(!db.prepare('SELECT 1 FROM help_tuts WHERE id=?').get(id))return E(res,404,'help_notut');
  const mime=Buffer.isBuffer(b)&&b.length>12?(b[0]==0x89&&b[1]==0x50?'image/png':b[0]==0xFF&&b[1]==0xD8?'image/jpeg':b.slice(0,4).toString()=='RIFF'&&b.slice(8,12).toString()=='WEBP'?'image/webp':''):'';
  if(!mime||b.length>300*1024)return E(res,400,'help_img');const iid=Number(db.prepare('INSERT INTO help_imgs(tut_id,mime,b64,created) VALUES(?,?,?,?)').run(id,mime,b.toString('base64'),now()).lastInsertRowid);res.json({id:iid,url:'/help-img/'+iid})});
};
