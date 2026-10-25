// Report cards: term overview with one row per class (grouped by section), "publish all ready", bulk print dialog, per-section language and calendar.
// The old per-class page (marks status, PDF, WhatsApp) stays as the page you reach by clicking a class. Loaded after ov2.js.
Object.assign(D.en,{rc_status:'Status',rc_stu_h:'Students',rc_cls_sub:'Marks status, PDF and WhatsApp link for each student.',rc_sub:'Where every class stands this term, and who is still holding things up.',rc_term:'Term',rc_all:'All sections',rc_sec_f:'Section',
 rc_pubready:'Publish all ready classes',rc_pubsec:'Publish all ready',rc_printb:'Print report cards',rc_print:'Print',rc_cfg:'Language and calendar',rc_ready_n:'[n] ready',
 rc_st_published:'Published',rc_st_ready:'Ready to publish',rc_st_missing:'Marks missing',rc_st_nomarks:'No marks yet',rc_cards:'[n] cards',rc_held:'[n] held for fees',
 rc_miss_n:'[n] mark sheets missing',rc_miss_1:'1 mark sheet missing',rc_by:'from',rc_students:'[n] students',rc_pub:'Publish',rc_open:'Open',rc_none:'No classes yet.',rc_calnow:'Term [t] until [d]',rc_calnext:'Term [t] starts [d]',rc_lang:'Cards in',
 rc_l_en:'English',rc_l_fr:'French',rc_l_both:'English and French',rc_own:'own calendar',
 rc_pubd:'[n] classes published.',rc_pubd_s:' Skipped (marks missing): [x].',rc_pubd_0:'Nothing to publish: no class is ready.',rc_conf:'Publish [n] ready classes for Term [t]? Marks are locked once published.',
 rcp_h:'Print report cards',rcp_p:'Choose the term and the sections or classes to print. Only published classes can be printed.',rcp_whole:'All published classes',rcp_np:'not published',rcp_sep:'Separator sheet before each class (class, section, term, card count, student list)',rcp_dup:'Double-sided printing (adds a blank back so each class starts on a fresh sheet)',
 rcp_warn_nocard:'[n] students in these classes have no report card (no marks this term).',rcp_warn_held:'[n] students are held back for unpaid fees and will not be printed.',rcp_any:'Print anyway',rcp_back:'Go back',rcp_go:'Print',rcp_cancel:'Cancel',rcp_none:'Choose at least one published class.',rcp_ready:'File ready: [n] cards in [c] classes. It opened in a new tab.',rcp_skip:' [n] classes were not published and were left out.',
 rcc_h:'Language and calendar by section',rcc_p:'Each section can print its report cards in its own language and follow its own term dates. A section left on the school settings follows them.',rcc_school:'School setting ([l])',rcc_cal:'Own term dates for this year',rcc_from:'from',rcc_to:'to',rcc_save:'Save',rcc_saved:'Saved.',rcc_t:'Term',
 e_rc_none:'No published class to print. Publish the classes first.',e_rc_many:'Too many classes at once. Print in smaller groups.',e_terms:'The term dates overlap or are out of order.',
 bc_rc:'Report cards'});
