const crypto=require('crypto'),RT=require('./core/runtime');
const db=RT.driver||require('./core/driver-node')(process.env.DB||'school.db'),tx=db.tx;
db.exec(`
CREATE TABLE IF NOT EXISTS schools(id INTEGER PRIMARY KEY,code TEXT UNIQUE NOT NULL,name TEXT NOT NULL,created TEXT DEFAULT CURRENT_TIMESTAMP,trial_ends TEXT NOT NULL,paid_until TEXT);
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,school_id INTEGER NOT NULL REFERENCES schools(id),username TEXT NOT NULL,pw TEXT NOT NULL,name TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN('principal','secretary','teacher','surveillant')),active INTEGER DEFAULT 1,UNIQUE(school_id,username));
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),created TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS classes(id INTEGER PRIMARY KEY,school_id INTEGER NOT NULL REFERENCES schools(id),name TEXT NOT NULL,UNIQUE(school_id,name));
CREATE TABLE IF NOT EXISTS students(id INTEGER PRIMARY KEY,school_id INTEGER NOT NULL REFERENCES schools(id),matricule TEXT,name TEXT NOT NULL,dob TEXT,sex TEXT CHECK(sex IN('F','M')),class_id INTEGER REFERENCES classes(id),enrolled TEXT,guardian TEXT,phone TEXT,active INTEGER DEFAULT 1,UNIQUE(school_id,matricule));
CREATE TABLE IF NOT EXISTS subjects(id INTEGER PRIMARY KEY,school_id INTEGER NOT NULL REFERENCES schools(id),class_id INTEGER NOT NULL REFERENCES classes(id),name TEXT NOT NULL,coef REAL NOT NULL,teacher_id INTEGER REFERENCES users(id),UNIQUE(class_id,name));
CREATE TABLE IF NOT EXISTS marks(school_id INTEGER NOT NULL,student_id INTEGER NOT NULL REFERENCES students(id),subject_id INTEGER NOT NULL REFERENCES subjects(id),seq TEXT NOT NULL,value REAL NOT NULL,status TEXT NOT NULL DEFAULT 'draft',updated TEXT,PRIMARY KEY(student_id,subject_id,seq));
CREATE TABLE IF NOT EXISTS publications(school_id INTEGER NOT NULL,class_id INTEGER NOT NULL REFERENCES classes(id),term INTEGER NOT NULL,at TEXT,PRIMARY KEY(class_id,term));
CREATE TABLE IF NOT EXISTS cards(code TEXT PRIMARY KEY,school_id INTEGER NOT NULL,student_id INTEGER NOT NULL REFERENCES students(id),class_id INTEGER NOT NULL,term INTEGER NOT NULL,snap TEXT NOT NULL,UNIQUE(student_id,term));
CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY,at TEXT DEFAULT CURRENT_TIMESTAMP,school_id INTEGER,user_id INTEGER,action TEXT,detail TEXT);
`);
db.exec(`CREATE INDEX IF NOT EXISTS i_marks_subject ON marks(subject_id,seq);CREATE INDEX IF NOT EXISTS i_students_class ON students(school_id,class_id);CREATE INDEX IF NOT EXISTS i_subjects_class ON subjects(class_id);CREATE INDEX IF NOT EXISTS i_cards_class ON cards(class_id,term)`);
try{db.exec('ALTER TABLE classes ADD COLUMN head_id INTEGER')}catch{}
try{db.exec("ALTER TABLE classes ADD COLUMN off_days TEXT DEFAULT ''")}catch{}
// A "marks sheet" is one subject in one sequence. It counts as submitted when the teacher clicked "Submit marks to the school", even if some
// students were left blank on purpose (they do not study that subject).
{let first=false;try{db.exec('CREATE TABLE mark_sheets(school_id INTEGER NOT NULL,subject_id INTEGER NOT NULL REFERENCES subjects(id),seq TEXT NOT NULL,by_id INTEGER,at TEXT,PRIMARY KEY(subject_id,seq))');first=true}catch{}
 // existing data: a sheet whose marks are all in 'submitted' state was submitted
 if(first)db.exec("INSERT OR IGNORE INTO mark_sheets(school_id,subject_id,seq,at) SELECT school_id,subject_id,seq,MAX(updated) FROM marks GROUP BY subject_id,seq HAVING SUM(status<>'submitted')=0")}
