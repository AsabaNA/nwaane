// Averages, ranks, publishing. Sequence avg = Σ(mark×coef)/Σ(coef of marked subjects);
// term avg = mean of that term's sequence avgs; annual (term 3) = mean of the 3 term avgs.
const{db,tx,code}=require('./db');
const seqs=s=>{const out=[];let n=0;(s.seq_plan||'2,2,2').split(',').map(Number).forEach((k,i)=>{for(let j=0;j<k;j++)out.push({id:'S'+(++n),n,term:i+1})});return out};
const isLocked=(cid,term)=>!!db.prepare('SELECT 1 FROM publications WHERE class_id=? AND term=?').get(cid,term);
const mean=a=>{a=a.filter(x=>x!=null);return a.length?a.reduce((x,y)=>x+y)/a.length:null};
// Which subjects a student has is read from their marks, not from the class list:
//  - a subject is on the card of a term when the student has at least one mark in it during that term (Term 3, the annual card: during the year);
//  - a blank in a sequence is a dash and the subject then does not count in that sequence's average (seqAvg only counts marked subjects);
//  - a student gets a card for a term only if they have at least one mark in that term (`has`); ranks, class size and class statistics are
//    computed among those students.
// Term 3 is the annual card: per subject the three term averages (T1, T2, T3) and their mean (the annual average); the student's annual
// average is Σ(annual average × coef) / Σ coef over their subjects; rank and class statistics are those of the annual average.
function compute(sid,cid,term){
 const sc=db.prepare('SELECT * FROM schools WHERE id=?').get(sid),all=seqs(sc),
 subs=db.prepare('SELECT id,name,coef FROM subjects WHERE class_id=? AND school_id=? ORDER BY id').all(cid,sid),
 tn=Object.fromEntries(db.prepare("SELECT s.id,u.name FROM subjects s JOIN users u ON u.id=s.teacher_id WHERE s.class_id=?").all(cid).map(x=>[x.id,x.name])),
 sts=db.prepare('SELECT id,name,matricule,sex FROM students WHERE class_id=? AND school_id=? AND active=1 ORDER BY name').all(cid,sid),M={};
 for(const m of db.prepare('SELECT student_id,subject_id,seq,value FROM marks WHERE school_id=? AND subject_id IN(SELECT id FROM subjects WHERE class_id=?)').all(sid,cid))M[m.student_id+':'+m.subject_id+':'+m.seq]=m.value;
 const annual=term==3,mine=all.filter(q=>q.term==term),inTerm=tm=>all.filter(q=>q.term==tm),get=(st,sj,q)=>M[st+':'+sj+':'+q.id]??null,
 seqAvg=(st,q)=>{let a=0,c=0;for(const s of subs){const v=get(st,s.id,q);if(v!=null){a+=v*s.coef;c+=s.coef}}return c?a/c:null},
 tAvg=(st,tm)=>mean(inTerm(tm).map(q=>seqAvg(st,q))),
 subjTerm=(st,sj,tm)=>mean(inTerm(tm).map(q=>get(st,sj,q)));
 const out=sts.map(st=>{
  const has=mine.some(q=>subs.some(s=>get(st.id,s.id,q)!=null));
  const rows=subs.filter(s=>(annual?all:mine).some(q=>get(st.id,s.id,q)!=null)).map(s=>{
   const marks=mine.map(q=>get(st.id,s.id,q)),base={sid:s.id,subject:s.name,coef:s.coef,teacher:tn[s.id]||'',marks};
   if(!annual)return{...base,cells:marks,avg:mean(marks)};
   const cells=[1,2,3].map(tm=>subjTerm(st.id,s.id,tm));return{...base,cells,avg:mean(cells)}});
  const termAvg=tAvg(st.id,term),ann=annual?(()=>{const r=rows.filter(x=>x.avg!=null),k=r.reduce((a,x)=>a+x.coef,0);return k?r.reduce((a,x)=>a+x.avg*x.coef,0)/k:null})():null;
  return{...st,has,rows,nsub:rows.length,termAvg,annual:ann,head:annual?ann:termAvg}});
 const el=out.filter(o=>o.has);
 out.forEach(s=>{s.rank=s.has&&s.head!=null?el.filter(o=>o.head!=null&&o.head>s.head).length+1:null});
 // rank inside each subject, among the students who have an average in it
 const bySubj={};el.forEach(o=>o.rows.forEach(r=>{if(r.avg!=null)(bySubj[r.sid]??=[]).push(r.avg)}));
 out.forEach(o=>o.rows.forEach(r=>{const l=bySubj[r.sid]||[];r.rank=o.has&&r.avg!=null?l.filter(v=>v>r.avg).length+1:null;r.of=l.length}));
 const ta=el.map(o=>o.head).filter(v=>v!=null),stats={avg:mean(ta),high:ta.length?Math.max(...ta):null,low:ta.length?Math.min(...ta):null};
 return{school:sc,annual,seqs:mine,stats,students:out,size:el.length,subjects:subs.length}}
