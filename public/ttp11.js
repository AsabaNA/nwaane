// Phase 10r: "Select lessons" — pick a block of consecutive lessons of one class and move it to another day or place in one go.
// Tap a lesson, then another on the same day: everything between is one block. Tap a lesson on another day (or drag the block) to swap the two blocks.
Object.assign(D.en,{sel_btn:'Select lessons',sel_on:'Selecting lessons',sel_tip:'Tap a lesson, then another one on the same day to select everything between. Then tap where it should go, or drag the block there. Doubles are selected together.',sel_n:'[n] lesson(s) selected',sel_clear:'Clear',sw_overlap:'The two blocks overlap.',sw_range:'The block does not fit there: not enough periods left in the day.',sw_classoff:'The class is not in school that day.'});
Object.assign(D.fr,{sel_btn:'Sélectionner des cours',sel_on:'Sélection de cours',sel_tip:'Touchez un cours, puis un autre le même jour pour sélectionner tout ce qui est entre. Touchez ensuite l’endroit où le placer, ou glissez le bloc. Les doubles sont sélectionnés ensemble.',sel_n:'[n] cours sélectionné(s)',sel_clear:'Effacer',sw_overlap:'Les deux blocs se chevauchent.',sw_range:'Le bloc ne tient pas ici : pas assez de périodes dans la journée.',sw_classoff:'La classe n’a pas cours ce jour-là.'});
for(const L of['en','fr'])if(!D[L].sw_classoff)D[L].sw_classoff=L=='en'?'The class is not in school that day.':'La classe n’a pas cours ce jour-là.';
const TWB={on:0,root:null,a:null,n:0,map:null,anchor:null,last:null};window.TWB=TWB;
const twSelBtn=()=>`<button type=button class="tw-btn ghost blue tw-selbtn${TWB.on?' on':''}" aria-pressed="${TWB.on?'true':'false'}" onclick="twSelMode()">☑ ${t(TWB.on?'sel_on':'sel_btn')}</button>`;window.twSelBtn=twSelBtn;
const twBCells=root=>[...root.querySelectorAll('.tw-cell.dd')];
const twBCell=(root,d,p)=>root.querySelector(`.tw-cell.dd[data-d="${d}"][data-p="${p}"]`);
const twBSame=(a,b)=>a&&b&&!a.classList.contains('free')&&!b.classList.contains('free')&&a.innerText.trim()==b.innerText.trim();
// a double (same lesson in two periods in a row) is always selected as one
function twBExpand(root,d,p0,p1){let lo=Math.min(p0,p1),hi=Math.max(p0,p1);
 for(;;){const a=twBCell(root,d,lo-1),b=twBCell(root,d,lo);if(twBSame(a,b))lo--;else break}
 for(;;){const a=twBCell(root,d,hi),b=twBCell(root,d,hi+1);if(twBSame(a,b))hi++;else break}
 return[lo,hi]}
function twBDeco(){document.body.classList.toggle('tw-selmode',!!TWB.on);document.querySelectorAll('.tw-cell.tw-dbl').forEach(e=>e.classList.remove('tw-dbl'));
 if(!TWB.on)return;for(const id of['twgrid','twgrid2']){const root=document.getElementById(id);if(!root)continue;for(const c of twBCells(root)){const n=twBCell(root,c.dataset.d,+c.dataset.p+1);if(twBSame(c,n)){c.classList.add('tw-dbl');n.classList.add('tw-dbl')}}}}
window.twBDeco=twBDeco;
function twBWhy(c,html){let w=document.getElementById('twwhy');if(!w){w=document.createElement('div');w.id='twwhy';w.className='tw-why';w.setAttribute('role','alert');document.body.appendChild(w)}w.innerHTML=html;const r=c.getBoundingClientRect(),h=w.offsetHeight;w.style.left=Math.max(8,Math.min(innerWidth-w.offsetWidth-8,r.left+r.width/2-w.offsetWidth/2))+'px';w.style.top=(r.top-h-8<8?r.bottom+8:r.top-h-8)+'px';clearTimeout(w._t);w._t=setTimeout(()=>w.remove(),3600)}
function twBClear(keepMode){TWB.root=null;TWB.a=null;TWB.n=0;TWB.map=null;TWB.anchor=null;document.querySelectorAll('.tw-cell.glow-ok,.tw-cell.glow-bad,.tw-cell.bsel').forEach(e=>e.classList.remove('glow-ok','glow-bad','bsel'));const w=document.getElementById('twwhy');if(w)w.remove();const i=document.getElementById('twbinfo');if(i)i.remove()}
function twSelMode(){TWB.on=TWB.on?0:1;twBClear();document.querySelectorAll('.tw-selbtn').forEach(b=>{b.classList.toggle('on',!!TWB.on);b.setAttribute('aria-pressed',TWB.on?'true':'false');b.innerHTML='☑ '+t(TWB.on?'sel_on':'sel_btn')});twBDeco();if(TWB.on&&!document.getElementById('twbtip')){}}
window.twSelMode=twSelMode;
function twBCtx(root){const live=!(TW.scr=='res'&&TW.prop);
 if(!live)return{url:`timetable/gen/${TW.prop.id}/swap`,body:()=>({class_id:root.id=='twgrid2'?TW.pv2:TW.pv}),done:async d=>{TW.prop=d;TW.live='';await palLoad();twRes()}};
 return{url:'timetable/swap',body:()=>({class_id:root.id=='twgrid2'?TW.cid2:TW.cid,from:TT.date}),done:()=>{TW.msg=`<p class="box ok">${t('sw_done')}</p>`;twRender()}}}
