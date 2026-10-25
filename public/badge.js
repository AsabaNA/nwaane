// Student photos (crop + WebP in the browser, checked again on the server) and ID card printing. Loaded after dash.js.
Object.assign(D.en,{ph_choose:'Choose photo',ph_change:'Change photo',ph_rm:'Remove photo',ph_zoom:'Zoom',ph_hint:'Drag the photo to centre the face. Saved as WebP, under 100 KB.',ph_none:'No photo',ph_label:'Photo',
 id_btn:'Print ID Cards',id_h:'Print ID cards',id_p:'Choose the classes whose cards you want to print.',id_whole:'Whole school',id_stu:'[n] students',id_nophoto:'[n] without photo',id_lay:'Layout',id_l_sheet:'A4 sheets, 10 cards per page (print double-sided, flip on the long edge)',id_l_card:'One card per page (card printer)',id_onlynew:'Only cards not printed yet',
 id_warn:'[n] students do not have photos yet ([x]…). Their cards will show an empty photo box.',id_any:'Print anyway',id_back:'Go back',id_go:'Print',id_cancel:'Cancel',id_ready:'File ready: [n] cards. It opened in a new tab.',id_none:'Choose at least one class.',id_many:'Upload many photos',id_manyh:'Name each file with the student ID (matricule), for example 26-104.jpg, or the full name.',
 id_up:'Uploading [a] of [b]…',id_upd:'[n] photos added.',id_unm:'[n] files did not match a student: [x]',id_pcls:'Print ID badges',id_one:'Print ID card',id_repl:'Replace lost card',id_replq:'This card is lost or damaged. The old code will stop working. Reason (optional):',id_repld:'A new card is ready for the next print.',id_year:'School year [y]',
 e_photo_type:'This file is not a usable photo (JPEG, PNG or WebP).',e_photo_big:'This photo is too detailed to fit in 100 KB. Take it again in even light, or crop closer.',e_badge_empty:'No cards to print with these choices.',e_badge_many:'Too many cards at once. Print one class at a time.',e_badge_none:'This student has no card for this school year yet.'});
Object.assign(D.fr,{ph_choose:'Choisir une photo',ph_change:'Changer la photo',ph_rm:'Retirer la photo',ph_zoom:'Zoom',ph_hint:'Faites glisser la photo pour centrer le visage. Enregistrée en WebP, moins de 100 Ko.',ph_none:'Sans photo',ph_label:'Photo',
 id_btn:'Imprimer les cartes',id_h:'Imprimer les cartes d’élève',id_p:'Choisissez les classes dont vous voulez imprimer les cartes.',id_whole:'Toute l’école',id_stu:'[n] élèves',id_nophoto:'[n] sans photo',id_lay:'Disposition',id_l_sheet:'Feuilles A4, 10 cartes par page (recto verso, retourner sur le côté long)',id_l_card:'Une carte par page (imprimante de cartes)',id_onlynew:'Seulement les cartes pas encore imprimées',
 id_warn:'[n] élèves n’ont pas encore de photo ([x]…). Leur carte aura un cadre photo vide.',id_any:'Imprimer quand même',id_back:'Retour',id_go:'Imprimer',id_cancel:'Annuler',id_ready:'Fichier prêt : [n] cartes. Il s’est ouvert dans un nouvel onglet.',id_none:'Choisissez au moins une classe.',id_many:'Charger plusieurs photos',id_manyh:'Nommez chaque fichier avec le matricule de l’élève, par exemple 26-104.jpg, ou avec son nom complet.',
 id_up:'Envoi [a] sur [b]…',id_upd:'[n] photos ajoutées.',id_unm:'[n] fichiers ne correspondent à aucun élève : [x]',id_pcls:'Imprimer les cartes',id_one:'Imprimer la carte',id_repl:'Remplacer la carte perdue',id_replq:'Cette carte est perdue ou abîmée. L’ancien code cessera de fonctionner. Motif (facultatif) :',id_repld:'Une nouvelle carte est prête pour la prochaine impression.',id_year:'Année scolaire [y]',
 e_photo_type:'Ce fichier n’est pas une photo utilisable (JPEG, PNG ou WebP).',e_photo_big:'Cette photo est trop détaillée pour tenir en 100 Ko. Reprenez-la avec une lumière uniforme, ou cadrez plus près.',e_badge_empty:'Aucune carte à imprimer avec ces choix.',e_badge_many:'Trop de cartes à la fois. Imprimez une classe à la fois.',e_badge_none:'Cet élève n’a pas encore de carte pour cette année scolaire.'});
