// Timetable page (redesign 10n): four tabs (Timetables · Create new · Exam timetables · School calendar), the overview of who has a timetable,
// the grid with drag-and-drop swapping (suggested and live timetables), the suggested-timetable screen and the unsaved-changes guard.
// The create-new wizard lives in ttwz.js. Loaded after ttgen.js; replaces vTT / vMyTT.
Object.assign(D.en,{tw_tab_list:'Timetables',tw_tab_new:'+ Create new',tw_tab_exam:'Exam timetables',tw_tab_subj:'Subjects & teachers',tw_tab_cal:'School calendar',
 tw_ov_h:'Timetables',tw_ov_p:'See which classes have a timetable. Tap a class to open it.',tw_by_c:'By class',tw_by_t:'By teacher',tw_have_n:'classes have a timetable',tw_have_nt:'teachers have lessons in the timetable',tw_mk_missing:'+ Create for the [n] missing',
 tw_lg_has:'Has a timetable',tw_lg_none:'No timetable yet',tw_lg_attn:'Needs attention (e.g. teacher changed)',tw_complete:'Complete',tw_missing:'[n] missing',tw_print_sec:'Print section',tw_all_cls:'All classes',tw_all_t:'All teachers',tw_2sec:'[n] sections',
 tw_all_tt:'All timetables',tw_print_tt:'Print this timetable',tw_apply_from:'Changes apply from',tw_ttof:'[x] timetable',tw_vtip:'Tap any lesson to change it, or drag it onto another lesson to swap them.',tw_vtip_t:'Teacher timetables are read-only. Open a class to change lessons.',
 tw_ptip:'Tap a lesson to change it, or drag it onto another lesson to swap them. Green means the swap works; red tells you why not.',tw_pfree:'Class busy: [c]',tw_pnone:'Nothing to place here.',tw_pt_s:'[t] · Choose a lesson to place here',
 tw_warn_h:'Every class already has a timetable',tw_warn_p:'All [n] classes have a timetable in use. If you only need to move a lesson or change a teacher, you can do it directly in Timetables: tap the lesson, or drag it onto another one. Creating a new one will replace the current timetables from the start date you pick.',tw_warn_go:'Go to Timetables and edit',tw_warn_any:'Create a new one anyway',tw_cancel:'Cancel',
 tw_free:'Free ✔',tw_busy:'Teaching [c]',tw_away:'Not available then',tw_have:'Already [n] this week',tw_empty:'Leave empty',tw_ph:'+ empty',tw_who:'Teachers in this timetable',tw_noview:'No timetable yet. Press Create new.',tw_close:'Close',tw_mod_s:'[c] · Choose what to put here',
 tw_rh:'Suggested timetable',tw_rtip:'Look it over, then press Use this timetable.',tw_noclash:'Every lesson is placed. No clashes.',tw_unpl:'[n] lessons could not be placed.',tw_use:'Use this timetable',tw_again:'Try again',tw_applied:'The new timetable is in place.',tw_back1:'← Back',
 tw_vc:'By class',tw_vt:'By teacher',tw_leave:'This timetable is not saved yet. Leave anyway and lose your changes?',tw_saved:'Saved.',
 sw_busy:'[t] already teaches [c] at that time.',sw_away:'[t] is not available then.',sw_tmax:'[t] would have more than [n] lessons that day.',sw_maxday:'[s] can only have [n] lessons in a day.',sw_split:'[s] lessons in one day must stay together: no break or other subject between them.',sw_same:'Same lesson: nothing to swap.',sw_samesub:'Same lesson: nothing to swap.',sw_empty:'Nothing to swap.',sw_ok:'Swap',sw_done:'Swapped.',sw_fail:'These two cannot swap',
 tw_unpl_h:'Not placed',tg_q:'Quality',
 tw_cal_h:'School calendar',tw_cal_p:'Your normal school day and the days the school is closed. Used by all timetables.',tw_cal_day:'School day',tw_edit:'✎ Edit',tw_off_h:'Days off',tw_add:'+ Add',tw_off_none:'No days off yet.',tw_off_whole:'whole school',tw_off_from:'First day',tw_off_to:'Last day (optional)',tw_off_label:'Reason',tw_off_save:'Add day off',tw_off_del:'Remove',
 tw_lessons10:'[n] lessons of [m] min',tw_brk_at:'[t] [l]'});
