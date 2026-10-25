// Two-step sign-in: a 6-digit code emailed on a new device, remembered on that device for 30 days.
// Every account needs a real, verified email. There is no manual bypass.
const crypto=require('crypto'),{db,tx}=require('./db'),M=require('./mail'),SEC=require('./secure');
const H=s=>crypto.createHash('sha256').update(String(s)).digest('hex'),E=(res,s,e)=>res.status(s).json({error:e});
const TICKET=15*6e4,CODE=10*6e4,REMEMBER=30*864e5,COOLDOWN=3e4,MAXSEND=5,MAXTRY=5;
const EMAIL=/^[^\s@<>()]+@[^\s@<>()]+\.[^\s@<>()]{2,}$/;
const okEmail=e=>typeof e=='string'&&e.length<=120&&EMAIL.test(e.trim());
const hint=e=>{const[a,b]=String(e).split('@');return(a||'').slice(0,1)+'***@'+(b||'')};
require('./core/jobs').every('auth-cleanup',6e4,()=>{const n=Date.now();db.prepare('DELETE FROM auth_tickets WHERE expires<?').run(n);db.prepare('DELETE FROM trusted_devices WHERE expires<?').run(n)});
// --- tickets: carry a half-finished sign-in between the password step and the code step
function make({user_id=null,owner_id=null,kind}){const tok=crypto.randomBytes(24).toString('hex');
 db.prepare('INSERT INTO auth_tickets(hash,user_id,owner_id,kind,expires) VALUES(?,?,?,?,?)').run(H(tok),user_id,owner_id,kind,Date.now()+TICKET);return tok}
const get=tok=>{const r=db.prepare('SELECT * FROM auth_tickets WHERE hash=?').get(H(tok||''));return r&&r.expires>Date.now()?r:null};
// emails a fresh code to `to`; returns 'ok' | 'wait' | 'many' | 'mail'
async function sendCode(r,to,lang,why){
 if(r.sends>=MAXSEND)return'many';if(Date.now()-r.last_send<COOLDOWN)return'wait';
 const c=String(crypto.randomInt(0,1e6)).padStart(6,'0');
 db.prepare('UPDATE auth_tickets SET code_hash=?,code_expires=?,tries=0,sends=sends+1,last_send=? WHERE hash=?').run(H(r.hash+c),Date.now()+CODE,Date.now(),r.hash);
 const m=M.msg(lang,'code',c,why);return(await M.send({to,subject:m.subject,text:m.text}))?'ok':'mail'}
// checks a typed code; returns the ticket row or an error name
function check(tok,code){const r=get(tok);if(!r)return'expired';
 if(r.tries>=MAXTRY){db.prepare('DELETE FROM auth_tickets WHERE hash=?').run(r.hash);return'many'}
 db.prepare('UPDATE auth_tickets SET tries=tries+1 WHERE hash=?').run(r.hash);
 if(!r.code_hash||r.code_expires<Date.now()||!/^\d{6}$/.test(String(code).trim())||!SEC.same(H(r.hash+String(code).trim()),r.code_hash))return'code';
 db.prepare('DELETE FROM auth_tickets WHERE hash=?').run(r.hash);return r}
// --- trusted devices (cookie "d", 30 days)
const dev=(who)=>who.owner?['owner_id',who.id]:['user_id',who.id];
function trusted(req,who){const t=req.cookies&&req.cookies[who.owner?'od':'d'];if(!t)return false;const[c,id]=dev(who);
 return!!db.prepare(`SELECT 1 FROM trusted_devices WHERE hash=? AND ${c}=? AND expires>?`).get(H(t),id,Date.now())}
function trust(res,who){const t=crypto.randomBytes(24).toString('hex'),[c,id]=dev(who);db.prepare(`INSERT INTO trusted_devices(hash,${c},expires) VALUES(?,?,?)`).run(H(t),id,Date.now()+REMEMBER);
 res.cookie(who.owner?'od':'d',t,SEC.cookieOpts(res,{httpOnly:true,sameSite:'lax',path:who.owner?'/owners':'/',maxAge:REMEMBER}))}
