// Timetable generator tab: weekly periods per subject, rules, preview of a proposed timetable, apply. Loaded after p4.js.
Object.assign(D.en,{x_tgen:'Generator',tg_h1:'Weekly periods',tg_p1:'How many periods each subject gets in a week. The generator needs this for every subject; subjects left empty get no lessons.',
 tg_cls:'Class',tg_sub:'Subject',tg_tch:'Teacher',tg_pw:'Periods / week',tg_md:'Max / day',tg_db:'Doubles',tg_now:'now',tg_all:'All classes',tg_all_h:'Use these numbers for [s] in every class',tg_save:'Save',tg_saved:'Saved.',
 tg_tot:'[n] of [m] periods used in a week',tg_notch:'No teacher',tg_fill:'Fill from the current timetable',tg_fill_h:'Take the weekly counts from the timetable in force today, for subjects with no number yet.',tg_filled:'[n] subjects filled.',
 tg_h2:'Rules',tg_p2:'Always applied: one class per teacher per period, teacher availability, and the maximum per day. Below, what the generator should try to do.',
 tg_morn:'Heavy subjects in the morning',tg_heavy:'Heavy = coefficient of at least',tg_gaps:'Avoid free periods between a teacher’s lessons',tg_tmax:'Most periods a teacher can teach in one day (0 = no limit)',
 tg_h3:'Generate',tg_from:'Starts on',tg_mode:'Mode',tg_m_fresh:'Start fresh: rebuild the timetable of every class that has weekly periods',tg_m_fill:'Keep what is already there and fill the gaps',tg_go:'Generate a proposal',tg_again:'Another proposal',tg_apply:'Apply this timetable',tg_discard:'Discard',
 tg_cap:'Capacity check',tg_ok_cap:'Every teacher and class fits.',tg_over:'needs [n] periods but has only [m] free',tg_cell:'[n] periods a week do not fit in a [m]-period week',
 tg_noreq:'[n] subjects have no weekly periods and will get no lessons.',tg_notchw:'[n] subjects have no teacher: they are placed, but nobody is checked for clashes.',tg_stats:'Placed [a] of [b] periods',tg_unp:'Could not place',tg_why_teacher:'the teacher has too few free periods',tg_why_class:'the class has more periods than the week has',tg_why_tight:'no free slot was left: try another proposal or lower the load',
 tg_q:'Quality',tg_gc:'free periods inside class days: [n]',tg_gt:'free periods inside teacher days: [n]',tg_hp:'heavy subjects in the afternoon: [n]',tg_rp:'subjects twice in one day: [n]',tg_chg:'[n] cells change from [d]. Lessons already recorded are not touched.',tg_nochg:'Nothing would change.',
 tg_applyq:'Apply the new timetable from [d]? [n] cells change. Lessons already recorded are not touched.',tg_done:'Timetable applied: [n] cells changed.',tg_clash:'[n] clashes remain; check them in the Classes tab.',tg_open:'Open the timetable',tg_view:'View',tg_vc:'Class',tg_vt:'Teacher',
 e_gen_past:'Choose today or a later date.',e_gen_noreq:'Set the weekly periods of at least one subject first.',e_gen_stale:'The rules changed since this proposal was made. Generate a new one.'});