Object.assign(D.fr,{tw_tab_list:'Emplois du temps',tw_tab_new:'+ Créer',tw_tab_exam:'Examens',tw_tab_subj:'Matières et enseignants',tw_tab_cal:'Calendrier scolaire',
 tw_ov_h:'Emplois du temps',tw_ov_p:'Voyez quelles classes ont un emploi du temps. Touchez une classe pour l’ouvrir.',tw_by_c:'Par classe',tw_by_t:'Par enseignant',tw_have_n:'classes ont un emploi du temps',tw_have_nt:'enseignants ont des cours dans l’emploi du temps',tw_mk_missing:'+ Créer pour les [n] manquante(s)',
 tw_lg_has:'A un emploi du temps',tw_lg_none:'Pas encore d’emploi du temps',tw_lg_attn:'À vérifier (ex. enseignant changé)',tw_complete:'Complet',tw_missing:'[n] manquante(s)',tw_print_sec:'Imprimer la section',tw_all_cls:'Toutes les classes',tw_all_t:'Tous les enseignants',tw_2sec:'[n] sections',
 tw_all_tt:'Tous les emplois du temps',tw_print_tt:'Imprimer cet emploi du temps',tw_apply_from:'Modifications à partir du',tw_ttof:'Emploi du temps : [x]',tw_vtip:'Touchez un cours pour le modifier, ou glissez-le sur un autre cours pour les échanger.',tw_vtip_t:'Les emplois du temps des enseignants sont en lecture seule. Ouvrez une classe pour modifier les cours.',
 tw_ptip:'Touchez un cours pour le modifier, ou glissez-le sur un autre pour les échanger. Vert : l’échange est possible ; rouge : on vous dit pourquoi non.',tw_pfree:'Classe occupée : [c]',tw_pnone:'Rien à placer ici.',tw_pt_s:'[t] · Choisissez un cours à placer ici',
 tw_warn_h:'Toutes les classes ont déjà un emploi du temps',tw_warn_p:'Les [n] classes ont un emploi du temps en cours. Pour déplacer un cours ou changer d’enseignant, faites-le directement dans « Emplois du temps » : touchez le cours, ou glissez-le sur un autre. En créer un nouveau remplacera les emplois du temps actuels à partir de la date choisie.',tw_warn_go:'Aller aux emplois du temps et modifier',tw_warn_any:'Créer quand même un nouveau',tw_cancel:'Annuler',
 tw_free:'Libre ✔',tw_busy:'Enseigne en [c]',tw_away:'Indisponible à ce moment',tw_have:'Déjà [n] cette semaine',tw_empty:'Laisser vide',tw_ph:'+ vide',tw_who:'Enseignants de cet emploi du temps',tw_noview:'Pas encore d’emploi du temps. Appuyez sur « Créer ».',tw_close:'Fermer',tw_mod_s:'[c] · Choisissez ce qu’il faut mettre ici',
 tw_rh:'Emploi du temps proposé',tw_rtip:'Regardez-le, puis appuyez sur « Utiliser cet emploi du temps ».',tw_noclash:'Tous les cours sont placés. Aucun conflit.',tw_unpl:'[n] cours n’ont pas pu être placés.',tw_use:'Utiliser cet emploi du temps',tw_again:'Réessayer',tw_applied:'Le nouvel emploi du temps est en place.',tw_back1:'← Retour',
 tw_vc:'Par classe',tw_vt:'Par enseignant',tw_leave:'Cet emploi du temps n’est pas encore enregistré. Quitter quand même et perdre vos modifications ?',tw_saved:'Enregistré.',
 sw_busy:'[t] enseigne déjà en [c] à ce moment.',sw_away:'[t] n’est pas disponible à ce moment.',sw_tmax:'[t] aurait plus de [n] cours ce jour-là.',sw_maxday:'[s] ne peut avoir que [n] cours par jour.',sw_split:'Les cours de [s] d’une même journée doivent rester groupés : ni pause ni autre matière entre eux.',sw_same:'Même cours : rien à échanger.',sw_samesub:'Même cours : rien à échanger.',sw_empty:'Rien à échanger.',sw_ok:'Échanger',sw_done:'Échangé.',sw_fail:'Ces deux cours ne peuvent pas être échangés',
 tw_unpl_h:'Non placés',tg_q:'Qualité',
 tw_cal_h:'Calendrier scolaire',tw_cal_p:'Votre journée normale et les jours où l’école est fermée. Utilisé par tous les emplois du temps.',tw_cal_day:'Journée d’école',tw_edit:'✎ Modifier',tw_off_h:'Jours de congé',tw_add:'+ Ajouter',tw_off_none:'Aucun jour de congé.',tw_off_whole:'toute l’école',tw_off_from:'Premier jour',tw_off_to:'Dernier jour (facultatif)',tw_off_label:'Motif',tw_off_save:'Ajouter le congé',tw_off_del:'Retirer',
 tw_lessons10:'[n] cours de [m] min',tw_brk_at:'[t] [l]'});

const TW={scr:'list',step:1,ov:'c',view:'c',cid:0,tid:0,st:null,stDirty:0,tch:null,req:null,q:'',note:'',msg:'',prop:null,pt:'c',pv:0,from:'',keep:0,sel:0,cell:null,day:0,od:null,sc:{kind:'classes',sec:0,cls:[],tid:0,redo:0},allT:{},ses:0};
// Colours: a few clearly different pale ones; when they run out the same colours return with a distinct shape in the corner (palette comes from the server: ttpal.js, also used by the PDFs).
const TPAL={ok:0,colors:[],shapes:{},order:[],idx:{},loads:{}};
async function palLoad(){try{const r=await api('palette');if(r.ok)Object.assign(TPAL,r.d,{ok:1})}catch{}}
const palSlot=i=>{const c=TPAL.colors[i%TPAL.colors.length],r=Math.floor(i/TPAL.colors.length);return{...c,shape:r?TPAL.order[(r-1)%TPAL.order.length]:null}};
const palSvg=(shape,fg)=>"url('data:image/svg+xml,"+encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><path d='"+TPAL.shapes[shape]+"' fill='"+fg+"'/></svg>").replace(/'/g,'%27')+"')";
const palStyle=i=>{const c=palSlot(i);return`background:${c.bg}${c.shape?' '+palSvg(c.shape,c.fg)+' no-repeat right 7px top 7px/15px 15px':''};color:${c.fg};border-color:rgba(0,0,0,.16)${c.shape?';padding-right:28px':''}`};
const tcol=id=>{if(!id)return{bg:'#f1efe8',fg:'#5d6577',ln:'#d9d5c8'};if(TPAL.ok&&TPAL.idx[id]!=null){const c=palSlot(TPAL.idx[id]);return{bg:c.bg,fg:c.fg,ln:'rgba(0,0,0,.16)'}}
 const h=Math.round((id*137.508)%360),v=id%3,s=[62,72,54][v],l=[90,86,92][v];return{bg:`hsl(${h} ${s}% ${l}%)`,fg:`hsl(${h} ${s-8}% ${[21,19,23][v]}%)`,ln:`hsl(${h} ${s}% ${l-12}%)`}};
