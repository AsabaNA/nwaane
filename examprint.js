// Exam printing: merge the uploaded PDFs of a scope (a timetable, a class, a day, a sequence...) into one print file.
// Classes of a group share one PDF and their copies are added together. Missing papers and papers already printed are warned about first.
const{db,tx}=require('./db'),SC=require('./sched'),XT=require('./examtt'),{PDFDocument,StandardFonts,rgb,degrees}=require('pdf-lib'),ST=require('./core/storage'),EX=require('./exam');
const MAXSHEETS=12000;

// ---- separator page: a full-bleed black band along the top and down both long edges, so it stands out from the side of a stack of paper
const WA=(f,s)=>{s=String(s==null?'':s);try{f.encodeText(s);return s}catch{return[...s].map(c=>{try{f.encodeText(c);return c}catch{return'?'}}).join('')}};
const SEPT={en:{exam:'EXAM',of:'of',cls:'CLASS',classes:'CLASSES',copies:'COPIES',pages:'PAGES PER COPY',sheets:'SHEETS IN TOTAL',teacher:'Set by',each:'Copies',start:'THE PAPERS START ON THE NEXT SHEET',foot:'SORTING SHEET  ·  REMOVE BEFORE GIVING OUT',list:'EXAMS TO PRINT'},
 fr:{exam:'EPREUVE',of:'sur',cls:'CLASSE',classes:'CLASSES',copies:'EXEMPLAIRES',pages:'PAGES PAR EXEMPLAIRE',sheets:'FEUILLES AU TOTAL',teacher:'Enseignant',each:'Exemplaires',start:'LES EPREUVES COMMENCENT A LA FEUILLE SUIVANTE',foot:'FEUILLE DE SEPARATION  ·  A RETIRER AVANT DISTRIBUTION',list:'EPREUVES A IMPRIMER'}};
function wrapFit(font,text,maxW,max,min,maxLines){text=String(text);for(let sz=max;sz>=min;sz-=2){const words=text.split(/\s+/),lines=[];let cur='';for(const w of words){const t=cur?cur+' '+w:w;if(font.widthOfTextAtSize(t,sz)<=maxW||!cur)cur=t;else{lines.push(cur);cur=w}}if(cur)lines.push(cur);
  if(lines.length<=maxLines&&lines.every(l=>font.widthOfTextAtSize(l,sz)<=maxW))return{size:sz,lines}}
 const sz=min,words=text.split(/\s+/),lines=[];let cur='';for(const w of words){const t=cur?cur+' '+w:w;if(font.widthOfTextAtSize(t,sz)<=maxW||!cur)cur=t;else{lines.push(cur);cur=w}}if(cur)lines.push(cur);return{size:sz,lines:lines.slice(0,maxLines+1)}}