Object.assign(D.fr,{x_tgen:'Générateur',tg_h1:'Périodes par semaine',tg_p1:'Combien de périodes chaque matière reçoit par semaine. Le générateur en a besoin pour chaque matière ; une matière laissée vide n’a aucun cours.',
 tg_cls:'Classe',tg_sub:'Matière',tg_tch:'Enseignant',tg_pw:'Périodes / semaine',tg_md:'Max / jour',tg_db:'Doubles',tg_now:'actuel',tg_all:'Toutes les classes',tg_all_h:'Utiliser ces valeurs pour [s] dans toutes les classes',tg_save:'Enregistrer',tg_saved:'Enregistré.',
 tg_tot:'[n] périodes sur [m] utilisées dans la semaine',tg_notch:'Sans enseignant',tg_fill:'Remplir depuis l’emploi du temps actuel',tg_fill_h:'Reprend les nombres hebdomadaires de l’emploi du temps en vigueur aujourd’hui, pour les matières sans valeur.',tg_filled:'[n] matières remplies.',
 tg_h2:'Règles',tg_p2:'Toujours appliquées : une classe par enseignant et par période, disponibilités des enseignants et maximum par jour. Ci-dessous, ce que le générateur doit chercher à faire.',
 tg_morn:'Matières lourdes le matin',tg_heavy:'Lourde = coefficient d’au moins',tg_gaps:'Éviter les trous entre les cours d’un enseignant',tg_tmax:'Maximum de périodes par jour pour un enseignant (0 = sans limite)',
 tg_h3:'Générer',tg_from:'À partir du',tg_mode:'Mode',tg_m_fresh:'Repartir de zéro : refaire l’emploi du temps de chaque classe qui a des périodes hebdomadaires',tg_m_fill:'Garder l’existant et combler les trous',tg_go:'Générer une proposition',tg_again:'Une autre proposition',tg_apply:'Appliquer cet emploi du temps',tg_discard:'Abandonner',
 tg_cap:'Vérification des capacités',tg_ok_cap:'Chaque enseignant et chaque classe tient.',tg_over:'a besoin de [n] périodes mais n’en a que [m] de libres',tg_cell:'[n] périodes par semaine ne tiennent pas dans une semaine de [m] périodes',
 tg_noreq:'[n] matières n’ont pas de périodes hebdomadaires et n’auront aucun cours.',tg_notchw:'[n] matières n’ont pas d’enseignant : elles sont placées, mais aucun conflit n’est vérifié.',tg_stats:'[a] périodes placées sur [b]',tg_unp:'Non placé',tg_why_teacher:'l’enseignant a trop peu de périodes libres',tg_why_class:'la classe a plus de périodes que la semaine',tg_why_tight:'plus de place libre : essayez une autre proposition ou réduisez la charge',
 tg_q:'Qualité',tg_gc:'périodes libres dans les journées des classes : [n]',tg_gt:'périodes libres dans les journées des enseignants : [n]',tg_hp:'matières lourdes l’après-midi : [n]',tg_rp:'matières deux fois le même jour : [n]',tg_chg:'[n] cases changent à partir du [d]. Les cours déjà enregistrés ne sont pas touchés.',tg_nochg:'Rien ne changerait.',
 tg_applyq:'Appliquer le nouvel emploi du temps à partir du [d] ? [n] cases changent. Les cours déjà enregistrés ne sont pas touchés.',tg_done:'Emploi du temps appliqué : [n] cases modifiées.',tg_clash:'[n] conflits restent ; vérifiez-les dans l’onglet Classes.',tg_open:'Ouvrir l’emploi du temps',tg_view:'Vue',tg_vc:'Classe',tg_vt:'Enseignant',
 e_gen_past:'Choisissez aujourd’hui ou une date ultérieure.',e_gen_noreq:'Indiquez d’abord les périodes hebdomadaires d’au moins une matière.',e_gen_stale:'Les règles ont changé depuis cette proposition. Générez-en une nouvelle.'});
