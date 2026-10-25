// Small demo school (4 classes, 5 teachers) used by the automated tests: DEMO_SIZE=small node seed.js
const{db,tx,hash}=require('./db'),PW='12345678',CODE='DEMO01';
require('./seedlib').wipe(CODE);
let x=7;const rnd=()=>(x=(x*9301+49297)%233280)/233280;
tx(()=>{
 const sid=db.prepare('INSERT INTO schools(code,name,trial_ends,header,year,seq_plan) VALUES(?,?,?,?,?,?)').run(CODE,'Collège Bilingue Demo','2026-12-20','P.O. Box 123, Yaoundé · Tel +237 6 00 00 00 00','2026/2027','2,2,2').lastInsertRowid;
 const U=(u,n,r)=>db.prepare('INSERT INTO users(school_id,username,pw,name,role) VALUES(?,?,?,?,?)').run(sid,u,hash(PW),n,r).lastInsertRowid;
 U('principal','Mme. Nkeng Rose','principal');U('secretary','Mrs. Fon Agnes','secretary');U('surveillant','Mr. Ayuk Peter','surveillant');
 const T=[['tabe','Mr. Tabe Collins','Mathematics',4],['ngu','Mrs. Ngu Priscilla','English',4],['fotso','Mr. Fotso Bertrand','French',4],['eyong','Mr. Eyong Samuel','Physics',3],['tchoumi','Mrs. Tchoumi Aline','Biology',2]].map(([u,n,s,k])=>({id:U(u,n,'teacher'),s,k}));
 const names={'Form 3A':['Brenda Achu Ngwa','Esther Ghogomu Penda','Hervé Mbella Dongmo','Divine Tabi Kum','Clarisse Eyenga','Fabrice Chia','Grace Ikome','Joël Voundi','Kelly Defo','Lionel Bih','Mireille Tamo','Pascal Zang'],
  'Form 1A':['Aminatou Bello','Samuel Njoya','Prisca Mbah','Yannick Etoga','Lydie Fouda'],'Form 2A':['Carine Ndzi','Boris Tchinda','Sandra Ewane','Rodrigue Kamga','Ines Mveng'],'Form 4A':['Patience Atem','Dieudonné Essomba','Nadège Biyiha','Cedric Manga','Flora Nkwenti']};
 let n=0;const F=new Set(['Brenda','Esther','Divine','Clarisse','Grace','Kelly','Mireille','Aminatou','Prisca','Lydie','Carine','Sandra','Ines','Patience','Nadège','Flora']);
 for(const[cn,list]of Object.entries(names)){
  const cid=db.prepare('INSERT INTO classes(school_id,name) VALUES(?,?)').run(sid,cn).lastInsertRowid;if(cn=='Form 3A')db.prepare('UPDATE classes SET head_id=? WHERE id=?').run(T[0].id,cid);
  const subs=T.map(t=>({...t,id:db.prepare('INSERT INTO subjects(school_id,class_id,name,coef,teacher_id) VALUES(?,?,?,?,?)').run(sid,cid,t.s,t.k,t.id).lastInsertRowid}));
  for(const nm of list){n++;const st=db.prepare('INSERT INTO students(school_id,matricule,name,dob,sex,class_id,enrolled,guardian,phone) VALUES(?,?,?,?,?,?,?,?,?)')
    .run(sid,'26-'+String(n).padStart(4,'0'),nm,`${2008+Math.floor(rnd()*6)}-0${1+Math.floor(rnd()*9)}-1${Math.floor(rnd()*9)}`,F.has(nm.split(' ')[0])?'F':'M',cid,'2026-09-07','Parent of '+nm.split(' ')[0],'+237 6 00 00 00 '+String(10+n)).lastInsertRowid;
   for(const sq of['S1','S2','S3','S4'])for(const s of subs){if(sq=='S4'&&s.s=='Physics'&&cn=='Form 3A')continue; // Physics sheet of Form 3A not submitted for sequence 4
    if(nm=='Lydie Fouda'&&s.s=='Biology')continue; // does not study Biology: no mark at all, so it is not on her card
    if(nm=='Ines Mveng'&&(sq=='S1'||sq=='S2'))continue; // joined in Term 2: dashes before, and no Term 1 card
    db.prepare("INSERT INTO marks(school_id,student_id,subject_id,seq,value,status,updated) VALUES(?,?,?,?,?,?,?)").run(sid,st,s.id,sq,Math.round((5+rnd()*12)*2)/2,'submitted',new Date().toISOString())}}}
})();
db.exec("INSERT OR IGNORE INTO mark_sheets(school_id,subject_id,seq,at) SELECT school_id,subject_id,seq,MAX(updated) FROM marks GROUP BY subject_id,seq"); // every seeded sheet counts as submitted
const R=require('./report'),S0=db.prepare('SELECT id FROM schools WHERE code=?').get(CODE).id;for(const c of db.prepare('SELECT id FROM classes WHERE school_id=?').all(S0))R.publish(S0,c.id,1);

