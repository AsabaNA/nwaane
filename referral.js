// Referral programme: referrers sign up, share a code; a referred school gets 10% off for its first year and the referrer earns 10% of what that school pays.
const crypto=require('crypto'),SEC=require('./secure'),{db,hash,verify}=require('./db'),A2=require('./auth2'),SC=require('./sched');
const PCT=10,ALPHA='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const now=()=>new Date().toISOString(),E=(res,s,e)=>res.status(s).json({error:e}),norm=c=>String(c||'').trim().toUpperCase().replace(/\s+/g,'');
const newCode=()=>{let c;do{c='R-'+Array.from(crypto.randomBytes(6),b=>ALPHA[b%ALPHA.length]).join('')}while(db.prepare('SELECT 1 FROM referrers WHERE code=?').get(c));return c};
const byCode=c=>db.prepare('SELECT * FROM referrers WHERE code=? AND active=1 AND email_ok=1').get(norm(c));
// a school's year: invoices for terms that start on or before ref_until carry the discount and earn commission
const applies=(sc,termStart)=>!!(sc&&sc.ref_id&&sc.ref_until&&termStart<=sc.ref_until);
const until=date=>SC.addDays(date,365);
function earn(pid){const p=db.prepare('SELECT * FROM bill_payments WHERE id=?').get(pid);if(!p)return;const i=db.prepare('SELECT * FROM invoices WHERE id=?').get(p.invoice_id),sc=db.prepare('SELECT ref_id FROM schools WHERE id=?').get(p.school_id);
 if(!i||!sc||!sc.ref_id||i.term<=0||!i.ref_pct)return;
 db.prepare('INSERT OR IGNORE INTO referral_earnings(referrer_id,school_id,payment_id,base,amount,created) VALUES(?,?,?,?,?,?)').run(sc.ref_id,p.school_id,pid,p.amount,Math.round(p.amount*PCT/100),now())}
const totals=id=>{const e=db.prepare('SELECT COALESCE(SUM(amount),0) a FROM referral_earnings WHERE referrer_id=?').get(id).a,p=db.prepare('SELECT COALESCE(SUM(amount),0) a FROM referral_payouts WHERE referrer_id=?').get(id).a;return{earned:e,paid:p,payable:e-p}};
function mine(req){const t=req.cookies&&req.cookies.r;if(!t)return null;const x=db.prepare('SELECT r.*,s.created sess FROM referrer_sessions s JOIN referrers r ON r.id=s.referrer_id WHERE s.token=? AND r.active=1 AND r.email_ok=1').get(t);
 if(!x)return null;if(Date.now()-Date.parse(x.sess.replace(' ','T')+'Z')>7*864e5){db.prepare('DELETE FROM referrer_sessions WHERE token=?').run(t);return null}return x}
