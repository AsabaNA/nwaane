// Teacher report cards (performance profile). Principal only, complete package only, informational: no score, no ranking between teachers, no link to pay.
// Results are judged relative to the same students' other subjects, so a teacher with a weak class is not marked down for it.
const {db}=require('./db'),R=require('./report'),SC=require('./sched'),B=require('./billing'),{PDFDocument,pipe}=require('./core/pdfkit'),HEAD=require('./head');
const ALL=['reports','fees','tracking'],mods=sid=>(db.prepare('SELECT modules FROM schools WHERE id=?').get(sid).modules||'reports,fees,tracking').split(',');
const r1=x=>x==null?null:Math.round(x*10)/10,mean=a=>{a=a.filter(x=>x!=null);return a.length?a.reduce((s,x)=>s+x,0)/a.length:null};
const band=l=>l==null?null:l>=1?'above':l<=-1?'below':'inline';
function range(sc,period,year){const T=B.termsOf(sc,year),today=SC.clock(sc).date,p=period=='year'?null:+period;
 const from=p?T[p-1].start:T[0].start,end=p?T[p-1].end:T[2].end;return{from,to:end<today?end:today,full_to:end,terms:p?[p]:[1,2,3],today,started:from<=today}}
const teacherOf=(sid,id)=>db.prepare("SELECT id,name FROM users WHERE id=? AND school_id=? AND role='teacher' AND active=1").get(+id||0,sid);
function results(sid,tid,terms){const subs=db.prepare('SELECT s.id,s.name,s.class_id,c.name cls FROM subjects s JOIN classes c ON c.id=s.class_id WHERE s.school_id=? AND (s.teacher_id=? OR EXISTS(SELECT 1 FROM subject_seq q WHERE q.subject_id=s.id AND q.teacher_id=?)) ORDER BY c.name,s.name').all(sid,tid,tid),cache={};
 const comp=(cid,t)=>cache[cid+':'+t]??=R.compute(sid,cid,t);
 return subs.map(s=>{const per={},trend={};let n=0;
  for(const t of terms){const d=comp(s.class_id,t),diffs=[],seqCols=[];
   for(const st of d.students){const row=st.rows.find(r=>r.sid==s.id);if(!row||row.avg==null)continue;const oth=st.rows.filter(r=>r.sid!=s.id&&r.avg!=null);if(oth.length<2)continue;
    const k=oth.reduce((a,r)=>a+r.coef,0);if(!k)continue;diffs.push(row.avg-oth.reduce((a,r)=>a+r.avg*r.coef,0)/k)}
   const rows=d.students.map(st=>st.rows.find(r=>r.sid==s.id)).filter(Boolean),len=Math.max(0,...rows.map(r=>r.marks.length));
   for(let i=0;i<len;i++){const v=rows.map(r=>r.marks[i]).filter(x=>x!=null);seqCols.push(v.length?r1(mean(v)):null)}
   if(diffs.length){per[t]=r1(mean(diffs));n=Math.max(n,diffs.length)}trend[t]=seqCols}
  const ls=Object.values(per),lift=ls.length?r1(mean(ls)):null;
  return{subject:s.name,class:s.cls,students:n,lift,band:band(lift),by_term:per,trend,low_confidence:n>0&&n<8}})}
