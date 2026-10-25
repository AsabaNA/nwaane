// Chart kit: bar, line and donut as plain SVG strings. No library, so it prints and works offline.
// Calm by default: one brand blue for the data, red only for what is wrong, amber as the second category, grey for "not yet".
// Every chart sits in chCard(): title, hover tooltips, "view as table", and Print.
const CH={c1:'#455aff',c2:'#e8923a',red:'#c62828',gray:'#d5d9e4',ink:'#0a0c12',soft:'#4a4d56',grid:'#e6e8ef',surf:'#ffffff'};
const CHS={en:{table:'View as table',chart:'View as chart',print:'Print',none:'No data yet',total:'Total'},fr:{table:'Voir en tableau',chart:'Voir le graphique',print:'Imprimer',none:'Pas encore de données',total:'Total'}};
const chL=k=>(CHS[typeof L!='undefined'&&L=='fr'?'fr':'en'])[k],chE=x=>String(x??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const chN=n=>{n=+n||0;const a=Math.abs(n);return a>=1e6?(+(n/1e6).toFixed(1))+'M':a>=1e3?(+(n/1e3).toFixed(1))+'K':String(Math.round(n*10)/10)};
const chNice=m=>{if(m<=0)return 1;const p=Math.pow(10,Math.floor(Math.log10(m))),f=m/p;return(f<=1?1:f<=2?2:f<=5?5:10)*p};
const chCut=(s,n)=>{s=String(s);return s.length>n?s.slice(0,n-1)+'…':s};
// bar with a 4px rounded data end and a square baseline end
const chRect=(x,y,w,h,r,dir)=>{if(w<=0)return'';r=Math.min(r,w,h/2);return dir=='r'?`M${x},${y}h${w-r}a${r},${r} 0 0 1 ${r},${r}v${h-2*r}a${r},${r} 0 0 1 ${-r},${r}h${-(w-r)}z`:`M${x},${y+h}v${-(h-r)}a${r},${r} 0 0 1 ${r},${-r}h${w-2*r}a${r},${r} 0 0 1 ${r},${r}v${h-r}z`};
// items: [{l,v,red?,tip?}] (v a number) or [{l,v:[a,b]}] with opts.names/colors for a stacked bar. horizontal by default, opts.col for columns.
function chBar(items,o={}){const fmt=o.fmt||chN,st=Array.isArray(items[0]&&items[0].v),cols=o.colors||[CH.c1,CH.c2],names=o.names||[];
 const tot=i=>st?i.v.reduce((a,x)=>a+x,0):i.v,mx=o.max||(()=>{const m=Math.max(1,...items.map(tot));return Number.isInteger(m)&&m<4?4:chNice(m)})();
 if(!items.length)return`<p class=ch-none>${chL('none')}</p>`;
 const tipOf=i=>chE(i.tip||(st?`${i.l}: ${i.v.map((x,k)=>`${names[k]||''} ${fmt(x)}`).join(' · ')}`:`${i.l}: ${fmt(i.v)}`));
 if(o.col){const W=520,H=210,pl=34,pr=8,pt=14,pb=26,cw=(W-pl-pr)/items.length,bw=Math.min(24,cw-6),ih=H-pt-pb,y=v=>pt+ih-ih*v/mx;let g='',b='',x='';
  for(let k=0;k<=4;k++){const v=mx*k/4,yy=y(v);g+=`<line x1=${pl} x2=${W-pr} y1=${yy} y2=${yy} stroke="${CH.grid}"/><text x=${pl-6} y=${yy+4} text-anchor=end font-size=10.5 fill="${CH.soft}">${(o.axis||chN)(v)}</text>`}
  const every=Math.ceil(items.length/8);
  items.forEach((i,k)=>{const cx=pl+cw*k+cw/2,t=tot(i),h=ih*t/mx;let yy=pt+ih;const sv=st?i.v:[i.v];
   sv.forEach((v,j)=>{const hh=ih*v/mx;if(hh<=0)return;yy-=hh;const last=j==sv.length-1||sv.slice(j+1).every(z=>z<=0);b+=`<path d="${last?chRect(cx-bw/2,yy,bw,hh,4,'t'):`M${cx-bw/2},${yy}h${bw}v${hh}h${-bw}z`}" fill="${i.red?CH.red:(i.color||cols[j%cols.length])}"/>`;if(j<sv.length-1)b+=`<line x1=${cx-bw/2} x2=${cx+bw/2} y1=${yy} y2=${yy} stroke="${CH.surf}" stroke-width=2 />`});
   b+=`<rect x=${cx-cw/2} y=${pt} width=${cw} height=${ih} fill=transparent data-tip="${tipOf(i)}"/>`;
   if(k%every==0)x+=`<text x=${cx} y=${H-8} text-anchor=middle font-size=10.5 fill="${CH.soft}">${chE(chCut(i.l,10))}</text>`});
  return`<svg viewBox="0 0 ${W} ${H}" class=ch-svg role=img aria-label="${chE(o.label||'')}">${g}${b}${x}</svg>`}
 const lw=o.lw||108,W=440,rh=30,bh=Math.min(20,rh-8),pr=62,H=items.length*rh+6,sc=v=>(W-lw-pr)*v/mx;let b='';
 items.forEach((i,k)=>{const y=3+k*rh+(rh-bh)/2,sv=st?i.v:[i.v];let x=lw;b+=`<text x=${lw-8} y=${y+bh/2+4} text-anchor=end font-size=12 fill="${CH.ink}">${chE(chCut(i.l,18))}</text>`;
  sv.forEach((v,j)=>{const w=sc(v);if(w<=0)return;const last=j==sv.length-1||sv.slice(j+1).every(z=>z<=0),gap=j<sv.length-1&&sv.slice(j+1).some(z=>z>0)?2:0,col=i.red?CH.red:(i.color||cols[j%cols.length]);b+=`<path d="${last?chRect(x,y,w,bh,4,'r'):`M${x},${y}h${Math.max(0,w-gap)}v${bh}h${-Math.max(0,w-gap)}z`}" fill="${col}"/>`;x+=w});
  b+=`<text x=${x+6} y=${y+bh/2+4} font-size=12 font-weight=600 fill="${CH.ink}">${fmt(tot(i))}</text><rect x=0 y=${3+k*rh} width=${W} height=${rh} fill=transparent data-tip="${tipOf(i)}"/>`});
 return`<svg viewBox="0 0 ${W} ${H}" class=ch-svg role=img aria-label="${chE(o.label||'')}"><line x1=${lw} x2=${lw} y1=0 y2=${H} stroke="${CH.grid}"/>${b}</svg>`}
// series: [{name,v:[...]}]; x: labels. One series gets a wash under the line.
function chLine(x,series,o={}){const fmt=o.fmt||chN,W=520,H=220,pl=38,pr=18,pt=14,pb=28,iw=W-pl-pr,ih=H-pt-pb,all=series.flatMap(s=>s.v.filter(v=>v!=null)),mx=o.max||(()=>{const m=Math.max(1,...all);return all.every(Number.isInteger)&&m<4?4:chNice(m)})(),cols=o.colors||[CH.c1,CH.c2,CH.red];
 if(!x.length||!all.length)return`<p class=ch-none>${chL('none')}</p>`;
 const px=k=>pl+(x.length==1?iw/2:iw*k/(x.length-1)),py=v=>pt+ih-ih*v/mx;let g='',l='',d='',lab='';
 for(let k=0;k<=4;k++){const v=mx*k/4,yy=py(v);g+=`<line x1=${pl} x2=${W-pr} y1=${yy} y2=${yy} stroke="${CH.grid}"/><text x=${pl-6} y=${yy+4} text-anchor=end font-size=10.5 fill="${CH.soft}">${(o.axis||chN)(v)}</text>`}
 const every=Math.ceil(x.length/7);x.forEach((s,k)=>{if(k%every==0||k==x.length-1&&x.length<=7)lab+=`<text x=${px(k)} y=${H-8} text-anchor=middle font-size=10.5 fill="${CH.soft}">${chE(s)}</text>`});
 series.forEach((s,j)=>{const pts=s.v.map((v,k)=>v==null?null:[px(k),py(v)]),c=cols[j%cols.length];let p='',run=false;pts.forEach(q=>{if(!q){run=false;return}p+=(run?'L':'M')+q[0]+','+q[1];run=true});
  if(series.length==1&&pts.filter(Boolean).length>1){const f=pts.filter(Boolean);l+=`<path d="${p}L${f[f.length-1][0]},${pt+ih}L${f[0][0]},${pt+ih}z" fill="${c}" opacity=.1 stroke=none />`}
  l+=`<path d="${p}" fill=none stroke="${c}" stroke-width=2 stroke-linecap=round stroke-linejoin=round />`;
  const lastK=pts.map((q,k)=>q?k:-1).filter(k=>k>=0).pop();pts.forEach((q,k)=>{if(q&&(k==lastK||pts.filter(Boolean).length<=2))l+=`<circle cx=${q[0]} cy=${q[1]} r=4 fill="${c}" stroke="${CH.surf}" stroke-width=2 />`});
  if(lastK!=null&&lastK>=0&&o.endLabel!==false&&series.length==1)lab+=`<text x=${Math.min(W-4,pts[lastK][0])} y=${pts[lastK][1]-9} text-anchor=${lastK==x.length-1?'end':'middle'} font-size=11 font-weight=600 fill="${CH.ink}">${fmt(s.v[lastK])}</text>`});
 x.forEach((s,k)=>{const w=iw/Math.max(1,x.length-1),tip=`${s}: `+series.map(z=>(series.length>1?z.name+' ':'')+(z.v[k]==null?'—':fmt(z.v[k]))).join(' · ');d+=`<rect x=${px(k)-w/2} y=${pt} width=${w} height=${ih} fill=transparent data-tip="${chE(tip)}"/>`});
 return`<svg viewBox="0 0 ${W} ${H}" class=ch-svg role=img aria-label="${chE(o.label||'')}">${g}${l}${lab}${d}</svg>`}
// data: [{l,v,color}] ; center: {big,small}
function chDonut(data,o={}){const fmt=o.fmt||chN,tot=data.reduce((a,d)=>a+d.v,0);if(!tot)return`<p class=ch-none>${chL('none')}</p>`;
 const S=180,c=S/2,R=84,r=56;let a0=-Math.PI/2,p='',lg='';const live=data.filter(d=>d.v>0);
 live.forEach((d,k)=>{const col=d.color||[CH.c1,CH.c2,CH.gray,CH.red][k%4],full=live.length==1,sw=full?2*Math.PI-.0001:d.v/tot*2*Math.PI,gap=full?0:.025,s=a0+gap/2,e=a0+sw-gap/2,P=(rad,a)=>[c+rad*Math.cos(a),c+rad*Math.sin(a)],large=e-s>Math.PI?1:0,[x1,y1]=P(R,s),[x2,y2]=P(R,e),[x3,y3]=P(r,e),[x4,y4]=P(r,s);
  p+=`<path d="M${x1},${y1}A${R},${R} 0 ${large} 1 ${x2},${y2}L${x3},${y3}A${r},${r} 0 ${large} 0 ${x4},${y4}z" fill="${col}" data-tip="${chE(d.l)}: ${fmt(d.v)} (${Math.round(d.v/tot*100)}%)"/>`;a0+=sw});
 data.forEach((d,k)=>{const col=d.color||[CH.c1,CH.c2,CH.gray,CH.red][k%4];lg+=`<li><i style="background:${col}"></i><span>${chE(d.l)}</span><b>${fmt(d.v)}</b><small>${Math.round(d.v/tot*100)}%</small></li>`});
 const ce=o.center||{big:fmt(tot),small:chL('total')};
 return`<div class=ch-dn><svg viewBox="0 0 ${S} ${S}" class=ch-svg role=img aria-label="${chE(o.label||'')}">${p}<text x=${c} y=${c+2} text-anchor=middle font-size=26 font-weight=700 fill="${CH.ink}">${chE(ce.big)}</text><text x=${c} y=${c+20} text-anchor=middle font-size=11 fill="${CH.soft}">${chE(ce.small)}</text></svg><ul class=ch-lg>${lg}</ul></div>`}
// legend for multi-series bar/line
const chLegend=(names,cols=[CH.c1,CH.c2])=>`<ul class="ch-lg ch-lgr">${names.map((n,k)=>`<li><i style="background:${cols[k%cols.length]}"></i><span>${chE(n)}</span></li>`).join('')}</ul>`;
// the card around a chart. table: {head:[...],rows:[[...]]}
let CHI=0;
function chCard({id,title,sub='',body,table,legend='',cls=''}){id=id||'ch'+(++CHI);const tb=table?`<div class="ch-t" hidden><div style="overflow-x:auto"><table><tr>${table.head.map(h=>`<th>${chE(h)}`).join('')}${table.rows.map(r=>`<tr>${r.map((c,k)=>`<td${k?' class=n':''}>${chE(c)}`).join('')}`).join('')}</table></div></div>`:'';
 const ib=(fn,tt,svg)=>`<button type=button class="ch-ib" onclick="${fn}('${id}')" title="${tt}" aria-label="${tt}">${svg}</button>`;
 return`<section class="dp ch ${cls}" id="${id}"><div class=ch-h><div><h2>${chE(title)}</h2>${sub?`<p class=ch-s>${chE(sub)}</p>`:''}</div><div class="ch-b noprint">${table?ib('chTab',chL('table'),'<svg width=16 height=16 viewBox="0 0 24 24" fill=none stroke=currentColor stroke-width=1.9 stroke-linecap=round stroke-linejoin=round><rect x=3 y=4 width=18 height=16 rx=2 /><path d="M3 10h18M9 4v16" /></svg>'):''}${ib('chPrint',chL('print'),'<svg width=16 height=16 viewBox="0 0 24 24" fill=none stroke=currentColor stroke-width=1.9 stroke-linecap=round stroke-linejoin=round><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x=6 y=14 width=12 height=8 /></svg>')}</div></div><div class=ch-v>${body}</div>${legend}${tb}</section>`}
function chTab(id){const c=document.getElementById(id);if(!c)return;const t=c.querySelector('.ch-t'),v=c.querySelector('.ch-v'),lg=c.querySelector(':scope>.ch-lgr');t.hidden=!t.hidden;v.hidden=!t.hidden;if(lg)lg.hidden=!t.hidden;
 const b=c.querySelector('.ch-ib');if(b){b.title=b.ariaLabel=t.hidden?chL('table'):chL('chart')}}
// print: the chart and its table on one A4 page, under the school header when the app's print engine is there
async function chPrint(id){const c=document.getElementById(id);if(!c)return;const title=c.querySelector('h2').textContent,sub=(c.querySelector('.ch-s')||{}).textContent||'';
 const t=c.querySelector('.ch-t'),tbl=t?t.innerHTML:'',lg=c.querySelector(':scope>.ch-lgr'),app=typeof psHead=='function';let head;
 if(app){psClear();const br=await psBrand();head=psHead(br,title,chE(sub)+(sub?' · ':'')+chE(S.year||''),'')}else head=`<div class=phd><h1>${chE(title)}</h1><p class=sb2>${chE(sub)}</p></div>`;
 document.querySelectorAll('#psheet,#psst').forEach(x=>x.remove());
 document.body.insertAdjacentHTML('beforeend',`<div id=psheet><div class=ps>${head}<div class=chp>${c.querySelector('.ch-v').innerHTML}${lg?lg.outerHTML:''}${tbl?`<div class=chpt>${tbl}</div>`:''}</div></div></div><style id=psst>@page{size:A4 portrait;margin:12mm}</style>`);document.body.classList.add('psh');
 const done=()=>{document.querySelectorAll('#psheet,#psst').forEach(x=>x.remove());document.body.classList.remove('psh')};window.addEventListener('afterprint',done,{once:true});setTimeout(()=>print(),60)}
// hover tooltips (one floating box for every chart)
(()=>{let tip;const get=()=>tip||(tip=Object.assign(document.createElement('div'),{className:'ch-tip'}),document.body.appendChild(tip),tip);
 const show=e=>{const el=e.target.closest&&e.target.closest('[data-tip]');if(!el){get().style.display='none';return}const t=get();t.textContent=el.getAttribute('data-tip');t.style.display='block';const w=t.offsetWidth,x=Math.min(innerWidth-w-8,e.clientX+12);t.style.left=Math.max(8,x)+'px';t.style.top=(e.clientY+16)+'px'};
 document.addEventListener('pointermove',show);document.addEventListener('pointerdown',show);document.addEventListener('scroll',()=>tip&&(tip.style.display='none'),true)})();
