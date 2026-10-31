// Tabbed pages for the office (principal, secretary): Finance and Academics, and the new sidebar order. Loaded last.
//   Finance   = Payments | Fee setup | Hours & pay   (+ "Pay fees" button: record a payment in a pop-up)
//   Academics = Student report cards | Teacher report cards | Exams   (+ "Create exam timetable" on Exams)
// The old views (vFees, vHours, vReports, vTprof, vExams) are unchanged and render into #m; the tab bar lives above it in #pgtabs.
Object.assign(D.en,{finance:'Finance',academics:'Academics',billing:'My Plan',fin_pay:'Pay fees',fin_t_pay:'Payments',fin_t_setup:'Fee setup',fin_t_hours:'Hours & pay',ac_t_reports:'Student report cards',ac_t_tprofile:'Teacher report cards',ac_t_exams:'Exams',ac_ett:'Create exam timetable',pg_tabs:'Sections of this page'});
Object.assign(D.fr,{finance:'Finances',academics:'Académique',billing:'Mon offre',fin_pay:'Payer les frais',fin_t_pay:'Paiements',fin_t_setup:'Barème',fin_t_hours:'Heures et paie',ac_t_reports:'Bulletins des élèves',ac_t_tprofile:'Bulletins des enseignants',ac_t_exams:'Examens',ac_ett:'Créer l’emploi du temps des examens',pg_tabs:'Sections de cette page'});
Object.assign(FICON,{finance:'coin',academics:'cap'});
const PGV={finance:'vFinance',academics:'vAcademics'},PGC={vFees:'finance',vRecPay:'finance',vHours:'finance',vReports:'academics',vTprof:'academics',vExams:'academics'},PGOFFICE=()=>['principal','secretary'].includes(S.role);
const pgHas=k=>menuOf().some(x=>x[0]==k);
function pgTabs(p){if(!S||!PGOFFICE())return[];const pr=S.role=='principal',a=[];
 if(p=='finance'){if(pgHas('fees'))a.push({k:'pay',l:t('fin_t_pay')});if(pgHas('fees')&&pr)a.push({k:'setup',l:t('fin_t_setup')});if(pgHas('hours')&&pr)a.push({k:'hours',l:t('fin_t_hours')})}
 if(p=='academics'){if(pgHas('reports'))a.push({k:'reports',l:t('ac_t_reports')});if(pgHas('tprofile'))a.push({k:'tprofile',l:t('ac_t_tprofile')});if(pgHas('exams'))a.push({k:'exams',l:t('ac_t_exams')})}
 return a}
function pgParent(f){const p=PGC[f];if(!p||!S||!PGOFFICE())return null;if(f=='vHours'&&S.role!='principal')return null;return pgTabs(p).length?p:null}
const pgCur=(p,f)=>p=='finance'?(f=='vHours'?'hours':FE.tab=='setup'?'setup':'pay'):({vReports:'reports',vTprof:'tprofile',vExams:'exams'}[f]||'');
function pgBar(f){const host=$('#pgtabs');if(!host)return;const p=pgParent(f);document.body.classList.toggle('pgtd',!!p);if(!p){host.innerHTML='';return}
 const tabs=pgTabs(p),cur=pgCur(p,f);let act='';
 if(p=='finance'&&pgHas('recpay'))act=`<button type=button class="pay-btn" onclick="payOpen()">${fi('coin',18)} ${t('fin_pay')}</button>`;
 if(p=='academics'&&cur=='exams'&&typeof twAdm=='function'&&twAdm())act=`<button type=button class="pay-btn ac-ett" onclick="acNewTT()">${fi('plus',18)} ${t('ac_ett')}</button>`;
 host.innerHTML=`<h1>${t(p)}</h1><div class=pgt-row><div class="seg pgt-seg" role=group aria-label="${t('pg_tabs')}">${tabs.map(x=>`<button type=button data-t=${x.k} class="${x.k==cur?'on':''}" aria-pressed="${x.k==cur}" onclick="pgGo('${p}','${x.k}')">${x.l}</button>`).join('')}</div>${act}</div>`}
async function pgGo(p,k){if(p=='finance'){if(k=='hours')return frGo('vHours');FE.tab=k=='setup'?'setup':'collect';return frGo('vFees')}
 return frGo({reports:'vReports',tprofile:'vTprof',exams:'vExams'}[k])}
