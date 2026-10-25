// Platform switches. The Node server leaves everything as is; the Cloudflare Worker sets these before the app modules load.
module.exports={driver:null,storage:null,timers:true,env:{}};