const login=(res,r)=>{const t=crypto.randomBytes(32).toString('hex');db.prepare('INSERT INTO referrer_sessions(token,referrer_id) VALUES(?,?)').run(t,r.id);res.cookie('r',t,SEC.cookieOpts(res,{httpOnly:true,sameSite:'lax',path:'/',maxAge:7*864e5}))};
const EMAIL=/^[^\s@<>()]+@[^\s@<>()]+\.[^\s@<>()]{2,}$/;
module.exports=app=>{
 app.get('/ref',(req,res)=>res.sendFile(require('path').join(__dirname,'public','ref.html')));
 app.get('/api/ref/check',(req,res)=>{if(SEC.hit('rc'+req.ip,40,6e5))return E(res,429,'many');const r=byCode(req.query.code);r?res.json({ok:1,pct:PCT}):E(res,404,'refcode')});
 app.post('/api/ref/signup',async(req,res)=>{if(SEC.hit('rs'+req.ip,8,36e5))return E(res,429,'many');
  const name=String(req.body.name||'').trim().slice(0,80),email=String(req.body.email||'').trim().toLowerCase(),phone=String(req.body.phone||'').trim().slice(0,30),pw=String(req.body.password||'');
  if(!name)return E(res,400,'required');if(!A2.okEmail(email))return E(res,400,'email');if(pw.length<8)return E(res,400,'pw');
  if(db.prepare('SELECT 1 FROM referrers WHERE email=?').get(email))return E(res,409,'taken');
  const id=db.prepare('INSERT INTO referrers(code,name,email,phone,pw,created) VALUES(?,?,?,?,?,?)').run(newCode(),name,email,phone,hash(pw),now()).lastInsertRowid;
  const tk=A2.make({kind:'referrer'});db.prepare('UPDATE auth_tickets SET pending=? WHERE hash=?').run(String(id),A2.get(tk).hash);
  const sent=await A2.sendCode(A2.get(tk),email,req.body.lang=='fr'?'fr':'en','verify');res.json({ticket:tk,hint:A2.hint(email),sent:sent=='ok'})});
 app.post('/api/ref/resend',async(req,res)=>{if(SEC.hit('rr'+req.ip,20,36e5))return E(res,429,'many');const r=A2.get(req.body.ticket);if(!r||r.kind!='referrer')return E(res,410,'expired');
  const x=db.prepare('SELECT email FROM referrers WHERE id=?').get(+r.pending);if(!x)return E(res,410,'expired');const s=await A2.sendCode(r,x.email,req.body.lang=='fr'?'fr':'en','verify');
  s=='ok'?res.json({ok:1}):E(res,s=='wait'?429:s=='many'?429:502,s=='wait'?'wait':s=='many'?'many':'mail')});
 app.post('/api/ref/verify',(req,res)=>{if(SEC.hit('rv'+req.ip,30,9e5))return E(res,429,'many');const r=A2.check(req.body.ticket,req.body.code);
  if(typeof r=='string')return E(res,r=='code'?401:r=='many'?429:410,r);if(r.kind!='referrer')return E(res,410,'expired');
  const x=db.prepare('SELECT * FROM referrers WHERE id=? AND active=1').get(+r.pending);if(!x)return E(res,410,'expired');db.prepare('UPDATE referrers SET email_ok=1 WHERE id=?').run(x.id);login(res,x);res.json({ok:1})});
 app.post('/api/ref/login',async(req,res)=>{const email=String(req.body.email||'').trim().toLowerCase();if(SEC.hit('rl'+req.ip,30,6e5)||SEC.hit('rle'+email,8,6e5))return E(res,429,'many');
  const x=db.prepare('SELECT * FROM referrers WHERE email=? AND active=1').get(email);if(!x||!verify(String(req.body.password||''),x.pw))return E(res,401,'login');
  if(!x.email_ok){const tk=A2.make({kind:'referrer'});db.prepare('UPDATE auth_tickets SET pending=? WHERE hash=?').run(String(x.id),A2.get(tk).hash);const s=await A2.sendCode(A2.get(tk),x.email,req.body.lang=='fr'?'fr':'en','verify');return res.json({step:'code',ticket:tk,hint:A2.hint(x.email),sent:s=='ok'})}
  login(res,x);res.json({ok:1})});
 app.post('/api/ref/logout',(req,res)=>{db.prepare('DELETE FROM referrer_sessions WHERE token=?').run(req.cookies.r||'');res.clearCookie('r',{path:'/'});res.json({ok:1})});
 app.get('/api/ref/me',(req,res)=>{const r=mine(req);if(!r)return E(res,401,'auth');const today=now().slice(0,10);
  const schools=db.prepare('SELECT s.id,s.name,s.created,s.ref_until,s.trial_ends,COALESCE((SELECT SUM(amount) FROM referral_earnings e WHERE e.school_id=s.id AND e.referrer_id=?),0) earned FROM schools s WHERE s.ref_id=? ORDER BY s.id DESC').all(r.id,r.id)
   .map(s=>({name:s.name,since:String(s.created||'').slice(0,10),until:s.ref_until,state:s.trial_ends&&today<=s.trial_ends.slice(0,10)?'free':(s.ref_until&&today<=s.ref_until?'paying':'ended'),earned:s.earned}));
  res.json({name:r.name,email:r.email,code:r.code,pct:PCT,...totals(r.id),schools,payouts:db.prepare('SELECT amount,method,ref,created FROM referral_payouts WHERE referrer_id=? ORDER BY id DESC LIMIT 50').all(r.id).map(p=>({...p,created:p.created.slice(0,10)}))})});
};
module.exports.ownerApi=(R,{need,log,E:Er})=>{const M=['owner','finance'];
 R.get('/referrers',need(M),(req,res)=>res.json(db.prepare('SELECT id,code,name,email,phone,active,email_ok,created FROM referrers ORDER BY id DESC').all().map(r=>({...r,created:r.created.slice(0,10),...totals(r.id),schools:db.prepare('SELECT COUNT(*) n FROM schools WHERE ref_id=?').get(r.id).n}))));
 R.post('/referrers/:id/payout',need(M),(req,res)=>{const r=db.prepare('SELECT * FROM referrers WHERE id=?').get(+req.params.id);if(!r)return Er(res,404,'none');const a=Math.round(+req.body.amount),t=totals(r.id);
  if(!(a>0)||a>t.payable||!['momo','om','bank','cash','other'].includes(req.body.method))return Er(res,400,'invalid');if(['momo','om','bank'].includes(req.body.method)&&!String(req.body.ref||'').trim())return Er(res,400,'ref');
  db.prepare('INSERT INTO referral_payouts(referrer_id,amount,method,ref,note,by_name,created) VALUES(?,?,?,?,?,?,?)').run(r.id,a,req.body.method,String(req.body.ref||'').trim().slice(0,60),String(req.body.note||'').trim().slice(0,200),req.o.name,now());
  log(req.o,'referral.payout',null,`${r.code} ${a} ${req.body.method}`);res.json({ok:1})});
 R.post('/referrers/:id/active',need(['owner']),(req,res)=>{const r=db.prepare('SELECT id,code FROM referrers WHERE id=?').get(+req.params.id);if(!r)return Er(res,404,'none');const on=req.body.on?1:0;db.prepare('UPDATE referrers SET active=? WHERE id=?').run(on,r.id);if(!on)db.prepare('DELETE FROM referrer_sessions WHERE referrer_id=?').run(r.id);log(req.o,on?'referral.enable':'referral.disable',null,r.code);res.json({ok:1})})};
module.exports.PCT=PCT;module.exports.applies=applies;module.exports.until=until;module.exports.earn=earn;module.exports.byCode=byCode;