const tcs=id=>{if(id&&TPAL.ok&&TPAL.idx[id]!=null)return palStyle(TPAL.idx[id]);const c=tcol(id);return`background:${c.bg};color:${c.fg};border-color:${c.ln}`};
// "Name — Physics (F1A, F2A) · Biology (F3A)": what a teacher teaches, at a glance, in every teacher drop-down
const tchLbl=(id,name)=>{const l=TPAL.loads[id];return esc(name)+(l?' — '+esc(l.length>90?l.slice(0,88)+'…':l):'')};
const twHm=m=>Math.floor(m/60)+':'+String(m%60).padStart(2,'0');
const twAdm=()=>S.role=='principal';
const twTrk=()=>(S.modules||['reports','fees','tracking']).includes('tracking');
// ---------- unsaved changes: a suggested timetable that is not used yet, or a school day being edited
const twDirty=()=>!!(TW.prop&&TW.scr=='res')||!!TW.stDirty;
const twLeave=()=>{if(!twDirty())return true;if(!confirm(t('tw_leave')))return false;TW.prop=null;TW.stDirty=0;TW.st=null;TW.edit2=0;TW.calEdit=0;TW.stHost=null;return true};
window.addEventListener('beforeunload',e=>{if(twDirty()){e.preventDefault();e.returnValue=''}});
addEventListener('DOMContentLoaded',()=>{const g=frGo;frGo=async function(f){if(VIEWNOW=='vTT'&&f!='vTT'&&!twLeave())return;return g(f)}});
// ---------- shell
async function vTT(tab){const adm=twAdm();TW.msg='';TW.note='';
 if(!adm){TW.scr='view';TW.prop=null;return twRender()}
 if(TW.pre){TW.pre=0;TW.prop=null}   // a search result opened a class or teacher directly
 else if(tab=='ex')TW.scr='exam';else if(tab=='cls'||tab=='tch'){TW.view=tab=='tch'?'t':'c';TW.scr='view'}
 else if(!twTrk())TW.scr='exam';
 else TW.scr='list';
 if(TW.scr=='res'&&!TW.prop)TW.scr='list';
 return twRender()}
function twGo(scr,step){if(!twLeave())return;TW.scr=scr;if(step)TW.step=step;TW.msg='';TW.note='';twRender()}
const twTabs=()=>{if(!twAdm())return'';
 const cur=TW.scr=='view'||TW.scr=='list'?'list':TW.scr=='exam'?'exam':TW.scr=='cal'?'cal':TW.scr=='subj'?'subj':'new';
 const T=twTrk()?[['list',"twTab('list')"],['new',"twTab('new')"],['subj',"twTab('subj')"],['exam',"twTab('exam')"],['cal',"twTab('cal')"]]:[['exam',"twTab('exam')"],['subj',"twTab('subj')"]];
 return`<div class="tw-tabs noprint" role=tablist>${T.map(([k,f])=>`<button type=button role=tab class="tw-tab${k==cur?' on':''}" aria-selected="${k==cur}" onclick="${f}">${t('tw_tab_'+k)}</button>`).join('')}</div>`};
function twTab(k){if(!twLeave())return;TW.msg='';TW.note='';if(k=='list'){TW.scr='list';return twRender()}if(k=='new')return twNew();TW.scr=k;twRender()}
async function twRender(){
 $('#m').innerHTML=`<div class=tw>${twTabs()}<div id=tt></div></div>`;
 try{await palLoad();await({list:twList,wiz:twWiz,view:twView,res:twRes,cal:twCal,exam:ettMain,subj:()=>subjDraw()}[TW.scr]||twList)()}catch(e){$('#tt').innerHTML=`<p class="box bad">${esc(String(e.message||e))}</p>`}}
const twErr=(r)=>`<p class="box bad">${em(r.s,r.d.error)}</p>`;
// ---------- overview: who has a timetable
async function twOv(){const r=await api('timetable/overview');if(!r.ok)throw new Error(em(r.s,r.d.error));TW.od=r.d;return r.d}
function twList(){return twOv().then(d=>{const byT=TW.ov=='t';
 const secName=s=>d.multi?esc(s.name):t(byT?'tw_all_t':'tw_all_cls');
 const done=byT?d.teachers_done:d.done,tot=byT?d.teachers_total:d.total,miss=tot-done;
 const missIds=d.sections.flatMap(s=>s.classes.filter(c=>!c.n).map(c=>c.id));
 const sects=d.sections.filter(s=>byT?s.teachers.length:s.classes.length).map(s=>{
  const items=byT?s.teachers:s.classes,has=items.filter(x=>x.n).length,miss2=items.length-has,pct=items.length?Math.round(100*has/items.length):0;
  const chip=x=>byT?(x.n?`<button type=button class="cls ${x.attn?'old':'has'}" onclick="twOpen('t',${x.id})">${esc(x.name)}${x.secs.length>1&&d.multi?` <small class=tw-tag2>${tgF('tw_2sec',{n:x.secs.length})}</small>`:''}</button>`:`<button type=button class="cls none" onclick="twStartT(${x.id})">${esc(x.name)}${x.secs.length>1&&d.multi?` <small class=tw-tag2>${tgF('tw_2sec',{n:x.secs.length})}</small>`:''}</button>`)
   :`<button type=button class="cls ${x.n?(x.attn?'old':'has'):'none'}" onclick="${x.n?`twOpen('c',${x.id})`:`twStartC([${x.id}])`}">${esc(x.name)}</button>`;
  const ids=s.classes.filter(c=>!c.n).map(c=>c.id);
  return`<div class=sect><div class=sect-h><h3>${secName(s)}</h3><span class=count>${has} / ${items.length}</span><div class=minibar><i style="width:${pct}%"></i></div>${miss2?`<span class="pill warn">${tgF('tw_missing',{n:miss2})}</span>`:`<span class="pill ok">${t('tw_complete')}</span>`}<div class=grow></div>
   ${byT?'':miss2?`<button type=button class="tw-btn sm blue" onclick="twStartSec(${s.id})">${tgF('tw_mk_missing',{n:miss2})}</button>`:`<a class="tw-btn sm" href="/api/timetable/pdf?classes=${s.classes.map(c=>c.id).join(',')}&date=${d.date}&lang=${L}">${fi('print',16)} ${t('tw_print_sec')}</a>`}</div>
   <div class=chips>${items.map(chip).join('')}</div></div>`}).join('');
 $('#tt').innerHTML=`<div class="tw-row wrapf"><div><h1>${t('tw_ov_h')}</h1><p class=tw-lead>${t('tw_ov_p')}</p></div><div class=tw-seg><button type=button class="${byT?'':'on'}" onclick="TW.ov='c';twList()">${t('tw_by_c')}</button><button type=button class="${byT?'on':''}" onclick="TW.ov='t';twList()">${t('tw_by_t')}</button></div></div>
 <div class=tw-card><div class=summary><div><div class=bignum>${done} <span>/ ${tot}</span></div><div class=tw-mu>${t(byT?'tw_have_nt':'tw_have_n')}</div></div><div class=bigbar><i style="width:${tot?Math.round(100*done/tot):0}%"></i></div>${!byT&&miss?`<button type=button class="tw-btn go" onclick="twStartC([${missIds.join(',')}])">${tgF('tw_mk_missing',{n:miss})}</button>`:''}</div>
 <div class=legend><span><i class=sw style="background:var(--tw-gs);border-color:#9fd3b5"></i>${t('tw_lg_has')}</span><span><i class=sw style="border-style:dashed;border-color:#c7cbd6"></i>${t('tw_lg_none')}</span><span><i class=sw style="background:#fdf3dc;border-color:#ecc77a"></i>${t('tw_lg_attn')}</span></div></div>${sects}`})}
