// Regular timetable generator. Weekly requirement per subject -> a proposed timetable the principal previews, regenerates and applies.
// Hard rules: one subject per class per period, one class per teacher per period, teacher availability, max periods of a subject per day,
// optional teacher daily limit, doubles only across consecutive periods with no break between. Soft rules: spread over the week,
// heavy subjects in the morning, compact days (few free periods in the middle), few gaps for teachers.
const{db}=require('./db'),SC=require('./sched');
const DEF={morning:1,heavy:4,gaps:1,tmax:0,split:0};
const L_PRAC='practical',WEEKEND=5;   // days after Friday are only used when Monday to Friday is full
const cfgOf=sc=>{let c={};try{c=JSON.parse(sc.gen_cfg||'{}')}catch{}return{...DEF,...c}};
const rng=seed=>{let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}};
const BUDGET_MS=2500,MAX_TRIES=60;

// opt.classes: ids to (re)build, or none = every class with weekly requirements. opt.teacher: place only this teacher's lessons; everything else in the classes they teach in stays where it is.
function gather(sid,from,mode,opt={}){
 const sc=SC.school(sid),lay=SC.layout(sid,sc),days=lay.days,np=lay.periods.length,cfg=cfgOf(sc);
 const cls=db.prepare('SELECT id,name,off_days FROM classes WHERE school_id=? ORDER BY name').all(sid),off=Object.fromEntries(cls.map(c=>[c.id,new Set(String(c.off_days||'').split(',').filter(Boolean).map(Number))]));
 const subs=db.prepare('SELECT b.id,b.class_id,b.name,b.coef,b.teacher_id,u.name teacher,r.per_week,r.max_day,r.doubles,r.split_ok FROM subjects b LEFT JOIN users u ON u.id=b.teacher_id LEFT JOIN gen_req r ON r.subject_id=b.id WHERE b.school_id=? ORDER BY b.class_id,b.id').all(sid);
 const un=new Set(db.prepare('SELECT teacher_id||\':\'||day||\':\'||period k FROM unavail WHERE school_id=?').all(sid).map(r=>r.k));
 const cur=SC.slotsOn(sid,from).filter(s=>days.includes(s.day)&&s.period<=np);
 const ok2=[];for(let p=1;p<np;p++)ok2[p]=lay.periods[p-1].end==lay.periods[p].start;   // periods p and p+1 are back to back
 // morning = the periods before the longest break; with no break, the first half
 let mEnd=Math.ceil(np/2);if(lay.breaks.length){const br=[...lay.breaks].sort((a,b)=>(b.end-b.start)-(a.end-a.start))[0];mEnd=lay.periods.filter(p=>p.end<=br.start).length||mEnd}
 // teaching lines of every subject: theory lessons per teacher (main teacher gets what the team leaves) and one optional practical line
 const ext=db.prepare('SELECT t.subject_id,t.teacher_id,t.per_week FROM subject_teachers t JOIN subjects b ON b.id=t.subject_id WHERE b.school_id=?').all(sid),prac=db.prepare('SELECT p.* FROM subject_prac p JOIN subjects b ON b.id=p.subject_id WHERE b.school_id=?').all(sid);
 for(const b of subs){b.lines=linesOf(b,ext,prac)}
 let only=opt.classes&&opt.classes.length?new Set(opt.classes.map(Number)):null,tmode=0;
 if(opt.teacher){tmode=+opt.teacher;only=new Set(subs.filter(b=>b.lines.some(l=>l.t==tmode)).map(b=>b.class_id))}
 return{sc,lay,days,np,cfg,cls,subs,un,cur,ok2,mEnd,from,mode,only,tmode,off}}
function linesOf(b,ext,prac){const L=[],ex=ext.filter(x=>x.subject_id==b.id&&x.per_week>0&&x.teacher_id!=b.teacher_id),sum=ex.reduce((n,x)=>n+x.per_week,0),total=Math.max(b.per_week||0,sum),main=total-sum;
 if(total>0){if(main>0)L.push({k:0,t:b.teacher_id||0,n:main});for(const x of ex)L.push({k:0,t:x.teacher_id,n:x.per_week})}
 const p=prac.find(x=>x.subject_id==b.id);if(p&&p.per_week>0)L.push({k:1,t:p.teacher_id||0,n:p.per_week,dbl:p.doubles||0});
 b.total=total;b.prac=p||null;return L}
