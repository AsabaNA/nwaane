// Full demo school: Anglophone section (Form 1 - Upper Sixth) and Francophone section (6ème - Terminale),
// 50+ students per class, 28+ teachers per section, subjects as taught in Cameroonian secondary schools.
// Timetable: built with the timetable generator.  Re-running resets the demo school only.
const{db,tx,hash}=require('./db'),L=require('./seedlib'),SC=require('./sched'),G=require('./ttgen'),R=require('./report'),PW='12345678',CODE='DEMO01';
L.wipe(CODE);
let _s=20261005;const rnd=()=>{_s=(_s+0x6D2B79F5)|0;let t=Math.imul(_s^(_s>>>15),1|_s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296};
const gauss=()=>Math.sqrt(-2*Math.log(1-rnd()))*Math.cos(2*Math.PI*rnd()),pick=a=>a[Math.floor(rnd()*a.length)],fold=s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z]/g,'');

// ---------- subjects per class: [name, periods per week, coefficient, teacher pool]
const AF12=[['English Language',5,4,'eng'],['Literature in English',3,3,'lit'],['French',4,3,'fre'],['Mathematics',5,4,'math'],['Integrated Science',4,3,'bio'],['History',2,2,'his'],['Geography',2,2,'geo'],['Citizenship Education',2,1,'cit'],['Religious Studies',1,1,'rel'],['Computer Science',2,2,'cs'],['Home Economics',2,1,'hec'],['Physical Education',2,1,'pe']];
const AF3=[['English Language',4,4,'eng'],['Literature in English',2,3,'lit'],['French',3,3,'fre'],['Mathematics',5,4,'math'],['Physics',3,3,'phy'],['Chemistry',3,3,'che'],['Biology',3,3,'bio'],['History',2,2,'his'],['Geography',2,2,'geo'],['Economics',2,2,'eco'],['Citizenship Education',1,1,'cit'],['Computer Science',2,2,'cs'],['Religious Studies',1,1,'rel'],['Physical Education',1,1,'pe']];
const AF45=[['English Language',4,4,'eng'],['Literature in English',2,3,'lit'],['French',3,3,'fre'],['Mathematics',4,4,'math'],['Additional Mathematics',2,2,'math'],['Physics',3,3,'phy'],['Chemistry',3,3,'che'],['Biology',3,3,'bio'],['History',2,2,'his'],['Geography',2,2,'geo'],['Economics',2,2,'eco'],['Computer Science',2,2,'cs'],['Citizenship Education',1,1,'cit'],['Physical Education',1,1,'pe']];
const A6S=[['Pure Mathematics',5,5,'math'],['Further Mathematics',3,3,'math'],['Physics',5,5,'phy'],['Chemistry',5,5,'che'],['Biology',5,5,'bio'],['Computer Science',3,3,'cs'],['General Paper',2,2,'eng'],['Physical Education',1,1,'pe']];
const A6A=[['Literature in English',5,5,'lit'],['History',5,5,'his'],['Geography',5,5,'geo'],['Economics',5,5,'eco'],['Philosophy',3,3,'phi'],['French',3,3,'fre'],['Religious Studies',3,2,'rel'],['General Paper',2,2,'eng'],['Physical Education',1,1,'pe']];
const F6=[['Français',5,4,'fr'],['Anglais',4,3,'an'],['Mathématiques',4,4,'ma'],['Histoire',2,2,'hi'],['Géographie',2,2,'ge'],['ECM',2,2,'ecm'],['SVT',2,2,'svt'],['PCT',3,3,'pc'],['Informatique',1,1,'info'],['EPS',2,1,'eps'],['Éducation Artistique',1,1,'art'],['ESF',1,1,'esf']];
const F5=F6.map(s=>s[0]=='ESF'?['ESF',2,1,'esf']:s);
const F4=[['Français',4,4,'fr'],['Anglais',4,3,'an'],['Mathématiques',4,4,'ma'],['Histoire',2,2,'hi'],['Géographie',2,2,'ge'],['ECM',1,2,'ecm'],['SVT',2,2,'svt'],['PCT',3,3,'pc'],['Informatique',1,1,'info'],['EPS',2,1,'eps'],['Espagnol',2,2,'esp'],['Éducation Artistique',1,1,'art'],['ESF',1,1,'esf']];
const F3=[['Français',4,4,'fr'],['Anglais',4,3,'an'],['Mathématiques',4,4,'ma'],['Histoire',2,2,'hi'],['Géographie',2,2,'ge'],['ECM',1,2,'ecm'],['SVT',2,2,'svt'],['Physique',2,2,'pc'],['Chimie',2,2,'pc'],['Informatique',1,1,'info'],['EPS',2,1,'eps'],['Allemand',2,2,'all'],['Éducation Artistique',1,1,'art']];
const F2A=[['Français',4,4,'fr'],['Anglais',3,3,'an'],['Philosophie',2,2,'phi'],['Histoire',2,2,'hi'],['Géographie',2,2,'ge'],['Mathématiques',3,3,'ma'],['SVT',2,2,'svt'],['Sciences Physiques',2,2,'pc'],['Espagnol',3,3,'esp'],['ECM',1,1,'ecm'],['Informatique',1,1,'info'],['EPS',2,1,'eps']];
const F2C=[['Français',3,3,'fr'],['Anglais',3,3,'an'],['Mathématiques',6,5,'ma'],['Physique',3,4,'pc'],['Chimie',2,3,'pc'],['SVT',2,2,'svt'],['Histoire',2,2,'hi'],['Géographie',2,2,'ge'],['ECM',1,1,'ecm'],['Informatique',2,2,'info'],['EPS',2,1,'eps']];
const FA=ph=>[['Français',4,4,'fr'],['Philosophie',ph,4,'phi'],['Histoire',2,3,'hi'],['Géographie',2,3,'ge'],['Anglais',3,3,'an'],['Espagnol',3,3,'esp'],['Mathématiques',2,2,'ma'],['SVT',2,2,'svt'],['EPS',2,1,'eps'],['Informatique',1,1,'info'],['ECM',1,1,'ecm']];
const FC=(m,p,c,ph,an)=>[['Mathématiques',m,5,'ma'],['Physique',p,4,'pc'],['Chimie',c,4,'pc'],['SVT',2,2,'svt'],['Français',3,2,'fr'],['Anglais',an,2,'an'],['Philosophie',ph,2,'phi'],['Histoire',1,1,'hi'],['Géographie',1,1,'ge'],['EPS',2,1,'eps'],['Informatique',2,1,'info']];
const FD=(sv,ph,an)=>[['Mathématiques',5,4,'ma'],['Physique',3,3,'pc'],['Chimie',3,3,'pc'],['SVT',sv,5,'svt'],['Français',3,2,'fr'],['Anglais',an,2,'an'],['Philosophie',ph,2,'phi'],['Histoire',1,1,'hi'],['Géographie',1,1,'ge'],['EPS',2,1,'eps'],['Informatique',1,1,'info']];
// [name, section, subjects, level (age), term-1 fee]
const CLASSES=[['Form 1','A',AF12,0,50000],['Form 2','A',AF12,1,50000],['Form 3','A',AF3,2,55000],['Form 4','A',AF45,3,55000],['Form 5','A',AF45,4,60000],['Lower Sixth Arts','A',A6A,5,70000],['Lower Sixth Science','A',A6S,5,75000],['Upper Sixth Arts','A',A6A,6,70000],['Upper Sixth Science','A',A6S,6,75000],
 ['6ème','F',F6,0,45000],['5ème','F',F5,1,45000],['4ème','F',F4,2,50000],['3ème','F',F3,3,55000],['2nde A','F',F2A,4,60000],['2nde C','F',F2C,4,65000],['1ère A4','F',FA(3),5,65000],['1ère C','F',FC(7,4,3,2,3),5,70000],['1ère D','F',FD(5,2,3),5,70000],['Tle A4','F',FA(4),6,65000],['Tle C','F',FC(8,5,3,3,2),6,70000],['Tle D','F',FD(6,3,2),6,70000]];