Object.assign(D.fr,{rc_status:'État',rc_stu_h:'Élèves',rc_cls_sub:'État des notes, PDF et lien WhatsApp pour chaque élève.',rc_sub:'Où en est chaque classe ce trimestre, et qui retarde encore.',rc_term:'Trimestre',rc_all:'Toutes les sections',rc_sec_f:'Section',
 rc_pubready:'Publier toutes les classes prêtes',rc_pubsec:'Publier les prêtes',rc_printb:'Imprimer les bulletins',rc_print:'Imprimer',rc_cfg:'Langue et calendrier',rc_ready_n:'[n] prêtes',
 rc_st_published:'Publiée',rc_st_ready:'Prête à publier',rc_st_missing:'Notes manquantes',rc_st_nomarks:'Aucune note',rc_cards:'[n] bulletins',rc_held:'[n] retenus (frais)',
 rc_miss_n:'[n] feuilles de notes manquantes',rc_miss_1:'1 feuille de notes manquante',rc_by:'de',rc_students:'[n] élèves',rc_pub:'Publier',rc_open:'Ouvrir',rc_none:'Aucune classe.',rc_calnow:'Trimestre [t] jusqu’au [d]',rc_calnext:'Trimestre [t] à partir du [d]',rc_lang:'Bulletins en',
 rc_l_en:'anglais',rc_l_fr:'français',rc_l_both:'anglais et français',rc_own:'calendrier propre',
 rc_pubd:'[n] classes publiées.',rc_pubd_s:' Ignorées (notes manquantes) : [x].',rc_pubd_0:'Rien à publier : aucune classe n’est prête.',rc_conf:'Publier [n] classes prêtes pour le trimestre [t] ? Les notes sont verrouillées une fois publiées.',
 rcp_h:'Imprimer les bulletins',rcp_p:'Choisissez le trimestre et les sections ou classes à imprimer. Seules les classes publiées peuvent être imprimées.',rcp_whole:'Toutes les classes publiées',rcp_np:'non publiée',rcp_sep:'Feuille de séparation avant chaque classe (classe, section, trimestre, nombre de bulletins, liste des élèves)',rcp_dup:'Recto verso (ajoute un verso blanc pour que chaque classe commence sur une feuille neuve)',
 rcp_warn_nocard:'[n] élèves de ces classes n’ont pas de bulletin (aucune note ce trimestre).',rcp_warn_held:'[n] élèves sont retenus pour frais impayés et ne seront pas imprimés.',rcp_any:'Imprimer quand même',rcp_back:'Retour',rcp_go:'Imprimer',rcp_cancel:'Annuler',rcp_none:'Choisissez au moins une classe publiée.',rcp_ready:'Fichier prêt : [n] bulletins dans [c] classes. Il s’est ouvert dans un nouvel onglet.',rcp_skip:' [n] classes non publiées ont été laissées de côté.',
 rcc_h:'Langue et calendrier par section',rcc_p:'Chaque section peut imprimer ses bulletins dans sa propre langue et suivre ses propres dates de trimestre. Une section laissée sur les réglages de l’école les suit.',rcc_school:'Réglage de l’école ([l])',rcc_cal:'Dates de trimestre propres cette année',rcc_from:'du',rcc_to:'au',rcc_save:'Enregistrer',rcc_saved:'Enregistré.',rcc_t:'Trimestre',
 e_rc_none:'Aucune classe publiée à imprimer. Publiez d’abord les classes.',e_rc_many:'Trop de classes à la fois. Imprimez par groupes plus petits.',e_terms:'Les dates des trimestres se chevauchent ou sont dans le désordre.',
 bc_rc:'Bulletins'});
const RCS={term:0,sec:0,d:null,view:'ov'},rcF=(k,o)=>Object.entries(o||{}).reduce((s,[a,b])=>s.replace('['+a+']',b),t(k)),rcAdm=()=>S.role=='principal';
const rcD=d=>{try{return new Date(d+'T12:00:00').toLocaleDateString(L=='fr'?'fr-FR':'en-GB',{day:'numeric',month:'short'})}catch{return d}};
{const old=vReports;vReports=function(cid,term){if(+cid){RCS.view='class';RCS.cid=+cid;return old(cid,term)}RCS.view='ov';return rcOverview()}}
async function rcOverview(term){if(term)RCS.term=+term;const r=await api('rc/overview'+(RCS.term?'?term='+RCS.term:''));if(!r.ok)return $('#m').innerHTML=`<p class="box bad">${em(r.s,r.d.error)}</p>`;RCS.d=r.d;RCS.term=r.d.term;
 if(RCS.sec&&!r.d.sections.some(s=>s.id==RCS.sec))RCS.sec=0;rcDraw()}
