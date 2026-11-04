// Staff lists grouped by teacher, class or subject, as PDF (principal only). Same grouping as the Staff page.
const{db}=require('./db'),{PDFDocument,pipe}=require('./core/pdfkit'),HEAD=require('./head'),SECT=require('./sections');
const T={en:{teacher:'Teacher',name:'Name',role:'Role',subject:'Subject',classes:'Classes',cls:'Class',head:'Class head',by:{teacher:'Staff list by teacher',class:'Staff list by class',subject:'Staff list by subject'},tc:n=>n+(n==1?' teacher':' teachers'),sb:n=>n+(n==1?' subject':' subjects'),none:'No teacher assigned yet',empty:'Nothing to list.',page:'Page',roles:{principal:'Principal',secretary:'Secretary',teacher:'Teacher',surveillant:'Surveillant'}},
fr:{teacher:'Enseignant',name:'Nom',role:'Rôle',subject:'Matière',classes:'Classes',cls:'Classe',head:'Titulaire',by:{teacher:'Liste du personnel par enseignant',class:'Liste du personnel par classe',subject:'Liste du personnel par matière'},tc:n=>n+(n>1?' enseignants':' enseignant'),sb:n=>n+(n>1?' matières':' matière'),none:'Aucun enseignant affecté',empty:'Rien à lister.',page:'Page',roles:{principal:'Principal',secretary:'Secrétaire',teacher:'Enseignant',surveillant:'Surveillant'}}};
const nat=(a,b)=>String(a).localeCompare(String(b),undefined,{numeric:true,sensitivity:'base'});
// who teaches what: the main teacher of a subject plus the per-sequence teachers (same rule as the Staff page)
function data(sid,section){
 const subs=db.prepare('SELECT s.id,s.teacher_id main,s.name subject,c.id cid,COALESCE(c.short,c.name) cl,c.name cname,c.head_id FROM subjects s JOIN classes c ON c.id=s.class_id WHERE s.school_id=?').all(sid),
  seq=db.prepare('SELECT q.subject_id,q.teacher_id FROM subject_seq q JOIN subjects s ON s.id=q.subject_id WHERE s.school_id=?').all(sid),
  classes=db.prepare('SELECT id,name,COALESCE(short,name) cl,head_id,section_id FROM classes WHERE school_id=?').all(sid),
  users=db.prepare("SELECT id,name,role FROM users WHERE school_id=? AND active=1").all(sid).filter(u=>!section||u.role!='teacher'||SECT.ofUser(sid,u.id).includes(section));
 const ok=new Set(users.map(u=>u.id)),rows=[];
 for(const u of users){const m=new Map();for(const x of subs)if(x.main==u.id||seq.some(q=>q.subject_id==x.id&&q.teacher_id==u.id)){if(!m.has(x.subject))m.set(x.subject,new Map());m.get(x.subject).set(x.cid,x.cl)}
  rows.push({id:u.id,name:u.name,role:u.role,items:[...m].map(([s,c])=>({subject:s,classes:[...c.values()].sort(nat)})).sort((a,b)=>nat(a.subject,b.subject))})}
 return{users:rows,classes:classes.filter(c=>!section||c.section_id==section).sort((a,b)=>nat(a.name,b.name)),heads:Object.fromEntries(classes.filter(c=>c.head_id&&ok.has(c.head_id)).map(c=>[c.cl,users.find(u=>u.id==c.head_id).name]))}}
// groups for a view: [{key,title,note,head,cols,rows}]
function groups(d,view,q,f,l){const has=a=>!q||a.join(' ').toLowerCase().includes(q);
 if(view=='class'){const by=new Map(d.classes.map(c=>[c.cl,[]]));
  for(const u of d.users)for(const it of u.items)for(const c of it.classes)if(by.has(c)&&has([u.name,it.subject,c]))by.get(c).push([it.subject,u.name]);
  return[...by].filter(([k,r])=>(!f||k==f)&&(r.length||!q)).map(([k,r])=>({key:k,title:k,head:d.heads[k]||'',note:r.length?[T[l].sb(new Set(r.map(x=>x[0])).size),T[l].tc(new Set(r.map(x=>x[1])).size)].join(' · '):'',cols:[T[l].subject,T[l].teacher],rows:r.sort((a,b)=>nat(a[0],b[0])||nat(a[1],b[1])),empty:T[l].none}))}
 if(view=='subject'){const by=new Map();for(const u of d.users)for(const it of u.items)if(has([u.name,it.subject,...it.classes])){if(!by.has(it.subject))by.set(it.subject,[]);by.get(it.subject).push([u.name,it.classes.join(', ')])}
  return[...by].sort((a,b)=>nat(a[0],b[0])).filter(([k])=>!f||k==f).map(([k,r])=>({key:k,title:k,head:'',note:T[l].tc(r.length),cols:[T[l].teacher,T[l].classes],rows:r.sort((a,b)=>nat(a[0],b[0]))}))}
 const r=[];for(const u of d.users.sort((a,b)=>nat(a.name,b.name))){const its=u.items.filter(it=>!f||it.subject==f||it.classes.includes(f)).filter(it=>has([u.name,it.subject,...it.classes]));
  if(f&&!its.length)continue;if(!its.length){if(!f&&has([u.name,u.role]))r.push([u.name,T[l].roles[u.role]||u.role,'—','—']);continue}
  its.forEach((it,i)=>r.push([i?'':u.name,i?'':(T[l].roles[u.role]||u.role),it.subject,it.classes.join(', ')]))}
 return[{key:'',title:'',head:'',note:'',cols:[T[l].name,T[l].role,T[l].subject,T[l].classes],rows:r,w:[.28,.14,.28,.30]}]}
