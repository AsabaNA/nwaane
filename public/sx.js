// System-wide search box (top bar, Ctrl+K or "/"). People and classes come as cards, pages open, and for buttons the page opens
// and the button glows until it is clicked. The matching engine is public/sxcore.js, the list of buttons is public/sxreg.js.
// The server hands over one role-filtered list when the box is opened (GET /api/search/index); typing never calls the server.
Object.assign(D.en,{sx_btn:'Search',sx_ph:'Search people, classes, pages and buttons…',sx_hint:'Try a name, a matricule, “print badges” or “pay”. Typos and accents are fine.',sx_none:'Nothing found. Check the spelling or type fewer words.',sx_load:'Loading…',sx_fail:'The search list could not be loaded. Pages and buttons still work.',
 sx_g_people:'People',sx_g_class:'Classes',sx_g_sub:'Subjects',sx_g_page:'Pages',sx_g_btn:'Buttons and actions',sx_recent:'Recent',sx_open:'Open',sx_pay:'Record payment',sx_badge:'ID badge',sx_tt:'Timetable',sx_cls:'Class',sx_subj:'Subjects',sx_in:'in',sx_here:'Click here',sx_gone:'That button is not showing right now. Open the page and look again.',sx_stu:'Student',sx_stf:'Staff',sx_n:'[n] students',sx_head:'Head',sx_close:'Close search',sx_kbd:'Ctrl K',sx_more:'Showing the best matches. Add a word to narrow it down.',sx_guard:'Guardian',sx_esc:'Esc',sx_subj1:'Subject'});
Object.assign(D.fr,{sx_btn:'Rechercher',sx_ph:'Rechercher une personne, une classe, une page, un bouton…',sx_hint:'Essayez un nom, un matricule, « imprimer badges » ou « payer ». Les fautes de frappe et les accents ne gênent pas.',sx_none:'Rien trouvé. Vérifiez l’orthographe ou tapez moins de mots.',sx_load:'Chargement…',sx_fail:'La liste de recherche n’a pas pu être chargée. Les pages et les boutons fonctionnent toujours.',
 sx_g_people:'Personnes',sx_g_class:'Classes',sx_g_sub:'Matières',sx_g_page:'Pages',sx_g_btn:'Boutons et actions',sx_recent:'Récents',sx_open:'Ouvrir',sx_pay:'Enregistrer un paiement',sx_badge:'Badge',sx_tt:'Emploi du temps',sx_cls:'Classe',sx_subj:'Matières',sx_in:'dans',sx_here:'Cliquez ici',sx_gone:'Ce bouton n’est pas visible pour le moment. Ouvrez la page et regardez à nouveau.',sx_stu:'Élève',sx_stf:'Personnel',sx_n:'[n] élèves',sx_head:'Titulaire',sx_close:'Fermer la recherche',sx_kbd:'Ctrl K',sx_more:'Meilleurs résultats affichés. Ajoutez un mot pour préciser.',sx_guard:'Tuteur',sx_esc:'Échap',sx_subj1:'Matière'});