const rcTerm=i=>{RCS.view='ov';rcOverview(+i)},rcSecF=i=>{RCS.sec=+i;rcDraw()},rcSecs=()=>RCS.d.sections.filter(s=>!RCS.sec||s.id==RCS.sec);
function rcStatus(c){const T=RCS.term;
 if(c.status=='published')return`<span class="chip ok">${fi('check',14)} ${t('rc_st_published')}</span> <small class=rcs>${rcF('rc_cards',{n:c.cards})}${c.held?` · <b class=rcw>${rcF('rc_held',{n:c.held})}</b>`:''}</small>`;
 if(c.status=='ready')return`<span class="chip info">${t('rc_st_ready')}</span>`;
 if(c.status=='nomarks')return`<span class=chip>${t('rc_st_nomarks')}</span>`;
 const w=c.teachers.filter(Boolean);return`<span class="chip warn">${c.missing==1?t('rc_miss_1'):rcF('rc_miss_n',{n:c.missing})}</span>${w.length?` <small class=rcs>${t('rc_by')} ${esc(w.slice(0,3).join(', '))}${w.length>3?' +'+(w.length-3):''}</small>`:''}`}
function rcDraw(){const d=RCS.d,T=d.term,all=d.sections,list=rcSecs(),nReady=l=>l.reduce((a,s)=>a+s.classes.filter(c=>c.status=='ready').length,0),tot=nReady(all);
 const sec=s=>{const n=nReady([s]),nowT=s.term_now,cal=nowT.current?rcF('rc_calnow',{t:nowT.term,d:rcD(nowT.end)}):rcF('rc_calnext',{t:nowT.term,d:rcD(nowT.start)});
  return`<section class=rcsec><div class=rcsh><div>${d.multi?`<h2>${esc(s.name)}</h2>`:''}<small>${cal}${d.multi?` · ${t('rc_lang')} ${t('rc_l_'+s.lang)}${s.own_cal?' · '+t('rc_own'):''}`:''}</small></div>
   ${d.multi?`<div class=rcsa>${n?`<button type=button class="sb sbs" onclick="rcPubAll(${s.id})">${fi('filecheck',16)} ${t('rc_pubsec')} (${n})</button>`:''}<button type=button class="sb sbs" onclick="rcPrintOpen(${s.id})">${fi('print',16)} ${t('rc_print')}</button></div>`:''}</div>
   <div class=tbl><table class=rct><colgroup><col style=width:26%><col><col style=width:90px><col style=width:130px></colgroup><tr><th>${t('cls')}<th>${t('rc_status')}<th class=rcn>${t('rc_stu_h')}<th class=noprint></tr>
   ${s.classes.map(c=>`<tr class=rcr tabindex=0 onclick="vReports(${c.id},${T})" onkeydown="if(event.key=='Enter')vReports(${c.id},${T})"><td><b>${esc(c.name)}</b>${c.head?`<small class=rcs> · ${esc(c.head)}</small>`:''}<td>${rcStatus(c)}<td class=rcn>${c.students}
    <td class="noprint rcact" onclick="event.stopPropagation()">${c.status=='ready'?`<button type=button class="sb sbs" onclick="rcPubOne(${c.id})">${t('rc_pub')}</button>`:''}${c.status=='published'?`<button type=button class="sb sbs" onclick="rcPrintOpen(0,${c.id})">${fi('print',16)} ${t('rc_print')}</button>`:''}`).join('')||`<tr><td colspan=4 class=none>${t('rc_none')}`}</table></div></section>`};
 $('#m').innerHTML=`<div class=ph><h1>${t('reports')}</h1><p>${t('rc_sub')}</p></div>
 <div class="tb noprint rctb"><div class=rcf>${seg([1,2,3].map(i=>[i,t('rc_term')+' '+i]),T,'rcTerm')}${d.multi?seg([[0,t('rc_all')],...all.map(s=>[s.id,s.name])],RCS.sec,'rcSecF',t('rc_sec_f')):''}</div>
  <div class=rcg>${rcAdm()&&d.multi?`<button type=button class=sb onclick="rcCfgOpen()">${fi('sliders',18)} ${t('rc_cfg')}</button>`:''}${tot?`<button type=button class=sb onclick="rcPubAll(${RCS.sec||0})">${fi('filecheck',18)} ${t('rc_pubready')} (${RCS.sec?nReady(list):tot})</button>`:''}<button type=button onclick="rcPrintOpen(RCS.sec)">${fi('print',18)} ${t('rc_printb')}</button></div></div><div id=res></div>${list.map(sec).join('')}`}
