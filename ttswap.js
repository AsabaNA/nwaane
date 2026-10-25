// Can two cells of one class swap places? Pure function: no database, so it moves to Cloudflare unchanged.
// ctx: {cells:{'d:p':{s,t}}, np, ok2:[..], sub(id)->{name,md}, tbusy(t,d,p)->class name|null, un(t,d,p)->bool, tmax, tname(t)}
// → [{code,...}]. Empty array = the swap is fine. A cell may be empty (then it is a move).
function evaluate(ctx,A,B){return evaluateMany(ctx,[[A,B]])}
// Several cells at once (a block of consecutive lessons moved to another place). pairs=[[A,B],...]; every pair swaps.
function evaluateMany(ctx,pairs){
 const{cells,np,ok2,sub}=ctx,R=[],K=x=>x.d+':'+x.p;
 if(pairs.length==1){const[A,B]=pairs[0],ka=K(A),kb=K(B),a=cells[ka]||null,b=cells[kb]||null;
  if(ka==kb)return[{code:'same'}];if(!a&&!b)return[{code:'empty'}];
  if(a&&b&&a.s==b.s&&(a.k||0)==(b.k||0)&&(a.t||0)==(b.t||0))return[{code:'samesub'}]}
 else{const used=new Set();for(const[A,B]of pairs){for(const x of[K(A),K(B)]){if(used.has(x))return[{code:'overlap'}];used.add(x)}}
  if(pairs.every(([A,B])=>{const a=cells[K(A)]||null,b=cells[K(B)]||null;return(!a&&!b)||(a&&b&&a.s==b.s&&(a.k||0)==(b.k||0)&&(a.t||0)==(b.t||0))}))return[{code:'samesub'}]}
 const before=cells,after={...cells};
 for(const[A,B]of pairs){const a=before[K(A)]||null,b=before[K(B)]||null;delete after[K(A)];delete after[K(B)];if(b)after[K(A)]={...b};if(a)after[K(B)]={...a}}
 const seenR=new Set(),push=r=>{const k=JSON.stringify(r);if(!seenR.has(k)){seenR.add(k);R.push(r)}};
 const move=(x,to,from)=>{if(!x)return;const nm=sub(x.s).name;
  if(ctx.coff&&ctx.coff(to.d))push({code:'classoff',subject:nm,d:to.d});
  if(x.t){const at=ctx.tbusy(x.t,to.d,to.p);if(at)push({code:'busy',subject:nm,teacher:ctx.tname(x.t),cls:at,d:to.d,p:to.p});
   if(ctx.un(x.t,to.d,to.p))push({code:'away',subject:nm,teacher:ctx.tname(x.t),d:to.d,p:to.p});
   if(ctx.tmax>0&&to.d!=from.d){let n=0;for(const k in after){const[d]=k.split(':').map(Number);if(d==to.d&&after[k].t==x.t)n++}
    n+=ctx.tother?ctx.tother(x.t,to.d):0;if(n>ctx.tmax)push({code:'tmax',subject:nm,teacher:ctx.tname(x.t),n:ctx.tmax})}}};
 for(const[A,B]of pairs){move(before[K(A)]||null,B,A);move(before[K(B)]||null,A,B)}
 // grouping: a subject twice in a day must be back-to-back; and never more than its daily maximum
 const lk=c=>c.s+'.'+(c.k||0),day=(cs,d,key)=>{const o=[];for(let p=1;p<=np;p++){const c=cs[d+':'+p];if(c&&lk(c)==key)o.push(p)}return o};
 const split=ps=>{for(let i=1;i<ps.length;i++)if(ps[i]!=ps[i-1]+1||!ok2[ps[i-1]])return true;return false};
 const days=new Set(),lines=new Set();
 for(const[A,B]of pairs){days.add(A.d);days.add(B.d);for(const x of[before[K(A)],before[K(B)]])if(x)lines.add(lk(x))}
 for(const d of days)for(const ln of lines){
  const s=parseInt(ln),k=+ln.split('.')[1],pre=day(before,d,ln),post=day(after,d,ln),nm=sub(s,k).name;
  if(post.length>pre.length&&post.length>sub(s,k).md)push({code:'maxday',subject:nm,n:sub(s,k).md,d});
  if(post.length>1&&!sub(s,k).sp&&split(post)&&!(pre.length>1&&split(pre)))push({code:'split',subject:nm,d})}
 return R}
module.exports={evaluate,evaluateMany};