// the block a pointer-down on cell c would pick up (null when c is not in the selected block)
window.twBFor=(root,c)=>{if(!TWB.n||TWB.root!==root.id||!c.classList.contains('bsel'))return null;return{a:{...TWB.a},n:TWB.n}};
async function twBPaint(root){const ctx=twBCtx(root);
 root.querySelectorAll('.tw-cell').forEach(e=>e.classList.remove('bsel','glow-ok','glow-bad'));
 const d=TWB.a.d;for(let i=0;i<TWB.n;i++){const c=twBCell(root,d,TWB.a.p+i);if(c)c.classList.add('bsel')}
 let i=document.getElementById('twbinfo');if(!i){i=document.createElement('div');i.id='twbinfo';i.className='tw-binfo noprint';root.parentNode.insertBefore(i,root)}
 i.innerHTML=`<span>${tgF('sel_n',{n:TWB.n})}</span> <button type=button class="tw-lk" onclick="twBClear()">${t('sel_clear')}</button>`;
 const q=await api(ctx.url,{...ctx.body(),a:TWB.a,n:TWB.n,all:1});if(!TWB.n||TWB.root!==root.id)return;TWB.map=q.ok?q.d.map:{};
 for(const c of twBCells(root)){if(c.classList.contains('bsel'))continue;if(+c.dataset.d==TWB.a.d&&!c.classList.contains('free'))continue;c.classList.add(TWB.map[c.dataset.d+':'+c.dataset.p]?'glow-bad':'glow-ok')}}
async function twBTap(root,c){const d=+c.dataset.d,p=+c.dataset.p,free=c.classList.contains('free');
 const hasBlk=TWB.n&&TWB.root==root.id;
 // a target: another day, or a free period on the same day
 if(hasBlk&&(d!=TWB.a.d||(free&&!c.classList.contains('bsel')))){const R=(TWB.map||{})[d+':'+p];if(R&&R.length)return twBWhy(c,twWhy(R));
  const ctx=twBCtx(root),r=await api(ctx.url,{...ctx.body(),a:TWB.a,b:{d,p},n:TWB.n});if(!r.ok)return alert(r.d&&r.d.reasons?twWhy(r.d.reasons).replace(/<br>/g,'\n'):em(r.s,r.d.error));twBClear();return ctx.done(r.d)}
 if(free)return;
 if(hasBlk&&TWB.anchor&&d==TWB.anchor.d&&p==TWB.anchor.p&&TWB.n==twBExpand(root,d,p,p).reduce((a,b)=>b-a+1)){return twBClear()}
 const an=(hasBlk&&TWB.anchor&&TWB.anchor.d==d)?TWB.anchor:{d,p};const[lo,hi]=twBExpand(root,d,an.p,p);
 TWB.root=root.id;TWB.anchor=an;TWB.a={d,p:lo};TWB.n=hi-lo+1;twBPaint(root)}
document.addEventListener('click',e=>{if(!TWB.on)return;const c=e.target.closest&&e.target.closest('.tw-cell.dd');if(!c)return;const root=c.closest('#twgrid,#twgrid2');if(!root)return;
 e.preventDefault();e.stopPropagation();if(window.TWD&&TWD.just)return;twBTap(root,c)},true);
// after any redraw keep the mode (the selection itself is gone)
new MutationObserver(()=>{if(TWB.on&&!document.querySelector('.tw-cell.bsel'))twBDeco();if(!TWB.on&&TWB.n)twBClear()}).observe(document.body,{childList:true,subtree:true});
