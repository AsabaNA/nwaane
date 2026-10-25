// Image seam. Photos are resized in the browser (public/badge.js phSet): the server only checks and stores what arrives.
// Node can still convert odd uploads and fill old photos because sharp is there; on Cloudflare (runtime.driver set) sharp does not exist.
const R=require('./runtime');
let sharp=null;if(!R.driver){try{const n='sharp';sharp=require(n)}catch{}}
const can=()=>!!sharp;
const isWebp=b=>Buffer.isBuffer(b)&&b.length>12&&b.toString('latin1',0,4)=='RIFF'&&b.toString('latin1',8,12)=='WEBP';
const isJpeg=b=>Buffer.isBuffer(b)&&b.length>3&&b[0]==0xFF&&b[1]==0xD8&&b[2]==0xFF;
// browser upload "SPH1": 4-byte tag, then u32 sizes of main (webp, max 100 KB), print (jpeg) and thumb (96x128), then the three images
function unframe(b){if(!Buffer.isBuffer(b)||b.length<16||b.toString('latin1',0,4)!='SPH1')return null;const m=b.readUInt32BE(4),p=b.readUInt32BE(8),t=b.readUInt32BE(12);
 if(16+m+p+t!==b.length||!m)return{err:'photo_type'};return{main:b.subarray(16,16+m),print:p?b.subarray(16+m,16+m+p):null,thumb:t?b.subarray(16+m+p):null}}
const MAXPHOTO=100*1024,MAXJPG=160*1024,MAXTHUMB=24*1024;
function checkSet(s){if(!s||s.err)return{err:'photo_type'};
 if(!(isWebp(s.main)&&s.main.length<=MAXPHOTO||isJpeg(s.main)&&s.main.length<=MAXJPG))return{err:s.main.length>MAXJPG?'photo_big':'photo_type'};
 if(s.print&&!(isJpeg(s.print)&&s.print.length<=MAXJPG))return{err:'photo_type'};
 if(s.thumb&&!((isWebp(s.thumb)||isJpeg(s.thumb))&&s.thumb.length<=MAXTHUMB))return{err:'photo_type'};return s}
// Node-only helpers
async function webp(input){
 let base;try{base=sharp(input,{failOn:'error',limitInputPixels:80e6}).rotate();const m=await base.metadata();if(!['jpeg','png','webp'].includes(m.format)||!m.width||m.width<60||m.height<60)return{err:'photo_type'}}catch{return{err:'photo_type'}}
 for(const[w,h]of[[480,640],[420,560],[360,480]])for(let q=85;q>=45;q-=10){
  const out=await sharp(input,{limitInputPixels:80e6}).rotate().resize(w,h,{fit:'cover',position:'attention'}).flatten({background:'#fff'}).webp({quality:q,effort:4,smartSubsample:true}).toBuffer();
  if(out.length<=MAXPHOTO)return{buf:out}}
 return{err:'photo_big'}}
const jpeg=b=>sharp(b).jpeg({quality:90,mozjpeg:true}).toBuffer();
const thumb=b=>sharp(b).resize(96,128,{fit:'cover'}).webp({quality:72}).toBuffer();
// Whatever arrives (framed set from the browser, or a single image) -> {main,print,thumb} ready to store, or {err}
async function take(body){if(!Buffer.isBuffer(body)||!body.length)return{err:'photo_type'};
 const f=unframe(body);if(f){const c=checkSet(f);if(c.err)return c;if(can()){try{if(!c.print)c.print=await jpeg(c.main);if(!c.thumb)c.thumb=await thumb(c.main)}catch{}}return c}
 if(!can())return{err:'photo_type'};
 const w=isWebp(body)&&body.length<=MAXPHOTO?{buf:body}:await webp(body);if(w.err)return w;
 let print=null,th=null;try{print=await jpeg(w.buf);th=await thumb(w.buf)}catch{}return{main:w.buf,print,thumb:th}}
module.exports={can,isWebp,isJpeg,unframe,checkSet,take,webp,jpeg,thumb,MAXPHOTO,MAXIN:8*1024*1024};
