// Sections (Anglophone, Francophone, Primary...): cards on Classes and students, pickers for classes, staff and registration.
// A school with one section never sees any of this except a dismissible hint for the principal.
Object.assign(D.en,{sc_open:'Open section',sc_h:'Sections',sc_sub:'Choose a section to see its classes.',sc_cls:'[n] classes',sc_cls1:'1 class',sc_stu:'[n] students',sc_stu1:'1 student',sc_tea:'[n] teachers',sc_tea1:'1 teacher',sc_add:'Add a section',sc_addh:'For example Francophone, or Primary.',
 sc_hint_t:'Does your school have more than one section?',sc_hint_p:'For example Anglophone and Francophone, or a Primary section. Sections keep classes and teachers apart, so a French-section teacher is never given an English-section class.',sc_hint_b:'Set up sections',sc_hint_x:'Not now',sc_link:'Your school has one section. Add another',
 sc_name:'Section name',sc_first:'What is your current section called?',sc_firsth:'Your existing classes and teachers stay in it.',sc_new:'Name of the new section',sc_save:'Save',sc_cancel:'Cancel',sc_back:'All sections',sc_ren:'Rename',sc_del:'Delete',sc_delq:'Delete this empty section?',sc_pick:'Section',sc_pickc:'Choose a section',sc_all:'All sections',
 sc_sec:'Sections',sc_sech:'A teacher can belong to more than one section.',sc_cl_in:'Section',
 e_sec_name:'Give the section a name.',e_sec_dup:'Another section already has this name.',e_sec_many:'A school can have up to 8 sections.',e_sec_busy:'This section still has classes. Move or delete them first.',e_sec_last:'A school needs at least one section.',e_sec_404:'Section not found.',e_sec_teacher:'Choose at least one section for the teacher.'});
Object.assign(D.fr,{sc_open:'Ouvrir la section',sc_h:'Sections',sc_sub:'Choisissez une section pour voir ses classes.',sc_cls:'[n] classes',sc_cls1:'1 classe',sc_stu:'[n] élèves',sc_stu1:'1 élève',sc_tea:'[n] enseignants',sc_tea1:'1 enseignant',sc_add:'Ajouter une section',sc_addh:'Par exemple Francophone, ou Primaire.',
 sc_hint_t:'Votre école a-t-elle plusieurs sections ?',sc_hint_p:'Par exemple Anglophone et Francophone, ou une section Primaire. Les sections séparent classes et enseignants : un enseignant de la section française ne reçoit jamais une classe de la section anglaise.',sc_hint_b:'Créer des sections',sc_hint_x:'Pas maintenant',sc_link:'Votre école a une seule section. En ajouter une',
 sc_name:'Nom de la section',sc_first:'Comment s’appelle votre section actuelle ?',sc_firsth:'Vos classes et enseignants actuels y restent.',sc_new:'Nom de la nouvelle section',sc_save:'Enregistrer',sc_cancel:'Annuler',sc_back:'Toutes les sections',sc_ren:'Renommer',sc_del:'Supprimer',sc_delq:'Supprimer cette section vide ?',sc_pick:'Section',sc_pickc:'Choisissez une section',sc_all:'Toutes les sections',
 sc_sec:'Sections',sc_sech:'Un enseignant peut appartenir à plusieurs sections.',sc_cl_in:'Section',
 e_sec_name:'Donnez un nom à la section.',e_sec_dup:'Une autre section porte déjà ce nom.',e_sec_many:'Une école peut avoir jusqu’à 8 sections.',e_sec_busy:'Cette section contient encore des classes. Déplacez-les ou supprimez-les d’abord.',e_sec_last:'Une école a besoin d’au moins une section.',e_sec_404:'Section introuvable.',e_sec_teacher:'Choisissez au moins une section pour l’enseignant.'});
