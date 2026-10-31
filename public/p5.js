// Phase 5 screens: school fees (collect, owing list, setup).
Object.assign(D.en,{fees:'Fees',f_collect:'Collect',f_owing:'Owing list',f_setup:'Fee setup',f_term:'Term',f_all:'All classes',f_search:'Search by name or matricule',f_name:'Student',f_cls:'Class',f_due:'Due to date',f_paid:'Paid',f_bal:'Balance',f_st:'Status',f_phone:'Parent phone',
f_s_paid:'Paid',f_s_partial:'Partly paid',f_s_unpaid:'Not paid',f_s_nofee:'No fee set',f_onlyowing:'Only students who owe',f_tot:'{a} of {b} students owe {m} FCFA for term {t}.',f_exp:'Expected to date',f_coll:'Collected',f_out:'Still owed',
f_pay:'Record a payment',f_amt:'Amount (FCFA)',f_how:'Paid by',f_cash:'Cash',f_momo:'MTN MoMo',f_om:'Orange Money',f_bank:'Bank',f_other:'Other',f_ref:'Reference (optional)',f_date:'Date',f_hist:'Payments',f_rcpt:'Receipt',f_void:'Cancel',f_voidq:'Why is this payment cancelled?',f_voided:'cancelled',f_by:'Received by',
f_disc:'Discount per term (FCFA)',f_rel:'Allow report card anyway (term {t})',f_relq:'Why is this card allowed? (kept in the record)',f_perterm:'Fee per term',f_cum:'Due by end of term',f_credit:'credit',f_saved:'Payment recorded.',f_none:'No payments yet.',
f_plan:'Fee per class and term (FCFA)',f_planall:'Same for every class',f_save:'Save',f_rule:'Report cards',f_rule_all:'Print for every student',f_rule_paid:'Print only for students who have paid up to that term',f_ruleh:'The principal can still allow a single card, with a reason.',f_held:'fees owing',f_heldn:'{n} card(s) held back because fees are owing.',f_print:'Print',f_nopay:'Enter a valid amount.',
e_unpaid:'This card is held back because fees are owing. The principal can allow it.'});
Object.assign(D.fr,{fees:'Frais de scolarité',f_collect:'Encaisser',f_owing:'Liste des impayés',f_setup:'Barème',f_term:'Trimestre',f_all:'Toutes les classes',f_search:'Rechercher par nom ou matricule',f_name:'Élève',f_cls:'Classe',f_due:'Dû à ce jour',f_paid:'Payé',f_bal:'Solde',f_st:'Statut',f_phone:'Téléphone du parent',
f_s_paid:'Payé',f_s_partial:'Partiellement payé',f_s_unpaid:'Non payé',f_s_nofee:'Pas de frais',f_onlyowing:'Seulement les élèves qui doivent',f_tot:'{a} élèves sur {b} doivent {m} FCFA pour le trimestre {t}.',f_exp:'Attendu à ce jour',f_coll:'Encaissé',f_out:'Reste dû',
f_pay:'Enregistrer un paiement',f_amt:'Montant (FCFA)',f_how:'Payé par',f_cash:'Espèces',f_momo:'MTN MoMo',f_om:'Orange Money',f_bank:'Banque',f_other:'Autre',f_ref:'Référence (facultatif)',f_date:'Date',f_hist:'Paiements',f_rcpt:'Reçu',f_void:'Annuler',f_voidq:'Pourquoi ce paiement est-il annulé ?',f_voided:'annulé',f_by:'Reçu par',
f_disc:'Réduction par trimestre (FCFA)',f_rel:'Autoriser le bulletin quand même (trimestre {t})',f_relq:'Pourquoi autoriser ce bulletin ? (conservé dans le dossier)',f_perterm:'Frais du trimestre',f_cum:'Dû à la fin du trimestre',f_credit:'crédit',f_saved:'Paiement enregistré.',f_none:'Aucun paiement.',
f_plan:'Frais par classe et par trimestre (FCFA)',f_planall:'Identique pour toutes les classes',f_save:'Enregistrer',f_rule:'Bulletins',f_rule_all:'Imprimer pour tous les élèves',f_rule_paid:'Imprimer seulement pour les élèves à jour jusqu’à ce trimestre',f_ruleh:'Le chef d’établissement peut toujours autoriser un bulletin, avec un motif.',f_held:'frais impayés',f_heldn:'{n} bulletin(s) retenu(s) : frais impayés.',f_print:'Imprimer',f_nopay:'Saisissez un montant valide.',
e_unpaid:'Ce bulletin est retenu : des frais sont impayés. Le chef d’établissement peut l’autoriser.'});
{const old=menuOf;menuOf=function(){const m=old();if(S.role=='principal'||S.role=='secretary')m.splice(m.findIndex(x=>x[1]=='vReports')+1,0,['fees','vFees']);return m}}
Object.assign(D.en,{f_collect:'Payments',f_sub:'A clear view of every student’s term payments.',f_pay_h:'Student payments',f_st_all:'All students',f_st_owing:'Still owing',f_st_paid:'Fully paid',f_st_partial:'Partly paid',f_st_unpaid:'Not paid',f_nst:'[n] students',f_pct:'[p]% collected',f_wbal:'with a balance',f_nomatch:'No students match these filters.',f_showing:'Showing [a]–[b] of [n] students',f_showing0:'Showing 0 students',
fs_naz:'Name: A–Z',fs_nza:'Name: Z–A',fs_cls:'Class',fs_bhi:'Balance: highest',fs_blo:'Balance: lowest',fs_phi:'Amount paid: highest',fs_plo:'Amount paid: lowest',fs_done:'Fully paid first',f_prt:'Print this list',f_prth:'Prints the list as shown: this term, class, status tab, search and order',f_tt:'Total',
pr_all:'Student payment register',pr_owing:'Students still owing',pr_paid:'Fully paid students',pr_partial:'Partly paid students',pr_unpaid:'Students who have not paid'});
Object.assign(D.fr,{f_collect:'Paiements',f_sub:'Une vue claire des paiements de chaque élève, trimestre par trimestre.',f_pay_h:'Paiements des élèves',f_st_all:'Tous les élèves',f_st_owing:'Doivent encore',f_st_paid:'Payé en totalité',f_st_partial:'Partiellement payé',f_st_unpaid:'Non payé',f_nst:'[n] élèves',f_pct:'[p] % encaissé',f_wbal:'avec un solde',f_nomatch:'Aucun élève ne correspond à ces filtres.',f_showing:'[a]–[b] sur [n] élèves',f_showing0:'0 élève',
fs_naz:'Nom : A–Z',fs_nza:'Nom : Z–A',fs_cls:'Classe',fs_bhi:'Solde : le plus élevé',fs_blo:'Solde : le plus bas',fs_phi:'Montant payé : le plus élevé',fs_plo:'Montant payé : le plus bas',fs_done:'Payés en premier',f_prt:'Imprimer cette liste',f_prth:'Imprime la liste telle qu’affichée : trimestre, classe, onglet de statut, recherche et ordre',f_tt:'Total',
pr_all:'Registre des paiements des élèves',pr_owing:'Élèves qui doivent encore',pr_paid:'Élèves ayant tout payé',pr_partial:'Élèves partiellement payés',pr_unpaid:'Élèves n’ayant rien payé'});
const fm5=n=>String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
let FE={tab:'collect',term:1,cid:0,q:'',status:'all',sid:0,page:1,st:{k:'name',d:1},data:null};
function vFees(tab){if(tab)FE.tab=tab;if(window.pgBar)pgBar('vFees');const adm=S.role=='principal',tabs=[['collect','f_collect'],...(adm?[['setup','f_setup']]:[])];
 const pills=FE.tab=='collect'?pillRow([1,2,3].map(i=>({id:i,name:t('f_term')+' '+i})),FE.term,'feTerm'):'';
 $('#m').innerHTML=`${lHead(t('fees'),t('f_sub'),pills)}<div id=ff></div>`;return{collect:feCollect,setup:feSetup}[FE.tab]()}
