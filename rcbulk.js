// Report cards, section by section: overview of every class, "publish all ready", bulk PDF with separator sheets,
// and the per-section settings (report-card language, term calendar). Office only (principal, secretary); settings are principal only.
const{db,tx}=require('./db'),R=require('./report'),B=require('./billing'),SC=require('./sched'),SECT=require('./sections'),F=require('./fees'),P=require('./pdf');
const{PDFDocument,StandardFonts,rgb}=require('pdf-lib');
for(const c of['card_lang TEXT','term_dates TEXT'])try{db.exec('ALTER TABLE sections ADD COLUMN '+c)}catch{}
const LANGS=['en','fr','both'],okT=t=>[1,2,3].includes(t);
const secRow=(sid,id)=>db.prepare('SELECT * FROM sections WHERE id=? AND school_id=?').get(id,sid);
// report-card language of a section: its own choice, else the school's
const langOfSection=(sc,sec)=>LANGS.includes(sec&&sec.card_lang)?sec.card_lang:(LANGS.includes(sc.card_lang)?sc.card_lang:'both');
function langOf(sc,cid){SECT.ensure(sc.id);const r=db.prepare('SELECT s.* FROM classes c JOIN sections s ON s.id=c.section_id WHERE c.id=?').get(cid);return langOfSection(sc,r)}
// term calendar of a section: its own dates, else the school's
const calOf=(sc,sec)=>({term_dates:(sec&&sec.term_dates)||sc.term_dates||null});
const termsFor=(sc,sec,y)=>B.termsOf(calOf(sc,sec),y);
const termNow=(sc,sec)=>B.termAt(calOf(sc,sec),SC.clock(sc).date);
const SEPT={en:{rc:'REPORT CARDS',of:'of',cls:'CLASS',term:'Term',cards:'REPORT CARDS',sheets:'PAGES',head:'Class teacher',held:'Held back (fees)',more:'more',none:'—',start:'THE REPORT CARDS START ON THE NEXT SHEET',foot:'SORTING SHEET  ·  REMOVE BEFORE GIVING OUT',list:'STUDENTS'},
 fr:{rc:'BULLETINS',of:'sur',cls:'CLASSE',term:'Trimestre',cards:'BULLETINS',sheets:'PAGES',head:'Titulaire',held:'Retenus (frais)',more:'de plus',none:'—',start:'LES BULLETINS COMMENCENT À LA FEUILLE SUIVANTE',foot:'FEUILLE DE TRI  ·  À RETIRER AVANT DISTRIBUTION',list:'ÉLÈVES'}};
const{WA,wrapFit}=require('./examprint').kit;
function sepPage(out,font,bold,o){const W=595.28,H=841.89,L=SEPT[o.lang=='fr'?'fr':'en'],pg=out.addPage([W,H]),blk=rgb(0,0,0),wh=rgb(1,1,1),gr=rgb(.32,.32,.32),BH=200,X=58,TW=W-2*X;
 const T=(x,y,tx,sz,f,c)=>pg.drawText(WA(f,tx),{x,y,size:sz,font:f,color:c||blk});
 pg.drawRectangle({x:0,y:H-BH,width:W,height:BH,color:blk});pg.drawRectangle({x:0,y:0,width:28,height:H-BH,color:blk});pg.drawRectangle({x:W-28,y:0,width:28,height:H-BH,color:blk});
 T(X,H-52,L.rc,24,bold,wh);const nt=String(o.n),nw=bold.widthOfTextAtSize(nt,132);T(X,H-176,nt,132,bold,wh);T(X+nw+16,H-176,L.of+' '+o.total,38,bold,wh);
 const sn=WA(bold,String(o.school||'').toUpperCase().slice(0,44));T(W-X-bold.widthOfTextAtSize(sn,11),H-52,sn,11,bold,wh);
 let y=H-BH-62;
 if(o.section){const s=wrapFit(bold,o.section.toUpperCase(),TW,26,14,1);T(X,y+16,s.lines[0],s.size,bold,gr);y-=14}
 const c=wrapFit(bold,o.cls,TW,72,32,2);for(const l of c.lines){T(X,y,l,c.size,bold);y-=c.size*1.08}y-=4;
 T(X,y,L.term+' '+o.term+'  ·  '+o.year,24,font,gr);y-=36;
 const bh=96,by=y-bh+10,cw=TW/2;pg.drawRectangle({x:X,y:by,width:TW,height:bh,borderColor:blk,borderWidth:3});
 [[L.cards,String(o.cards)],[L.sheets,String(o.pages)]].forEach(([k,v],i)=>{const cx=X+i*cw;if(i)pg.drawLine({start:{x:cx,y:by},end:{x:cx,y:by+bh},thickness:2,color:blk});T(cx+16,by+bh-26,k,10,bold,gr);T(cx+16,by+20,v,48,bold)});
 y=by-26;
 T(X,y,L.head+':  '+(o.head||L.none),13,font,gr);y-=20;
 if(o.held)T(X,y,L.held+':  '+o.held,13,font,gr),y-=20;
 // student names, two columns, as many as fit above the banner
 const names=o.names||[],cap=Math.max(0,Math.floor((y-190)/13))*2,shown=names.slice(0,cap),col=Math.ceil(shown.length/2)||1;
 if(shown.length){T(X,y-4,L.list,9,bold,gr);y-=20;shown.forEach((n,i)=>{const cx=X+(i<col?0:TW/2),cy=y-(i%col)*13;T(cx,cy,n.slice(0,30),10,font)});if(names.length>shown.length)T(X,96+62+12,'+ '+(names.length-shown.length)+' '+L.more,10,bold,gr)}
 pg.drawRectangle({x:X,y:96,width:TW,height:62,color:blk});pg.drawSvgPath('M 0 0 L 34 0 L 17 26 Z',{x:X+18,y:96+44,color:wh});pg.drawSvgPath('M 0 0 L 34 0 L 17 26 Z',{x:X+TW-52,y:96+44,color:wh});
 const st=wrapFit(bold,L.start,TW-120,20,10,2),sh=st.lines.length*(st.size+3);st.lines.forEach((l,i)=>T(X+60+((TW-120)-bold.widthOfTextAtSize(WA(bold,l),st.size))/2,96+31+sh/2-st.size*.8-i*(st.size+3)-1,l,st.size,bold,wh));
 const ft=WA(font,L.foot);T((W-font.widthOfTextAtSize(ft,9))/2,62,ft,9,font,gr);return pg}
