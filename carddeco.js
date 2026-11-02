// Report card page decoration: the top and bottom edge only. Each design is a list of shapes in millimetres for the TOP edge of an A4 page
// (210 wide, DEPTH tall); the bottom edge is the same drawing mirrored. Colours: c1 (main), c2 (second), t (light tint of c1).
// The same shapes feed the PDF (pdfkit) and the small previews in Settings (SVG), so what you pick is what prints.
const WIDTH=210,DEPTH=7;
const R=(x,y,w,h,c)=>({t:'r',x,y,w,h,c}),C=(x,y,r,c)=>({t:'c',x,y,r,c}),P=(pts,c)=>({t:'p',pts,c});
const rep=(from,to,step,f)=>{const o=[];for(let x=from;x<=to+1e-6;x+=step)o.push(...[].concat(f(x)));return o};
const DESIGNS={
 bars:()=>[R(0,0,WIDTH,3,'c1'),R(0,3,WIDTH,1,'c2')],
 circles:()=>[R(0,0,WIDTH,.9,'c1'),...rep(3.5,WIDTH+7,7,x=>C(x,.9,2.5,'c2')),...rep(0,WIDTH+7,7,x=>C(x,.9,3.1,'c1')),...rep(3.5,WIDTH+7,7,x=>C(x,.9,1.1,'c1')),R(0,6.2,WIDTH,.7,'c2')],
 triangles:()=>[R(0,0,WIDTH,1.4,'c1'),...rep(0,WIDTH,7,x=>P([[x,1.4],[x+7,1.4],[x+3.5,5.4]],'c1')),...rep(0,WIDTH,7,x=>P([[x+1.2,1.4],[x+5.8,1.4],[x+3.5,4.1]],'c2')),R(0,6.2,WIDTH,.7,'c2')],
 diamonds:()=>[R(0,0,WIDTH,1,'c1'),...rep(0,WIDTH+8,8,x=>P([[x,1.2],[x+3.2,3.6],[x,6],[x-3.2,3.6]],'c1')),...rep(4,WIDTH+8,8,x=>P([[x,1.4],[x+2.4,3.6],[x,5.8],[x-2.4,3.6]],'c2')),R(0,6.4,WIDTH,.6,'c2')],
 waves:()=>{const w=(a,ph,y0)=>{const pts=[[0,0]];for(let x=0;x<=WIDTH;x+=1.5)pts.push([x,y0+a*Math.sin(x/WIDTH*Math.PI*2*9+ph)]);pts.push([WIDTH,0]);return P(pts,'')};
  const hi=w(1.2,0,5.6),mid=w(1.2,1.6,4.0),lo=w(1.1,3.1,2.4);hi.c='t';mid.c='c2';lo.c='c1';return[hi,mid,lo]},
 dots:()=>[...rep(1.75,WIDTH,3.5,x=>C(x,1.2,1.15,'c1')),...rep(0,WIDTH+3.5,3.5,x=>C(x,3.2,1,'c2')),...rep(1.75,WIDTH,3.5,x=>C(x,4.9,.7,'c1')),...rep(0,WIDTH+3.5,3.5,x=>C(x,6.3,.45,'c2'))],
 mosaic:()=>{const o=[],S=2.1,G=.4;let z=7;const rnd=()=>(z=(z*9301+49297)%233280)/233280;
  for(let r=0;r<3;r++)for(let i=0;i*(S+G)<WIDTH;i++){const p=rnd(),lim=[.95,.7,.4][r];if(p>lim)continue;o.push(R(i*(S+G),r*(S+G),S,S,p<lim*.5?'c1':'c2'))}return o}
};
const IDS=Object.keys(DESIGNS),DEFAULT='bars',ok=id=>IDS.includes(id)?id:DEFAULT;
const shapes=id=>DESIGNS[ok(id)]();
// ---- PDF: draw the top edge, then the same thing mirrored at the bottom
function draw(doc,pal,id,W,H){const k=W/WIDTH,col={c1:pal.c1,c2:pal.c2,t:pal.tint},S=shapes(id),one=()=>{for(const s of S){const f=col[s.c];
  if(s.t=='r')doc.rect(s.x*k,s.y*k,s.w*k,s.h*k).fill(f);else if(s.t=='c')doc.circle(s.x*k,s.y*k,s.r*k).fill(f);
  else{doc.moveTo(s.pts[0][0]*k,s.pts[0][1]*k);for(const[x,y]of s.pts.slice(1))doc.lineTo(x*k,y*k);doc.closePath().fill(f)}}};
 doc.save();one();doc.restore();doc.save();doc.translate(0,H);doc.scale(1,-1);one();doc.restore()}
// ---- SVG (small preview in Settings): the top edge only, in the given colours
function svg(id,pal,height=DEPTH){const col={c1:pal.c1,c2:pal.c2,t:pal.tint},f=s=>col[s.c];
 return`<svg viewBox="0 0 ${WIDTH} ${DEPTH}" preserveAspectRatio="none" aria-hidden="true">`+shapes(id).map(s=>s.t=='r'?`<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" fill="${f(s)}"/>`:s.t=='c'?`<circle cx="${s.x}" cy="${s.y}" r="${s.r}" fill="${f(s)}"/>`:`<polygon points="${s.pts.map(p=>p.map(v=>+v.toFixed(2)).join(',')).join(' ')}" fill="${f(s)}"/>`).join('')+'</svg>'}
module.exports={WIDTH,DEPTH,IDS,DEFAULT,ok,shapes,draw,svg};
