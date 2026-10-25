// Exam submission: teachers (or the office, for any teacher) upload one PDF per exam. PDF only, 3 MB, kept until a while after the exam date.
const{db}=require('./db'),SC=require('./sched'),XT=require('./examtt'),express=require('./core/web'),ST=require('./core/storage'),{PDFDocument}=require('pdf-lib');
const MAXB=3*1024*1024,MAXPG=60,KEEP_AFTER=14,KEEP_NODATE=30,AHEAD=120;
const fp=(sid,id)=>'exams/'+sid+'/'+id+'.pdf';   // storage key (Node folder or R2 object, see core/storage.js)
const put=(sid,id,buf)=>ST.put(fp(sid,id),buf);
const del=(sid,id)=>ST.del(fp(sid,id)).catch(()=>{});
const today=sc=>SC.clock(sc).date;
// auto-delete: the file goes KEEP_AFTER days after the exam date (KEEP_NODATE days after upload when no date); the row stays as history
async function sweep(){const rows=db.prepare('SELECT id,school_id,date,up_at FROM exams WHERE has_file=1').all(),cache={};let n=0;
 for(const x of rows){const sc=cache[x.school_id]||(cache[x.school_id]=SC.school(x.school_id));if(!sc)continue;const t=today(sc),end=x.date?SC.addDays(x.date,KEEP_AFTER):SC.addDays(String(x.up_at||t).slice(0,10),KEEP_NODATE);
  if(t>end){await del(x.school_id,x.id);db.prepare('UPDATE exams SET has_file=0,bytes=0,expired_at=? WHERE id=?').run(new Date().toISOString(),x.id);n++}}
 // files whose row is gone or says "no file"
 try{const keep=new Set(db.prepare('SELECT school_id,id FROM exams WHERE has_file=1').all().map(r=>fp(r.school_id,r.id)));for(const f of await ST.list('exams/'))if(!keep.has(f.key))await ST.del(f.key).catch(()=>{})}catch{}
 return n}