// is this teaching line part of what is being (re)built?
const lineIn=(G,b,l)=>(!G.only||G.only.has(b.class_id))&&(!G.tmode||l.t==G.tmode);
// may this subject have two lessons in a day that are not back to back?
const splitOk=(G,b)=>!!(G.cfg.split||(b&&b.split_ok));
const inScope=(G,b)=>b.lines.some(l=>lineIn(G,b,l));

// How many periods each class/teacher needs against what it has; used before generating and to explain failures.
function check(G){
 const cells=G.days.length*G.np,cneed={},tneed={},noreq=[],noteacher=[];
 for(const b of G.subs){
  if(!inScope(G,b))continue;
  if(!b.lines.length){noreq.push({class_id:b.class_id,subject_id:b.id,subject:b.name,has:b.per_week===0?1:0});continue}
  for(const l of b.lines){if(!lineIn(G,b,l))continue;
   cneed[b.class_id]=(cneed[b.class_id]||0)+l.n;
   if(l.t)tneed[l.t]=(tneed[l.t]||0)+l.n;else noteacher.push({class_id:b.class_id,subject_id:b.id,subject:b.name+(l.k?' ('+(L_PRAC)+')':'')})}}
 const tch=db.prepare("SELECT id,name FROM users WHERE school_id=? AND role='teacher' AND active=1 ORDER BY name").all(G.sc.id);
 const classes=G.cls.map(c=>({id:c.id,name:c.name,need:cneed[c.id]||0,cells:(G.days.filter(d=>!G.off[c.id].has(d)).length)*G.np}));
 const teachers=tch.filter(t=>tneed[t.id]).map(t=>{let blocked=0;for(const d of G.days)for(let p=1;p<=G.np;p++)if(G.un.has(t.id+':'+d+':'+p))blocked++;return{id:t.id,name:t.name,need:tneed[t.id],free:cells-blocked}});
 const bad=classes.filter(c=>c.need>c.cells).length+teachers.filter(t=>t.need>t.free).length;
 return{cells,classes,teachers,noreq:noreq.filter(x=>!x.has),noteacher,bad}}

