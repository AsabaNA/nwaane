// Create-new wizard (5 steps: who is it for, school day, teachers' days, lessons per week, review) and the School calendar tab. Loaded after ttui.js.
Object.assign(D.en,{wz_s1:'Who is it for?',wz_s2:'School day',wz_s3:'Teachers’ days',wz_s4:'Lessons',wz_s5:'Create',
 wz_h1:'Who is this timetable for?',wz_l1:'Pick one. You can create the rest later.',wz_k_school:'Whole school',wz_k_school_p:'All [n] classes',wz_k_sec:'A section',wz_k_sec_p:'e.g. [x]',wz_k_cls:'Some classes',wz_k_cls_p:'Choose one or more',wz_k_tch:'One teacher',wz_k_tch_p:'Fit a teacher’s lessons',
 wz_pick_sec:'Choose a section',wz_pick_cls:'Choose the classes',wz_pick_tch:'Choose a teacher',wz_already:'What about classes that already have one?',wz_only_miss:'Only fill the [n] missing classes',wz_only_miss_p:'Existing timetables stay as they are. Teachers’ existing lessons are respected.',wz_redo:'Redo all [n] classes',wz_redo_p:'Replaces the existing timetables from the start date.',
 wz_all_have:'all have timetables',wz_w_out:'[n] without timetable',wz_n_cls:'[n] classes',wz_n_sel:'[n] selected',wz_tch_p:'Only this teacher’s lessons are placed. Everything else stays where it is.',wz_next2:'Next: School day →',wz_cancel:'Cancel',wz_none:'Nothing to create: choose a class, a section or a teacher.',
 wz_h2:'Is this your school day?',wz_l2:'We use the school day saved in School calendar. Changing it here changes it for every timetable.',wz_looks:'✓ Yes, looks right',wz_change:'✎ Change the school day',wz_next3:'Next: Teachers’ days →',wz_lessons:'[n] lessons of [m] min',wz_brk:'break',
 de_start:'School starts at',de_len:'One lesson lasts (minutes)',de_per:'Lessons per day',de_days:'School days',de_yday:'Your school day',de_ends:'Ends at',de_lesson:'Lesson',de_remove:'✕ Remove',de_add:'+ Add a break',de_drag:'Drag a break by its handle to move it up or down.',de_more:'More settings',de_save:'Save school day',de_mixed:'Lessons now have different lengths; changing this makes them all equal.',de_break:'Break',de_grip:'Drag to move',
 wz_h3:'When can each teacher come?',wz_l3:'Only the [n] teachers who teach in your selection. Tap a day to change it. Press and hold (or right-click) for exact hours.',wz_search:'Search a teacher',wz_all:'All day',wz_am:'Morning only',wz_pm:'Afternoon only',wz_off:'Not coming',wz_part:'Custom hours',wz_also:'Also in [x]',wz_next4:'Next: Lessons per week →',wz_noteach:'No teachers yet. Add teachers in the Staff page.',wz_tight:'only [m] free periods for [n] lessons',
 wz_exh:'Exact hours: [t]',wz_exp:'Tick the periods when the teacher is NOT available.',wz_awayclash:'[n] lessons of [t] in the current timetable fall on times they are away. Create the timetable again to fix this.',
 wz_h4:'How many lessons each week?',wz_l4:'Press + or − for each subject. The coloured bar shows how full the week is.',wz_week_of:'Week of [c]',wz_used:'[n] of [m] slots used · [f] free',wz_over:'[n] of [m] slots used · [o] too many',wz_next5:'Next: Review →',wz_nosub:'This class has no subjects yet. Add them in the Subjects page.',wz_choose_t:'— choose teacher —',wz_show_all:'Show all teachers…',wz_maxd:'max [n]/day',wz_dbl:'[n] doubles',wz_nodbl:'no doubles',wz_pop_max:'Most lessons of this subject in one day',wz_pop_dbl:'Double lessons (two periods back to back)',wz_copy:'Copy to all classes with this subject',wz_done:'Done',wz_more:'More options',
 wz_h5:'Ready to create',wz_l5:'Check the summary, then press Create. Nothing is saved until you approve the result.',wz_for:'For',wz_edit:'Edit',wz_t_set:'[n] teachers’ days set',wz_day_set:'School day',wz_start:'Starts on',wz_keep_o:'Keep the other [n] timetables as they are',wz_keep_op:'Shared teachers’ lessons in other classes are not moved.',wz_create:'Create the timetable',wz_working:'Creating…',
 wz_w_o:'[t] has [n] lessons for [m] free periods: it will be tight',wz_w_cl:'[c] has [n] lessons for [m] slots',wz_w_nt:'[n] subjects have no teacher: they are placed, but nobody is checked for clashes',wz_w_nr:'[n] subjects have no lessons per week and will not appear',wz_w_cw:'[n] classes have no lessons set yet and will stay empty',wz_w_more:'and [n] more',wz_ok_all:'Everything looks fine.',wz_rules:'Rules and options',wz_keepl:'Keep the lessons already in the timetable (only fill the empty spots)',
 wz_lbl_school:'Whole school',wz_lbl_tch:'[x] · lessons only',
 wz_nolessons:'None of the chosen classes has lessons set. Go back to Lessons and set them.'});
Object.assign(D.fr,{wz_s1:'Pour qui ?',wz_s2:'Journée',wz_s3:'Jours des enseignants',wz_s4:'Cours',wz_s5:'Créer',
 wz_h1:'Pour qui est cet emploi du temps ?',wz_l1:'Choisissez. Vous pourrez créer le reste plus tard.',wz_k_school:'Toute l’école',wz_k_school_p:'Les [n] classes',wz_k_sec:'Une section',wz_k_sec_p:'ex. [x]',wz_k_cls:'Quelques classes',wz_k_cls_p:'Une ou plusieurs',wz_k_tch:'Un enseignant',wz_k_tch_p:'Placer les cours d’un enseignant',
 wz_pick_sec:'Choisissez une section',wz_pick_cls:'Choisissez les classes',wz_pick_tch:'Choisissez un enseignant',wz_already:'Et les classes qui en ont déjà un ?',wz_only_miss:'Remplir seulement les [n] classes manquantes',wz_only_miss_p:'Les emplois du temps existants restent tels quels. Les cours déjà placés des enseignants sont respectés.',wz_redo:'Refaire les [n] classes',wz_redo_p:'Remplace les emplois du temps existants à partir de la date de début.',
 wz_all_have:'toutes ont un emploi du temps',wz_w_out:'[n] sans emploi du temps',wz_n_cls:'[n] classes',wz_n_sel:'[n] choisies',wz_tch_p:'Seuls les cours de cet enseignant sont placés. Tout le reste ne bouge pas.',wz_next2:'Suivant : journée →',wz_cancel:'Annuler',wz_none:'Rien à créer : choisissez une classe, une section ou un enseignant.',
 wz_h2:'Est-ce votre journée d’école ?',wz_l2:'Nous utilisons la journée enregistrée dans le Calendrier scolaire. La modifier ici la modifie pour tous les emplois du temps.',wz_looks:'✓ Oui, c’est correct',wz_change:'✎ Modifier la journée',wz_next3:'Suivant : jours des enseignants →',wz_lessons:'[n] cours de [m] min',wz_brk:'pause',
 de_start:'L’école commence à',de_len:'Un cours dure (minutes)',de_per:'Cours par jour',de_days:'Jours de classe',de_yday:'Votre journée d’école',de_ends:'Fin à',de_lesson:'Cours',de_remove:'✕ Retirer',de_add:'+ Ajouter une pause',de_drag:'Glissez une pause par sa poignée pour la monter ou la descendre.',de_more:'Autres réglages',de_save:'Enregistrer la journée',de_mixed:'Les cours ont actuellement des durées différentes ; modifier ceci les rend tous égaux.',de_break:'Pause',de_grip:'Glisser pour déplacer',
 wz_h3:'Quand chaque enseignant peut-il venir ?',wz_l3:'Seulement les [n] enseignants de votre sélection. Touchez un jour pour le changer. Appui long (ou clic droit) pour des horaires précis.',wz_search:'Chercher un enseignant',wz_all:'Toute la journée',wz_am:'Matin seulement',wz_pm:'Après-midi seulement',wz_off:'Ne vient pas',wz_part:'Horaires précis',wz_also:'Aussi en [x]',wz_next4:'Suivant : cours par semaine →',wz_noteach:'Pas encore d’enseignants. Ajoutez-les dans la page Personnel.',wz_tight:'seulement [m] périodes libres pour [n] cours',
 wz_exh:'Horaires précis : [t]',wz_exp:'Cochez les périodes où l’enseignant n’est PAS disponible.',wz_awayclash:'[n] cours de [t] dans l’emploi du temps actuel tombent sur ses absences. Recréez l’emploi du temps pour corriger.',
 wz_h4:'Combien de cours par semaine ?',wz_l4:'Appuyez sur + ou − pour chaque matière. La barre colorée montre le remplissage de la semaine.',wz_week_of:'Semaine de [c]',wz_used:'[n] cases sur [m] utilisées · [f] libres',wz_over:'[n] cases sur [m] utilisées · [o] en trop',wz_next5:'Suivant : vérification →',wz_nosub:'Cette classe n’a pas encore de matières. Ajoutez-les dans la page Matières.',wz_choose_t:'— choisir l’enseignant —',wz_show_all:'Tous les enseignants…',wz_maxd:'max [n]/jour',wz_dbl:'[n] doubles',wz_nodbl:'pas de doubles',wz_pop_max:'Maximum de cours de cette matière par jour',wz_pop_dbl:'Cours doubles (deux périodes de suite)',wz_copy:'Copier dans toutes les classes ayant cette matière',wz_done:'Terminé',wz_more:'Plus d’options',
 wz_h5:'Prêt à créer',wz_l5:'Vérifiez le résumé puis appuyez sur Créer. Rien n’est enregistré tant que vous n’approuvez pas le résultat.',wz_for:'Pour',wz_edit:'Modifier',wz_t_set:'Jours de [n] enseignants définis',wz_day_set:'Journée d’école',wz_start:'À partir du',wz_keep_o:'Garder les [n] autres emplois du temps tels quels',wz_keep_op:'Les cours des enseignants partagés dans d’autres classes ne bougent pas.',wz_create:'Créer l’emploi du temps',wz_working:'Création…',
 wz_w_o:'[t] a [n] cours pour [m] périodes libres : ce sera serré',wz_w_cl:'[c] a [n] cours pour [m] cases',wz_w_nt:'[n] matières n’ont pas d’enseignant : elles sont placées, mais aucun conflit n’est vérifié',wz_w_nr:'[n] matières n’ont pas de cours par semaine et n’apparaîtront pas',wz_w_cw:'[n] classes n’ont pas encore de cours définis et resteront vides',wz_w_more:'et [n] de plus',wz_ok_all:'Tout est en ordre.',wz_rules:'Règles et options',wz_keepl:'Garder les cours déjà placés (ne remplir que les cases vides)',
 wz_lbl_school:'Toute l’école',wz_lbl_tch:'[x] · cours seulement',
 wz_nolessons:'Aucune des classes choisies n’a de cours définis. Retournez à « Cours » pour les définir.'});