// ---------- teachers: [pool, display name]  (surname first, as in the original demo)
const AT=[['math','Mr. Tabe Collins','tabe'],['math','Mrs. Ayuk Beatrice'],['math','Mr. Njong Emmanuel'],['eng','Mrs. Ngu Priscilla','ngu'],['eng','Mr. Ashu Terence'],['eng','Mrs. Mbong Linda'],['lit','Mr. Fonyuy Gideon'],['lit','Mrs. Achu Veronica'],
 ['fre','Mme. Ndzi Solange'],['fre','Mr. Kouam Désiré'],['phy','Mr. Eyong Samuel','eyong'],['phy','Mr. Takang Roland'],['che','Mrs. Mbah Cynthia'],['che','Mr. Tanyi Raymond'],['bio','Mrs. Njie Florence'],['bio','Mr. Besong Alfred'],
 ['his','Mr. Akwa Julius'],['his','Mrs. Etta Regina'],['geo','Mr. Ewane Clifford'],['geo','Mrs. Manyi Joyce'],['cit','Mr. Sama Elvis'],['rel','Mr. Tabot Samson'],['eco','Mr. Nkwain Pius'],['eco','Mrs. Fomba Rita'],['cs','Mr. Ndifor Kelvin'],['pe','Mr. Mukete Benedict'],['hec','Mrs. Enow Julie'],['phi','Mr. Atabong Cletus']];