function generate(G,seed0){
 const{days,np,cfg,ok2,mEnd,un}=G,ND=days.length,CELLS=ND*np,t0=Date.now();
 const reqSubs=G.subs.filter(b=>inScope(G,b));
 const curBy={};for(const s of G.cur)(curBy[s.subject_id+':'+(s.kind||0)+':'+(s.teacher_id||0)]??=[]).push(s);
 const scope=new Set(reqSubs.map(b=>b.class_id));
 // lessons of teachers in classes we are not touching are fixed: nothing may be placed on top of them
 const ext=new Set();for(const s of G.cur)if(!scope.has(s.class_id)&&s.teacher_id)ext.add(s.teacher_id+':'+s.day+':'+s.period);
 // teacher totals for difficulty ordering and failure reasons
 const tNeed={},cNeed={};for(const b of reqSubs)for(const l of b.lines)if(lineIn(G,b,l)){cNeed[b.class_id]=(cNeed[b.class_id]||0)+l.n;if(l.t)tNeed[l.t]=(tNeed[l.t]||0)+l.n}
 const tFree={};for(const t of Object.keys(tNeed)){let f=CELLS;for(const d of days)for(let p=1;p<=np;p++)if(un.has(t+':'+d+':'+p)||ext.has(t+':'+d+':'+p))f--;tFree[t]=f}
 let best=null;
 for(let k=0;k<MAX_TRIES&&(k==0||Date.now()-t0<BUDGET_MS);k++){
  const rnd=rng((seed0+k*7919)>>>0);
  const cg=new Map(),tb=new Map(),sd=new Map(),cl=new Map(),tl=new Map();   // class grid, teacher grid, subject-per-day, class day load, teacher day load
  const arr=()=>new Int32Array(CELLS).fill(-1);
  for(const c of G.cls){cg.set(c.id,arr());cl.set(c.id,new Int32Array(ND))}
  const U=[];let pinned=0;
  const mk=(b,size,pin,t,k)=>{k=k?1:0;const u={i:U.length,sp:splitOk(G,b),c:b.class_id,s:b.id,k,line:b.id*2+k,t:t||0,size,coef:b.coef,md:k?Math.max(2,size):Math.max(b.max_day||2,size),pin,at:null,ev:0};U.push(u);return u};
  const tg=t=>{let a=tb.get(t);if(!a){a=arr();tb.set(t,a);tl.set(t,new Int32Array(ND))}return a};
  const sdOf=s=>{let a=sd.get(s);if(!a){a=new Int32Array(ND);sd.set(s,a)}return a};
  const put=(u,di,p)=>{for(let q=0;q<u.size;q++){cg.get(u.c)[di*np+p-1+q]=u.i;if(u.t)tg(u.t)[di*np+p-1+q]=u.i}
   cl.get(u.c)[di]+=u.size;if(u.t)tl.get(u.t)[di]+=u.size;sdOf(u.line)[di]+=u.size;u.at=[di,p]};
  const take=u=>{const[di,p]=u.at;for(let q=0;q<u.size;q++){cg.get(u.c)[di*np+p-1+q]=-1;if(u.t)tb.get(u.t)[di*np+p-1+q]=-1}
   cl.get(u.c)[di]-=u.size;if(u.t)tl.get(u.t)[di]-=u.size;sdOf(u.line)[di]-=u.size;u.at=null};
  const todo=[];
  for(const x of G.cur){if(!G.tmode||!G.only.has(x.class_id)||x.teacher_id==G.tmode)continue;const b=G.subs.find(z=>z.id==x.subject_id);if(!b)continue;put(mk(b,1,true,x.teacher_id,x.kind),days.indexOf(x.day),x.period);pinned++}
  for(const b of reqSubs){let dl=b.doubles||0;
   for(const l of b.lines){if(!lineIn(G,b,l))continue;
    const pins=G.mode=='fill'?(curBy[b.id+':'+l.k+':'+l.t]||[]).slice(0,l.n):[];let need=l.n-pins.length;
    for(const s of pins){const u=mk(b,1,true,l.t,l.k);put(u,days.indexOf(s.day),s.period);pinned++}
    if(need<=0)continue;
    let dbl=l.k?Math.min(l.dbl||0,Math.floor(need/2)):Math.min(dl,Math.floor(need/2));if(!l.k)dl-=dbl;
    for(let x=0;x<dbl;x++)todo.push(mk(b,2,false,l.t,l.k));need-=dbl*2;
    for(let x=0;x<need;x++)todo.push(mk(b,1,false,l.t,l.k))}}
  // a pinned lesson from the current timetable may belong to a teacher who is now someone else: pins keep the subject's current teacher by design
  const hard=u=>u.size*3+(u.t?10*(tNeed[u.t]||0)/Math.max(1,tFree[u.t]||CELLS):0)+(u.md<2?1:0)+rnd()*2.5;
  const queue=todo.map(u=>[hard(u),u]).sort((a,b)=>b[0]-a[0]).map(x=>x[1]);
  const conflicts=(u,di,p)=>{
   if(p+u.size-1>np)return null;if(u.size==2&&!ok2[p])return null;
   if(sdOf(u.line)[di]+u.size>u.md)return null;
   if(G.off[u.c]&&G.off[u.c].has(days[di]))return null;
   const ev=[];const cgA=cg.get(u.c),d=days[di],tA=u.t?tg(u.t):null;
   for(let q=0;q<u.size;q++){const ci=di*np+p-1+q,x=cgA[ci];
    if(x>=0){if(U[x].pin)return null;if(!ev.includes(x))ev.push(x)}
    if(tA){if(un.has(u.t+':'+d+':'+(p+q))||ext.has(u.t+':'+d+':'+(p+q)))return null;const y=tA[ci];if(y>=0){if(U[y].pin)return null;if(!ev.includes(y))ev.push(y)}}}
   // the same subject twice in one day must sit in back-to-back periods: never split by a break or another subject (a free period is preferred)
   if(sdOf(u.line)[di]>0&&!u.sp){let touch=false,any=false;
    for(let q=1;q<=np;q++){const x=cgA[di*np+q-1];if(x<0||U[x].line!=u.line||ev.includes(x))continue;any=true;
     if((p+u.size==q&&ok2[q-1])||(p==q+1&&ok2[q]))touch=true}
    if(any&&!touch)return null}
   if(tA&&cfg.tmax>0){let load=tl.get(u.t)[di]+u.size;for(const x of ev)if(U[x].t==u.t&&U[x].at&&U[x].at[0]==di)load-=U[x].size;if(load>cfg.tmax)return null}
   return ev};
  const score=(u,di,p,nev)=>{let s=days[di]>WEEKEND?25*u.size:0;const sdv=sdOf(u.line),cgA=cg.get(u.c),tA=u.t?tg(u.t):null;
   if(sdv[di]>0)s+=5*sdv[di];if(di>0)s+=1.2*sdv[di-1];if(di<ND-1)s+=1.2*sdv[di+1];
   s+=0.7*cl.get(u.c)[di];
   const occ=(a,di2,p2)=>p2>=1&&p2<=np&&a[di2*np+p2-1]>=0;
   if(cl.get(u.c)[di]>0){if(!occ(cgA,di,p-1)&&!occ(cgA,di,p+u.size))s+=3}else s+=0.8*(p-1);
   if(cfg.morning){const heavy=u.coef>=cfg.heavy;if(heavy&&p+u.size-1>mEnd)s+=4*u.size;else if(!heavy&&p<=mEnd)s+=0.3}
   if(tA&&cfg.gaps&&tl.get(u.t)[di]>0&&!occ(tA,di,p-1)&&!occ(tA,di,p+u.size))s+=2.5;
   return s+6*nev+rnd()*0.6};
  const lost=[];let steps=0;const cap=Math.max(400,U.length*40);
  while(queue.length&&steps++<cap){
   const u=queue.shift();let bs=null;
   for(let di=0;di<ND;di++)for(let p=1;p<=np;p++){const ev=conflicts(u,di,p);if(!ev||ev.length>u.size)continue;const s=score(u,di,p,ev.length);if(!bs||s<bs.s)bs={s,di,p,ev}}
   if(!bs){lost.push(u);continue}
   for(const x of bs.ev){const v=U[x];take(v);if(++v.ev<=6)queue.push(v);else lost.push(v)}
   put(u,bs.di,bs.p)}
  for(const u of queue)lost.push(u);
  // quality of the result (lower is better)
  let q=0,gapC=0,gapT=0,pm=0,rep=0;
  for(const c of G.cls){const a=cg.get(c.id);for(let di=0;di<ND;di++){let first=-1,last=-1,n=0;for(let p=0;p<np;p++)if(a[di*np+p]>=0){if(first<0)first=p;last=p;n++}if(n)gapC+=last-first+1-n}}
  for(const[t,a]of tb){for(let di=0;di<ND;di++){let first=-1,last=-1,n=0;for(let p=0;p<np;p++)if(a[di*np+p]>=0){if(first<0)first=p;last=p;n++}if(n)gapT+=last-first+1-n}}
  for(const u of U)if(u.at){if(u.coef>=cfg.heavy&&u.at[1]+u.size-1>mEnd)pm+=u.size}
  for(const a of sd.values())for(let di=0;di<ND;di++)if(a[di]>1)rep+=a[di]-1;
  q=gapC*3+gapT*(cfg.gaps?1.5:0.2)+pm*(cfg.morning?2:0)+rep*1;
  const key=lost.reduce((n,u)=>n+u.size,0)*1000+q;
  if(!best||key<best.key){
   best={key,q,gapC,gapT,pm,rep,lost:lost.map(u=>({c:u.c,s:u.s,k:u.k,t:u.t,size:u.size})),tries:k+1,
    placed:U.filter(u=>u.at).map(u=>({c:u.c,s:u.s,k:u.k,t:u.t,size:u.size,di:u.at[0],p:u.at[1],pin:u.pin})),total:U.reduce((n,u)=>n+u.size,0)}}
  if(!best.lost.length&&best.q==0)break}
 return{best,scope,tNeed,tFree,cNeed,CELLS}}