module.exports=(app,{auth,E,audit,school})=>{
 const any=auth(['principal','secretary','teacher']),sid=req=>req.user.school_id,office=req=>req.user.role!='teacher';
 // module gate: the exam feature belongs to Report cards and Fees; a school with either has it
 const gate=(req,res,next)=>{const m=(school(req).modules||'reports,fees,tracking').split(',');m.includes('reports')||m.includes('fees')?next():E(res,403,'module')};
 // teachers: their own subjects (main teacher or a sequence override) or classes they head
 const mine=req=>office(req)?'':' AND (s.teacher_id='+(+req.user.id)+' OR c.head_id='+(+req.user.id)+' OR EXISTS(SELECT 1 FROM subject_teachers tt WHERE tt.subject_id=s.id AND tt.teacher_id='+(+req.user.id)+') OR EXISTS(SELECT 1 FROM subject_seq q WHERE q.subject_id=s.id AND q.teacher_id='+(+req.user.id)+'))';
 const subj=(req,id)=>db.prepare('SELECT s.id,s.name,s.class_id,s.teacher_id,c.name cls FROM subjects s JOIN classes c ON c.id=s.class_id WHERE s.school_id=? AND s.id=?'+mine(req)).get(sid(req),+id);
 const get=(req,id)=>db.prepare('SELECT e.* FROM exams e JOIN subjects s ON s.id=e.subject_id JOIN classes c ON c.id=s.class_id WHERE e.school_id=? AND e.id=?'+mine(req)).get(sid(req),+id);
 const isDate=v=>/^\d{4}-\d{2}-\d{2}$/.test(v)&&SC.isDate(v);
 const pDate=(req,v)=>{if(v==null||v==='')return{v:null};v=String(v);if(!isDate(v))return{e:'exam_date'};const t=today(school(req));if(v>SC.addDays(t,AHEAD))return{e:'exam_far'};return{v}};
 const pCopies=v=>{const n=Math.round(+v);return Number.isFinite(n)&&n>=1&&n<=2000?n:0};
 const used=(req,except=0)=>db.prepare('SELECT COALESCE(SUM(bytes),0) b FROM exams WHERE school_id=? AND has_file=1 AND id<>?').get(sid(req),except).b;
 const cap=req=>(school(req).exam_cap_mb??300)*1048576;
 const lead=req=>school(req).exam_lead??3;
 const row=(x,names,L=3)=>({deadline:x.date?XT.deadlineOf(x.school_id,L,x.date):'',tt_id:x.tt_id||null,id:x.id,subject_id:x.subject_id,class_id:x.class_id,cls:x.cls,subject:x.subject,teacher:x.teacher||'',title:x.title,date:x.date||'',date_locked:!!x.date_locked,copies:x.copies,students:x.students,has_file:!!x.has_file,bytes:x.bytes,pages:x.pages,up_at:x.up_at||'',up_by:x.upname||'',expired:!!x.expired_at,state:x.has_file?'ready':x.sib>0?'shared':x.expired_at?'expired':'missing',grp:x.grp||null});
 const Q=`SELECT e.*,s.name subject,c.name cls,u.name teacher,ub.name upname,(SELECT COUNT(*) FROM students st WHERE st.class_id=e.class_id AND st.active=1) students,(SELECT COUNT(*) FROM exams g WHERE e.grp IS NOT NULL AND g.grp=e.grp AND g.id<>e.id AND g.has_file=1) sib FROM exams e JOIN subjects s ON s.id=e.subject_id JOIN classes c ON c.id=s.class_id LEFT JOIN users u ON u.id=s.teacher_id LEFT JOIN users ub ON ub.id=e.up_by WHERE e.school_id=?`;
 app.get('/api/exams',any,gate,(req,res)=>{const list=db.prepare(Q+mine(req)+' ORDER BY (e.date IS NULL),e.date,c.name,s.name').all(sid(req)).map(x=>row(x,null,lead(req)));
  const o=db.prepare('SELECT s.id,s.name subject,c.name cls,c.id cid,u.name teacher,(SELECT COUNT(*) FROM students st WHERE st.class_id=c.id AND st.active=1) students FROM subjects s JOIN classes c ON c.id=s.class_id LEFT JOIN users u ON u.id=s.teacher_id WHERE s.school_id=?'+mine(req)+' ORDER BY c.name,s.name').all(sid(req));
  res.json({lead:lead(req),exams:list,options:o,office:office(req),used:used(req),cap:cap(req),max:MAXB,pages:MAXPG,ahead:AHEAD,keep:KEEP_AFTER})});
 // the teacher popup: exams of mine that still have no file and are close (or past)
 app.get('/api/exams/due',any,gate,(req,res)=>{const t=today(school(req)),lim=SC.addDays(t,7),L=lead(req);
  const d=db.prepare(Q+" AND e.has_file=0 AND e.expired_at IS NULL AND e.date IS NOT NULL"+mine(req)+' ORDER BY e.date').all(sid(req)).map(x=>row(x,null,L)).filter(x=>x.deadline<=lim&&x.state=='missing').map(x=>({...x,days:Math.round((Date.parse(x.deadline)-Date.parse(t))/864e5),exam_days:Math.round((Date.parse(x.date)-Date.parse(t))/864e5)}));
  res.json({due:d})});
 // school days between the deadline and the exam (0 = same day as the exam), set by the principal
 app.post('/api/exams-settings',auth(['principal']),(req,res)=>{const n=Math.round(+req.body.lead);if(!(n>=0&&n<=15))return E(res,400,'invalid');db.prepare('UPDATE schools SET exam_lead=? WHERE id=?').run(n,sid(req));audit(req.user,'exam.lead',String(n));res.json({ok:1,lead:n})});
 app.post('/api/exams',any,gate,(req,res)=>{const b=req.body||{},s=subj(req,b.subject_id);if(!s)return E(res,404,'exam_subject');
  const title=String(b.title||'').trim().slice(0,60);if(!title)return E(res,400,'exam_title');
  const d=pDate(req,b.date);if(d.e)return E(res,400,d.e);let cp=1;if(b.copies!=null&&b.copies!==''){cp=pCopies(b.copies);if(!cp)return E(res,400,'exam_copies')}
  else cp=Math.max(1,db.prepare('SELECT COUNT(*) n FROM students WHERE class_id=? AND active=1').get(s.class_id).n);
  const r=db.prepare('INSERT INTO exams(school_id,subject_id,class_id,title,date,date_locked,copies,created_by,created) VALUES(?,?,?,?,?,?,?,?,?)').run(sid(req),s.id,s.class_id,title,d.v,office(req)&&d.v?1:0,cp,req.user.id,new Date().toISOString());
  audit(req.user,'exam.create',title+' / '+s.cls+' / '+s.name);res.json({ok:1,id:Number(r.lastInsertRowid)})});
 app.post('/api/exams/:id',any,gate,(req,res)=>{const x=get(req,req.params.id);if(!x)return E(res,404,'exam_404');const b=req.body||{};let{title,date,date_locked,copies}=x;
  if(b.title!=null){title=String(b.title).trim().slice(0,60);if(!title)return E(res,400,'exam_title')}
  if(b.copies!=null){copies=pCopies(b.copies);if(!copies)return E(res,400,'exam_copies')}
  if('date' in b){if(!office(req)&&x.date_locked)return E(res,403,'exam_locked');const d=pDate(req,b.date);if(d.e)return E(res,400,d.e);date=d.v;date_locked=office(req)&&date?1:0}
  db.prepare('UPDATE exams SET title=?,date=?,date_locked=?,copies=? WHERE id=?').run(title,date,date_locked,copies,x.id);res.json({ok:1})});
 app.post('/api/exams/:id/file',any,gate,express.raw({type:()=>true,limit:'4mb'}),async(req,res)=>{const x=get(req,req.params.id);if(!x)return E(res,404,'exam_404');
  const buf=Buffer.isBuffer(req.body)?req.body:Buffer.alloc(0);if(!buf.length)return E(res,400,'exam_nofile');if(buf.length>MAXB)return E(res,413,'exam_big');
  if(buf.subarray(0,5).toString('latin1')!='%PDF-')return E(res,400,'exam_notpdf');
  let pages;try{const d=await PDFDocument.load(buf,{ignoreEncryption:false,updateMetadata:false});pages=d.getPageCount()}catch(e){return E(res,400,/encrypt/i.test(e.message)?'exam_enc':'exam_notpdf')}
  if(pages<1)return E(res,400,'exam_notpdf');if(pages>MAXPG)return E(res,400,'exam_pages');
  if(used(req,x.id)+buf.length>cap(req))return E(res,413,'exam_cap');
  await put(sid(req),x.id,buf);db.prepare('UPDATE exams SET has_file=1,bytes=?,pages=?,up_by=?,up_at=?,expired_at=NULL WHERE id=?').run(buf.length,pages,req.user.id,new Date().toISOString(),x.id);
  audit(req.user,'exam.upload',x.title+' / '+pages+'p');res.json({ok:1,pages,bytes:buf.length})});
 app.get('/api/exams/:id/file',any,gate,async(req,res)=>{const x=get(req,req.params.id);if(!x||!x.has_file)return E(res,404,'exam_404');
  let b;try{b=await ST.get(fp(sid(req),x.id))}catch{b=null}if(!b)return E(res,404,'exam_404');res.set({'Content-Type':'application/pdf','Content-Disposition':'inline; filename="exam-'+x.id+'.pdf"','Cache-Control':'private, no-store'});res.end(b)});
 app.delete('/api/exams/:id/file',any,gate,async(req,res)=>{const x=get(req,req.params.id);if(!x)return E(res,404,'exam_404');await del(sid(req),x.id);db.prepare('UPDATE exams SET has_file=0,bytes=0,pages=0,up_by=NULL,up_at=NULL WHERE id=?').run(x.id);res.json({ok:1})});
 app.delete('/api/exams/:id',any,gate,async(req,res)=>{const x=get(req,req.params.id);if(!x)return E(res,404,'exam_404');await del(sid(req),x.id);db.prepare('DELETE FROM exams WHERE id=?').run(x.id);audit(req.user,'exam.delete',x.title);res.json({ok:1})});
 sweep();require('./core/jobs').every('exam-sweep',36e5,sweep);
 app.post('/api/exams-sweep',auth(['principal']),async(req,res)=>res.json({ok:1,deleted:await sweep()}));   // used by tests and by the principal's own tidy-up
};
module.exports.sweep=sweep;
module.exports.fp=fp;
