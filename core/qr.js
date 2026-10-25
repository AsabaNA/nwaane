// QR codes as PNG without node-only code (the qrcode package's toBuffer needs Node). Same call shapes as qrcode: toBuffer(text,{margin,width}), toDataURL.
const Core=require('qrcode/lib/core/qrcode'),{zlibSync}=require('fflate');
const T=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
const crc=b=>{let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=T[(c^b[i])&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0};
const chunk=(type,data)=>{const o=Buffer.alloc(12+data.length);o.writeUInt32BE(data.length,0);o.write(type,4,'latin1');Buffer.from(data).copy(o,8);o.writeUInt32BE(crc(o.subarray(4,8+data.length)),8+data.length);return o};
function png(text,o={}){const margin=o.margin??4,q=Core.create(String(text),{errorCorrectionLevel:o.errorCorrectionLevel||'M'}),n=q.modules.size,tot=n+2*margin,sc=Math.max(1,Math.floor((o.width||tot*4)/tot)),W=tot*sc,raw=new Uint8Array(W*(W+1)).fill(255);
 for(let y=0;y<W;y++){raw[y*(W+1)]=0;const r=Math.floor(y/sc)-margin;if(r<0||r>=n)continue;for(let x=0;x<W;x++){const c=Math.floor(x/sc)-margin;if(c>=0&&c<n&&q.modules.get(r,c))raw[y*(W+1)+1+x]=0}}
 const ih=Buffer.alloc(13);ih.writeUInt32BE(W,0);ih.writeUInt32BE(W,4);ih[8]=8;ih[9]=0;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ih),chunk('IDAT',zlibSync(raw)),chunk('IEND',Buffer.alloc(0))])}
module.exports={toBuffer:async(t,o)=>png(t,o),toDataURL:async(t,o)=>'data:image/png;base64,'+png(t,o).toString('base64'),png};
