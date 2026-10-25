// Background jobs. On Node each job runs on a timer; on Cloudflare timers are off and a cron trigger calls runDue().
const R=require('./runtime'),jobs=[];
const safe=(j)=>{try{const r=j.fn();if(r&&r.catch)r.catch(e=>console.error('job',j.name,e.message))}catch(e){console.error('job',j.name,e.message)}j.last=Date.now()};
function every(name,ms,fn,first){const j={name,ms,fn,last:0};jobs.push(j);
 if(R.timers){const t=setInterval(()=>safe(j),ms);t.unref&&t.unref();if(first!=null){const f=setTimeout(()=>safe(j),first);f.unref&&f.unref()}}return j}
// Cloudflare cron: run every job whose period has passed
function runDue(now=Date.now()){const ran=[];for(const j of jobs)if(now-j.last>=j.ms-1000){safe(j);ran.push(j.name)}return ran}
module.exports={every,runDue,jobs};