function twOpen(k,id){if(k=='t'){TW.view='t';TW.tid=id}else{TW.view='c';TW.cid=id}TW.scr='view';twRender()}
// ---------- the colour grid (class, teacher and "my" timetable)
function ttg(r,cell,o={}){const rows=[...r.periods.map(p=>({...p,k:'p'})),...r.breaks.map(b=>({...b,k:'b'}))].sort((a,b)=>a.start-b.start),td=S.now.dow,nd=r.days.length,off=new Set(r.off||[]);
 if(!r.days.includes(TW.day))TW.day=r.days.includes(td)?td:r.days[0];
 const dtabs=`<div class="tw-dtabs noprint">${r.days.map(d=>`<button type=button class="${d==TW.day?'on':''}${d==td?' now':''}" onclick="twDay(${d})">${DAYS()[d]}</button>`).join('')}</div>`;
 return`${dtabs}<div class=tw-scroll><div class="tw-tt" data-day="${TW.day}" style="--d:${nd}"><div class=cn></div>${r.days.map(d=>`<div class="h dd${d}${d==td?' now':''}${off.has(d)?' offh':''}">${DAYS()[d]}</div>`).join('')}${rows.map(x=>x.k=='b'?`<div class=brk>${esc(x.label||t('tw_break'))} · ${x.s} – ${x.e}</div>`:`<div class=tm><b>${x.n}</b><span>${x.s} – ${x.e}</span></div>${r.days.map(d=>off.has(d)?`<div data-dc="${d}" class="tw-cell offd" title="${t('cd_off')}"><small>${t('cd_off')}</small></div>`:String(cell(d,x.n,x)).replace('<div','<div data-dc="'+d+'"')).join('')}`).join('')}</div></div>`}
function twDay(d){TW.day=d;document.querySelectorAll('.tw-tt').forEach(e=>e.dataset.day=d);document.querySelectorAll('.tw-dtabs button').forEach((b,i)=>b.classList.toggle('on',b.textContent==DAYS()[d]))}
// teachers of the timetable on screen: each pill opens that teacher's availability; the button opens everyone's, below
const twLegend=(m,o={})=>{const u=[...new Map(m.filter(s=>s.teacher_id).map(s=>[s.teacher_id,s.teacher])).entries()].sort((a,b)=>a[1].localeCompare(b[1]));if(!u.length)return'';
 if(o.btn!==false)TW.avIds=u.map(x=>x[0]);
 return`<div class="tw-leg"><b>${t('tw_who')}</b>${u.map(([id,n])=>`<button type=button class=tw-lg style="${tcs(id)}" title="${t('av_pill')}" onclick="twTchPop(${id})">${esc(n)}</button>`).join('')}${o.btn!==false?`<button type=button class="tw-btn sm blue tw-avb" aria-expanded="${TW.avOpen?'true':'false'}" onclick="twAvToggle()">${t('av_btn')}</button>`:''}</div>${o.btn!==false?'<div id=twav class=tw-avp></div>':''}`};