const SXI={s:'<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',a:'<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',b:'<rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/>',p:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',u:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>',g:'<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',c:'<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>'};
const sxi=(k,s=18)=>`<svg width=${s} height=${s} viewBox="0 0 24 24" fill=none stroke=currentColor stroke-width=1.9 stroke-linecap=round stroke-linejoin=round aria-hidden=true>${SXI[k]}</svg>`;
const SXS={idx:null,raw:null,at:0,loading:null,cur:[],open:false,from:null,fail:false,glow:null};
const sxMenu=k=>menuOf().find(m=>m[0]==k)||(k=='subjects'&&S.role=='principal'&&menuOf().some(m=>m[0]=='timetable')?['subjects','vSubjects']:null);
const sxHas=k=>!!sxMenu(k);
const sxAvail=c=>(c.pg===null||sxHas(c.pg))&&(!c.r||c.r.includes(S.role));
const sxLbl=c=>L=='fr'?c.fr:c.en;
const sxPg=k=>D[L][k]||k;
// ---- the index: records from the server + pages and buttons from the registry
function sxBuild(){const R=SXS.raw||{students:[],classes:[],staff:[],subjects:[]},E=[],cn=Object.fromEntries(R.classes.map(c=>[c.id,c]));
 for(const[k]of menuOf())E.push({kind:'page',id:k,f:[[10,D.en[k]+' '+D.fr[k]],[6,SXPAGES[k]||'']]});
 for(const c of SXCONTROLS)if(sxAvail(c))E.push({kind:'control',id:c.id,c,f:[[10,c.en+' '+c.fr],[6,c.kw],[3,c.pg?(D.en[c.pg]||'')+' '+(D.fr[c.pg]||''):'']]});
 for(const c of R.classes)E.push({kind:'class',id:c.id,d:c,f:[[10,c.n],[8,c.s],[3,c.sec],[3,'class classe']]});
 for(const s of R.students){const c=cn[s.c]||{};E.push({kind:'student',id:s.id,d:s,f:[[10,s.n],[9,s.m+' '+String(s.m).replace(/\D/g,'')],[5,c.n||''],[3,s.g],[3,String(s.p).replace(/\D/g,'')]]})}
 for(const u of R.staff)E.push({kind:'staff',id:u.id,d:u,f:[[10,u.n],[7,u.u],[6,u.r+' '+(D.en[u.r]||'')+' '+(D.fr[u.r]||'')],[4,u.t.map(x=>x.n+' '+x.s.join(' ')).join(' ')],[3,u.e]]});
 for(const s of R.subjects){const c=cn[s.c]||{};E.push({kind:'subject',id:s.id,d:s,f:[[10,s.n],[6,c.n||''],[6,s.tn]]})}
 return SX.prepare(E)}
async function sxLoad(force){if(!force&&SXS.idx&&Date.now()-SXS.at<90000)return;if(SXS.loading)return SXS.loading;
 SXS.loading=(async()=>{try{const r=await api('search/index');SXS.fail=!r.ok;if(r.ok)SXS.raw=r.d}catch{SXS.fail=true}if(!SXS.raw)SXS.raw={students:[],classes:[],staff:[],subjects:[]};SXS.idx=sxBuild();SXS.at=Date.now()})().finally(()=>{SXS.loading=null});return SXS.loading}
// ---- panel
function sxBtn(){return`<button type=button class="fr-sx noprint" onclick="sxOpen()" aria-label="${esc(t('sx_btn'))}" title="${esc(t('sx_btn'))} (Ctrl K)">${sxi('s',18)}<span class=sx-bl>${t('sx_btn')}</span><kbd>${t('sx_kbd')}</kbd></button>`}
{const o=frameHTML;frameHTML=function(){const h=o();return S&&S.active!==false?h.replace('<div class=fr-lang',sxBtn()+'<div class=fr-lang'):h}}
async function sxOpen(q){if(!S||SXS.open)return;SXS.open=true;SXS.from=document.activeElement;sxStop();
 document.body.insertAdjacentHTML('beforeend',`<div id=sxo class=sx-o onclick="if(event.target===this)sxClose()"><div class=sx-p role=dialog aria-modal=true aria-label="${esc(t('sx_btn'))}"><div class=sx-in>${sxi('s',20)}<input id=sxq type=search role=combobox aria-expanded=true aria-controls=sxl aria-autocomplete=list autocomplete=off autocapitalize=off spellcheck=false placeholder="${esc(t('sx_ph'))}" aria-label="${esc(t('sx_btn'))}" oninput="sxRender()" onkeydown="sxKey(event)"><button type=button class=sx-x onclick="sxClose()" aria-label="${esc(t('sx_close'))}">${t('sx_esc')}</button></div><div id=sxl class=sx-l role=listbox aria-live=polite></div></div></div>`);
 document.body.classList.add('sx-lock');const i=$('#sxq');if(q)i.value=q;i.focus();
 if(!SXS.idx||Date.now()-SXS.at>=90000){$('#sxl').innerHTML=`<p class=sx-m>${t('sx_load')}</p>`;await sxLoad()}
 if(SXS.open)sxRender()}
