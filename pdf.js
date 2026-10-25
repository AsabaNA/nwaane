// Report card PDF (pdfkit). Layout follows the approved mockups: school header, student block, a results table whose rows
// stretch to fill the page (2 subjects or 24), and a fixed footer (summary, signatures, QR verification).
// The school chooses logo, one or two colours, and the language(s): en | fr | both.
const {PDFDocument,toBuf}=require('./core/pdfkit'),QR=require('./core/qr'),{db}=require('./db'),R=require('./report'),HEAD=require('./head'),F=require('./fees');
const mm=v=>v*72/25.4,W=595.28,H=841.89,ML=mm(13),MR=W-mm(13);
const T={
 country:{en:['Republic of Cameroon','Peace · Work · Fatherland'],fr:['République du Cameroun','Paix · Travail · Patrie']},
 title:['Student’s Progress Report','Bulletin de notes'],term:['Term','Trimestre'],name:['Name','Nom'],mat:['Student ID','Matricule'],cls:['Class','Classe'],year:['School year','Année scolaire'],
 results:['Academic results','Résultats scolaires'],out20:['Marks out of 20','Notes sur 20'],subj:['Subject','Matière'],seq:['Seq.','Séq.'],avg:['Avg','Moy.'],coef:['Coef.','Coef.'],tot:['Total','Total'],rank:['Rank','Rang'],app:['Appreciation','Appréciation'],
 wt:['Weighted totals','Totaux pondérés'],tavg:['Term average','Moyenne trimestrielle'],aavg:['Annual average','Moyenne annuelle'],annual:['Annual','Annuel'],cavg:['Class average','Moyenne de la classe'],hi:['Highest average','Plus forte moyenne'],lo:['Lowest average','Plus faible moyenne'],
 orank:['Overall rank','Rang général'],sres:['Student results','Résultats de l’élève'],cstat:['Class statistics','Statistiques de la classe'],nsub:['Subjects','Matières'],ann:['Annual average','Moyenne annuelle'],rem:['Class council remarks','Observations du conseil de classe'],
 auth:['School authority','Responsable de l’établissement'],princ:['The Principal · Signature & stamp','Le Principal · Signature et cachet'],par:['Parent / guardian','Parent / tuteur'],sigd:['Signature & date','Signature et date'],
 fees:['Fees owing','Frais dus'],ver:['Report verification','Vérification du bulletin'],code:['Verification code','Code de vérification'],
 a:[['Excellent','Excellent'],['Very good','Très bien'],['Good','Bien'],['Fair','Assez bien'],['Weak','Faible'],['Very weak','Très faible']]};
const ap=v=>T.a[v>=16?0:v>=14?1:v>=12?2:v>=10?3:v>=8?4:5],f2=v=>v==null?'—':v.toFixed(2),f1=v=>v==null?'—':String(Math.round(v*100)/100);
const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)),toHex=a=>'#'+a.map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');
const mix=(a,b,t)=>{const x=hex(a),y=hex(b);return toHex(x.map((v,i)=>v+(y[i]-v)*t))};   // t=0 -> a, t=1 -> b
const INK='#1f2924',SUB='#5a635f',FAIL='#b01e25';
function pal(sc){const c1=/^#[0-9a-f]{6}$/i.test(sc.card_c1||'')?sc.card_c1:'#1e5d46',c2=/^#[0-9a-f]{6}$/i.test(sc.card_c2||'')?sc.card_c2:mix(c1,'#ffffff',.55);
 return{c1,c2,line:mix('#ffffff',c1,.16),tint:mix('#ffffff',c1,.06)}}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// ---- drawing helpers. A "part" is [text,{font,size,color}]; parts of one line are drawn side by side.