const twSeg=()=>`<span class=tw-seg><button type=button class="${(TW.scr=='res'?TW.pt:TW.view)=='c'?'on':''}" onclick="twSetV('c')">${t('tw_vc')}</button>${twAdm()?`<button type=button class="${(TW.scr=='res'?TW.pt:TW.view)=='t'?'on':''}" onclick="twSetV('t')">${t('tw_vt')}</button>`:''}</span>`;
function twSetV(k){if(TW.scr=='res'){TW.pt=k;TW.pv=0;twRes()}else{TW.view=k;twRender()}}
// ---------- drag and drop: pick a lesson up and drop it on another cell of the same class. Green = the swap works, red = it does not (with the reason).
const TWD={d:null,just:0},twDv=v=>/^\d+$/.test(v)?+v:v;
function twWhy(R){return R.slice(0,2).map(x=>{const k='sw_'+x.code;return tgF(k,{t:esc(x.teacher||''),c:esc(x.cls||''),n:x.n,s:esc(x.subject||'')})}).join('<br>')}
function twDnd(root,ctx){if(!root||root.dataset.dnd)return;root.dataset.dnd=1;let g=null;
 const key=c=>c.dataset.d+':'+c.dataset.p,cellAt=(x,y)=>{const e=document.elementFromPoint(x,y);return e&&e.closest?e.closest('.tw-cell.dd'):null};
 const clear=()=>{root.querySelectorAll('.glow-ok,.glow-bad,.dragsrc').forEach(e=>e.classList.remove('glow-ok','glow-bad','dragsrc'));const w=document.getElementById('twwhy');if(w)w.remove()};
 const pop=(c,html)=>{let w=document.getElementById('twwhy');if(!w){w=document.createElement('div');w.id='twwhy';w.className='tw-why';w.setAttribute('role','alert');document.body.appendChild(w)}w.innerHTML=html;const r=c.getBoundingClientRect(),h=w.offsetHeight;w.style.left=Math.max(8,Math.min(innerWidth-w.offsetWidth-8,r.left+r.width/2-w.offsetWidth/2))+'px';w.style.top=(r.top-h-8<8?r.bottom+8:r.top-h-8)+'px'};
 const start=async()=>{if(!g||g.on)return;g.on=1;const c=g.c,r=c.getBoundingClientRect();g.gh=c.cloneNode(true);g.gh.className+=' tw-ghost';g.gh.style.cssText+=`;position:fixed;width:${r.width}px;height:${r.height}px;left:${g.x-r.width/2}px;top:${g.y-r.height/2}px;pointer-events:none;z-index:9999`;document.body.appendChild(g.gh);c.classList.add('dragsrc');document.body.classList.add('tw-dragging');
  const q=await api(ctx.url,{...ctx.body(),a:g.a,n:g.n||1,all:1});g.map=q.ok?q.d.map:{};g.ready=1;hover(g.last)};
 const hover=c=>{if(!g||!g.ready)return;root.querySelectorAll('.glow-ok,.glow-bad').forEach(e=>e.classList.remove('glow-ok','glow-bad'));const w=document.getElementById('twwhy');if(w)w.remove();g.tg=null;
  if(!c||c===g.c)return;const R=g.map[key(c)];g.tg=c;if(R&&R.length){c.classList.add('glow-bad');pop(c,twWhy(R))}else c.classList.add('glow-ok')};
 const mv=e=>{if(!g||e.pointerId!=g.id)return;g.px=e.clientX;g.py=e.clientY;
  if(!g.on){if(g.touch)return;if(Math.hypot(e.clientX-g.x,e.clientY-g.y)>6)start();else return}
  g.gh.style.left=e.clientX-g.gh.offsetWidth/2+'px';g.gh.style.top=e.clientY-g.gh.offsetHeight/2+'px';const c=cellAt(e.clientX,e.clientY);if(c!==g.last){g.last=c;hover(c)}};
 const end=async e=>{if(!g||e.pointerId!=g.id)return;const x=g;g=null;clearTimeout(x.timer);document.removeEventListener('pointermove',mv);document.removeEventListener('pointerup',end);document.removeEventListener('pointercancel',end);
  if(!x.on)return;TWD.just=1;setTimeout(()=>TWD.just=0,80);document.body.classList.remove('tw-dragging');x.gh.remove();const tg=x.tg,bad=tg&&x.map[key(tg)];
  if(!tg||e.type=='pointercancel'){clear();return}
  if(bad&&bad.length){const keep=tg;root.querySelectorAll('.dragsrc').forEach(e=>e.classList.remove('dragsrc'));pop(keep,twWhy(bad));keep.classList.add('glow-bad');setTimeout(()=>{clear()},3600);return}
  clear();const B={d:twDv(tg.dataset.d),p:+tg.dataset.p},r=await api(ctx.url,{...ctx.body(),a:x.a,b:B,n:x.n||1});
  if(!r.ok){alert(r.d&&r.d.reasons?twWhy(r.d.reasons).replace(/<br>/g,'\n'):em(r.s,r.d.error));return}ctx.done(r.d)};
 root.addEventListener('pointerdown',e=>{const c=e.target.closest&&e.target.closest('.tw-cell.dd');if(!c||c.classList.contains('free')||(e.pointerType=='mouse'&&e.button))return;
  const bk=window.TWB&&TWB.on?twBFor(root,c):null;if(window.TWB&&TWB.on&&!bk)return;
  g={c,a:bk?bk.a:{d:twDv(c.dataset.d),p:+c.dataset.p},n:bk?bk.n:1,x:e.clientX,y:e.clientY,id:e.pointerId,touch:e.pointerType!='mouse',on:0,ready:0,last:c};
  if(g.touch)g.timer=setTimeout(()=>{if(g)start()},330);
  document.addEventListener('pointermove',mv);document.addEventListener('pointerup',end);document.addEventListener('pointercancel',end)});
 // while a finger drags a lesson the page must not scroll
 document.addEventListener('touchmove',e=>{if(g&&g.on)e.preventDefault()},{passive:false});
 document.addEventListener('keydown',e=>{if(e.key=='Escape'&&g&&g.on){g.gh.remove();g.on=0;document.body.classList.remove('tw-dragging');clear();g=null}})}
