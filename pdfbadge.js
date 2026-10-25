// Student ID badges (CR80, 85.6 x 54 mm, landscape): front with photo, name, matricule, class, QR; back with return text and signature.
// Two layouts: 'sheet' = A4, 2 x 5 cards, fronts page then mirrored backs page (print double-sided, flip on long edge);
//              'card'  = one CR80 page per side, front then back per student, for a card printer.
const {PDFDocument,toBuf}=require('./core/pdfkit'),QR=require('./core/qr'),HEAD=require('./head');
const mm=v=>v*72/25.4,CW=mm(85.6),CH=mm(54),A4W=595.28,A4H=841.89;
const T={card:['STUDENT ID CARD','CARTE D’ÉLÈVE'],name:['Name','Nom'],mat:['Student ID','Matricule'],cls:['Class','Classe'],year:['School year','Année scolaire'],
 prop:['This card is the property of the school. If found, please return it to the school.','Cette carte est la propriété de l’école. Si vous la trouvez, merci de la rapporter à l’école.'],
 scan:['Scan to check this card','Scanner pour vérifier la carte'],sig:['The Principal','Le Principal'],valid:['Valid for the school year','Valable pour l’année scolaire'],photo:['PHOTO','PHOTO']};
// staff cards reuse the layout with their own wording for three labels
const TS={...T,card:['STAFF ID CARD','CARTE DU PERSONNEL'],mat:['Staff ID','Matricule personnel'],cls:['Position','Fonction']};let CUR=T;
const lab=(k,lang)=>{const X=CUR[k];return lang=='en'?X[0]:lang=='fr'?X[1]:X[0]+' / '+X[1]};
const hex=c=>/^#[0-9a-f]{6}$/i.test(c||'')?c:'#1e5d46';
const fit=(doc,txt,font,size,w,min)=>{doc.font(font);let s=size;while(s>min&&doc.fontSize(s).widthOfString(txt)>w)s-=.25;return s};
// Draw one side at (x,y). b: {name,matricule,cls,yearLabel,code,photo,qr}
function front(doc,x,y,b,o){const{sc,logo,c1,c2,lang}=o;doc.save();
 doc.roundedRect(x,y,CW,CH,mm(3)).clip();doc.rect(x,y,CW,CH).fill('#ffffff');
 const hh=mm(11.5);doc.rect(x,y,CW,hh).fill(c1);doc.rect(x,y+hh,CW,mm(.9)).fill(c2||c1);
 let tx=x+mm(3.5);
 if(logo){doc.save();doc.roundedRect(x+mm(2.5),y+mm(1.7),mm(8.1),mm(8.1),mm(1.2)).fill('#ffffff');doc.restore();try{doc.image(logo,x+mm(3),y+mm(2.2),{fit:[mm(7.1),mm(7.1)],align:'center',valign:'center'})}catch{}tx=x+mm(12.5)}
 const nm=HEAD(sc)[0]||sc.name||'',tw=x+CW-mm(3)-tx,s1=fit(doc,nm,'Helvetica-Bold',8.4,tw,5.6);
 doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(s1).text(nm,tx,y+mm(2.4),{width:tw,lineBreak:false,ellipsis:true});
 const sub=lab('card',lang);doc.font('Helvetica').fontSize(fit(doc,sub,'Helvetica',5.6,tw,4.2)).fillColor('#e6ece8').text(sub,tx,y+mm(6.6),{width:tw,lineBreak:false});
 // photo
 const px=x+mm(4),py=y+mm(15.5),pw=mm(21),ph=mm(28);
 doc.save();doc.roundedRect(px,py,pw,ph,mm(1.5)).clip();doc.rect(px,py,pw,ph).fill('#eef0f4');
 if(b.photo){try{doc.image(b.photo,px,py,{cover:[pw,ph],align:'center',valign:'center'})}catch{}}
 else{doc.fillColor('#9aa1b2').font('Helvetica-Bold').fontSize(7).text(T.photo[lang=='fr'?1:0],px,py+ph/2-3,{width:pw,align:'center',lineBreak:false})}
 doc.restore();doc.roundedRect(px,py,pw,ph,mm(1.5)).lineWidth(.5).stroke('#c9cdd8');
 // details
 const dx=x+mm(28.5),dw=x+CW-mm(3)-dx;let dy=y+mm(15.5);
 const row=(k,v,big)=>{doc.fillColor('#6b7280').font('Helvetica').fontSize(4.8).text(lab(k,lang).toUpperCase(),dx,dy,{width:dw,lineBreak:false});dy+=mm(2.1);
  const f=big?'Helvetica-Bold':'Helvetica-Bold',z=fit(doc,v,f,big?9.6:7.4,dw-(big?0:mm(17)),big?6.4:5.4);doc.fillColor('#111827').font(f).fontSize(z);
  if(big){const h=doc.heightOfString(v,{width:dw});doc.text(v,dx,dy,{width:dw,height:mm(9),ellipsis:true});dy+=Math.min(h,mm(8.2))+mm(1.3)}else{doc.text(v,dx,dy,{width:dw,lineBreak:false});dy+=mm(3.7)}};
 row('name',b.name,true);row('mat',b.matricule||'—');row('cls',b.cls||'—');
 // QR
 const qs=mm(13),qx=x+CW-mm(3)-qs,qy=y+CH-mm(3)-qs-mm(2.2);doc.image(b.qr,qx,qy,{width:qs});
 doc.fillColor('#6b7280').font('Helvetica').fontSize(4.2).text(b.code,qx-mm(2),qy+qs+mm(.4),{width:qs+mm(4),align:'center',lineBreak:false});
 doc.fillColor('#111827').font('Helvetica-Bold').fontSize(5.6).text(b.yearLabel,dx,y+CH-mm(5.6),{width:qx-dx-mm(1),lineBreak:false});
 doc.restore()}
