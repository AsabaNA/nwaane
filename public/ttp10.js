// Phase 10p: class days off, live lessons-per-week, teacher availability from the pills, side-by-side timetables, optional break between lessons of a subject.
// Loaded after ttwz.js. Uses TW (ttui.js) and the wizard helpers (ttwz.js).
Object.assign(D.en,{
 cd_off:'No school',cdy_h:'Days each class comes to school',cdy_p:'Switch off the days a class does not come (for example Saturdays for junior classes). Every new suggestion respects this. The timetable already in use is not changed.',
 cd_filter:'Filter classes, e.g. Form 5',cd_col:'Tap a day name to switch it on or off for every class shown. Tap a class name to switch all its days back on.',cd_min:'A class must come at least one day.',cd_sum:'[n] class(es) are off on [d]',cd_all_on:'All classes come every school day.',cd_sec:'Section',
 av_btn:'Edit availability',av_pill:'Edit this teacher’s available days',av_h:'Teacher availability',av_p:'Tap a day to change it: all day, mornings only, afternoons only, off. Lessons that no longer fit move automatically.',av_exact:'Exact hours',av_done:'Done',av_saved:'Availability saved.',av_none:'No teachers in this timetable.',av_hold:'Hold a day for exact hours',av_for:'[t] · available days',
 lv_add:'Added [n] lesson(s).',lv_rem:'Removed [n] lesson(s).',lv_same:'Nothing needed to change.',lv_short:'[n] lesson(s) do not fit anywhere without moving others. Press Try again for a fresh suggestion, or free a slot by hand.',lv_av:'[n] lesson(s) moved because of availability.',lv_av0:'Availability updated. No lesson had to move.',lv_wait:'Updating…',
 sp_one:'Allow a break between lessons of this subject on the same day',sp_all:'Allow a break between lessons of the same subject on a day (every subject)',tg_sp:'[n] subject(s) split in a day',
 sb_on:'Side by side',sb_off:'One timetable',sb_hint:'Two timetables at once (large screens)'});
Object.assign(D.fr,{
 cd_off:'Pas d’école',cdy_h:'Jours de présence de chaque classe',cdy_p:'Désactivez les jours où une classe ne vient pas (par exemple les samedis pour les petites classes). Chaque nouvelle proposition en tient compte. L’emploi du temps en cours n’est pas modifié.',
 cd_filter:'Filtrer les classes, ex. 3e',cd_col:'Touchez le nom d’un jour pour l’activer ou le désactiver pour toutes les classes affichées. Touchez le nom d’une classe pour réactiver tous ses jours.',cd_min:'Une classe doit venir au moins un jour.',cd_sum:'[n] classe(s) ne viennent pas le [d]',cd_all_on:'Toutes les classes viennent chaque jour d’école.',cd_sec:'Section',
 av_btn:'Modifier les disponibilités',av_pill:'Modifier les jours disponibles de cet enseignant',av_h:'Disponibilité des enseignants',av_p:'Touchez un jour pour le changer : toute la journée, matins seulement, après-midis seulement, absent. Les cours qui ne conviennent plus sont déplacés automatiquement.',av_exact:'Heures exactes',av_done:'Terminé',av_saved:'Disponibilités enregistrées.',av_none:'Aucun enseignant dans cet emploi du temps.',av_hold:'Appui long sur un jour pour les heures exactes',av_for:'[t] · jours disponibles',
 lv_add:'[n] cours ajouté(s).',lv_rem:'[n] cours retiré(s).',lv_same:'Rien à changer.',lv_short:'[n] cours ne tiennent nulle part sans en déplacer d’autres. Appuyez sur « Réessayer » pour une nouvelle proposition, ou libérez une case à la main.',lv_av:'[n] cours déplacé(s) à cause des disponibilités.',lv_av0:'Disponibilités mises à jour. Aucun cours à déplacer.',lv_wait:'Mise à jour…',
 sp_one:'Autoriser une pause entre les cours de cette matière le même jour',sp_all:'Autoriser une pause entre les cours d’une même matière le même jour (toutes les matières)',tg_sp:'[n] matière(s) séparée(s) dans la journée',
 sb_on:'Côte à côte',sb_off:'Un seul emploi du temps',sb_hint:'Deux emplois du temps à la fois (grands écrans)'});