const tgF=(k,o)=>Object.entries(o).reduce((s,[a,b])=>s.replace('['+a+']',b),t(k));
const TG={cid:0,from:'',mode:'fresh',prop:null,view:'c',vid:0,msg:'',data:null};
async function ttGen(){const r=await api('timetable/gen/req');if(!r.ok)return $('#tt').innerHTML=`<p class="box bad">${em(r.s,r.d.error)}</p>`;
 const d=TG.data=r.d;if(!d.classes.length)return $('#tt').innerHTML=`<div class=empty>${t('noclass')}</div>`;
 if(!d.classes.some(c=>c.id==TG.cid))TG.cid=d.classes[0].id;if(!TG.from)TG.from=S.now.date;
 const ck=(await api(`timetable/gen/check?from=${TG.from}&mode=${TG.mode}`)).d,c=d.classes.find(x=>x.id==TG.cid),tot=c.subjects.reduce((n,s)=>n+(s.per_week||0),0),cf=d.cfg;
 const bad=[...ck.teachers.filter(x=>x.need>x.free).map(x=>`<li><b>${esc(x.name)}</b> ${tgF('tg_over',{n:x.need,m:x.free})}`),...ck.classes.filter(x=>x.need>x.cells).map(x=>`<li><b>${esc(x.name)}</b> ${tgF('tg_cell',{n:x.need,m:x.cells})}`)];
 $('#tt').innerHTML=`<section class=dp><div class=dp-h><h2>${t('tg_h1')}</h2></div><p class=hint>${t('tg_p1')}</p>
 <div class="tb noprint"><select onchange="TG.cid=+this.value;ttGen()" aria-label="${t('tg_cls')}">${d.classes.map(k=>`<option value=${k.id} ${k.id==TG.cid?'selected':''}>${esc(k.name)}`).join('')}</select>
  <button type=button class=sb onclick="tgFill()" title="${esc(t('tg_fill_h'))}">${fi('check',18)} ${t('tg_fill')}</button></div>
 <div style="overflow-x:auto"><table><tr><th>${t('tg_sub')}<th>${t('tg_tch')}<th>${t('tg_pw')}<th>${t('tg_md')}<th>${t('tg_db')}<th>
 ${c.subjects.map(s=>`<tr><td><b>${esc(s.name)}</b> <small class=hint>${t('tg_now')}: ${s.current}</small><td>${s.teacher?esc(s.teacher):`<span class="chip warn">${t('tg_notch')}</span>`}
  <td><input type=number min=0 max=${d.cells} class=tgi id=tgp${s.id} value="${s.per_week??''}" aria-label="${t('tg_pw')}" oninput="tgTot()">
  <td><input type=number min=1 max=4 class=tgi id=tgm${s.id} value="${s.max_day}" aria-label="${t('tg_md')}">
  <td><input type=number min=0 max=5 class=tgi id=tgd${s.id} value="${s.doubles}" aria-label="${t('tg_db')}">
  <td><button type=button class="sb sbs" onclick="tgAll(${s.id})" title="${esc(tgF('tg_all_h',{s:s.name}))}">${t('tg_all')}</button>`).join('')}</table></div>
 <p class=hint id=tgt>${tgF('tg_tot',{n:tot,m:d.cells})}</p>
 <button type=button onclick="tgSaveReq()">${fi('check',18)} ${t('tg_save')}</button> <span id=tgm1></span></section>
 <section class=dp><div class=dp-h><h2>${t('tg_cap')}</h2></div>${bad.length?`<ul class=xl>${bad.join('')}</ul>`:`<p class="box ok">${t('tg_ok_cap')}</p>`}
  ${ck.noreq.length?`<p class="box warn">${tgF('tg_noreq',{n:ck.noreq.length})}</p>`:''}${ck.noteacher.length?`<p class="box warn">${tgF('tg_notchw',{n:ck.noteacher.length})}</p>`:''}</section>
 <section class=dp><div class=dp-h><h2>${t('tg_h2')}</h2></div><p class=hint>${t('tg_p2')}</p>
  <label class=ck><input type=checkbox id=tgc1 ${cf.morning?'checked':''}> ${t('tg_morn')}</label>
  <label for=tgc2>${t('tg_heavy')}</label><input type=number id=tgc2 min=1 max=10 value="${cf.heavy}" style="max-width:90px">
  <label class=ck><input type=checkbox id=tgc3 ${cf.gaps?'checked':''}> ${t('tg_gaps')}</label>
  <label for=tgc4>${t('tg_tmax')}</label><input type=number id=tgc4 min=0 max=14 value="${cf.tmax}" style="max-width:90px">
  <button type=button onclick="tgSaveCfg()">${fi('check',18)} ${t('tg_save')}</button> <span id=tgm2></span></section>
 <section class=dp><div class=dp-h><h2>${t('tg_h3')}</h2></div>
  <label for=tgf>${t('tg_from')}</label><input type=date id=tgf value="${TG.from}" min="${S.now.date}" onchange="TG.from=this.value;ttGen()">
  <label for=tgmo>${t('tg_mode')}</label><select id=tgmo onchange="TG.mode=this.value;ttGen()"><option value=fresh ${TG.mode=='fresh'?'selected':''}>${t('tg_m_fresh')}<option value=fill ${TG.mode=='fill'?'selected':''}>${t('tg_m_fill')}</select>
  <div class=tb><button type=button id=tgg onclick="tgRun()">${fi('check',18)} ${t('tg_go')}</button></div><p class=err id=e></p>${TG.msg}<div id=tgp></div></section>`;
 if(TG.prop)tgDraw()}
function tgTot(){const d=TG.data,c=d.classes.find(x=>x.id==TG.cid);let n=0;for(const s of c.subjects)n+=+($('#tgp'+s.id).value||0);$('#tgt').textContent=tgF('tg_tot',{n,m:d.cells})}
const tgItem=s=>({subject_id:s.id,per_week:+$('#tgp'+s.id).value||0,max_day:+$('#tgm'+s.id).value||2,doubles:+$('#tgd'+s.id).value||0});
async function tgSaveReq(){const c=TG.data.classes.find(x=>x.id==TG.cid),r=await api('timetable/gen/req',{items:c.subjects.map(tgItem)});
 if(r.ok){TG.prop=null;TG.msg='';await ttGen();$('#tgm1').innerHTML=`<span class="chip ok">${t('tg_saved')}</span>`}else $('#tgm1').innerHTML=`<span class="chip bad">${em(r.s,r.d.error)}</span>`}
async function tgAll(id){const c=TG.data.classes.find(x=>x.id==TG.cid),s=c.subjects.find(x=>x.id==id),v=tgItem(s),items=[];
 for(const k of TG.data.classes)for(const x of k.subjects)if(x.name==s.name)items.push({...v,subject_id:x.id});
 const r=await api('timetable/gen/req',{items});if(r.ok){TG.prop=null;ttGen()}else alert(em(r.s,r.d.error))}
