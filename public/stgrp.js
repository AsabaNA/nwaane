// Staff page: group the list by teacher, class or subject, jump between groupings from any chip, and download a group (or the whole view) as PDF.
const SG={view:'teacher',f:'',cls:null};
Object.assign(D.en,{sg_by:'Group by',sg_t:'Teacher',sg_c:'Class',sg_s:'Subject',sg_dl:'Download list',sg_dlg:'Download PDF',sg_all:'All subjects & classes',sg_allc:'All classes',sg_alls:'All subjects',sg_ph:'Search staff, class or subject…',sg_ns:'[n] subjects',sg_ns1:'1 subject',sg_nt:'[n] teachers',sg_nt1:'1 teacher',sg_none:'No teacher assigned yet',sg_nomatch:'No matches',sg_tip:'Click any class or subject chip to jump to that grouping. In “Class” view, each class shows every teacher and the subject they teach there, which makes gaps and overlaps easy to spot.',sg_head:'Class head',sg_filter:'Filter',sg_dlb:'Download',sg_add:'Add Staff',sg_imp:'Import'});
Object.assign(D.fr,{sg_by:'Grouper par',sg_t:'Enseignant',sg_c:'Classe',sg_s:'Matière',sg_dl:'Télécharger la liste',sg_dlg:'Télécharger en PDF',sg_all:'Toutes matières et classes',sg_allc:'Toutes les classes',sg_alls:'Toutes les matières',sg_ph:'Rechercher personnel, classe ou matière…',sg_ns:'[n] matières',sg_ns1:'1 matière',sg_nt:'[n] enseignants',sg_nt1:'1 enseignant',sg_none:'Aucun enseignant affecté',sg_nomatch:'Aucun résultat',sg_tip:'Cliquez sur une pastille de classe ou de matière pour passer à ce regroupement. Dans la vue « Classe », chaque classe montre tous ses enseignants et la matière qu’ils y enseignent, pour repérer les manques et les doublons.',sg_head:'Titulaire',sg_filter:'Filtrer',sg_dlb:'Télécharger',sg_add:'Ajouter',sg_imp:'Importer'});
const sgNat=(a,b)=>String(a).localeCompare(String(b),undefined,{numeric:true,sensitivity:'base'});
const sgBase=()=>{let a=STAFF;if(typeof SFS!='undefined'&&SFS&&typeof scMulti=='function'&&scMulti())a=a.filter(x=>x.role!='teacher'||(x.sections||[]).includes(SFS));if(SF.role)a=a.filter(x=>x.role==SF.role);return a};
// one row per (teacher, subject): the classes where they teach it
const sgItems=u=>{const m=new Map();for(const c of u.classes||[])for(const s of c.subjects){if(!m.has(s))m.set(s,[]);m.get(s).push({cid:c.cid,cl:c.short||c.cls,full:c.cls})}return[...m].map(([s,c])=>({s,c:c.sort((a,b)=>sgNat(a.cl,b.cl))})).sort((a,b)=>sgNat(a.s,b.s))};
const sgHas=(u,it,q)=>!q||[u.name,u.username,it?it.s:'',...(it?it.c.map(x=>x.cl):[])].join(' ').toLowerCase().includes(q);
const sgChip=(label,kind,title)=>`<button type=button class="chip sfk sg-chip" onclick="sgGo('${kind}',this.dataset.t)" data-t="${esc(label)}" title="${esc(title||label)}">${esc(label)}</button>`;
const sgUser=u=>`<span class=sf-av aria-hidden=true>${esc(initials(u.name))}</span><a href=# class=sg-nm onclick="tvOpen(${u.id});return false">${esc(u.name)}</a>`;
function sgOpts(){const a=sgBase().filter(x=>x.role=='teacher'),subs=new Set(),cls=new Map();for(const u of a)for(const c of u.classes||[]){cls.set(c.short||c.cls,1);c.subjects.forEach(s=>subs.add(s))}
 const S=[...subs].sort(sgNat),C=[...cls.keys()].sort(sgNat),v=SG.view,o=v=='class'?C:v=='subject'?S:[...S,...C];
 return`<option value="">${t(v=='class'?'sg_allc':v=='subject'?'sg_alls':'sg_all')}`+o.map(x=>`<option ${x==SG.f?'selected':''}>${esc(x)}`).join('')}