const TITLE=/^(mr|mrs|ms|mme|mlle|dr|prof|pr|m|mgr)\.?$/i,ini=t=>(t.replace(/^[^A-Za-zÀ-ÿ]+/,'')[0]||t[0]).toUpperCase()+'.';
function mk(doc){
 const wid=(s,f,z)=>doc.font(f).fontSize(z).widthOfString(s);
 // a label in the chosen language(s): returns parts for one line ('inline' = "EN / FR") or two lines. The French part is italic and smaller.
 const lab=(k,mode,z,o={})=>{const[e,fr]=T[k],base={font:o.bold?'Helvetica-Bold':'Helvetica',size:z,color:o.color||INK},it={font:'Helvetica-Oblique',size:z*.82,color:SUB};
  if(mode=='en')return[[[e,base]]];if(mode=='fr')return[[[fr,base]]];
  return o.stack?[[[e,base]],[['/ '+fr,it]]]:[[[e,base],[' / '+fr,it]]]};
 const lineW=parts=>parts.reduce((a,[s,o])=>a+wid(s,o.font,o.size),0);
 const put=(parts,x,y,o={})=>{const w=lineW(parts);let xx=o.align=='center'?x+(o.w-w)/2:o.align=='right'?x+o.w-w:x;
  for(const[s,p]of parts){doc.font(p.font).fontSize(p.size).fillColor(p.color);doc.text(s,xx,y,{lineBreak:false});xx+=wid(s,p.font,p.size)}return w};
 const lh=z=>z*1.16;
 const block=(lines,x,y,o={})=>{let yy=y;for(const l of lines){const z=Math.max(...l.map(p=>p[1].size));put(l,x,yy,o);yy+=lh(z)}return yy-y};
 const blockH=lines=>lines.reduce((a,l)=>a+lh(Math.max(...l.map(p=>p[1].size))),0);
 // fit a single line into w by shrinking the font
 const fit=(s,f,z,w,min=6)=>{while(z>min&&wid(s,f,z)>w)z-=.25;return z};
 // shrink every part of a line together until it fits (never below min x its size)
 const fitLine=(parts,w,min=.6)=>{let k=1;const sc=kk=>parts.map(([s,o])=>[s,{...o,size:o.size*kk}]);while(k>min&&lineW(sc(k))>w)k-=.02;return sc(k)};
 // cut a text so it ends with "..." inside w: whole words when possible, letters otherwise
 const ell=(s,f,z,w)=>{if(wid(s,f,z)<=w)return s;const tk=s.split(/\s+/);for(let k=tk.length-1;k>0;k--){const t=tk.slice(0,k).join(' ')+'...';if(wid(t,f,z)<=w)return t}
  let t=s;while(t.length>1&&wid(t.trimEnd()+'...',f,z)>w)t=t.slice(0,-1);return t.trimEnd()+'...'};
 // names: keep the words that fit, turn the others into initials ("Ndimofor Asaba Akongnui" -> "Ndimofor A. A."); titles (Mr., Mme.) stay whole
 const abbr=(tk,f,z,w)=>{for(let k=tk.length;k>=0;k--){const s=tk.map((t,i)=>i<k||TITLE.test(t)?t:ini(t)).join(' ');if(wid(s,f,z)<=w)return s}
  const all=tk.map(t=>TITLE.test(t)?t:ini(t));for(let k=all.length-1;k>0;k--){const t=all.slice(0,k).join(' ');if(wid(t,f,z)<=w)return t}
  return ell(all.join(' '),f,z,w)};
 // a name on at most two lines: the second line continues the first; if it still does not fit, abbreviate what is left
 const nameLines=(name,f,z,w1,w2)=>{const tk=name.split(/\s+/).filter(Boolean);if(!tk.length)return[''];if(wid(tk.join(' '),f,z)<=w1)return[tk.join(' ')];
  let k=tk.length-1;while(k>1&&wid(tk.slice(0,k).join(' '),f,z)>w1)k--;const l1=ell(tk.slice(0,k).join(' '),f,z,w1),rest=tk.slice(k);
  return[l1,wid(rest.join(' '),f,z)<=w2?rest.join(' '):abbr(rest,f,z,w2)]};
 // a subject: one line if it fits beside the teacher, else the rest goes to a second line, cut with "..." if it still does not fit
 const subjLines=(sub,f,z,wFull,wLast)=>{if(wid(sub,f,z)<=wLast)return[sub];const tk=sub.split(/\s+/);let k=tk.length-1;while(k>1&&wid(tk.slice(0,k).join(' '),f,z)>wFull)k--;
  if(k<1||wid(tk.slice(0,k).join(' '),f,z)>wFull)return[ell(sub,f,z,wLast)];return[tk.slice(0,k).join(' '),ell(tk.slice(k).join(' '),f,z,wLast)]};
 return{wid,lab,put,block,blockH,lh,fit,fitLine,lineW,ell,abbr,nameLines,subjLines}}
