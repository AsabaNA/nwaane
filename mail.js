// Email sender. Production: Resend (RESEND_API_KEY, MAIL_FROM). Development without a key: the message is printed in the server console.
// Tests: MAIL_DEBUG_FILE=/path appends every message as a JSON line instead of sending.
const fs=require('fs');
const FROM=()=>process.env.MAIL_FROM||'School Platform <onboarding@resend.dev>';
const configured=()=>!!(process.env.RESEND_API_KEY||process.env.MAIL_DEBUG_FILE||process.env.NODE_ENV!='production');
async function send({to,subject,text}){
 if(process.env.MAIL_DEBUG_FILE){fs.appendFileSync(process.env.MAIL_DEBUG_FILE,JSON.stringify({to,subject,text})+'\n');return true}
 if(!process.env.RESEND_API_KEY){
  if(process.env.NODE_ENV=='production'){console.error('mail: RESEND_API_KEY is not set, cannot send to',to);return false}
  console.log(`\n--- email (not sent: no RESEND_API_KEY) ---\nTo: ${to}\nSubject: ${subject}\n\n${text}\n---\n`);return true}
 try{const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+process.env.RESEND_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({from:FROM(),to:[to],subject,text})});
  if(!r.ok){console.error('mail: Resend refused',r.status,(await r.text()).slice(0,200));return false}return true}
 catch(e){console.error('mail: send failed',e.message);return false}}
// 6-digit code email, EN/FR
const T={en:{code:(c,why)=>({subject:`${c} is your School Platform code`,text:`Your School Platform code is ${c}.\n\n${why}\nIt works for 10 minutes. If you did not try to sign in, ignore this email and tell your principal.`}),
  why:{login:'Enter it to finish signing in on this device.',verify:'Enter it to confirm this email address.'},
  reset:(n,u)=>({subject:'Reset your School Platform password',text:`Hello ${n},\n\nSet a new password here (works once, expires in 1 hour):\n${u}\n\nIf you did not ask for this, ignore this email.`})},
 fr:{code:(c,why)=>({subject:`${c} est votre code School Platform`,text:`Votre code School Platform est ${c}.\n\n${why}\nIl est valable 10 minutes. Si vous n'essayez pas de vous connecter, ignorez cet e-mail et prévenez votre directeur.`}),
  why:{login:'Saisissez-le pour terminer la connexion sur cet appareil.',verify:'Saisissez-le pour confirmer cette adresse e-mail.'},
  reset:(n,u)=>({subject:'Réinitialisez votre mot de passe School Platform',text:`Bonjour ${n},\n\nChoisissez un nouveau mot de passe ici (valable une fois, expire dans 1 heure) :\n${u}\n\nSi vous n'avez rien demandé, ignorez cet e-mail.`})}};
const msg=(lang,kind,...a)=>{const l=T[lang]||T.en;return kind=='reset'?l.reset(...a):l.code(a[0],l.why[a[1]])};
module.exports={send,msg,configured};
