// Redesign step 3 — shared UI pieces: segmented control, sortable column headers, mark chips.
Object.assign(D.en,{sortby:'Sort by',sortasc:'A to Z',sortdesc:'Z to A'});
Object.assign(D.fr,{sortby:'Trier par',sortasc:'A à Z',sortdesc:'Z à A'});
// segmented control: items [[key,label],...], cur = active key, fn = global function name called with the key
const seg=(items,cur,fn,label)=>`<div class="seg noprint" role=group${label?` aria-label="${esc(label)}"`:''}>${items.map(([k,l])=>`<button type=button class="${k==cur?'on':''}" aria-pressed="${k==cur}" onclick="${fn}('${k}')">${l}</button>`).join('')}</div>`;
// sortable column header. st = {k:'name',d:1|-1}; fn = global function name called with the column key
const SORTI='<svg width=14 height=14 viewBox="0 0 24 24" fill=none stroke=currentColor stroke-width=2.4 stroke-linecap=round stroke-linejoin=round aria-hidden=true>';
const sortTh=(label,key,st,fn,cls)=>{const on=st.k==key;
 const ic=on?(st.d==1?SORTI+'<path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>':SORTI+'<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>'):SORTI+'<path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/></svg>';
 return`<th${cls?` class="${cls}"`:''} aria-sort="${on?(st.d==1?'ascending':'descending'):'none'}"><button type=button class="srt${on?' on':''}" onclick="${fn}('${key}')" title="${t('sortby')} ${esc(label)}: ${t(on&&st.d==1?'sortdesc':'sortasc')}">${label}${ic}</button>`};
// click on a header: new column -> ascending, same column -> flip
const sortTo=(st,key)=>{if(st.k==key)st.d=-st.d;else{st.k=key;st.d=1}};
// compare helpers: nulls always last
const cmpV=(a,b,d)=>{if(a==null||b==null)return(a==null)-(b==null);return(typeof a=='number'&&typeof b=='number'?a-b:String(a).localeCompare(String(b),undefined,{numeric:true,sensitivity:'base'}))*d};
// mark /20 as a coloured chip: >=10 green, 8-10 amber, <8 red
const mkChip=v=>v==null?'<span class="chip">—</span>':`<span class="chip ${v>=10?'ok':v>=8?'warn':'bad'}">${(+v).toFixed(2)}</span>`;