const twClick=f=>`onclick="if(TWD.just)return;${f}"`;
// ---------- suggested timetable
function twRes(){const p=TW.prop;if(!p)return twGo('list');const st=p.stats,cls=[...new Set(p.cells.map(c=>c.c+'|'+c.cls))].map(x=>x.split('|')).sort((a,b)=>a[1].localeCompare(b[1],undefined,{numeric:true})),
 tch=[...new Map(p.cells.filter(c=>c.t).map(c=>[c.t,c.teacher])).entries()].sort((a,b)=>a[1].localeCompare(b[1]));
 if(TW.pt=='c'&&!cls.some(x=>x[0]==TW.pv))TW.pv=+(cls[0]||[0])[0];if(TW.pt=='t'&&!tch.some(x=>x[0]==TW.pv))TW.pv=(tch[0]||[0])[0];
 const cv=TW.pt=='c',sp=cv&&TW.split&&cls.length>1;if(sp&&(!cls.some(x=>x[0]==TW.pv2)||TW.pv2==TW.pv))TW.pv2=+(cls.find(x=>x[0]!=TW.pv)||[0])[0];
 const mOf=cid=>{const m={};for(const c of p.cells)if(cv?c.c==cid:c.t==TW.pv)m[c.d+':'+c.p]=c;return m};const why=u=>t('tg_why_'+u.reason);
 const legOf=m=>[...new Map(Object.values(m).filter(c=>c.t).map(c=>[c.t,c.teacher])).entries()].map(([id,n])=>({teacher_id:id,teacher:n}));
 const pane=(cid,n)=>{const m=mOf(cid);return`<div class="tw-pane${n==2?' tw-pane2':''}">${sp?twPaneHd(cls.map(x=>[x[0],x[1]]),cid,n):''}<div class=tw-card id=twgrid${n==2?2:''}>${ttg({days:p.days,periods:p.periods,breaks:p.breaks,off:cv?(p.off||{})[cid]:[]},(d,k)=>{const c=m[d+':'+k];const on=cv?` role=button tabindex=0 data-d=${d} data-p=${k} ${twClick(`twPCell(${d},${k},${cid})`)} onkeydown="if(event.key=='Enter')twPCell(${d},${k},${cid})"`:'';return c?`<div class="tw-cell${cv?' ed dd':''}" style="${tcs(c.t)}"${on}><b>${esc(c.subject)}${twPtag(c.k)}</b><small>${esc(cv?(c.teacher||t('tg_notch')):c.cls)}</small></div>`:`<div class="tw-cell free${cv?' ed dd':''}"${on}>${cv?t('tw_ph'):''}</div>`})}${cv?twLegend(legOf(m),{btn:!sp}):''}</div></div>`};
 $('#tt').innerHTML=`<div class=tw-row><div><h1>${t('tw_rh')}</h1><p class="tw-lead" style="margin:0">${t('tw_rtip')} ${t('tw_ptip')}</p></div><div class="tw-tools noprint">${twSeg()}${sp?'':`<select class=tw-sel data-srch=1 onchange="TW.pv=this.value;if(TW.pt=='c')TW.pv=+TW.pv;twRes()" aria-label="${t('tg_view')}">${(cv?cls:tch).map(x=>`<option value=${x[0]} ${x[0]==TW.pv?'selected':''}>${cv?esc(x[1]):tchLbl(x[0],x[1])}`).join('')}</select>`}${cv?twSplitBtn()+twSelBtn():''}</div></div>
 ${sp?'':twPills((cv?cls:tch).map(x=>[x[0],x[1],cv?0:tchLbl(x[0],x[1])]),TW.pv,"TW.pv=#;twRes()",t('tg_view'))}
 <div class="tw-tip ${st.unplaced.length?'w':''}">${st.unplaced.length?`<b>${tgF('tw_unpl',{n:st.unplaced.reduce((a,u)=>a+u.n,0)})}</b> ${tgF('tg_stats',{a:st.placed,b:st.total})}`:`<b>${t('tw_noclash')}</b> ${tgF('tg_stats',{a:st.placed,b:st.total})}`} ${p.changes?tgF('tg_chg',{n:p.changes,d:p.from}):t('tg_nochg')}</div>
 <div id=twlive role=status>${TW.live||''}</div>
 ${st.unplaced.length?`<div class="box bad"><b>${t('tg_unp')}</b><ul class=xl>${st.unplaced.map(u=>`<li>${esc(u.cls)} · ${esc(u.subject)}: ${u.n}: ${why(u)}`).join('')}</ul></div>`:''}
 ${sp?`<div class=tw-split>${pane(TW.pv,1)}${pane(TW.pv2,2)}</div>${twAvBar(p.cells.filter(c=>c.c==TW.pv||c.c==TW.pv2))}`:pane(TW.pv,1)}
 <p class=tw-mu><b>${t('tg_q')}:</b> ${tgF('tg_gc',{n:st.gap_class})} · ${tgF('tg_gt',{n:st.gap_teacher})} · ${tgF('tg_hp',{n:st.heavy_pm})} · ${tgF('tg_rp',{n:st.repeat})}${st.split?' · '+tgF('tg_sp',{n:st.split}):''}</p><p class=err id=e></p>
 ${cv?'<div class=tw-card id=twed2 style="margin-top:14px"></div>':''}<div class=tw-row><span><button type=button class="tw-btn ghost" onclick="twGo('wiz',5)">${t('tw_back1')}</button> <button type=button class="tw-btn ghost" onclick="twCreate()">↻ ${t('tw_again')}</button></span><button type=button class="tw-btn go" onclick="twUse()" ${p.changes?'':'disabled'}>✔ ${t('tw_use')}</button></div>`;
 if(cv)twResEd();
 if(cv){const done=async d=>{TW.prop=d;TW.live='';await palLoad();twRes()};twDnd($('#twgrid'),{url:`timetable/gen/${p.id}/swap`,body:()=>({class_id:TW.pv}),done});if(sp)twDnd($('#twgrid2'),{url:`timetable/gen/${p.id}/swap`,body:()=>({class_id:TW.pv2}),done})}
 if(TW.avOpen)twAvDraw()}
async function twUse(){const p=TW.prop;if(!p||!confirm(tgF('tg_applyq',{d:p.from,n:p.changes})))return;const r=await api('timetable/gen/apply',{id:p.id});if(!r.ok)return $('#e').textContent=em(r.s,r.d.error);
 TW.prop=null;TT.date=p.from;TW.view='c';TW.cid=TW.pv;TW.scr='view';TW.msg=`<p class="box ok">${t('tw_applied')} ${tgF('tg_done',{n:r.d.changed})}${r.d.clashes?' '+tgF('tg_clash',{n:r.d.clashes}):''}</p>`;twRender()}