function sxClose(){const o=$('#sxo');if(o)o.remove();document.body.classList.remove('sx-lock');SXS.open=false;const f=SXS.from;SXS.from=null;if(f&&f.focus&&document.contains(f))try{f.focus()}catch{}}
const sxRecent=()=>{try{return JSON.parse(localStorage['sxr'+(S?S.uid:'')]||'[]')}catch{return[]}};
const sxRemember=e=>{try{const a=sxRecent().filter(x=>!(x.k==e.kind&&x.i==e.id));a.unshift({k:e.kind,i:e.id});localStorage['sxr'+(S?S.uid:'')]=JSON.stringify(a.slice(0,5))}catch{}};
const sxInit=n=>String(n||'?').trim().split(/\s+/).filter(x=>x&&!/\.$/.test(x)).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'?';
const sxAv=(e,url)=>{const d=e.d;return d.ph&&url?`<span class=sx-av><img src="${url}" alt="" loading=lazy onerror="this.remove()">${esc(sxInit(d.n))}</span>`:`<span class=sx-av aria-hidden=true>${esc(sxInit(d.n))}</span>`};
const sxBtnA=(i,act,label,ic)=>`<button type=button class=sx-a onclick="sxAct(${i},'${act}')">${ic?sxi(ic,15)+' ':''}${label}</button>`;
function sxCard(e,i){const d=e.d,money=['principal','secretary'].includes(S.role),md=S.modules||['reports','fees','tracking'];
 if(e.kind=='student'){const c=SXS.raw.classes.find(x=>x.id==d.c)||{},acts=[];
  if(d.o)acts.push(sxBtnA(i,'open',t('sx_open'),'a'));
  if(money&&md.includes('fees')&&sxHas('recpay'))acts.push(sxBtnA(i,'pay',t('sx_pay'),'b'));
  if(money&&typeof idOne=='function')acts.push(sxBtnA(i,'badge',t('sx_badge'),'p'));
  if(money||c.id)acts.push(sxBtnA(i,'class',esc(c.n||t('sx_cls')),'g'));
  return`<div class="sx-c" data-sxr=${i} role=option tabindex=-1 onclick="sxAct(${i},'${d.o?'open':'class'}',event)">${sxAv(e,money?'/api/students/'+d.id+'/photo?t=1':'')}<div class=sx-b><b>${esc(d.n)}</b><small>${esc(d.m)}${c.n?' · '+esc(c.n):''}${d.g?' · '+esc(d.g):''}</small><div class=sx-ac>${acts.join('')}</div></div><span class=sx-t>${t('sx_stu')}</span></div>`}
 if(e.kind=='staff'){const acts=[sxBtnA(i,'open',t('sx_open'),'a')];if(sxHas('timetable')&&d.r=='teacher')acts.push(sxBtnA(i,'tt',t('sx_tt'),'g'));if(typeof tbOpen=='function')acts.push(sxBtnA(i,'badge',t('sx_badge'),'p'));
  return`<div class="sx-c" data-sxr=${i} role=option tabindex=-1 onclick="sxAct(${i},'open',event)">${sxAv(e,'/api/staff/'+d.id+'/photo?t=1')}<div class=sx-b><b>${esc(d.n)}</b><small>${d.t.length?d.t.map(x=>esc(x.s.join(', '))+' ('+esc(x.n)+')').join(' · '):esc(d.u)}</small><div class=sx-ac>${acts.join('')}</div></div><span class=sx-t>${esc(t(d.r)||d.r)}</span></div>`}
 if(e.kind=='class'){const acts=[sxBtnA(i,'open',t('sx_open'),'a')];if(S.role=='principal')acts.push(sxBtnA(i,'tt',t('sx_tt'),'g'),sxBtnA(i,'subj',t('sx_subj'),'c'));if(money)acts.push(sxBtnA(i,'badge',t('sx_badge'),'p'));
  const h=d.h&&SXS.raw.staff.find(x=>x.id==d.h);
  return`<div class="sx-c" data-sxr=${i} role=option tabindex=-1 onclick="sxAct(${i},'open',event)"><span class="sx-av sq" aria-hidden=true>${sxi('g',20)}</span><div class=sx-b><b>${esc(d.n)}</b><small>${t('sx_n').replace('[n]',d.c)}${d.sec?' · '+esc(d.sec):''}${h?' · '+t('sx_head')+': '+esc(h.n):''}</small><div class=sx-ac>${acts.join('')}</div></div><span class=sx-t>${t('sx_cls')}</span></div>`}
 if(e.kind=='subject'){const c=SXS.raw.classes.find(x=>x.id==d.c)||{};
  return`<div class="sx-c" data-sxr=${i} role=option tabindex=-1 onclick="sxAct(${i},'open',event)"><span class="sx-av sq" aria-hidden=true>${sxi('c',20)}</span><div class=sx-b><b>${esc(d.n)}</b><small>${esc(c.n||'')}${d.tn?' · '+esc(d.tn):''}</small></div><span class=sx-t>${t('sx_subj1')}</span></div>`}
 if(e.kind=='page'){return`<div class="sx-r" data-sxr=${i} role=option tabindex=-1 onclick="sxAct(${i},'open',event)"><span class=sx-ic>${sxi('p')}</span><b>${esc(sxPg(e.id))}</b><span class=sx-go>${sxi('a',16)}</span></div>`}
 const c=e.c;return`<div class="sx-r" data-sxr=${i} role=option tabindex=-1 onclick="sxAct(${i},'open',event)"><span class=sx-ic>${sxi('b')}</span><span class=sx-rt><b>${esc(sxLbl(c))}</b><small>${c.pg?t('sx_in')+' '+esc(sxPg(c.pg)):''}</small></span><span class=sx-go>${sxi('a',16)}</span></div>`}
