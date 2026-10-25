// A small Express-compatible web layer on the standard Request/Response objects, so the same routes run on Node and on Cloudflare Workers.
// It covers what this app uses: app.get/post/put/delete/use, Router, :params, async handlers, express.json/raw/static-less, cookies,
// req.{body,query,params,cookies,ip,protocol,secure,path,method,get,headers}, res.{status,json,send,end,write,set,setHeader,cookie,clearCookie,redirect,sendFile,on}.
const{EventEmitter}=require('events'),crypto=require('crypto');
const STATUS={200:'OK',201:'Created',204:'No Content',301:'Moved Permanently',302:'Found',304:'Not Modified',400:'Bad Request',401:'Unauthorized',402:'Payment Required',403:'Forbidden',404:'Not Found',409:'Conflict',413:'Payload Too Large',429:'Too Many Requests',500:'Internal Server Error'};
const parseCookies=h=>{const o={};if(!h)return o;for(const p of h.split(';')){const i=p.indexOf('=');if(i<0)continue;const k=p.slice(0,i).trim();let v=p.slice(i+1).trim();if(v[0]=='"'&&v.endsWith('"'))v=v.slice(1,-1);if(k&&!(k in o)){try{o[k]=decodeURIComponent(v)}catch{o[k]=v}}}return o};
const parseQuery=sp=>{const o={};for(const[k,v]of sp){if(k in o)o[k]=[].concat(o[k],v);else o[k]=v}return o};
const compile=(p,end)=>{const keys=[],src=p.replace(/\/+$/,'').replace(/[.+?^${}()|[\]\\]/g,'\\$&').replace(/:([A-Za-z_][A-Za-z0-9_]*)/g,(_,k)=>(keys.push(k),'([^/]+)'));return{keys,re:new RegExp('^'+src+(end?'/?$':'(?=/|$)'),'i')}};
const matchPath=(c,path)=>{const m=c.re.exec(path);if(!m)return null;const params={};c.keys.forEach((k,i)=>{try{params[k]=decodeURIComponent(m[i+1])}catch{params[k]=m[i+1]}});return{params,len:m[0].replace(/\/+$/,'').length}};