const cc=()=>'RC-'+code().slice(0,4)+'-'+code().slice(0,4);
// Publishing locks the term and gives a card (with a verification code) to every student who has marks in it. Students who registered later,
// or have no marks in the term, get no card for it; they get theirs when a later term they have marks in is published.
function publish(sid,cid,term){const c=compute(sid,cid,term),els=c.students.filter(s=>s.has);if(!els.length)return'nomarks';
 tx(()=>{db.prepare('INSERT INTO publications(school_id,class_id,term,at) VALUES(?,?,?,?)').run(sid,cid,term,new Date().toISOString());
  for(const s of els)db.prepare('INSERT OR IGNORE INTO cards(code,school_id,student_id,class_id,term,snap) VALUES(?,?,?,?,?,?)').run(cc(),sid,s.id,cid,term,JSON.stringify({avg:s.head,rank:s.rank,size:c.size,annual:s.annual}))})();return'ok'}
// Marks sheets (subject x sequence of the term) the teacher has not submitted yet, grouped by the teacher responsible:
// [{teacher,phone,items:[{subject,seqs:[n,…]}]}]. upTo limits it to the sequences up to number n (sequences already under way).
function pending(sid,cid,term,upTo){const qs=seqs(db.prepare('SELECT * FROM schools WHERE id=?').get(sid)).filter(q=>q.term==term&&(upTo==null||q.n<=upTo)),
 subs=db.prepare('SELECT s.id,s.name,s.teacher_id,u.name tname,u.phone tphone FROM subjects s LEFT JOIN users u ON u.id=s.teacher_id WHERE s.class_id=? AND s.school_id=? ORDER BY s.id').all(cid,sid),
 done=new Set(db.prepare('SELECT subject_id||\':\'||seq k FROM mark_sheets WHERE school_id=?').all(sid).map(r=>r.k)),
 ov=Object.fromEntries(db.prepare('SELECT q.subject_id||\':\'||q.seq k,u.name,u.phone FROM subject_seq q JOIN users u ON u.id=q.teacher_id WHERE q.subject_id IN(SELECT id FROM subjects WHERE class_id=?)').all(cid).map(r=>[r.k,r])),g=new Map();
 for(const s of subs)for(const q of qs){if(done.has(s.id+':'+q.id))continue;const o=ov[s.id+':'+q.id],who=o?o.name:s.tname||'',ph=o?o.phone:s.tphone||'',k=who+'|'+ph;
  const e=g.get(k)||g.set(k,{teacher:who,phone:ph||'',items:[]}).get(k);let it=e.items.find(x=>x.subject==s.name);if(!it)e.items.push(it={subject:s.name,seqs:[]});it.seqs.push(q.n)}
 return[...g.values()]}