const FT=[['fr','Mr. Fotso Bertrand','fotso'],['fr','Mme. Nguimfack Odette'],['fr','M. Mballa Hubert'],['an','Mme. Tchoua Jeanne'],['an','M. Essama Pascal'],['an','Mme. Ondoa Carine'],['ma','M. Kamdem Joseph'],['ma','Mme. Nono Estelle'],['ma','M. Bekolo Serge'],['ma','M. Fokou Armand'],
 ['hi','M. Mvondo Gaston'],['hi','Mme. Abena Thérèse'],['ge','M. Ebogo Fidèle'],['ge','Mme. Zambo Cécile'],['ecm','M. Owona Blaise'],['svt','Mrs. Tchoumi Aline','tchoumi'],['svt','M. Ngono Victor'],['svt','Mme. Biloa Pauline'],
 ['pc','M. Tchakounté Alain'],['pc','Mme. Kenfack Sylvie'],['pc','M. Etoundi Lucien'],['phi','M. Manga Rodrigue'],['phi','Mme. Sanda Rachel'],['info','M. Djoumessi Patrick'],['eps','M. Ateba Roger'],['eps','Mme. Bella Chantal'],['esf','Mme. Mbarga Esther'],['art','M. Nkoulou Didier'],['esp','Mme. Ndongo Isabelle'],['all','M. Eboutou Franck']];

// ---------- student names
const NA={F:['Brenda','Esther','Divine','Clarisse','Grace','Kelly','Mireille','Patience','Flora','Blessing','Precious','Cynthia','Vanessa','Ursula','Joy','Linda','Sandra','Beatrice','Rita','Juliet','Pauline','Mercy','Gladys','Natasha','Edith','Faith','Hope','Nelly','Tracy','Lilian'],
 M:['Samuel','Collins','Emmanuel','Terence','Elvis','Kelvin','Raymond','Clifford','Ivo','Neba','Tanyi','Bernard','Derick','Fidelis','Gabriel','Ignatius','Julius','Leonard','Moses','Nixon','Wilfred','Walter','Aloysius','Ernest','Randy','Brandon','Ferdinand','Hilary','Innocent','Roland'],
 S:['Achu','Ngwa','Tabi','Kum','Chia','Ikome','Bih','Atem','Nkwenti','Fonyuy','Ashu','Mbong','Ayuk','Takang','Besong','Etta','Manyi','Sama','Tabot','Nkwain','Fomba','Ndifor','Mukete','Enow','Atabong','Njong','Mbah','Njie','Akwa','Ewane','Ebot','Nchang','Ndip','Oben','Agbor','Bessem','Neba','Awah','Fru','Tamfu','Che','Fon','Nji','Njoh','Tebug','Mbuh','Anye','Ndum','Mofor','Lobe']};
const NF={F:['Aminatou','Carine','Ines','Nadège','Mireille','Lydie','Prisca','Sandra','Esther','Audrey','Christelle','Danielle','Estelle','Flore','Gaëlle','Huguette','Joëlle','Larissa','Mélanie','Nicole','Océane','Pauline','Rosine','Sylvie','Tatiana','Vanessa','Yvette','Aïcha','Fatimatou','Ornella'],
 M:['Hervé','Joël','Fabrice','Pascal','Lionel','Boris','Rodrigue','Yannick','Dieudonné','Cédric','Alain','Brice','Christian','Donald','Éric','Franck','Guy','Hugues','Ivan','Jean-Pierre','Kevin','Landry','Martial','Nelson','Olivier','Patrick','Régis','Serge','Thierry','Valentin'],
 S:['Mbella','Dongmo','Voundi','Defo','Tamo','Zang','Njoya','Etoga','Fouda','Ndzi','Tchinda','Ewane','Kamga','Mveng','Essomba','Biyiha','Manga','Mballa','Essama','Ondoa','Kamdem','Nono','Bekolo','Fokou','Mvondo','Abena','Ebogo','Zambo','Owona','Ngono','Biloa','Kenfack','Etoundi','Sanda','Djoumessi','Ateba','Bella','Nkoulou','Atangana','Onana','Ndongo','Mbarga','Tagne','Nana','Wouambo','Simo','Talla','Kouam','Feudjio','Noubissi','Tsafack','Kemajou','Nguemo','Fomekong']};