// ---- Phase 4 demo: timetable, rates, attendance history
const SC=require('./sched');
tx(()=>{
 db.prepare("UPDATE schools SET demo=1,demo_fake='2026-10-05T08:52',demo_real=? WHERE id=?").run(new Date().toISOString(),S0);
 SC.blocksOf(S0).forEach((b,i)=>db.prepare('INSERT INTO blocks(school_id,pos,kind,minutes,label) VALUES(?,?,?,?,?)').run(S0,i,b.kind,b.minutes,b.label));
 db.prepare("INSERT INTO closed(school_id,date,label) VALUES(?,?,?)").run(S0,'2026-09-25','Staff training day');
 const tch=db.prepare("SELECT id,username,name FROM users WHERE school_id=? AND role='teacher' ORDER BY id").all(S0),by=Object.fromEntries(tch.map(t=>[t.username,t.id]));
 const UN=[['fotso',5,7],['fotso',5,8],['tchoumi',3,1],['tchoumi',3,2]];for(const[u,d,p]of UN)db.prepare('INSERT INTO unavail(school_id,teacher_id,day,period) VALUES(?,?,?,?)').run(S0,by[u],d,p);
 const un=new Set(UN.map(([u,d,p])=>by[u]+':'+d+':'+p)),quota={Mathematics:6,English:6,French:6,Physics:4,Biology:3},cl=db.prepare('SELECT id FROM classes WHERE school_id=? ORDER BY id').all(S0),
  subs=Object.fromEntries(cl.map(c=>[c.id,db.prepare('SELECT id,name,teacher_id FROM subjects WHERE class_id=?').all(c.id).map(x=>({...x,left:quota[x.name]||3}))])),perDay={};
 for(let p=1;p<=8;p++)for(let d=1;d<=5;d++){const used=new Set();
  for(const c of cl){const ok=subs[c.id].filter(x=>x.left>0&&!used.has(x.teacher_id)&&!un.has(x.teacher_id+':'+d+':'+p)&&(perDay[c.id+':'+d+':'+x.id]||0)<2).sort((a,b)=>b.left-a.left||rnd()-.5);
   if(!ok.length||rnd()<.12)continue;const x=ok[0];x.left--;used.add(x.teacher_id);perDay[c.id+':'+d+':'+x.id]=(perDay[c.id+':'+d+':'+x.id]||0)+1;
   db.prepare('INSERT INTO slots(school_id,class_id,day,period,subject_id,teacher_id,from_date) VALUES(?,?,?,?,?,?,?)').run(S0,c.id,d,p,x.id,x.teacher_id,'2026-09-07')}}
 for(const b of db.prepare('SELECT id,name FROM subjects WHERE school_id=?').all(S0))db.prepare('INSERT OR IGNORE INTO gen_req(subject_id,school_id,per_week,max_day,doubles) VALUES(?,?,?,2,0)').run(b.id,S0,quota[b.name]||3);   // weekly periods for the timetable generator
 [1500,1500,1800,2000,1200].forEach((a,i)=>db.prepare('INSERT INTO rates(school_id,teacher_id,from_date,amount) VALUES(?,?,?,?)').run(S0,tch[i].id,'2026-09-01',a));
 db.prepare('INSERT INTO rates(school_id,teacher_id,from_date,amount) VALUES(?,?,?,?)').run(S0,by.tabe,'2026-10-01',1700);
 const lay=SC.layout(S0),today='2026-10-05',stamp=(d,m)=>d+'T'+SC.hh(m);let n=0;
 for(let d='2026-09-07';d<=today;d=SC.addDays(d,1)){SC.ensure(S0,d);const L=db.prepare('SELECT * FROM lessons WHERE school_id=? AND date=? ORDER BY period').all(S0,d);if(!L.length)continue;
  const isToday=d==today,absent=new Set(tch.filter(()=>!isToday&&rnd()<.04).map(t=>t.id)),taken=new Set(),came=new Set();
  if(isToday)absent.add(by.eyong); // Mr Eyong has not arrived yet today
  for(const l of L){const per=lay.periods[l.period-1];if(isToday&&per.end>SC.toMin('08:52'))continue;const U=(st,act,via,flag,reason,appr,at)=>db.prepare('UPDATE lessons SET status=?,actual_id=?,via=?,flag=?,reason=?,appr=?,at=? WHERE id=?').run(st,act,via,flag||null,reason||null,appr??null,at,l.id);
   if(!l.sched_id)continue;
   if(absent.has(l.sched_id)){if(isToday){continue}
    const free=tch.filter(t=>!absent.has(t.id)&&!taken.has(t.id+':'+l.period)&&!L.some(x=>x.period==l.period&&x.sched_id==t.id));
    if(rnd()<.5&&free.length){const f=free[Math.floor(rnd()*free.length)];taken.add(f.id+':'+l.period);came.add(f.id);U('replaced',f.id,'round',null,null,1,stamp(d,per.start+3))}else U('absent',null,'round',null,null,null,stamp(d,per.start+5));continue}
   came.add(l.sched_id);const r=rnd();
   if(r<.06)U('late',l.sched_id,'qr',null,null,null,stamp(d,per.start+28));else if(r<.08&&d>='2026-10-01'&&!isToday)continue;else U('present',l.sched_id,'qr',null,null,null,stamp(d,per.start+2+Math.floor(rnd()*6)))}
  for(const t of tch)if(!absent.has(t.id)&&(came.has(t.id)||L.some(l=>l.sched_id==t.id)))db.prepare('INSERT INTO gate(school_id,user_id,date,in_at,out_at,by_id) VALUES(?,?,?,?,?,?)').run(S0,t.id,d,stamp(d,SC.toMin('07:10')+Math.floor(rnd()*18)),isToday?null:stamp(d,14*60),by.tabe&&1)}
 // a few things for the principal to look at
 const pick=(w)=>db.prepare(`SELECT * FROM lessons WHERE school_id=? AND status='present' AND ${w} ORDER BY id LIMIT 1`).get(S0);
 const a=pick("date='2026-09-14'");if(a)db.prepare("UPDATE lessons SET flag='backfill',via='round',reason='Phone battery died, confirmed by the surveillant' WHERE id=?").run(a.id);
 const b=pick("date='2026-10-02'");if(b)db.prepare("UPDATE lessons SET spot=1,spot_res='notseen',flag='spot' WHERE id=?").run(b.id);
 const c=db.prepare("SELECT * FROM lessons WHERE school_id=? AND status='absent' AND date>='2026-10-01' ORDER BY id LIMIT 1").get(S0);
 if(c){const f=tch.find(t=>t.id!=c.sched_id&&!db.prepare('SELECT 1 FROM lessons WHERE date=? AND period=? AND (sched_id=? OR actual_id=?)').get(c.date,c.period,t.id,t.id));if(f)db.prepare("UPDATE lessons SET status='replaced',actual_id=?,appr=NULL,via='qr' WHERE id=?").run(f.id,c.id)}
})();