for(const c of["header TEXT","year TEXT","seq_plan TEXT DEFAULT '2,2,2'"])try{db.exec('ALTER TABLE schools ADD COLUMN '+c)}catch{}
// one-time migration: the first header line used to hold the school name; printed documents now take the name from Settings → School name
{let first=false;try{db.exec('ALTER TABLE schools ADD COLUMN hdr_v INTEGER DEFAULT 1');first=true}catch{}
 if(first)for(const r of db.prepare("SELECT id,header FROM schools WHERE header IS NOT NULL AND header<>''").all())db.prepare('UPDATE schools SET header=? WHERE id=?').run(String(r.header).split('\n').slice(1).join('\n').trim(),r.id)}
for(const c of["tz TEXT DEFAULT 'Africa/Douala'","day_start TEXT DEFAULT '07:30'","days TEXT DEFAULT '1,2,3,4,5'","win_before INTEGER DEFAULT 10","win_after INTEGER DEFAULT 20","spot_n INTEGER DEFAULT 2","show_pay INTEGER DEFAULT 1","demo INTEGER DEFAULT 0","demo_real TEXT","demo_fake TEXT"])try{db.exec('ALTER TABLE schools ADD COLUMN '+c)}catch{}
try{db.exec('ALTER TABLE classes ADD COLUMN qr TEXT')}catch{}
try{db.exec('ALTER TABLE classes ADD COLUMN short TEXT')}catch{}
// short class name for printed lists; older classes get one from their name ("Form 4 Science" -> "F4S"), editable on the class card
const acr=n=>String(n).split(/\s+/).filter(Boolean).map(w=>/\d/.test(w)?w.toUpperCase():w[0].toUpperCase()).join('').slice(0,8);
for(const c of db.prepare("SELECT id,name FROM classes WHERE short IS NULL OR short=''").all())db.prepare('UPDATE classes SET short=? WHERE id=?').run(acr(c.name),c.id);
try{db.exec('ALTER TABLE students ADD COLUMN fee_discount INTEGER DEFAULT 0')}catch{}
try{db.exec("ALTER TABLE schools ADD COLUMN card_rule TEXT DEFAULT 'all'")}catch{}
try{db.exec("ALTER TABLE schools ADD COLUMN card_fees INTEGER DEFAULT 1")}catch{}
db.exec(`
CREATE TABLE IF NOT EXISTS fee_plan(school_id INTEGER NOT NULL,class_id INTEGER NOT NULL REFERENCES classes(id),term INTEGER NOT NULL,amount INTEGER NOT NULL,PRIMARY KEY(class_id,term));
CREATE TABLE IF NOT EXISTS payments(id INTEGER PRIMARY KEY,school_id INTEGER NOT NULL,student_id INTEGER NOT NULL REFERENCES students(id),amount INTEGER NOT NULL,date TEXT NOT NULL,method TEXT NOT NULL,ref TEXT,receipt INTEGER NOT NULL,by_id INTEGER,at TEXT,void INTEGER DEFAULT 0,void_reason TEXT,void_by INTEGER,UNIQUE(school_id,receipt));
CREATE TABLE IF NOT EXISTS releases(school_id INTEGER NOT NULL,student_id INTEGER NOT NULL REFERENCES students(id),term INTEGER NOT NULL,by_id INTEGER,reason TEXT,at TEXT,PRIMARY KEY(student_id,term));
CREATE INDEX IF NOT EXISTS i_pay_student ON payments(student_id);CREATE INDEX IF NOT EXISTS i_pay_school ON payments(school_id,date);
`);
try{db.exec('ALTER TABLE users ADD COLUMN can_gate INTEGER DEFAULT 0')}catch{}
// Phase 4: timetable, presence, hours
db.exec(`
CREATE TABLE IF NOT EXISTS blocks(id INTEGER PRIMARY KEY,school_id INTEGER NOT NULL,pos INTEGER NOT NULL,kind TEXT NOT NULL CHECK(kind IN('period','break')),minutes INTEGER NOT NULL,label TEXT);
CREATE TABLE IF NOT EXISTS slots(id INTEGER PRIMARY KEY,school_id INTEGER NOT NULL,class_id INTEGER NOT NULL REFERENCES classes(id),day INTEGER NOT NULL,period INTEGER NOT NULL,subject_id INTEGER NOT NULL REFERENCES subjects(id),teacher_id INTEGER REFERENCES users(id),from_date TEXT NOT NULL,to_date TEXT);
CREATE TABLE IF NOT EXISTS unavail(school_id INTEGER NOT NULL,teacher_id INTEGER NOT NULL,day INTEGER NOT NULL,period INTEGER NOT NULL,PRIMARY KEY(teacher_id,day,period));
CREATE TABLE IF NOT EXISTS closed(school_id INTEGER NOT NULL,date TEXT NOT NULL,label TEXT,PRIMARY KEY(school_id,date));
CREATE TABLE IF NOT EXISTS gate(id INTEGER PRIMARY KEY,school_id INTEGER NOT NULL,user_id INTEGER NOT NULL,date TEXT NOT NULL,in_at TEXT,out_at TEXT,by_id INTEGER,flag TEXT,reason TEXT,UNIQUE(user_id,date));
CREATE TABLE IF NOT EXISTS lessons(id INTEGER PRIMARY KEY,school_id INTEGER NOT NULL,class_id INTEGER NOT NULL,date TEXT NOT NULL,period INTEGER NOT NULL,subject_id INTEGER NOT NULL,sched_id INTEGER,actual_id INTEGER,status TEXT NOT NULL DEFAULT 'pending',via TEXT,flag TEXT,reason TEXT,appr INTEGER,at TEXT,by_id INTEGER,spot INTEGER,spot_res TEXT,UNIQUE(class_id,date,period));
CREATE TABLE IF NOT EXISTS rates(school_id INTEGER NOT NULL,teacher_id INTEGER NOT NULL,from_date TEXT NOT NULL,amount INTEGER NOT NULL,PRIMARY KEY(teacher_id,from_date));
CREATE TABLE IF NOT EXISTS months(school_id INTEGER NOT NULL,ym TEXT NOT NULL,by_id INTEGER,at TEXT,snap TEXT,PRIMARY KEY(school_id,ym));
CREATE INDEX IF NOT EXISTS i_slots_class ON slots(class_id,day,period);CREATE INDEX IF NOT EXISTS i_slots_teacher ON slots(teacher_id,day,period);
CREATE INDEX IF NOT EXISTS i_lessons_date ON lessons(school_id,date);CREATE INDEX IF NOT EXISTS i_lessons_sched ON lessons(sched_id,date);CREATE INDEX IF NOT EXISTS i_lessons_actual ON lessons(actual_id,date);
`);