const SXG=[['student','staff'],['class'],['subject'],['page'],['control']],SXGT={student:'sx_g_people',class:'sx_g_class',subject:'sx_g_sub',page:'sx_g_page',control:'sx_g_btn'},SXCAP={student:6,class:3,subject:3,page:3,control:6};
function sxRender(){const box=$('#sxl');if(!box||!SXS.idx)return;const q=($('#sxq')||{}).value||'';SXS.cur=[];let html='';
 if(!q.trim()){const rec=sxRecent().map(r=>SXS.idx.find(e=>e.kind==r.k&&e.id==r.i)).filter(Boolean);
  html=rec.length?`<p class=sx-g>${t('sx_recent')}</p>${rec.map(e=>{SXS.cur.push(e);return sxCard(e,SXS.cur.length-1)}).join('')}`:`<p class=sx-m>${t('sx_hint')}</p>`;if(SXS.fail)html+=`<p class="sx-m sx-w">${t('sx_fail')}</p>`;box.innerHTML=html;return}
 const res=SX.search(SXS.idx,q,{limit:150}),G={};
 for(const r of res){const g=r.e.kind=='staff'?'student':r.e.kind;const x=G[g]??=[];x.push(r)}
 const order=Object.entries(G).map(([k,l])=>({k,l:l.slice(0,SXCAP[k]),top:l[0].s})).sort((a,b)=>b.top-a.top);
 for(const g of order)html+=`<p class=sx-g>${t(SXGT[g.k])}</p>${g.l.map(r=>{SXS.cur.push(r.e);return sxCard(r.e,SXS.cur.length-1)}).join('')}`;
 box.innerHTML=html||`<p class=sx-m>${t('sx_none')}</p>`;if(res.length>SXS.cur.length&&html)box.insertAdjacentHTML('beforeend',`<p class=sx-m>${t('sx_more')}</p>`);
 const f=box.querySelector('[data-sxr]');if(f)f.classList.add('on')}
function sxKey(e){const box=$('#sxl');if(e.key=='Escape'){e.preventDefault();return sxClose()}
 const L_=[...box.querySelectorAll('[data-sxr]')];if(!L_.length)return;let i=L_.findIndex(x=>x.classList.contains('on'));
 if(e.key=='ArrowDown'||e.key=='ArrowUp'){e.preventDefault();i=e.key=='ArrowDown'?Math.min(L_.length-1,i+1):Math.max(0,i-1);L_.forEach(x=>x.classList.remove('on'));L_[i].classList.add('on');L_[i].scrollIntoView({block:'nearest'})}
 else if(e.key=='Enter'){e.preventDefault();const x=L_[Math.max(0,i)];if(x)sxAct(+x.dataset.sxr,'open')}}
