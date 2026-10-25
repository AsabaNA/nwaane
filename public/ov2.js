// Breadcrumb bar above every page, and the staff overlay (same layout as the student overlay). Loaded last.
Object.assign(D.en,{tv_role:'Role',tv_user:'Username',tv_mail:'Email',tv_gate:'Gate access',tv_yes:'Yes',tv_no:'No',tv_sec:'Sections',tv_load:'Teaching',tv_load_n:'Subjects [s] · Classes [c]',tv_subj:'Subjects and classes',tv_none:'No subjects or classes assigned yet.',tv_remove:'Remove from staff',tv_pend:'not confirmed yet',tv_pwh:'Leave empty to keep the current password.',tv_gate_l:'Can open the gate screen (arrivals and departures)',tv_head:'Class head',tv_cls:'Classes'});
Object.assign(D.fr,{tv_role:'Rôle',tv_user:'Identifiant',tv_mail:'E-mail',tv_gate:'Accès au portail',tv_yes:'Oui',tv_no:'Non',tv_sec:'Sections',tv_load:'Enseignement',tv_load_n:'Matières [s] · Classes [c]',tv_subj:'Matières et classes',tv_none:'Aucune matière ni classe attribuée.',tv_remove:'Retirer du personnel',tv_pend:'pas encore confirmé',tv_pwh:'Laissez vide pour garder le mot de passe actuel.',tv_gate_l:'Peut ouvrir l’écran du portail (arrivées et départs)',tv_head:'Titulaire',tv_cls:'Classes'});
// ---- breadcrumb
function bcTrail(){const f=VIEWNOW;if(!f||!S)return[];const m=menuOf(),it=m.find(x=>x[1]==f);if(!it)return[];const title=t(it[0]);
 if(f=='vClasses'&&typeof CLS!='undefined'){const multi=(typeof scMulti=='function'&&scMulti()),cn=CLS.open&&(CLS.c||[]).find(k=>k.id==CLS.open),out=[];
  if(multi){out.push({t:t('sc_all'),f:'scBack()'});const sn=CLS.sec&&((SCT||{}).sections||[]).find(x=>x.id==CLS.sec);if(sn)out.push({t:sn.name,f:`scOpen(${CLS.sec})`})}
  else out.push({t:title,f:'clBack()'});if(cn)out.push({t:cn.name});return out}
 if(f=='vTT'&&typeof TW!='undefined'&&twAdm()&&(S.modules||['reports','fees','tracking']).includes('tracking')){const k=TW.scr=='view'?'list':TW.scr=='wiz'||TW.scr=='res'?'new':TW.scr;return[{t:title,f:"twTab('list')"},{t:t('tw_tab_'+k).replace(/^\+ /,'')}]}
 return[{t:title}]}
function bcDraw(){const n=$('#bcb');if(!n)return;let a=[];try{a=bcTrail()}catch{}
 n.innerHTML=a.map((x,i)=>{const last=i==a.length-1;return(i?'<i aria-hidden=true>›</i>':'')+(last||!x.f?`<span${last?' aria-current=page':''}>${esc(x.t)}</span>`:`<button type=button onclick="${x.f}">${esc(x.t)}</button>`)}).join('');n.hidden=!a.length}