const stCls=s=>s=='paid'?'g':s=='nofee'?'':'r';
const stChip=s=>`<span class="chip ${s=='paid'?'ok':s=='partial'?'warn':s=='unpaid'?'bad':''}">${s=='paid'?fi('check',14):s=='nofee'?'':fi('clock',14)}${t('f_s_'+s)}</span>`;
window.feTerm=i=>{FE.term=+i;FE.page=1;vFees()};
async function feList(){return(await api(`fees/list?term=${FE.term}`)).d}
// ---- payments page: summary cards, status tabs, filters, sortable table (15 per page), print of exactly what is shown
const FE_SORTS=[['name:1','fs_naz'],['name:-1','fs_nza'],['cls:1','fs_cls'],['bal:-1','fs_bhi'],['bal:1','fs_blo'],['paid:-1','fs_phi'],['paid:1','fs_plo'],['done:1','fs_done']];
const FE_STAT=[['all','f_st_all'],['owing','f_st_owing'],['paid','f_st_paid'],['partial','f_st_partial'],['unpaid','f_st_unpaid']];
const feMatch=(r,s)=>s=='all'||(s=='owing'&&r.bal>0)||(s=='paid'&&r.status=='paid')||(s=='partial'&&r.status=='partial')||(s=='unpaid'&&r.status=='unpaid');
function feBase(){return FE.data.rows.filter(r=>!FE.cid||r.cid==FE.cid)}
function feView(){const q=FE.q.trim().toLowerCase(),{k,d}=FE.st,v=r=>k=='done'?(r.status=='paid'?0:1):k=='paid'?Math.min(r.paid,r.due):r[k];
 return feBase().filter(r=>feMatch(r,FE.status)&&(!q||(r.name+' '+r.matricule).toLowerCase().includes(q))).sort((a,b)=>cmpV(v(a),v(b),d)||a.name.localeCompare(b.name))}