// Turn a generator result into proposal cells, per-class stats and reasons for what did not fit.
function build(G,seed){
 const R=generate(G,seed),B=R.best,cn=Object.fromEntries(G.cls.map(c=>[c.id,c.name])),sub=Object.fromEntries(G.subs.map(b=>[b.id,b])),tn=Object.fromEntries(db.prepare('SELECT id,name FROM users WHERE school_id=?').all(G.sc.id).map(u=>[u.id,u.name]));
 const cells=[];
 for(const x of B.placed)for(let k=0;k<x.size;k++)cells.push({c:x.c,d:G.days[x.di],p:x.p+k,s:x.s,k:x.k||0,t:x.t||null});
 const agg={};
 for(const l of B.lost){const k=l.c+':'+l.s+':'+l.k,b=sub[l.s];const a=agg[k]??={class_id:l.c,cls:cn[l.c],subject_id:l.s,kind:l.k,subject:b.name+(l.k?' ('+L_PRAC+')':''),n:0,reason:'tight'};a.n+=l.size;
  if(l.t&&R.tNeed[l.t]>R.tFree[l.t])a.reason='teacher';else if(R.cNeed[l.c]>R.CELLS)a.reason='class';else if(!l.t)a.reason='tight';
  if(l.t)a.teacher=tn[l.t]}
 return{cells,scope:[...R.scope],stats:{total:B.total,placed:B.total-B.lost.reduce((n,u)=>n+u.size,0),unplaced:Object.values(agg),gap_class:B.gapC,gap_teacher:B.gapT,heavy_pm:B.pm,repeat:B.rep,split:splitCount(G,cells),tries:B.tries}}}

