// "Your data": the principal downloads a complete copy of the school's records as one ZIP:
// readable spreadsheets (CSV, open in Excel), a full machine-readable JSON, and all photos as files.
// No password hashes, no sessions. Limited to once every 30 seconds per school.
const{zipSync,strToU8}=require('fflate'),{db}=require('./db'),EX=require('./export'),BK=require('./backup');
const BOM='﻿',csv=(head,rows)=>BOM+[head,...rows].map(r=>r.map(v=>{v=v==null?'':String(v);return/[",\n\r;]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}).join(',')).join('\r\n')+'\r\n';
const safe=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^A-Za-z0-9._-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,60)||'x';
const last={};
function build(sid){const sc=db.prepare('SELECT * FROM schools WHERE id=?').get(sid),day=new Date().toISOString().slice(0,10),F={};
 const cls=Object.fromEntries(db.prepare('SELECT c.id,c.name,s.name section FROM classes c LEFT JOIN sections s ON s.id=c.section_id WHERE c.school_id=?').all(sid).map(c=>[c.id,c])),
  stu=db.prepare('SELECT * FROM students WHERE school_id=? ORDER BY class_id,name').all(sid),stuBy=Object.fromEntries(stu.map(s=>[s.id,s])),usr=db.prepare('SELECT * FROM users WHERE school_id=? ORDER BY name').all(sid),usrBy=Object.fromEntries(usr.map(u=>[u.id,u]));
 F['students.csv']=csv(['Matricule','Name','Sex','Date of birth','Class','Section','Guardian','Phone','Enrolled','Active'],stu.map(s=>[s.matricule,s.name,s.sex,s.dob,cls[s.class_id]?.name,cls[s.class_id]?.section,s.guardian,s.phone,s.enrolled,s.active?'yes':'no']));
 const subjBy=Object.fromEntries(db.prepare('SELECT id,name,class_id,coef,teacher_id FROM subjects WHERE school_id=?').all(sid).map(x=>[x.id,x]));
 F['staff.csv']=csv(['Name','Username','Role','Email','Phone','Active','Gate access'],usr.map(u=>[u.name,u.username,u.role,u.email,u.phone,u.active?'yes':'no',u.can_gate?'yes':'no']));
 F['subjects.csv']=csv(['Class','Subject','Coefficient','Teacher'],Object.values(subjBy).sort((a,b)=>(cls[a.class_id]?.name||'').localeCompare(cls[b.class_id]?.name||'')||a.name.localeCompare(b.name)).map(x=>[cls[x.class_id]?.name,x.name,x.coef,usrBy[x.teacher_id]?.name]));
 F['marks.csv']=csv(['Matricule','Student','Class','Subject','Sequence','Mark','Status'],db.prepare('SELECT student_id,subject_id,seq,value,status FROM marks WHERE school_id=? ORDER BY student_id,subject_id,seq').all(sid).map(m=>[stuBy[m.student_id]?.matricule,stuBy[m.student_id]?.name,cls[stuBy[m.student_id]?.class_id]?.name,subjBy[m.subject_id]?.name,m.seq,m.value,m.status]));
 F['report-cards.csv']=csv(['Matricule','Student','Class','Term','Average','Rank','Class size','Verification code'],db.prepare('SELECT * FROM cards WHERE school_id=? ORDER BY term,class_id,student_id').all(sid).map(c=>{let k={};try{k=JSON.parse(c.snap||'{}')}catch{}return[stuBy[c.student_id]?.matricule,stuBy[c.student_id]?.name,cls[c.class_id]?.name,c.term,k.avg==null?'':Math.round(k.avg*100)/100,k.rank,k.size,c.code]}));
 F['payments.csv']=csv(['Receipt','Date','Matricule','Student','Class','Amount (FCFA)','Method','Reference','Cancelled','Cancel reason'],db.prepare('SELECT * FROM payments WHERE school_id=? ORDER BY date,receipt').all(sid).map(p=>[String(p.receipt).padStart(5,'0'),p.date,stuBy[p.student_id]?.matricule,stuBy[p.student_id]?.name,cls[stuBy[p.student_id]?.class_id]?.name,p.amount,p.method,p.ref,p.void?'yes':'',p.void_reason]));
 F['teacher-attendance.csv']=csv(['Date','Teacher','Arrived','Left','Flag','Reason'],db.prepare('SELECT * FROM gate WHERE school_id=? ORDER BY date,in_at').all(sid).map(g=>[g.date,usrBy[g.user_id]?.name,(g.in_at||'').slice(11),(g.out_at||'').slice(11),g.flag,g.reason]));
 F['school.json']=JSON.stringify(EX.exportSchool(sid),null,1);
 const files={};let photos=0;
 for(const[n,v]of Object.entries(F))files['data/'+n]=[strToU8(v),{level:6}];
 const used=new Set();const name=(dir,base)=>{let n=dir+safe(base),i=1,k=n;while(used.has(k))k=n+'-'+(++i);used.add(k);return k+'.webp'};
 for(const p of db.prepare('SELECT student_id,jpg FROM student_photos WHERE school_id=?').all(sid)){const s=stuBy[p.student_id];if(!s)continue;files[name('photos/students/',s.matricule||('student-'+s.id))]=[new Uint8Array(p.jpg),{level:0}];photos++}
 for(const p of db.prepare('SELECT user_id,webp FROM staff_photos WHERE school_id=?').all(sid)){const u=usrBy[p.user_id];if(!u)continue;files[name('photos/staff/',u.username)]=[new Uint8Array(p.webp),{level:0}];photos++}
 files['README.txt']=[strToU8(`${sc.name}: complete copy of your school's data
Exported ${new Date().toISOString()}

data/*.csv       Spreadsheets. Open in Excel or Google Sheets (UTF-8).
data/school.json Everything the platform holds for your school, in one structured file (for moving to another system or restoring).
photos/          Student and staff photos (WebP), named by matricule / username.

Not included: passwords, sign-in sessions, and exam paper PDFs (they are deleted automatically two weeks after each exam).
Keep this file somewhere safe: it contains personal information about students and staff.
`),{level:6}];
 return{zip:Buffer.from(zipSync(files)),day,counts:{students:stu.length,staff:usr.length,photos}}}
module.exports=(app,{auth,E,audit,school})=>{
 const ADM=auth(['principal']),sid=req=>req.user.school_id;
 app.get('/api/mydata/info',ADM,(req,res)=>{const s=sid(req),n=t=>db.prepare(`SELECT COUNT(*) n FROM ${t} WHERE school_id=?`).get(s).n,l=db.prepare('SELECT at,ok FROM backups WHERE ok=1 ORDER BY id DESC LIMIT 1').get();
  res.json({students:db.prepare('SELECT COUNT(*) n FROM students WHERE school_id=? AND active=1').get(s).n,staff:db.prepare('SELECT COUNT(*) n FROM users WHERE school_id=? AND active=1').get(s).n,marks:n('marks'),payments:n('payments'),
   backup_at:l?l.at:null,last_download:db.prepare("SELECT at FROM audit WHERE school_id=? AND action='data.export' ORDER BY id DESC LIMIT 1").get(s)?.at||null})});
 app.get('/api/mydata/download',ADM,(req,res,next)=>{try{const s=sid(req);if(Date.now()-(last[s]||0)<3e4)return E(res,429,'many');last[s]=Date.now();
  const r=build(s),sc=school(req);audit(req.user,'data.export',`${r.counts.students} students, ${r.counts.staff} staff, ${r.counts.photos} photos, ${Math.round(r.zip.length/1024)} KB`);
  res.set({'Content-Type':'application/zip','Content-Disposition':`attachment; filename="${safe(sc.name)}-data-${r.day}.zip"`,'Cache-Control':'no-store','X-Data-Photos':String(r.counts.photos)});res.send(r.zip)}catch(e){next(e)}});
};
module.exports.build=build;
