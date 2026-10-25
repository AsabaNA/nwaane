// Phase 4 PDFs: timetables (class / teacher), class QR sheets, monthly pay sheet.
const {PDFDocument,pipe}=require('./core/pdfkit'),QR=require('./core/qr'),{db}=require('./db'),SC=require('./sched'),HEAD=require('./head');
const T={en:{days:['','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],tt:'TIMETABLE',cls:'Class',teacher:'Teacher',from:'Valid on',period:'Period',qr:'Class attendance code',how:['Teachers: scan this code with your phone when you reach the class.','Confirm that you are here for this lesson. Do not photograph or share this code.'],pay:'TEACHER HOURS — PAY SHEET',name:'Teacher',sched:'Scheduled',present:'Present',late:'Late',absent:'Absent',out:'Replaced out',in:'Replaced in',paid:'Paid periods',rate:'Rate',amount:'Amount (FCFA)',total:'Total',month:'Month',approved:'Approved and locked',draft:'DRAFT — not yet approved',sign:'Principal',log:'LESSON LOG',lg_t:'Teacher',lg_per:'Period',lg_date:'Date',lg_p:'Per.',lg_cls:'Class',lg_sub:'Subject',lg_st:'Status',lg_mat:'Material covered',lg_none:'No lessons recorded in this period.',lg_rep_out:'Replaced',lg_rep_in:'Replacement',lg_pend:'Not confirmed',lg_stats:'Attendance',lg_by:'by',lg_nosum:'—',pending:'Not confirmed',status_:{present:'Present',late:'Late',absent:'Absent'}},
fr:{days:['','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'],tt:'EMPLOI DU TEMPS',cls:'Classe',teacher:'Enseignant',from:'Valable le',period:'Période',qr:'Code de présence de la classe',how:['Enseignants : scannez ce code avec votre téléphone en arrivant en classe.','Confirmez que vous êtes présent pour ce cours. Ne photographiez pas et ne partagez pas ce code.'],pay:'HEURES DES ENSEIGNANTS — ÉTAT DE PAIE',name:'Enseignant',sched:'Prévues',present:'Présent',late:'Retard',absent:'Absent',out:'Remplacé',in:'Remplaçant',paid:'Périodes payées',rate:'Taux',amount:'Montant (FCFA)',total:'Total',month:'Mois',approved:'Approuvé et verrouillé',draft:'BROUILLON — non approuvé',sign:'Le Chef d’établissement',log:'REGISTRE DES COURS',lg_t:'Enseignant',lg_per:'Période',lg_date:'Date',lg_p:'Pér.',lg_cls:'Classe',lg_sub:'Matière',lg_st:'Statut',lg_mat:'Contenu enseigné',lg_none:'Aucun cours enregistré sur cette période.',lg_rep_out:'Remplacé',lg_rep_in:'Remplaçant',lg_pend:'Non confirmé',lg_stats:'Présence',lg_by:'par',lg_nosum:'—',pending:'Non confirmé',status_:{present:'Présent',late:'Retard',absent:'Absent'}}};
const head=(doc,sc,w,x=40)=>{const h=HEAD(sc);doc.fillColor('#000').font('Helvetica-Bold').fontSize(13).text(h[0],x,30,{align:'center',width:w});doc.font('Helvetica').fontSize(9);h.slice(1,3).forEach(l=>doc.text(l,{align:'center',width:w}))};
const fmt=n=>String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
// one light colour per teacher, same formula as the screen (public/ttui.js tcol)
const hsl=(h,s,l)=>{s/=100;l/=100;const k=n=>(n+h/30)%12,a=s*Math.min(l,1-l),f=n=>l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1)));return'#'+[f(0),f(8),f(4)].map(x=>Math.round(x*255).toString(16).padStart(2,'0')).join('')};
const PAL=require('./ttpal'),palOf=sid=>{const ix=PAL.teacherIdx(sid);return id=>ix[id]==null?null:PAL.slot(ix[id])};
async function timetable(res,o){const sc=SC.school(o.sid),l=T[o.lang],lay=SC.layout(o.sid,sc),nm=SC.names(o.sid);
 res.setHeader('Content-Type','application/pdf');res.setHeader('Content-Disposition',`attachment; filename="timetable-${o.kind}.pdf"`);
 const doc=new PDFDocument({size:'A4',layout:'landscape',margin:30,autoFirstPage:false});pipe(doc,res);
 for(const id of o.ids){doc.addPage();const W=782;head(doc,sc,W,30);
  const title=o.kind=='class'?db.prepare('SELECT name FROM classes WHERE id=?').get(id).name:nm[id];
  doc.font('Helvetica-Bold').fontSize(15).text(`${l.tt} — ${o.kind=='class'?l.cls:l.teacher}: ${title}`,30,doc.y+8,{width:W,align:'center'}).font('Helvetica').fontSize(9).text(`${l.from} ${o.date}${sc.year?'  ·  '+sc.year:''}`,{align:'center',width:W});
  const pal=palOf(o.sid),slots=SC.slotsOn(o.sid,o.date,o.kind=='class'?'AND s.class_id=?':'AND s.teacher_id=?',id),cell={};for(const s of slots)cell[s.day+':'+s.period]=s;
  const rows=[];let pi=0;const all=[...lay.periods.map(p=>({...p,k:'p'})),...lay.breaks.map(b=>({...b,k:'b'}))].sort((a,b)=>a.start-b.start);
  const cw=(W-90)/lay.days.length,X=[30,120],y0=doc.y+14,rh=Math.min(46,(520-y0)/(all.length+1));let y=y0;
  doc.rect(30,y,W,22).fill('#1F3A5F');doc.fillColor('#fff').font('Helvetica-Bold').fontSize(10).text(l.period,34,y+6,{width:82});
  lay.days.forEach((d,i)=>doc.text(l.days[d],120+i*cw+4,y+6,{width:cw-8}));y+=22;
  for(const r of all){const h=r.k=='b'?16:rh;doc.rect(30,y,W,h).lineWidth(.5).strokeColor('#999').stroke();
   if(r.k=='b'){doc.rect(30,y,W,h).fill('#e6ebf2');doc.fillColor('#555').font('Helvetica-Oblique').fontSize(8).text(`${r.s}–${r.e}   ${r.label||''}`,34,y+4,{width:W-8});y+=h;continue}
   doc.fillColor('#000').font('Helvetica-Bold').fontSize(9).text(`${r.n}`,34,y+4).font('Helvetica').fontSize(8).text(`${r.s}–${r.e}`,34,y+16);
   lay.days.forEach((d,i)=>{const x=120+i*cw;doc.moveTo(x,y).lineTo(x,y+h).stroke();const s=cell[d+':'+r.n];if(!s)return;
    const tc=pal(o.kind=='class'?s.teacher_id:id),fg=tc?tc.fg:'#000';if(tc){doc.rect(x+1.5,y+1.5,cw-3,h-3).fill(tc.bg);if(tc.shape)PAL.drawShape(doc,tc.shape,x+cw-17,y+4,12,fg)}
    doc.fillColor(fg).font('Helvetica-Bold').fontSize(9).text((o.kind=='class'?s.subject:s.cls+' · '+s.subject)+(s.kind?(o.lang=='fr'?' (TP)':' (Practical)'):''),x+4,y+5,{width:cw-(tc&&tc.shape?24:8),height:h-8,ellipsis:true});
    if(o.kind=='class')doc.font('Helvetica').fontSize(8).fillColor(fg).text(s.teacher||'—',x+4,y+19,{width:cw-8,height:12,lineBreak:false,ellipsis:true})});y+=h}}
 doc.end()}
