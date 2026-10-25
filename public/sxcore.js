// Search engine: pure functions, no DOM, no network, no database. Runs in the browser and in Node (tests), and moves to Cloudflare unchanged.
// Typo tolerant (Damerau-Levenshtein), accent and case blind, word-order blind, sounds-alike folding for names, and bilingual synonym groups.
(function(root){
 const norm=s=>String(s==null?'':s).toLowerCase().replace(/œ/g,'oe').replace(/æ/g,'ae').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
 const toks=s=>{const n=norm(s);return n?n.split(' '):[]};
 // sounds-alike key: Tchoumi/Tchoumy, Phillip/Filip, Mackenzie/Makenzie, Ngu/Nghu ...
 const phon=w=>w.replace(/ph/g,'f').replace(/ck|qu|kh/g,'k').replace(/ou|w/g,'u').replace(/y/g,'i').replace(/h/g,'').replace(/(.)\1+/g,'$1');
 // Damerau-Levenshtein (adjacent swaps count as one slip), stops early above `max`
 function dl(a,b,max){const n=a.length,m=b.length;if(Math.abs(n-m)>max)return max+1;if(!n)return m;if(!m)return n;
  let p2=null,p1=Array.from({length:m+1},(_,j)=>j);
  for(let i=1;i<=n;i++){const c=[i];let lo=i;
   for(let j=1;j<=m;j++){let v=Math.min(p1[j]+1,c[j-1]+1,p1[j-1]+(a[i-1]==b[j-1]?0:1));
    if(i>1&&j>1&&a[i-1]==b[j-2]&&a[i-2]==b[j-1])v=Math.min(v,p2[j-2]+1);c[j]=v;if(v<lo)lo=v}
   if(lo>max)return max+1;p2=p1;p1=c}
  return p1[m]}
 const slip=len=>len<=3?0:len<=6?1:2;   // how many typos a word of this length may have
 // words that carry no meaning in a search ("how do I print the badges")
 const STOP=new Set(norm('a an the of to for my me i we you do does how where what want need can find show open go see get is are in on at and or un une le la les de du des mon ma mes pour comment ou je veux voir aller ouvrir trouver afficher est sont et au aux dans sur').split(' '));
 // groups of words that mean the same thing in the app, English and French. Applied to the query only.
 const SYN=[
  'pay payment payments paiement paiements payer paye versement verser reglement regler recu receipt receipts',
  'fee fees frais scolarite owe owing owes doit solde balance arrears impaye impayes',
  'student students pupil pupils eleve eleves apprenant enfant enfants',
  'teacher teachers enseignant enseignants professeur professeurs prof profs maitre instituteur',
  'staff personnel employe employes',
  'class classes classe salle',
  'print printing imprimer impression imprime pdf',
  'badge badges card cards carte cartes id',
  'report reports bulletin bulletins',
  'mark marks note notes grade grades',
  'timetable timetables schedule emploi temps horaire planning',
  'exam exams examen examens epreuve epreuves composition sequence',
  'attendance presence presences absent absence appel',
  'hours heures paie pay payroll salary salaire',
  'download telecharger export exporter backup sauvegarde data donnees',
  'setting settings parametre parametres reglage reglages config configuration',
  'add new create ajouter nouveau nouvelle creer inscrire register inscription enregistrer',
  'photo photos picture image',
  'subject subjects matiere matieres cours',
  'term trimestre',
  'scan scanner qr code',
  'lang language langue',
  'delete remove supprimer retirer effacer',
  'edit modify change modifier changer'].map(g=>g.split(' '));
 const SYNOF=new Map();for(const g of SYN)for(const w of g){const a=SYNOF.get(w)||new Set();for(const x of g)if(x!=w)a.add(x);SYNOF.set(w,a)}
 // best score (0..1) of one query word against one entry word
 function wordScore(q,w,qp,wp){
  if(q==w)return 1;
  if(w.startsWith(q))return q.length>=2?.92-Math.min(.12,(w.length-q.length)*.012):.55;
  const k=slip(q.length);
  if(k){let d=dl(q,w,k);if(d<=k)return .78-.14*d;
   const pre=w.slice(0,q.length);if(pre.length>=3){d=dl(q,pre,k);if(d<=k)return .72-.14*d}   // typo made while still typing the word
   if(q.length>=5&&w.length>q.length){const pre2=w.slice(0,q.length+1);d=dl(q,pre2,k);if(d<=k)return .66-.12*d}}
  if(qp.length>=3&&wp&&(qp==wp||wp.startsWith(qp)))return qp==wp?.76:.66;
  if(q.length>=4&&w.includes(q))return .5;
  return 0}
 const PREF={page:12,control:10,class:4,subject:3,staff:2,student:0};
 // entries: {kind,id,f:[[weight,text],...],data}. prepare() tokenises once.
 function prepare(entries){return entries.map(e=>{const f=e.f.map(([w,text])=>{const t=toks(text);return{w,t,p:t.map(phon),full:t.join(' ')}});return{...e,F:f}})}
 function parse(q){let t=toks(q);const keep=t.filter(x=>!STOP.has(x));t=keep.length?keep:t;return t.slice(0,6)}
 function score(e,qt,qp,alts,loose){let total=0,fields=new Set(),exact=0,miss=0;
  for(let i=0;i<qt.length;i++){let best=0,bf=-1;
   for(let fi=0;fi<e.F.length;fi++){const F=e.F[fi];
    for(let j=0;j<F.t.length;j++){let s=wordScore(qt[i],F.t[j],qp[i],F.p[j]);
     if(s<.9&&alts[i])for(const a of alts[i]){const s2=a==F.t[j]?.9:(a.length>=3&&F.t[j].startsWith(a))?.8:0;if(s2>s)s=s2}
     const v=s*(.55+.45*Math.min(1,F.w/10));if(v>best){best=v;bf=fi}}}
   if(best<.3){if(loose&&++miss<=1&&qt.length>=2)continue;return 0}total+=best;fields.add(bf);if(best>=.9)exact++}
  if(miss&&!total)return 0;let s=miss?total/(qt.length-miss)*.7:total/qt.length;
  if(qt.length>1&&fields.size==1)s+=.08;            // every word found in the same field (a full name, a label)
  if(exact==qt.length)s+=.1;
  for(const F of e.F){if(F.full==qt.join(' '))s+=.15}  // the whole field equals what was typed
  if(fields.size==1){const F=e.F[[...fields][0]];if(F)s-=Math.min(.12,Math.max(0,F.t.length-qt.length)*.008)}   // among equals, the shorter label wins
  return s}
 // → [{e, s}] best first. kinds: optional array to restrict. limit per call.
 function search(index,q,o={}){const qt=parse(q);if(!qt.length||qt.join('').length<2)return[];const qp=qt.map(phon),alts=qt.map(w=>{const a=SYNOF.get(w);return a?[...a]:null});
  let out=[];
  for(let pass=0;pass<2&&!out.length;pass++){if(pass&&qt.length<2)break;out=[];
   for(const e of index){if(o.kinds&&!o.kinds.includes(e.kind))continue;const s=score(e,qt,qp,alts,pass==1);if(s>=.3)out.push({e,s:s+(PREF[e.kind]||0)*.004})}}
  out.sort((a,b)=>b.s-a.s||String(a.e.f[0][1]).localeCompare(String(b.e.f[0][1])));
  if(out.length&&out[0].s>=.9){const cut=out[0].s*.55;out=out.filter(x=>x.s>=cut)}   // a clear hit hides the weak maybes
  return o.limit?out.slice(0,o.limit):out}
 const api={norm,toks,phon,dl,prepare,search,parse,SYN,STOP};
 if(typeof module!='undefined'&&module.exports)module.exports=api;else root.SX=api;
})(typeof window!='undefined'?window:globalThis);
