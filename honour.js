// Honour roll: settings, on-screen list, printable sheets (PDF). Only published terms are listed: the numbers are final then.
const{db}=require('./db'),R=require('./report'),SC=require('./sched'),HEAD=require('./head'),{PDFDocument,pipe}=require('./core/pdfkit');
const L={en:{t:'HONOUR ROLL',term:'Term',annual:'annual average',rank:'Rank',name:'Name',mat:'Matricule',avg:'Average',lvl:'Honour',cls:'Class',none:'No student qualifies for this selection.',unp:'Not published yet: ',of:'of',page:'Page',all:'Whole school'},
 fr:{t:'TABLEAU D’HONNEUR',term:'Trimestre',annual:'moyenne annuelle',rank:'Rang',name:'Nom',mat:'Matricule',avg:'Moyenne',lvl:'Distinction',cls:'Classe',none:'Aucun élève ne remplit les conditions pour cette sélection.',unp:'Pas encore publié : ',of:'sur',page:'Page',all:'Toute l’école'}};
const F2=v=>v==null?'—':v.toFixed(2);
module.exports=(app,{auth,E,audit,school})=>{
 const adm=auth(['principal','secretary']),sid=req=>req.user.school_id;
 // settings (principal)
 app.post('/api/settings/honour',auth(['principal']),(req,res)=>{const b=req.body||{},on=!!b.on;let tiers=[];
  if(Array.isArray(b.tiers))for(const x of b.tiers.slice(0,3)){const m=+x.min,n=String(x.name||'').trim().slice(0,30);if(!Number.isFinite(m)||m<0||m>20)return E(res,400,'hr_min');tiers.push({min:Math.round(m*100)/100,name:n})}
  if(new Set(tiers.map(x=>x.min)).size!=tiers.length)return E(res,400,'hr_dup');
  if(tiers.length>1&&tiers.some(x=>!x.name))return E(res,400,'hr_name');
  if(on&&!tiers.length)return E(res,400,'hr_min');
  const top=Math.round(+b.top||0),nf=+b.nofail||0;if(top<0||top>500||nf<0||nf>20)return E(res,400,'invalid');
  db.prepare('UPDATE schools SET hr_on=?,hr_tiers=?,hr_top=?,hr_nofail=? WHERE id=?').run(on?1:0,JSON.stringify(tiers),top,nf,sid(req));audit(req.user,'school.honour',on?'on':'off');res.json({ok:1})});
 // the list: classes -> students who qualify (published terms only)
 function build(req){const sc=school(req),t=[1,2,3].includes(+req.query.term)?+req.query.term:0;if(!t)return null;
  const one=+req.query.class_id||0,cl=db.prepare('SELECT id,name FROM classes WHERE school_id=? '+(one?'AND id=? ':'')+'ORDER BY name').all(...(one?[sid(req),one]:[sid(req)]));if(one&&!cl.length)return null;
  const lang=['en','fr','both'].includes(req.query.lang)?req.query.lang:'both',out=[],unp=[];
  for(const k of cl){if(!R.isLocked(k.id,t)){unp.push(k.name);continue}
   const c=R.compute(sid(req),k.id,t),rows=[];
   for(const s of c.students){const h=R.honour(sc,s,lang);if(h)rows.push({id:s.id,name:s.name,matricule:s.matricule,avg:s.head,rank:s.rank,size:c.size,level:h.level,lname:h.name})}
   rows.sort((a,b)=>b.avg-a.avg||a.name.localeCompare(b.name));out.push({id:k.id,name:k.name,rows,size:c.size})}
  return{sc,term:t,annual:t==3,classes:out,unpublished:unp,tiers:R.hrTiers(sc).length}}
 app.get('/api/honour',adm,(req,res)=>{const d=build(req);if(!d)return E(res,400,'invalid');res.json({on:!!d.sc.hr_on,term:d.term,annual:d.annual,classes:d.classes,unpublished:d.unpublished,total:d.classes.reduce((a,c)=>a+c.rows.length,0)})});
 app.get('/api/honour/pdf',adm,(req,res,next)=>{try{const d=build(req);if(!d)return E(res,400,'invalid');if(!d.sc.hr_on)return E(res,400,'hr_off');
  const lg=req.query.lang=='fr'?'fr':'en',l=L[lg],by=req.query.by=='class'||+req.query.class_id?'class':'school',doc=new PDFDocument({size:'A4',margin:40,autoFirstPage:false});
  res.set({'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="honour-roll-T${d.term}.pdf"`});pipe(doc,res);
  const W=515,sc=d.sc,head=()=>{const h=HEAD(sc);doc.fillColor('#000').font('Helvetica-Bold').fontSize(13).text(h[0],40,30,{align:'center',width:W});doc.font('Helvetica').fontSize(9);h.slice(1,3).forEach(x=>doc.text(x,{align:'center',width:W}))};
  const title=(sub)=>{doc.font('Helvetica-Bold').fontSize(16).fillColor('#000').text(l.t,40,doc.y+14,{width:W,align:'center'});doc.font('Helvetica').fontSize(10).fillColor('#444').text(`${l.term} ${d.term}${d.annual?' · '+l.annual:''}${sc.year?' · '+sc.year:''}${sub?' · '+sub:''}`,{width:W,align:'center'});doc.fillColor('#000')};
  const cols=by=='class'?[40,230,100,70,75]:[34,190,70,60,78,83],hd=by=='class'?[l.rank,l.name,l.mat,l.avg,l.lvl]:[l.rank,l.name,l.mat,l.cls,l.avg,l.lvl];
  const table=(rows,pg)=>{let y=doc.y+14;const X=[40];cols.forEach((w,i)=>X.push(X[i]+w));
   const hdr=()=>{doc.rect(40,y,W,20).fill('#1F3A5F');doc.fillColor('#fff').font('Helvetica-Bold').fontSize(9);hd.forEach((t,i)=>doc.text(t,X[i]+4,y+6,{width:cols[i]-8,lineBreak:false}));y+=20;doc.fillColor('#000')};hdr();
   if(!rows.length){doc.font('Helvetica-Oblique').fontSize(10).text(l.none,44,y+8,{width:W-8});return}
   rows.forEach((r,i)=>{if(y>770){doc.addPage();head();y=doc.y+10;hdr()}
    if(i%2)doc.rect(40,y,W,19).fill('#f1f3f8');doc.fillColor('#000').font('Helvetica').fontSize(9.5);
    const v=by=='class'?[String(i+1),r.name,r.matricule||'',F2(r.avg),r.lname]:[String(i+1),r.name,r.matricule||'',r.cls,F2(r.avg),r.lname];
    v.forEach((x,j)=>{if(j==1||(by=='class'?j==4:j==5))doc.font('Helvetica-Bold');else doc.font('Helvetica');doc.text(x,X[j]+4,y+5,{width:cols[j]-8,lineBreak:false,ellipsis:true})});y+=19;doc.moveTo(40,y).lineTo(40+W,y).lineWidth(.3).strokeColor('#ccc').stroke()});
   doc.y=y};
  if(by=='class'){for(const c of d.classes){doc.addPage();head();title(c.name);table(c.rows)}}
  else{doc.addPage();head();title(l.all);const all=d.classes.flatMap(c=>c.rows.map(r=>({...r,cls:c.name}))).sort((a,b)=>b.avg-a.avg||a.name.localeCompare(b.name));table(all)}
  if(!d.classes.length){doc.addPage();head();title('');doc.font('Helvetica-Oblique').fontSize(10).text(l.none,40,doc.y+20)}
  if(d.unpublished.length){doc.font('Helvetica-Oblique').fontSize(8).fillColor('#666').text(l.unp+d.unpublished.join(', '),40,Math.min(doc.y+10,800),{width:W})}
  doc.end()}catch(e){next(e)}});
};