// avg per student for a basis ('S3' = one sequence, 'T2' = a term); subjectId => that subject's mark only
function averages(sid,cid,basis,subjectId){const all=seqs(db.prepare('SELECT * FROM schools WHERE id=?').get(sid)),
 qs=basis[0]=='T'?all.filter(q=>q.term==+basis.slice(1)):all.filter(q=>q.id==basis);if(!qs.length)return{};
 const subs=subjectId?db.prepare('SELECT id,coef FROM subjects WHERE id=?').all(subjectId):db.prepare('SELECT id,coef FROM subjects WHERE class_id=? AND school_id=?').all(cid,sid);if(!subs.length)return{};
 const coef=Object.fromEntries(subs.map(s=>[s.id,subjectId?1:s.coef])),M={};
 for(const m of db.prepare(`SELECT student_id,subject_id,seq,value FROM marks WHERE subject_id IN(${subs.map(s=>s.id).join(',')}) AND seq IN(${qs.map(q=>"'"+q.id+"'").join(',')})`).all())((M[m.student_id]??={})[m.seq]??=[]).push([m.value,coef[m.subject_id]]);
 const out={};for(const st in M)out[st]=mean(qs.map(q=>{const a=M[st][q.id];if(!a)return null;let n=0,d=0;for(const[v,c]of a){n+=v*c;d+=c}return n/d}));return out}
// default basis: latest sequence with marks; if its term is published (for all classes asked) -> that term's average
function defaultBasis(sid,cids,subjectId){const all=seqs(db.prepare('SELECT * FROM schools WHERE id=?').get(sid));if(!cids.length&&!subjectId)return'S1';
 const probe=subjectId?'SELECT 1 FROM marks WHERE subject_id=? AND seq=? LIMIT 1':`SELECT 1 FROM subjects s JOIN marks m ON m.subject_id=s.id AND m.seq=? WHERE s.class_id IN(${cids.join(',')}) LIMIT 1`;
 for(const q of[...all].reverse())if(subjectId?db.prepare(probe).get(subjectId,q.id):db.prepare(probe).get(q.id))return cids.length&&cids.every(c=>isLocked(c,q.term))?'T'+q.term:q.id;return'S1'}
const okBasis=(sid,b)=>/^T[123]$/.test(b)||seqs(db.prepare('SELECT * FROM schools WHERE id=?').get(sid)).some(q=>q.id==b);
// ---- honour roll (optional, per school). A student earns the highest level whose minimum average they reach, provided they also meet the
// optional extra rules: a place within the top N of the class, and no subject average below a given mark. The average is the term average
// (the annual average in Term 3). Names are the school's own text; a blank name falls back to a default in the card language.
const HRDEF={en:'Honour roll',fr:'Tableau d’honneur',both:'Honour roll / Tableau d’honneur'};
function hrTiers(sc){let t=[];try{t=JSON.parse(sc.hr_tiers||'[]')}catch{}return(Array.isArray(t)?t:[]).filter(x=>x&&Number.isFinite(+x.min)&&+x.min>=0&&+x.min<=20).map(x=>({min:+x.min,name:String(x.name||'').trim().slice(0,30)})).sort((a,b)=>b.min-a.min).slice(0,3)}
function honour(sc,s,lang='both'){if(!sc.hr_on||!s.has||s.head==null)return null;const T=hrTiers(sc);if(!T.length)return null;
 if(sc.hr_top>0&&!(s.rank&&s.rank<=sc.hr_top))return null;
 if(sc.hr_nofail>0&&s.rows.some(r=>r.avg!=null&&r.avg<sc.hr_nofail))return null;
 const i=T.findIndex(x=>s.head>=x.min);if(i<0)return null;return{level:i+1,of:T.length,min:T[i].min,name:T[i].name||HRDEF[lang]||HRDEF.both}}
module.exports={hrTiers,honour,HRDEF,seqs,isLocked,compute,publish,pending,averages,defaultBasis,okBasis};