// ---------- entry points
async function twNew(){if(!twLeave())return;const d=await twOv();TW.tch=null;TW.req=null;TW.st=null;TW.edit2=0;TW.calEdit=0;TW.stDirty=0;TW.q='';TW.from='';TW.keep=0;
 if(d.total&&d.done==d.total){TW.scr='list';await twRender();return ovOpen(`<div class="tw-dlg"><span class=tw-wi>!</span><h2>${t('tw_warn_h')}</h2><p>${tgF('tw_warn_p',{n:d.total})}</p><p><button type=button class="tw-btn go wide" onclick="ovClose();twTab('list')">${t('tw_warn_go')}</button></p><p><button type=button class="tw-btn ghost wide" onclick="ovClose();twAny()">${t('tw_warn_any')}</button></p><p class=tw-center><button type=button class=tw-lk onclick="ovClose()">${t('tw_cancel')}</button></p></div>`)}
 const miss=d.sections.find(s=>s.classes.some(c=>!c.n));TW.sc={kind:d.multi?'section':'school',secs:[(miss||d.sections[0]).id],cls:[],tid:0,redo:0};twGo('wiz',1)}
function twAny(){const d=TW.od;TW.sc={kind:'school',secs:[d.sections[0].id],cls:[],tid:0,redo:1};twGo('wiz',1)}
async function twStartC(ids){if(!twLeave())return;await twOv();TW.tch=null;TW.req=null;TW.st=null;TW.edit2=0;TW.calEdit=0;TW.sc={kind:'classes',secs:[],cls:ids.slice(),tid:0,redo:0};TW.from='';twGo('wiz',1)}
async function twStartSec(id){if(!twLeave())return;await twOv();TW.tch=null;TW.req=null;TW.st=null;TW.edit2=0;TW.calEdit=0;TW.sc={kind:'section',secs:[id],cls:[],tid:0,redo:0};TW.from='';twGo('wiz',1)}
async function twStartT(id){if(!twLeave())return;await twOv();TW.tch=null;TW.req=null;TW.st=null;TW.edit2=0;TW.calEdit=0;TW.sc={kind:'teacher',secs:[],cls:[],tid:id,redo:0};TW.from='';twGo('wiz',1)}
// ---------- what the wizard builds for
function twScope(){const d=TW.od,sc=TW.sc,all=d.sections.flatMap(s=>s.classes),k=sc.kind;let cs=[],label='';
 if(k=='school'){cs=all;label=t('wz_lbl_school')}
 else if(k=='section'){const ss=d.sections.filter(x=>(sc.secs||[]).includes(x.id));cs=ss.flatMap(x=>x.classes);label=ss.length?(d.multi?ss.map(x=>x.name).join(' + '):t('tw_all_cls')):''}
 else if(k=='classes'){cs=all.filter(c=>sc.cls.includes(c.id));label=cs.length==1?cs[0].name:tgF('wz_n_cls',{n:cs.length})}
 else{const tc=d.sections.flatMap(s=>s.teachers).find(x=>x.id==sc.tid);return{kind:k,ids:[],tid:sc.tid,label:tgF('wz_lbl_tch',{x:tc?tc.name:''}),names:[],keep:0,all}}
 const ids=(k=='classes'||sc.redo||cs.every(c=>c.n)?cs:cs.filter(c=>!c.n)).map(c=>c.id);
 return{kind:k,ids,tid:0,label:(k=='classes'?label:label+' · '+tgF('wz_n_cls',{n:ids.length})),names:cs.filter(c=>ids.includes(c.id)).map(c=>c.name),keep:all.filter(c=>c.n&&!ids.includes(c.id)).length,all}}