async function qrSheet(res,o){const l=T[o.lang];res.setHeader('Content-Type','application/pdf');res.setHeader('Content-Disposition','attachment; filename="class-qr-codes.pdf"');
 const doc=new PDFDocument({size:'A4',margin:40,autoFirstPage:false});pipe(doc,res);
 for(const c of o.classes){doc.addPage();head(doc,o.school,515);const img=await QR.toBuffer(o.base+'/c/'+c.qr,{margin:2,width:600});
  doc.font('Helvetica-Bold').fontSize(54).text(c.name,40,170,{align:'center',width:515}).fontSize(14).font('Helvetica').text(l.qr,{align:'center',width:515});
  doc.image(img,148,270,{width:300});doc.fontSize(14).text(l.how[0],60,600,{align:'center',width:475}).fontSize(11).fillColor('#555').text(l.how[1],60,640,{align:'center',width:475}).text(o.school.name+' · '+o.school.code,60,760,{align:'center',width:475})}
 doc.end()}
async function pay(res,o){const l=T[o.lang],d=o.data;res.setHeader('Content-Type','application/pdf');res.setHeader('Content-Disposition',`attachment; filename="pay-${d.ym}.pdf"`);
 const doc=new PDFDocument({size:'A4',layout:'landscape',margin:30});pipe(doc,res);head(doc,o.school,782,30);
 doc.font('Helvetica-Bold').fontSize(14).text(`${l.pay} — ${l.month} ${d.ym}`,30,doc.y+8,{width:782,align:'center'}).fontSize(10).fillColor(d.locked?'#2e7d32':'#c62828').text(d.locked?l.approved:l.draft,{align:'center',width:782}).fillColor('#000');
 const cols=[190,58,58,48,58,66,66,70,60,90],hd=[l.name,l.sched,l.present,l.late,l.absent,l.out,l.in,l.paid,l.rate,l.amount],X=[30];cols.forEach((w,i)=>X.push(X[i]+w));let y=doc.y+14;
 const row=(v,b)=>{if(b){doc.rect(30,y-3,782,18).fill('#1F3A5F');doc.fillColor('#fff')}else doc.fillColor('#000');doc.font(b?'Helvetica-Bold':'Helvetica').fontSize(9);v.forEach((x,i)=>doc.text(String(x),X[i]+3,y,{width:cols[i]-6,align:i?'right':'left',lineBreak:false,ellipsis:true}));y+=18;if(!b)doc.moveTo(30,y-4).lineTo(812,y-4).strokeColor('#ccc').lineWidth(.5).stroke()};
 row(hd,1);let tot=0,per=0;for(const t of d.teachers){if(y>520){doc.addPage();y=40}row([t.name,t.sched,t.present,t.late,t.absent,t.out,t.in,t.paid,fmt(t.rate||0),fmt(t.amount)]);tot+=t.amount;per+=t.paid}
 doc.font('Helvetica-Bold');row([l.total,'','','','','','',per,'',fmt(tot)]);doc.fillColor('#000').text(l.sign,30,y+40);doc.end()}
