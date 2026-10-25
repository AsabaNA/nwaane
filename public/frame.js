// Redesign step 1b — app frame (sidebar, top bar, phone drawer). Loaded after p4.js/p5.js.
Object.assign(D.en,{g_people:'People',g_academics:'Academics',g_time:'Time',g_money:'Money',g_school:'School',g_marks:'Marks',
 fr_menu:'Open menu',fr_close:'Close menu',fr_collapse:'Collapse menu',fr_expand:'Expand menu',fr_main:'Main menu',fr_lang:'Language',fr_you:'Signed in as'});
Object.assign(D.fr,{g_people:'Personnes',g_academics:'Scolarité',g_time:'Temps',g_money:'Argent',g_school:'École',g_marks:'Notes',
 fr_menu:'Ouvrir le menu',fr_close:'Fermer le menu',fr_collapse:'Réduire le menu',fr_expand:'Agrandir le menu',fr_main:'Menu principal',fr_lang:'Langue',fr_you:'Connecté en tant que'});
const FI={
 users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
 plus:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6"/><path d="M22 11h-6"/>',
 shield:'<path d="M20 13c0 5-3.5 7.5-7.7 8.9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/>',
 grid:'<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
 book:'<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
 cap:'<path d="M21.4 10.9a1 1 0 0 0 0-1.8L12.8 5.2a2 2 0 0 0-1.6 0L2.6 9.1a1 1 0 0 0 0 1.8l8.6 3.9a2 2 0 0 0 1.6 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
 cal:'<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
 check:'<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
 clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
 wallet:'<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
 sliders:'<path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>',
 pencil:'<path d="M21.2 5.6a2.1 2.1 0 0 0-3-3L3.5 17.3a2 2 0 0 0-.5.8l-1 4.4a.5.5 0 0 0 .6.6l4.4-1a2 2 0 0 0 .8-.5z"/><path d="m15 5 4 4"/>',
 list:'<path d="M3 5h.01"/><path d="M3 12h.01"/><path d="M3 19h.01"/><path d="M8 5h13"/><path d="M8 12h13"/><path d="M8 19h13"/>',
 menu:'<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
 x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
 left:'<path d="m11 17-5-5 5-5"/><path d="m18 17-5-5 5-5"/>',
 out:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>'};
const fi=(n,s=20)=>`<svg width=${s} height=${s} viewBox="0 0 24 24" fill=none stroke=currentColor stroke-width=1.9 stroke-linecap=round stroke-linejoin=round aria-hidden=true>${FI[n]||''}</svg>`;
const FICON={students:'users',register:'plus',staff:'shield',classes:'grid',subjects:'book',reports:'cap',timetable:'cal',today:'check',hours:'clock',fees:'wallet',settings:'sliders',entermarks:'pencil',mylist:'list',classlist:'users',mytt:'cal',myhours:'clock',roll:'users'};
// menu key -> group key, in display order; menuOf() (p4/p5) stays the single source of which items a role gets
const FGRP={students:'g_people',register:'g_people',staff:'g_people',classes:'g_academics',subjects:'g_academics',reports:'g_academics',timetable:'g_time',today:'g_time',hours:'g_time',mytt:'g_time',myhours:'g_time',roll:'g_time',fees:'g_money',settings:'g_school',entermarks:'g_marks',mylist:'g_marks',classlist:'g_marks'};
const FORD=['g_people','g_marks','g_academics','g_time','g_money','g_school'];
const FSORT={students:1,register:2,staff:3,classes:1,subjects:2,reports:3,today:1,timetable:2,hours:3,mytt:2,myhours:3,roll:4,entermarks:1,mylist:2,classlist:3};
function navGroups(){const g={};menuOf().filter(([k])=>k!='classlist'||S.heads).forEach(([k,f])=>{(g[FGRP[k]||'g_school']=g[FGRP[k]||'g_school']||[]).push([k,f])});
 return FORD.filter(k=>g[k]).map(k=>[k,g[k].sort((a,b)=>(FSORT[a[0]]||9)-(FSORT[b[0]]||9))])}
// landing page = first item of the first group (principal: Students, teacher: Enter marks, ...)
const landing=()=>{const g=navGroups();return g.length?g[0][1][0][1]:''};
function initials(n){const w=String(n||'').trim().split(/\s+/).filter(x=>x&&!/\.$/.test(x));return(w.slice(0,2).map(x=>x[0]).join('')||'?').toUpperCase()}
const fcol=()=>{try{return localStorage.frcol=='1'}catch{return false}};
function frameHTML(){const groups=S.active?navGroups():[],col=fcol();
 const nav=groups.map(([g,items])=>`<div class=fr-grp><p class=fr-gl>${t(g)}</p>${items.map(([k,f])=>`<a href=# class=fr-it data-f="${f}" data-k="${k}" title="${esc(t(k))}" onclick="frGo('${f}');return false">${fi(FICON[k]||'list')}<span>${t(k)}</span></a>`).join('')}</div>`).join('');
 return`<div class="fr${col?' col':''}" id=frame><a class=fr-skip href="#m">${t('fr_main')}</a>
 <aside class=fr-side id=frs aria-label="${t('fr_main')}"><div class=fr-top><div class=au-logo><span aria-hidden=true></span><b class=fr-hide>${t('brand')}</b></div>
  <button type=button class="fr-ic fr-colb" onclick="frCol()" aria-label="${t(col?'fr_expand':'fr_collapse')}" title="${t(col?'fr_expand':'fr_collapse')}">${fi('left',18)}</button>
  <button type=button class="fr-ic fr-xb" onclick="frDrawer(0)" aria-label="${t('fr_close')}">${fi('x',20)}</button></div>
  <nav class=fr-nav>${nav}</nav>
  <div class=fr-user><span class=fr-av aria-hidden=true>${esc(initials(S.name))}</span><div class="fr-ut fr-hide"><b>${esc(S.name)}</b><small>${t(S.role)}</small></div>
   <button type=button class=fr-ic onclick="bye()" aria-label="${t('logout')}" title="${t('logout')}">${fi('out',18)}</button></div></aside>
 <div class=fr-scrim onclick="frDrawer(0)"></div>
 <div class=fr-main><header class="fr-bar noprint"><button type=button class="fr-ic fr-mb" id=frmb onclick="frDrawer(1)" aria-label="${t('fr_menu')}" aria-expanded=false aria-controls=frs>${fi('menu',22)}</button>
  <div class=fr-crumb><span class=fr-sch>${esc(S.school)}</span><span class=fr-sep aria-hidden=true>/</span><b id=frcur></b></div>
  <div class=fr-lang role=group aria-label="${t('fr_lang')}">${['en','fr'].map(l=>`<button type=button class="${L==l?'on':''}" aria-pressed="${L==l}" onclick="if(L!='${l}')sw()">${l.toUpperCase()}</button>`).join('')}</div>
  <span class="fr-av fr-avt" title="${esc(S.name)}" aria-hidden=true>${esc(initials(S.name))}</span></header>
 ${demoBar()}<nav id=bcb class="bcb noprint" aria-label="Breadcrumb"></nav><main id=m class=fr-content tabindex=-1></main></div></div>`}
function frDrawer(on){const f=$('#frame');if(!f)return;f.classList.toggle('open',!!on);const b=$('#frmb');if(b)b.setAttribute('aria-expanded',!!on);
 if(on){const a=$('#frs .fr-it[aria-current]')||$('#frs .fr-it');a&&a.focus()}else if(b&&matchMedia('(max-width:1023px)').matches)b.focus()}
function frCol(){const f=$('#frame');if(!f)return;const c=f.classList.toggle('col');try{localStorage.frcol=c?'1':'0'}catch{}
 const b=$('.fr-colb');if(b){const k=t(c?'fr_expand':'fr_collapse');b.setAttribute('aria-label',k);b.title=k}}
function frameActive(f){const fr=$('#frame');if(!fr)return;if(f&&![...fr.querySelectorAll('.fr-it')].some(a=>a.dataset.f==f))return;let cur='';fr.querySelectorAll('.fr-it').forEach(a=>{const on=a.dataset.f==f;on?(a.setAttribute('aria-current','page'),cur=t(a.dataset.k)):a.removeAttribute('aria-current')});
 const c=$('#frcur');if(c)c.textContent=cur;fr.classList.remove('open');const b=$('#frmb');if(b)b.setAttribute('aria-expanded',false)}
async function frGo(f){frameActive(f);await nav(f);const m=$('#m');m&&window.scrollTo(0,0)}
addEventListener('keydown',e=>{if(e.key=='Escape'&&$('#frame.open'))frDrawer(0)});
addEventListener('resize',()=>{if(innerWidth>=1024&&$('#frame.open'))frDrawer(0)});