// ---- publishing
async function rcPubAll(secId){const d=RCS.d,l=(secId?d.sections.filter(s=>s.id==secId):d.sections).flatMap(s=>s.classes).filter(c=>c.status=='ready');if(!l.length)return;
 if(!confirm(rcF('rc_conf',{n:l.length,t:RCS.term})))return;const r=await api('rc/publish',{term:RCS.term,...(secId?{section_id:secId}:{})});
 if(!r.ok)return $('#res').innerHTML=`<p class="box bad">${em(r.s,r.d.error)}</p>`;await rcOverview();
 $('#res').innerHTML=`<p class="box ${r.d.published.length?'ok':'warn'}">${r.d.published.length?rcF('rc_pubd',{n:r.d.published.length})+(r.d.skipped.length?rcF('rc_pubd_s',{x:esc(r.d.skipped.join(', '))}):''):t('rc_pubd_0')}</p>`}
async function rcPubOne(cid){if(!confirm(t('publq')))return;const r=await api('rc/publish',{term:RCS.term,class_ids:[cid]});if(!r.ok)return $('#res').innerHTML=`<p class="box bad">${em(r.s,r.d.error)}</p>`;await rcOverview()}
// ---- print dialog
const RP2={sel:new Set(),sep:true,dup:false};
function rcPrintOpen(secId,cid){RP2.sel=new Set();const d=RCS.d;for(const s of d.sections)for(const c of s.classes)if(c.status=='published'&&(cid?c.id==cid:!secId||s.id==secId))RP2.sel.add(c.id);RP2.term=RCS.term;rcPrintDraw()}
function rcPrintDraw(){const d=RCS.d,pub=s=>s.classes.filter(c=>c.status=='published'),allIds=d.sections.flatMap(s=>pub(s).map(c=>c.id)),every=allIds.length&&allIds.every(i=>RP2.sel.has(i));
 const crow=c=>c.status=='published'?`<label class="idr${RP2.sel.has(c.id)?' on':''}"><input type=checkbox ${RP2.sel.has(c.id)?'checked':''} onchange="rcTog(${c.id},this.checked)"><b>${esc(c.name)}</b><small>${rcF('rc_cards',{n:c.cards})}${c.held?` · <i class=idw>${rcF('rc_held',{n:c.held})}</i>`:''}</small></label>`
  :`<label class="idr dis"><input type=checkbox disabled><b>${esc(c.name)}</b><small>${t('rcp_np')}</small></label>`;
 const h=`<div class=soh><div><h2>${t('rcp_h')}</h2><small>${t('rcp_p')}</small></div><button type=button class=ib onclick="ovClose()" aria-label="${t('rcp_cancel')}">${fi('x',18)}</button></div>
 <div class=rcpt>${seg([1,2,3].map(i=>[i,t('rc_term')+' '+i]),RP2.term,'rcpTerm')}</div>
 <div class=idl><label class="idr${every?' on':''}"><input type=checkbox ${every?'checked':''} onchange="rcAllSel(this.checked)"><b>${t('rcp_whole')}</b><small>${allIds.length}</small></label>
 ${d.sections.map(s=>{const p=pub(s),on=p.length&&p.every(c=>RP2.sel.has(c.id));return(d.multi?`<label class="idr rcsg${on?' on':''}"><input type=checkbox ${on?'checked':''} ${p.length?'':'disabled'} onchange="rcSecSel(${s.id},this.checked)"><b>${esc(s.name)}</b><small>${t('rc_l_'+s.lang)}</small></label>`:'')+s.classes.map(crow).join('')}).join('')}</div>
 <label class=ck><input type=checkbox ${RP2.sep?'checked':''} onchange="RP2.sep=this.checked"> ${t('rcp_sep')}</label>
 <label class=ck><input type=checkbox ${RP2.dup?'checked':''} onchange="RP2.dup=this.checked"> ${t('rcp_dup')}</label>
 <div id=rcw></div><p class=err id=rcE></p>
 <div class=ov-a><button type=button class=sb onclick="ovClose()">${t('rcp_cancel')}</button><button type=button id=rcgo onclick="rcPrintGo()">${fi('print',18)} ${t('rcp_go')}</button></div>`;
 if($('.ovc')&&$('#rcgo')){$('.ovc').innerHTML=h}else{ovOpen(h)}}