let SCT={sections:[],multi:false};
const scN=(n,k)=>n==1&&D[L]['sc_'+k+'1']?t('sc_'+k+'1'):t('sc_'+k).replace('[n]',n);
const scMulti=()=>(S.sections||1)>1;
async function scLoad(){const r=await api('sections');if(r.ok){SCT=r.d;S.sections=r.d.sections.length}return r.ok}
const hintOff=()=>{try{return localStorage.getItem('sc_hint')=='1'}catch{return false}};
// narrow classes to the open section
secF=a=>CLS&&CLS.sec?a.filter(k=>k.section_id==CLS.sec):a;
{const o=frGo;frGo=async function(f){if(f=='vClasses'&&typeof CLS!='undefined')CLS.sec=0;return o(f)}}
{const o=clView;clView=async function(){
 if(S.sections==null||S.sections<1)await scLoad();
 if(scMulti()&&!CLS.sec&&!CLS.open){await scLoad();if(scMulti())return scPage()}
 if(scMulti()&&CLS.sec&&!SCT.sections.some(x=>x.id==CLS.sec))CLS.sec=0;
 await o();const nm=(SCT.sections.find(x=>x.id==CLS.sec)||{}).name;
 if(scMulti()&&CLS.sec&&!CLS.open){const h=$('#m .ph h1');if(h&&nm)h.insertAdjacentHTML('afterend',`<span class="chip info sc-tag">${esc(nm)}</span>`)}
 else if(!scMulti()&&S.role=='principal'&&!CLS.open)scHint()}}
function scBack(){CLS.sec=0;CLS.open=0;LS={};vClasses()}
function scPage(){const adm=S.role=='principal';
 $('#m').innerHTML=`<div class=ph><h1>${t('classes')}</h1><p>${t('sc_sub')}</p></div><div class=sc-g>${SCT.sections.map(x=>`<article class="cc xp sc-c" tabindex=0 role=button onclick="scOpen(${x.id})" onkeydown="if(event.key=='Enter')scOpen(${x.id})"><div class=cc-h><h2>${esc(x.name)}${adm?`<button type=button class="ib cc-e noprint" onclick="event.stopPropagation();scRename(${x.id})" aria-label="${t('sc_ren')}" title="${t('sc_ren')}">${fi('pencil',16)}</button>`:''}</h2></div>
  <p class=sc-n><b>${scN(x.classes,'cls')}</b><span>${scN(x.students,'stu')}</span><span>${scN(x.teachers,'tea')}</span></p>${adm&&!x.classes?`<p class=cc-q onclick="event.stopPropagation()"><button type=button class=lk onclick="scDel(${x.id})">${t('sc_del')}</button></p>`:''}<p class=cc-go>${t('sc_open')} ${fi('arrow',16)}</p></article>`).join('')}
  ${adm?`<button type=button class="sc-c sc-new" onclick="scAddOpen()"><span>${fi('plus',28)}</span><b>${t('sc_add')}</b><small>${t('sc_addh')}</small></button>`:''}</div>`}
function scOpen(id){CLS.sec=id;CLS.open=0;LS={};vClasses()}
function scHint(){const m=$('#m');if(!m)return;const link=`<p class="sc-link noprint"><button type=button class=lk onclick="scAddOpen()">${t('sc_link')}</button></p>`;
 if(hintOff())return m.insertAdjacentHTML('beforeend',link);
 const h=m.querySelector('.lhd,.ph');const html=`<section class="dp sc-hint" id=sc_hint><div><h2>${t('sc_hint_t')}</h2><p>${t('sc_hint_p')}</p></div><div class=sc-ha><button type=button onclick="scAddOpen()">${fi('plus',18)} ${t('sc_hint_b')}</button><button type=button class=sb onclick="scHintOff()">${t('sc_hint_x')}</button></div></section>`;
 (h||m).insertAdjacentHTML('afterend',html)}
function scHintOff(){try{localStorage.setItem('sc_hint','1')}catch{}const h=$('#sc_hint');if(h)h.remove();$('#m').insertAdjacentHTML('beforeend',`<p class="sc-link noprint"><button type=button class=lk onclick="scAddOpen()">${t('sc_link')}</button></p>`)}
function scAddOpen(){const first=!scMulti();
 ovOpen(`<h2>${t('sc_add')}</h2>${first?`<label for=sc_f>${t('sc_first')}</label><input id=sc_f maxlength=40 placeholder="Anglophone" value="${esc(((SCT.sections||[])[0]||{}).name&&SCT.sections[0].name!='Main'?SCT.sections[0].name:'')}"><small>${t('sc_firsth')}</small>`:''}
 <label for=sc_n>${first?t('sc_new'):t('sc_name')}</label><input id=sc_n maxlength=40 placeholder="${first?'Francophone':'Primary'}"><p class=err id=sc_e></p>
 <div class=ov-a><button type=button class=sb onclick="ovClose()">${t('sc_cancel')}</button><button type=button onclick="scAddGo(${first})">${fi('check',18)} ${t('sc_save')}</button></div>`);setTimeout(()=>{const i=$(first?'#sc_f':'#sc_n');i&&i.focus()},50)}