const money=(v,mode)=>{const s=String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g,mode=='fr'?' ':',');return s+' FCFA'};
// ONE type scale for every report card (pt). It never changes with the number of subjects, the language or the length of the content:
// crowded reports are handled by row heights, wrapping, abbreviation and, as a last resort, a second page - never by smaller text.
// Sizes follow the approved reference scaled by 1.4; the school name keeps its own long-standing size (22 pt, only shortened to fit a very long name).
const TY={school:22,country:8.4,contact:8.4,title:14.7,term:10.5,detailLabel:10.5,detailValue:11.5,section:8.4,th:8.4,subject:9.4,teacher:7.3,mark:9.4,appr:7.3,total:9.4,
 sumLabel:8.4,sumValue:16.8,sumTail:9.4,panelTitle:9.4,meta:9.4,remarks:9.4,sig:9.4,sigNote:7.3,verify:8.4,page:7.3,
 FR:.82,                      // French/secondary language: italic, 82% of the English size (set in mk().lab)
 rowPadV:3.5,                 // total vertical padding of a table row (pt)
 SUBJ:'Helvetica-Bold',TEA:'Helvetica'};
function card(doc,x){   // x: {sc,P,c,s,cls,mode,term,qr,code,url,logo,size,fees}
 const{sc,P,c,s,cls,mode,term}=x,h=mk(doc),rows=s.rows,n=rows.length,both=mode=='both',L=ML,R_=MR,CW=R_-L,bandH=mm(3),accH=mm(1),B='Helvetica-Bold';
 const up=lines=>lines.map(l=>l.map(([t_,o])=>[t_.toUpperCase(),o]));
 const dec=v=>mode=='fr'?String(v).replace('.',','):String(v),F2=v=>dec(f2(v)),F1=v=>dec(f1(v)),one=kk=>T[kk][mode=='fr'?1:0];
 const lab2=(kk,z=TY.sumLabel)=>h.lab(kk,mode,z,{color:SUB,stack:1}),red=v=>v!=null&&v<10;
 // ---- bottom block heights (constant: the type is fixed), measured from the page bottom so the footer never moves
 const footTop=H-mm(10)-mm(47),remH=mm(2)+h.lh(TY.remarks)+mm(5.5)+mm(1.5),metaH=mm(2)+h.lh(TY.meta)+mm(1.5),ftH=mm(8.5),
  panelH=6+h.lh(TY.panelTitle)+4+h.blockH(lab2('tavg'))+3+h.lh(TY.sumValue)+mm(2.5),sumH=mm(3)+panelH,tableBottom=footTop-remH-metaH-sumH-mm(1);
 // ---- table geometry
 const k=c.annual?3:c.seqs.length,sp=c.annual?7.6:k<=2?7:k==3?6.5:6,pct=[null,...Array(k).fill(sp),8,...(c.annual?[5.5,8.5,9.5,14.4]:[6,9,10,15])],fixed=pct.slice(1).reduce((a,b)=>a+b,0);pct[0]=100-fixed;
 const cw2=pct.map(p=>CW*p/100),cxs=[L];cw2.forEach((w,i)=>cxs.push(cxs[i]+w));
 const hdH=Math.max(mm(7),both?h.lh(TY.th)+h.lh(TY.th*TY.FR)+mm(3.2):h.lh(TY.th)+mm(4.5)),colW=cw2[0]-mm(2)-mm(1.5);
 // ---- rows: fixed type, content-aware height (a wrapped subject gets two lines)
 const tkOf=r=>(r.teacher||'').split(/\s+/).filter(Boolean),minT=r=>{const tk=tkOf(r);return tk.length?h.wid(tk.map(t=>TITLE.test(t)?t:ini(t)).join(' '),TY.TEA,TY.teacher)+TY.subject*1.1:0};
 const lines=rows.map(r=>h.subjLines(r.subject,TY.SUBJ,TY.subject,colW,colW-minT(r))),LS_=TY.subject*1.08,
  hs=lines.map(l=>Math.max(h.lh(TY.subject)+TY.rowPadV,l.length>1?l.length*LS_+TY.rowPadV:0)),sumH_=hs.reduce((a,b)=>a+b,0);
 // ---- page furniture
 const strips=()=>{doc.rect(0,0,W,bandH).fill(P.c1);doc.rect(0,bandH,W,accH).fill(P.c2);doc.rect(0,H-bandH,W,bandH).fill(P.c1);doc.rect(0,H-bandH-accH,W,accH).fill(P.c2)};
 const letterhead=y=>{const logoW=mm(19),logoH=mm(21),hh=mm(23);
  if(x.logo){try{doc.image(x.logo,L,y,{fit:[logoW,logoH],align:'center',valign:'center'})}catch{}}
  const head=HEAD(sc).filter((v,i)=>!i||!/republic of cameroon|république du cameroun/i.test(v)),cx=L+logoW+mm(4),cw=CW-2*(logoW+mm(4));
  let yy=y;const cz=TY.country,ci={font:'Helvetica',size:cz,color:SUB},cit={font:'Helvetica-Oblique',size:cz*TY.FR,color:SUB},
   cl=both?[0,1].map(i=>[[T.country.en[i],ci],[' / '+T.country.fr[i],cit]]):T.country[mode].map(v=>[[v,ci]]);
  for(const l of cl){h.put(h.fitLine(l,cw,.6),cx,yy,{w:cw,align:'center'});yy+=h.lh(cz)}
  const nz=h.fit(head[0],B,TY.school,cw,12);yy+=3;h.put([[head[0],{font:B,size:nz,color:P.c1}]],cx,yy,{w:cw,align:'center'});yy+=h.lh(nz)+2;
  const contact=head.slice(1).join(' · ');if(contact){const z=h.fit(contact,'Helvetica',TY.contact,cw,7);h.put([[contact,{font:'Helvetica',size:z,color:SUB}]],cx,yy,{w:cw,align:'center'});yy+=h.lh(z)}
  return y+Math.max(hh,yy-y)};
 const titleBar=y=>{y+=mm(5);const tz=TY.title,pad=mm(3),rz=TY.term;
  const rp=(z,tag)=>{const a=h.lab('term',mode,z,{bold:1})[0].map(([s_,o])=>[s_+' '+term,o]),b=tag?h.lab('annual',mode,z,{bold:1})[0].map(([s_,o],i)=>[i?s_:' · '+s_,o]):[];
   return[...a,...b,...(sc.year?[['   '+sc.year,{font:'Helvetica',size:z,color:INK}]]:[])]};
  let rt=rp(rz,!!c.annual);if(h.lineW(rt)>CW*.5)rt=rp(rz,false);const avT=CW-h.lineW(rt)-mm(6);
  let tl=up(h.lab('title',mode,tz,{bold:1,color:P.c1}));if(both&&h.lineW(tl[0])>avT)tl=up(h.lab('title',mode,tz,{bold:1,color:P.c1,stack:1}));
  if(tl.length>1)tl[1]=tl[1].map(([t_,o])=>[t_.replace(/^\/ /,''),o]);
  const tbH=pad*2+h.blockH(tl);doc.lineWidth(.75).strokeColor(P.line).moveTo(L,y).lineTo(R_,y).moveTo(L,y+tbH).lineTo(R_,y+tbH).stroke();
  h.block(tl,L,y+pad);h.put(rt,L,y+(tbH-h.lh(rz))/2,{w:CW,align:'right'});return y+tbH};
 const identity=y=>{const dz=TY.detailLabel,vz=TY.detailValue;y+=mm(4);
  const labW=k_=>h.lineW(h.lab(k_,mode,dz,{color:SUB})[0]),labP=(k_,xx,yy2)=>h.put(h.lab(k_,mode,dz,{color:SUB})[0],xx,yy2+(vz-dz)*.55,{});
  {const lw=labW('name'),vx=L+lw+6,ls=h.nameLines(s.name,B,vz,R_-vx,R_-vx);labP('name',L,y);ls.forEach((t_,i)=>h.put([[t_,{font:B,size:vz,color:INK}]],vx,y+i*h.lh(vz),{}));y+=ls.length*h.lh(vz)+mm(1.8)}
  {const half=CW*.42,w1=labW('mat'),w2=labW('cls');labP('mat',L,y);labP('cls',L+half,y);
   const v1=h.ell(s.matricule,B,vz,half-w1-14),v2=h.ell(cls,B,vz,half-w2-6);
   h.put([[v1,{font:B,size:vz,color:INK}]],L+w1+6,y,{});h.put([[v2,{font:B,size:vz,color:INK}]],L+half+w2+6,y,{});y+=h.lh(vz)+mm(3.6)}
  return y};
 const tableHead=y=>{const sz=TY.section,o20=(mode=='fr'?T.out20[1]:T.out20[0])+(both?' / '+T.out20[1]:''),sl=[[...h.lab('results',mode,sz,{bold:1,color:P.c1})[0],[' · '+o20,{font:'Helvetica-Oblique',size:sz*TY.FR,color:SUB}]]];
  h.block(up(sl),L,y);y+=h.lh(sz)+mm(1.5);
  const hz=TY.th;doc.rect(L,y,CW,hdH).fill(P.tint);doc.lineWidth(1.3).strokeColor(P.c1).moveTo(L,y).lineTo(R_,y).stroke();doc.lineWidth(.75).strokeColor(P.line).moveTo(L,y+hdH).lineTo(R_,y+hdH).stroke();
  const hb={font:B,size:hz,color:P.c1},hcell=(i,txt,al='center')=>{const zz=h.fit(txt,B,hz,cw2[i]-(i?2:mm(2)),5);h.put([[txt,{...hb,size:zz}]],cxs[i]+(i?1:mm(2)),y+(hdH-h.lh(zz))/2,{w:cw2[i]-(i?2:mm(2)),align:al})};
  {const sl2=h.lab('subj',mode,hz,{bold:1,color:P.c1,stack:1}).map(l=>l.map(([t_,o])=>[t_,{...o,color:o.font=='Helvetica-Oblique'?SUB:P.c1}]));h.block(sl2,cxs[0]+mm(2),y+(hdH-h.blockH(sl2))/2)}
  (c.annual?[1,2,3].map(v=>'T'+v):c.seqs.map(q=>'Seq. '+q.n)).forEach((tx_,i)=>hcell(1+i,tx_));[[c.annual?'annual':'avg',1+k],['coef',2+k],['tot',3+k],['rank',4+k]].forEach(([kk,i])=>hcell(i,one(kk)));hcell(5+k,one('app'),'left');
  return y+hdH};
 const drawRows=(y,from,to,hsx)=>{for(let i=from;i<to;i++){const r=rows[i],rH=hsx[i],top=y;
   doc.lineWidth(.75).strokeColor(P.line).moveTo(L,top+rH).lineTo(R_,top+rH).stroke();
   const ln=lines[i],z=TY.subject,ls=ln.length>1?LS_:h.lh(z),by=top+(rH-ln.length*ls)/2,tx0=cxs[0]+mm(2);
   ln.forEach((t_,j)=>h.put([[t_,{font:TY.SUBJ,size:z,color:INK}]],tx0,by+j*ls,{}));
   const tk=tkOf(r);if(tk.length){const tz2=TY.teacher,lx=tx0+h.wid(ln[ln.length-1],TY.SUBJ,z)+z*1.1,t_=h.abbr(tk,TY.TEA,tz2,colW-(lx-tx0));h.put([[t_,{font:TY.TEA,size:tz2,color:SUB}]],lx,by+(ln.length-1)*ls+(z-tz2)*.55,{})}
   const mid=v=>top+(rH-v)/2,cell=(ci,txt,o={})=>{const f=o.bold?B:'Helvetica',zz=h.fit(txt,f,TY.mark,cw2[ci]-4,5);return h.put([[txt,{font:f,size:zz,color:o.red?FAIL:INK}]],cxs[ci],mid(zz),{w:cw2[ci],align:'center'})};
   r.cells.forEach((v,j)=>cell(1+j,v==null?'—':(c.annual?F2(v):F1(v)),{red:v!=null&&v<10}));
   cell(1+k,r.avg==null?'—':F2(r.avg),{bold:1,red:r.avg!=null&&r.avg<10});cell(2+k,String(r.coef));cell(3+k,r.avg==null?'—':F2(r.avg*r.coef));
   if(r.rank!=null){const z2=TY.mark,rw=h.wid(String(r.rank),'Helvetica',z2)+h.wid(' / '+r.of,'Helvetica-Oblique',z2*TY.FR),sc3=rw>cw2[4+k]-3?(cw2[4+k]-3)/rw:1;
    h.put([[String(r.rank),{font:'Helvetica',size:z2*sc3,color:INK}],[' / '+r.of,{font:'Helvetica-Oblique',size:z2*TY.FR*sc3,color:SUB}]],cxs[4+k],mid(z2*sc3),{w:cw2[4+k],align:'center'})}else cell(4+k,'—');
   if(r.avg!=null){const at=ap(r.avg)[mode=='fr'?1:0],az=h.fit(at,'Helvetica',TY.appr,cw2[5+k]-mm(1.5),5);h.put([[at,{font:'Helvetica',size:az,color:INK}]],cxs[5+k]+mm(1),mid(az),{})}
   y+=rH}return y};
 const pageNo=(p,N)=>h.put([[(sc.year||'')+' · '+p+' / '+N,{font:'Helvetica',size:TY.page,color:SUB}]],L,H-mm(10)-mm(5),{w:CW,align:'right'});
 const bottom=y=>{ // weighted totals, summary, meta, remarks (with fees owing), signatures, verification
  const tot=rows.filter(r=>r.avg!=null),sc2=tot.reduce((a,r)=>a+r.coef,0),st=tot.reduce((a,r)=>a+r.avg*r.coef,0),fz=TY.total,zm=TY.meta,zh=TY.panelTitle,zl=TY.sumLabel,zv=TY.sumValue;
  h.put(h.lab('wt',mode,fz,{bold:1})[0],L+mm(2),y+(ftH-h.lh(fz))/2,{});
  [[2+k,sc2?String(sc2):'—'],[3+k,sc2?F2(st):'—']].forEach(([ci,v])=>h.put([[v,{font:B,size:fz,color:INK}]],cxs[ci],y+(ftH-h.lh(fz))/2,{w:cw2[ci],align:'center'}));
  doc.lineWidth(1.3).strokeColor(P.c1).moveTo(L,y+ftH).lineTo(R_,y+ftH).stroke();y+=ftH;
  y+=mm(3);{const gap=mm(5),lw=CW*.445,rx=L+lw+gap*2,rw=R_-rx,big=(v,col,tail)=>[[v,{font:B,size:zv,color:col}],...(tail?[[tail,{font:'Helvetica',size:TY.sumTail,color:SUB}]]:[])];
   doc.lineWidth(2.2).strokeColor(P.c1).moveTo(L,y+1.1).lineTo(L+lw,y+1.1).stroke();
   const py=y+6,cell2=(ls_,xx,vp)=>{h.block(ls_,xx,py+h.lh(zh)+4);h.put(vp,xx,py+h.lh(zh)+4+h.blockH(lab2('tavg'))+3,{})};
   h.block(h.lab('sres',mode,zh,{bold:1,color:INK}),L,py);h.block(h.lab('cstat',mode,zh,{bold:1,color:INK}),rx,py);
   cell2(lab2(c.annual?'aavg':'tavg'),L,big(s.head==null?'—':F2(s.head),red(s.head)?FAIL:P.c1,' / 20'));
   cell2(lab2('orank'),L+lw*.52,big(s.rank==null?'—':String(s.rank),P.c1,' / '+(x.size||c.size)));
   [['cavg',c.stats.avg],['hi',c.stats.high],['lo',c.stats.low]].forEach(([kk,v],i)=>cell2(lab2(kk),rx+i*rw/3,big(v==null?'—':F2(v),red(v)?FAIL:INK,' / 20')));
   doc.lineWidth(.75).strokeColor(P.line).moveTo(L+lw+gap,y+3).lineTo(L+lw+gap,y+panelH-mm(2)).stroke();
   y+=panelH;doc.lineWidth(.75).strokeColor(P.line).moveTo(L,y-mm(1.2)).lineTo(R_,y-mm(1.2)).stroke()}
  y+=mm(1);{const part=(kk,v)=>[...h.lab(kk,mode,zm,{color:SUB})[0],['  '+v,{font:B,size:zm,color:INK}]];
   h.put(part('nsub',String(n)),L,y,{});h.put(part('app',s.head==null?'—':ap(s.head)[mode=='fr'?1:0]),L,y,{w:CW,align:'right'});
   if(x.honour){const hz=zm,txt=x.honour.name,tw=Math.min(CW*.4,h.wid(txt,B,hz)+mm(7)),bx=L+(CW-tw)/2,bh=h.lh(hz)+mm(1.6);doc.roundedRect(bx,y-mm(.8),tw,bh,bh/2).fill(P.c1);h.put([[txt,{font:B,size:h.fit(txt,B,hz,tw-mm(5),5),color:'#ffffff'}]],bx,y+mm(.1),{w:tw,align:'center'})}   // honour roll pill, centred between the two
   y+=h.lh(zm)+mm(2.5)}
  {h.put(h.lab('rem',mode,TY.remarks,{bold:1,color:P.c1})[0],L,y,{});
   if(x.fees!=null)h.put([...h.lab('fees',mode,TY.remarks,{color:SUB})[0],['  '+money(x.fees,mode),{font:B,size:TY.remarks,color:INK}]],L,y,{w:CW,align:'right'});
   const ry=y+h.lh(TY.remarks)+mm(5.5);doc.lineWidth(.5).strokeColor(P.line).moveTo(L,ry).lineTo(R_,ry).stroke()}
  let fy=footTop+mm(3);const sgw=(CW-mm(20))/2;
  for(const[i,[a,b]]of[['auth','princ'],['par','sigd']].entries()){const sx=L+i*(sgw+mm(20));h.block(h.lab(a,mode,TY.sig,{bold:1,stack:1}),sx,fy);
   doc.lineWidth(.75).strokeColor(P.line).moveTo(sx,fy+mm(14.5)).lineTo(sx+sgw,fy+mm(14.5)).stroke();
   h.put(h.fitLine(h.lab(b,mode,TY.sigNote,{color:SUB})[0],sgw,.8),sx,fy+mm(14.5)+3,{})}
  fy=footTop+mm(24);doc.lineWidth(.75).strokeColor(P.line).moveTo(L,fy).lineTo(R_,fy).stroke();fy+=mm(2.5);
  doc.image(x.qr,L,fy,{width:mm(20)});const tx=L+mm(23),fw=R_-tx,vz2=TY.verify;
  h.put(h.fitLine(h.lab('ver',mode,vz2,{bold:1})[0],fw,.8),tx,fy+3,{});
  const cy=fy+3+h.lh(vz2)+2;h.put(h.fitLine([...h.lab('code',mode,vz2,{})[0],[': ',{font:'Helvetica',size:vz2,color:INK}],[x.code,{font:B,size:vz2,color:INK}]],fw,.8),tx,cy,{});
  h.put([[x.url.replace(/^https?:\/\//,''),{font:'Helvetica',size:vz2,color:P.c1}]],tx,cy+h.lh(vz2)+2,{})};
 // ---- plan the pages. Single page when everything fits; otherwise rows continue on following pages (the type size never changes)
 strips();const yLH=letterhead(mm(12));let y=tableHead(identity(titleBar(yLH)));
 const pageEnd=H-mm(14),cap1=tableBottom-ftH-y;
 if(sumH_<=cap1){const free=cap1-sumH_,hsx=hs.map(v=>v+free/n);y=drawRows(y,0,n,hsx);bottom(y);pageNo(1,1);return 1}
 const y0c=mm(8)+(y-yLH);   // where the table starts on a continuation page (title bar + student + table head, no letterhead)
 const take=(from,cap,keepOne)=>{let used=0,j=from;while(j<n&&used+hs[j]<=cap){used+=hs[j];j++}if(j==from)j=from+1;if(keepOne&&n-j<4)j=Math.max(from+1,n-4);return j};
 const plan=[];let cur=0,yy=y;
 while(true){const last=cur>0&&hs.slice(cur).reduce((a,b)=>a+b,0)<=tableBottom-ftH-y0c;
  if(last){plan.push([cur,n,true]);break}
  const j=take(cur,pageEnd-(cur?y0c:y),true);plan.push([cur,j,false]);cur=j}
 const N=plan.length;
 plan.forEach(([a_,b_,isLast],pi)=>{if(pi){doc.addPage();strips();y=tableHead(identity(titleBar(mm(8))))}
  y=drawRows(y,a_,b_,hs);if(isLast)bottom(y);pageNo(pi+1,N)});
 return N}
// "Fees owing" on the card: only when the school has the fees module and has not switched the line off
const feesOn=sc=>(sc.card_fees??1)!=0&&(sc.modules||'reports,fees,tracking').includes('fees');
// Collects the whole PDF in memory first: a failure while drawing can then never leave a half-sent response.
// Builds the PDF in memory: {buf,list} (list = the students who got a card), or null when nobody qualifies.
async function renderBuf(o){const c=R.compute(o.sid,o.cid,o.term);
 // only students who had marks in the term when it was published have a card (report.js publish); everyone else is skipped
 const ids=c.students.map(s=>s.id),cards=Object.fromEntries(ids.length?db.prepare(`SELECT student_id,code,snap FROM cards WHERE term=? AND student_id IN(${ids.join(',')})`).all(o.term).map(r=>[r.student_id,r]):[]),
 list=c.students.filter(s=>cards[s.id]&&(!o.student||s.id==o.student)&&!(o.skip&&o.skip.has(s.id)));if(!list.length)return null;
 const cls=db.prepare('SELECT name FROM classes WHERE id=?').get(o.cid).name,qr={},sc=c.school,P=pal(sc),mode=['en','fr','both'].includes(o.lang)?o.lang:'both';
 const owe=feesOn(sc)?Object.fromEntries(F.rows(sc.id,{class_id:o.cid}).map(r=>[r.id,r.due[o.term-1]>0?Math.max(0,r.bal[o.term-1]):null])):{};
 for(const s of list)qr[s.id]=await QR.toBuffer(o.base+cards[s.id].code,{margin:1,width:240});
 const logo=sc.card_logo?Buffer.from(sc.card_logo.split(',')[1],'base64'):null,doc=new PDFDocument({size:'A4',margin:0,autoFirstPage:false});
 const buf=await toBuf(doc,()=>{for(const s of list){const k=cards[s.id];let size=0;try{size=JSON.parse(k.snap).size||0}catch{}
  doc.addPage();card(doc,{sc,P,c,s,cls,mode,term:o.term,qr:qr[s.id],code:k.code,url:o.base+k.code,logo,size:size||c.size,fees:owe[s.id]??null,honour:R.honour(sc,s,mode)})}});
 return{buf,list,cls}}
async function render(res,o){const r=await renderBuf(o);if(!r)return false;
 res.setHeader('Content-Type','application/pdf');res.setHeader('Content-Disposition',`attachment; filename="report-${(o.student?r.list[0].matricule:r.cls).replace(/\W+/g,'')}-T${o.term}.pdf"`);res.end(r.buf);return true}
// sample card for the settings preview (fictional student, n subjects)
const EN=['Mathematics','English','French','Physics','Biology','Chemistry','History','Geography','Citizenship','Computer Science','Physical Education','Religious Studies','Economics','Food & Nutrition','Art','Music','Technology','Literature','Philosophy','Accounting','Commerce','Geology','Further Mathematics','Home Economics','Woodwork','Agriculture','Law','Sociology','Statistics','Drama'],
 FRN=['Mathématiques','Anglais','Français','Physique','Biologie','Chimie','Histoire','Géographie','Éducation civique','Informatique','Éducation physique','Culture religieuse','Économie','Nutrition','Arts plastiques','Musique','Technologie','Littérature','Philosophie','Comptabilité','Commerce','Géologie','Mathématiques approfondies','Économie familiale','Travail manuel','Agriculture','Droit','Sociologie','Statistiques','Théâtre'],
 TE=['Mr. Emmanuel Njoya','Mrs. Grace Enoh','Mme. Sylvie Mballa','Mr. Paul Tchoua','Mrs. Anne Fomum','Mr. Victor Ngono','Mme. Claire Atemo','Mr. David Mbarga'];
async function preview(res,o){const sc=o.sc,mode=o.lang||sc.card_lang||'both',n=o.n,P=pal(sc),annual=o.term==3,seqs=[{n:2*(o.term-1)+1},{n:2*(o.term-1)+2}];let z=7;const rnd=()=>(z=(z*9301+49297)%233280)/233280;
 const mk5=()=>Math.round((5+rnd()*14)*2)/2,
 rows=Array.from({length:n},(_,i)=>{const marks=seqs.map(mk5),cells=annual?[0,1,2].map(t=>i%7==5&&t>0?null:Math.round((5+rnd()*14)*4)/4):marks,have=cells.filter(v=>v!=null),avg=have.reduce((a,v)=>a+v,0)/have.length;
  return{subject:(mode=='fr'?FRN:EN)[i%30],coef:1+Math.floor(rnd()*4),teacher:TE[i%TE.length],marks,cells,avg,rank:1+Math.floor(rnd()*30),of:32}});
 const tw=rows.reduce((a,r)=>a+r.avg*r.coef,0)/rows.reduce((a,r)=>a+r.coef,0),c={annual,seqs,stats:{avg:11.82,high:17.46,low:6.24},students:[],size:32},s={name:'Aminatou Bello',matricule:'26-0013',rows,termAvg:tw,head:tw,rank:16,annual:annual?tw:null};
 const qr=await QR.toBuffer('https://example.org/verify/RC-PREVIEW',{margin:1,width:240}),logo=sc.card_logo?Buffer.from(sc.card_logo.split(',')[1],'base64'):null;
 const doc=new PDFDocument({size:'A4',margin:0,autoFirstPage:false}),buf=await toBuf(doc,()=>{doc.addPage();card(doc,{sc:{...sc,year:sc.year||'2026 / 2027'},P,c,s,cls:'Form 1A',mode,term:o.term,qr,code:'RC-PREVIEW',url:'https://example.org/verify/RC-PREVIEW',logo,fees:feesOn(sc)?45000:null,honour:sc.hr_on&&R.hrTiers(sc).length?{name:R.hrTiers(sc)[0].name||R.HRDEF[mode]||R.HRDEF.both}:null})});
 res.setHeader('Content-Type','application/pdf');res.setHeader('Content-Disposition','inline; filename="report-card-preview.pdf"');res.end(buf)}
module.exports={render,renderBuf,preview,card,feesOn};
