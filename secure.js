// Security hardening: headers, cross-site request check, Secure cookies, rate limits, constant-time compare.
const crypto=require('crypto');
const PROD=process.env.NODE_ENV=='production';
// constant-time string compare (digests have equal length, so no length leak)
const same=(a,b)=>{const h=s=>crypto.createHash('sha256').update(String(s)).digest();return crypto.timingSafeEqual(h(a),h(b))};
// cookies are Secure whenever the request came over HTTPS (behind a proxy: set TRUST_PROXY=1)
const cookieOpts=(res,o)=>({...o,secure:!!(res.req&&res.req.secure)||PROD});
// fixed-window limiter by key: hit(key,max,ms) -> true when over the limit
const W=new Map();require('./core/jobs').every('limiter-cleanup',6e4,()=>{const n=Date.now();for(const[k,v]of W)if(v.t<n)W.delete(k)});
const hit=(key,max,ms)=>{const n=Date.now();let v=W.get(key);if(!v||v.t<n){v={c:0,t:n+ms};W.set(key,v)}v.c++;return v.c>max};
const clear=key=>W.delete(key);
function harden(app){
 if(process.env.TRUST_PROXY)app.set('trust proxy',process.env.TRUST_PROXY=='1'?1:process.env.TRUST_PROXY);
 app.disable('x-powered-by');
 app.use((req,res,next)=>{
  res.set({'X-Content-Type-Options':'nosniff','X-Frame-Options':'SAMEORIGIN','Referrer-Policy':'same-origin','Permissions-Policy':'camera=(self), geolocation=(self), microphone=()',
   'Content-Security-Policy':"frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self'"});
  if(req.secure||PROD)res.set('Strict-Transport-Security','max-age=15552000');
  // block cross-site writes: a browser-sent Origin must be this site
  if(!/^(GET|HEAD|OPTIONS)$/.test(req.method)){const o=req.get('origin');if(o){let h='';try{h=new URL(o).host}catch{}if(h!=req.get('host'))return res.status(403).json({error:'origin'})}}
  next()});
}
module.exports={same,cookieOpts,hit,clear,harden,PROD};
