// PDF seam. Node uses the pdfkit package as is. The Worker entry sets runtime.pdfkit = {PDFDocument, toBytes} (standard fonts registered, no file system).
// pipe(doc,res) replaces doc.pipe(res): the finished file is collected and sent in one piece, which both runtimes can do.
const R=require('./runtime');
const impl=()=>R.pdfkit||(R.pdfkit={PDFDocument:require(['pdf','kit'].join('')),toBytes:null});   // not a literal require: the Worker bundle must not pull in the Node build of pdfkit
const PDFDocument=new Proxy(function(){},{construct:(_,a)=>new(impl().PDFDocument)(...a),get:(_,k)=>impl().PDFDocument[k]});
const collect=(doc)=>{const{toBytes}=impl();if(toBytes){const p=toBytes(doc);return async()=>Buffer.from(await p)}
 const ch=[],p=new Promise((ok,no)=>{doc.on('data',c=>ch.push(c));doc.on('end',()=>ok(Buffer.concat(ch)));doc.on('error',no)});return()=>p};
// toBuf(doc, fill): run fill() (which draws), end the document, resolve with the bytes
const toBuf=async(doc,fill)=>{const get=collect(doc);fill();doc.end();return get()};
// pipe(doc,res): call before drawing, as doc.pipe(res) was; the response is sent when doc.end() is called
function pipe(doc,res){const get=collect(doc);get().then(b=>res.end(b),e=>{console.error('pdf',e.message);if(!res.headersSent)res.status(500).json({error:'server'});else res.end()});return doc}
module.exports={PDFDocument,toBuf,pipe};
