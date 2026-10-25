// Password hashing that runs identically on Node and on Cloudflare Workers (Web Crypto PBKDF2-SHA256).
// Format: pbkdf2$<iterations>$<saltHex>$<hashHex>. Workers cap PBKDF2 at 100,000 iterations.
// Old scrypt hashes ("salt:hash") still verify here and are upgraded on the next successful login.
const crypto=require('crypto'),IT=100000;
const hash=(p,salt=crypto.randomBytes(16).toString('hex'),it=IT)=>`pbkdf2$${it}$${salt}$${crypto.pbkdf2Sync(String(p),salt,it,32,'sha256').toString('hex')}`;
function verify(p,h){try{if(h.startsWith('pbkdf2$')){const[,it,s,k]=h.split('$'),a=Buffer.from(k,'hex'),b=crypto.pbkdf2Sync(String(p),s,+it,a.length,'sha256');return a.length==b.length&&crypto.timingSafeEqual(a,b)}
 const[s,k]=h.split(':'),a=Buffer.from(k,'hex');return crypto.timingSafeEqual(a,crypto.scryptSync(String(p),s,64))}catch{return false}}
const legacy=h=>!String(h).startsWith('pbkdf2$');
module.exports={hash,verify,legacy};