function sgBar(){const tb=document.querySelector('#m .tb');if(!tb||$('#sg_seg'))return;
 const q=tb.querySelector('input');if(q)q.placeholder=t('sg_ph');
 // the old buttons move into the new Download menu and the Add / Import pair
 tb.querySelectorAll(':scope > button').forEach(b=>b.remove());
 tb.classList.add('sg-tb');
 tb.insertAdjacentHTML('beforeend',`<select id=sg_f onchange="SG.f=this.value;sfRows()" aria-label="${t('sg_filter')}">${sgOpts()}</select><div class=sg-seg id=sg_seg role=group aria-label="${t('sg_by')}"><span class=sg-lbl>${t('sg_by')}</span>${[['teacher','sg_t'],['class','sg_c'],['subject','sg_s']].map(([k,l])=>`<button type=button data-v=${k} class="${SG.view==k?'on':''}" onclick="sgGo('${k}')">${t(l)}</button>`).join('')}</div>
 <div class=sg-dd id=sg_dd><button type=button class=sg-dlm id=sg_dl title="${esc(t('sg_dlb'))}" aria-label="${esc(t('sg_dlb'))}" aria-haspopup=menu aria-expanded=false onclick="sgDd(event)">${fi('dl',18)} <span>${t('sg_dlb')}</span> <i class=sg-car>▾</i></button><div class=sg-menu role=menu hidden><button type=button role=menuitem onclick="sgDd();sgPdf('')">${fi('dl',17)} ${t('sg_dl')}</button><button type=button role=menuitem onclick="sgDd();print()">${fi('print',17)} ${t('sf_print')}</button><button type=button role=menuitem onclick="sgDd();tbOpen()">${fi('qr',17)} ${t('tb_btn')}</button></div></div>
 <button type=button class="sg-add sg-b" title="${esc(t('sg_add'))}" aria-label="${esc(t('sg_add'))}" onclick="$('#fh').scrollIntoView({behavior:'smooth'});$('#un').focus()">${fi('add',18)}<span class=sg-tx>${t('sg_add')}</span></button><button type=button class="sg-imp sg-b" onclick="itOpen()" title="${esc(t('it_btn'))}" aria-label="${esc(t('sg_imp'))}"><svg width=18 height=18 viewBox="0 0 24 24" fill=none stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round aria-hidden=true><path d="M12 16V4M7 9l5-5 5 5M4 20h16"/></svg><span class=sg-tx>${t('sg_imp')}</span></button>`);
 if(!$('#sg_pills'))tb.insertAdjacentHTML('afterend','<div id=sg_pills class="crow sg-pills noprint" hidden></div>');sgPills()}
function sgDd(e){const m=document.querySelector('#sg_dd .sg-menu'),b=$('#sg_dl');if(!m)return;if(e){e.stopPropagation();m.hidden=!m.hidden}else m.hidden=true;b.setAttribute('aria-expanded',!m.hidden)}
document.addEventListener('click',e=>{if(!e.target.closest('#sg_dd'))sgDd()});document.addEventListener('keydown',e=>{if(e.key=='Escape')sgDd()});
// class view: a pill per class; subject view: a pill per subject (replaces the filter box)
async function sgPills(){const box=$('#sg_pills'),sel=$('#sg_f');if(!box)return;const v=SG.view;if(sel)sel.style.display=v=='teacher'?'':'none';
 if(v=='teacher'){box.hidden=true;box.innerHTML='';return}
 let items;if(v=='class'){const cls=await sgClasses(),sc=typeof SFS!='undefined'&&SFS&&typeof scMulti=='function'&&scMulti();items=cls.filter(c=>!sc||c.section_id==SFS).sort((a,b)=>sgNat(a.name,b.name)).map(c=>[c.short||c.name,c.name])}
 else{const s=new Set();for(const u of sgBase())for(const c of u.classes||[])c.subjects.forEach(x=>s.add(x));items=[...s].sort(sgNat).map(x=>[x,x])}
 if(v!=SG.view)return;box.hidden=false;
 box.innerHTML=`<button type=button class="${SG.f?'':'on'}" onclick="sgPick('')">${fi('grid',16)} ${t(v=='class'?'sg_allc':'sg_alls')}</button>`+items.map(([k,full])=>`<button type=button class="${SG.f==k?'on':''}" onclick="sgPick(this.dataset.k)" data-k="${esc(k)}" title="${esc(full)}">${esc(k)}</button>`).join('')}
function sgPick(k){SG.f=k;document.querySelectorAll('#sg_pills button').forEach(b=>b.classList.toggle('on',(b.dataset.k||'')==k));sfRows()}
function sgGo(v,f){SG.view=v;SG.f=f||'';document.querySelectorAll('#sg_seg button').forEach(b=>b.classList.toggle('on',b.dataset.v==v));const s=$('#sg_f');if(s)s.innerHTML=sgOpts();sgPills();sfRows()}
function sgPdf(g){const q=(SF.q||'').trim(),u=`/api/staff/pdf?view=${SG.view}&group=${encodeURIComponent(g||'')}&q=${encodeURIComponent(q)}&filter=${encodeURIComponent(SG.f)}&section=${typeof SFS!='undefined'?SFS:0}&lang=${L}`;
 const a=document.createElement('a');a.href=u;a.download='';document.body.appendChild(a);a.click();a.remove()}
