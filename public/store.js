// Storefront behaviour: EN/FR switch (shares the app's "lang" choice), live prices, demo button, contact address.
(()=>{
const $$=s=>[...document.querySelectorAll(s)],FR=window.STORE_FR||{},orig=new Map(),origA=new WeakMap();
let L='en';try{L=localStorage.lang||((navigator.language||'').startsWith('fr')?'fr':'en')}catch{L=(navigator.language||'').startsWith('fr')?'fr':'en'}
function walk(root,fn){const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>/^(SCRIPT|STYLE)$/.test(n.parentNode.nodeName)||!n.nodeValue.trim()?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});let n;while(n=w.nextNode())fn(n)}
function apply(l){L=l;document.documentElement.lang=l;
 walk(document.body,n=>{if(!orig.has(n))orig.set(n,n.nodeValue);const o=orig.get(n),k=o.replace(/\s+/g,' ').trim();if(l=='fr'&&FR[k]!==undefined){n.nodeValue=o.replace(o.trim(),FR[k])}else n.nodeValue=o});
 $$('[alt],[title]').forEach(e=>{const m=origA.get(e)||{};origA.set(e,m);for(const a of['alt','title']){if(!e.hasAttribute(a))continue;if(m[a]===undefined)m[a]=e.getAttribute(a);e.setAttribute(a,l=='fr'&&FR[m[a]]?FR[m[a]]:m[a])}});
 const T='Meridian – Run your whole school from one place';document.title=l=='fr'?FR[T]:T;
 $$('.seg button').forEach(b=>b.classList.toggle('on',b.dataset.l==l));
 price()}
const fmt=n=>Number(n).toLocaleString(L=='fr'?'fr-FR':'en-US');
let PR=null;function price(){if(!PR)return;$$('[data-p]').forEach(e=>{const v=PR[e.dataset.p];if(v!=null)e.textContent=fmt(v)})}
$$('.seg button').forEach(b=>b.addEventListener('click',()=>{try{localStorage.lang=b.dataset.l}catch{}apply(b.dataset.l)}));
apply(L);
fetch('/api/prices').then(r=>r.ok?r.json():null).then(p=>{if(p){PR=p;price()}}).catch(()=>{});
fetch('/api/demo/status').then(r=>r.ok?r.json():null).then(d=>{if(d&&d.on)$$('[data-demo]').forEach(e=>e.hidden=false)}).catch(()=>{});
const ref=(new URLSearchParams(location.search).get('ref')||'').trim().toUpperCase().replace(/[^A-Z0-9_-]/g,'').slice(0,20);
if(ref)$$('a[href^="/app?signup"]').forEach(a=>a.setAttribute('href','/app?signup&ref='+ref));
const c=(window.STORE||{}).contact||'';
if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)&&!/REPLACE-ME/i.test(c)){const a=$('#contact-link'),m=document.getElementById('contact-mail'),ln=document.getElementById('contact-line');
 for(const e of[a,m]){if(e)e.href='mailto:'+c}if(a)a.hidden=false;if(m)m.textContent=c;if(ln)ln.hidden=false}
const icOk=()=>{const s=document.createElement('span');s.className='msr';s.style.cssText='position:absolute;visibility:hidden';s.textContent='rocket_launch';document.body.appendChild(s);const w=s.getBoundingClientRect().width;s.remove();return w<40};
const icChk=()=>{if(!icOk())document.documentElement.classList.add('noic')};
try{document.fonts.ready.then(()=>setTimeout(icChk,300))}catch{setTimeout(icChk,2500)}
addEventListener('load',()=>setTimeout(icChk,2500));
function $(s){return document.querySelector(s)}
})();
