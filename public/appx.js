// Entry points shared with the storefront: /app?signup opens the sign-up wizard; the public demo is read-only with a banner.
Object.assign(D.en,{dm_t:'You are exploring a read-only demo.',dm_d:'Nothing you do here is saved.',dm_go:'Create your school',e_demo_readonly:'This is a read-only demo. Create your school to make changes.'});
Object.assign(D.fr,{dm_t:'Vous explorez une démo en lecture seule.',dm_d:'Rien de ce que vous faites ici n’est enregistré.',dm_go:'Créer votre école',e_demo_readonly:'Ceci est une démo en lecture seule. Créez votre école pour faire des modifications.'});
if(new URLSearchParams(location.search).has('signup')){const o=login;let once=1;login=function(m,su){if(once){once=0;su=1}return o(m,su)};try{history.replaceState(null,'','/app'+(window.REFQ?'?ref='+encodeURIComponent(window.REFQ):''))}catch{}}
{const o=demoBar;demoBar=function(){if(!(typeof S!='undefined'&&S&&S.demo_ro))return o();
 return`<div class="box warn noprint fr-demo" style="margin:0;border-radius:0;display:flex;gap:12px;flex-wrap:wrap;align-items:center"><b>${t('dm_t')}</b> <span>${t('dm_d')}</span> <button type=button style="margin-left:auto" onclick="dmExit()">${t('dm_go')}</button></div>`}}
async function dmExit(){try{await api('logout',{})}catch{}location.href='/app?signup'}