const idOk=()=>['principal','secretary'].includes(S.role),idF=(k,o)=>Object.entries(o).reduce((s,[a,b])=>s.replace('['+a+']',b),t(k));
// ---- photo widget: pick, drag and zoom a 3:4 frame, save 480x640 WebP
const PH={};
function phHtml(k,url){PH[k]={bm:null,dirty:false,rm:false,z:1,ox:0,oy:0,url:url||''};
 return `<div class=ph3 id=ph_${k}><div class=ph3f><canvas id=phc_${k} width=240 height=320 aria-label="${esc(t('ph_label'))}"></canvas><span class=ph3e id=phe_${k}>${fi('users',34)}<small>${t('ph_none')}</small></span></div>
 <div class=ph3c><input type=file id=phf_${k} accept="image/*" hidden onchange="phLoad('${k}',this.files[0])">
  <div class=ph3b><button type=button class=sb onclick="$('#phf_${k}').click()" id=phb_${k}>${fi('add',16)} ${t(url?'ph_change':'ph_choose')}</button><button type=button class="sb dng" id=phr_${k} onclick="phRemove('${k}')" ${url?'':'hidden'}>${fi('trash',16)} ${t('ph_rm')}</button></div>
  <label class=ph3z>${t('ph_zoom')} <input type=range id=phz_${k} min=1 max=3 step=.01 value=1 oninput="phZoom('${k}',+this.value)" disabled></label><small>${t('ph_hint')}</small></div></div>`}
async function phInit(k){const P=PH[k];if(!P||!P.url)return phDraw(k);try{const r=await fetch(P.url);if(!r.ok)return;P.bm=await createImageBitmap(await r.blob());phDraw(k)}catch{}}
function phDraw(k){const P=PH[k],c=$('#phc_'+k);if(!c)return;const x=c.getContext('2d'),W=c.width,H=c.height;x.fillStyle='#eef0f4';x.fillRect(0,0,W,H);
 $('#phe_'+k).hidden=!!P.bm;$('#phz_'+k).disabled=!P.bm;if(!P.bm)return;
 const k0=Math.max(W/P.bm.width,H/P.bm.height)*P.z,w=P.bm.width*k0,h=P.bm.height*k0;P.ox=Math.max(-(w-W)/2,Math.min((w-W)/2,P.ox));P.oy=Math.max(-(h-H)/2,Math.min((h-H)/2,P.oy));
 x.drawImage(P.bm,(W-w)/2+P.ox,(H-h)/2+P.oy,w,h);
 if(!c.dataset.on){c.dataset.on=1;let dn=null;c.style.touchAction='none';
  c.addEventListener('pointerdown',e=>{dn={x:e.clientX,y:e.clientY,ox:P.ox,oy:P.oy};c.setPointerCapture(e.pointerId)});
  c.addEventListener('pointermove',e=>{if(!dn||!P.bm)return;const f=c.width/c.getBoundingClientRect().width;P.ox=dn.ox+(e.clientX-dn.x)*f;P.oy=dn.oy+(e.clientY-dn.y)*f;P.dirty=true;phDraw(k)});
  c.addEventListener('pointerup',()=>dn=null)}}
const phZoom=(k,z)=>{PH[k].z=z;PH[k].dirty=true;phDraw(k)};
async function phLoad(k,f){if(!f)return;const P=PH[k];try{P.bm=await createImageBitmap(f,{imageOrientation:'from-image'})}catch{const e=$('#phE_'+k)||$('#se_e')||$('#res');if(e)e.textContent=em(400,'photo_type');return}
 P.z=1;P.ox=0;P.oy=0;P.dirty=true;P.rm=false;$('#phz_'+k).value=1;$('#phr_'+k).hidden=false;phDraw(k)}