module.exports=(app,{auth,E,school})=>{
 app.get('/api/staff/pdf',auth(['principal']),(req,res,next)=>{try{
  const sid=req.user.school_id,l=req.query.lang=='fr'?'fr':'en',view=['class','subject'].includes(req.query.view)?req.query.view:'teacher',q=String(req.query.q||'').slice(0,60).toLowerCase().trim(),f=String(req.query.filter||'').slice(0,60),grp=String(req.query.group||'').slice(0,60),section=+req.query.section||0;
  let g=groups(data(sid,section),view,q,f,l);if(grp)g=g.filter(x=>x.key==grp);
  const sc=school(req),H=HEAD(sc),L=T[l];res.setHeader('Content-Type','application/pdf');
  res.setHeader('Content-Disposition',`attachment; filename="staff-${view}${grp?'-'+grp.replace(/[^\w.-]+/g,'_'):''}.pdf"`);
  const doc=new PDFDocument({size:'A4',margin:40,autoFirstPage:false});pipe(doc,res);const W=515,B=790;let pg=0,y=0;
  const page=()=>{doc.addPage();doc.page.margins.bottom=0;pg++;doc.fillColor('#000').font('Helvetica-Bold').fontSize(13).text(H[0],40,30,{align:'center',width:W});doc.font('Helvetica').fontSize(9);H.slice(1,3).forEach(x=>doc.text(x,{align:'center',width:W}));
   doc.font('Helvetica-Bold').fontSize(14).text(grp&&g[0]&&view!='teacher'?`${view=='class'?L.cls:L.subject}: ${grp}`:L.by[view],40,doc.y+10,{width:W,align:'center'});
   if(sc.year)doc.font('Helvetica').fontSize(9).fillColor('#555').text(sc.year,{align:'center',width:W});doc.fillColor('#000');y=doc.y+14;
   doc.font('Helvetica').fontSize(8).fillColor('#888').text(`${L.page} ${pg}`,40,810,{width:W,align:'right'});doc.fillColor('#000')};
  const tbl=(x,widths,cols,rows)=>{let X=[x];widths.forEach((w,i)=>X.push(X[i]+w));
   const hd=()=>{doc.rect(x,y,W,18).fill('#1F3A5F');doc.fillColor('#fff').font('Helvetica-Bold').fontSize(9);cols.forEach((c,i)=>doc.text(c,X[i]+5,y+5,{width:widths[i]-8,lineBreak:false}));y+=18;doc.fillColor('#000')};hd();
   rows.forEach((r,ri)=>{doc.font('Helvetica').fontSize(9.5);const h=Math.max(...r.map((c,i)=>doc.heightOfString(String(c),{width:widths[i]-10})))+9;
    if(y+h>B){page();hd()}if(ri%2==0)doc.rect(x,y,W,h).fill('#f4f6fa');doc.fillColor('#000').font('Helvetica').fontSize(9.5);r.forEach((c,i)=>doc.text(String(c),X[i]+5,y+4.5,{width:widths[i]-10}));y+=h})};
  page();if(!g.length||!g.some(x=>x.rows.length||x.empty)){doc.font('Helvetica').fontSize(11).text(L.empty,40,y+10,{width:W,align:'center'})}
  for(const x of g){if(view=='teacher'){tbl(40,x.w.map(p=>p*W),x.cols,x.rows);continue}
   if(y+70>B)page();doc.font('Helvetica-Bold').fontSize(12).fillColor('#1F3A5F').text(x.title,40,y,{continued:!!x.note,width:W});if(x.note)doc.font('Helvetica').fontSize(9).fillColor('#666').text('   '+x.note);doc.fillColor('#000');
   if(x.head)doc.font('Helvetica').fontSize(9).fillColor('#444').text(`${L.head}: ${x.head}`,40);doc.fillColor('#000');y=doc.y+5;
   if(x.rows.length)tbl(40,[.5*W,.5*W],x.cols,x.rows);else{doc.font('Helvetica-Oblique').fontSize(9.5).fillColor('#b42318').text(x.empty,45,y+2);doc.fillColor('#000');y=doc.y+4}y+=16}
  doc.end()}catch(e){next(e)}});
};