const twArgs=()=>{const s=twScope();return s.tid?{teacher_id:s.tid}:{classes:s.ids}};
// ---------- wizard shell
const TWS=()=>`<div class="tw-steps noprint">${[1,2,3,4,5].map(n=>`<button type=button class="tw-step${TW.step==n?' now':TW.step>n?' done':''}" ${TW.step<n?'disabled':''} onclick="twStep(${n})"><span class=n>${TW.step>n?'✓':n}</span><span class=nm>${t('wz_s'+n)}</span></button>`).join('')}</div>`;
async function twStep(n){if(TW.step==2&&n>2&&TW.st&&!await twSaveSt())return;TW.step=n;TW.msg='';twRender()}
async function twWiz(){if(!TW.od)await twOv();return[0,twS1,twS2,twS3,twS4,twS5][TW.step]()}
// ---------- step 1: who is it for
const twFoot=(back,next,nextTxt,dis)=>`<div class="tw-row tw-foot"><button type=button class="tw-btn ghost" onclick="${back}">${back.startsWith('twStep')?t('tw_back1'):t('wz_cancel')}</button>${next?`<button type=button class="tw-btn go" ${dis?'disabled':''} onclick="${next}">${nextTxt}</button>`:''}</div>`;
function twS1(){const d=TW.od,sc=TW.sc,s=twScope(),all=d.sections.flatMap(x=>x.classes),missAll=all.filter(c=>!c.n).length;
 const card=(k,ic,h,p)=>`<button type=button class="scopeopt${sc.kind==k?' act':''}" onclick="twKind('${k}')"><span class=ic>${ic}</span><b>${h}</b><small>${p}</small></button>`;
 const chip=(c,sel,click)=>twChip(c,sel,click);
 const radios=(cs)=>{const n=cs.filter(c=>!c.n).length,e=cs.length-n;return`<p class=tw-cap>${t('wz_already')}</p><div class=tw-radios>
  <button type=button class="radio${!sc.redo&&n?' act':''}" ${n?'':'disabled'} onclick="TW.sc.redo=0;twS1()"><i class=dot></i><span><b>${tgF('wz_only_miss',{n})}</b><small>${t('wz_only_miss_p')}</small></span></button>
  <button type=button class="radio${sc.redo||!n?' act':''}" onclick="TW.sc.redo=1;twS1()"><i class=dot></i><span><b>${tgF('wz_redo',{n:cs.length})}</b><small>${t('wz_redo_p')}</small></span></button></div>`};
 let panel='';
 if(sc.kind=='school')panel=`<p class=tw-cap>${t('wz_k_school')}</p><p>${tgF('wz_n_cls',{n:all.length})} · ${missAll?tgF('wz_w_out',{n:missAll}):t('wz_all_have')}</p>${radios(all)}`;
 else if(sc.kind=='section'){const on=d.sections.filter(x=>sc.secs.includes(x.id)),cs=on.flatMap(x=>x.classes);
  panel=`<p class=tw-cap>${t('wz_pick_sec')} · ${t('wz_many_sec')}</p><div class=tw-radios>${d.sections.map(x=>{const m=x.classes.filter(c=>!c.n).length,a=sc.secs.includes(x.id);return`<button type=button class="radio chk${a?' act':''}" role=checkbox aria-checked=${a} onclick="twTogS(${x.id})"><i class=dot></i><span><b>${esc(x.name)}</b><small>${tgF('wz_n_cls',{n:x.classes.length})} · <em class="${m?'amb':'grn'}">${m?tgF('wz_w_out',{n:m}):t('wz_all_have')}</em></small></span></button>`}).join('')}</div>
  ${on.map(sec=>`${on.length>1?`<p class=tw-sub>${esc(sec.name)}</p>`:''}<div class=chips style="padding:4px 0 8px">${sec.classes.map(c=>chip(c,s.ids.includes(c.id))).join('')}</div>`).join('')}${on.length?twChipKey()+radios(cs):''}`}
 else if(sc.kind=='classes')panel=`<p class=tw-cap>${t('wz_pick_cls')} · ${tgF('wz_n_sel',{n:sc.cls.length})} <button type=button class="tw-lk" onclick="twAllC(1)">${t('wz_sel_all')}</button> · <button type=button class="tw-lk" onclick="twAllC(0)">${t('wz_sel_none')}</button></p>${d.sections.map(x=>`${d.multi?`<p class=tw-sub>${esc(x.name)}</p>`:''}<div class=chips style="padding:4px 0 10px">${x.classes.map(c=>chip(c,sc.cls.includes(c.id),`twTogC(${c.id})`)).join('')}</div>`).join('')}${twChipKey()}`;
 else{const tl=d.sections.flatMap(x=>x.teachers),seen=new Set(),L2=tl.filter(x=>!seen.has(x.id)&&seen.add(x.id));panel=`<p class=tw-cap>${t('wz_pick_tch')}</p>${twCbx('tch',L2,sc.tid,'twPickT',t('wz_choose_t'))}<p class=tw-mu style="margin-top:10px">${t('wz_tch_p')}</p>`}
 const ok=s.tid||s.ids.length;
 $('#tt').innerHTML=`${TWS()}<h1>${t('wz_h1')}</h1><p class=tw-lead>${t('wz_l1')}</p>
 <div class=scope>${card('school','🏫',t('wz_k_school'),tgF('wz_k_school_p',{n:all.length}))}${d.multi?card('section','▤',t('wz_k_sec'),tgF('wz_k_sec_p',{x:esc(d.sections[0].name)})):''}${card('classes','◫',t('wz_k_cls'),t('wz_k_cls_p'))}${card('teacher','👤',t('wz_k_tch'),t('wz_k_tch_p'))}</div>
 <div class=tw-card style="margin-top:14px">${panel}</div>${ok?'':`<p class=tw-mu>${t('wz_none')}</p>`}${twFoot("twTab('list')","twStep(2)",t('wz_next2'),!ok)}`}
function twKind(k){TW.sc.kind=k;if(k=='section'&&!(TW.sc.secs||[]).length)TW.sc.secs=[TW.od.sections[0].id];twS1()}
function twTogS(id){const a=TW.sc.secs,i=a.indexOf(id);i<0?a.push(id):a.splice(i,1);twS1()}
function twAllC(on){TW.sc.cls=on?TW.od.sections.flatMap(x=>x.classes).map(c=>c.id):[];twS1()}
function twPickT(id){TW.sc.tid=+id;twS1()}
// a class chip: grey when it is not part of this, blue with a tick when it is; a dot says it already has a timetable
const twChip=(c,sel,click)=>`<button type=button class="cls ${sel?'on':'off'}${c.n?' hv':''}" role=${click?'checkbox':'img'} aria-checked=${!!sel} ${click?`onclick="${click}"`:'tabindex=-1'}>${esc(c.name)}${c.n?`<i class=hvd title="${t('wz_has_tt')}"></i>`:''}</button>`;
const twChipKey=()=>`<p class="tw-mu tw-key"><span class="cls on mini">${t('wz_key_on')}</span> <span class="cls off mini">${t('wz_key_off')}</span> <span><i class=hvd></i> ${t('wz_has_tt')}</span></p>`;
// a dropdown with a search box. items: [{id,name}]; pick = name of a global function called with the id
const twCbxPick=(k,id)=>{const f=window[twCbxF[k]];twCbxClose();f&&f(id)};const twCbxF={};
function twCbx(k,items,sel,fn,ph,fmt){twCbxF[k]=fn;window['twCbxI_'+k]=items;const cur=items.find(x=>x.id==sel);
 return`<div class=cbx id=cbx_${k}><button type=button class=cbx-b aria-haspopup=listbox aria-expanded=false onclick="twCbxOpen('${k}')"><span>${cur?esc(fmt?fmt(cur):cur.name):`<em>${esc(ph)}</em>`}</span><i>▾</i></button><div class=cbx-p hidden><input type=search class=cbx-q placeholder="${t('wz_search')}" aria-label="${t('wz_search')}" oninput="twCbxFilter('${k}',this.value)"><div class=cbx-l role=listbox></div></div></div>`}
function twCbxList(k,q){const items=window['twCbxI_'+k]||[];q=(q||'').trim().toLowerCase();const r=items.filter(x=>!q||x.name.toLowerCase().includes(q));
 const e=document.querySelector('#cbx_'+k+' .cbx-l');if(e)e.innerHTML=r.map(x=>`<button type=button role=option class=cbx-o onclick="twCbxPick('${k}',${x.id})">${esc(x.name)}</button>`).join('')||`<p class=tw-mu style="padding:8px 12px">${t('wz_nomatch')}</p>`}
function twCbxFilter(k,q){twCbxList(k,q)}
function twCbxClose(){document.querySelectorAll('.cbx.open').forEach(e=>{e.classList.remove('open');e.querySelector('.cbx-p').hidden=true;e.querySelector('.cbx-b').setAttribute('aria-expanded','false')})}
function twCbxOpen(k){const e=document.getElementById('cbx_'+k),was=e.classList.contains('open');twCbxClose();if(was)return;e.classList.add('open');e.querySelector('.cbx-p').hidden=false;e.querySelector('.cbx-b').setAttribute('aria-expanded','true');const q=e.querySelector('.cbx-q');q.value='';twCbxList(k,'');q.focus()}
document.addEventListener('click',e=>{if(!e.target.closest||!e.target.closest('.cbx'))twCbxClose()});document.addEventListener('keydown',e=>{if(e.key=='Escape')twCbxClose()});
function twTogC(id){const a=TW.sc.cls,i=a.indexOf(id);i<0?a.push(id):a.splice(i,1);twS1()}