async function feCollect(){FE.data=await feList();const cl=(await api('classes')).d;FE.cl=cl;
 $('#ff').innerHTML=`<div id=fm></div><section class="dp fpay"><div class=fh><h2>${t('f_pay_h')} <span class="chip" id=fcnt></span></h2></div>
 <div class="tb noprint"><label class=srch>${fi('search',18)}<input id=fq placeholder="${t('f_search')}" value="${esc(FE.q)}" oninput="FE.q=this.value;FE.page=1;clearTimeout(window.fqt);window.fqt=setTimeout(feRefresh,200)" aria-label="${t('f_search')}"></label>
 <select onchange="FE.cid=+this.value;FE.page=1;feRefresh()" aria-label="${t('f_cls')}"><option value=0>${t('f_all')}${cl.map(k=>`<option value=${k.id} ${k.id==FE.cid?'selected':''}>${esc(k.name)}`).join('')}</select>
 <select id=fsort onchange="feSortSel(this.value)" aria-label="${t('sortby')}">${FE_SORTS.map(([v,l])=>`<option value="${v}">${t('sortby')}: ${t(l)}`).join('')}</select></div>
 <div class="fstat noprint" id=fstat></div><div id=fr></div><div class="fbot noprint" id=fbot></div></section><div id=fs></div>`;
 feRefresh();if(FE.sid)await feStudent(FE.sid)}
