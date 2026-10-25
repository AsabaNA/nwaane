// Local entry point: plain Node + SQLite. The Cloudflare entry (R4) loads the same app.js.
const app=require('./app');
require('./core/serve-node').listen(app,{port:process.env.PORT||3000,publicDir:'public',onListen:()=>console.log('http://localhost:'+(process.env.PORT||3000))});