// ---------- view / change a timetable
async function twView(){const adm=twAdm();let r,items,id,q,dt;
 if(TW.view=='t'&&adm){items=(await api('users')).d.filter(x=>x.role=='teacher');if(!items.length)TW.view='c'}
 if(TW.view=='t'&&adm){if(!items.some(k=>k.id==TW.tid))TW.tid=items[0].id;id=TW.tid;q='teacher_id='+id}
 else{TW.view='c';items=(await api('classes')).d;if(!items.length)return $('#tt').innerHTML=`<div class=empty>${t('noclass')}</div>`;if(!items.some(k=>k.id==TW.cid))TW.cid=items[0].id;id=TW.cid;q='class_id='+id}
 r=(await api(`timetable?${q}&date=${TT.date||''}`)).d;TT.date=r.date;dt=`<label class=tw-df>${t('tw_apply_from')} <input type=date value="${TT.date||''}" onchange="TT.date=this.value;twRender()"></label>`;const sm=slotMap(r),it=items.find(k=>k.id==id);
 const edit=adm&&TW.view=='c',pr=`/api/timetable/pdf?${q}&date=${TT.date}&lang=${L}`,sp=edit&&TW.split&&items.length>1;
 let r2=null;if(sp){if(!items.some(k=>k.id==TW.cid2)||TW.cid2==id)TW.cid2=(items.find(k=>k.id!=id)||{}).id;r2=(await api(`timetable?class_id=${TW.cid2}&date=${TT.date||''}`)).d}
 const cellC=(rr,cid)=>{const m=slotMap(rr);return(d,p)=>{const s=m[d+':'+p],on=edit?` role=button tabindex=0 data-d=${d} data-p=${p} ${twClick(`twCell(${d},${p},${cid})`)} onkeydown="if(event.key=='Enter')twCell(${d},${p},${cid})"`:'';
  return s?`<div class="tw-cell${edit?' ed dd':''}" style="${tcs(s.teacher_id)}"${on}><b>${esc(s.subject)}${twPtag(s.kind)}</b><small>${esc(s.teacher||'—')}</small></div>`:`<div class="tw-cell free${edit?' ed dd':''}"${on}>${edit?t('tw_ph'):''}</div>`}};
 const pane=(rr,cid,n)=>`<div class="tw-pane${n==2?' tw-pane2':''}">${sp?twPaneHd(items.map(k=>[k.id,k.name]),cid,n):''}<div class=tw-card id=twgrid${n==2?2:''}>${ttg(rr,cellC(rr,cid))}${twLegend(rr.slots,{btn:!sp})}</div></div>`;
 const grids=TW.view=='t'?`<div class=tw-card id=twgrid>${ttg(r,(d,p)=>{const s=sm[d+':'+p];return s?`<div class=tw-cell style="${tcs(id)}"><b>${esc(s.subject)}${twPtag(s.kind)}</b><small>${esc(s.cls)}</small></div>`:`<div class="tw-cell free"></div>`})}</div>`
  :sp?`<div class=tw-split>${pane(r,id,1)}${pane(r2,TW.cid2,2)}</div>${twAvBar([...r.slots,...r2.slots])}`:pane(r,id,1);
 $('#tt').innerHTML=`${adm?`<p class=tw-bk><button type=button class=tw-lk onclick="twTab('list')">← ${t('tw_all_tt')}</button></p>`:''}<div class=tw-row><div><h1>${tgF('tw_ttof',{x:esc(it.name)})}</h1>${adm?`<p class="tw-lead" style="margin:0">${t(edit?'tw_vtip':'tw_vtip_t')}</p>`:''}</div></div>
 <div class="tw-tools noprint" style="margin:0 0 14px">${adm?twSeg():''}${sp?'':`<select class=tw-sel data-srch=1 onchange="${TW.view=='c'?'TW.cid':'TW.tid'}=+this.value;twRender()" aria-label="${t('cls')}">${items.map(k=>`<option value=${k.id} ${k.id==id?'selected':''}>${TW.view=='t'?tchLbl(k.id,k.name):esc(k.name)}`).join('')}</select>`}${dt}${edit?twSplitBtn()+twSelBtn():''}</div>${sp?'':twPills(items.map(k=>[k.id,k.name,TW.view=='t'?tchLbl(k.id,k.name):0]),id,(TW.view=='c'?'TW.cid':'TW.tid')+"=#;twRender()",t('cls'))}<div class="tw-tools noprint" style="margin:0 0 14px"><a class="tw-btn ghost blue" href="${pr}">${fi('print',18)} ${t('tw_print_tt')}</a></div>
 ${TW.msg}${await ttClashes(r.clashes)}${r.slots.length||edit?'':`<p class=tw-mu>${t('tw_noview')}</p>`}
 ${grids}<p class=err id=e></p>`;TW.msg='';
 if(edit){const done=()=>{TW.msg=`<p class="box ok">${t('sw_done')}</p>`;twRender()};twDnd($('#twgrid'),{url:'timetable/swap',body:()=>({class_id:id,from:TT.date}),done});if(sp)twDnd($('#twgrid2'),{url:'timetable/swap',body:()=>({class_id:TW.cid2,from:TT.date}),done})}
 if(TW.avOpen)twAvDraw()}
async function twCell(d,p,cid){cid=cid||TW.cid;const r=await api(`timetable/wiz/options?class_id=${cid}&day=${d}&period=${p}&date=${TT.date}`);if(!r.ok)return alert(em(r.s,r.d.error));const o=r.d,pe=(await api('structure')).d.periods.find(x=>x.n==p)||{};
 TW.cell={d,p,cid};TW.sel=o.here||'';
 const opt=x=>{let tag,cls='ok';if(x.busy){tag=tgF('tw_busy',{c:esc(x.busy)});cls='bad'}else if(x.unavail){tag=t('tw_away');cls='bad'}else if(x.want!=null&&x.have>=x.want&&x.key!=o.here){tag=tgF('tw_have',{n:x.have});cls='bad'}else tag=t('tw_free');
  return`<button type=button class="tw-opt${x.key==TW.sel?' sel':''}${x.busy?' dis':''}" data-id="${x.key}" ${x.busy?'disabled':''} onclick="twPick('${x.key}')"><span><b>${esc(x.name)}${twPtag(x.k)}</b>${x.teacher?' · '+esc(x.teacher):''}</span><span class="tw-tag ${cls}">${tag}</span></button>`};
 ovOpen(`<div class=tw-modal><h2>${DAYS()[d]} · ${pe.s||''} – ${pe.e||''}</h2><p class=tw-mu style="margin-top:0">${tgF('tw_mod_s',{c:esc(o.cls)})}</p>${o.items.map(opt).join('')}<button type=button class="tw-opt${TW.sel?'':' sel'}" data-id="" onclick="twPick('')"><span class=tw-mu>${t('tw_empty')}</span></button><p class=err id=twme></p><div class=ov-a><button type=button class=sb onclick="ovClose()">${t('so_cancel')}</button><button type=button onclick="twSave()">${t('x_save')}</button></div></div>`)}