function duties(sid,tid,sc,r){const {from,to,today}=r,out={};if(!r.started)return null;
 // make sure lesson rows exist for the period (same path the hours page uses)
 for(let ym=from.slice(0,7);ym<=to.slice(0,7);ym=SC.addDays(ym+'-28',5).slice(0,7))try{SC.monthSummary(sid,ym)}catch{}
 const q=(sql,...p)=>db.prepare(sql).get(...p),L='FROM lessons WHERE school_id=? AND date BETWEEN ? AND ?';
 const sch=q(`SELECT COUNT(*) n,COALESCE(SUM(status='present'),0) pr,COALESCE(SUM(status='late'),0) la,COALESCE(SUM(status='absent'),0) ab,COALESCE(SUM(status='replaced' AND appr=1),0) rep,COALESCE(SUM(status='pending' AND date<?),0) unc ${L} AND sched_id=? AND status!='suspended'`,today,sid,from,to,tid);
 const cov=q(`SELECT COUNT(*) n ${L} AND actual_id=? AND COALESCE(sched_id,0)!=? AND status='replaced' AND appr=1`,sid,from,to,tid,tid).n;
 const held=q(`SELECT COUNT(*) n,COALESCE(SUM(summary IS NOT NULL AND TRIM(summary)!=''),0) sm ${L} AND status IN('present','late') AND COALESCE(actual_id,sched_id)=?`,sid,from,to,tid);
 out.lessons={scheduled:sch.n,present:sch.pr,late:sch.la,absent:sch.ab,replaced_out:sch.rep,unconfirmed:sch.unc,covered_for_others:cov,held:held.n,with_summary:held.sm};
 // marks submitted
 const mk=[],pubs=Object.fromEntries(db.prepare('SELECT class_id,term,at FROM publications WHERE school_id=?').all(sid).map(p=>[p.class_id+':'+p.term,p.at])),seqs=R.seqs(sc).filter(s=>r.terms.includes(s.term));
 let exp=0,sub=0,late=0;
 for(const s of db.prepare('SELECT s.id,s.class_id FROM subjects s WHERE s.school_id=? AND (s.teacher_id=? OR EXISTS(SELECT 1 FROM subject_seq q WHERE q.subject_id=s.id AND q.teacher_id=?))').all(sid,tid,tid))
  for(const sq of seqs){const has=q('SELECT COUNT(*) n FROM marks WHERE subject_id=? AND seq=?',s.id,sq.id).n,ms=q('SELECT at FROM mark_sheets WHERE subject_id=? AND seq=?',s.id,sq.id);if(!has&&!ms)continue;exp++;
   if(ms){sub++;const pb=pubs[s.class_id+':'+sq.term];if(pb&&ms.at&&ms.at>pb)late++}}
 out.marks={expected:exp,submitted:sub,after_publishing:late,missing:exp-sub};
 // roll calls
 const mode=sc.roll_mode||'off';
 if(mode=='lesson'){const x=q(`SELECT COUNT(*) n FROM lessons l WHERE l.school_id=? AND l.date BETWEEN ? AND ? AND l.status IN('present','late') AND COALESCE(l.actual_id,l.sched_id)=? AND EXISTS(SELECT 1 FROM roll_calls c WHERE c.class_id=l.class_id AND c.date=l.date AND c.period=l.period AND c.taken_by=?)`,sid,from,to,tid,tid).n;out.roll={mode,expected:held.n,taken:x}}
 else if(mode=='head'){out.roll={mode,expected:null,taken:q('SELECT COUNT(*) n FROM roll_calls WHERE school_id=? AND date BETWEEN ? AND ? AND taken_by=?',sid,from,to,tid).n}}
 else out.roll=null;
 // invigilation
 const iv=q(`SELECT COUNT(*) n,COALESCE(SUM(i.status='confirmed'),0) ok,COALESCE(SUM(i.status='absent'),0) ab,COALESCE(SUM(i.status IS NULL AND p.date<?),0) missed FROM exam_inv i JOIN exam_paper p ON p.id=i.paper_id JOIN exam_tt t ON t.id=p.tt_id WHERE t.school_id=? AND t.published=1 AND i.teacher_id=? AND p.date BETWEEN ? AND ?`,today,sid,tid,from,to);
 out.invigilation={assigned:iv.n,confirmed:iv.ok,absent:iv.ab,missed:iv.missed};
 // gate
 const lim=(sc.day_start||'07:30').split(':').map(Number),limMin=lim[0]*60+lim[1]+15,gs=db.prepare('SELECT in_at,flag FROM gate WHERE school_id=? AND user_id=? AND date BETWEEN ? AND ?').all(sid,tid,from,to);
 const mins=g=>{const s=String(g.in_at||'').slice(11,16);return s?(+s.slice(0,2))*60+(+s.slice(3,5)):null};
 out.gate={days:gs.filter(g=>g.in_at).length,on_time:gs.filter(g=>g.in_at&&mins(g)!=null&&mins(g)<=limMin).length,early_departures:gs.filter(g=>g.flag=='early').length,backfilled:gs.filter(g=>g.flag=='backfill').length,limit:String(Math.floor(limMin/60)).padStart(2,'0')+':'+String(limMin%60).padStart(2,'0')};
 return out}
function profile(sid,tid,period,year){const sc=SC.school(sid),t=teacherOf(sid,tid);if(!t)return null;const r=range(sc,period,year);
 return{teacher:t.name,id:t.id,period,year,from:r.from,to:r.to,terms:r.terms,started:r.started,results:r.started?results(sid,tid,r.terms):[],duties:duties(sid,tid,sc,r)}}