// ---------- school day: ribbon + the editor (used by step 2 and by the School calendar tab)
async function twLoadSt(){if(!TW.stv){const r=await api('structure');if(!r.ok)throw new Error(em(r.s,r.d.error));TW.stv=r.d}return TW.stv}
function twRibbon(s){const B=s.blocks,per=B.filter(b=>b.kind=='period'),tot=B.reduce((a,b)=>a+b.minutes,0);let n=0,clk=SC_toMin(s.day_start);const tk=[`<span style="left:0">${twHm(clk)}</span>`];
 const cells=B.map(b=>{const a=clk;clk+=b.minutes;const lunch=b.kind=='break'&&/lunch|d[eé]jeuner|midi/i.test(b.label||''),w=b.minutes/tot*100;
  if(b.kind=='break')tk.push(`<span style="left:${(a-SC_toMin(s.day_start))/tot*100}%;transform:translateX(-50%)">${twHm(a)} ${esc(b.label||t('de_break'))}</span>`);
  return`<div class="${b.kind=='period'?'l':lunch?'lu':'b'}" style="flex:${b.minutes}" title="${twHm(a)} – ${twHm(clk)}">${b.kind=='period'?++n:(w>7||lunch?esc(b.label||''):'☕')}</div>`}).join('');
 tk.push(`<span style="right:0">${twHm(clk)}</span>`);
 return{html:`<div class=ribbon>${cells}</div><div class=ticks>${tk.join('')}</div>`,end:clk,per,n}}
const twDayChips=s=>`<div class=tw-chips>${[1,2,3,4,5,6,7].map(d=>`<span class="daychip${s.days.includes(d)?' on':''}">${DAYS()[d]}</span>`).join('')}</div>`;
async function twS2(){const s=await twLoadSt(),rb=twRibbon(s),len=rb.per.length?rb.per[0].minutes:0;
 $('#tt').innerHTML=`${TWS()}<h1>${t('wz_h2')}</h1><p class=tw-lead>${t('wz_l2')}</p>
 <div class=tw-card><div class="tw-row wrapf" style="margin-bottom:14px">${twDayChips(s)}<span class=tw-mu><b>${twHm(SC_toMin(s.day_start))} → ${twHm(rb.end)}</b> · ${tgF('wz_lessons',{n:rb.per.length,m:len})}</span></div>${rb.html}
 ${TW.edit2?`<div id=twed style="margin-top:18px"></div>`:`<div class="tw-row" style="justify-content:flex-start;gap:10px;margin-top:16px"><button type=button class="tw-btn go" onclick="twStep(3)">${t('wz_looks')}</button><button type=button class="tw-btn ghost" onclick="TW.edit2=1;TW.st=null;twS2()">${t('wz_change')}</button></div>`}</div>
 <div class=tw-card id=twcd style="margin-top:14px"></div>
 ${twFoot("twStep(1)","twStep(3)",t('wz_next3'))}`;twCd();
 if(TW.edit2)twDayEd($('#twed'),()=>{TW.edit2=0;TW.stv=null;TW.tch=null;TW.req=null;twS2()})}
function twDayEd(host,after){TW.stAfter=after;TW.stHost=host;twDayEdDraw()}
async function twDayEdDraw(){const host=TW.stHost;if(!host)return;
 if(!TW.st){const d=await twLoadSt();TW.st={day_start:d.day_start,days:d.days.slice(),win_before:d.win_before,win_after:d.win_after,spot_n:d.spot_n,blocks:d.blocks.map(b=>({...b}))}}
 const s=TW.st,ex=!!s.exam,B=s.blocks,per=B.filter(b=>b.kind=='period'),len=per.length?per[0].minutes:40,mixed=per.some(b=>b.minutes!=len);let n=0,clk=SC_toMin(s.day_start);
 const rows=B.map((b,i)=>{const a=clk;clk+=b.minutes;const tm=`<span class=time>${twHm(a)} – ${twHm(clk)}</span>`;
  if(b.kind=='period')return`<div class=tw-ttl data-i=${i}>${tm}<span class=what>${ex?t('ew_slot'):t('de_lesson')} ${++n}</span></div>`;
  const lunch=/lunch|d[eé]jeuner|midi/i.test(b.label||'');
  return`<div class="tw-ttl ${lunch?'l':'b'}" data-i=${i}><span class=tw-grip role=button tabindex=0 data-i=${i} title="${t('de_grip')}" aria-label="${t('de_grip')}">⠿</span>${tm}<span class="what"><input class=tw-in-s value="${esc(b.label||'')}" placeholder="${t('de_break')}" onchange="twBl(${i},'label',this.value)" aria-label="${t('x_label')}"> <input type=number class=tw-in-n min=5 max=180 value=${b.minutes} onchange="twBl(${i},'minutes',this.value)" aria-label="${t('x_min')}"> min</span><span class=x><button type=button class=tw-lk onclick="twDel(${i})">${t('de_remove')}</button></span></div>`}).join('');
 host.innerHTML=`<div class=tw-fgrid><label class=tw-field>${ex?t('ew_de_start'):t('de_start')}<input type=time value="${s.day_start}" onchange="TW.st.day_start=this.value||TW.st.day_start;twDirt()"></label>
 <label class=tw-field>${ex?t('ew_de_len'):t('de_len')}<input type=number min=5 max=180 value=${len} onchange="twLen(this.value)"></label>
 <div class=tw-field>${ex?t('ew_de_per'):t('de_per')}<div class=tw-stepper><button type=button onclick="twPer(-1)" aria-label="−">−</button><span>${per.length}</span><button type=button onclick="twPer(1)" aria-label="+">+</button></div></div></div>
 ${mixed?`<p class=tw-mu>${t('de_mixed')}</p>`:''}
 ${ex?'':`<p class=tw-lb>${t('de_days')}</p><div class=tw-chips>${[1,2,3,4,5,6,7].map(d=>`<button type=button class="tw-chip${s.days.includes(d)?' on':''}" onclick="twDay2(${d})" aria-pressed="${s.days.includes(d)}">${DAYS()[d]}</button>`).join('')}</div>`}
 <div class=tw-row style="margin:18px 0 10px"><h2 style="margin:0">${ex?t('ew_yday'):t('de_yday')}</h2><span class=tw-mu>${t('de_ends')} <b>${twHm(clk)}</b></span></div><div id=twrows>${rows}</div>
 <p class=tw-mu style="margin:12px 0 0"><button type=button class=tw-lk onclick="twAddBrk()">${t('de_add')}</button> · ${t('de_drag')}</p>
 ${ex?'':`<details class=tw-more><summary>${t('de_more')}</summary><div class=tw-fgrid style="margin-top:14px"><label class=tw-field>${t('x_wb')}<input type=number min=0 max=60 value=${s.win_before} onchange="TW.st.win_before=+this.value;twDirt()"></label><label class=tw-field>${t('x_wa')}<input type=number min=0 max=90 value=${s.win_after} onchange="TW.st.win_after=+this.value;twDirt()"></label><label class=tw-field>${t('x_spot')}<input type=number min=0 max=10 value=${s.spot_n} onchange="TW.st.spot_n=+this.value;twDirt()"></label></div><section id=geo class=tw-geo></section></details>`}
 <p class=err id=e></p><div class=tw-row style="justify-content:flex-start;gap:10px">${ex?`<button type=button class="tw-btn go" onclick="ewDayDone()">${t('ew_day_use')}</button><button type=button class="tw-btn ghost" onclick="ewDayCancel()">${t('ew_day_cancel')}</button>`:`<button type=button class="tw-btn go" onclick="twSaveSt(1)">${t('de_save')}</button><button type=button class="tw-btn ghost" onclick="twDayCancel()">${t('wz_cancel')}</button>`}</div>`;
 twSortable($('#twrows'));
 if(!ex&&typeof geoDraw=='function'){const h=$('#tt');if(h)geoDraw()}}
const twDirt=()=>{if(!(TW.st&&TW.st.exam))TW.stDirty=1};
const twClamp=(v,a,b)=>Math.max(a,Math.min(b,Math.round(+v)||a));
function twBl(i,f,v){const b=TW.st.blocks[i];if(f=='minutes')b.minutes=twClamp(v,5,180);else b.label=String(v).slice(0,30);twDirt();twDayEdDraw()}
function twDel(i){TW.st.blocks.splice(i,1);twDirt();twDayEdDraw()}
function twAddBrk(){const B=TW.st.blocks,ps=[];B.forEach((b,i)=>b.kind=='period'&&ps.push(i));const at=ps.length>1?ps[Math.ceil(ps.length/2)-1]+1:B.length;B.splice(at,0,{kind:'break',minutes:20,label:t('de_break')});twDirt();twDayEdDraw()}
function twLen(v){const m=twClamp(v,5,180);TW.st.blocks.forEach(b=>b.kind=='period'&&(b.minutes=m));twDirt();twDayEdDraw()}
function twPer(d){const B=TW.st.blocks,ps=B.filter(b=>b.kind=='period'),len=ps.length?ps[0].minutes:40;
 if(d>0){if(ps.length<14)B.push({kind:'period',minutes:len,label:null})}else if(ps.length>1){let i=B.length-1;while(B[i].kind!='period')i--;B.splice(i)}twDirt();twDayEdDraw()}