// ---- what each result does
async function sxAct(i,act,ev){if(ev&&ev.target.closest('.sx-a'))return;const e=SXS.cur[i];if(!e)return;sxRemember(e);sxClose();const d=e.d;
 try{
  if(e.kind=='page'){return await frGo(sxMenu(e.id)[1])}
  if(e.kind=='control')return await sxRun(e.c);
  if(e.kind=='student'){
   if(act=='open'&&d.o)return await stOpen(d.id);
   if(act=='pay'){RPY.sid=d.id;RPY.q='';return await frGo('vRecPay')}
   if(act=='badge')return await idOne(d.id);
   if(act=='class'||act=='open'){await frGo('vClasses');return await clOpen(d.c)}}
  if(e.kind=='staff'){
   if(act=='badge')return await tbOpen(d.id);
   if(act=='tt'){TW.view='t';TW.tid=d.id;TW.scr='view';TW.pre=1;return await frGo('vTT')}
   if(sxHas('staff')){await frGo('vStaff');return tvOpen(d.id,1)}}
  if(e.kind=='class'){
   if(act=='tt'){TW.view='c';TW.cid=d.id;TW.scr='view';TW.pre=1;return await frGo('vTT')}
   if(act=='subj'){TM.cid=d.id;return await frGo('vSubjects')}
   if(act=='badge')return await idOpen(d.id);
   const it=sxMenu('classes');if(it){await frGo(it[1]);return await clOpen(d.id)}
   const ml=sxMenu('mylist');if(ml)return await frGo(ml[1])}
  if(e.kind=='subject'&&sxHas('subjects')){TM.cid=d.c;return await frGo('vSubjects')}
 }catch(x){console.error(x)}}
// ---- a button: open its page, wait for it, make it glow until it is clicked
const sxSleep=ms=>new Promise(r=>setTimeout(r,ms));
function sxFind(c){const root=c.pg===null?document:$('#m');if(!root)return null;try{return[...root.querySelectorAll(c.sel)].find(el=>el.getClientRects().length)||null}catch{return null}}
async function sxRun(c){sxStop();
 if(c.pg){const it=sxMenu(c.pg);if(!it)return sxToast(t('sx_gone'));if(VIEWNOW!=it[1]||c.pre)await frGo(it[1]);if(c.pre){try{await c.pre()}catch{}}}
 if(c.pg===null&&matchMedia('(max-width:1023px)').matches&&/fr-(user|colb)/.test(c.sel))frDrawer(1);
 let el=null;for(let k=0;k<40&&!(el=sxFind(c));k++)await sxSleep(100);
 if(!el)return sxToast(t('sx_gone'));sxGlow(c,el)}
function sxGlow(c,el){const G=SXS.glow={c,el,t0:Date.now(),page:VIEWNOW};
 el.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});
 el.classList.add('sx-glow');const tip=document.createElement('div');tip.id='sxtip';tip.className='sx-tip';tip.setAttribute('role','status');tip.innerHTML=`<b>${t('sx_here')}</b>${c.hint?`<span>${esc(sxLbl(c.hint))}</span>`:''}`;document.body.appendChild(tip);G.tip=tip;
 const place=()=>{if(SXS.glow!==G)return;if(!G.el.isConnected){const n=sxFind(G.c);if(n){G.el=n;n.classList.add('sx-glow')}}
  const r=G.el.isConnected?G.el.getBoundingClientRect():null;
  if(!r||!r.width){tip.style.opacity=0}else{const w=tip.offsetWidth,h=tip.offsetHeight,up=r.top>h+16;tip.classList.toggle('dn',!up);tip.style.opacity=1;tip.style.top=(up?r.top-h-10:r.bottom+10)+'px';tip.style.left=Math.max(8,Math.min(innerWidth-w-8,r.left+r.width/2-w/2))+'px'}
  if(Date.now()-G.t0>12e4||(c.pg&&VIEWNOW!=G.page)){return sxStop()}G.raf=requestAnimationFrame(place)};
 place()}
function sxStop(){const G=SXS.glow;SXS.glow=null;if(!G)return;cancelAnimationFrame(G.raf);document.querySelectorAll('.sx-glow').forEach(e=>e.classList.remove('sx-glow'));if(G.tip)G.tip.remove()}
function sxToast(m){const x=document.createElement('div');x.className='sx-toast';x.setAttribute('role','status');x.textContent=m;document.body.appendChild(x);setTimeout(()=>x.remove(),4500)}
addEventListener('click',e=>{const G=SXS.glow;if(G&&G.el&&G.el.contains(e.target))sxStop()},true);
addEventListener('keydown',e=>{
 if(e.key=='Escape'&&SXS.glow&&!SXS.open)sxStop();
 if(!S||!document.getElementById('frame'))return;
 if((e.ctrlKey||e.metaKey)&&!e.altKey&&e.key.toLowerCase()=='k'){e.preventDefault();SXS.open?$('#sxq')&&$('#sxq').focus():sxOpen();return}
 if(e.key=='/'&&!SXS.open&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!/^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement||{}).tagName)&&!(document.activeElement||{}).isContentEditable&&!$('#ovl')){e.preventDefault();sxOpen()}});