async function rcpTerm(i){RP2.term=+i;const keep=RP2.sel;await rcOverview(i);RP2.sel=new Set();const d=RCS.d;for(const s of d.sections)for(const c of s.classes)if(c.status=='published'&&keep.has(c.id))RP2.sel.add(c.id);rcPrintDraw()}
const rcTog=(id,on)=>{on?RP2.sel.add(id):RP2.sel.delete(id);rcPrintDraw()},rcAllSel=on=>{RP2.sel=new Set();if(on)for(const s of RCS.d.sections)for(const c of s.classes)if(c.status=='published')RP2.sel.add(c.id);rcPrintDraw()},
 rcSecSel=(id,on)=>{const s=RCS.d.sections.find(x=>x.id==id);for(const c of s.classes)if(c.status=='published')on?RP2.sel.add(c.id):RP2.sel.delete(c.id);rcPrintDraw()};
async function rcPrintGo(force){const cls=RCS.d.sections.flatMap(s=>s.classes).filter(c=>RP2.sel.has(c.id));if(!cls.length)return $('#rcE').textContent=t('rcp_none');
 const held=cls.reduce((a,c)=>a+c.held,0),nocard=cls.reduce((a,c)=>a+Math.max(0,c.students-c.cards-c.held),0);
 if((held||nocard)&&!force){$('#rcw').innerHTML=`<div class="box warn">${nocard?`<b>${rcF('rcp_warn_nocard',{n:nocard})}</b><br>`:''}${held?`<b>${rcF('rcp_warn_held',{n:held})}</b>`:''}<div class=ov-a><button type=button class=sb onclick="$('#rcw').innerHTML=''">${t('rcp_back')}</button><button type=button onclick="rcPrintGo(1)">${t('rcp_any')}</button></div></div>`;return $('#rcw').scrollIntoView({block:'nearest'})}
 $('#rcgo').disabled=true;$('#rcw').innerHTML='';$('#rcE').textContent='';
 const x=await fetch('/api/rc/print',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({term:RP2.term,class_ids:[...RP2.sel],separators:RP2.sep,duplex:RP2.dup,lang:L})});$('#rcgo').disabled=false;
 if((x.headers.get('content-type')||'').includes('pdf')){const n=x.headers.get('x-rc-cards'),c=x.headers.get('x-rc-classes'),sk=+x.headers.get('x-rc-skipped')||0,u=URL.createObjectURL(await x.blob());window.open(u,'_blank');
  $('#rcw').innerHTML=`<p class="box ok">${rcF('rcp_ready',{n,c})}${sk?rcF('rcp_skip',{n:sk}):''}</p>`;return}
 const d=await x.json().catch(()=>({}));$('#rcE').textContent=em(x.status,d.error)}