function twPick(id){TW.sel=id;document.querySelectorAll('#ovl .tw-opt').forEach(b=>b.classList.toggle('sel',b.dataset.id==id))}
const twKey=k=>{if(!k)return{subject_id:null};const[a,b,c]=String(k).split('.').map(Number);return{subject_id:a,kind:b||0,teacher_id:c||undefined}};
async function twSave(force){const {d,p,cid}=TW.cell,r=await api('timetable/set',{class_id:cid,day:d,period:p,...twKey(TW.sel),from:TT.date,force});
 if(r.s==409&&r.d.error=='unavail'&&!force&&confirm(t('e_unavail')))return twSave(1);if(!r.ok)return $('#twme').textContent=em(r.s,r.d.error)+(r.d.cls||'');ovClose();twRender()}
// ---------- teacher: my timetable, in their own colour
async function vMyTT(){await palLoad();const r=(await api('mytimetable')).d,sm=slotMap(r),c=tcs(S.uid);
 $('#m').innerHTML=`<div class=tw><h1>${t('mytt')}</h1>${r.today.length?`<h2>${t('x_today')}</h2><div class=tw-card>${r.today.map(l=>`<div class=tw-ttl><span class=time>${t('x_period')} ${l.period}</span><span class=what>${esc(l.cls)} · ${esc(l.subject)}</span><span class=x>${l.status=='pending'?t('x_pending'):l.status=='replaced'?(l.actual_id==S.uid?t('x_in'):t('x_replaced')):t('x_'+l.status)}</span></div>`).join('')}</div>`:`<p class=empty>${t('x_nols')}</p>`}
 <div class=tw-card>${ttg(r,(d,p)=>{const s=sm[d+':'+p];return s?`<div class=tw-cell style="${c}"><b>${esc(s.subject)}${twPtag(s.kind)}</b><small>${esc(s.cls)}</small></div>`:`<div class="tw-cell free"></div>`})}</div><a class="tw-btn ghost noprint" href="/api/timetable/pdf?lang=${L}">${fi('print',18)} ${t('x_print')}</a></div>`}
// ---------- edit the suggested timetable in place (tap a lesson)
async function twPCell(d,p,pc){const p0=TW.prop;let cid=TW.pt=='c'?(pc||TW.pv):0,tid=0;
 if(TW.pt=='t'){const h=p0.cells.find(c=>c.t==TW.pv&&c.d==d&&c.p==p);if(h)cid=h.c;else tid=TW.pv}
 const r=await api(`timetable/gen/${p0.id}/options?${tid?'teacher_id='+tid:'class_id='+cid}&day=${d}&period=${p}`);if(!r.ok)return alert(em(r.s,r.d.error));const o=r.d,pe=TW.prop.periods.find(x=>x.n==p)||{};
 TW.pcell={d,p,cid,tid};TW.sel=o.here||'';
 const opt=x=>{let tag,cls='ok',dis=false;if(x.busy){tag=tgF('tw_busy',{c:esc(x.busy)});cls='bad';dis=true}else if(x.classBusy){tag=tgF('tw_pfree',{c:esc(x.classBusy)});cls='bad';dis=true}else if(x.unavail){tag=t('tw_away');cls='bad'}else if(x.want!=null&&x.have>=x.want&&x.key!=o.here){tag=tgF('tw_have',{n:x.have});cls='bad'}else tag=t('tw_free');
  return`<button type=button class="tw-opt${x.key==TW.sel?' sel':''}${dis?' dis':''}" data-id="${x.key}" data-c=${x.class_id} ${dis?'disabled':''} onclick="twPPick('${x.key}',${x.class_id})"><span><b>${esc(x.name)}${twPtag(x.k)}</b> · ${tid?esc(x.cls):esc(x.teacher||'—')}</span><span class="tw-tag ${cls}">${tag}</span></button>`};
 ovOpen(`<div class=tw-modal><h2>${DAYS()[d]} · ${pe.s||''} – ${pe.e||''}</h2><p class=tw-mu style="margin-top:0">${tid?tgF('tw_pt_s',{t:''}).replace(/^ · /,''):tgF('tw_mod_s',{c:esc(o.cls)})}</p>${o.items.length?o.items.map(opt).join(''):`<p class=tw-mu>${t('tw_pnone')}</p>`}${tid?'':`<button type=button class="tw-opt${TW.sel?'':' sel'}" data-id="" onclick="twPPick('',${cid})"><span class=tw-mu>${t('tw_empty')}</span></button>`}<p class=err id=twme></p><div class=ov-a><button type=button class=sb onclick="ovClose()">${t('so_cancel')}</button><button type=button onclick="twPSave()">${t('x_save')}</button></div></div>`)}
function twPPick(id,c){TW.sel=id;TW.pcell.cid=c;document.querySelectorAll('#ovl .tw-opt').forEach(b=>b.classList.toggle('sel',b.dataset.id==id))}
async function twPSave(force){const{d,p,cid}=TW.pcell;if(!cid)return;const r=await api(`timetable/gen/${TW.prop.id}/set`,{class_id:cid,day:d,period:p,...twKey(TW.sel),force});
 if(r.s==409&&r.d.error=='unavail'&&!force&&confirm(t('e_unavail')))return twPSave(1);if(!r.ok)return $('#twme').textContent=em(r.s,r.d.error);
 ovClose();TW.prop=r.d;TW.live='';await palLoad();twRes()}