class Res extends EventEmitter{
 constructor(req){super();this.req=req;this.statusCode=200;this.headers=new Map();this.cookies=[];this.chunks=[];this.finished=false;this.headersSent=false;this._done=new Promise(r=>this._resolve=r);this.writable=true}
 status(c){this.statusCode=c;return this}
 setHeader(k,v){this.headers.set(String(k).toLowerCase(),Array.isArray(v)?v.join(', '):String(v));return this}
 getHeader(k){return this.headers.get(String(k).toLowerCase())}
 removeHeader(k){this.headers.delete(String(k).toLowerCase())}
 set(k,v){if(k&&typeof k=='object'){for(const x in k)this.setHeader(x,k[x])}else this.setHeader(k,v);return this}
 header(k,v){return this.set(k,v)}
 type(t){const m={json:'application/json',html:'text/html',pdf:'application/pdf',txt:'text/plain',csv:'text/csv',png:'image/png',jpg:'image/jpeg',webp:'image/webp',zip:'application/zip'};return this.setHeader('content-type',m[t]||t)}
 cookie(n,v,o={}){let s=n+'='+encodeURIComponent(v);if(o.maxAge!=null)s+='; Max-Age='+Math.floor(o.maxAge/1000);s+='; Path='+(o.path||'/');if(o.expires)s+='; Expires='+new Date(o.expires).toUTCString();if(o.httpOnly)s+='; HttpOnly';if(o.secure)s+='; Secure';if(o.sameSite){const x=String(o.sameSite).toLowerCase();s+='; SameSite='+(x=='strict'?'Strict':x=='none'?'None':'Lax')}this.cookies.push(s);return this}
 clearCookie(n,o={}){return this.cookie(n,'',{...o,expires:new Date(1),maxAge:undefined})}
 redirect(a,b){const code=typeof a=='number'?a:302,url=typeof a=='number'?b:a;this.statusCode=code;this.setHeader('location',url);return this.end()}
 // like Express: GET answers carry a weak ETag and a matching If-None-Match gets 304
 _tag(body){const q=this.req;if(!/^(GET|HEAD)$/.test(q.method)||this.statusCode<200||this.statusCode>=300||this.getHeader('etag'))return false;
  const b=Buffer.isBuffer(body)?body:Buffer.from(String(body)),tag='W/"'+b.length.toString(16)+'-'+crypto.createHash('sha1').update(b).digest('base64').slice(0,27)+'"';this.setHeader('etag',tag);
  const inm=q.get('if-none-match');if(inm&&(inm.trim()=='*'||inm.split(/\s*,\s*/).map(x=>x.replace(/^W\//,'')).includes(tag.replace(/^W\//,'')))){this.statusCode=304;this.removeHeader('content-type');this.removeHeader('content-length');return true}return false}
 json(o){if(!this.getHeader('content-type'))this.setHeader('content-type','application/json; charset=utf-8');const body=JSON.stringify(o);return this._tag(body)?this.end():this.end(body)}
 send(b){if(b==null)return this.end();if(Buffer.isBuffer(b)||b instanceof Uint8Array){if(!this.getHeader('content-type'))this.setHeader('content-type','application/octet-stream');return this._tag(b)?this.end():this.end(b)}
  if(typeof b=='object')return this.json(b);if(!this.getHeader('content-type'))this.setHeader('content-type','text/html; charset=utf-8');const body=String(b);return this._tag(body)?this.end():this.end(body)}
 write(c,enc,cb){if(this.finished)return false;if(c!=null&&c.length!==0)this.chunks.push(Buffer.isBuffer(c)?c:c instanceof Uint8Array?Buffer.from(c):Buffer.from(String(c),typeof enc=='string'?enc:'utf8'));const f=typeof enc=='function'?enc:cb;if(f)f();return true}
 end(c,enc,cb){if(this.finished)return this;if(typeof c=='function'){cb=c;c=null}if(c!=null)this.write(c,enc);this.finished=true;this.headersSent=true;
  const body=this.chunks.length?Buffer.concat(this.chunks):null;this._resolve({status:this.statusCode,headers:this.headers,cookies:this.cookies,body});
  this.emit('finish');this.emit('close');if(typeof cb=='function')cb();return this}
sendFile(p,o,cb){const r=this.req.app.readStatic;if(!r){this.status(404);return this.end('Not found')}
  return r(String(p).split(/[\\/]public[\\/]/).pop()).then(f=>{if(!f){this.status(404);return this.end('Not found')}if(f.type&&!this.getHeader('content-type'))this.setHeader('content-type',f.type);this.end(f.body)}).catch(e=>{if(typeof cb=='function')cb(e);else{this.status(500);this.end('Error')}})}
 download(p,name){this.setHeader('content-disposition','attachment; filename="'+String(name||p.split('/').pop()).replace(/"/g,'')+'"');return this.sendFile(p)}
}
class Router{
 constructor(){this.stack=[];const f=(req,res,next)=>f.handle(req,res,next);Object.setPrototypeOf(f,Router.prototype);f.stack=this.stack;f.settings={};return f}
 _add(method,path,fns){const flat=fns.flat(Infinity);if(!flat.length)return this;for(const fn of flat)this.stack.push({method,path:path==null?null:compile(path,method!=='USE'),fn});return this}
 get(p,...f){return this._add('GET',p,f)}post(p,...f){return this._add('POST',p,f)}put(p,...f){return this._add('PUT',p,f)}delete(p,...f){return this._add('DELETE',p,f)}patch(p,...f){return this._add('PATCH',p,f)}
 all(p,...f){return this._add('*',p,f)}
 use(a,...f){if(typeof a=='function'||Array.isArray(a)||(a&&typeof a=='object')){return this._add('USE',null,[a,...f])}return this._add('USE',a,f)}
 set(){return this}disable(){return this}enable(){return this}
 async handle(req,res,done){const stack=this.stack,saveUrl=req.url,saveBase=req.baseUrl,savePath=req.path,saveParams=req.params;let i=0,err=null;
  const restore=()=>{req.url=saveUrl;req.baseUrl=saveBase;req.path=savePath;req.params=saveParams};
  for(;;){
   if(i>=stack.length){restore();return done(err)}
   const L=stack[i++],fn=L.fn,isErr=fn.length==4;if(!!err!==isErr)continue;
   let strip=0;
   if(L.method=='USE'){if(L.path){const m=matchPath(L.path,req.path);if(!m)continue;strip=m.len;req.params={...saveParams,...m.params}}}
   else{if(L.method!='*'&&L.method!=req.method&&!(L.method=='GET'&&req.method=='HEAD'))continue;const m=matchPath(L.path,req.path);if(!m)continue;req.params={...saveParams,...m.params}}
   if(strip){req.baseUrl=(saveBase||'')+req.path.slice(0,strip);req.path=req.path.slice(strip)||'/'}
   const r=await run(fn,err,req,res);
   if(L.method=='USE'){req.baseUrl=saveBase;req.path=savePath}
   if(!r.next)return;err=r.err||null}}
}
// run one handler. Resolves {next:true,err} when it calls next(), or {next:false} once the response has been sent. Sync throws and rejected promises become errors.
function run(fn,err,req,res){return new Promise(resolve=>{let settled=false;const fin=v=>{if(!settled){settled=true;resolve(v)}};
 const nx=e=>fin({next:true,err:e&&e!=='route'?e:null});res._done.then(()=>fin({next:false}));
 try{const r=err?fn(err,req,res,nx):fn(req,res,nx);if(r&&typeof r.then=='function')r.then(()=>{},e=>nx(e||new Error('rejected')))}catch(e){nx(e)}})}
function createApp(){
 const app=new Router();app.isApp=true;app.settings={};app.locals={};
 app.set=(k,v)=>{app.settings[k]=v;return app};app.disable=k=>{app.settings[k]=false;return app};app.enable=k=>{app.settings[k]=true;return app};
 // fetch(Request, env): the one entry both runtimes call. info:{ip,secure} come from the platform adapter.
 app.fetch=async(request,info={})=>{
  const u=new URL(request.url),req={app,request,method:request.method,url:u.pathname+u.search,originalUrl:u.pathname+u.search,baseUrl:'',path:u.pathname,query:parseQuery(u.searchParams),params:{},
   headers:Object.fromEntries(request.headers),cookies:parseCookies(request.headers.get('cookie')),ip:info.ip||'',secure:!!info.secure,protocol:info.secure?'https':'http',body:undefined,get:n=>request.headers.get(n)||undefined,header(n){return this.get(n)}};
  const res=new Res(req);
  const fin=()=>{if(res.finished)return;res.status(404);res.setHeader('content-type','text/html; charset=utf-8');res.end('<!DOCTYPE html><html><body><pre>Cannot '+req.method+' '+req.path.replace(/[<>&]/g,'')+'</pre></body></html>')};
  const fail=e=>{if(res.finished)return;res.status(e&&e.status&&e.status>=400&&e.status<600?e.status:500);res.setHeader('content-type','text/plain; charset=utf-8');res.end(STATUS[res.statusCode]||'Error')};
  try{await app.handle(req,res,e=>e?fail(e):fin())}catch(e){fail(e)}
  if(!res.finished)await Promise.race([res._done,new Promise(r=>setTimeout(r,30000)).then(()=>fin())]);
  const r=await res._done;
  const h=new Headers();for(const[k,v]of r.headers)h.set(k,v);for(const c of r.cookies)h.append('set-cookie',c);
  const noBody=request.method=='HEAD'||[204,304].includes(r.status);
  return new Response(noBody?null:r.body,{status:r.status,headers:h})};
 return app}
// ---- body parsers (same names as Express)
const readBody=async(req,limit)=>{if(req._raw!==undefined)return req._raw;const cl=+req.get('content-length')||0;if(limit&&cl>limit){const e=new Error('request entity too large');e.status=413;throw e}
 const ab=await req.request.arrayBuffer();if(limit&&ab.byteLength>limit){const e=new Error('request entity too large');e.status=413;throw e}return req._raw=Buffer.from(ab)};
const size=l=>typeof l=='number'?l:typeof l=='string'?(m=>m?Math.round(+m[1]*({b:1,kb:1024,mb:1048576}[m[2].toLowerCase()||'b'])):0)(/^([\d.]+)\s*(b|kb|mb)?$/i.exec(l)):0;
const json=(o={})=>async(req,res,next)=>{if(req.body!==undefined&&req._parsedJson)return next();req.body=req.body===undefined?{}:req.body;
 const ct=req.get('content-type')||'';if(/^(GET|HEAD)$/.test(req.method)||!/application\/(.+\+)?json/i.test(ct))return next();
 const b=await readBody(req,size(o.limit||'100kb'));req._parsedJson=1;const s=b.toString('utf8');if(!s.trim()){req.body={};return next()}
 try{req.body=JSON.parse(s)}catch(e){e.status=400;throw e}next()};
const raw=(o={})=>async(req,res,next)=>{const t=o.type;if(typeof t=='function'&&!t(req)){return next()}
 req.body=await readBody(req,size(o.limit||'100kb'));next()};
function express(){return createApp()}
express.Router=()=>new Router();express.json=json;express.raw=raw;express.createApp=createApp;
module.exports=express;module.exports.parseCookies=parseCookies;
// static files: the platform adapter provides app.readStatic(path) -> {body,type,mtime}|null (Node reads public/, Workers asks the assets binding)
express.static=()=>async(req,res,next)=>{if(!/^(GET|HEAD)$/.test(req.method)||!req.app.readStatic)return next();
 const f=await req.app.readStatic(req.path);if(!f)return next();
 const etag='W/"'+f.body.length.toString(16)+'-'+Math.floor((f.mtime?f.mtime.getTime():0)/1000).toString(16)+'"';
 res.setHeader('etag',etag);if(f.mtime)res.setHeader('last-modified',f.mtime.toUTCString());res.setHeader('cache-control','public, max-age=0');res.setHeader('accept-ranges','bytes');if(f.type)res.setHeader('content-type',f.type);
 const inm=req.get('if-none-match'),ims=req.get('if-modified-since');
 if((inm&&inm.split(/\s*,\s*/).includes(etag))||(!inm&&ims&&f.mtime&&Math.floor(f.mtime.getTime()/1000)<=Math.floor(new Date(ims).getTime()/1000))){res.status(304);return res.end()}
 res.end(f.body)};