// ---------- side by side
const twSplitBtn=()=>`<button type=button class="tw-btn ghost blue tw-deskonly" aria-pressed="${TW.split?'true':'false'}" title="${t('sb_hint')}" onclick="twSplit()">⫴ ${t(TW.split?'sb_off':'sb_on')}</button>`;
function twSplit(){TW.split=!TW.split;TW.scr=='res'?twRes():twRender()}
const twPaneHd=(items,cur,n)=>`<div class="tw-phd noprint"><select class=tw-sel data-srch=1 onchange="twPaneSet(${n},this.value)" aria-label="${t('cls')}">${items.map(x=>`<option value=${x[0]} ${x[0]==cur?'selected':''}>${esc(x[1])}`).join('')}</select></div>${twPills(items,cur,`twPaneSet(${n},#)`,t('cls'))}`;
function twPaneSet(n,v){v=+v;if(TW.scr=='res'){if(n==1)TW.pv=v;else TW.pv2=v;twRes()}else{if(n==1)TW.cid=v;else TW.cid2=v;twRender()}}

// ---------- live lessons per week: only the lessons that must go are removed, only the missing ones are added
let twLq=Promise.resolve();
const twLiveMsg=(a,av)=>{if(!a)return'';let h='';
 if(av){h+=a.removed||a.added?`<p class="box ok">${a.moved?tgF('lv_av',{n:a.moved}):t('lv_av0')}</p>`:`<p class="box ok">${t('lv_av0')}</p>`}
 else{const parts=[];if(a.added)parts.push(tgF('lv_add',{n:a.added}));if(a.removed)parts.push(tgF('lv_rem',{n:a.removed}));h+=`<p class="box ok">${parts.join(' ')||t('lv_same')}</p>`}
 if(a.short)h+=`<p class="box warn">${tgF('lv_short',{n:a.short})}</p>`;return h};
function twRedrawKeep(){const y=window.scrollY;twRes();setTimeout(()=>window.scrollTo(0,y),40)}
function twLive(sid){const el=$('#twlive');if(el)el.innerHTML=`<p class=tw-mu>${t('lv_wait')}</p>`;
 twLq=twLq.then(async()=>{if(!TW.prop)return;const r=await api(`timetable/gen/${TW.prop.id}/adjust`,{subject_id:sid||undefined});
  if(!r.ok){TW.live=`<p class="box bad">${em(r.s,r.d.error)}</p>`;return twRedrawKeep()}
  TW.prop=r.d;TW.live=twLiveMsg(r.d.adj);TW.reqDirty=0;await palLoad();twRedrawKeep()});return twLq}
async function twSplitSet(id,on){const s=twSubj(id);s.split_ok=on?1:0;await twSaveItem(s)}

// ---------- teacher availability from the pills
const TWAV={days:[],rows:{},t:0};
const twAvIds=cells=>{const ids=[...new Set(cells.map(c=>c.teacher_id||c.t).filter(Boolean))];TW.avIds=ids;return ids};
const twAvBar=cells=>{twAvIds(cells);return`<div class="tw-leg"><button type=button class="tw-btn sm blue tw-avb" aria-expanded="${TW.avOpen?'true':'false'}" onclick="twAvToggle()">${t('av_btn')}</button></div><div id=twav class=tw-avp></div>`};
function twAvToggle(){TW.avOpen=!TW.avOpen;document.querySelectorAll('.tw-avb').forEach(b=>b.setAttribute('aria-expanded',TW.avOpen?'true':'false'));twAvDraw()}
const twAvRow=(x,days)=>{const c=tcol(x.id),tight=x.need>x.free;
 return`<div class=tw-trow id=twav_${x.id}><div class=who><span class=tw-av2 style="background:${c.bg};color:${c.fg};border-color:${c.ln}">${esc(initials(x.name))}</span><span class=wt><b>${esc(x.name)}</b><small>${twLine(x)}</small>${tight?`<small class=tw-warn>${tgF('wz_tight',{m:x.free,n:x.need})}</small>`:''}</span></div>
 ${days.map(d=>{const s=x.days[d];return`<button type=button class="dc ${s=='on'?'y':s=='off'?'x':'m'}" data-t=${x.id} data-d=${d} aria-label="${esc(x.name)} ${DAYS()[d]}: ${t('wz_'+TWN[s])}" onclick="twAvTap(${x.id},${d})">${TWG[s]}</button>`}).join('')}</div>`};
async function twAvLoad(ids){const r=await api('timetable/wiz/teachers'+(ids&&ids.length==1?'?teacher_id='+ids[0]:''));if(!r.ok)throw new Error(em(r.s,r.d.error));
 TWAV.days=r.d.days;for(const x of r.d.teachers)if(!ids||ids.includes(x.id))TWAV.rows[x.id]=x}
async function twAvDraw(){const h=$('#twav');if(!h)return;if(!TW.avOpen){h.innerHTML='';return}
 const ids=TW.avIds||[];try{await twAvLoad(ids.length==1?ids:null)}catch(e){h.innerHTML=`<p class="box bad">${esc(e.message)}</p>`;return}
 const rows=ids.map(i=>TWAV.rows[i]).filter(Boolean).sort((a,b)=>a.name.localeCompare(b.name));
 if(!$('#twav'))return;
 $('#twav').innerHTML=`<div class=tw-card style="margin-top:12px"><h3 style="margin:0 0 4px">${t('av_h')}</h3><p class=tw-mu style="margin:0 0 10px">${t('av_p')}</p>${rows.length?`<div class=tw-thead style="--d:${TWAV.days.length}"><span></span>${TWAV.days.map(d=>`<span>${DAYS()[d]}</span>`).join('')}</div><div id=twavl style="--d:${TWAV.days.length}">${rows.map(x=>twAvRow(x,TWAV.days)).join('')}</div><p class=tw-mu style="margin:8px 0 0">${t('av_hold')}</p>`:`<p class=tw-mu>${t('av_none')}</p>`}</div>`;twAvWire()}
function twAvWire(){const l=$('#twavl');if(!l||l.dataset.w)return;l.dataset.w=1;let tm=0,held=0;
 l.addEventListener('pointerdown',e=>{const b=e.target.closest&&e.target.closest('.dc[data-t]');if(!b)return;held=0;clearTimeout(tm);tm=setTimeout(()=>{held=1;twAvExact(+b.dataset.t)},550)});
 for(const ev of['pointerup','pointercancel','pointerleave'])l.addEventListener(ev,()=>clearTimeout(tm));
 l.addEventListener('contextmenu',e=>{const b=e.target.closest&&e.target.closest('.dc[data-t]');if(!b)return;e.preventDefault();clearTimeout(tm);held=1;twAvExact(+b.dataset.t)});
 l.addEventListener('click',e=>{if(held){held=0;e.stopPropagation();e.preventDefault()}},true)}
async function twAvTap(id,d){const x=TWAV.rows[id],old=x.days[d];if(old=='part')return twAvExact(id);
 const nx={on:'half',half:'pm',pm:'off',off:'on'}[old];x.days[d]=nx;twAvPaint(x);
 const r=await api('timetable/wiz/day',{teacher_id:id,day:d,state:nx});
 if(!r.ok){x.days[d]=old;twAvPaint(x);return alert(em(r.s,r.d.error))}
 await twAvRefresh(id);if(!TWAV.pop){clearTimeout(TWAV.t);TWAV.t=setTimeout(twAvSync,700)}}
function twAvPaint(x){document.querySelectorAll('[id="twav_'+x.id+'"]').forEach(e=>e.outerHTML=twAvRow(x,TWAV.days));if(TWAV.pop&&$('#twavp')&&!$('#twavp #twav_'+x.id)){}}
async function twAvRefresh(id){const r=await api('timetable/wiz/teachers?teacher_id='+id);if(r.ok&&r.d.teachers[0]){TWAV.rows[id]=r.d.teachers[0];twAvPaint(r.d.teachers[0])}}
// bring the suggestion (or the screen) in line with the new availability
async function twAvSync(){clearTimeout(TWAV.t);
 if(TW.scr=='res'&&TW.prop){const r=await api(`timetable/gen/${TW.prop.id}/adjust`,{drop:1});if(!r.ok)return alert(em(r.s,r.d.error));TW.prop=r.d;TW.live=twLiveMsg(r.d.adj,1);await palLoad();twRedrawKeep()}
 else if(TW.scr=='view'){TW.msg=`<p class="box ok">${t('av_saved')}</p>`;const y=window.scrollY;await twRender();setTimeout(()=>window.scrollTo(0,y),40)}}
// one teacher, in a window
async function twTchPop(id){TWAV.pop=1;try{await twAvLoad([id])}catch(e){TWAV.pop=0;return alert(e.message)}const x=TWAV.rows[id];if(!x){TWAV.pop=0;return}
 ovOpen(`<div class=tw-modal id=twavp><h2>${tgF('av_for',{t:esc(x.name)})}</h2><p class=tw-mu style="margin-top:0">${t('av_p')}</p><div class=tw-thead style="--d:${TWAV.days.length}"><span></span>${TWAV.days.map(d=>`<span>${DAYS()[d]}</span>`).join('')}</div><div id=twavl style="--d:${TWAV.days.length}">${twAvRow(x,TWAV.days)}</div>
 <p class=tw-mu style="margin:8px 0 0">${t('av_hold')}</p><div class=ov-a><button type=button class=sb onclick="twAvExact(${id})">${t('av_exact')}</button><button type=button onclick="twAvClose()">${t('av_done')}</button></div></div>`);twAvWire()}
function twAvClose(){TWAV.pop=0;ovClose();twAvSync()}
async function twAvExact(id){const s=(await api('structure')).d,a=new Set((await api('unavail?teacher_id='+id)).d.map(x=>x.day+':'+x.period)),nm=(TWAV.rows[id]||{}).name||'';
 const g=`<section class="dp tp gd"><div style="overflow-x:auto"><table class=tg><tr><th class=tgp>${t('x_period')}${s.days.map(d=>`<th>${DAYS()[d]}`).join('')}${s.periods.map(p=>`<tr><td class=tgp><b>${p.n}</b><small>${p.s}–${p.e}</small>${s.days.map(d=>`<td><input type=checkbox class="av avc" data-d=${d} data-p=${p.n} ${a.has(d+':'+p.n)?'checked':''} aria-label="${DAYS()[d]} ${p.n}">`).join('')}`).join('')}</table></div></section>`;
 TWAV.pop=1;ovOpen(`<h2>${tgF('wz_exh',{t:esc(nm)})}</h2><p class=tw-mu>${t('wz_exp')}</p>${g}<p class=err id=twxe></p><div class=ov-a><button type=button class=sb onclick="TWAV.pop=0;ovClose()">${t('so_cancel')}</button><button type=button onclick="twAvExactSave(${id})">${fi('check',18)} ${t('x_save')}</button></div>`)}
async function twAvExactSave(id){const r=await api('unavail',{teacher_id:id,cells:[...document.querySelectorAll('#ovl .av:checked')].map(e=>({day:+e.dataset.d,period:+e.dataset.p}))});
 if(!r.ok)return $('#twxe').textContent=em(r.s,r.d.error);TWAV.pop=0;ovClose();await twAvSync()}

// ---------- class days: which weekdays each class comes to school (wizard step 2)
const TWCD={d:null,q:''};
async function twCd(){const h=$('#twcd');if(!h)return;const r=await api('timetable/class-days');if(!r.ok){h.innerHTML=`<p class="box bad">${em(r.s,r.d.error)}</p>`;return}TWCD.d=r.d;
 const ids=new Set((twScope().ids)||[]);TWCD.ids=ids.size?ids:null;twCdDraw()}
const twCdList=()=>{const d=TWCD.d,q=TWCD.q.trim().toLowerCase();return d.classes.filter(c=>(!TWCD.ids||TWCD.ids.has(c.id))&&(!q||c.name.toLowerCase().includes(q)))};
function twCdDraw(){const h=$('#twcd');if(!h||!TWCD.d)return;const d=TWCD.d,L2=twCdList(),n=d.days.length;
 const offN=day=>d.classes.filter(c=>c.off.includes(day)).length,sum=d.days.filter(x=>offN(x)).map(x=>tgF('cd_sum',{n:offN(x),d:DAYS()[x]}));
 let last=null;const keep=twKeepScroll(h);
 h.innerHTML=`<h2 style="margin:0 0 4px">${t('cdy_h')}</h2><p class=tw-mu style="margin:0 0 10px">${t('cdy_p')}</p>
 <div class="tw-row wrapf" style="margin-bottom:8px"><input type=search class=tw-search placeholder="${t('cd_filter')}" value="${esc(TWCD.q)}" oninput="TWCD.q=this.value;twCdDraw();$('#twcd input[type=search]').focus()" aria-label="${t('cd_filter')}"><span class=tw-mu>${t('cd_col')}</span></div>
 <div class=cdm style="--d:${n}"><span></span>${d.days.map(x=>`<button type=button class="cdh" onclick="twCdCol(${x})">${DAYS()[x]}</button>`).join('')}
 ${L2.map(c=>{let sec='';if(d.sections.length>1&&c.sec!==last){last=c.sec;const sn=(d.sections.find(x=>x.id==c.sec)||{}).name;sec=`<span class=cds>${esc(sn||'')}</span>`}
  return sec+`<button type=button class=cdn onclick="twCdRow(${c.id})">${esc(c.name)}</button>${d.days.map(x=>{const off=c.off.includes(x);return`<button type=button class="cdb ${off?'off':'on'}" role=switch aria-checked="${!off}" aria-label="${esc(c.name)} ${DAYS()[x]}" onclick="twCdTog(${c.id},${x})">${off?'✕':'✓'}</button>`}).join('')}`}).join('')}</div>
 <p class=tw-mu style="margin:10px 0 0">${sum.length?esc(sum.join(' · ')):t('cd_all_on')}</p><p class=err id=twcde></p>`;keep()}
async function twCdSave(changes){const d=TWCD.d;for(const c of changes){if(c.off.length>=d.days.length){$('#twcde').textContent=t('cd_min');return false}}
 const old=changes.map(c=>[c.id,[...d.classes.find(k=>k.id==c.id).off]]);for(const c of changes)d.classes.find(k=>k.id==c.id).off=c.off;twCdDraw();
 const r=await api('timetable/class-days',{items:changes.map(c=>({class_id:c.id,off:c.off}))});
 if(!r.ok){for(const[id,o]of old)d.classes.find(k=>k.id==id).off=o;twCdDraw();$('#twcde').textContent=em(r.s,r.d.error);return false}
 TW.req=null;return true}
const twCdWith=(c,day,on)=>on?c.off.filter(x=>x!=day):[...new Set([...c.off,day])].sort();
function twCdTog(id,day){const c=TWCD.d.classes.find(k=>k.id==id);twCdSave([{id,off:twCdWith(c,day,c.off.includes(day))}])}
function twCdCol(day){const L2=twCdList();if(!L2.length)return;const allOn=L2.every(c=>!c.off.includes(day));twCdSave(L2.map(c=>({id:c.id,off:twCdWith(c,day,!allOn)})))}
function twCdRow(id){const c=TWCD.d.classes.find(k=>k.id==id),n=TWCD.d.days.length,allOn=!c.off.length;if(allOn)return;twCdSave([{id,off:[]}])}

// ================= Phase 10q: teaching teams, practical sessions, optional per-teacher marks =================
Object.assign(D.en,{
 prac_tag:'Practical',tmx_add:'+ Teachers · practical',tmx_h:'Teachers and practical',tmx_p:'Several teachers can share this subject. Each one has their own lessons per week; together they add up to the total. It stays one subject on the report card.',
 tmx_main:'main teacher · on the report card',tmx_total:'Total: [n] lessons a week',tmx_addt:'+ Add a teacher…',tmx_rm:'Remove',tmx_none:'No teacher chosen',
 tmx_prac_h:'Practical session',tmx_prac_p:'A practical is a timetable period only: no exam, no mark and no report card entry.',tmx_prac_add:'+ Add a practical session',tmx_prac_n:'Practicals a week',tmx_prac_d:'Of which doubles (2 periods together)',tmx_prac_t:'Teacher',
 tmx_parts_h:'Marks',tmx_parts_l:'Each teacher enters their own mark; the subject mark is the average',tmx_parts_p:'Leave this off if the teachers work out the average themselves and one of them enters it. Each teacher then sees only their own column.',tmx_parts_need:'Add at least one more teacher first.',tmx_done:'Done',
 mk_parts_h:'This subject is marked in parts.',mk_parts_p:'Enter your own mark /20. The subject mark is the average of all the teachers’ marks and appears once everyone has entered theirs.',mk_yours:'Your mark',mk_avg_col:'Subject mark',mk_pending:'not yet'});
Object.assign(D.fr,{
 prac_tag:'TP',tmx_add:'+ Enseignants · TP',tmx_h:'Enseignants et travaux pratiques',tmx_p:'Plusieurs enseignants peuvent se partager cette matière. Chacun a ses propres cours par semaine ; ensemble ils font le total. Cela reste une seule matière sur le bulletin.',
 tmx_main:'titulaire · figure sur le bulletin',tmx_total:'Total : [n] cours par semaine',tmx_addt:'+ Ajouter un enseignant…',tmx_rm:'Retirer',tmx_none:'Aucun enseignant choisi',
 tmx_prac_h:'Séance de travaux pratiques',tmx_prac_p:'Un TP n’est qu’une période de l’emploi du temps : pas d’examen, pas de note, pas de ligne sur le bulletin.',tmx_prac_add:'+ Ajouter une séance de TP',tmx_prac_n:'TP par semaine',tmx_prac_d:'Dont doubles (2 périodes de suite)',tmx_prac_t:'Enseignant',
 tmx_parts_h:'Notes',tmx_parts_l:'Chaque enseignant saisit sa note ; la note de la matière est la moyenne',tmx_parts_p:'Laissez désactivé si les enseignants calculent la moyenne eux-mêmes et que l’un d’eux la saisit. Chacun ne voit alors que sa colonne.',tmx_parts_need:'Ajoutez d’abord au moins un autre enseignant.',tmx_done:'Terminé',
 mk_parts_h:'Cette matière est notée en plusieurs parties.',mk_parts_p:'Saisissez votre propre note /20. La note de la matière est la moyenne des notes de tous les enseignants ; elle apparaît quand chacun a saisi la sienne.',mk_yours:'Votre note',mk_avg_col:'Note de la matière',mk_pending:'pas encore'});
const twShort=n=>String(n||'').replace(/^(mr|mrs|ms|miss|dr|prof|mme|mlle|m)\.?\s+/i,'').split(/\s+/)[0]||'';
const twTeamSum=s=>(s.team||[]).reduce((n,x)=>n+(x.per_week||0),0);
const twMainN=s=>Math.max(0,(s.per_week||0)-twTeamSum(s));
const twPtag=k=>k?` <i class=tw-ptag>${t('prac_tag')}</i>`:'';
function twTeamChips(s){const L=[];
 if((s.team||[]).length){L.push(`<button type=button class="mchip tm" onclick="twTeam(${s.id})">${esc(twShort(s.teacher)||'—')} ${twMainN(s)}</button>`);for(const x of s.team)L.push(`<button type=button class="mchip tm" onclick="twTeam(${s.id})">${esc(twShort(x.teacher))} ${x.per_week}</button>`)}
 if(s.prac)L.push(`<button type=button class="mchip pr" onclick="twTeam(${s.id})">${t('prac_tag')} ${s.prac.per_week}${s.prac.teacher?' · '+esc(twShort(s.prac.teacher)):''}</button>`);
 L.push(`<button type=button class="mchip add" onclick="twTeam(${s.id})">${t('tmx_add')}</button>`);return L.join('')}
const twTchName=i=>((TW.at||[]).find(x=>x.id==i)||{}).name||'';
const twStp=(a,b,v)=>`<div class=tw-stepper><button type=button onclick="${a}" aria-label="−">−</button><span>${v}</span><button type=button onclick="${b}" aria-label="+">+</button></div>`;
function twTeam(id){const s=twSubj(id),all=TW.at||[],tm=s.team||[],taken=new Set([s.teacher_id,...tm.map(x=>x.teacher_id)].filter(Boolean)),members=(s.teacher_id?1:0)+tm.length;
 const opts=all.filter(x=>!taken.has(x.id));
 ovOpen(`<div class="tw-modal twtm"><h2>${esc(s.name)}</h2><p class=tw-mu style="margin-top:0">${t('tmx_p')}</p>
 <div class=tm-r><span class=tm-n><b>${esc(s.teacher||t('tmx_none'))}</b><small>${t('tmx_main')}</small></span>${twStp(`twTmN(${id},0,-1)`,`twTmN(${id},0,1)`,twMainN(s))}</div>
 ${tm.map(x=>`<div class=tm-r><span class=tm-n><b>${esc(x.teacher||twTchName(x.teacher_id))}</b></span><span class=tm-a>${twStp(`twTmN(${id},${x.teacher_id},-1)`,`twTmN(${id},${x.teacher_id},1)`,x.per_week||0)}<button type=button class=tm-x aria-label="${t('tmx_rm')}" title="${t('tmx_rm')}" onclick="twTmDel(${id},${x.teacher_id})">✕</button></span></div>`).join('')}
 <div class=tm-r><select class=tw-sel onchange="twTmAdd(${id},this.value)" aria-label="${t('tmx_addt')}"><option value="">${t('tmx_addt')}${opts.map(x=>`<option value=${x.id}>${esc(x.name)}`).join('')}</select><span class=tm-tot>${tgF('tmx_total',{n:`<b>${s.per_week||0}</b>`})}</span></div>
 <h3>${t('tmx_prac_h')}</h3><p class=tw-mu style="margin:0 0 6px">${t('tmx_prac_p')}</p>
 ${s.prac?`<div class=tm-r><select class=tw-sel onchange="twPracT(${id},this.value)" aria-label="${t('tmx_prac_t')}"><option value="">${t('tmx_none')}${all.map(x=>`<option value=${x.id} ${x.id==s.prac.teacher_id?'selected':''}>${esc(x.name)}`).join('')}</select><button type=button class=tm-x aria-label="${t('tmx_rm')}" title="${t('tmx_rm')}" onclick="twPracOff(${id})">✕</button></div>
  <div class=tm-r><span>${t('tmx_prac_n')}</span>${twStp(`twPracN(${id},-1)`,`twPracN(${id},1)`,s.prac.per_week||1)}</div>
  <div class=tm-r><span>${t('tmx_prac_d')}</span>${twStp(`twPracD(${id},-1)`,`twPracD(${id},1)`,s.prac.doubles||0)}</div>`
  :`<p><button type=button class="tw-btn ghost wide" onclick="twPracOn(${id})">${t('tmx_prac_add')}</button></p>`}
 ${members>=2?`<h3>${t('tmx_parts_h')}</h3><label class=tw-ck><input type=checkbox ${s.parts?'checked':''} onchange="twPartsSet(${id},this.checked)"> ${t('tmx_parts_l')}</label><p class=tw-mu style="margin:4px 0 0">${t('tmx_parts_p')}</p>`:''}
 <div class=ov-a><button type=button onclick="ovClose();twRedraw()">${t('tmx_done')}</button></div></div>`)}
// every change is saved at once; under a suggestion the timetable adjusts itself (only the lessons that must change)
async function twTmSave(s){const c=$('#twc'+s.id);if(c)c.outerHTML=twCard(s);twTot();await twSaveItem(s,1);twTeam(s.id)}
function twTmN(id,tid,d){const s=twSubj(id),cap=TW.req.cells;
 if(!tid){const m=twMainN(s),n=Math.max(0,m+d);s.per_week=Math.min(cap,twTeamSum(s)+n)}
 else{const m=twMainN(s),x=s.team.find(k=>k.teacher_id==tid);x.per_week=Math.max(0,(x.per_week||0)+d);s.per_week=Math.min(cap,m+twTeamSum(s))}
 twTmSave(s)}
function twTmAdd(id,tid){tid=+tid;if(!tid)return;const s=twSubj(id);s.team=s.team||[];if(s.team.some(x=>x.teacher_id==tid)||tid==s.teacher_id)return;
 s.team.push({teacher_id:tid,teacher:twTchName(tid),per_week:1});s.per_week=Math.min(TW.req.cells,(s.per_week||0)+1);twTmSave(s)}
async function twTmDel(id,tid){const s=twSubj(id),x=s.team.find(k=>k.teacher_id==tid);if(!x)return;s.team=s.team.filter(k=>k.teacher_id!=tid);s.per_week=Math.max(twTeamSum(s),(s.per_week||0)-(x.per_week||0));
 if(s.parts&&(s.teacher_id?1:0)+s.team.length<2){await api('subjects/parts',{subject_id:id,on:0});s.parts=0}twTmSave(s)}
function twPracOn(id){const s=twSubj(id);s.prac={teacher_id:null,teacher:null,per_week:1,doubles:0};twTmSave(s)}
function twPracOff(id){const s=twSubj(id);s.prac=null;twTmSave(s)}
function twPracT(id,tid){const s=twSubj(id);s.prac.teacher_id=+tid||null;s.prac.teacher=twTchName(+tid)||null;twTmSave(s)}
function twPracN(id,d){const s=twSubj(id);s.prac.per_week=twClamp((s.prac.per_week||1)+d,1,TW.req.cells);s.prac.doubles=Math.min(s.prac.doubles||0,Math.floor(s.prac.per_week/2));twTmSave(s)}
function twPracD(id,d){const s=twSubj(id);s.prac.doubles=twClamp((s.prac.doubles||0)+d,0,Math.floor((s.prac.per_week||1)/2));twTmSave(s)}
async function twPartsSet(id,on){const s=twSubj(id),r=await api('subjects/parts',{subject_id:id,on:!!on});if(!r.ok){alert(r.d&&r.d.error=='noteam'?t('tmx_parts_need'):em(r.s,r.d.error));return twTeam(id)}s.parts=on?1:0}