function bcWatch(){const m=$('#m');if(!m||window.__bcm===m)return;window.__bcm=m;let q=0;new MutationObserver(()=>{if(q)return;q=requestAnimationFrame(()=>{q=0;bcDraw()})}).observe(m,{childList:true})}
{const g=frGo;frGo=async function(f){await g(f);bcWatch();bcDraw()}}
// ---- staff overlay
const TV={u:null,edit:false};
function tvOpen(id,edit){const u=STAFF.find(x=>x.id==id);if(!u)return;TV.u=u;TV.edit=!!edit&&!(u.role=='principal'||u.id==S.uid);tvDraw(true)}
function tvDraw(first){const u=TV.u,e=esc,edit=TV.edit,can=!(u.role=='principal'||u.id==S.uid),fact=(k,v)=>`<div class=ovf><div class=k>${k}</div><div class=v title="${e(v||'')}">${e(v)||'—'}</div></div>`;
 const cl=[...(u.classes||[])].sort((a,b)=>a.cls.localeCompare(b.cls,undefined,{numeric:true})),m=new Map();
 for(const c of cl)for(const s of c.subjects){if(!m.has(s))m.set(s,[]);m.get(s).push(c)}
 const ho=cl.filter(c=>c.head&&!c.subjects.length);if(ho.length)m.set(t('tv_head'),ho);
 const secs=(typeof scMulti=='function'&&scMulti())?(u.sections||[]).map(id=>((SCT.sections||[]).find(x=>x.id==id)||{}).name).filter(Boolean).join(', '):'';
 const load=u.role=='teacher'?t('tv_load_n').replace('[s]',m.size).replace('[c]',cl.length):'';
 const strip=`<div class=ovid>${fact(t('tv_role'),t(u.role))}${fact(t('tv_user'),u.username)}${fact(t('tv_mail'),u.email?u.email+(u.email_ok?'':' ('+t('tv_pend')+')'):'')}${fact(t('tv_gate'),gateOn(u)?t('tv_yes'):t('tv_no'))}${(typeof scMulti=='function'&&scMulti())&&u.role=='teacher'?fact(t('tv_sec'),secs):fact(t('tv_cls'),cl.length?String(cl.length):'')}${fact(t('tv_load'),load)}</div>`;
 const form=`<div class="ovsec sof"><label for=te_n>${t('name').replace(/ \(.*/,'')}</label><input id=te_n value="${e(u.name)}" maxlength=120><label for=te_e>${t('st_email')}</label><input id=te_e type=email value="${e(u.email||'')}"><label for=te_r>${t('role')}</label><select id=te_r>${['secretary','teacher','surveillant'].map(r=>`<option value=${r} ${u.role==r?'selected':''}>${t(r)}`).join('')}</select><label for=te_p>${t('pass')}</label><input id=te_p type=password autocomplete=new-password placeholder="${e(t('pwkeep'))}"><small>${t('tv_pwh')}</small>
  <label class=ck><input type=checkbox id=te_g ${u.can_gate?'checked':''}> ${t('tv_gate_l')}</label>${(typeof scMulti=='function'&&scMulti())?`<label>${t('sc_sec')}</label><div class=us-g>${(SCT.sections||[]).map(x=>`<label class=ck><input type=checkbox class=te-s value=${x.id} ${(u.sections||[]).includes(x.id)?'checked':''}> ${e(x.name)}</label>`).join('')}</div>`:''}<p class=err id=te_err></p><div class=ov-a><button type=button class=sb onclick="TV.edit=false;tvDraw()">${t('so_cancel')}</button><button type=button onclick="tvSave()">${fi('check',18)} ${t('so_save')}</button></div></div>`;
 const tbl=m.size?`<table class=sot><tr><th>${t('subj')}<th>${t('tv_cls')}${[...m].sort((a,b)=>a[0].localeCompare(b[0])).map(([s,cs])=>`<tr><td>${e(s)}<td>${cs.map(c=>`<span class="chip sfk${c.head?' head':''}" title="${e(c.cls)}${c.head?' · '+t('tv_head'):''}">${e(c.short||c.cls)}</span>`).join(' ')}`).join('')}</table>`:`<p>${t('tv_none')}</p>`;
 const h=`<div class=ovh><span class=ovav aria-hidden=true>${e(initials(u.name))}</span><div class=ovw><h2>${e(u.name)}</h2><div class=ovs>${e(u.username)}<i>·</i>${t(u.role)}</div></div><div class=ova>${can&&!edit?`<button type=button class="ovb pri" onclick="TV.edit=true;tvDraw()">${fi('pencil',15)} ${t('edit')}</button>`:''}<button type=button class=ib onclick="ovClose()" aria-label="${t('so_close')}">${fi('close',18)}</button></div></div>
 ${edit?form:strip}${u.role=='principal'||!edit?`<div class=ovsec><div class=ovsh><h3>${t('tv_subj')}</h3></div>${tbl}</div>`:''}
 ${can&&!edit?`<div class=ovfoot><button type=button class="ovb dng" onclick="tvRemove()">${t('tv_remove')}</button><span class=ovfa></span></div>`:''}`;
 if(first){ovOpen(h);$('.ovc').classList.add('wide','ov2')}else $('.ovc').innerHTML=h}
async function tvSave(){const u=TV.u,sec=(typeof scMulti=='function'&&scMulti())&&$('#te_r').value=='teacher'?[...document.querySelectorAll('.te-s:checked')].map(x=>+x.value):undefined;
 const r=await api('users/update',{id:u.id,name:$('#te_n').value,email:$('#te_e').value,role:$('#te_r').value,password:$('#te_p').value,can_gate:$('#te_g').checked,sections:sec});
 if(!r.ok)return $('#te_err').textContent=em(r.s,r.d.error);ovClose();vStaff()}
async function tvRemove(){if(!confirm(t('delq')))return;const r=await api('users/delete',{id:TV.u.id});if(!r.ok)return alert(em(r.s,r.d.error));ovClose();vStaff()}