tx(()=>{
 const H=hash(PW);   // one hash for every demo user: same password, and seeding stays fast
 const sid=db.prepare('INSERT INTO schools(code,name,trial_ends,header,year,seq_plan) VALUES(?,?,?,?,?,?)').run(CODE,'Collège Bilingue Demo','2026-12-20','P.O. Box 123, Yaoundé · Tel +237 6 00 00 00 00','2026/2027','2,2,2').lastInsertRowid;
 const secA=db.prepare('INSERT INTO sections(school_id,name,pos) VALUES(?,?,0)').run(sid,'Anglophone').lastInsertRowid,secF=db.prepare('INSERT INTO sections(school_id,name,pos) VALUES(?,?,1)').run(sid,'Francophone').lastInsertRowid;
 const U=(u,n,r)=>db.prepare('INSERT INTO users(school_id,username,pw,name,role) VALUES(?,?,?,?,?)').run(sid,u,H,n,r).lastInsertRowid;
 U('principal','Mme. Nkeng Rose','principal');U('secretary','Mrs. Fon Agnes','secretary');U('surveillant','Mr. Ayuk Peter','surveillant');
 const used=new Set(['principal','secretary','surveillant']),pools={};
 for(const[sec,list]of[[secA,AT],[secF,FT]])for(const[pool,name,uname]of list){
  let u=uname||fold(name.split(' ')[1]);while(used.has(u))u+='2';used.add(u);
  const id=U(u,name,'teacher');db.prepare('INSERT INTO user_sections(user_id,section_id) VALUES(?,?)').run(id,sec);
  (pools[(sec==secA?'a_':'f_')+pool]??=[]).push({id,load:0,name,u,sec})}
 // classes, subjects, teachers
 const mkStudent=db.prepare('INSERT INTO students(school_id,matricule,name,dob,sex,class_id,enrolled,guardian,phone) VALUES(?,?,?,?,?,?,?,?,?)'),mkMark=db.prepare('INSERT INTO marks(school_id,student_id,subject_id,seq,value,status,updated) VALUES(?,?,?,?,?,?,?)'),now=new Date().toISOString();
 const taken=new Set();let n=0;const classes=[];
 for(const[cn,sc,subs,lvl,fee]of CLASSES){
  const sec=sc=='A'?secA:secF,N=sc=='A'?NA:NF,pre=sc=='A'?'a_':'f_';
  const SHORT={'Lower Sixth Arts':'L6 Arts','Lower Sixth Science':'L6 Sci','Upper Sixth Arts':'U6 Arts','Upper Sixth Science':'U6 Sci','6ème':'6e','5ème':'5e','4ème':'4e','3ème':'3e','2nde A':'2A','2nde C':'2C','1ère A4':'1A4','1ère C':'1C','1ère D':'1D','Tle A4':'TA4','Tle C':'TC','Tle D':'TD'},sh=SHORT[cn]||cn.replace(/^Form (\d)$/,'F$1');
  const cid=db.prepare('INSERT INTO classes(school_id,name,section_id,short) VALUES(?,?,?,?)').run(sid,cn,sec,sh).lastInsertRowid;
  const sj=subs.map(([name,per,coef,pool])=>{const p=pools[pre+pool];if(!p)throw new Error('no teachers for '+pre+pool);const t=p.reduce((a,b)=>b.load<a.load?b:a);t.load+=per;
   const id=db.prepare('INSERT INTO subjects(school_id,class_id,name,coef,teacher_id) VALUES(?,?,?,?,?)').run(sid,cid,name,coef,t.id).lastInsertRowid;
   db.prepare('INSERT INTO gen_req(subject_id,school_id,per_week,max_day,doubles) VALUES(?,?,?,2,?)').run(id,sid,per,lvl>=5&&per>=5?1:0);return{id,name,teacher:t.id,diff:gauss()*.9}});
  db.prepare('UPDATE classes SET head_id=? WHERE id=?').run(sj[0].teacher,cid);
  [fee,Math.round(fee*.85/1000)*1000,Math.round(fee*.85/1000)*1000].forEach((a,i)=>db.prepare('INSERT INTO fee_plan(school_id,class_id,term,amount) VALUES(?,?,?,?)').run(sid,cid,i+1,a));
  const size=50+Math.floor(rnd()*7),st=[];
  for(let k=0;k<size;k++){
   const sex=rnd()<.52?'F':'M';let nm;do{nm=pick(N[sex])+(rnd()<.4?' '+pick(N[sex]):'')+' '+pick(N.S)}while(taken.has(nm));taken.add(nm);n++;
   const yr=2026-(sc=='A'?11:11)-lvl-(rnd()<.5?0:1)-(sc=='A'&&lvl>=5?0:0);
   const id=mkStudent.run(sid,'26-'+String(n).padStart(4,'0'),nm,`${yr}-${String(1+Math.floor(rnd()*12)).padStart(2,'0')}-${String(1+Math.floor(rnd()*28)).padStart(2,'0')}`,sex,cid,'2026-09-07','Parent of '+nm.split(' ')[0],'+237 6 '+String(50+Math.floor(rnd()*40))+' '+String(10+Math.floor(rnd()*90))+' '+String(10+Math.floor(rnd()*90))+' '+String(10+Math.floor(rnd()*90))).lastInsertRowid;
   st.push({id,ab:10.3+gauss()*2.1,k})}
  // marks: four sequences, every sheet submitted
  for(const sq of['S1','S2','S3','S4'])for(const x of st)for(const s of sj){
   if(cn=='Form 3'&&sq=='S4'&&s.name=='Physics')continue;                 // Physics sheet of Form 3 not submitted for sequence 4
   if(cn=='Form 1'&&x.k==3&&s.name=='Religious Studies')continue;          // does not study it: no mark at all, so it is not on his/her card
   if(cn=='Form 1'&&x.k==4&&(sq=='S1'||sq=='S2'))continue;                // joined in Term 2: dashes before, and no Term 1 card
   mkMark.run(sid,x.id,s.id,sq,Math.max(1,Math.min(19.5,Math.round((x.ab+s.diff+gauss()*2.2)*2)/2)),'submitted',now)}
  classes.push({id:cid,name:cn,sc,fee})}
 db.prepare("UPDATE schools SET demo=1,demo_fake='2026-10-05T08:52',demo_real=? WHERE id=?").run(new Date().toISOString(),sid)})();
