// Dashboard data for principal / secretary (redesign step 3): one call, everything glanceable.
const{db}=require('./db'),SC=require('./sched'),R=require('./report'),memo=require('./core/memo');
module.exports=(app,{auth,school})=>{
app.get('/api/dashboard',auth(['principal','secretary']),(req,res)=>{
 const s=req.user.school_id,sc=school(req),ck=SC.clock(sc),ym=ck.date.slice(0,7),pr=req.user.role=='principal',lay=SC.layout(s,sc),day=SC.schoolDay(s,sc,ck.date);
 const one=(q,...a)=>db.prepare(q).get(...a),n=(q,...a)=>one(q,...a).n;
 const h=one("SELECT COUNT(*) n,COALESCE(SUM(sex='M'),0) b,COALESCE(SUM(enrolled LIKE ?),0) f FROM students WHERE school_id=? AND active=1",ym+'%',s),st={active:h.n,boys:h.b,fresh:h.f};
 st.girls=st.active-st.boys;
 const classes=db.prepare('SELECT id,name FROM classes WHERE school_id=?').all(s),seqs=R.seqs(sc);
 // current term = term of the latest sequence that has any mark, else term 1
 const last=[...seqs].sort((a,b)=>b.n-a.n).find(q=>db.prepare('SELECT 1 x FROM marks WHERE school_id=? AND seq=? LIMIT 1').get(s,q.id)),term=last?last.term:1;   // newest sequence that has a mark: one index probe each
 let missing=0;for(const c of classes)missing+=R.pending(s,c.id,term,last?last.n:1).reduce((a,g)=>a+g.items.reduce((b,i)=>b+i.seqs.length,0),0);
 const avg=memo(s,'avg',6e5,()=>one('SELECT AVG(value) a FROM marks WHERE school_id=?',s).a);   // scans every mark: refreshed at most every 10 minutes
 const nm=SC.names(s);let lessons=[],gate=null,les=null,pending=0,payroll=null;
 if(day){SC.ensure(s,ck.date,sc);
  lessons=db.prepare('SELECT l.*,c.name cls,b.name subject FROM lessons l JOIN classes c ON c.id=l.class_id JOIN subjects b ON b.id=l.subject_id WHERE l.school_id=? AND l.date=? ORDER BY l.period,c.name').all(s,ck.date).map(l=>{const p=lay.periods[l.period-1]||{};return{id:l.id,period:l.period,start:p.s||'',end:p.e||'',cls:l.cls,subject:l.subject,teacher:nm[l.actual_id||l.sched_id]||'—',sched:nm[l.sched_id]||'—',status:l.status,appr:l.appr,live:!!p.s&&ck.hhmm>=p.s&&ck.hhmm<p.e,ended:!!p.e&&ck.hhmm>=p.e}});
  const sched=new Set(db.prepare('SELECT DISTINCT sched_id i FROM lessons WHERE school_id=? AND date=? AND sched_id IS NOT NULL').all(s,ck.date).map(r=>r.i));
  const inn=new Set(db.prepare('SELECT user_id u FROM gate WHERE school_id=? AND date=? AND in_at IS NOT NULL').all(s,ck.date).map(r=>r.u));
  gate={present:[...sched].filter(i=>inn.has(i)).length,total:sched.size};
  les={total:lessons.length,confirmed:lessons.filter(l=>l.status!='pending').length}}
 pending=n("SELECT COUNT(*) n FROM lessons WHERE school_id=? AND date BETWEEN ? AND ? AND status='replaced' AND appr IS NULL",s,ym+'-01',ym+'-31');
 let exc=null;
 if(pr){const m=SC.monthSummary(s,ym);exc=m.exceptions.length;payroll={amount:m.teachers.reduce((a,t)=>a+(t.amount||0),0),exceptions:exc,locked:m.locked}}
 const fees=pr||req.user.role=='secretary'?one('SELECT COALESCE(SUM(amount),0) a FROM payments WHERE school_id=? AND void=0 AND date BETWEEN ? AND ?',s,ym+'-01',ym+'-31').a:null;
 res.json({now:ck,schoolDay:!!day,term,week:null,st,classes:classes.length,teachers:n("SELECT COUNT(*) n FROM users WHERE school_id=? AND role='teacher' AND active=1",s),avg,missing,pending,gate:pr||req.user.gate?gate:null,lessons:les,payroll,fees,list:lessons})});

app.get('/api/badges',auth(),(req,res)=>{const u=req.user,s=u.school_id,sc=school(req),ck=SC.clock(sc),out={},gate=u.role=='principal'||u.role=='surveillant'||!!u.can_gate;
 if(gate){const L=db.prepare('SELECT spot,spot_res,status,appr FROM lessons WHERE school_id=? AND date=?').all(s,ck.date);
  out.today=L.filter(l=>(l.spot&&!l.spot_res)||(['principal','surveillant'].includes(u.role)&&l.status=='replaced'&&l.appr==null)).length}
 if(['principal','surveillant'].includes(u.role))out.hours=SC.monthSummary(s,ck.date.slice(0,7)).exceptions.filter(x=>x.kind!='backfill').length;
 res.json(out)});
};