window.feSortSel=v=>{const[k,d]=v.split(':');FE.st={k,d:+d};FE.page=1;feRefresh()};
window.feSort=k=>{sortTo(FE.st,k);FE.page=1;feRefresh()};
window.feStat=s=>{FE.status=s;FE.page=1;feRefresh()};window.fePage=p=>{FE.page=p;feRefresh()};
window.feOpen=async id=>{await feStudent(id);$('#fs').scrollIntoView({behavior:'smooth',block:'start'})};
function feRefresh(){const base=feBase(),sum=base.reduce((a,r)=>{a.due+=r.due;a.paid+=Math.min(r.paid,r.due);if(r.bal>0){a.owed+=r.bal;a.n++}return a},{due:0,paid:0,owed:0,n:0}),pct=sum.due?Math.round(sum.paid/sum.due*100):0;
 $('#fm').innerHTML=`<div class=fmet><div><span>${t('f_exp')}${fi('wallet',18)}</span><b>${fm5(sum.due)}<small>FCFA</small></b><em>${t('f_nst').replace('[n]',base.length)} · ${t('f_term')} ${FE.term}</em></div>
 <div><span>${t('f_coll')}${fi('check',18)}</span><b>${fm5(sum.paid)}<small>FCFA</small></b><em><strong>${t('f_pct').replace('[p]',pct)}</strong><i class=fbar><i style="width:${pct}%"></i></i></em></div>
 <div><span>${t('f_out')}${fi('clock',18)}</span><b>${fm5(sum.owed)}<small>FCFA</small></b><em><strong>${t('f_nst').replace('[n]',sum.n)}</strong> ${t('f_wbal')}</em></div></div>`;
 $('#fcnt').textContent=base.length;
 $('#fstat').innerHTML=`<div class=fts role=tablist aria-label="${t('f_st')}">${FE_STAT.map(([k,l])=>`<button type=button role=tab aria-selected="${k==FE.status}" class="${k==FE.status?'on':''}" onclick="feStat('${k}')">${t(l)} <span>${base.filter(r=>feMatch(r,k)).length}</span></button>`).join('')}</div><button type=button class="sb fprt" onclick="fePrint()" title="${esc(t('f_prth'))}">${fi('print',18)} ${t('f_prt')} <span id=fpn></span></button>`;
 const v=feView();feRows(v);const sv=FE.st.k+':'+FE.st.d,so=$('#fsort');if(so)so.value=FE_SORTS.some(x=>x[0]==sv)?sv:so.value;$('#fpn').textContent='('+v.length+')'}
const FEPG=15;
function feRows(v){v=v||feView();const pages=Math.max(1,Math.ceil(v.length/FEPG));FE.page=Math.min(FE.page,pages);const a=(FE.page-1)*FEPG,st=FE.st,h=(l,k,c)=>sortTh(l,k,st,'feSort',c);
 $('#fr').innerHTML=`<div class=ftw><table class=ftb><tr>${h(t('f_name'),'name')}<th>${t('mat')}${h(t('f_cls'),'cls')}<th class=n>${t('f_due')}${h(t('f_paid'),'paid','n')}${h(t('f_bal'),'bal','n')}<th>${t('f_st')}<th>${t('f_phone')}${v.slice(a,a+FEPG).map(r=>`<tr class="${r.id==FE.sid?'sel':''}" style="cursor:pointer" onclick="feOpen(${r.id})"><td><b>${esc(r.name)}</b><td>${esc(r.matricule)}<td>${esc(r.cls)}<td class=n>${fm5(r.due)}<td class=n>${fm5(Math.min(r.paid,r.due))}<td class="n ${r.bal>0?'fow':'fzero'}">${r.bal>0?fm5(r.bal):0}<td>${stChip(r.status)}<td>${esc(r.phone||'')}`).join('')}</table></div>${v.length?'':`<div class=empty>${t('f_nomatch')}</div>`}`;
 const go=(p,l,dis,c)=>`<button type=button ${dis?'disabled':''} ${c?'class=on':''} aria-label="${l}" onclick="fePage(${p})">${l}</button>`;
 $('#fbot').innerHTML=`<span>${v.length?t('f_showing').replace('[a]',a+1).replace('[b]',Math.min(a+FEPG,v.length)).replace('[n]',v.length):t('f_showing0')}</span><div class=fpg>${pages>1?go(FE.page-1,'‹',FE.page==1)+Array.from({length:pages},(_,i)=>go(i+1,i+1,0,FE.page==i+1)).join('')+go(FE.page+1,'›',FE.page==pages):''}</div>`}
// ---- print: exactly the list on screen (term, class, status tab, search, order). Same letterhead and page rules as the class lists.
async function fePrint(){const rows=feView();if(!rows.length)return;const br=await psBrand();psClear();
 document.body.insertAdjacentHTML('beforeend',`<div id=psheet>${psFees(rows,br)}</div><style id=psst>@page{size:A4 portrait;margin:12mm}</style>`);document.body.classList.add('psh');
 await Promise.all([...document.querySelectorAll('#psheet img')].map(i=>i.decode().catch(()=>{})));window.addEventListener('afterprint',psClear,{once:true});setTimeout(()=>print(),60)}