function twDay2(d){const a=TW.st.days;if(a.includes(d)){if(a.length>1)TW.st.days=a.filter(x=>x!=d)}else TW.st.days=[...a,d].sort();twDirt();twDayEdDraw()}
// move a break: it lands before row `to` (0..n) and never ends up first or last
function twMoveBlk(from,to){const B=TW.st.blocks,x=B.splice(from,1)[0];let k=to>from?to-1:to;k=Math.max(1,Math.min(B.length-1,k));B.splice(k,0,x);twDirt();twDayEdDraw()}
// drag by the handle (mouse, pen and touch): the other rows make room, a line shows where it will land
function twSortable(list){if(!list)return;let g=null;
 const rows=()=>[...list.querySelectorAll('.tw-ttl')],pos=y=>{const r=rows();for(let i=0;i<r.length;i++){const b=r[i].getBoundingClientRect();if(y<b.top+b.height/2)return i}return r.length};
 const mv=e=>{if(!g||e.pointerId!=g.id)return;const y=e.clientY,p=pos(y);g.to=p;g.el.style.transform=`translateY(${y-g.y0}px)`;rows().forEach((r,i)=>{r.classList.toggle('dropb',i==p&&r!==g.el);r.classList.toggle('dropa',p==rows().length&&i==rows().length-1&&r!==g.el)})};
 const up=e=>{if(!g||e.pointerId!=g.id)return;const x=g;g=null;document.removeEventListener('pointermove',mv);document.removeEventListener('pointerup',up);document.removeEventListener('pointercancel',up);x.el.classList.remove('lift');x.el.style.transform='';rows().forEach(r=>r.classList.remove('dropb','dropa'));if(e.type=='pointerup'&&x.to!=null&&x.to!=x.i&&x.to!=x.i+1)twMoveBlk(x.i,x.to)};
 list.addEventListener('pointerdown',e=>{const h=e.target.closest&&e.target.closest('.tw-grip');if(!h||(e.pointerType=='mouse'&&e.button))return;e.preventDefault();const el=h.closest('.tw-ttl');g={id:e.pointerId,i:+h.dataset.i,el,y0:e.clientY,to:null};el.classList.add('lift');
  document.addEventListener('pointermove',mv);document.addEventListener('pointerup',up);document.addEventListener('pointercancel',up)});
 list.addEventListener('keydown',e=>{const h=e.target.closest&&e.target.closest('.tw-grip');if(!h||!['ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const i=+h.dataset.i;twMoveBlk(i,e.key=='ArrowUp'?i-1:i+2)})}
async function twSaveSt(show){const s=TW.st;if(!s)return true;const r=await api('structure',{day_start:s.day_start,days:s.days,win_before:s.win_before,win_after:s.win_after,spot_n:s.spot_n,blocks:s.blocks.map(b=>({kind:b.kind,minutes:b.minutes,label:b.kind=='break'?(b.label||t('de_break')):null}))});
 if(!r.ok){const e=$('#e');if(e)e.textContent=em(r.s,r.d.error);return false}
 TW.tch=null;TW.req=null;TW.st=null;TW.edit2=0;TW.calEdit=0;TW.stv=null;TW.stDirty=0;const a=TW.stAfter;TW.stAfter=null;TW.stHost=null;if(show&&a)await a();return true}
function twDayCancel(){TW.st=null;TW.stDirty=0;TW.stHost=null;const a=TW.stAfter;TW.stAfter=null;a&&a()}

// ---------- step 3: teachers' days (all day / morning only / afternoon only / not coming; hold for exact hours)
async function twLoadT(){if(!TW.tch){const a=twArgs(),r=await api('timetable/wiz/teachers'+(a.teacher_id?'?teacher_id='+a.teacher_id:a.classes.length?'?classes='+a.classes.join(','):''));if(!r.ok)throw new Error(em(r.s,r.d.error));TW.tch=r.d}return TW.tch}
const TWN={on:'all',half:'am',pm:'pm',off:'off',part:'part'},TWG={on:'✓',half:'AM',pm:'PM',off:'✕',part:'…'};
const twLine=x=>x.line.map(l=>esc(l.n)+' · '+(l.cls.length>3?(L=='fr'?'toutes ':'all ')+l.cls.length:esc(l.cls.join(', ')))).join(' · ');
const twRowH=x=>{const D0=TW.tch.days,c=tcol(x.id),tight=x.need>x.free;
 return`<div class=tw-trow id=twt${x.id}><div class=who><span class=tw-av style="background:${c.bg};color:${c.fg};border-color:${c.ln}">${esc(initials(x.name))}</span><span class=wt><b>${esc(x.name)}</b><small>${twLine(x)}${x.also.length?` · <em class=also>${tgF('wz_also',{x:esc(x.also.join(', '))})}</em>`:''}</small>${tight?`<small class=tw-warn>${tgF('wz_tight',{m:x.free,n:x.need})}</small>`:''}</span></div>
 ${D0.map(d=>{const s=x.days[d];return`<button type=button class="dc ${s=='on'?'y':s=='off'?'x':'m'}" data-t=${x.id} data-d=${d} aria-label="${esc(x.name)} ${DAYS()[d]}: ${t('wz_'+TWN[s])}">${TWG[s]}</button>`}).join('')}</div>`};
const twList2=()=>{const q=TW.q.trim().toLowerCase(),L2=TW.tch.teachers.filter(x=>!q||x.name.toLowerCase().includes(q));return L2.map(twRowH).join('')||`<p class=tw-mu>${t('wz_noteach')}</p>`};
async function twS3(){await twLoadT();const D0=TW.tch.days;
 $('#tt').innerHTML=`${TWS()}<h1>${t('wz_h3')}</h1><p class=tw-lead>${tgF('wz_l3',{n:`<b>${TW.tch.teachers.length}</b>`})}</p>
 <div class=tw-card><div class="tw-row wrapf" style="margin-bottom:12px"><input type=search class=tw-search placeholder="${t('wz_search')}" value="${esc(TW.q)}" oninput="TW.q=this.value;$('#twl').innerHTML=twList2()" aria-label="${t('wz_search')}">
 <div class=tw-legend><span><i class="dc y mini">✓</i>${t('wz_all')}</span><span><i class="dc m mini">AM</i>${t('wz_am')}</span><span><i class="dc m mini">PM</i>${t('wz_pm')}</span><span><i class="dc x mini">✕</i>${t('wz_off')}</span></div></div>
 <div class=tw-thead style="--d:${D0.length}"><span></span>${D0.map(d=>`<span>${DAYS()[d]}</span>`).join('')}</div><div id=twl style="--d:${D0.length}">${twList2()}</div></div>
 <div id=twn>${TW.note}</div>${twFoot("twStep(2)","twStep(4)",t('wz_next4'))}`;
 twTapWire()}
function twTapWire(){const l=$('#twl');if(!l||l.dataset.w)return;l.dataset.w=1;let tm=0,held=0;
 l.addEventListener('pointerdown',e=>{const b=e.target.closest&&e.target.closest('.dc[data-t]');if(!b)return;held=0;clearTimeout(tm);tm=setTimeout(()=>{held=1;twExact(+b.dataset.t)},550)});
 for(const ev of['pointerup','pointercancel','pointerleave'])l.addEventListener(ev,()=>clearTimeout(tm));
 l.addEventListener('contextmenu',e=>{const b=e.target.closest&&e.target.closest('.dc[data-t]');if(!b)return;e.preventDefault();clearTimeout(tm);held=1;twExact(+b.dataset.t)});
 l.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.dc[data-t]');if(!b)return;if(held){held=0;return}twTap(+b.dataset.t,+b.dataset.d)})}
async function twTap(id,d){const x=TW.tch.teachers.find(k=>k.id==id),old=x.days[d];if(old=='part')return twExact(id);
 const nx={on:'half',half:'pm',pm:'off',off:'on'}[old];x.days[d]=nx;$('#twt'+id).outerHTML=twRowH(x);
 const r=await api('timetable/wiz/day',{teacher_id:id,day:d,state:nx});
 if(!r.ok){x.days[d]=old;$('#twt'+id).outerHTML=twRowH(x);return alert(em(r.s,r.d.error))}
 const a=twArgs(),f=await api('timetable/wiz/teachers'+(a.teacher_id?'?teacher_id='+a.teacher_id:a.classes.length?'?classes='+a.classes.join(','):''));if(f.ok){TW.tch=f.d;const y=TW.tch.teachers.find(k=>k.id==id);y&&$('#twt'+id)&&($('#twt'+id).outerHTML=twRowH(y))}
 TW.note=r.d.clashes?`<p class="box warn">${tgF('wz_awayclash',{n:r.d.clashes,t:esc(x.name)})}</p>`:'';if($('#twn'))$('#twn').innerHTML=TW.note}
async function twExact(id){const s=(await api('structure')).d,tl=TW.tch.teachers;if(!id)return;const a=new Set((await api('unavail?teacher_id='+id)).d.map(x=>x.day+':'+x.period)),nm=(tl.find(k=>k.id==id)||{}).name||'';
 const g=`<section class="dp tp gd"><div style="overflow-x:auto"><table class=tg><tr><th class=tgp>${t('x_period')}${s.days.map(d=>`<th>${DAYS()[d]}`).join('')}${s.periods.map(p=>`<tr><td class=tgp><b>${p.n}</b><small>${p.s}–${p.e}</small>${s.days.map(d=>`<td><input type=checkbox class="av avc" data-d=${d} data-p=${p.n} ${a.has(d+':'+p.n)?'checked':''} aria-label="${DAYS()[d]} ${p.n}">`).join('')}`).join('')}</table></div></section>`;
 ovOpen(`<h2>${tgF('wz_exh',{t:esc(nm)})}</h2><p class=tw-mu>${t('wz_exp')}</p>${g}<p class=err id=twxe></p><div class=ov-a><button type=button class=sb onclick="ovClose()">${t('so_cancel')}</button><button type=button onclick="twExactSave(${id})">${fi('check',18)} ${t('x_save')}</button></div>`)}
async function twExactSave(id){const r=await api('unavail',{teacher_id:id,cells:[...document.querySelectorAll('#ovl .av:checked')].map(e=>({day:+e.dataset.d,period:+e.dataset.p}))});
 if(!r.ok)return $('#twxe').textContent=em(r.s,r.d.error);ovClose();TW.tch=null;const n=r.d.clashes.length;await twS3();
 if(n){TW.note=`<p class="box warn">${tgF('wz_awayclash',{n,t:''})}</p>`;$('#twn').innerHTML=TW.note}}
// ---------- step 4: lessons per week
async function twLoadR(){if(!TW.req){const r=await api('timetable/gen/req');if(!r.ok)throw new Error(em(r.s,r.d.error));TW.req=r.d}return TW.req}
async function twLoadAllT(){if(!TW.at){const r=await api('timetable/wiz/teachers');if(r.ok)TW.at=r.d.teachers.map(x=>({id:x.id,name:x.name}))}return TW.at||[]}
const twSubj=(sid)=>{for(const c of TW.req.classes){const s=c.subjects.find(x=>x.id==sid);if(s)return s}};
const twItem=s=>({subject_id:s.id,per_week:s.per_week||0,max_day:s.max_day||2,doubles:s.doubles||0,split_ok:s.split_ok?1:0,teachers:(s.team||[]).map(x=>({teacher_id:x.teacher_id,per_week:x.per_week||0})),prac:s.prac?{teacher_id:s.prac.teacher_id||null,per_week:s.prac.per_week||1,doubles:s.prac.doubles||0}:false});
const twWClasses=()=>{const s=twScope(),cs=TW.req.classes;if(s.tid)return cs.filter(c=>c.subjects.some(x=>x.teacher_id==s.tid));return cs.filter(c=>s.ids.includes(c.id))};
const twLoadN=s=>(s.per_week||0)+(s.prac?s.prac.per_week||0:0),twUsed=c=>c.subjects.reduce((a,s)=>a+twLoadN(s),0);
async function twS4(){const d=await twLoadR();await twLoadAllT();const cs=twWClasses();
 if(!cs.length)return $('#tt').innerHTML=`${TWS()}<div class=empty>${t('noclass')}</div>${twFoot("twStep(3)",null)}`;
 if(!cs.some(c=>c.id==TW.cid))TW.cid=cs[0].id;if(!TW.from)TW.from=S.now.date;
 const c=cs.find(x=>x.id==TW.cid),M=d.cells;
 const tabs=cs.map(k=>{const u=twUsed(k),w=!u||u>M;return`<button type=button class="ctab${k.id==TW.cid?' act':''}" onclick="TW.cid=${k.id};twS4()"><i class="st${w?' w':''}"></i>${esc(k.name)} <small>${u}/${M}</small></button>`}).join('');
 $('#tt').innerHTML=`${TWS()}<h1>${t('wz_h4')}</h1><p class=tw-lead>${t('wz_l4')}</p><div class=classtabs>${tabs}</div>
 <div class=tw-card style="margin-top:12px"><div class="tw-row wrapf" style="margin-bottom:8px"><b>${tgF('wz_week_of',{c:esc(c.name)})}</b><span id=twtot class=tw-mu></span></div><div id=twbar></div>
 ${c.subjects.length?`<div class=subjects>${c.subjects.map(twCard).join('')}</div>`:`<p class=tw-mu>${t('wz_nosub')}</p>`}</div>
 ${twFoot("twStep(3)","twStep(5)",t('wz_next5'))}`;twTot()}
function twCands(s){const tl=TW.at||[];if(TW.allT[s.id])return tl;const nm=s.name.trim().toLowerCase(),ids=new Set();for(const c of TW.req.classes)for(const x of c.subjects)if(x.teacher_id&&x.name.trim().toLowerCase()==nm)ids.add(x.teacher_id);if(s.teacher_id)ids.add(s.teacher_id);return tl.filter(k=>ids.has(k.id))}
function twCard(s){const c=TW.req.classes.find(k=>k.id==TW.cid),i=[...c.subjects].sort((a,b)=>a.name.localeCompare(b.name)).findIndex(x=>x.id==s.id),pc=palSlot(i),cands=twCands(s),dbl=s.doubles||0,all=TW.allT[s.id];
 return`<div class=subj id=twc${s.id}><i class=stripe style="background:${pc.bg};border-color:${pc.fg}"></i><div class=sbody><b>${esc(s.name)}</b>
  <select class="tw-sel tchsel${s.teacher_id?'':' none'}" onchange="twTeach(${s.id},this.value)" aria-label="${t('tg_tch')}"><option value="">${t('wz_choose_t')}${cands.map(k=>`<option value=${k.id} ${k.id==s.teacher_id?'selected':''}>${tchLbl(k.id,k.name)}`).join('')}${all?'':`<option value=__all>${t('wz_show_all')}`}</select>
  <div class=mchips><button type=button class=mchip onclick="twPop(${s.id})">${tgF('wz_maxd',{n:s.max_day||2})}</button><button type=button class=mchip onclick="twPop(${s.id})">${dbl?tgF('wz_dbl',{n:dbl}):t('wz_nodbl')}</button></div><div class=mchips>${twTeamChips(s)}</div></div>
  <div class=tw-stepper><button type=button onclick="twPw(${s.id},-1)" aria-label="−">−</button><span id=twp${s.id}>${s.per_week||0}</span><button type=button onclick="twPw(${s.id},1)" aria-label="+">+</button></div>
  <button type=button class=more aria-label="${t('wz_more')}" onclick="twPop(${s.id})">⋯</button></div>`}
function twTot(){const c=TW.req.classes.find(x=>x.id==TW.cid),n=twUsed(c),m=TW.req.cells,e=$('#twtot'),b=$('#twbar');if(!c)return;
 if(e)e.innerHTML=n>m?`<span class=tw-w>⚠ ${tgF('wz_over',{n:`<b>${n}</b>`,m:`<b>${m}</b>`,o:n-m})}</span>`:`${tgF('wz_used',{n:`<b>${n}</b>`,m:`<b>${m}</b>`,f:m-n})} <span class=tw-o>✔</span>`;
 const srt=[...c.subjects].sort((a,b)=>a.name.localeCompare(b.name));
 if(b)b.innerHTML=`<div class="cap${n>m?' over':''}">${srt.map((s,i)=>twLoadN(s)?`<div style="flex:${twLoadN(s)};background:${palSlot(i).bg};color:${palSlot(i).fg}" title="${esc(s.name)}">${esc(s.name)} ${twLoadN(s)}</div>`:'').join('')}${n<m?`<div class=rest style="flex:${m-n}"></div>`:''}</div>`;
 document.querySelectorAll('.ctab').forEach((el,i)=>{const k=twWClasses()[i];if(!k)return;const u=twUsed(k);el.querySelector('i').classList.toggle('w',!u||u>m);el.querySelector('small').textContent=u+'/'+m})}
let twT=0;const twDeb=()=>{clearTimeout(twT)};
async function twSaveItem(s,live){const r=await api('timetable/gen/req',{items:[twItem(s)]});if(!r.ok)alert(em(r.s,r.d.error));else if(live&&TW.scr=='res'&&TW.prop)return twLive(s.id);else{TW.reqDirty=1;const e=$('#twredo');if(e)e.hidden=false}}
const twRedraw=()=>TW.scr=='res'?twRes():twS4();
function twPw(id,d){const s=twSubj(id);s.per_week=twClamp((s.per_week||0)+d,twTeamSum(s),TW.req.cells);const e=$('#twp'+id);if(e)e.textContent=s.per_week;twTot();twSaveItem(s,1)}
function twAdv(id,f,d){const s=twSubj(id);s[f]=twClamp((s[f]||0)+d,f=='max_day'?1:0,f=='max_day'?4:5);if(f=='doubles'&&s.doubles&&s.max_day<2)s.max_day=2;twSaveItem(s).then(()=>{twPop(id,1);const c=$('#twc'+id);if(c)c.outerHTML=twCard(s)})}
function twPop(id,keep){const s=twSubj(id),st=(f,v,lo)=>`<div class=tw-stepper><button type=button onclick="twAdv(${id},'${f}',-1)" aria-label="−">−</button><span>${v}</span><button type=button onclick="twAdv(${id},'${f}',1)" aria-label="+">+</button></div>`;
 ovOpen(`<div class=tw-modal><h2>${esc(s.name)}</h2><div class=tw-popr><span>${t('wz_pop_max')}</span>${st('max_day',s.max_day||2)}</div><div class=tw-popr><span>${t('wz_pop_dbl')}</span>${st('doubles',s.doubles||0)}</div>
 <label class=tw-ck style="margin:8px 0"><input type=checkbox ${s.split_ok?'checked':''} onchange="twSplitSet(${id},this.checked)"> ${t('sp_one')}</label><p><button type=button class="tw-btn ghost wide" onclick="twAll(${id})">${t('wz_copy')}</button></p><div class=ov-a><button type=button onclick="ovClose();twRedraw()">${t('wz_done')}</button></div></div>`)}
async function twAll(id){const s=twSubj(id),v=twItem(s),items=[];for(const k of TW.req.classes)for(const x of k.subjects)if(x.name==s.name){Object.assign(x,{per_week:v.per_week,max_day:v.max_day,doubles:v.doubles,split_ok:v.split_ok,team:(s.team||[]).map(q=>({...q})),prac:s.prac?{...s.prac}:null});items.push({...v,subject_id:x.id})}
 const r=await api('timetable/gen/req',{items});if(!r.ok)return alert(em(r.s,r.d.error));ovClose();if(TW.scr=='res'&&TW.prop)return twLive(0);twRedraw()}
async function twTeach(id,tid){if(tid=='__all'){TW.allT[id]=1;return twRedraw()}const s=twSubj(id),r=await api('subjects/teacher',{subject_id:id,teacher_id:tid?+tid:null});await palLoad();if(!r.ok){alert(em(r.s,r.d.error));return twRedraw()}
 s.teacher_id=tid?+tid:null;TW.tch=null;TW.reqDirty=1;twRedraw()}

// ---------- step 5: review and create
async function twS5(){const d=await twLoadR();await twLoadT().catch(()=>0);const sc=twScope(),cs=twWClasses();if(!TW.from)TW.from=S.now.date;
 const ids=new Set(),withL=cs.filter(c=>{let on=0;for(const s of c.subjects)if(s.per_week>0){on++;s.teacher_id&&ids.add(s.teacher_id)}return on});
 $('#tt').innerHTML=`${TWS()}<h1>${t('wz_h5')}</h1><p class=tw-lead>${t('wz_l5')}</p>
 <div class=rev><div class=tw-card><div class=tw-row><span class=tw-cap>${t('wz_for')}</span><button type=button class=tw-lk onclick="twStep(1)">${t('wz_edit')}</button></div><h2 style="margin:6px 0">${esc(sc.label)}</h2>${(sc.tid?cs.length:sc.names.length)>1?`<p class=tw-mu>${esc(sc.tid?cs.map(c=>c.name).join(', '):sc.names.join(', '))}</p>`:''}
  <div class=tw-badges><span class="pill ok">✓ ${tgF('wz_t_set',{n:(TW.tch?TW.tch.teachers.length:0)})}</span><span class="pill ok">✓ ${t('wz_day_set')}</span></div><div id=twck class=tw-checks></div></div>
 <div class=tw-card><label class=tw-field>${t('wz_start')}<input type=date id=twf value="${TW.from}" min="${S.now.date}" onchange="TW.from=this.value;twCheck()"></label>
  ${sc.keep&&!sc.tid||sc.tid?`<div class="radio act" style="margin:12px 0;cursor:default"><i class=dot></i><span><b>${tgF('wz_keep_o',{n:sc.tid?(TW.od.sections.flatMap(s=>s.classes).filter(c=>c.n).length):sc.keep})}</b><small>${t('wz_keep_op')}</small></span></div>`:''}
  <details class=tw-more><summary>${t('wz_rules')}</summary><label class=tw-ck><input type=checkbox id=twk ${TW.keep?'checked':''} onchange="TW.keep=this.checked?1:0;twCheck()"> ${t('wz_keepl')}</label><p class=tw-mu>${t('tg_p2')}</p><label class=tw-ck><input type=checkbox id=twc1 ${d.cfg.morning?'checked':''}> ${t('tg_morn')}</label><label class=tw-field style="max-width:240px">${t('tg_heavy')}<input type=number id=twc2 min=1 max=10 value="${d.cfg.heavy}"></label><label class=tw-ck><input type=checkbox id=twc3 ${d.cfg.gaps?'checked':''}> ${t('tg_gaps')}</label><label class=tw-ck><input type=checkbox id=twc5 ${d.cfg.split?'checked':''}> ${t('sp_all')}</label><label class=tw-field style="max-width:240px">${t('tg_tmax')}<input type=number id=twc4 min=0 max=14 value="${d.cfg.tmax}"></label></details>
  <p class=err id=e></p><p><button type=button class="tw-btn go big" id=twgo onclick="twCreate()">${t('wz_create')}</button></p></div></div>
 ${twFoot("twStep(4)",null)}`;twCheck()}
async function twCheck(){const e=$('#twck');if(!e)return;const d=TW.req,sc=twScope(),a=twArgs(),from=($('#twf')||{}).value||TW.from,mode=$('#twk')&&$('#twk').checked?'fill':'fresh',
 r=await api(`timetable/gen/check?from=${from}&mode=${mode}${a.teacher_id?'&teacher_id='+a.teacher_id:'&classes='+a.classes.join(',')}`);if(!r.ok||!$('#twck'))return;const ck=r.d,cs=twWClasses();
 const wn=(x,step)=>`<button type=button class="tw-check warnb" onclick="twStep(${step})"><span class=warn>⚠</span> ${x}</button>`,lim=(arr,f)=>arr.slice(0,4).map(f).join('')+(arr.length>4?`<div class=tw-check><span class=warn>⚠</span> ${tgF('wz_w_more',{n:arr.length-4})}</div>`:'');
 const inS=new Set(cs.map(c=>c.id)),bad=ck.teachers.filter(x=>x.need>x.free),badc=ck.classes.filter(x=>inS.has(x.id)&&x.need>x.cells),empty=cs.filter(c=>!c.subjects.some(s=>s.per_week>0)),
  nt=ck.noteacher.filter(x=>inS.has(x.class_id)),nr=ck.noreq.filter(x=>inS.has(x.class_id));
 const html=lim(bad,x=>wn(tgF('wz_w_o',{t:esc(x.name),n:x.need,m:x.free}),3))+lim(badc,x=>wn(tgF('wz_w_cl',{c:esc(x.name),n:x.need,m:x.cells}),4))+(empty.length?wn(tgF('wz_w_cw',{n:empty.length}),4):'')+(nt.length?wn(tgF('wz_w_nt',{n:nt.length}),4):'')+(nr.length?wn(tgF('wz_w_nr',{n:nr.length}),4):'');
 e.innerHTML=html||`<div class=tw-check><span class=ok>✔</span> ${t('wz_ok_all')}</div>`;
 if(empty.length==cs.length&&cs.length&&!$('#twnl'))e.insertAdjacentHTML('beforeend',`<p class="box bad" id=twnl>${t('wz_nolessons')}</p>`)}
async function twCreate(){const b=$('#twgo');if(b){b.disabled=true;b.textContent=t('wz_working')}$('#e')&&($('#e').textContent='');
 if($('#twc1')){const c=await api('timetable/gen/cfg',{morning:$('#twc1').checked,heavy:+$('#twc2').value,gaps:$('#twc3').checked,tmax:+$('#twc4').value,split:$('#twc5').checked});if(!c.ok){b.disabled=false;b.textContent=t('wz_create');return $('#e').textContent=em(c.s,c.d.error)}
  TW.from=$('#twf').value;TW.keep=$('#twk').checked?1:0}
 const a=twArgs(),r=await api('timetable/gen',{from:TW.from,mode:TW.keep?'fill':'fresh',...a});
 if(!r.ok){const m=em(r.s,r.d.error);if(b){b.disabled=false;b.textContent=t('wz_create');$('#e').textContent=m}else alert(m);return}
 const keepV=TW.scr=='res'&&TW.pt=='c'&&r.d.scope.includes(TW.pv)?TW.pv:null;TW.prop=r.d;TW.live='';TW.pt='c';TW.pv=keepV||r.d.scope[0]||0;TW.reqDirty=0;TW.scr='res';twRender()}
// ---------- School calendar: the school day and the days off
async function twCal(){const s=await twLoadSt();TW.stv=null;const rb=twRibbon(s),len=rb.per.length?rb.per[0].minutes:0,today=S.now.date,mo=new Intl.DateTimeFormat(L=='fr'?'fr':'en',{month:'short',timeZone:'UTC'});
 const off=s.closed.filter(c=>c.date>=today),wd=dt=>DAYS()[new Date(dt+'T00:00:00Z').getUTCDay()||7];
 $('#tt').innerHTML=`<h1>${t('tw_cal_h')}</h1><p class=tw-lead>${t('tw_cal_p')}</p>
 <div class=cal2><div class=tw-card><div class=tw-row><h2 style="margin:0">${t('tw_cal_day')}</h2>${TW.calEdit?'':`<button type=button class="tw-btn sm" onclick="TW.calEdit=1;TW.st=null;twCal()">${t('tw_edit')}</button>`}</div>
  <div style="margin:14px 0">${rb.html}</div><p class=tw-mu style="margin:0 0 12px">${twHm(SC_toMin(s.day_start))} → ${twHm(rb.end)} · ${tgF('wz_lessons',{n:rb.per.length,m:len})}</p>${twDayChips(s)}${TW.calEdit?'<div id=twed style="margin-top:18px"></div>':''}</div>
 <div class=tw-card><div class=tw-row><h2 style="margin:0">${t('tw_off_h')}</h2><button type=button class="tw-btn sm blue" onclick="twOffAdd()">${t('tw_add')}</button></div>
  ${off.length?off.map(c=>{const dt=new Date(c.date+'T00:00:00Z');return`<div class=offrow><div class=datebox><i>${mo.format(dt).toUpperCase().replace('.','')}</i><b>${dt.getUTCDate()}</b></div><div class=grow><b>${esc(c.label)}</b><small>${wd(c.date)} · ${t('tw_off_whole')}</small></div><button type=button class="ib dn" onclick="twOffDel('${c.date}')" aria-label="${t('tw_off_del')}">${fi('trash',18)}</button></div>`}).join(''):`<p class=tw-mu>${t('tw_off_none')}</p>`}</div></div>`;
 if(TW.calEdit)twDayEd($('#twed'),()=>{TW.calEdit=0;twCal()})}
function twOffAdd(){ovOpen(`<div class=tw-modal><h2>${t('tw_off_h')}</h2><div class=fg><div><label for=cf>${t('tw_off_from')}</label><input type=date id=cf min="${S.now.date}"></div><div><label for=ct>${t('tw_off_to')}</label><input type=date id=ct></div><div class=fw><label for=cb>${t('tw_off_label')}</label><input id=cb maxlength=60></div></div><p class=err id=e></p><div class=ov-a><button type=button class=sb onclick="ovClose()">${t('so_cancel')}</button><button type=button onclick="twOffSave()">${t('tw_off_save')}</button></div></div>`)}
async function twOffSave(){const r=await api('closed',{date:$('#cf').value,to:$('#ct').value||undefined,label:$('#cb').value});if(!r.ok)return $('#e').textContent=em(r.s,r.d.error);ovClose();twCal()}
async function twOffDel(d){await api('closed/delete',{date:d});twCal()}


// ---------- class pills, and the lessons-per-week editor under a suggestion
const twPills=(items,sel,js,label)=>`<div class="pills noprint" data-pk="${esc(label||'p')}" style="--pr:${items.length>6?2:1}" onscroll="PSCR[this.dataset.pk]=this.scrollLeft" role=group aria-label="${esc(label||'')}">${items.map(x=>`<button type=button class="pl${x[0]==sel?' on':''}" aria-pressed=${x[0]==sel} onclick="${js.replace('#',x[0])}">${x[2]||esc(x[1])}</button>`).join('')}</div>`;
async function twResEd(){const h=$('#twed2');if(!h||TW.pt!='c')return;try{await twLoadR();await twLoadAllT()}catch(e){return}
 const c=TW.req.classes.find(k=>k.id==TW.pv);if(!c){h.innerHTML='';return}TW.cid=c.id;
 h.innerHTML=`<div class="tw-row wrapf" style="margin-bottom:6px"><h2 style="margin:0">${tgF('rs_h',{c:esc(c.name)})}</h2><span id=twtot class=tw-mu></span></div><p class=tw-mu style="margin:0 0 10px">${t('rs_p')}</p><div id=twbar></div>
 ${c.subjects.length?`<div class=subjects>${c.subjects.map(twCard).join('')}</div>`:`<p class=tw-mu>${t('wz_nosub')}</p>`}
 <div id=twredo class="box warn tw-redo" ${TW.reqDirty?'':'hidden'}><span>${t('rs_changed')}</span><button type=button class="tw-btn go" onclick="twCreate()">↻ ${t('rs_redo')}</button></div>`;twTot()}
Object.assign(D.en,{wz_nomatch:'No match.',wz_many_sec:'You can pick more than one',wz_sel_all:'Select all',wz_sel_none:'Clear',wz_has_tt:'already has a timetable',wz_key_on:'Included',wz_key_off:'Not included',rs_h:'Lessons per week · [c]',rs_p:'Change how many lessons each subject gets, then try again to get a new suggestion with these numbers.',rs_changed:'Numbers changed. The suggestion above does not use them yet.',rs_redo:'Try again with these numbers'});
Object.assign(D.fr,{wz_nomatch:'Aucun résultat.',wz_many_sec:'Vous pouvez en choisir plusieurs',wz_sel_all:'Tout sélectionner',wz_sel_none:'Effacer',wz_has_tt:'a déjà un emploi du temps',wz_key_on:'Inclus',wz_key_off:'Non inclus',rs_h:'Cours par semaine · [c]',rs_p:'Changez le nombre de cours de chaque matière, puis réessayez pour obtenir une nouvelle proposition avec ces nombres.',rs_changed:'Les nombres ont changé. La proposition ci-dessus ne les utilise pas encore.',rs_redo:'Réessayer avec ces nombres'});