db.exec("INSERT OR IGNORE INTO mark_sheets(school_id,subject_id,seq,at) SELECT school_id,subject_id,seq,MAX(updated) FROM marks GROUP BY subject_id,seq"); // every seeded sheet counts as submitted
const S0=db.prepare('SELECT id FROM schools WHERE code=?').get(CODE).id;for(const c of db.prepare('SELECT id FROM classes WHERE school_id=?').all(S0))R.publish(S0,c.id,1);

// ---- timetable (generated), rates, attendance history
tx(()=>{
 SC.blocksOf(S0).forEach((b,i)=>db.prepare('INSERT INTO blocks(school_id,pos,kind,minutes,label) VALUES(?,?,?,?,?)').run(S0,i,b.kind,b.minutes,b.label));
 db.prepare("INSERT INTO closed(school_id,date,label) VALUES(?,?,?)").run(S0,'2026-09-25','Staff training day');
 const tch=db.prepare("SELECT id,username,name FROM users WHERE school_id=? AND role='teacher' ORDER BY id").all(S0),by=Object.fromEntries(tch.map(t=>[t.username,t.id]));
 const UN=[['fotso',5,7],['fotso',5,8],['tchoumi',3,1],['tchoumi',3,2],['ayuk',1,1],['ateba',4,7],['ateba',4,8],['ndifor',2,8],['kamdem',5,1]];
 for(const[u,d,p]of UN)if(by[u])db.prepare('INSERT INTO unavail(school_id,teacher_id,day,period) VALUES(?,?,?,?)').run(S0,by[u],d,p);
 let best=null;for(let k=0;k<4;k++){const g=G.gather(S0,'2026-09-07','fresh'),r=G.build(g,2026+k);if(!best||r.stats.unplaced.length<best.stats.unplaced.length)best=r;if(!r.stats.unplaced.length)break}
 if(best.stats.unplaced.length)console.log('Note: the timetable generator left '+best.stats.unplaced.length+' groups of periods unplaced.');
 for(const c of best.cells)db.prepare('INSERT INTO slots(school_id,class_id,day,period,subject_id,teacher_id,from_date) VALUES(?,?,?,?,?,?,?)').run(S0,c.c,c.d,c.p,c.s,c.t,'2026-09-07');
 tch.forEach(t=>db.prepare('INSERT INTO rates(school_id,teacher_id,from_date,amount) VALUES(?,?,?,?)').run(S0,t.id,'2026-09-01',1200+100*Math.floor(rnd()*11)));
 db.prepare('INSERT INTO rates(school_id,teacher_id,from_date,amount) VALUES(?,?,?,?)').run(S0,by.tabe,'2026-10-01',1900);
 const lay=SC.layout(S0),today='2026-10-05',stamp=(d,m)=>d+'T'+SC.hh(m),ins=db.prepare('UPDATE lessons SET status=?,actual_id=?,via=?,flag=?,reason=?,appr=?,at=? WHERE id=?');
 for(let d='2026-09-07';d<=today;d=SC.addDays(d,1)){SC.ensure(S0,d);const Ls=db.prepare('SELECT * FROM lessons WHERE school_id=? AND date=? ORDER BY period').all(S0,d);if(!Ls.length)continue;
  const isToday=d==today,absent=new Set(tch.filter(()=>!isToday&&rnd()<.04).map(t=>t.id)),taken=new Set(),came=new Set(),busy=new Set(Ls.map(l=>l.sched_id+':'+l.period));
  if(isToday)absent.add(by.eyong); // Mr Eyong has not arrived yet today
  for(const l of Ls){const per=lay.periods[l.period-1];if(isToday&&per.end>SC.toMin('08:52'))continue;const U=(st,act,via,flag,reason,appr,at)=>ins.run(st,act,via,flag||null,reason||null,appr??null,at,l.id);
   if(!l.sched_id)continue;
   if(absent.has(l.sched_id)){if(isToday)continue;
    const free=tch.filter(t=>!absent.has(t.id)&&!taken.has(t.id+':'+l.period)&&!busy.has(t.id+':'+l.period));
    if(rnd()<.5&&free.length){const f=free[Math.floor(rnd()*free.length)];taken.add(f.id+':'+l.period);came.add(f.id);U('replaced',f.id,'round',null,null,1,stamp(d,per.start+3))}else U('absent',null,'round',null,null,null,stamp(d,per.start+5));continue}
   came.add(l.sched_id);const r=rnd();
   if(r<.06)U('late',l.sched_id,'qr',null,null,null,stamp(d,per.start+28));else if(r<.08&&d>='2026-10-01'&&!isToday)continue;else U('present',l.sched_id,'qr',null,null,null,stamp(d,per.start+2+Math.floor(rnd()*6)))}
  for(const t of tch)if(!absent.has(t.id)&&(came.has(t.id)||busy.has(t.id+':1')||Ls.some(l=>l.sched_id==t.id)))db.prepare('INSERT INTO gate(school_id,user_id,date,in_at,out_at,by_id) VALUES(?,?,?,?,?,?)').run(S0,t.id,d,stamp(d,SC.toMin('07:10')+Math.floor(rnd()*18)),isToday?null:stamp(d,14*60),by.tabe&&1)}
 // a few things for the principal to look at
 const pick1=w=>db.prepare(`SELECT * FROM lessons WHERE school_id=? AND status='present' AND ${w} ORDER BY id LIMIT 1`).get(S0);
 const a=pick1("date='2026-09-14'");if(a)db.prepare("UPDATE lessons SET flag='backfill',via='round',reason='Phone battery died, confirmed by the surveillant' WHERE id=?").run(a.id);
 const b=pick1("date='2026-10-02'");if(b)db.prepare("UPDATE lessons SET spot=1,spot_res='notseen',flag='spot' WHERE id=?").run(b.id);
 const c=db.prepare("SELECT * FROM lessons WHERE school_id=? AND status='absent' AND date>='2026-10-01' ORDER BY id LIMIT 1").get(S0);
 if(c){const f=tch.find(t=>t.id!=c.sched_id&&!db.prepare('SELECT 1 FROM lessons WHERE date=? AND period=? AND (sched_id=? OR actual_id=?)').get(c.date,c.period,t.id,t.id));if(f)db.prepare("UPDATE lessons SET status='replaced',actual_id=?,appr=NULL,via='qr' WHERE id=?").run(f.id,c.id)}
})();