// ---- Phase 5 demo: fees
tx(()=>{
 const PL={'Form 1A':[40000,35000,35000],'Form 2A':[45000,40000,40000],'Form 3A':[50000,45000,45000],'Form 4A':[55000,50000,50000]},sec=db.prepare("SELECT id FROM users WHERE school_id=? AND username='secretary'").get(S0).id;
 for(const c of db.prepare('SELECT id,name FROM classes WHERE school_id=?').all(S0))PL[c.name].forEach((a,i)=>db.prepare('INSERT INTO fee_plan(school_id,class_id,term,amount) VALUES(?,?,?,?)').run(S0,c.id,i+1,a));
 const sts=db.prepare('SELECT s.id,s.class_id,c.name cls FROM students s JOIN classes c ON c.id=s.class_id WHERE s.school_id=? ORDER BY s.id').all(S0),pays=[];
 sts.forEach((s,k)=>{const t1=PL[s.cls][0],r=rnd(),d=n=>'2026-09-'+String(8+Math.floor(rnd()*n)).padStart(2,'0'),m=()=>['cash','cash','momo','om','bank'][Math.floor(rnd()*5)];
  if(r<.45){pays.push([s.id,t1/2,d(6),m()],[s.id,t1/2,'2026-09-'+String(16+Math.floor(rnd()*12)),m()])}
  else if(r<.65){pays.push([s.id,t1,d(10),m()],[s.id,Math.round(PL[s.cls][1]*.4/1000)*1000,'2026-10-02',m()])}
  else if(r<.85)pays.push([s.id,Math.round(t1*.4/1000)*1000,d(15),'cash'])});
 pays.sort((a,b)=>a[2].localeCompare(b[2])).forEach((p,i)=>db.prepare('INSERT INTO payments(school_id,student_id,amount,date,method,receipt,by_id,at) VALUES(?,?,?,?,?,?,?,?)').run(S0,p[0],p[1],p[2],p[3],i+1,sec,p[2]+'T10:00'));
 db.prepare('UPDATE students SET fee_discount=10000 WHERE id=?').run(sts[3].id);
 const v=db.prepare('SELECT id FROM payments WHERE school_id=? ORDER BY id LIMIT 1').get(S0);db.prepare("UPDATE payments SET void=1,void_reason='Entered twice by mistake',void_by=? WHERE id=?").run(sec,v.id);
})();
console.log(`Term 1 published for all classes; in Term 2, Form 3A has Physics marks not submitted (publishing it shows the “Publish anyway” warning).\nDemo school ready. School code: ${CODE} · password for all users: ${PW}\nDemo clock is set to Mon 5 Oct 2026, 08:52 (change it from the yellow bar).\nUsers: principal, secretary, surveillant, tabe, ngu, fotso, eyong, tchoumi`);
