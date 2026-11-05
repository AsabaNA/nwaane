// Plan self-service (client): locked pages with an "Add to my plan" offer, and a modules panel on the Billing page.
Object.assign(D.en,{pl_A:'Report cards & attendance',pl_B:'School fees',pl_C:'Teacher attendance',
 pl_lt:'[m] is not in your plan',pl_ls:'This page belongs to a module your school has not added.',pl_ls_any:'This page is part of either of these modules. Adding one unlocks it.',
 pl_ask:'Ask your principal to add this module to the school’s plan.',pl_add:'Add to my plan',pl_cancel:'Cancel',pl_per_s:'per student per term',pl_per_t:'per teacher per term',
 pl_est:'About [a] FCFA for this term, based on your current numbers',pl_incl:'What you get',
 pl_wt:'Add [m] to your plan?',pl_w1:'You will be charged [u] FCFA [per] for this module, on your next term invoice (about [a] FCFA this term, based on your current numbers).',
 pl_w2:'Once added, you can only remove it after you have paid your current balance, and the removal takes effect at the end of the term.',pl_w3:'The module unlocks immediately.',pl_yes:'Yes, add it',
 pl_h:'Your modules',pl_hs:'Add what you need. Modules are billed on the term invoice.',pl_on:'In your plan',pl_off:'Not in your plan',pl_ends:'Ends [d]',pl_rm:'Remove',pl_undo:'Keep it',
 pl_owing:'Pay your balance of [a] FCFA first to remove a module.',pl_last:'A school needs at least one module.',
 pl_rt:'Remove [m]?',pl_r1:'It stays available until [d], the end of this term, and this term is still billed. Your data is kept: adding the module again brings everything back.',pl_ryes:'Yes, remove at term end',
 e_plan_owing:'Pay your current balance first.',e_plan_last:'A school needs at least one module.',e_plan_has:'Already in your plan.',e_plan_none:'This module is not active.',
 pl_f_A:['Mark entry, averages and rankings','Report cards (PDF, bulk print, WhatsApp share, QR check)','Honour roll, student roll call, student ID cards','Exam papers and print-ready compilation','Exam and school timetable creation'],
 pl_f_B:['Fee set-up per class (per term or one total with a deadline)','Recording payments with numbered receipts (POS or A5)','Who owes what: owing lists and printing','Accounting export for Sage and Ciel'],
 pl_f_C:['Daily gate check-in, teacher ID badges','Class QR codes and lesson check-in, spot checks, location lock','Hours and pay sheets, invigilation duties','School and exam timetable creation']});
Object.assign(D.fr,{pl_A:'Bulletins et présence',pl_B:'Scolarité',pl_C:'Présence des enseignants',
 pl_lt:'[m] ne fait pas partie de votre offre',pl_ls:'Cette page appartient à un module que votre école n’a pas ajouté.',pl_ls_any:'Cette page fait partie de l’un de ces deux modules. En ajouter un la débloque.',
 pl_ask:'Demandez au chef d’établissement d’ajouter ce module à l’offre de l’école.',pl_add:'Ajouter à mon offre',pl_cancel:'Annuler',pl_per_s:'par élève et par trimestre',pl_per_t:'par enseignant et par trimestre',
 pl_est:'Environ [a] FCFA ce trimestre, selon vos effectifs actuels',pl_incl:'Ce que vous obtenez',
 pl_wt:'Ajouter [m] à votre offre ?',pl_w1:'Vous serez facturé [u] FCFA [per] pour ce module, sur votre prochaine facture de trimestre (environ [a] FCFA ce trimestre, selon vos effectifs actuels).',
 pl_w2:'Une fois ajouté, vous ne pourrez le retirer qu’après avoir payé votre solde actuel, et le retrait prend effet à la fin du trimestre.',pl_w3:'Le module est débloqué immédiatement.',pl_yes:'Oui, l’ajouter',
 pl_h:'Vos modules',pl_hs:'Ajoutez ce dont vous avez besoin. Les modules sont facturés sur la facture du trimestre.',pl_on:'Dans votre offre',pl_off:'Pas dans votre offre',pl_ends:'Se termine le [d]',pl_rm:'Retirer',pl_undo:'Le garder',
 pl_owing:'Payez d’abord votre solde de [a] FCFA pour retirer un module.',pl_last:'Une école a besoin d’au moins un module.',
 pl_rt:'Retirer [m] ?',pl_r1:'Il reste disponible jusqu’au [d], fin de ce trimestre, et ce trimestre reste facturé. Vos données sont conservées : ajouter à nouveau le module remet tout en place.',pl_ryes:'Oui, retirer à la fin du trimestre',
 e_plan_owing:'Payez d’abord votre solde actuel.',e_plan_last:'Une école a besoin d’au moins un module.',e_plan_has:'Déjà dans votre offre.',e_plan_none:'Ce module n’est pas actif.',
 pl_f_A:['Saisie des notes, moyennes et classements','Bulletins (PDF, impression groupée, WhatsApp, vérification par QR)','Tableau d’honneur, appel des élèves, cartes d’élève','Sujets d’examen et compilation prête à imprimer','Création des emplois du temps (cours et examens)'],
 pl_f_B:['Barème par classe (par trimestre ou total avec échéance)','Paiements avec reçus numérotés (ticket ou A5)','Qui doit quoi : listes et impression','Export comptable pour Sage et Ciel'],
 pl_f_C:['Pointage quotidien à l’entrée, cartes des enseignants','QR de classe et confirmation des cours, contrôles, verrou de position','Heures et fiches de paie, surveillance des examens','Création des emplois du temps (cours et examens)']});