const T={en:{t:'Teacher report',sub:'Informational profile for the principal. It is not a score and is not linked to pay.',res:'Students\' results, relative to their other subjects',res_p:'How this subject\'s average compares with the same students\' average in their other subjects (points out of 20). A weak class does not count against the teacher; only a subject that lags behind the same students\' others does.',cls:'Class',subj:'Subject',n:'Students',lift:'Relative',trend:'Class average per sequence',above:'Above their other subjects',inline:'In line with their other subjects',below:'Below their other subjects',low:'few students: take with care',none:'No marks yet',
  duty:'Presence and duties',les:'Lessons',les1:'Scheduled',les2:'Present',les3:'Late',les4:'Absent',les5:'Replaced',les6:'Not confirmed',les7:'Covered for colleagues',les8:'Lessons with a "what was taught" summary',mk:'Marks',mk1:'Sequence sheets submitted',mk2:'Submitted after the report cards were published',mk3:'Not submitted',rl:'Roll calls',rl1:'Roll calls taken',rl2:'of lessons held',inv:'Exam invigilation',inv1:'Assigned',inv2:'Confirmed',inv3:'Missed',gt:'Gate',gt1:'Days at the gate',gt2:'Arrived by',gt3:'Early departures',gt4:'Back-filled entries',term:'Term',year:'Year',gen:'Printed',notyet:'This period has not started.',of:'of'},
 fr:{t:'Bilan de l’enseignant',sub:'Profil informatif pour le chef d’établissement. Ce n’est pas une note et il n’est pas lié à la paie.',res:'Résultats des élèves, relatifs à leurs autres matières',res_p:'Compare la moyenne de cette matière à la moyenne des mêmes élèves dans leurs autres matières (points sur 20). Une classe faible ne pénalise pas l’enseignant ; seule une matière en retard sur les autres matières des mêmes élèves est signalée.',cls:'Classe',subj:'Matière',n:'Élèves',lift:'Relatif',trend:'Moyenne de la classe par séquence',above:'Au-dessus de leurs autres matières',inline:'Comparable à leurs autres matières',below:'En dessous de leurs autres matières',low:'peu d’élèves : à nuancer',none:'Pas encore de notes',
  duty:'Présence et obligations',les:'Cours',les1:'Prévus',les2:'Présent',les3:'En retard',les4:'Absent',les5:'Remplacé',les6:'Non confirmés',les7:'Assurés pour des collègues',les8:'Cours avec un résumé « ce qui a été enseigné »',mk:'Notes',mk1:'Feuilles de séquence remises',mk2:'Remises après la publication des bulletins',mk3:'Non remises',rl:'Appels',rl1:'Appels faits',rl2:'des cours donnés',inv:'Surveillance d’examen',inv1:'Affectées',inv2:'Confirmées',inv3:'Manquées',gt:'Portail',gt1:'Jours au portail',gt2:'Arrivé avant',gt3:'Départs anticipés',gt4:'Entrées régularisées',term:'Trimestre',year:'Année',gen:'Imprimé',notyet:'Cette période n’a pas commencé.',of:'sur'}};