// What applying a proposal would change, against the timetable in force on `from`.
function diff(G,cells,scope){
 const sc=new Set(scope),cur={},want={};
 for(const s of G.cur)if(sc.has(s.class_id))cur[s.class_id+':'+s.day+':'+s.period]=s;
 for(const c of cells)want[c.c+':'+c.d+':'+c.p]=c;
 const ops=[];
 for(const k of new Set([...Object.keys(cur),...Object.keys(want)])){const h=cur[k],w=want[k];
  if(!h&&!w)continue;if(h&&w&&h.subject_id==w.s&&(h.teacher_id||null)==(w.t||null)&&(h.kind||0)==(w.k||0))continue;
  const[c,d,p]=k.split(':').map(Number);ops.push({c,d,p,s:w?w.s:null,t:w?w.t:null,k:w?w.k||0:0})}
 return ops}

// Recompute the quality numbers of a proposal after the principal edited some cells by hand.
function restat(G,cells){
 const cn=Object.fromEntries(G.cls.map(c=>[c.id,c.name])),sub=Object.fromEntries(G.subs.map(b=>[b.id,b])),cnt={},cg={},tg={},sd={};let pm=0,rep=0,gapC=0,gapT=0;
 for(const c of cells){const kk=c.s+':'+(c.k||0);cnt[kk]=(cnt[kk]||0)+1;((cg[c.c+':'+c.d]??=[]).push(c.p));if(c.t)(tg[c.t+':'+c.d]??=[]).push(c.p);const k=kk+':'+c.d;sd[k]=(sd[k]||0)+1;
  const b=sub[c.s];if(b&&b.coef>=G.cfg.heavy&&c.p>G.mEnd)pm++}
 const gaps=o=>{let n=0;for(const a of Object.values(o)){const mn=Math.min(...a),mx=Math.max(...a);n+=mx-mn+1-a.length}return n};
 for(const v of Object.values(sd))if(v>1)rep+=v-1;gapC=gaps(cg);gapT=gaps(tg);
 const sp=splitCount(G,cells);
 const unplaced=[],scope=new Set();let total=0,placed=0;
 for(const b of G.subs){if(!b.lines.length||(G.only&&!G.only.has(b.class_id)))continue;scope.add(b.class_id);
  for(const k of[0,1]){const want=b.lines.filter(l=>l.k==k).reduce((n,l)=>n+l.n,0);if(!want)continue;total+=want;const n=cnt[b.id+':'+k]||0;placed+=Math.min(n,want);
   if(n<want)unplaced.push({class_id:b.class_id,cls:cn[b.class_id],subject_id:b.id,kind:k,subject:b.name+(k?' ('+L_PRAC+')':''),n:want-n,reason:'tight',...(b.teacher?{teacher:b.teacher}:{})})}}
 return{total,placed,unplaced,gap_class:gapC,gap_teacher:gapT,heavy_pm:pm,repeat:rep,split:sp,tries:0}}