// ---- fees
tx(()=>{
 const sec=db.prepare("SELECT id FROM users WHERE school_id=? AND username='secretary'").get(S0).id,PL=Object.fromEntries(db.prepare('SELECT class_id,term,amount FROM fee_plan WHERE school_id=?').all(S0).map(r=>[r.class_id+':'+r.term,r.amount]));
 const sts=db.prepare('SELECT s.id,s.class_id FROM students s WHERE s.school_id=? ORDER BY s.id').all(S0),pays=[];
 sts.forEach(s=>{const t1=PL[s.class_id+':1'],t2=PL[s.class_id+':2'],r=rnd(),d=n=>'2026-09-'+String(8+Math.floor(rnd()*n)).padStart(2,'0'),m=()=>['cash','cash','momo','om','bank'][Math.floor(rnd()*5)];
  if(r<.45){pays.push([s.id,t1/2,d(6),m()],[s.id,t1/2,'2026-09-'+String(16+Math.floor(rnd()*12)),m()])}
  else if(r<.65){pays.push([s.id,t1,d(10),m()],[s.id,Math.round(t2*.4/1000)*1000,'2026-10-02',m()])}
  else if(r<.85)pays.push([s.id,Math.round(t1*.4/1000)*1000,d(15),'cash'])});
 pays.sort((a,b)=>a[2].localeCompare(b[2])).forEach((p,i)=>db.prepare('INSERT INTO payments(school_id,student_id,amount,date,method,receipt,by_id,at) VALUES(?,?,?,?,?,?,?,?)').run(S0,p[0],p[1],p[2],p[3],i+1,sec,p[2]+'T10:00'));
 db.prepare('UPDATE students SET fee_discount=10000 WHERE id=?').run(sts[3].id);
 const v=db.prepare('SELECT id FROM payments WHERE school_id=? ORDER BY id LIMIT 1').get(S0);db.prepare("UPDATE payments SET void=1,void_reason='Entered twice by mistake',void_by=? WHERE id=?").run(sec,v.id);
})();
const cnt=q=>db.prepare(q).get(S0).n;
console.log(`Demo school ready. School code: ${CODE} · password for all users: ${PW}`);
console.log(`Anglophone: ${cnt("SELECT COUNT(*) n FROM classes c JOIN sections s ON s.id=c.section_id WHERE c.school_id=? AND s.name='Anglophone'")} classes, ${cnt("SELECT COUNT(*) n FROM students st JOIN classes c ON c.id=st.class_id JOIN sections s ON s.id=c.section_id WHERE st.school_id=? AND s.name='Anglophone'")} students, ${cnt("SELECT COUNT(*) n FROM user_sections us JOIN sections s ON s.id=us.section_id WHERE s.school_id=? AND s.name='Anglophone'")} teachers`);
console.log(`Francophone: ${cnt("SELECT COUNT(*) n FROM classes c JOIN sections s ON s.id=c.section_id WHERE c.school_id=? AND s.name='Francophone'")} classes, ${cnt("SELECT COUNT(*) n FROM students st JOIN classes c ON c.id=st.class_id JOIN sections s ON s.id=c.section_id WHERE st.school_id=? AND s.name='Francophone'")} students, ${cnt("SELECT COUNT(*) n FROM user_sections us JOIN sections s ON s.id=us.section_id WHERE s.school_id=? AND s.name='Francophone'")} teachers`);
console.log('Term 1 published for all classes; in Term 2, Form 3 has Physics marks not submitted (publishing it shows the “Publish anyway” warning).');
console.log('Demo clock is set to Mon 5 Oct 2026, 08:52 (change it from the yellow bar).');
console.log('Users: principal, secretary, surveillant, and teachers such as tabe, ngu, eyong (Anglophone), fotso, tchoumi (Francophone). Every teacher has their surname as username.');