function back(doc,x,y,o){const{sc,c1,c2,lang,yearLabel}=o;doc.save();
 doc.roundedRect(x,y,CW,CH,mm(3)).clip();doc.rect(x,y,CW,CH).fill('#ffffff');doc.rect(x,y,CW,mm(6)).fill(c1);doc.rect(x,y+mm(6),CW,mm(.7)).fill(c2||c1);
 const nm=HEAD(sc)[0]||sc.name||'';doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(fit(doc,nm,'Helvetica-Bold',7.4,CW-mm(8),5)).text(nm,x+mm(4),y+mm(2),{width:CW-mm(8),align:'center',lineBreak:false});
 let ty=y+mm(9);const w=CW-mm(10);
 const ptxt=lang=='en'?T.prop[0]:lang=='fr'?T.prop[1]:T.prop[0]+'\n'+T.prop[1];
 doc.fillColor('#111827').font('Helvetica').fontSize(5.8).text(ptxt,x+mm(5),ty,{width:w,align:'center'});ty=doc.y+mm(1.6);
 doc.fillColor('#374151').font('Helvetica').fontSize(5.6);
 for(const l of HEAD(sc).slice(1,4)){doc.text(l,x+mm(5),ty,{width:w,align:'center',lineBreak:false,ellipsis:true});ty+=mm(2.6)}
 doc.fillColor('#6b7280').font('Helvetica').fontSize(5).text((lang=='en'?T.valid[0]:lang=='fr'?T.valid[1]:T.valid[0]+' / '+T.valid[1])+' '+yearLabel,x+mm(5),y+CH-mm(16.5),{width:w,align:'center',lineBreak:false});
 const sx=x+CW-mm(36),sy=y+CH-mm(8.5);doc.moveTo(sx,sy).lineTo(sx+mm(31),sy).lineWidth(.4).stroke('#6b7280');
 doc.fillColor('#6b7280').font('Helvetica').fontSize(5).text(lab('sig',lang),sx,sy+mm(.8),{width:mm(31),align:'center',lineBreak:false});
 doc.fillColor('#9aa1b2').fontSize(4.4).text(lab('scan',lang),x+mm(5),y+CH-mm(4.4),{width:mm(45),lineBreak:false});
 doc.restore()}
// students: [{name,matricule,cls,code,photo(Buffer|null)}]
async function render(sc,students,opt){const lang=['en','fr','both'].includes(sc.card_lang)?sc.card_lang:'both',c1=hex(sc.card_c1),c2=sc.card_c2?hex(sc.card_c2):'',logo=sc.card_logo?Buffer.from(sc.card_logo.split(',')[1],'base64'):null;
 const o={sc,logo,c1,c2,lang,yearLabel:opt.yearLabel},layout=opt.layout=='card'?'card':'sheet';
 for(const s of students)s.qr=await QR.toBuffer(opt.base+s.code,{margin:0,width:260,errorCorrectionLevel:'M'});
 CUR=opt.kind=='staff'?TS:T;const doc=new PDFDocument({size:layout=='card'?[CW,CH]:'A4',margin:0,autoFirstPage:false,info:{Title:opt.kind=='staff'?'Staff ID badges':'Student ID badges'}});
 return toBuf(doc,()=>{
  if(layout=='card'){for(const s of students){doc.addPage();front(doc,0,0,{...s,yearLabel:opt.yearLabel},o);doc.addPage();back(doc,0,0,o)}return}
  const gx=mm(4),gy=mm(2),ox=(A4W-2*CW-gx)/2,oy=(A4H-5*CH-4*gy)/2,per=10;
  const guide=(x,y)=>{doc.save();doc.roundedRect(x,y,CW,CH,mm(3)).lineWidth(.25).dash(2,{space:2}).stroke('#b8bcc8');doc.undash();doc.restore()};
  for(let i=0;i<students.length;i+=per){const page=students.slice(i,i+per);
   doc.addPage();page.forEach((s,k)=>{const c=k%2,r=Math.floor(k/2),x=ox+c*(CW+gx),y=oy+r*(CH+gy);front(doc,x,y,{...s,yearLabel:opt.yearLabel},o);guide(x,y)});
   doc.addPage();page.forEach((s,k)=>{const c=1-(k%2),r=Math.floor(k/2),x=ox+c*(CW+gx),y=oy+r*(CH+gy);back(doc,x,y,o);guide(x,y)})}})}
module.exports={render,CW,CH};