async function lessonLog(res,o){const l=T[o.lang],st=o.stats;res.setHeader('Content-Type','application/pdf');res.setHeader('Content-Disposition','attachment; filename="lesson-log.pdf"');
 const doc=new PDFDocument({size:'A4',layout:'landscape',margin:30});pipe(doc,res);head(doc,o.school,782,30);
 doc.font('Helvetica-Bold').fontSize(14).text(`${l.log} — ${o.teacher}`,30,doc.y+8,{width:782,align:'center'}).font('Helvetica').fontSize(10).text(`${l.lg_per}: ${o.from} – ${o.to}${o.school.year?'  ·  '+o.school.year:''}`,{align:'center',width:782});
 // attendance stats
 const sv=[[l.sched,st.sched],[l.present,st.present],[l.late,st.late],[l.absent,st.absent],[l.out,st.out],[l.in,st.in],[l.lg_pend,st.pending]];let x=30,y=doc.y+12;const bw=782/sv.length;
 sv.forEach(([k,v],i)=>{doc.rect(30+i*bw,y,bw-6,36).lineWidth(.5).strokeColor('#999').stroke();doc.fillColor('#555').font('Helvetica').fontSize(8).text(k,30+i*bw+6,y+5,{width:bw-18});doc.fillColor('#000').font('Helvetica-Bold').fontSize(13).text(String(v),30+i*bw+6,y+17,{width:bw-18})});
 y+=52;const cols=[62,34,100,120,80,386],hd=[l.lg_date,l.lg_p,l.lg_cls,l.lg_sub,l.lg_st,l.lg_mat],X=[30];cols.forEach((w,i)=>X.push(X[i]+w));
 const header=()=>{doc.rect(30,y,782,20).fill('#1F3A5F');doc.fillColor('#fff').font('Helvetica-Bold').fontSize(9);hd.forEach((h,i)=>doc.text(h,X[i]+4,y+6,{width:cols[i]-8,lineBreak:false}));y+=20};
 header();doc.fillColor('#000');
 if(!o.rows.length)doc.font('Helvetica-Oblique').fontSize(10).text(l.lg_none,34,y+8);
 for(const r of o.rows){const sm=r.summary||l.lg_nosum;doc.font('Helvetica').fontSize(9);const h=Math.max(20,doc.heightOfString(sm,{width:cols[5]-8})+10,doc.heightOfString(r.stat,{width:cols[4]-8})+10);
  if(y+h>560){doc.addPage();y=40;header();doc.fillColor('#000')}
  doc.font('Helvetica').fontSize(9).fillColor('#000');[r.date,String(r.period),r.cls,r.subject,r.stat,sm].forEach((v,i)=>doc.text(v,X[i]+4,y+5,{width:cols[i]-8}));
  doc.moveTo(30,y+h).lineTo(812,y+h).lineWidth(.4).strokeColor('#ccc').stroke();y+=h}
 doc.end()}
module.exports={timetable,qrSheet,pay,lessonLog,T};