async function tgFill(){const r=await api('timetable/gen/req/fill',{});if(r.ok){await ttGen();$('#tgm1').innerHTML=`<span class="chip ok">${tgF('tg_filled',{n:r.d.n})}</span>`}}
async function tgSaveCfg(){const r=await api('timetable/gen/cfg',{morning:$('#tgc1').checked,heavy:+$('#tgc2').value,gaps:$('#tgc3').checked,tmax:+$('#tgc4').value});
 $('#tgm2').innerHTML=r.ok?`<span class="chip ok">${t('tg_saved')}</span>`:`<span class="chip bad">${em(r.s,r.d.error)}</span>`}
async function tgRun(){$('#tgg').disabled=true;$('#e').textContent='';TG.msg='';
 const r=await api('timetable/gen',{from:TG.from,mode:TG.mode});$('#tgg').disabled=false;
 if(!r.ok)return $('#e').textContent=em(r.s,r.d.error);TG.prop=r.d;TG.vid=r.d.scope[0]||0;tgDraw()}
function tgDraw(){const p=TG.prop;if(!p)return;const st=p.stats;const cls=[...new Set(p.cells.map(c=>c.c+'|'+c.cls))].map(x=>x.split('|')).sort((a,b)=>a[1].localeCompare(b[1],undefined,{numeric:true})),
 tch=[...new Map(p.cells.filter(c=>c.t).map(c=>[c.t,c.teacher])).entries()].sort((a,b)=>a[1].localeCompare(b[1]));
 if(TG.view=='c'&&!cls.some(x=>x[0]==TG.vid))TG.vid=+(cls[0]||[0])[0];if(TG.view=='t'&&!tch.some(x=>x[0]==TG.vid))TG.vid=(tch[0]||[0])[0];
 const m={};for(const c of p.cells)if(TG.view=='c'?c.c==TG.vid:c.t==TG.vid)m[c.d+':'+c.p]=c;
 const why=u=>t('tg_why_'+u.reason);
 $('#tgp').innerHTML=`<div class=ph-sep></div><div class="box ${st.unplaced.length?'warn':'ok'}"><b>${tgF('tg_stats',{a:st.placed,b:st.total})}</b></div>
 ${st.unplaced.length?`<div class="box bad"><b>${t('tg_unp')}</b><ul class=xl>${st.unplaced.map(u=>`<li>${esc(u.cls)} · ${esc(u.subject)}: ${u.n} — ${why(u)}`).join('')}</ul></div>`:''}
 <p class=hint><b>${t('tg_q')}:</b> ${tgF('tg_gc',{n:st.gap_class})} · ${tgF('tg_gt',{n:st.gap_teacher})} · ${tgF('tg_hp',{n:st.heavy_pm})} · ${tgF('tg_rp',{n:st.repeat})}</p>
 <p class=hint>${p.changes?tgF('tg_chg',{n:p.changes,d:p.from}):t('tg_nochg')}</p>
 <div class="tb noprint">${seg([['c',t('tg_vc')],['t',t('tg_vt')]],TG.view,'tgView',t('tg_view'))}
  <select onchange="TG.vid=TG.view=='c'?+this.value:+this.value;tgDraw()" aria-label="${t('tg_view')}">${(TG.view=='c'?cls:tch).map(x=>`<option value=${x[0]} ${x[0]==TG.vid?'selected':''}>${esc(x[1])}`).join('')}</select></div>
 ${grid({days:p.days,periods:p.periods,breaks:p.breaks},(d,n)=>{const c=m[d+':'+n];return c?`<b>${esc(TG.view=='c'?c.subject:c.cls+' · '+c.subject)}</b>${TG.view=='c'?`<br><small>${esc(c.teacher||t('tg_notch'))}</small>`:''}`:''})}
 <div class="tb noprint"><button type=button onclick="tgApply()" ${p.changes?'':'disabled'}>${fi('check',18)} ${t('tg_apply')}</button> <button type=button class=sb onclick="tgRun()">${t('tg_again')}</button> <button type=button class=sb onclick="TG.prop=null;$('#tgp').innerHTML=''">${t('tg_discard')}</button></div>`}
window.tgView=k=>{TG.view=k;TG.vid=0;tgDraw()};
async function tgApply(){const p=TG.prop;if(!p||!confirm(tgF('tg_applyq',{d:p.from,n:p.changes})))return;
 const r=await api('timetable/gen/apply',{id:p.id});if(!r.ok){$('#e').textContent=em(r.s,r.d.error);return}
 TG.prop=null;TG.msg=`<p class="box ok">${tgF('tg_done',{n:r.d.changed})}${r.d.clashes?' '+tgF('tg_clash',{n:r.d.clashes}):''} <a href="#" onclick="TT.tab='cls';vTT();return false">${t('tg_open')}</a></p>`;ttGen()}