async function scAddGo(first){const b={name:$('#sc_n').value};if(first){b.rename_first=$('#sc_f').value;if(!b.rename_first.trim())return $('#sc_f').focus()}
 const r=await api('sections',b);if(!r.ok)return $('#sc_e').textContent=em(r.s,r.d.error);ovClose();await scLoad();CLS.sec=0;CLS.open=0;LS={};vClasses()}
function scRename(id){const x=SCT.sections.find(k=>k.id==id);ovOpen(`<h2>${t('sc_ren')}</h2><label for=sc_n>${t('sc_name')}</label><input id=sc_n maxlength=40 value="${esc(x.name)}"><p class=err id=sc_e></p><div class=ov-a><button type=button class=sb onclick="ovClose()">${t('sc_cancel')}</button><button type=button onclick="scRenGo(${id})">${fi('check',18)} ${t('sc_save')}</button></div>`)}
async function scRenGo(id){const r=await api('sections/'+id,{name:$('#sc_n').value});if(!r.ok)return $('#sc_e').textContent=em(r.s,r.d.error);ovClose();await scLoad();vClasses()}
async function scDel(id){if(!confirm(t('sc_delq')))return;const x=await fetch('/api/sections/'+id,{method:'DELETE'});if(!x.ok){let d={};try{d=await x.json()}catch{}return alert(em(x.status,d.error))}await scLoad();vClasses()}
// a section <select> for forms (class add/edit). Hidden for single-section schools.
function secField(cur,id='ce_sec'){if(!scMulti()||S.role!='principal')return'';const l=SCT.sections||[];cur=cur||CLS.sec||(l[0]||{}).id;
 return`<label for=${id}>${t('sc_cl_in')}</label><select id=${id}>${l.map(x=>`<option value=${x.id} ${x.id==cur?'selected':''}>${esc(x.name)}`).join('')}</select>`}
// registration: choose the section, then a class in it
{const o=vAdd;vAdd=async function(){await o();if(!scMulti()||!$('#c'))return;await scLoad();const cs=(await api('classes')).d,sel=$('#c'),wrap=sel.parentElement,sc=SCT.sections;
 const draw=()=>{const sid=+($('#c_sec')||{}).value||sc[0].id;sel.innerHTML=`<option value="">${t('reg_pickc')}`+cs.filter(k=>k.section_id==sid).map(k=>`<option value=${k.id}>${esc(k.name)}`).join('')};
 wrap.insertAdjacentHTML('beforebegin',`<div><label for=c_sec>${t('sc_pick')} *</label><select id=c_sec>${sc.map(x=>`<option value=${x.id}>${esc(x.name)}`).join('')}</select></div>`);$('#c_sec').onchange=draw;draw()}}
// staff: teachers pick their sections; the list can be filtered by section
let SFS=0;
function secStaff(){if(!scMulti()){return}
 const tb=$('#m .tb'),sel=$('#ur'),l=SCT.sections||[];
 if(tb&&!$('#sf_sec'))tb.querySelector('select').insertAdjacentHTML('afterend',`<select id=sf_sec onchange="SFS=+this.value;sfRows()" aria-label="${t('sc_pick')}"><option value=0>${t('sc_all')}${l.map(x=>`<option value=${x.id} ${SFS==x.id?'selected':''}>${esc(x.name)}`).join('')}</select>`);
 const fw=$('#ug')&&$('#ug').closest('.fw');if(fw&&!$('#us_box')){fw.insertAdjacentHTML('beforebegin',`<div class=fw id=us_box><label>${t('sc_sec')}</label><div class=us-g>${l.map(x=>`<label class=ck><input type=checkbox class=us-c value=${x.id}> ${esc(x.name)}</label>`).join('')}</div><small>${t('sc_sech')}</small></div>`);
  const tog=()=>{$('#us_box').hidden=sel.value!='teacher'};sel.addEventListener('change',tog);tog()}}
function secPicked(){if(!$('#us_box')||$('#us_box').hidden)return undefined;return[...document.querySelectorAll('.us-c:checked')].map(e=>+e.value)}
function secEd(u){if(!$('#us_box'))return;document.querySelectorAll('.us-c').forEach(e=>e.checked=(u.sections||[]).includes(+e.value));$('#us_box').hidden=u.role!='teacher'}
{const o=sfRows;sfRows=function(){if(!SFS||!scMulti())return o();const all=STAFF;STAFF=all.filter(x=>x.role!='teacher'||(x.sections||[]).includes(SFS));try{o()}finally{STAFF=all}}}
