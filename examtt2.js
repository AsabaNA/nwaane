// Exam timetable, part 2: send dates to exam submission, printable PDFs, start a new timetable from a previous one.
const{db,tx}=require('./db'),SC=require('./sched'),X=require('./examtt'),{PDFDocument:PDF,pipe}=require('./core/pdfkit'),HEAD=require('./head');
const{key}=X;
const T={en:{t:'EXAM TIMETABLE',day:'By day',cls:'Class',tch:'Invigilator',time:'Time',subj:'Subject',len:'Length',inv:'Invigilators',date:'Date',other:'Other',none:'—',tot:'Total',h:'h',nopaper:'no paper',dty:'INVIGILATION DUTIES',together:'together',pg:'Page'},
 fr:{t:'EMPLOI DU TEMPS DES EXAMENS',day:'Par jour',cls:'Classe',tch:'Surveillant',time:'Heure',subj:'Matière',len:'Durée',inv:'Surveillants',date:'Date',other:'Autre',none:'—',tot:'Total',h:'h',nopaper:'sans épreuve',dty:'SURVEILLANCES',together:'ensemble',pg:'Page'}};
const DN={en:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],fr:['dim','lun','mar','mer','jeu','ven','sam']};
const fdate=(d,l)=>DN[l][new Date(d+'T00:00:00Z').getUTCDay()]+' '+d.split('-').reverse().join('/');
const flen=m=>m<60?m+' min':m%60?Math.floor(m/60)+'h'+String(m%60).padStart(2,'0'):Math.floor(m/60)+'h';
module.exports=(app,{auth,E,audit,school})=>{
 const adm=auth(['principal','secretary']),sid=req=>req.user.school_id;
 const one=(req,res)=>{const tt=X.rowTT(sid(req),req.params.id);if(!tt)E(res,404,'ett_404');return tt};
 const nopaper=s=>new Set(db.prepare('SELECT name FROM exam_nopaper WHERE school_id=?').all(s).map(r=>r.name));
 // ---- send to exam submission: every paper with a date gets (or updates) an exam row; its deadline follows from the school's lead days
 app.post('/api/examtt/:id/apply',adm,(req,res)=>{const tt=one(req,res);if(!tt)return;const s=sid(req),np=nopaper(s),dry=!!req.body?.dry,L=school(req).exam_lead??3;
  const out={set:0,created:0,same:0,nopaper:0,nodate:0,lead:L};const plan=[];const gk=p=>p.tog?'t'+tt.id+':'+p.tog:null;
  for(const p of X.papersOf(tt)){if(p.date==null){out.nodate++;continue}
   if(np.has(key(p.subject))){out.nopaper++;continue}
   if(!db.prepare('SELECT 1 FROM subjects WHERE id=? AND school_id=?').get(p.subject_id,s))continue;
   const rows=db.prepare('SELECT * FROM exams WHERE school_id=? AND subject_id=? AND class_id=? ORDER BY id').all(s,p.subject_id,p.class_id);
   const c=rows.find(r=>r.tt_id==tt.id)||rows.find(r=>!r.tt_id&&!r.expired_at&&(r.date==null||(r.date>=tt.start_date&&r.date<=tt.end_date)));
   if(c){if(c.date==p.date&&c.date_locked&&c.tt_id==tt.id&&(c.grp||null)==gk(p))out.same++;else{out.set++;plan.push(['u',c.id,p.date,gk(p)])}}
   else{out.created++;plan.push(['c',p])}}
  if(!dry){tx(()=>{for(const a of plan){
    if(a[0]=='u')db.prepare('UPDATE exams SET date=?,date_locked=1,tt_id=?,grp=? WHERE id=?').run(a[2],tt.id,a[3],a[1]);
    else{const p=a[1],n=Math.max(1,db.prepare('SELECT COUNT(*) n FROM students WHERE class_id=? AND active=1').get(p.class_id).n);
     db.prepare('INSERT INTO exams(school_id,subject_id,class_id,title,date,date_locked,copies,tt_id,created_by,created,grp) VALUES(?,?,?,?,?,1,?,?,?,?,?)').run(s,p.subject_id,p.class_id,tt.name.slice(0,60),p.date,n,tt.id,req.user.id,new Date().toISOString(),gk(p))}}})();
   audit(req.user,'examtt.apply',`${tt.name} set ${out.set} new ${out.created}`)}
  res.json({ok:1,...out})});
 // ---- PDF: view=day (every day), class (one page per class), teacher (one page per invigilator). ?id= picks one class or teacher.
 app.get('/api/examtt/:id/pdf',adm,(req,res,next)=>{try{const tt=one(req,res);if(!tt)return;const s=sid(req),sc=school(req),l=req.query.lang=='fr'?'fr':'en',L=T[l],view=['day','class','teacher','section'].includes(req.query.view)?req.query.view:'day';
  const V=X.view(s,tt),np=nopaper(s),papers=V.papers.filter(p=>p.date!=null&&p.start!=null).sort((a,b)=>a.date.localeCompare(b.date)||a.start-b.start||a.cls.localeCompare(b.cls));
  const hh=SC.hh,rng=p=>hh(p.start)+'–'+hh(p.start+p.dur),iv=p=>p.inv.length?p.inv.map(x=>x.teacher_id==null?L.other:x.name).join(', '):L.none;
  res.setHeader('Content-Type','application/pdf');res.setHeader('Content-Disposition',`inline; filename="exam-timetable-${view}.pdf"`);
  const doc=new PDF({size:'A4',layout:'landscape',margin:30,autoFirstPage:false});pipe(doc,res);const W=782,H=535;
  const head=title=>{doc.addPage();const h=HEAD(sc);doc.fillColor('#000').font('Helvetica-Bold').fontSize(13).text(h[0],30,26,{align:'center',width:W});doc.font('Helvetica').fontSize(9);h.slice(1,3).forEach(x=>doc.text(x,{align:'center',width:W}));
   doc.font('Helvetica-Bold').fontSize(14).text(title,30,doc.y+6,{align:'center',width:W});doc.font('Helvetica').fontSize(9).fillColor('#444').text(`${tt.name}  ·  ${fdate(tt.start_date,l)} → ${fdate(tt.end_date,l)}${sc.year?'  ·  '+sc.year:''}`,{align:'center',width:W});doc.fillColor('#000');return doc.y+10};
  // a table: cols=[[label,width],...]; rows=[[cell,...]]; sub = a bold row label above groups
  const table=(title,cols,rows,y0)=>{let y=y0??head(title);const th=()=>{doc.rect(30,y,W,20).fill('#1F3A5F');let x=34;doc.fillColor('#fff').font('Helvetica-Bold').fontSize(9);cols.forEach(c=>{doc.text(c[0],x,y+6,{width:c[1]-6,lineBreak:false});x+=c[1]});y+=20;doc.fillColor('#000')};th();
   for(const r of rows){if(r.band){if(y>H-60){y=head(title);th()}doc.rect(30,y,W,18).fill('#e6ebf2');doc.fillColor('#000').font('Helvetica-Bold').fontSize(10).text(r.band,34,y+5);y+=18;continue}
    doc.font('Helvetica').fontSize(9);const hgt=Math.max(...r.map((c,i)=>doc.heightOfString(String(c),{width:cols[i][1]-8})))+8;
    if(y+hgt>H){y=head(title);th()}let x=34;r.forEach((c,i)=>{doc.fillColor('#000').text(String(c),x,y+4,{width:cols[i][1]-8});x+=cols[i][1]});y+=hgt;doc.moveTo(30,y).lineTo(30+W,y).lineWidth(.4).strokeColor('#aaa').stroke()}return y};
  const dayRows=list=>{const rows=[],seen=new Set();let cur=null;
   for(const p of list){if(p.date!=cur){cur=p.date;rows.push({band:fdate(cur,l)})}
    if(p.tog){const k=p.tog+p.date+p.start;if(seen.has(k))continue;seen.add(k)}
    const grp=p.tog?list.filter(q=>q.tog==p.tog&&q.date==p.date&&q.start==p.start):[p];
    rows.push([rng(p),grp.map(q=>q.cls).join(' + ')+(grp.length>1?` (${L.together})`:''),p.subject+(np.has(key(p.subject))?` (${L.nopaper})`:''),flen(p.dur),grp.length>1?grp.map(q=>q.cls+': '+iv(q)).join('  |  '):iv(p)])}return rows};
  const DCOLS=[[L.time,95],[L.cls,190],[L.subj,150],[L.len,60],[L.inv,287]];
  if(view=='section'){const secs=db.prepare('SELECT id,name FROM sections WHERE school_id=? ORDER BY pos,id').all(s).filter(x=>!req.query.id||x.id==+req.query.id),cs=Object.fromEntries(db.prepare('SELECT id,section_id FROM classes WHERE school_id=?').all(s).map(c=>[c.id,c.section_id]));let any=false;
   for(const sec of secs){const mine=papers.filter(p=>cs[p.class_id]==sec.id);if(!mine.length)continue;any=true;table(`${L.t} — ${sec.name}`,DCOLS,dayRows(mine))}
   if(!any)head(L.t)}
  else if(view=='day'){const rows=dayRows(papers);
   table(L.t,DCOLS,rows)}
  // class and invigilator views: the same grid as the regular timetable (days across, times down), one colour (and shape) per subject
  else{const PAL=require('./ttpal'),names=[...new Set(V.papers.map(p=>p.subject))].sort((x,y)=>x.localeCompare(y)),col=n=>PAL.slot(Math.max(0,names.indexOf(n)));
   const hd2=(title)=>head(title);
   const grid=(title,list,mode,foot)=>{if(!list.length){hd2(title);return}
    const alld=[...new Set(list.map(p=>p.date))].sort(),starts=[...new Set(list.map(p=>p.start))].sort((a,b)=>a-b),PER=7;
    for(let k=0;k<alld.length;k+=PER){const days=alld.slice(k,k+PER),y0=hd2(title+(alld.length>PER?`  (${Math.floor(k/PER)+1}/${Math.ceil(alld.length/PER)})`:'')),cw=(W-90)/days.length,rh=Math.min(58,(H-y0-22-(foot?18:0))/starts.length);let y=y0;
     doc.rect(30,y,W,22).fill('#1F3A5F');doc.fillColor('#fff').font('Helvetica-Bold').fontSize(10).text(L.time,34,y+6,{width:82});days.forEach((d,i)=>doc.text(fdate(d,l),120+i*cw+4,y+6,{width:cw-8,lineBreak:false}));y+=22;
     for(const st of starts){const row=list.filter(p=>p.start==st),end=Math.max(...row.map(p=>p.start+p.dur));
      doc.rect(30,y,W,rh).lineWidth(.5).strokeColor('#999').stroke();doc.fillColor('#000').font('Helvetica-Bold').fontSize(9).text(hh(st),34,y+4).font('Helvetica').fontSize(8).text(hh(st)+'–'+hh(end),34,y+16);
      days.forEach((d,i)=>{const x=120+i*cw;doc.moveTo(x,y).lineTo(x,y+rh).stroke();const ps=row.filter(p=>p.date==d);if(!ps.length)return;const p=ps[0],c=col(p.subject),fw=cw-(c.shape?24:8);
       doc.rect(x+1.5,y+1.5,cw-3,rh-3).fill(c.bg);if(c.shape)PAL.drawShape(doc,c.shape,x+cw-17,y+4,12,c.fg);
       const grp=p.tog?ps.concat(V.papers.filter(q=>q.tog==p.tog&&q.date==d&&q.start==st&&q.id!=p.id&&!ps.includes(q))):ps;
       doc.fillColor(c.fg).font('Helvetica-Bold').fontSize(9).text(p.subject+(np.has(key(p.subject))?'*':''),x+4,y+5,{width:fw,height:12,lineBreak:false,ellipsis:true});
       doc.font('Helvetica').fontSize(8).text(mode=='c'?iv(p):(mode=='t'?[...new Set(ps.map(q=>q.cls))].join(' + '):''),x+4,y+19,{width:cw-8,height:12,lineBreak:false,ellipsis:true}).text(flen(p.dur),x+4,y+31,{width:cw-8,height:12,lineBreak:false})});y+=rh}
     if(foot&&k+PER>=alld.length){doc.fillColor('#000').font('Helvetica-Bold').fontSize(9).text(foot,34,y+6)}}};
   if(view=='class'){const ids=[...new Set(V.papers.map(p=>p.class_id))].filter(i=>!req.query.id||i==+req.query.id);const nm=Object.fromEntries(V.papers.map(p=>[p.class_id,p.cls]));
    for(const c of ids.sort((a,b)=>nm[a].localeCompare(nm[b],undefined,{numeric:true})))grid(`${L.t} — ${nm[c]}`,papers.filter(p=>p.class_id==c),'c')}
   else{let any=false;for(const t of V.teachers.filter(t=>!req.query.id||t.id==+req.query.id).sort((a,b)=>a.name.localeCompare(b.name))){const mine=papers.filter(p=>p.inv.some(x=>x.teacher_id==t.id));if(!mine.length)continue;any=true;
     grid(`${L.dty} — ${t.name}`,mine,'t',`${L.tot}: ${flen(mine.reduce((n,p)=>n+p.dur,0))}`)}
    if(!any)head(L.dty)}}
  doc.end()}catch(e){next(e)}});
 // ---- start from a previous timetable: same papers, same times and invigilators, moved onto the new dates (day 1 → day 1, ...)
 app.post('/api/examtt/:id/copy',adm,(req,res)=>{const old=one(req,res);if(!old)return;const b=req.body||{},s=sid(req),sc=school(req);
  const name=String(b.name||'').trim().slice(0,60);if(!name)return E(res,400,'ett_name');
  if(!SC.isDate(b.start_date)||!SC.isDate(b.end_date)||b.end_date<b.start_date||Date.parse(b.end_date)-Date.parse(b.start_date)>62*864e5)return E(res,400,'ett_dates');
  let seq=null;if(b.seq){if(!require('./report').seqs(sc).some(x=>x.id==b.seq))return E(res,400,'invalid');seq=String(b.seq)}
  const cx=X.context(s,old),oldDays=X.examDays(cx,old.start_date,old.end_date),newDays=X.examDays(cx,b.start_date,b.end_date);if(!newDays.length)return E(res,400,'ett_nodays');
  const map=Object.fromEntries(oldDays.map((d,i)=>[d,newDays[i]??null]));
  const inv=X.invOf(old.id),live=new Set(db.prepare("SELECT id FROM users WHERE school_id=? AND role='teacher' AND active=1").all(s).map(r=>r.id));let unplaced=0;
  const id=tx(()=>{const id=Number(db.prepare('INSERT INTO exam_tt(school_id,name,seq,start_date,end_date,day_start,day_end,max_min,align,inv_mode,pool_all,per_room,lessons,classes,cfg,created,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(s,name,seq,b.start_date,b.end_date,old.day_start,old.day_end,old.max_min,old.align,old.inv_mode,old.pool_all,old.per_room,old.lessons,old.classes,old.cfg,new Date().toISOString(),req.user.id).lastInsertRowid);
   for(const p of X.papersOf(old)){if(!db.prepare('SELECT 1 FROM subjects WHERE id=?').get(p.subject_id))continue;const d=p.date==null?null:(map[p.date]??null);if(d==null)unplaced++;
    const pid=Number(db.prepare('INSERT INTO exam_paper(tt_id,class_id,subject_id,subject,date,start,dur,tog) VALUES(?,?,?,?,?,?,?,?)').run(id,p.class_id,p.subject_id,p.subject,d,d==null?null:p.start,p.dur,p.tog).lastInsertRowid);
    if(d!=null)(inv[p.id]||[]).filter(x=>x.teacher_id==null||live.has(x.teacher_id)).forEach(x=>db.prepare('INSERT INTO exam_inv(paper_id,slot,teacher_id) VALUES(?,?,?)').run(pid,x.slot,x.teacher_id))}
   return id})();
  audit(req.user,'examtt.copy',`${old.name} -> ${name}`);res.json({ok:1,id,unplaced})});
};