// ---- language and calendar by section (principal)
const RCC={};
async function rcCfgOpen(){const r=await api('rc/config');if(!r.ok)return;RCC.d=r.d;rcCfgDraw()}
function rcCfgDraw(){const d=RCC.d,sl={en:t('rc_l_en'),fr:t('rc_l_fr'),both:t('rc_l_both')};
 const blk=s=>`<div class=rccb id=rcc_${s.id}><h3>${esc(s.name)}</h3><label>${t('rc_lang')}<select id=rl_${s.id}><option value="" ${!s.card_lang?'selected':''}>${rcF('rcc_school',{l:sl[d.school_lang]})}${['en','fr','both'].map(k=>`<option value=${k} ${s.card_lang==k?'selected':''}>${sl[k]}`).join('')}</select></label>
  <label class=ck><input type=checkbox id=rk_${s.id} ${s.own_cal?'checked':''} onchange="$('#rd_${s.id}').hidden=!this.checked"> ${t('rcc_cal')} (${d.year}/${d.year+1})</label>
  <div id=rd_${s.id} class=rccd ${s.own_cal?'':'hidden'}>${s.terms.map((x,i)=>`<div><b>${t('rcc_t')} ${i+1}</b> ${t('rcc_from')} <input type=date id=rs_${s.id}_${i} value="${x[0]}"> ${t('rcc_to')} <input type=date id=re_${s.id}_${i} value="${x[1]}"></div>`).join('')}</div>
  <div class=ov-a><span class=ok id=rm_${s.id}></span><button type=button class=sbs onclick="rcCfgSave(${s.id})">${t('rcc_save')}</button></div></div>`;
 ovOpen(`<div class=soh><div><h2>${t('rcc_h')}</h2><small>${t('rcc_p')}</small></div><button type=button class=ib onclick="ovClose()" aria-label="${t('rcp_cancel')}">${fi('x',18)}</button></div>${d.sections.map(blk).join('')}`)}
async function rcCfgSave(id){const own=$('#rk_'+id).checked,b={card_lang:$('#rl_'+id).value||null,terms:own?[0,1,2].map(i=>[$('#rs_'+id+'_'+i).value,$('#re_'+id+'_'+i).value]):null},r=await api('rc/config/'+id,b),m=$('#rm_'+id);
 if(!r.ok){m.className='err';m.textContent=em(r.s,r.d.error);return}m.className='ok';m.textContent=t('rcc_saved');const o=await api('rc/config');if(o.ok)RCC.d=o.d;if(typeof RCS!='undefined'&&VIEWNOW=='vReports'&&RCS.view=='ov')rcOverview()}
// ---- breadcrumb: Report cards > section filter / class
{const o=bcTrail;bcTrail=function(){if(VIEWNOW=='vReports'&&S&&RCS.d){const hm={t:t('reports'),f:'vReports()'};
  if(RCS.view=='class'){const c=RCS.d.sections.flatMap(s=>s.classes).find(k=>k.id==RCS.cid);return[hm,...(RCS.d.multi?[(()=>{const s=RCS.d.sections.find(z=>z.classes.some(k=>k.id==RCS.cid));return s?{t:s.name,f:`RCS.sec=${s.id};vReports()`}:null})()].filter(Boolean):[]),{t:c?c.name:t('cls')}]}
  if(RCS.d.multi&&RCS.sec){const s=RCS.d.sections.find(z=>z.id==RCS.sec);return[{t:t('reports'),f:'rcSecF(0)'},{t:s?s.name:''}]}}
 return o()}}

// the class page's subtitle key (rp_sub) is also used by the payment page; show the right text here
{const o=rpDraw;rpDraw=function(){o();const p=document.querySelector('#m .ph p');if(p)p.textContent=t('rc_cls_sub')}}