function psFees(rows,br){const e=esc,cls=FE.cl.find(k=>k.id==FE.cid),title=t('pr_'+FE.status),sv=FE.st.k+':'+FE.st.d,so=FE_SORTS.find(x=>x[0]==sv),srt=so?t(so[1]):FE.st.k,
 sub=[`${t('f_term')} ${FE.term}`,`${t('ps_year')}: ${e(S.year||'')}`,`${t('f_cls')}: ${e(cls?cls.name:t('f_all'))}`].join(' · '),
 pb=[`${t('sortby')}: ${e(srt)}`].concat(FE.q.trim()?[`${t('f_search')}: “${e(FE.q.trim())}”`]:[]).join(' · '),
 T=rows.reduce((a,r)=>{a.due+=r.due;a.paid+=Math.min(r.paid,r.due);a.bal+=Math.max(0,r.bal);return a},{due:0,paid:0,bal:0}),
 need=(h,vals,pt=12)=>Math.ceil((Math.max(mmw(h,9.5,1),...vals.map(v=>mmw(String(v),pt,0)))+2*PS.PADX)*10)/10,m=r=>fm5(r),pd=r=>Math.min(r.paid,r.due),bl=r=>r.bal>0?m(r.bal):'0',
 stT=r=>t('f_s_'+r.status),sx=FE.cid==0,all=FE.status=='all';
 const C=[{k:'no',h:t('ps_no'),w:need(t('ps_no'),rows.map((_,i)=>i+1).concat(['']),12),al:'c',v:(r,i)=>i+1},{k:'mat',h:t('mat'),w:need(t('mat'),rows.map(r=>r.matricule)),v:r=>r.matricule},{k:'nm',h:t('ps_name')}];
 if(sx)C.push({k:'cl',h:t('f_cls'),w:need(t('f_cls'),rows.map(r=>r.cs||r.cls)),v:r=>r.cs||r.cls});
 C.push({k:'du',h:t('f_due'),w:need(t('f_due'),rows.map(r=>m(r.due)).concat([m(T.due)])),al:'r',v:r=>m(r.due)},{k:'pa',h:t('f_paid'),w:need(t('f_paid'),rows.map(r=>m(pd(r))).concat([m(T.paid)])),al:'r',v:r=>m(pd(r))},{k:'ba',h:t('f_bal'),w:need(t('f_bal'),rows.map(bl).concat([m(T.bal)])),al:'r',v:bl});
 if(all)C.push({k:'st',h:t('f_st'),w:need(t('f_st'),rows.map(stT)),v:stT});
 C.push({k:'ph',h:t('f_phone'),w:need(t('f_phone'),rows.map(r=>r.phone||''),10),v:r=>r.phone||'',fs:10});
 const nmC=C.find(c=>c.k=='nm');nmC.w=Math.max(30,PS.W-C.reduce((a,c)=>a+(c.w||0),0));const nin=nmC.w-2*PS.PADX,nf=rows.map(r=>psName(r.name,nin)),hs=nf.map(f=>f.n>1?Math.max(PS.ROW,f.n*3.2+2.4):PS.ROW);
 hs.push(PS.ROW);   // the totals row
 const pages=[];let cur=[],used=0,cap=PS.PAGE-PS.HEAD-PS.TH-3.5;
 hs.forEach((h,i)=>{if(cur.length&&used+h>cap){pages.push(cur);cur=[];used=0;cap=PS.PAGE-PS.TH}cur.push(i);used+=h});if(cur.length)pages.push(cur);
 const thead=`<thead><tr>${C.map(c=>`<th${c.al?` class=${c.al}`:''}>${e(c.h)}`).join('')}</thead>`,cg=`<colgroup>${C.map(c=>`<col style="width:${c.k=='nm'?nmC.w:c.w}mm">`).join('')}</colgroup>`,span=C.findIndex(c=>c.k=='du');
 const tot=`<tr class=tot style="height:${PS.ROW}mm"><td colspan=${span} class=r><b>${t('f_tt')} · ${rows.length}</b><td class=r><b>${m(T.due)}</b><td class=r><b>${m(T.paid)}</b><td class=r><b>${m(T.bal)}</b>${'<td>'.repeat(C.length-span-3)}`;
 return`<div class="ps cur">${pages.map((ix,pi)=>`<div class=pg>${pi?'':psHead(br,title,sub,pb)}<table style="width:${PS.W}mm">${cg}${thead}<tbody>${ix.map(i=>{if(i==rows.length)return tot;const r=rows[i];return`<tr style="height:${hs[i]}mm">${C.map(c=>c.k=='nm'?`<td class="nm${nf[i].pt<12?' sm':''}">${e(r.name)}`:`<td${c.al?` class=${c.al}`:''}${c.fs?` style="font-size:${c.fs}pt"`:''}>${e(c.v(r,i))}`).join('')}`}).join('')}</tbody></table></div>`).join('')}</div>`}