window.vFinance=async()=>{const t0=pgTabs('finance')[0];return t0?pgGo('finance',t0.k):0};
window.vAcademics=async()=>{const t0=pgTabs('academics')[0];return t0?pgGo('academics',t0.k):0};
// sidebar highlight and tab bar follow whichever child view is open
{const o=frameActive;frameActive=function(f){const p=pgParent(f);o(p?PGV[p]:f);pgBar(f)}}
// breadcrumb: Finance > Payments
{const o=bcTrail;bcTrail=function(){const p=pgParent(VIEWNOW);if(!p)return o();const tb=pgTabs(p).find(x=>x.k==pgCur(p,VIEWNOW));return[{t:t(p),f:`pgGo('${p}','${pgTabs(p)[0].k}')`},...(tb?[{t:tb.l}]:[])]}}
// sidebar for the office: Dashboard / Staff, Teacher attendance / Classes, Academics, Timetable / Finance, My Plan / Settings (no group labels, thin dividers)
{const old=navGroups;navGroups=function(){if(!S||!PGOFFICE())return old();
 const m=menuOf().filter(([k])=>k!='classlist'||S.heads),pick=new Set(),items=[];
 const CH={fees:'finance',recpay:'finance',hours:'finance',reports:'academics',tprofile:'academics',exams:'academics'};
 for(const [k,f] of m){const p=CH[k]&&pgTabs(CH[k]).length&&!(k=='hours'&&S.role!='principal')?CH[k]:null,kk=p||k,ff=p?PGV[p]:f;if(!pick.has(kk)){pick.add(kk);items.push([kk,ff])}}
 const ORD=[['dashboard'],['staff','today'],['classes','academics','timetable','roll'],['finance','billing'],['settings']],used=new Set(),out=[];
 ORD.forEach((g,i)=>{const it=g.map(k=>items.find(x=>x[0]==k)).filter(Boolean);it.forEach(x=>used.add(x[0]));out.push(['_'+i,it])});
 const rest=items.filter(x=>!used.has(x[0]));if(rest.length){const g3=out[2];g3[1]=g3[1].concat(rest)}
 return out.filter(g=>g[1].length)}}
// ---- Pay fees: the Record payment screen as a pop-up (search a student, pick them, record the payment)
let PAYREF=0;
async function payOpen(){const cl=(await api('classes')).d;PAYREF=1;
 document.querySelectorAll('#m #e,#m #res,#m #pa,#m #pm,#m #pr,#m #pd,#m #rpq,#m #rpl,#m #rpp').forEach(e=>e.removeAttribute('id'));
 ovOpen(`<h2>${t('fin_pay')}</h2><p><small>${t('rp_sub')}</small></p><div class="tb noprint"><label class=srch>${fi('search',18)}<input id=rpq placeholder="${t('rp_find')}" value="${esc(RPY.q)}" oninput="RPY.q=this.value;clearTimeout(RPY.tm);RPY.tm=setTimeout(rpFind,200)" aria-label="${t('rp_find')}" autocomplete=off></label>
 <select onchange="RPY.cid=+this.value;rpFind()" aria-label="${t('f_cls')}"><option value=0>${t('f_all')}${cl.map(k=>`<option value=${k.id} ${k.id==RPY.cid?'selected':''}>${esc(k.name)}`).join('')}</select></div><div id=rpl></div><div id=rpp></div>`);
 $('.ovc').classList.add('wide','payc');RPY.sid?rpOpen(RPY.sid):rpFind();const q=$('#rpq');q&&q.focus()}
// the old Record payment page is now this pop-up over the Payments tab (search results, dashboard actions and old links still land here)
window.vRecPay=async function(){await frGo('vFees');await payOpen()};
{const o=rpSave;rpSave=async function(id){await o(id);const b=$('#ovl #res button[onclick*="vRecPay"]');if(b)b.setAttribute('onclick',"RPY.sid=0;RPY.q='';payOpen()")}}
{const o=ovClose;ovClose=function(){const had=PAYREF&&$('#ovl #rpp');o();if(had){PAYREF=0;if(VIEWNOW=='vFees')vFees();else if(VIEWNOW=='vHours')vHours()}}}
// ---- Exams tab: create the exam timetable (opens the wizard of the Timetable page's Exam timetable tab)
async function acNewTT(){TW.scr='exam';TW.pre=1;await frGo('vTT');await ewStart()}
