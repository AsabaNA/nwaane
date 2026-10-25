// Phase 6d — installable app: service worker, install tip, offline notice. Loaded last.
Object.assign(D.en,{pw_t:'Install the app',pw_d:'Add School Platform to your home screen to open it like any other app.',pw_btn:'Install',pw_ios:'On iPhone: tap the Share button, then “Add to Home Screen”.',pw_no:'Not now',pw_off:'You are offline. You can look around, but changes cannot be saved until you reconnect.',au_start:'Start with your first term free. No card needed.'});
Object.assign(D.fr,{pw_t:'Installer l’application',pw_d:'Ajoutez School Platform à votre écran d’accueil pour l’ouvrir comme n’importe quelle application.',pw_btn:'Installer',pw_ios:'Sur iPhone : touchez le bouton Partager, puis « Sur l’écran d’accueil ».',pw_no:'Plus tard',pw_off:'Vous êtes hors ligne. Vous pouvez consulter, mais rien ne peut être enregistré avant la reconnexion.',au_start:'Commencez avec votre premier trimestre gratuit. Sans carte bancaire.'});
if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
let IP=null;addEventListener('beforeinstallprompt',e=>{e.preventDefault();IP=e});addEventListener('appinstalled',()=>{IP=null;document.querySelectorAll('.bn.pw').forEach(x=>x.remove())});
const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone;
const ios=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)&&!standalone();
const pls=(k,v)=>{try{return v===undefined?localStorage.getItem(k):localStorage.setItem(k,v)}catch{return null}};
function pwTip(){if(standalone()||pls('pwNo')||!(IP||ios())||!matchMedia('(max-width:900px)').matches)return'';
 return`<div class="bn pw noprint"><span class=bn-i>${fi('download',22)}</span><div><b>${t('pw_t')}</b><p>${IP?t('pw_d'):t('pw_ios')}</p></div>${IP?`<button type=button onclick="pwGo()">${t('pw_btn')}</button>`:''}<button type=button class=sb onclick="pls('pwNo',1);this.closest('.bn').remove()">${t('pw_no')}</button></div>`}
async function pwGo(){if(!IP)return;IP.prompt();await IP.userChoice;IP=null;document.querySelectorAll('.bn.pw').forEach(x=>x.remove())}
{const g=frGo;frGo=async function(f){await g(f);const m=$('#m');if(!m)return;m.querySelectorAll('.bn.pw').forEach(x=>x.remove());const h=pwTip();if(h&&!m.querySelector('.bn.sp'))m.insertAdjacentHTML('afterbegin',h)}}
// offline notice
function offl(){let b=$('#offl');if(navigator.onLine){b&&b.remove();return}if(!b){document.body.insertAdjacentHTML('beforeend',`<div id=offl role=status>${t('pw_off')}</div>`)}}
addEventListener('online',offl);addEventListener('offline',offl);offl();
// WhatsApp share of report-card verify links
Object.assign(FI,{send:'<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>'});
Object.assign(D.en,{wa_btn:'WhatsApp',wa_nonum:'No number',wa_none:'Add a guardian phone number to share by WhatsApp',wa_msg:'Hello[g], the term [t] report card for [s] at [sc] is ready. You can check that it is genuine here: [l]'});
Object.assign(D.fr,{wa_btn:'WhatsApp',wa_nonum:'Pas de numéro',wa_none:'Ajoutez le numéro du tuteur pour partager par WhatsApp',wa_msg:'Bonjour[g], le bulletin du trimestre [t] de [s] à [sc] est prêt. Vous pouvez vérifier son authenticité ici : [l]'});
// co-teachers per sequence
Object.assign(D.en,{seq_by:'Different teachers by sequence',seq_main:'Main teacher',seq_ro:'This sequence is entered by another teacher. You can see the marks but not change them.'});
Object.assign(D.fr,{seq_by:'Enseignants différents par séquence',seq_main:'Enseignant principal',seq_ro:'Cette séquence est saisie par un autre enseignant. Vous voyez les notes mais ne pouvez pas les modifier.'});