function sepPage(out,font,bold,o){const W=595.28,H=841.89,L=SEPT[o.lang=='fr'?'fr':'en'],pg=out.addPage([W,H]),blk=rgb(0,0,0),wh=rgb(1,1,1),gr=rgb(.32,.32,.32),it=o.item,B=200,X=58,TW=W-2*X;
 const T=(x,y,tx,sz,f,c)=>pg.drawText(WA(f,tx),{x,y,size:sz,font:f,color:c||blk});
 pg.drawRectangle({x:0,y:H-B,width:W,height:B,color:blk});pg.drawRectangle({x:0,y:0,width:28,height:H-B,color:blk});pg.drawRectangle({x:W-28,y:0,width:28,height:H-B,color:blk});
 T(X,H-52,L.exam,24,bold,wh);const nt=String(o.n),nw=bold.widthOfTextAtSize(nt,132);T(X,H-176,nt,132,bold,wh);T(X+nw+16,H-176,L.of+' '+o.total,38,bold,wh);
 const sn=WA(bold,String(o.school||'').toUpperCase().slice(0,44));T(W-X-bold.widthOfTextAtSize(sn,11),H-52,sn,11,bold,wh);
 const dt=it.date?new Date(it.date+'T12:00:00'):null,ds=dt&&!isNaN(dt)?dt.toLocaleDateString(o.lang=='fr'?'fr-FR':'en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).toUpperCase().replace(/[  ]/g,' '):'';
 let y=H-B-62;
 const sub=wrapFit(bold,it.subject,TW,66,30,2);for(const l of sub.lines){T(X,y,l,sub.size,bold);y-=sub.size*1.08}y-=6;
 const cl=wrapFit(bold,it.cls,TW,34,16,2);for(const l of cl.lines){T(X,y,l,cl.size,bold,gr);y-=cl.size*1.15}y-=4;
 if(it.title){T(X,y,String(it.title).slice(0,70),22,font,gr);y-=34}
 if(ds){const dd=wrapFit(bold,ds,TW,34,18,1);T(X,y,dd.lines[0],dd.size,bold);y-=dd.size+18}
 // three big numbers in a ruled box
 const bh=104,by=y-bh+10,cw=TW/3;pg.drawRectangle({x:X,y:by,width:TW,height:bh,borderColor:blk,borderWidth:3});
 [[L.copies,String(it.copies)],[L.pages,String(it.pages)],[L.sheets,String(it.pages*it.copies)]].forEach(([k,v],i)=>{const cx=X+i*cw;if(i)pg.drawLine({start:{x:cx,y:by},end:{x:cx,y:by+bh},thickness:2,color:blk});
  T(cx+16,by+bh-26,k,10,bold,gr);T(cx+16,by+22,v,52,bold)});
 y=by-26;
 if(it.group&&it.parts&&it.parts.length>1){const ln=wrapFit(font,L.each+':  '+it.parts.map(p=>p.cls+' '+p.copies).join('   ·   '),TW,14,9,2);for(const l of ln.lines){T(X,y,l,ln.size,font,gr);y-=ln.size+3}y-=4}
 if(it.teachers&&it.teachers.length)T(X,y,L.teacher+':  '+it.teachers.join(', ').slice(0,90),13,font,gr);
 // "papers start after this sheet" banner
 pg.drawRectangle({x:X,y:96,width:TW,height:62,color:blk});pg.drawSvgPath('M 0 0 L 34 0 L 17 26 Z',{x:X+18,y:96+44,color:wh});pg.drawSvgPath('M 0 0 L 34 0 L 17 26 Z',{x:X+TW-52,y:96+44,color:wh});
 const st=wrapFit(bold,L.start,TW-120,22,10,2),sh=st.lines.length*(st.size+3);st.lines.forEach((l,i)=>T(X+60+((TW-120)-bold.widthOfTextAtSize(WA(bold,l),st.size))/2,96+31+sh/2-st.size*.8-i*(st.size+3)-1,l,st.size,bold,wh));
 const ft=WA(font,L.foot);T((W-font.widthOfTextAtSize(ft,9))/2,62,ft,9,font,gr);
 return pg}
module.exports=(app,{auth,E,audit,school})=>{
 const office=auth(['principal','secretary']),sid=req=>req.user.school_id;
 const gate=(req,res,next)=>{const m=(school(req).modules||'reports,fees,tracking').split(',');m.includes('reports')||m.includes('fees')?next():E(res,403,'module')};
 const F=b=>({tt:+b.tt_id||0,cls:+b.class_id||0,from:SC.isDate(b.from)?b.from:'',to:SC.isDate(b.to)?b.to:'',title:String(b.title||'').slice(0,60),subject:String(b.subject||'').trim().toLowerCase().slice(0,60)});
 // everything the screen and the print need, computed the same way for both
 async function build(s,f){const have=new Set((await ST.list('exams/'+s+'/')).map(x=>x.key));
  const w=['e.school_id=?','e.expired_at IS NULL'],a=[s];
  if(f.tt){w.push('e.tt_id=?');a.push(f.tt)}if(f.cls){w.push('e.class_id=?');a.push(f.cls)}if(f.from){w.push('e.date>=?');a.push(f.from)}if(f.to){w.push('e.date<=?');a.push(f.to)}
  if(f.title){w.push('e.title=?');a.push(f.title)}if(f.subject){w.push('lower(sb.name)=?');a.push(f.subject)}
  const rows=db.prepare(`SELECT e.*,sb.name subject,c.name cls,u.id tid,u.name teacher,u.phone,u.email FROM exams e JOIN subjects sb ON sb.id=e.subject_id JOIN classes c ON c.id=e.class_id LEFT JOIN users u ON u.id=sb.teacher_id WHERE ${w.join(' AND ')} ORDER BY (e.date IS NULL),e.date,c.name,sb.name`).all(...a);
  const hist={};for(const r of db.prepare('SELECT i.exam_id,p.at,u.name by FROM exam_print_items i JOIN exam_prints p ON p.id=i.print_id LEFT JOIN users u ON u.id=p.by_id WHERE p.school_id=? ORDER BY p.at').all(s))(hist[r.exam_id]??=[]).push({at:r.at,by:r.by||''});
  const ok=r=>r.has_file&&have.has(EX.fp(s,r.id)),items=[],missing=[],seen=new Set(),contact=r=>r.tid?{id:r.tid,name:r.teacher,phone:r.phone||'',email:r.email||''}:null;
  for(const r of rows){let members=[r];if(r.grp){if(seen.has(r.grp))continue;seen.add(r.grp);members=rows.filter(x=>x.grp==r.grp)}
   // the file of a group may sit on any member, even one outside this scope
   let file=members.find(ok)||(r.grp?db.prepare('SELECT * FROM exams WHERE school_id=? AND grp=? AND has_file=1 ORDER BY id').all(s,r.grp).find(ok):null);
   const cls=members.map(m=>m.cls).join(' + '),ts=[...new Map(members.map(contact).filter(Boolean).map(c=>[c.id,c])).values()];
   if(!file){missing.push({key:members[0].id,exam_ids:members.map(m=>m.id),cls,subject:r.subject,title:r.title,date:r.date||'',teachers:ts,paper:true});continue}
   const ids=members.map(m=>m.id),pr=ids.flatMap(i=>hist[i]||[]).sort((x,y)=>y.at.localeCompare(x.at));
   items.push({key:file.id,file_id:file.id,exam_ids:ids,cls,group:members.length>1,subject:r.subject,title:r.title,date:r.date||'',pages:file.pages,copies:members.reduce((n,m)=>n+m.copies,0),printed:pr.slice(0,1),parts:members.map(m=>({cls:m.cls,copies:m.copies})),teachers:ts.map(x=>x.name)})}
  // a timetable scope also lists the papers nobody has created an exam for yet
  if(f.tt){const tt=db.prepare('SELECT * FROM exam_tt WHERE id=? AND school_id=?').get(f.tt,s);if(tt){const np=new Set(db.prepare('SELECT name FROM exam_nopaper WHERE school_id=?').all(s).map(r=>r.name)),have=new Set(rows.map(r=>r.subject_id+':'+r.class_id)),nm=SC.names(s),done=new Set();
   for(const p of XT.papersOf(tt)){if(p.date==null||np.has(XT.key(p.subject))||have.has(p.subject_id+':'+p.class_id))continue;if(f.cls&&p.class_id!=f.cls)continue;if(f.subject&&XT.key(p.subject)!=f.subject)continue;
    const k=p.tog||'p'+p.id;if(done.has(k))continue;done.add(k);const mem=XT.papersOf(tt).filter(q=>(p.tog?q.tog==p.tog:q.id==p.id)&&!have.has(q.subject_id+':'+q.class_id)),ts=[...new Set(mem.map(q=>q.teacher).filter(Boolean))].map(i=>{const u=db.prepare('SELECT id,name,phone,email FROM users WHERE id=?').get(i);return u&&{id:u.id,name:u.name,phone:u.phone||'',email:u.email||''}}).filter(Boolean);
    missing.push({key:'p'+p.id,exam_ids:[],cls:mem.map(q=>q.cls).join(' + '),subject:p.subject,title:tt.name,date:p.date,teachers:ts,paper:false})}}}
  return{items,missing}}
 const totals=items=>({exams:items.length,pages:items.reduce((n,i)=>n+i.pages,0),sheets:items.reduce((n,i)=>n+i.pages*i.copies,0)});
 app.get('/api/exams/print/options',office,gate,(req,res)=>{const s=sid(req);
  res.json({tts:db.prepare('SELECT id,name,start_date,end_date FROM exam_tt WHERE school_id=? ORDER BY start_date DESC,id DESC').all(s),classes:db.prepare('SELECT id,name FROM classes WHERE school_id=? ORDER BY name').all(s),
   titles:db.prepare('SELECT DISTINCT title FROM exams WHERE school_id=? ORDER BY title').all(s).map(r=>r.title),subjects:db.prepare('SELECT DISTINCT name FROM subjects WHERE school_id=? ORDER BY name').all(s).map(r=>r.name),max:MAXSHEETS})});
 app.get('/api/exams/print/preview',office,gate,async(req,res)=>{const{items,missing}=await build(sid(req),F(req.query));res.json({items,missing,total:totals(items)})});
 app.get('/api/exams/print/history',office,gate,(req,res)=>{const s=sid(req);
  const list=db.prepare('SELECT p.*,u.name by FROM exam_prints p LEFT JOIN users u ON u.id=p.by_id WHERE p.school_id=? ORDER BY p.at DESC,p.id DESC LIMIT 50').all(s);
  const it=db.prepare('SELECT i.copies,i.pages,sb.name subject,c.name cls,e.title FROM exam_print_items i LEFT JOIN exams e ON e.id=i.exam_id LEFT JOIN subjects sb ON sb.id=e.subject_id LEFT JOIN classes c ON c.id=e.class_id WHERE i.print_id=? ORDER BY c.name,sb.name');
  res.json(list.map(p=>({id:p.id,at:p.at,by:p.by||'',label:p.label||'',mode:p.mode,n:p.n_exams,sheets:p.sheets,skipped:p.skipped,items:it.all(p.id)})))});
 app.post('/api/exams/print',office,gate,async(req,res,next)=>{try{const s=sid(req),b=req.body||{},f=F(b),mode=b.mode=='once'?'once':'repeat';
  let{items,missing}=await build(s,f);const skip=new Set((Array.isArray(b.skip)?b.skip:[]).map(Number));items=items.filter(i=>!skip.has(i.key));
  for(const[k,v]of Object.entries(b.copies||{})){const n=Math.round(+v);if(!(n>=1&&n<=2000))return E(res,400,'exam_copies');const it=items.find(i=>i.key==+k);if(it)it.copies=n}
  if(!items.length)return E(res,400,'print_empty');
  if(missing.length&&!b.allow_missing)return res.status(409).json({error:'print_missing',missing});
  const dup=items.filter(i=>i.printed.length);if(dup.length&&!b.allow_dup)return res.status(409).json({error:'print_dup',dup:dup.map(i=>({key:i.key,cls:i.cls,subject:i.subject,at:i.printed[0].at,by:i.printed[0].by}))});
  const tot=totals(items);if(mode=='repeat'&&tot.sheets>MAXSHEETS)return res.status(413).json({error:'print_big',sheets:tot.sheets,max:MAXSHEETS});
  const out=await PDFDocument.create();
  if(mode=='once'){const font=await out.embedFont(StandardFonts.Helvetica),bold=await out.embedFont(StandardFonts.HelveticaBold);let pg=out.addPage([595,842]),y=790;const sc=school(req);
   pg.drawText(String(sc.name||'').toUpperCase().slice(0,60),{x:40,y,size:14,font:bold});y-=22;pg.drawText('EXAMS TO PRINT / EPREUVES A IMPRIMER',{x:40,y,size:11,font:bold});y-=16;pg.drawText(SC.clock(sc).date+'   '+tot.exams+' exams   '+tot.sheets+' sheets',{x:40,y,size:9,font});y-=26;
   const cols=[[ '#',40],['Class',70],['Subject',210],['Date',330],['Pages',405],['Copies',455],['Sheets',510]];const head=()=>{cols.forEach(c=>pg.drawText(c[0],{x:c[1],y,size:9,font:bold}));y-=14};head();
   items.forEach((i,n)=>{if(y<50){pg=out.addPage([595,842]);y=800;head()}const row=[String(n+1),i.cls.slice(0,22),i.subject.slice(0,26),i.date,String(i.pages),String(i.copies),String(i.pages*i.copies)];row.forEach((v,j)=>pg.drawText(v,{x:cols[j][1],y,size:9,font}));y-=13})}
  const sep=b.separators!==false,duplex=!!b.duplex,lang=b.lang=='fr'?'fr':'en',sfont=await out.embedFont(StandardFonts.Helvetica),sbold=await out.embedFont(StandardFonts.HelveticaBold);let n=0;
  // pages are embedded once and drawn once per copy: a valid file that stays small even with 60 copies
  for(const i of items){const src=await PDFDocument.load(await ST.get(EX.fp(s,i.file_id)),{updateMetadata:false}),sp=src.getPages(),emb=[];for(let k=0;k<sp.length;k++){const sz=sp[k].getSize();let e=null;if(sp[k].node.Contents())try{e=(await out.embedPdf(src,[k]))[0]}catch{}emb.push({e,width:sz.width,height:sz.height})}
   if(sep){sepPage(out,sfont,sbold,{item:i,n:++n,total:items.length,lang,school:school(req).name});if(duplex)out.addPage([595.28,841.89])}
   for(let c=0;c<(mode=='once'?1:i.copies);c++){emb.forEach((m,k)=>{const pg=out.addPage([m.width,m.height]);if(m.e)pg.drawPage(m.e);const r=sp[k].getRotation().angle;if(r)pg.setRotation(degrees(r))});if(duplex&&emb.length%2)out.addPage([emb[0].width,emb[0].height])}}
  const label=[f.tt&&(db.prepare('SELECT name FROM exam_tt WHERE id=?').get(f.tt)||{}).name,f.cls&&(db.prepare('SELECT name FROM classes WHERE id=?').get(f.cls)||{}).name,f.subject,f.title,f.from&&f.from+(f.to?' → '+f.to:''),!f.from&&f.to&&'→ '+f.to].filter(Boolean).join(' · ')||'*';
  const buf=Buffer.from(await out.save()),id=tx(()=>{const id=Number(db.prepare('INSERT INTO exam_prints(school_id,by_id,at,label,mode,n_exams,sheets,skipped) VALUES(?,?,?,?,?,?,?,?)').run(s,req.user.id,SC.clock(school(req)).at,label,mode,items.length,tot.sheets,missing.length).lastInsertRowid);
   for(const i of items)for(const e of i.exam_ids){const r=db.prepare('SELECT copies FROM exams WHERE id=?').get(e);db.prepare('INSERT INTO exam_print_items(print_id,exam_id,copies,pages) VALUES(?,?,?,?)').run(id,e,i.group?r.copies:i.copies,i.pages)}return id})();
  audit(req.user,'exam.print',`${label} ${items.length} exams ${tot.sheets} sheets`);
  res.set({'Content-Type':'application/pdf','Content-Disposition':'inline; filename="exams-print-'+id+'.pdf"','X-Print-Id':String(id),'X-Print-Sheets':String(tot.sheets),'X-Print-Sep':String(sep?items.length:0),'Cache-Control':'private, no-store'});res.end(buf)}catch(e){next(e)}});
};
module.exports.kit={WA,wrapFit};