const PLM={reports:'A',fees:'B',tracking:'C'},PLN={reports:'pl_A',fees:'pl_B',tracking:'pl_C'};
// menu key -> modules needed ('any' = one of them is enough)
const PLK={reports:['any','reports'],entermarks:['any','reports'],roll:['any','reports'],exams:['any','reports'],fees:['any','fees'],recpay:['any','fees'],today:['any','tracking'],hours:['any','tracking'],myhours:['any','tracking'],timetable:['any','reports','tracking'],mytt:['any','reports','tracking'],tprofile:['all','reports','fees','tracking'],finance:['any','fees','tracking'],academics:['any','reports']};
const plMiss=k=>{const r=PLK[k];if(!r)return null;const have=S.modules||['reports','fees','tracking'],ms=r.slice(1);return(r[0]=='all'?ms.every(m=>have.includes(m)):ms.some(m=>have.includes(m)))?null:{mode:r[0],mods:ms.filter(m=>!have.includes(m))}};
// the principal sees every item (locked ones carry a padlock); other roles only see what the plan includes
{const mo=menuOf;menuOf=function(){if(S.role!='principal')return mo();const real=S.modules;S.modules=['reports','fees','tracking'];try{return mo()}finally{S.modules=real}}}
{const fh=frameHTML;frameHTML=function(){return fh().replace(/(<a href=# class=fr-it) (data-f="[^"]+" data-k="([^"]+)"[^>]*>)(.*?)<\/a>/g,(x,a,b,k,c)=>plMiss(k)&&S.role=='principal'?`${a} fr-lk ${b}${c}<i class=fr-pad>${fi('lock',14)}</i></a>`.replace('class=fr-it fr-lk','class="fr-it fr-lk"'):x)}}
const plFm=n=>typeof fm5=='function'?fm5(n):String(n),plFill=(s,o)=>Object.entries(o).reduce((x,[k,v])=>x.split('['+k+']').join(v),s);
{const g=frGo;frGo=async function(f){const k=((menuOf().find(x=>x[1]==f))||[])[0],m=k&&plMiss(k);if(!m)return g(f);frameActive(f);VIEWNOW=f;await plLock(k,m);window.scrollTo(0,0)}}
async function plLock(k,m){const pr=S.role=='principal',host=$('#m');let d=null;if(pr){const r=await api('plan');if(r.ok)d=r.d}
 const one=m.mods.length==1,name=m.mods.map(x=>t(PLN[x])).join(' / '),card=x=>{const o=d&&d.modules.find(y=>y.k==x);
  return`<section class="dp pl-card"><div class=dp-h><h2>${t(PLN[x])}</h2><span class=chip>${o?plFm(o.unit):''} FCFA ${t(x=='tracking'?'pl_per_t':'pl_per_s')}</span></div><p class=hint>${t('pl_incl')}</p><ul class=pl-ul>${(D[L]['pl_f_'+PLM[x]]||[]).map(i=>`<li>${i}</li>`).join('')}</ul>
  ${pr?`<p class=hint>${o?plFill(t('pl_est'),{a:plFm(o.add_est)}):''}</p><div class=fa><button type=button class=sb onclick="plAsk('${x}')">${fi('plus',18)} ${t('pl_add')}</button></div>`:`<p class=hint>${t('pl_ask')}</p>`}</section>`};
 host.innerHTML=`${document.body.classList.contains('pgtd')?'':`<div class=ph><h1>${t(k)}</h1></div>`}<div class="box pl-box">${fi('lock',22)}<div><b>${plFill(t('pl_lt'),{m:name})}</b><p>${t(m.mods.length>1&&m.mode=='any'?'pl_ls_any':'pl_ls')}</p></div></div><div class=pl-cards>${m.mods.map(card).join('')}</div>`}
async function plAsk(x){const r=await api('plan');if(!r.ok)return alert(em(r.s,r.d.error));const o=r.d.modules.find(y=>y.k==x);
 ovOpen(`<h2>${plFill(t('pl_wt'),{m:esc(t(PLN[x]))})}</h2><div class="box warn"><p>${plFill(t('pl_w1'),{u:plFm(o.unit),per:t(x=='tracking'?'pl_per_t':'pl_per_s'),a:plFm(o.add_est)})}</p><p><b>${t('pl_w2')}</b></p></div><p class=hint>${t('pl_w3')}</p><p class=err id=pl_e></p><div class=fa><button type=button class=sb onclick="ovClose()">${t('pl_cancel')}</button><button type=button id=pl_go onclick="plDo('plan/add','${x}')">${t('pl_yes')}</button></div>`)}
async function plDo(u,x){const b=$('#pl_go');b&&(b.disabled=true);const r=await api(u,{module:x});if(!r.ok){b&&(b.disabled=false);const e=$('#pl_e');return e?e.textContent=em(r.s,r.d.error):alert(em(r.s,r.d.error))}
 ovClose();const me=await api('me');if(me.ok)S.modules=me.d.modules;home(0,VIEWNOW)}
function plRm(x){api('plan').then(r=>{if(!r.ok)return;const d=r.d;
 ovOpen(`<h2>${plFill(t('pl_rt'),{m:esc(t(PLN[x]))})}</h2><div class=box><p>${plFill(t('pl_r1'),{d:typeof bd=='function'?bd(d.term_end):d.term_end})}</p></div><p class=err id=pl_e></p><div class=fa><button type=button class=sb onclick="ovClose()">${t('pl_cancel')}</button><button type=button id=pl_go onclick="plDo('plan/remove','${x}')">${t('pl_ryes')}</button></div>`)})}
async function plPanel(){const host=$('#m .dcs');if(!host||$('#plp'))return;const r=await api('plan');if(!r.ok)return;const d=r.d,bdx=x=>typeof bd=='function'?bd(x):x;
 const row=o=>`<div class=pl-row><div><b>${t(PLN[o.k])}</b><small>${plFm(o.unit)} FCFA ${t(o.k=='tracking'?'pl_per_t':'pl_per_s')}</small></div>
  <span class="chip ${o.on?(o.off_on?'warn':'ok'):''}">${o.on?(o.off_on?plFill(t('pl_ends'),{d:bdx(o.off_on)}):t('pl_on')):t('pl_off')}</span>
  ${!o.on||o.off_on?`<button type=button class=sb onclick="plAsk('${o.k}')">${o.off_on?t('pl_undo'):t('pl_add')}</button>`:`<button type=button class=sb ${d.can_remove?'':'disabled'} onclick="plRm('${o.k}')">${t('pl_rm')}</button>`}</div>`;
 host.insertAdjacentHTML('afterend',`<section class=dp id=plp><div class=dp-h><h2>${t('pl_h')}</h2></div><p class=hint>${t('pl_hs')}</p>${d.modules.map(row).join('')}${d.balance>0?`<p class=hint>${plFill(t('pl_owing'),{a:plFm(d.balance)})}</p>`:''}</section>`)}
{const ob=vBill;vBill=async function(){await ob();await plPanel()}}
// Finance / Academics tabs: padlock on locked tabs; open the first tab the plan includes
const PLT={pay:'fees',setup:'fees',hours:'hours',reports:'reports',tprofile:'tprofile',exams:'exams'};
{const pb=pgBar;pgBar=function(f){pb(f);if(S.role!='principal')return;document.querySelectorAll('.pgt .pay-btn').forEach(b=>plMiss('recpay')&&b.remove());document.querySelectorAll('.pgt-seg button').forEach(b=>{if(plMiss(PLT[b.dataset.t])&&!b.querySelector('.fr-pad'))b.insertAdjacentHTML('beforeend',` <i class=fr-pad>${fi('lock',13)}</i>`)})}}
window.vFinance=async()=>{const a=pgTabs('finance'),t0=a.find(x=>!plMiss(PLT[x.k]))||a[0];return t0?pgGo('finance',t0.k):0};
window.vAcademics=async()=>{const a=pgTabs('academics'),t0=a.find(x=>!plMiss(PLT[x.k]))||a[0];return t0?pgGo('academics',t0.k):0};