function phRemove(k){const P=PH[k];P.bm=null;P.dirty=false;P.rm=!!P.url;$('#phr_'+k).hidden=true;phDraw(k)}
function phCanvas(k){const P=PH[k],c=document.createElement('canvas');c.width=480;c.height=640;const x=c.getContext('2d'),k0=Math.max(480/P.bm.width,640/P.bm.height)*P.z,w=P.bm.width*k0,h=P.bm.height*k0,f=2;
 x.fillStyle='#fff';x.fillRect(0,0,480,640);x.drawImage(P.bm,(480-w)/2+P.ox*f,(640-h)/2+P.oy*f,w,h);return c}
const phTb=(c,t,q)=>new Promise(ok=>c.toBlob(ok,t,q));
// One upload carries three images, all made here so the server never has to resize anything: the stored photo (WebP, max 100 KB), a JPEG for printing, a 96x128 thumbnail.
async function phBlob(k){const c=phCanvas(k);let main=null;
 for(const q of [.85,.75,.65,.55]){const b=await phTb(c,'image/webp',q);if(b&&b.type=='image/webp'&&b.size<=100*1024){main=b;break}}
 const pr=await phTb(c,'image/jpeg',.88);if(!main)main=pr;
 const s=document.createElement('canvas');s.width=96;s.height=128;s.getContext('2d').drawImage(c,0,0,96,128);let th=await phTb(s,'image/webp',.72);if(!th||th.type!='image/webp')th=await phTb(s,'image/jpeg',.75);
 const hd=new Uint8Array(16);hd.set([83,80,72,49]);const dv=new DataView(hd.buffer);dv.setUint32(4,main.size);dv.setUint32(8,pr.size);dv.setUint32(12,th.size);return new Blob([hd,main,pr,th])}
// save whatever changed for one student; returns an error code or null
async function phSave(k,id){const P=PH[k];if(!P)return null;
 if(P.rm&&!P.bm){const r=await api('students/'+id+'/photo/delete',{});return r.ok?null:r.d.error}
 if(!P.bm||!P.dirty)return null;const b=await phBlob(k),r=await fetch('/api/students/'+id+'/photo',{method:'POST',headers:{'content-type':'application/octet-stream'},body:b});return r.ok?null:(await r.json().catch(()=>({}))).error||'server'}
// ---- Print ID cards dialog: pick classes or the whole school
const ID={sel:new Set(),all:false,layout:'sheet',onlyNew:false,d:null};
async function idOpen(cid){const r=await api('idcards');if(!r.ok)return alert(em(r.s,r.d.error));ID.d=r.d;ID.all=!cid;ID.sel=new Set(cid?[+cid]:[]);idDraw()}
function idCounts(){const m={};for(const s of ID.d.students){const o=m[s.class_id]??={n:0,np:0};o.n++;if(!s.photo)o.np++}return m}
function idDraw(){const d=ID.d,cn=idCounts(),all=ID.all,tn=d.students.length,tp=d.students.filter(s=>!s.photo).length;
 const row=(id,name,o,on)=>`<label class="idr${on?' on':''}"><input type=checkbox ${on?'checked':''} onchange="${id==='all'?'idAll(this.checked)':`idTog(${id},this.checked)`}"><b>${esc(name)}</b><small>${idF('id_stu',{n:o.n})}${o.np?` · <i class=idw>${idF('id_nophoto',{n:o.np})}</i>`:''}</small></label>`;
 const h=`<div class=soh><div><h2>${t('id_h')}</h2><small>${t('id_p')} ${idF('id_year',{y:d.label})}</small></div><button type=button class=ib onclick="ovClose()" aria-label="${t('id_cancel')}">${fi('x',18)}</button></div>
 <div class=idl>${row('all',t('id_whole'),{n:tn,np:tp},all)}${d.classes.map(c=>row(c.id,c.name,cn[c.id]||{n:0,np:0},all||ID.sel.has(c.id))).join('')}</div>
 <label for=idly>${t('id_lay')}</label><select id=idly onchange="ID.layout=this.value"><option value=sheet ${ID.layout=='sheet'?'selected':''}>${t('id_l_sheet')}<option value=card ${ID.layout=='card'?'selected':''}>${t('id_l_card')}</select>
 <label class=ck><input type=checkbox ${ID.onlyNew?'checked':''} onchange="ID.onlyNew=this.checked"> ${t('id_onlynew')}</label>
 <div class=idm><button type=button class="sb sbs" onclick="$('#idmany').click()">${fi('add',16)} ${t('id_many')}</button><input type=file id=idmany accept="image/*" multiple hidden onchange="idMany(this.files)"><small>${t('id_manyh')}</small><div id=idmsg></div></div>
 <div id=idw></div><p class=err id=idE></p>
 <div class=ov-a><button type=button class=sb onclick="ovClose()">${t('id_cancel')}</button><button type=button id=idgo onclick="idGo()">${fi('print',18)} ${t('id_go')}</button></div>`;
 if($('.ovc')&&$('#idgo')){$('.ovc').innerHTML=h}else{ovOpen(h)}}