async function pdf(res,sc,p,lang){const l=T[lang]||T.en;res.setHeader('Content-Type','application/pdf');res.setHeader('Content-Disposition',`attachment; filename="teacher-report-${p.id}-${p.period}.pdf"`);
 const doc=new PDFDocument({size:'A4',margin:40});pipe(doc,res);const h=HEAD(sc);doc.fillColor('#000').font('Helvetica-Bold').fontSize(13).text(h[0],40,30,{align:'center',width:515});doc.font('Helvetica').fontSize(9);for(const x of h.slice(1,3))doc.text(x,{align:'center',width:515});
 doc.moveDown(.6).font('Helvetica-Bold').fontSize(16).text(`${l.t} · ${p.teacher}`,{align:'center',width:515});doc.font('Helvetica').fontSize(10).fillColor('#444').text(`${p.period=='year'?l.year+' '+p.year+'/'+(p.year+1):l.term+' '+p.period+' · '+p.year+'/'+(p.year+1)} · ${p.from} – ${p.to}`,{align:'center',width:515}).text(l.sub,{align:'center',width:515}).fillColor('#000');
 const sec=x=>{if(doc.y>740)doc.addPage();doc.moveDown(.8).font('Helvetica-Bold').fontSize(12).text(x,40,doc.y,{width:515});doc.moveTo(40,doc.y+1).lineTo(555,doc.y+1).strokeColor('#999').stroke().strokeColor('#000');doc.moveDown(.3).font('Helvetica').fontSize(10)};
 const kv=(a,b)=>{if(doc.y>760)doc.addPage();const y=doc.y;doc.text(a,50,y,{width:400});doc.text(String(b),450,y,{width:100,align:'right'})};
 if(!p.started){doc.moveDown().text(l.notyet);doc.end();return}
 sec(l.res);doc.fontSize(8.5).fillColor('#444').text(l.res_p,40,doc.y,{width:515}).fillColor('#000').fontSize(10).moveDown(.3);
 if(!p.results.length)doc.text(l.none);
 for(const r of p.results){if(doc.y>740)doc.addPage();const y=doc.y;doc.font('Helvetica-Bold').text(`${r.subject} · ${r.class}`,50,y,{width:300}).font('Helvetica');
  doc.text(r.lift==null?l.none:`${r.lift>0?'+':''}${r.lift}`,300,y,{width:255,align:'right'});if(r.lift!=null)doc.fontSize(8.5).fillColor('#444').text(`${l[r.band]}${r.low_confidence?' - '+l.low:''}`,50,doc.y,{width:500}).fillColor('#000').fontSize(10);
  const tr=Object.entries(r.trend).map(([t,a])=>(p.terms.length>1?'T'+t+': ':'')+a.map(v=>v==null?'-':v).join(', ')).join('   ');if(tr&&r.lift!=null)doc.fontSize(8.5).fillColor('#555').text(`${l.trend}: ${tr}`,50,doc.y,{width:500}).fillColor('#000').fontSize(10);doc.moveDown(.3)}
 const d=p.duties;sec(l.duty);
 doc.font('Helvetica-Bold').text(l.les,50);doc.font('Helvetica');kv(l.les1,d.lessons.scheduled);kv(l.les2,d.lessons.present);kv(l.les3,d.lessons.late);kv(l.les4,d.lessons.absent);kv(l.les5,d.lessons.replaced_out);kv(l.les6,d.lessons.unconfirmed);kv(l.les7,d.lessons.covered_for_others);kv(l.les8,`${d.lessons.with_summary} ${l.of} ${d.lessons.held}`);
 doc.moveDown(.4).font('Helvetica-Bold').text(l.mk,50);doc.font('Helvetica');kv(l.mk1,`${d.marks.submitted} ${l.of} ${d.marks.expected}`);kv(l.mk2,d.marks.after_publishing);kv(l.mk3,d.marks.missing);
 if(d.roll){doc.moveDown(.4).font('Helvetica-Bold').text(l.rl,50);doc.font('Helvetica');kv(l.rl1,d.roll.expected!=null?`${d.roll.taken} ${l.of} ${d.roll.expected} ${l.rl2}`:d.roll.taken)}
 doc.moveDown(.4).font('Helvetica-Bold').text(l.inv,50);doc.font('Helvetica');kv(l.inv1,d.invigilation.assigned);kv(l.inv2,d.invigilation.confirmed);kv(l.inv3,d.invigilation.missed);
 doc.moveDown(.4).font('Helvetica-Bold').text(l.gt,50);doc.font('Helvetica');kv(l.gt1,d.gate.days);kv(`${l.gt2} ${d.gate.limit}`,`${d.gate.on_time} ${l.of} ${d.gate.days}`);kv(l.gt3,d.gate.early_departures);kv(l.gt4,d.gate.backfilled);
 doc.fontSize(8).fillColor('#777').text(`${l.gen} ${p.to}`,40,790,{width:515,align:'right'});doc.end()}
module.exports=(app,{auth,E,audit,school})=>{
 const ADM=auth(['principal']),sid=r=>r.user.school_id;
 const gate=(req,res)=>{if(ALL.some(m=>!mods(sid(req)).includes(m))){E(res,403,'module');return null}return 1};
 const per=req=>{const p=String(req.query.period||'').trim(),sc=SC.school(sid(req)),y=+req.query.year||B.schoolYear(SC.clock(sc).date);return[['1','2','3','year'].includes(p)?p:String(SC.clock(sc).date?curTerm(sc):1),y]};
 const curTerm=sc=>{const d=SC.clock(sc).date,T=B.termsOf(sc,B.schoolYear(d));const i=T.findIndex(t=>d<=t.end);return String(i<0?3:i+1)};
 app.get('/api/tprofile/list',ADM,(req,res)=>{if(!gate(req,res))return;const s=sid(req);res.json({year:B.schoolYear(SC.clock(SC.school(s)).date),current:curTerm(SC.school(s)),teachers:db.prepare("SELECT u.id,u.name,(SELECT COUNT(DISTINCT s.id) FROM subjects s WHERE s.teacher_id=u.id) subjects,(SELECT GROUP_CONCAT(DISTINCT COALESCE(c.short,c.name)) FROM subjects s JOIN classes c ON c.id=s.class_id WHERE s.teacher_id=u.id) classes FROM users u WHERE u.school_id=? AND u.role='teacher' AND u.active=1 ORDER BY u.name").all(s)})});
 app.get('/api/tprofile/:id',ADM,(req,res)=>{if(!gate(req,res))return;const [p,y]=per(req),x=profile(sid(req),req.params.id,p,y);if(!x)return E(res,404,'invalid');audit(req.user,'tprofile.view',x.teacher);res.json(x)});
 app.get('/api/tprofile/:id/pdf',ADM,async(req,res,next)=>{try{if(!gate(req,res))return;const [p,y]=per(req),x=profile(sid(req),req.params.id,p,y);if(!x)return E(res,404,'invalid');audit(req.user,'tprofile.print',x.teacher);await pdf(res,SC.school(sid(req)),x,req.query.lang=='fr'?'fr':'en')}catch(e){next(e)}})};
module.exports.profile=profile;
