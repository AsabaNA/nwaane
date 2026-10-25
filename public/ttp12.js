// Phase 10s: keep scroll positions when a screen redraws, two-row pill lists, searchable selectors.
const PSCR={};window.PSCR=PSCR;
// remembers the page scroll and the scroll of every scrollable box inside `host`; the returned function puts them back after a redraw
function twKeepScroll(host){const y=scrollY,x=scrollX,boxes=[...host.querySelectorAll('*')].filter(e=>e.scrollTop||e.scrollLeft).map(e=>({i:[...host.querySelectorAll(e.tagName)].indexOf(e),tag:e.tagName,cls:e.className,t:e.scrollTop,l:e.scrollLeft}));
 return()=>{const all=[...host.querySelectorAll('*')];for(const b of boxes){const e=all.find(z=>z.tagName==b.tag&&z.className==b.cls);if(e){e.scrollTop=b.t;e.scrollLeft=b.l}}scrollTo(x,y)}}
window.twKeepScroll=twKeepScroll;
// pill lists: put each list back where the person left it; the first time, show the chosen pill
function twPillFix(root){for(const p of(root||document).querySelectorAll('.pills[data-pk]:not([data-ps])')){p.dataset.ps=1;const k=p.dataset.pk;
  if(PSCR[k]!=null)p.scrollLeft=PSCR[k];else{const on=p.querySelector('.pl.on');if(on&&on.offsetLeft>p.clientWidth)p.scrollLeft=on.offsetLeft-20}}}
// a select with data-srch becomes a box you can type in
function twSrchMake(sel){sel.dataset.done=1;const w=document.createElement('div');w.className='ssx';
 const cur=()=>sel.options[sel.selectedIndex]?sel.options[sel.selectedIndex].text:'';
 w.innerHTML=`<input type=text class="ssx-i" role=combobox aria-expanded=false aria-autocomplete=list autocomplete=off spellcheck=false aria-label="${esc(sel.getAttribute('aria-label')||'')}"><span class=ssx-c aria-hidden=true>▾</span><div class=ssx-l role=listbox hidden></div>`;
 sel.style.display='none';sel.after(w);const i=w.querySelector('.ssx-i'),l=w.querySelector('.ssx-l');let hi=-1,shown=[];i.value=cur();
 const draw=q=>{q=(q||'').trim().toLowerCase();shown=[...sel.options].map((o,ix)=>({o,ix})).filter(x=>x.o.value!==''||!q).filter(x=>!q||x.o.text.toLowerCase().includes(q));hi=shown.findIndex(x=>x.ix==sel.selectedIndex);
  l.innerHTML=shown.length?shown.map((x,n)=>`<button type=button role=option class="ssx-o${x.ix==sel.selectedIndex?' on':''}${n==hi?' hi':''}" data-ix=${x.ix}>${esc(x.o.text)}</button>`).join(''):`<p class=ssx-n>${t('wz_nomatch')}</p>`};
 const open=()=>{draw('');l.hidden=false;i.setAttribute('aria-expanded','true');const on=l.querySelector('.on');if(on)l.scrollTop=on.offsetTop-40};
 const close=()=>{l.hidden=true;i.setAttribute('aria-expanded','false');i.value=cur()};
 const pick=ix=>{close();if(ix==sel.selectedIndex)return;sel.selectedIndex=ix;sel.dispatchEvent(new Event('change',{bubbles:true}))};
 i.addEventListener('focus',()=>{i.select();open()});i.addEventListener('click',()=>{if(l.hidden){open()}});
 i.addEventListener('input',()=>{l.hidden=false;draw(i.value)});
 i.addEventListener('keydown',e=>{const b=[...l.querySelectorAll('.ssx-o')];
  if(e.key=='ArrowDown'||e.key=='ArrowUp'){e.preventDefault();if(l.hidden)open();hi=Math.max(0,Math.min(b.length-1,hi+(e.key=='ArrowDown'?1:-1)));b.forEach((x,n)=>x.classList.toggle('hi',n==hi));if(b[hi])b[hi].scrollIntoView({block:'nearest'})}
  else if(e.key=='Enter'){e.preventDefault();const x=b[hi>=0?hi:0];if(x)pick(+x.dataset.ix)}
  else if(e.key=='Escape'){close();i.blur()}});
 l.addEventListener('mousedown',e=>e.preventDefault());l.addEventListener('click',e=>{const b=e.target.closest('.ssx-o');if(b)pick(+b.dataset.ix)});
 i.addEventListener('blur',()=>setTimeout(close,120))}
function twSrchFix(root){for(const s of(root||document).querySelectorAll('select[data-srch]:not([data-done])'))twSrchMake(s)}
new MutationObserver(m=>{twPillFix();twSrchFix()}).observe(document.body,{childList:true,subtree:true});