// subject-days where the same subject is not in one back-to-back block
function splitCount(G,cells){const m={},sb=Object.fromEntries(G.subs.map(b=>[b.id,b]));for(const c of cells)(m[c.c+':'+c.d+':'+c.s+'.'+(c.k||0)]??=[]).push(c.p);let n=0;
 for(const[k,a]of Object.entries(m)){if(a.length<2||splitOk(G,sb[parseInt(k.split(':')[2])]))continue;a.sort((x,y)=>x-y);for(let i=1;i<a.length;i++)if(a[i]!=a[i-1]+1||!G.ok2[a[i-1]]){n++;break}}return n}
// Bring an existing proposal in line with the current requirements and rules while touching as few lessons as possible:
// surplus lessons of a subject are removed (the ones whose absence hurts least), missing ones are added in the best free place.
// opt.subject: only this subject. opt.drop: also remove lessons that now break a rule (teacher away, class not in that day).
// Nothing else moves. Returns {cells, added, removed, short:[{s,n}]}.
function reconcile(G,cells0,scope,opt={}){
 const sc=new Set(scope),sub=Object.fromEntries(G.subs.map(b=>[b.id,b])),{np,ok2,un,cfg,mEnd}=G,key=(a,b,c)=>a+':'+b+':'+c;
 let cells=cells0.map(c=>({...c,k:c.k||0})),occ,tocc;const removed=[],added=[],short=[];
 const ext=new Set();for(const x of G.cur)if(!sc.has(x.class_id)&&x.teacher_id)ext.add(key(x.teacher_id,x.day,x.period));
 const idx=()=>{occ=new Map();tocc=new Map();for(const c of cells){occ.set(key(c.c,c.d,c.p),c);if(c.t)tocc.set(key(c.t,c.d,c.p),c)}};idx();
 const offOn=(cid,d)=>G.off[cid]&&G.off[cid].has(d);
 const md=(b,k)=>k?2:Math.max(b.max_day||2,b.doubles?2:1);
 const dayCells=(cid,d,s,k)=>{const o=[];for(let p=1;p<=np;p++){const c=occ.get(key(cid,d,p));if(c&&(s==null||(c.s==s&&c.k==k)))o.push(p)}return o};
 const tLoad=(t,d)=>{let n=0;for(let p=1;p<=np;p++)if(tocc.has(key(t,d,p)))n++;return n};
 // the teaching lines we may touch
 const lines=[];for(const b of G.subs)if(sc.has(b.class_id))for(const l of b.lines)if(lineIn(G,b,l)&&(!opt.subject||b.id==opt.subject))lines.push({b,l});
 const mineCell=c=>{const b=sub[c.s];return b&&sc.has(b.class_id)&&b.lines.some(l=>l.k==c.k&&(l.t||0)==(c.t||0)&&lineIn(G,b,l))&&(!opt.subject||b.id==opt.subject)};
 // 1. lessons that break a rule now
 if(opt.drop){const keep=[];for(const c of cells){if(mineCell(c)&&(offOn(c.c,c.d)||(c.t&&un.has(key(c.t,c.d,c.p)))))removed.push({s:c.s,k:c.k,t:c.t,c:c.c,d:c.d,p:c.p});else keep.push(c)}cells=keep;idx()}
 const same=(c,b,l)=>c.s==b.id&&c.k==l.k&&(c.t||0)==(l.t||0);
 const cnt=(b,l)=>cells.reduce((n,c)=>n+same(c,b,l),0);
 // 2. surplus
 const harm=c=>{const b=sub[c.s];let h=0;const d=c.d,occd=p=>p>=1&&p<=np&&occ.has(key(c.c,d,p));
  if(d>WEEKEND)h-=3;if(dayCells(c.c,d,c.s,c.k).length>1)h-=2;
  const l=occd(c.p-1),r=occd(c.p+1);if(l&&r)h+=4;else if(!l&&!r&&dayCells(c.c,d).length>1)h-=1;
  if(c.t){const tl=p=>p>=1&&p<=np&&tocc.has(key(c.t,d,p));if(tl(c.p-1)&&tl(c.p+1))h+=1.5}
  if(b&&b.coef<cfg.heavy&&c.p>mEnd)h-=0.5;return h-(c.p+G.days.indexOf(d)*np)*0.001};
 for(const{b,l}of lines){let extra=cnt(b,l)-l.n;
  while(extra>0){const own=cells.filter(c=>same(c,b,l));if(!own.length)break;
   let w=null,wh=1e9;for(const c of own){const h=harm(c);if(h<wh){wh=h;w=c}}
   cells=cells.filter(c=>c!==w);idx();removed.push({s:w.s,k:w.k,t:w.t,c:w.c,d:w.d,p:w.p});extra--}}
 // 3. missing
 const canPut=(b,l,d,p)=>{if(offOn(b.class_id,d)||occ.has(key(b.class_id,d,p)))return false;
  const t=l.t;if(t){const k=key(t,d,p);if(un.has(k)||ext.has(k)||tocc.has(k))return false;if(cfg.tmax>0&&tLoad(t,d)+1>cfg.tmax)return false}
  const sm=dayCells(b.class_id,d,b.id,l.k);if(sm.length+1>md(b,l.k))return false;
  if(sm.length&&!splitOk(G,b)&&!sm.some(q=>(p==q+1&&ok2[q])||(p+1==q&&ok2[p])))return false;return true};
 const sc2=(b,l,d,p)=>{let s=d>WEEKEND?25:0;const same1=dayCells(b.class_id,d,b.id,l.k).length,di=G.days.indexOf(d),dd=o=>{const x=G.days[di+o];return x==null?0:dayCells(b.class_id,x,b.id,l.k).length};
  s+=5*same1+1.2*(dd(-1)+dd(1));const load=dayCells(b.class_id,d).length;s+=0.7*load;
  const has=q=>q>=1&&q<=np&&occ.has(key(b.class_id,d,q));
  if(load>0){if(!has(p-1)&&!has(p+1))s+=3}else s+=0.8*(p-1);
  if(cfg.morning){const heavy=b.coef>=cfg.heavy;if(heavy&&p>mEnd)s+=4;else if(!heavy&&p<=mEnd)s+=0.3}
  if(l.t&&cfg.gaps&&tLoad(l.t,d)>0&&!tocc.has(key(l.t,d,p-1))&&!tocc.has(key(l.t,d,p+1)))s+=2.5;
  return s};
 for(const{b,l}of lines){let need=l.n-cnt(b,l);
  while(need>0){let best=null;
   for(const d of G.days)for(let p=1;p<=np;p++){if(!canPut(b,l,d,p))continue;const s=sc2(b,l,d,p);if(!best||s<best.s)best={s,d,p}}
   if(!best)break;
   cells.push({c:b.class_id,d:best.d,p:best.p,s:b.id,k:l.k,t:l.t||null});idx();added.push({s:b.id,k:l.k,t:l.t,c:b.class_id,d:best.d,p:best.p});need--}
  if(need>0)short.push({s:b.id,k:l.k,n:need})}
 return{cells,added,removed,short}}
module.exports={reconcile,splitOk,splitCount,DEF,cfgOf,gather,check,build,diff,restat};