module.exports=(app,{auth,E,audit,school})=>{
 const OFF=auth(['principal','secretary']),ADM=auth(['principal']),sid=req=>req.user.school_id;
 const gate=(req,res,next)=>{const m=(school(req).modules||'reports,fees,tracking').split(',');m.includes('reports')?next():E(res,403,'module')};
 const secs=s=>{SECT.ensure(s);return db.prepare('SELECT * FROM sections WHERE school_id=? ORDER BY pos,id').all(s)};
 const classesOf=(s,secId)=>db.prepare('SELECT c.id,c.name,c.section_id,c.head_id,u.name head FROM classes c LEFT JOIN users u ON u.id=c.head_id WHERE c.school_id=? AND c.section_id=? ORDER BY c.name').all(s,secId);
 // one class: everything the overview needs
 function classRow(s,c,term){const k=R.counts(s,c.id,term),pub=R.isLocked(c.id,term),pend=pub?[]:R.pending(s,c.id,term),
  missing=pend.reduce((a,g)=>a+g.items.reduce((b,i)=>b+i.seqs.length,0),0),
  held=pub?F.blocked(s,c.id,term).size:0,cards=pub?db.prepare('SELECT COUNT(*) n FROM cards WHERE school_id=? AND class_id=? AND term=?').get(s,c.id,term).n:0;
  const status=pub?'published':!k.size?'nomarks':pend.length?'missing':'ready';
  return{id:c.id,name:c.name,head:c.head||'',students:k.students,with_marks:k.size,status,missing,teachers:pend.map(g=>g.teacher||'').filter((v,i,a)=>a.indexOf(v)==i),held,cards}}
 app.get('/api/rc/overview',OFF,gate,(req,res)=>{const s=sid(req),sc=school(req),today=SC.clock(sc).date,sl=secs(s),multi=sl.length>1;
  const want=+req.query.term,def=B.termAt(sc,today),term=okT(want)?want:def.term,y=B.schoolYear(today);
  res.json({multi,term,year:y,today,sections:sl.map(sec=>{const now=termNow(sc,sec);return{id:sec.id,name:sec.name,lang:langOfSection(sc,sec),own_lang:sec.card_lang||null,own_cal:!!sec.term_dates,
   term_now:{term:now.term,start:now.start,end:now.end,current:now.current},classes:classesOf(s,sec.id).map(c=>classRow(s,c,term))}})})});
 // publish every class that is ready (all marks in, not yet published) - optionally one section or a list of classes
 app.post('/api/rc/publish',OFF,gate,(req,res)=>{const s=sid(req),b=req.body||{},term=+b.term;if(!okT(term))return E(res,400,'invalid');
  let cl=[];const sl=secs(s);
  if(Array.isArray(b.class_ids)&&b.class_ids.length)cl=db.prepare(`SELECT id,name FROM classes WHERE school_id=? AND id IN(${b.class_ids.map(Number).filter(Number.isFinite).join(',')||0})`).all(s);
  else if(b.section_id){const x=sl.find(z=>z.id==+b.section_id);if(!x)return E(res,404,'sec_404');cl=classesOf(s,x.id)}
  else for(const x of sl)cl.push(...classesOf(s,x.id));
  const done=[],skipped=[];
  for(const c of cl){if(R.isLocked(c.id,term))continue;const k=R.compute(s,c.id,term);if(!k.size||R.pending(s,c.id,term).length){skipped.push(c.name);continue}
   if(R.publish(s,c.id,term)=='ok')done.push(c.name);else skipped.push(c.name)}
  if(done.length)audit(req.user,'report.publish_bulk',done.length+' classes T'+term);
  res.json({ok:1,published:done,skipped})});
 // ---- bulk PDF
 app.post('/api/rc/print',OFF,gate,async(req,res,next)=>{try{const s=sid(req),sc=school(req),b=req.body||{},term=+b.term;if(!okT(term))return E(res,400,'invalid');
  const sep=b.separators!==false,duplex=!!b.duplex,ui=b.lang=='fr'?'fr':'en',ids=new Set((Array.isArray(b.class_ids)?b.class_ids:[]).map(Number));if(!ids.size)return E(res,400,'rc_none');
  const sl=secs(s),order=[];for(const x of sl)for(const c of classesOf(s,x.id))if(ids.has(c.id))order.push({...c,sec:x});
  const todo=[],unpub=[];for(const c of order)(R.isLocked(c.id,term)?todo:unpub).push(c);
  if(!todo.length)return E(res,409,'rc_none');
  if(todo.length>60)return E(res,400,'rc_many');
  const base=req.protocol+'://'+req.get('host')+'/verify.html?code=',out=await PDFDocument.create(),font=await out.embedFont(StandardFonts.Helvetica),bold=await out.embedFont(StandardFonts.HelveticaBold),
   year=B.schoolYear(SC.clock(sc).date),label=year+'/'+(year+1);let n=0,total=0,pages=0,heldAll=0;const rows=[];
  for(const c of todo){const hold=F.blocked(s,c.id,term),r=await P.renderBuf({skip:hold,base,sid:s,cid:c.id,term,lang:langOfSection(sc,c.sec)});heldAll+=hold.size;if(!r){unpub.push(c);continue}
   rows.push({c,r,hold})}
  if(!rows.length)return E(res,409,'rc_none');
  for(const{c,r,hold}of rows){const src=await PDFDocument.load(r.buf),np=src.getPageCount();
   if(sep){const held=hold.size?db.prepare(`SELECT name FROM students WHERE id IN(${[...hold].join(',')}) ORDER BY name`).all().map(x=>x.name):[];
    sepPage(out,font,bold,{n:++n,total:rows.length,school:sc.name,section:sl.length>1?c.sec.name:'',cls:c.name,term,year:label,cards:r.list.length,pages:np,head:c.head,held:held.length?held.length+(held.length<=3?' ('+held.join(', ')+')':''):0,names:r.list.map(x=>x.name),lang:ui});pages++;if(duplex){out.addPage([595.28,841.89]);pages++}}
   (await out.copyPages(src,src.getPageIndices())).forEach(p=>out.addPage(p));pages+=np;total+=r.list.length;if(duplex&&np%2){out.addPage([595.28,841.89]);pages++}}
  const buf=Buffer.from(await out.save());audit(req.user,'report.print_bulk',`${rows.length} classes, ${total} cards T${term}`);
  res.set({'Content-Type':'application/pdf','Content-Disposition':`inline; filename="report-cards-T${term}.pdf"`,'X-RC-Cards':String(total),'X-RC-Classes':String(rows.length),'X-RC-Skipped':String(unpub.length),'X-RC-Held':String(heldAll),'X-RC-Sep':String(sep?rows.length:0),'Cache-Control':'private, no-store'});res.end(buf)}catch(e){next(e)}});
 // ---- per-section settings: report-card language and term calendar
 app.get('/api/rc/config',ADM,(req,res)=>{const s=sid(req),sc=school(req),y=B.schoolYear(SC.clock(sc).date),sl=secs(s);
  res.json({multi:sl.length>1,year:y,school_lang:LANGS.includes(sc.card_lang)?sc.card_lang:'both',school_terms:B.termsOf(sc,y).map(r=>[r.start,r.end]),
   sections:sl.map(x=>({id:x.id,name:x.name,card_lang:x.card_lang||null,own_cal:!!x.term_dates,terms:termsFor(sc,x,y).map(r=>[r.start,r.end])}))})});
 app.post('/api/rc/config/:id',ADM,(req,res)=>{const s=sid(req),sc=school(req),x=secRow(s,+req.params.id);if(!x)return E(res,404,'sec_404');const b=req.body||{};
  let lang=x.card_lang;if('card_lang'in b){if(b.card_lang!==null&&!LANGS.includes(b.card_lang))return E(res,400,'invalid');lang=b.card_lang}
  let td=x.term_dates;
  if('terms'in b){if(b.terms===null)td=null;else{const t=b.terms;if(!(Array.isArray(t)&&t.length==3&&t.every((r,i)=>Array.isArray(r)&&SC.isDate(r[0])&&SC.isDate(r[1])&&r[0]<r[1]&&(!i||t[i-1][1]<r[0]))))return E(res,400,'terms');
    let o={};try{o=x.term_dates?JSON.parse(x.term_dates):{}}catch{}o[B.schoolYear(SC.clock(sc).date)]=t;td=JSON.stringify(o)}}
  db.prepare('UPDATE sections SET card_lang=?,term_dates=? WHERE id=?').run(lang,td,x.id);audit(req.user,'section.config',x.name);res.json({ok:1})});
};
Object.assign(module.exports,{langOf,langOfSection,termsFor,termNow});