const idAll=on=>{ID.all=on;ID.sel=new Set();idDraw()},idTog=(id,on)=>{if(ID.all){ID.all=false;ID.sel=new Set(ID.d.classes.map(c=>c.id))}on?ID.sel.add(id):ID.sel.delete(id);idDraw()};
function idPicked(){return ID.d.students.filter(s=>ID.all||ID.sel.has(s.class_id))}
async function idGo(force){const rows=idPicked();if(!rows.length)return $('#idE').textContent=t('id_none');const miss=rows.filter(s=>!s.photo);
 if(miss.length&&!force){$('#idw').innerHTML=`<div class="box warn"><b>${idF('id_warn',{n:miss.length,x:esc(miss.slice(0,3).map(s=>s.name).join(', '))})}</b><div class=ov-a><button type=button class=sb onclick="$('#idw').innerHTML=''">${t('id_back')}</button><button type=button onclick="idGo(1)">${t('id_any')}</button></div></div>`;return $('#idw').scrollIntoView({block:'nearest'})}
 const b={layout:ID.layout,only_new:ID.onlyNew,allow_nophoto:true};if(ID.all)b.ids=rows.map(s=>s.id);else b.class_ids=[...ID.sel];
 $('#idgo').disabled=true;$('#idw').innerHTML='';const x=await fetch('/api/idcards/print',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b)});$('#idgo').disabled=false;
 if((x.headers.get('content-type')||'').includes('pdf')){const n=x.headers.get('x-badge-count'),u=URL.createObjectURL(await x.blob());window.open(u,'_blank');$('#idw').innerHTML=`<p class="box ok">${idF('id_ready',{n})}</p>`;return}
 const d=await x.json().catch(()=>({}));$('#idE').textContent=em(x.status,d.error)}
async function idMany(files){files=[...files];if(!files.length)return;const m=(await api('idcards/match',{names:files.map(f=>f.name)})).d.matches;let n=0,bad=[];const box=$('#idmsg');
 for(let i=0;i<m.length;i++){box.innerHTML=`<p class=hint>${idF('id_up',{a:i+1,b:m.length})}</p>`;if(m[i].none){bad.push(m[i].file);continue}
  try{const k='bulk';phHtml(k);PH[k].bm=await createImageBitmap(files[i],{imageOrientation:'from-image'});PH[k].dirty=true;const b=await phBlob(k),r=await fetch('/api/students/'+m[i].student_id+'/photo',{method:'POST',headers:{'content-type':'application/octet-stream'},body:b});r.ok?n++:bad.push(m[i].file)}catch{bad.push(m[i].file)}}
 const r=await api('idcards');if(r.ok)ID.d=r.d;idDraw();$('#idmsg').innerHTML=`<p class="box ok">${idF('id_upd',{n})}</p>${bad.length?`<p class="box warn">${idF('id_unm',{n:bad.length,x:esc(bad.slice(0,8).join(', '))+(bad.length>8?'…':'')})}</p>`:''}`}
// one student, from the student overlay
async function idOne(id){const x=await fetch('/api/idcards/print',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({ids:[id],layout:'card',allow_nophoto:true})});
 if((x.headers.get('content-type')||'').includes('pdf'))return window.open(URL.createObjectURL(await x.blob()),'_blank');const d=await x.json().catch(()=>({}));alert(em(x.status,d.error))}
async function idRepl(id){const why=prompt(t('id_replq'));if(why===null)return;const r=await api('idcards/replace',{student_id:id,reason:why});alert(r.ok?t('id_repld'):em(r.s,r.d.error))}