async function sgClasses(){if(SG.cls)return SG.cls;const r=await api('classes');SG.cls=r.ok?r.d:[];return SG.cls}
const sgCnt=(n,k)=>t(n==1?k+'1':k).replace('[n]',n);
async function sgRender(){const q=(SF.q||'').toLowerCase().trim(),f=SG.f,tch=sgBase(),v=SG.view,out=$('#sl');let groups=[];
 if(v=='class'){const cls=await sgClasses(),inS=c=>!(typeof SFS!='undefined'&&SFS&&typeof scMulti=='function'&&scMulti())||c.section_id==SFS,by=new Map(cls.filter(inS).sort((a,b)=>sgNat(a.name,b.name)).map(c=>[c.short||c.name,{k:c.short||c.name,full:c.name,head:null,rows:[]}]));
  for(const u of tch)for(const it of sgItems(u))for(const c of it.c)if(sgHas(u,{s:it.s,c:[c]},q)||sgHas(u,it,q)){if(!by.has(c.cl))by.set(c.cl,{k:c.cl,full:c.full,head:null,rows:[]});by.get(c.cl).rows.push({s:it.s,u})}
  for(const u of STAFF)for(const c of u.classes||[])if(c.head&&by.has(c.short||c.cls))by.get(c.short||c.cls).head=u.name;
  groups=[...by.values()].filter(g=>(!f||g.k==f)&&(g.rows.length||!q)).map(g=>({...g,note:g.rows.length?sgCnt(new Set(g.rows.map(r=>r.s)).size,'sg_ns')+' · '+sgCnt(new Set(g.rows.map(r=>r.u.id)).size,'sg_nt'):'',rows:g.rows.sort((a,b)=>sgNat(a.s,b.s)||sgNat(a.u.name,b.u.name))}))}
 else{const by=new Map();for(const u of tch)for(const it of sgItems(u))if(sgHas(u,it,q)){if(!by.has(it.s))by.set(it.s,{k:it.s,rows:[]});by.get(it.s).rows.push({u,c:it.c})}
  groups=[...by.values()].sort((a,b)=>sgNat(a.k,b.k)).filter(g=>!f||g.k==f).map(g=>({...g,note:sgCnt(g.rows.length,'sg_nt'),rows:g.rows.sort((a,b)=>sgNat(a.u.name,b.u.name))}))}
 out.innerHTML=(groups.length?groups.map(g=>`<details class=sg-g open><summary><span class=sg-gn>${esc(g.k)}</span>${v=='class'&&g.head?`<span class=sg-tag title="${esc(t('sg_head'))}">${esc(t('sg_head'))}: ${esc(g.head)}</span>`:''}<span class=sg-ct>${esc(g.note)}</span><button type=button class=sg-dl data-g="${esc(g.k)}" onclick="event.preventDefault();event.stopPropagation();sgPdf(this.dataset.g)">${fi('dl',15)} ${t('sg_dl')}</button></summary>
  <div class=sg-tw><table class=sg-t><tr><th>${t(v=='class'?'sg_s':'sg_t')}<th>${t(v=='class'?'sg_t':'sf_clsh')}${g.rows.map(r=>v=='class'?`<tr><td>${sgChip(r.s,'subject')}<td>${sgUser(r.u)}`:`<tr><td>${sgUser(r.u)}<td>${r.c.map(c=>sgChip(c.cl,'class',c.full)).join('')}`).join('')||`<tr><td colspan=2 class=sg-gap>${t('sg_none')}`}</table></div></details>`).join(''):`<section class="dp sf-card"><p class=none style="padding:20px">${t('sg_nomatch')}</p></section>`)+`<p class="sg-note noprint">${fi('bulb',16)} ${t('sg_tip')}</p>`}
// teacher view keeps the existing table (all staff, edit and delete); search also matches subjects and classes; the chips jump to a grouping
{const ov=vStaff;vStaff=async function(m){await ov(m);if(S.role=='principal'&&document.querySelector('#m .tb')){$('#sg_seg')?0:sgBar();if(SG.view!='teacher')sfRows()}}}
{const o=sfRows;sfRows=function(){
 if(SG.view!='teacher'){sgRender();return}
 const all=STAFF,q=(SF.q||'').toLowerCase().trim(),f=SG.f,keep=x=>{const its=sgItems(x);return(!q||sgHas(x,null,q)||its.some(it=>sgHas(x,it,q)))&&(!f||its.some(it=>it.s==f||it.c.some(c=>c.cl==f)))},qs=SF.q;
 STAFF=all.filter(keep);SF.q='';try{o()}finally{STAFF=all;SF.q=qs}
 // make the chips of the table clickable
 sgChips()}}
function sgChips(){document.querySelectorAll('#sl .sft tr').forEach(tr=>{const td=tr.children,w=tr.querySelector('.sf-who');if(!w||td.length<6)return;const m=/tvOpen\((\d+)\)/.exec(w.getAttribute('onclick')||''),u=m&&STAFF.find(x=>x.id==+m[1]);if(!u)return;
  const its=sgItems(u);td[3].innerHTML=its.length?`<div class=sf-chips>${its.map(it=>sgChip(it.s,'subject')).join('')}</div>`:'<span class=muted>—</span>';
  td[4].innerHTML=(u.classes||[]).length?`<div class=sf-chips>${[...u.classes].sort((a,b)=>sgNat(a.cls,b.cls)).map(c=>`<button type=button class="chip sfk sg-chip${c.head?' head':''}" onclick="sgGo('class',this.dataset.t)" data-t="${esc(c.short||c.cls)}" title="${esc(c.cls)}${c.head?' · '+t('sf_head'):''}">${esc(c.short||c.cls)}</button>`).join('')}</div>`:'<span class=muted>—</span>'})}
