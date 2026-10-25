// Runs a core/web app as a plain Node HTTP server (local use and tests). On Cloudflare the Worker calls app.fetch directly.
const http=require('http'),fs=require('fs'),path=require('path'),{Readable}=require('stream');
const MIME={'.html':'text/html; charset=UTF-8','.js':'application/javascript; charset=UTF-8','.mjs':'application/javascript; charset=UTF-8','.css':'text/css; charset=UTF-8','.json':'application/json; charset=UTF-8','.webmanifest':'application/manifest+json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.svg':'image/svg+xml','.ico':'image/x-icon','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.txt':'text/plain; charset=UTF-8','.map':'application/json','.pdf':'application/pdf'};
function staticReader(dir){const root=path.resolve(dir);
 return async rel=>{let p;try{p=decodeURIComponent(String(rel).split('?')[0])}catch{return null}
  if(p.includes('\0'))return null;const f=path.resolve(root,'.'+(p.startsWith('/')?p:'/'+p));if(f!==root&&!f.startsWith(root+path.sep))return null;
  if(f.split(path.sep).slice(root.split(path.sep).length).some(x=>x.startsWith('.')))return null;
  let st;try{st=fs.statSync(f)}catch{return null}let file=f;if(st.isDirectory()){file=path.join(f,'index.html');try{st=fs.statSync(file)}catch{return null}}if(!st.isFile())return null;
  return{body:fs.readFileSync(file),type:MIME[path.extname(file).toLowerCase()]||'application/octet-stream',mtime:st.mtime}}}
function listen(app,{port=3000,publicDir='public',onListen}={}){
 app.readStatic=staticReader(publicDir);
 const trust=process.env.TRUST_PROXY;
 const server=http.createServer(async(nreq,nres)=>{
  try{
   const xf=String(nreq.headers['x-forwarded-for']||'').split(',').map(x=>x.trim()).filter(Boolean),xp=String(nreq.headers['x-forwarded-proto']||'').split(',')[0].trim();
   const sock=String(nreq.socket.remoteAddress||'').replace(/^::ffff:/,'');
   const ip=trust&&xf.length?xf[xf.length-1]:sock,secure=!!(trust&&xp=='https')||!!nreq.socket.encrypted;
   const host=nreq.headers.host||'localhost';
   const hasBody=!/^(GET|HEAD)$/.test(nreq.method);
   const request=new Request((secure?'https':'http')+'://'+host+nreq.url,{method:nreq.method,headers:Object.fromEntries(Object.entries(nreq.headers).map(([k,v])=>[k,Array.isArray(v)?v.join(', '):v])),body:hasBody?Readable.toWeb(nreq):undefined,duplex:hasBody?'half':undefined});
   const r=await app.fetch(request,{ip,secure});
   const h={};for(const[k,v]of r.headers){if(k=='set-cookie')continue;h[k]=v}
   const sc=r.headers.getSetCookie?r.headers.getSetCookie():[];if(sc.length)h['set-cookie']=sc;
   const buf=r.body?Buffer.from(await r.arrayBuffer()):null;
   if(buf&&!h['content-length']&&!/^(HEAD)$/.test(nreq.method))h['content-length']=buf.length;
   nres.writeHead(r.status,h);nres.end(buf)
  }catch(e){console.error('server error:',e&&e.message);if(!nres.headersSent)nres.writeHead(400,{'content-type':'text/plain'});nres.end('Bad Request')}});
 server.listen(port,()=>{if(onListen)onListen(server)});return server}
module.exports={listen,staticReader,MIME};