// ---- Phase 6a: plans & billing
for(const c of["modules TEXT DEFAULT 'reports,fees,tracking'","discount_pct INTEGER DEFAULT 0","term_dates TEXT","price_lock_until TEXT"])try{db.exec('ALTER TABLE schools ADD COLUMN '+c)}catch{}
for(const c of["ref_id INTEGER","ref_until TEXT"])try{db.exec('ALTER TABLE schools ADD COLUMN '+c)}catch{}
db.exec(`CREATE TABLE IF NOT EXISTS referrers(id INTEGER PRIMARY KEY,code TEXT UNIQUE NOT NULL,name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,phone TEXT DEFAULT '',pw TEXT NOT NULL,email_ok INTEGER DEFAULT 0,active INTEGER DEFAULT 1,created TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS referrer_sessions(token TEXT PRIMARY KEY,referrer_id INTEGER NOT NULL,created TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS referral_earnings(id INTEGER PRIMARY KEY,referrer_id INTEGER NOT NULL,school_id INTEGER NOT NULL,payment_id INTEGER UNIQUE NOT NULL,base INTEGER NOT NULL,amount INTEGER NOT NULL,created TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS referral_payouts(id INTEGER PRIMARY KEY,referrer_id INTEGER NOT NULL,amount INTEGER NOT NULL,method TEXT,ref TEXT,note TEXT,by_name TEXT,created TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS i_schools_ref ON schools(ref_id);CREATE INDEX IF NOT EXISTS i_earn_ref ON referral_earnings(referrer_id)`);
db.exec(`
CREATE TABLE IF NOT EXISTS prices(key TEXT PRIMARY KEY,value INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS usage_peak(school_id INTEGER NOT NULL,year INTEGER NOT NULL,term INTEGER NOT NULL,students INTEGER NOT NULL DEFAULT 0,teachers INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(school_id,year,term));
CREATE TABLE IF NOT EXISTS invoices(id INTEGER PRIMARY KEY,school_id INTEGER NOT NULL REFERENCES schools(id),year INTEGER NOT NULL,term INTEGER NOT NULL,number TEXT,modules TEXT,students INTEGER NOT NULL,teachers INTEGER NOT NULL,lines TEXT,gross INTEGER NOT NULL,discount INTEGER NOT NULL DEFAULT 0,amount INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN('draft','sent','paid','void')),created TEXT,issued TEXT,due TEXT,note TEXT,UNIQUE(school_id,year,term));
CREATE TABLE IF NOT EXISTS bill_payments(id INTEGER PRIMARY KEY,school_id INTEGER NOT NULL,invoice_id INTEGER NOT NULL REFERENCES invoices(id),amount INTEGER NOT NULL,date TEXT NOT NULL,method TEXT,ref TEXT,receipt TEXT,by_name TEXT,at TEXT);
CREATE TABLE IF NOT EXISTS credit_notes(id INTEGER PRIMARY KEY,school_id INTEGER NOT NULL,invoice_id INTEGER NOT NULL REFERENCES invoices(id),amount INTEGER NOT NULL,reason TEXT NOT NULL,number TEXT,by_name TEXT,at TEXT);
`);
for(const[k,v]of Object.entries({reports_solo:200,reports_bundle:150,fees_solo:200,fees_bundle:150,tracking_solo:1000,tracking_bundle:800,reports_pair:175,fees_pair:175,tracking_pair:900,commit_fee:5000,min_term:10000,grace_days:14,due_days:14}))db.prepare('INSERT OR IGNORE INTO prices(key,value) VALUES(?,?)').run(k,v);
// ---- phase 7: revised price list (one-time; later edits in the owners' console are kept). Per student per term: Reports 100, Fees 100 (75 each when two or more modules are taken); Teacher tracking 300 (200 in a package). No minimum.
if(!db.prepare("SELECT 1 FROM prices WHERE key='price_rev'").get()){
 for(const[k,v]of Object.entries({reports_solo:100,reports_pair:75,reports_bundle:75,fees_solo:100,fees_pair:75,fees_bundle:75,tracking_solo:300,tracking_pair:200,tracking_bundle:200,min_term:0,price_rev:1}))db.prepare('INSERT INTO prices(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(k,v);
 try{db.prepare("DELETE FROM price_plan WHERE key IN('reports_solo','reports_pair','reports_bundle','fees_solo','fees_pair','fees_bundle','tracking_solo','tracking_pair','tracking_bundle','min_term')").run()}catch{}}   // price_plan does not exist yet on a brand-new database
// ---- phase 7: optional honour roll (criteria set in Settings -> Report cards)
for(const c of["hr_on INTEGER DEFAULT 0","hr_tiers TEXT","hr_top INTEGER DEFAULT 0","hr_nofail REAL DEFAULT 0"])try{db.exec('ALTER TABLE schools ADD COLUMN '+c)}catch{}
// ---- phase 8a: receipts. Each payment gets a public verification code (printed as a QR), a print counter (a reprint says DUPLICATE) and
// the school picks its receipt paper (80 or 58 mm roll).
for(const c of["code TEXT","printed INTEGER DEFAULT 0"])try{db.exec('ALTER TABLE payments ADD COLUMN '+c)}catch{}
try{db.exec("ALTER TABLE schools ADD COLUMN receipt_w INTEGER DEFAULT 80")}catch{}
{const A='23456789ABCDEFGHJKLMNPQRSTUVWXYZ',g=()=>Array.from(crypto.randomBytes(4),b=>A[b%A.length]).join(''),rc=()=>'RP-'+g()+'-'+g();for(const r of db.prepare('SELECT id FROM payments WHERE code IS NULL').all()){for(;;)try{db.prepare('UPDATE payments SET code=? WHERE id=?').run(rc(),r.id);break}catch{}}}
db.exec('CREATE UNIQUE INDEX IF NOT EXISTS i_pay_code ON payments(code)');
// ---- Phase 6b: owners' console
for(const c of["flag TEXT DEFAULT ''","owner_note TEXT DEFAULT ''","city TEXT DEFAULT ''","locked_prices TEXT"])try{db.exec('ALTER TABLE schools ADD COLUMN '+c)}catch{}
try{db.exec("ALTER TABLE users ADD COLUMN phone TEXT DEFAULT ''")}catch{}
try{db.exec("ALTER TABLE invoices ADD COLUMN adj_note TEXT")}catch{}
db.exec(`
CREATE TABLE IF NOT EXISTS owners(id INTEGER PRIMARY KEY,email TEXT UNIQUE NOT NULL,name TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN('owner','finance','support')),pw TEXT NOT NULL,totp TEXT NOT NULL,totp_on INTEGER NOT NULL DEFAULT 0,last_step INTEGER NOT NULL DEFAULT 0,active INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS owner_sessions(token TEXT PRIMARY KEY,owner_id INTEGER NOT NULL REFERENCES owners(id),stage TEXT NOT NULL DEFAULT 'totp',created TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS owner_audit(id INTEGER PRIMARY KEY,at TEXT NOT NULL,owner_id INTEGER,owner_name TEXT,action TEXT NOT NULL,school_id INTEGER,detail TEXT,prev TEXT,hash TEXT NOT NULL);
CREATE TRIGGER IF NOT EXISTS owner_audit_no_update BEFORE UPDATE ON owner_audit BEGIN SELECT RAISE(ABORT,'audit log is append-only'); END;
CREATE TRIGGER IF NOT EXISTS owner_audit_no_delete BEFORE DELETE ON owner_audit BEGIN SELECT RAISE(ABORT,'audit log is append-only'); END;
CREATE TABLE IF NOT EXISTS price_plan(eff TEXT NOT NULL,key TEXT NOT NULL,value INTEGER NOT NULL,PRIMARY KEY(eff,key));
`);
// ---- Phase 6c: usage, support mode, reset links, announcements, backups
try{db.exec("ALTER TABLE schools ADD COLUMN support_until TEXT")}catch{}
// report card design: logo (data URL), up to two colours, languages shown (en | fr | both)
for(const c of['card_logo TEXT',"card_c1 TEXT DEFAULT '#1e5d46'","card_c2 TEXT DEFAULT ''","card_lang TEXT DEFAULT 'both'"])try{db.exec('ALTER TABLE schools ADD COLUMN '+c)}catch{}
// school location for the "you must be at school" check on lesson confirmation
for(const c of['geo_lat REAL','geo_lng REAL','geo_r INTEGER DEFAULT 150'])try{db.exec('ALTER TABLE schools ADD COLUMN '+c)}catch{}
try{db.exec('ALTER TABLE lessons ADD COLUMN geo_m INTEGER')}catch{}
db.exec(`
CREATE TABLE IF NOT EXISTS support_sessions(id INTEGER PRIMARY KEY,token TEXT UNIQUE NOT NULL,school_id INTEGER NOT NULL,owner_id INTEGER NOT NULL,owner_name TEXT,started TEXT NOT NULL,last_seen TEXT,expires TEXT NOT NULL,ended TEXT,reads INTEGER NOT NULL DEFAULT 0,areas TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS subject_seq(subject_id INTEGER NOT NULL REFERENCES subjects(id),seq TEXT NOT NULL,teacher_id INTEGER NOT NULL REFERENCES users(id),PRIMARY KEY(subject_id,seq));
CREATE TABLE IF NOT EXISTS reset_tokens(hash TEXT PRIMARY KEY,user_id INTEGER NOT NULL,expires TEXT NOT NULL,used INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS announcements(id INTEGER PRIMARY KEY,title_en TEXT NOT NULL,body_en TEXT,title_fr TEXT,body_fr TEXT,level TEXT NOT NULL DEFAULT 'info',starts TEXT NOT NULL,ends TEXT NOT NULL,active INTEGER NOT NULL DEFAULT 1,by_name TEXT,created TEXT);
CREATE TABLE IF NOT EXISTS daily_writes(day TEXT PRIMARY KEY,n INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS backups(id INTEGER PRIMARY KEY,at TEXT NOT NULL,file TEXT,bytes INTEGER,ok INTEGER NOT NULL DEFAULT 1,note TEXT);
CREATE TABLE IF NOT EXISTS errors(id INTEGER PRIMARY KEY,at TEXT NOT NULL,route TEXT,kind TEXT);
`);
for(const c of db.prepare('SELECT id FROM classes WHERE qr IS NULL').all())db.prepare('UPDATE classes SET qr=? WHERE id=?').run(crypto.randomBytes(12).toString('hex'),c.id);
const{hash,verify}=require('./pwhash');
const AL='23456789ABCDEFGHJKLMNPQRSTUVWXYZ',code=()=>Array.from(crypto.randomBytes(6),b=>AL[b%AL.length]).join('');
// read-cost indexes (rows scanned are what Cloudflare bills): class headcounts, 'which sequences have marks', gate by day
db.exec('CREATE INDEX IF NOT EXISTS i_students_cls_act ON students(class_id,active);CREATE INDEX IF NOT EXISTS i_marks_school_seq ON marks(school_id,seq);CREATE INDEX IF NOT EXISTS i_gate_day ON gate(school_id,date);CREATE INDEX IF NOT EXISTS i_slots_school ON slots(school_id,day)');
try{db.exec('ALTER TABLE invoices ADD COLUMN ref_pct INTEGER DEFAULT 0')}catch{}
module.exports={db,tx,hash,verify,code};

try{db.exec('ALTER TABLE lessons ADD COLUMN summary TEXT')}catch{}
// email + two-step sign-in
try{db.exec("ALTER TABLE users ADD COLUMN email TEXT DEFAULT ''")}catch{}
try{db.exec('ALTER TABLE users ADD COLUMN email_ok INTEGER DEFAULT 0')}catch{}
db.exec(`CREATE TABLE IF NOT EXISTS auth_tickets(hash TEXT PRIMARY KEY,user_id INTEGER,owner_id INTEGER,kind TEXT NOT NULL,pending TEXT DEFAULT '',code_hash TEXT DEFAULT '',expires INTEGER NOT NULL,code_expires INTEGER DEFAULT 0,tries INTEGER DEFAULT 0,sends INTEGER DEFAULT 0,last_send INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS trusted_devices(hash TEXT PRIMARY KEY,user_id INTEGER,owner_id INTEGER,expires INTEGER NOT NULL);`);
// student roll call
try{db.exec("ALTER TABLE schools ADD COLUMN roll_mode TEXT DEFAULT 'off'")}catch{}
db.exec(`CREATE TABLE IF NOT EXISTS roll_calls(id INTEGER PRIMARY KEY,school_id INTEGER NOT NULL,class_id INTEGER NOT NULL REFERENCES classes(id),date TEXT NOT NULL,period INTEGER NOT NULL DEFAULT 0,taken_by INTEGER,taken_at TEXT,UNIQUE(class_id,date,period));
CREATE TABLE IF NOT EXISTS roll_absent(call_id INTEGER NOT NULL REFERENCES roll_calls(id) ON DELETE CASCADE,student_id INTEGER NOT NULL REFERENCES students(id),PRIMARY KEY(call_id,student_id));
CREATE INDEX IF NOT EXISTS i_roll_school ON roll_calls(school_id,date);CREATE INDEX IF NOT EXISTS i_roll_stu ON roll_absent(student_id);`);
// Phase 8b: exam submission (PDF only). Files live outside the database (see exam.js); this table is the index.
db.exec(`CREATE TABLE IF NOT EXISTS exams(id INTEGER PRIMARY KEY,school_id INTEGER NOT NULL,subject_id INTEGER NOT NULL REFERENCES subjects(id),class_id INTEGER NOT NULL,title TEXT NOT NULL,date TEXT,date_locked INTEGER NOT NULL DEFAULT 0,copies INTEGER NOT NULL DEFAULT 1,has_file INTEGER NOT NULL DEFAULT 0,bytes INTEGER NOT NULL DEFAULT 0,pages INTEGER NOT NULL DEFAULT 0,up_by INTEGER,up_at TEXT,created_by INTEGER,created TEXT,expired_at TEXT);
CREATE INDEX IF NOT EXISTS i_exams_school ON exams(school_id,date)`);
try{db.exec('ALTER TABLE schools ADD COLUMN exam_cap_mb INTEGER DEFAULT 300')}catch{}
// Phase 9a: sections (Anglophone / Francophone / Primary ...). One hidden default section per school until a second one is added.
db.exec(`CREATE TABLE IF NOT EXISTS sections(id INTEGER PRIMARY KEY,school_id INTEGER NOT NULL,name TEXT NOT NULL,pos INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS user_sections(user_id INTEGER NOT NULL,section_id INTEGER NOT NULL REFERENCES sections(id),PRIMARY KEY(user_id,section_id))`);
try{db.exec('ALTER TABLE classes ADD COLUMN section_id INTEGER')}catch{}
// Phase 9b: exam timetable. A timetable (exam_tt) holds one paper per class and subject; classes in a group share one time (tog).
db.exec(`CREATE TABLE IF NOT EXISTS class_groups(id INTEGER PRIMARY KEY,school_id INTEGER NOT NULL,section_id INTEGER,name TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS class_group_classes(group_id INTEGER NOT NULL REFERENCES class_groups(id) ON DELETE CASCADE,class_id INTEGER NOT NULL UNIQUE,PRIMARY KEY(group_id,class_id));
CREATE TABLE IF NOT EXISTS exam_tt(id INTEGER PRIMARY KEY,school_id INTEGER NOT NULL,name TEXT NOT NULL,seq TEXT,start_date TEXT NOT NULL,end_date TEXT NOT NULL,day_start INTEGER NOT NULL,day_end INTEGER NOT NULL,max_min INTEGER NOT NULL DEFAULT 300,align INTEGER NOT NULL DEFAULT 1,inv_mode TEXT NOT NULL DEFAULT 'subject',pool_all INTEGER NOT NULL DEFAULT 0,per_room INTEGER NOT NULL DEFAULT 1,lessons TEXT NOT NULL DEFAULT 'continue',classes TEXT NOT NULL DEFAULT '[]',cfg TEXT NOT NULL DEFAULT '{}',created TEXT,created_by INTEGER);
CREATE TABLE IF NOT EXISTS exam_paper(id INTEGER PRIMARY KEY,tt_id INTEGER NOT NULL REFERENCES exam_tt(id) ON DELETE CASCADE,class_id INTEGER NOT NULL,subject_id INTEGER NOT NULL,subject TEXT NOT NULL,date TEXT,start INTEGER,dur INTEGER NOT NULL,tog TEXT,UNIQUE(tt_id,class_id,subject_id));
CREATE TABLE IF NOT EXISTS exam_inv(paper_id INTEGER NOT NULL REFERENCES exam_paper(id) ON DELETE CASCADE,slot INTEGER NOT NULL,teacher_id INTEGER,PRIMARY KEY(paper_id,slot));
CREATE TABLE IF NOT EXISTS exam_nopaper(school_id INTEGER NOT NULL,name TEXT NOT NULL,PRIMARY KEY(school_id,name))`);

// Phase 9c: exam dates come from the exam timetable; the submission deadline is a number of school days before the exam
try{db.exec('ALTER TABLE exams ADD COLUMN tt_id INTEGER')}catch{}
try{db.exec('ALTER TABLE schools ADD COLUMN exam_lead INTEGER DEFAULT 3')}catch{}

// Phase 9d: a published exam timetable suspends lessons of the classes that are writing; invigilation is confirmed per duty; optional pay for it
try{db.exec('ALTER TABLE exam_tt ADD COLUMN published INTEGER NOT NULL DEFAULT 0')}catch{}
for(const c of['status TEXT','conf_at TEXT','conf_by INTEGER','conf_geo INTEGER','reason TEXT'])try{db.exec('ALTER TABLE exam_inv ADD COLUMN '+c)}catch{}
try{db.exec('ALTER TABLE schools ADD COLUMN inv_pay INTEGER DEFAULT 0')}catch{}

// Phase 8c: exam printing. Group papers share one file (exams.grp); every print is recorded so a second print can be warned about.
try{db.exec('ALTER TABLE exams ADD COLUMN grp TEXT')}catch{}
db.exec(`CREATE TABLE IF NOT EXISTS exam_prints(id INTEGER PRIMARY KEY,school_id INTEGER NOT NULL,by_id INTEGER,at TEXT NOT NULL,label TEXT,mode TEXT,n_exams INTEGER,sheets INTEGER,skipped INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS exam_print_items(print_id INTEGER NOT NULL REFERENCES exam_prints(id) ON DELETE CASCADE,exam_id INTEGER NOT NULL,copies INTEGER NOT NULL,pages INTEGER NOT NULL DEFAULT 0)`);

// Phase 9e: regular timetable generator. Weekly requirement per subject, saved settings, and unsaved proposals.
db.exec(`CREATE TABLE IF NOT EXISTS gen_req(subject_id INTEGER PRIMARY KEY REFERENCES subjects(id) ON DELETE CASCADE,school_id INTEGER NOT NULL,per_week INTEGER NOT NULL,max_day INTEGER NOT NULL DEFAULT 2,doubles INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS gen_prop(id INTEGER PRIMARY KEY,school_id INTEGER NOT NULL,at TEXT NOT NULL,by_id INTEGER,from_date TEXT NOT NULL,mode TEXT NOT NULL,seed INTEGER,cells TEXT NOT NULL,stats TEXT NOT NULL)`);
try{db.exec('ALTER TABLE schools ADD COLUMN gen_cfg TEXT')}catch{}
// Phase 10q: teaching teams. Extra teachers of a subject (each with their own lessons per week), one practical line per subject (timetable only: no exam, no mark, no report card entry), optional per-teacher marks.
db.exec(`CREATE TABLE IF NOT EXISTS subject_teachers(subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,teacher_id INTEGER NOT NULL REFERENCES users(id),per_week INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(subject_id,teacher_id));
CREATE TABLE IF NOT EXISTS subject_prac(subject_id INTEGER PRIMARY KEY REFERENCES subjects(id) ON DELETE CASCADE,teacher_id INTEGER REFERENCES users(id),per_week INTEGER NOT NULL DEFAULT 1,doubles INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS mark_parts(student_id INTEGER NOT NULL,subject_id INTEGER NOT NULL,seq TEXT NOT NULL,teacher_id INTEGER NOT NULL,value REAL NOT NULL,updated TEXT,PRIMARY KEY(student_id,subject_id,seq,teacher_id));
CREATE TABLE IF NOT EXISTS mark_part_sheets(subject_id INTEGER NOT NULL,seq TEXT NOT NULL,teacher_id INTEGER NOT NULL,at TEXT,PRIMARY KEY(subject_id,seq,teacher_id));`);
try{db.exec('ALTER TABLE subjects ADD COLUMN parts INTEGER NOT NULL DEFAULT 0')}catch{}
try{db.exec('ALTER TABLE slots ADD COLUMN kind INTEGER NOT NULL DEFAULT 0')}catch{}
try{db.exec('ALTER TABLE gen_req ADD COLUMN split_ok INTEGER NOT NULL DEFAULT 0')}catch{}

// Phase 10: student ID badges. Photos live in their own table (so SELECT s.* never drags a blob into a JSON list).
db.exec(`CREATE TABLE IF NOT EXISTS student_photos(student_id INTEGER PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,school_id INTEGER NOT NULL,jpg BLOB NOT NULL,at TEXT,by_id INTEGER);
CREATE TABLE IF NOT EXISTS badges(id INTEGER PRIMARY KEY,school_id INTEGER NOT NULL,student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,code TEXT NOT NULL UNIQUE,year INTEGER NOT NULL,created TEXT,printed_at TEXT,prints INTEGER NOT NULL DEFAULT 0,void INTEGER NOT NULL DEFAULT 0,void_reason TEXT,void_at TEXT);
CREATE INDEX IF NOT EXISTS badges_st ON badges(student_id)`);