const forget=uid=>{db.prepare('DELETE FROM trusted_devices WHERE user_id=?').run(uid)};
// --- routes
function routes(app,{session,audit}){
 const lg=b=>b&&b.lang=='fr'?'fr':'en';
 const emailTaken=(sid,e,uid)=>!!db.prepare("SELECT 1 FROM users WHERE school_id=? AND active=1 AND id!=? AND lower(email)=?").get(sid,uid||0,e);
 // supply or change the email on a half-finished sign-in (first sign-in of an old account, or a typo at sign-up)
 app.post('/api/auth/email',async(req,res)=>{if(SEC.hit('ae'+req.ip,30,6e5))return E(res,429,'many');
  const r=get(req.body.ticket);if(!r||!r.user_id||!['email','signup'].includes(r.kind))return E(res,410,'expired');
  const u=db.prepare('SELECT * FROM users WHERE id=? AND active=1').get(r.user_id),e=String(req.body.email||'').trim().toLowerCase();
  if(!u)return E(res,410,'expired');if(!okEmail(e))return E(res,400,'email');if(emailTaken(u.school_id,e,u.id))return E(res,409,'email_used');
  db.prepare('UPDATE auth_tickets SET pending=?,last_send=0 WHERE hash=?').run(e,r.hash);
  const s=await sendCode({...r,last_send:0},e,lg(req.body),'verify');if(s!='ok')return E(res,s=='mail'?502:429,s);
  res.json({step:'code',hint:hint(e)})});
 app.post('/api/auth/resend',async(req,res)=>{if(SEC.hit('ar'+req.ip,30,6e5))return E(res,429,'many');
  const r=get(req.body.ticket);if(!r)return E(res,410,'expired');let to,why='login';
  if(r.owner_id){to=process.env.EMAIL||''}else{const u=db.prepare('SELECT email,email_ok FROM users WHERE id=?').get(r.user_id);to=r.pending||(u&&u.email);if(!u||!u.email_ok||r.pending)why='verify'}
  if(!to)return E(res,400,'email');const s=await sendCode(r,to,lg(req.body),why);if(s!='ok')return E(res,s=='mail'?502:429,s);res.json({ok:1,hint:hint(to)})});
 app.post('/api/auth/verify',(req,res)=>{if(SEC.hit('av'+req.ip,60,6e5))return E(res,429,'many');
  const r=check(req.body.ticket,req.body.code);if(typeof r=='string')return E(res,r=='code'?401:r=='many'?429:410,r);
  if(!r.user_id)return E(res,410,'expired');const u=db.prepare('SELECT u.*,s.code scode FROM users u JOIN schools s ON s.id=u.school_id WHERE u.id=? AND u.active=1').get(r.user_id);if(!u)return E(res,410,'expired');
  if(r.pending){if(emailTaken(u.school_id,r.pending,u.id))return E(res,409,'email_used');db.prepare('UPDATE users SET email=? WHERE id=?').run(r.pending,u.id)}
  db.prepare('UPDATE users SET email_ok=1 WHERE id=?').run(u.id);
  trust(res,{id:u.id});session(res,u,u.role);audit(u,r.kind=='signup'?'school.create':'login.2fa');res.json({ok:1,code:u.scode,kind:r.kind})});
 // forgot password: the link goes to the verified email only; the answer never says whether the account exists
 app.post('/api/forgot',async(req,res)=>{if(SEC.hit('fg'+req.ip,10,36e5))return E(res,429,'many');
  const{code='',username=''}=req.body,u=db.prepare('SELECT u.* FROM users u JOIN schools s ON s.id=u.school_id WHERE s.code=? AND u.username=? AND u.active=1').get(String(code).trim().toUpperCase(),String(username).trim());
  if(u&&u.email_ok&&!SEC.hit('fgu'+u.id,3,36e5)){const tok=crypto.randomBytes(24).toString('hex');db.prepare('DELETE FROM reset_tokens WHERE user_id=?').run(u.id);
   db.prepare('INSERT INTO reset_tokens(hash,user_id,expires) VALUES(?,?,?)').run(H(tok),u.id,new Date(Date.now()+36e5).toISOString());
   const base=process.env.BASE_URL||`${req.protocol}://${req.get('host')}`,m=M.msg(lg(req.body),'reset',u.name,`${base}/reset?token=${tok}`);await M.send({to:u.email,subject:m.subject,text:m.text})}
  res.json({ok:1})})}
module.exports={routes,make,get,sendCode,check,trusted,trust,forget,okEmail,hint,EMAIL};