async function feStudent(id){FE.sid=id;const r=(await api('fees/student?id='+id)).d,adm=S.role=='principal',today=S.now.date;
 $('#ff').querySelectorAll('#fr tr').forEach(()=>{});
 $('#fs').innerHTML=`<hr><h2>${esc(r.name)} <small>${esc(r.cls)} · ${esc(r.matricule)}</small></h2>${r.guardian?`<p>${esc(r.guardian)} ${esc(r.phone||'')}</p>`:''}
 <table><tr><th>${t('f_term')}<th>${t('f_perterm')}<th>${t('f_cum')}<th>${t('f_bal')}<th>${t('f_st')}${[0,1,2].map(i=>`<tr><td>${i+1}<td>${fm5(r.per[i])}<td>${fm5(r.due[i])}<td>${r.bal[i]<0?fm5(-r.bal[i])+' '+t('f_credit'):fm5(r.bal[i])}<td class=${stCls(r.status[i])}>${t('f_s_'+r.status[i])}${adm&&r.bal[i]>0?` <label style="font-weight:400;display:inline"><input type=checkbox ${r.released[i]?'checked':''} style="display:inline-block;width:auto;min-height:0" onchange="feRel(${r.id},${i+1},this.checked)"> ${t('f_rel').replace('{t}',i+1)}</label>`:''}`).join('')}</table>
 <h3>${t('f_pay')}</h3><label>${t('f_amt')}</label><input id=pa type=number min=1 ${IS}> <label style="display:inline">${t('f_how')}</label> <select id=pm ${IS}>${['cash','momo','om','bank','other'].map(m=>`<option value=${m}>${t('f_'+m)}`).join('')}</select>
 <label>${t('f_ref')}</label><input id=pr ${IS}> <label style="display:inline">${t('f_date')}</label> <input type=date id=pd value="${today}" max="${today}" ${IS}><br><button class=big onclick="feSave(${r.id})">${t('f_pay')}</button><p class=err id=e></p><div id=res></div>
 <h3>${t('f_hist')}</h3>${r.payments.length?`<table>${r.payments.map(p=>`<tr ${p.void?'style="text-decoration:line-through;color:#888"':''}><td>#${String(p.receipt).padStart(5,'0')}<td>${p.date}<td>${fm5(p.amount)}<td>${t('f_'+p.method)}${p.ref?' · '+esc(p.ref):''}<td>${esc(p.by)}<td>${p.void?`<span class=r style="text-decoration:none">${t('f_voided')}: ${esc(p.void_reason)}</span> `:''}<a href=# onclick="rcPrint(${p.id});return false">${t('rc_print')}</a> · <a href="/api/fees/receipt/pdf?id=${p.id}&lang=${L}">${t('rc_pdf')}</a>${adm&&!p.void?` · <a href=# onclick="feVoid(${p.id});return false">${t('f_void')}</a>`:''}`).join('')}</table>`:`<p class=empty>${t('f_none')}</p>`}
 ${adm?`<p><label style="display:inline">${t('f_disc')}</label> <input type=number min=0 id=pdc value=${r.disc} ${IS} style="width:140px"> <button class=sb onclick="feDisc(${r.id})">${t('f_save')}</button></p>`:''}`;
 $('#fs').scrollIntoView({behavior:'smooth'})}
async function feSave(id){const a=+$('#pa').value;if(!(a>0))return $('#e').textContent=t('f_nopay');const r=await api('fees/pay',{student_id:id,amount:a,method:$('#pm').value,ref:$('#pr').value,date:$('#pd').value});
 if(!r.ok)return $('#e').textContent=em(r.s,r.d.error);await feCollect();$('#res').innerHTML=`<p class="box ok">${t('f_saved')} ${t('f_rcpt')} #${String(r.d.receipt).padStart(5,'0')}: <button type=button class=sb onclick="rcPrint(${r.d.id})">${t('rc_print')}</button> <a href="/api/fees/receipt/pdf?id=${r.d.id}&lang=${L}">${t('rc_pdf')}</a></p>`}
async function feVoid(id){const why=prompt(t('f_voidq'));if(!why)return;const r=await api('fees/void',{id,reason:why});r.ok?feCollect():alert(em(r.s,r.d.error))}
async function feDisc(id){const r=await api('fees/discount',{student_id:id,amount:+$('#pdc').value});r.ok?feCollect():alert(em(r.s,r.d.error))}
async function feRel(id,term,on){let reason='';if(on){reason=prompt(t('f_relq'));if(!reason)return feStudent(id)}const r=await api('fees/release',{student_id:id,term,on,reason});if(!r.ok)alert(em(r.s,r.d.error));feStudent(id)}
// ---- setup (principal)
async function feSetup(){const p=(await api('fees/plan')).d;
 $('#ff').innerHTML=`<h2>${t('f_plan')}</h2><div style="overflow-x:auto"><table><tr><th>${t('f_cls')}<th>${t('f_term')} 1<th>${t('f_term')} 2<th>${t('f_term')} 3<th><tr class=fe-all><td><b>${t('f_planall')}</b>${[0,1,2].map(i=>`<td><input type=number min=0 id=fp0_${i} style="min-height:40px;width:110px">`).join('')}<td><button class=sb onclick="feSavePlan(0)">${t('f_save')}</button>${p.classes.map(c=>`<tr><td>${esc(c.name)}${c.t.map((a,i)=>`<td><input type=number min=0 id=fp${c.id}_${i} value=${a} style="min-height:40px;width:110px">`).join('')}<td><button class=sb onclick="feSavePlan(${c.id})">${t('f_save')}</button>`).join('')}</table></div><div id=res></div>
 <h2>${t('f_rule')}</h2><select id=fru ${IS} onchange="feRule(this.value)"><option value=all ${p.rule=='all'?'selected':''}>${t('f_rule_all')}<option value=paid ${p.rule=='paid'?'selected':''}>${t('f_rule_paid')}</select><p><small>${t('f_ruleh')}</small></p>
 <h2>${t('rc_paper')}</h2><select id=rcw ${IS} onchange="feRw(this.value)"><option value=80 ${p.rw==80?'selected':''}>${t('rc_p80')}<option value=58 ${p.rw==58?'selected':''}>${t('rc_p58')}</select><p><small>${t('rc_paperh')}</small></p><p id=rcs class=ok></p>`}
async function feSavePlan(id){const a=[0,1,2].map(i=>$('#fp'+id+'_'+i).value);if(a.some(x=>x===''))return;const r=await api('fees/plan',{class_id:id||undefined,all:!id,amounts:a.map(Number)});r.ok?feSetup():$('#res').innerHTML=`<p class="box bad">${em(r.s,r.d.error)}</p>`}
async function feRule(v){await api('fees/rule',{rule:v})}
async function feRw(v){const r=await api('fees/rwidth',{w:+v});$('#rcs').textContent=r.ok?t('rc_ps'):em(r.s,r.d.error)}
