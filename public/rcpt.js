// Fee receipts: print on a POS roll (80 or 58 mm) straight from the browser, with a QR code that opens the public check page.
Object.assign(D.en,{rc_print:'Print receipt',rc_pdf:'A5 PDF',rc_t:'RECEIPT',rc_no:'No.',rc_dup:'DUPLICATE',rc_void:'VOID',rc_date:'Date',rc_st:'Student',rc_mat:'Matricule',rc_cls:'Class',rc_amt:'Amount received',rc_how:'Paid by',rc_due:'Total fees this year',rc_paid:'Paid so far',rc_rem:'Remaining',rc_by:'Received by',rc_sign:'Signature and stamp',rc_scan:'Scan to check this receipt',
 rc_paper:'Receipt printer paper',rc_p80:'80 mm roll',rc_p58:'58 mm roll',rc_paperh:'Receipts print through your browser’s print dialog, so any printer installed on the computer or phone works. Pick the roll your printer uses.',rc_ps:'Saved.'});
Object.assign(D.fr,{rc_print:'Imprimer le reçu',rc_pdf:'PDF A5',rc_t:'REÇU',rc_no:'N°',rc_dup:'DUPLICATA',rc_void:'ANNULÉ',rc_date:'Date',rc_st:'Élève',rc_mat:'Matricule',rc_cls:'Classe',rc_amt:'Montant reçu',rc_how:'Payé par',rc_due:'Total des frais de l’année',rc_paid:'Payé à ce jour',rc_rem:'Reste à payer',rc_by:'Reçu par',rc_sign:'Signature et cachet',rc_scan:'Scannez pour vérifier ce reçu',
 rc_paper:'Papier de l’imprimante de reçus',rc_p80:'Rouleau 80 mm',rc_p58:'Rouleau 58 mm',rc_paperh:'Les reçus s’impriment via la fenêtre d’impression du navigateur : toute imprimante installée sur l’ordinateur ou le téléphone convient. Choisissez le rouleau de votre imprimante.',rc_ps:'Enregistré.'});
const rcFm=n=>String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
function rcHtml(d){const w=d.w==58?58:80,pw=w==58?48:72,fs=w==58?10:11.5,e=esc,row=(a,b)=>`<div class=r><span>${e(a)}</span><b>${e(b)}</b></div>`;
 return`<!doctype html><html><head><meta charset=utf-8><title>${t('rc_t')} ${d.no}</title><style>
 @page{margin:2mm 0}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff}
 body{width:${pw}mm;margin:0 auto;font:${fs}px/1.35 Arial,Helvetica,sans-serif;color:#000}
 .c{text-align:center}.h1{font-weight:700;font-size:${fs+2}px;text-transform:uppercase}.sm{font-size:${fs-1.5}px}
 .t{font-weight:700;font-size:${fs+3}px;margin:6px 0 2px}.tag{display:inline-block;border:1.5px solid #000;padding:1px 8px;font-weight:700;margin:3px 0;letter-spacing:.06em}
 hr{border:0;border-top:1px dashed #000;margin:6px 0}.r{display:flex;justify-content:space-between;gap:8px}.r b{text-align:right}
 .amt{font-size:${fs+5}px;font-weight:700;text-align:center;margin:4px 0}.q{display:block;width:${w==58?26:30}mm;height:${w==58?26:30}mm;margin:6px auto 2px}.sg{margin-top:16px;border-top:1px solid #000;padding-top:2px}
 ${d.void?'.vd{font-size:'+(fs+8)+'px;font-weight:700;text-align:center;border:2px solid #000;padding:2px;margin:6px 0;letter-spacing:.1em}':''}</style></head><body>
 <div class=c><div class=h1>${e(d.head[0]||'')}</div>${d.head.slice(1).map(x=>`<div class=sm>${e(x)}</div>`).join('')}<div class=t>${t('rc_t')} ${t('rc_no')} ${d.no}</div>${d.dup?`<div class=tag>${t('rc_dup')}</div>`:''}</div>
 ${d.void?`<div class=vd>${t('rc_void')}</div>`:''}<hr>${row(t('rc_date'),d.date)}${row(t('rc_st'),d.student)}${row(t('rc_mat'),d.matricule||'')}${row(t('rc_cls'),d.cls)}<hr>
 <div class=c>${t('rc_amt')}</div><div class=amt>${rcFm(d.amount)} FCFA</div>${row(t('rc_how'),t('f_'+d.method)+(d.ref?' · '+d.ref:''))}<hr>
 ${row(t('rc_due'),rcFm(d.due))}${row(t('rc_paid'),rcFm(d.paid))}${row(t('rc_rem'),rcFm(d.rem))}<hr>${row(t('rc_by'),d.by)}<div class="sg sm">${t('rc_sign')}</div>
 <img class=q src="${d.qr}" alt=""><div class="c sm">${t('rc_scan')}<br><b>${e(d.code)}</b></div><div style="height:6mm"></div></body></html>`}
// print through a hidden frame; afterwards count the print so that the next one says DUPLICATE
async function rcPrint(id){const r=await api('fees/receipt/data?id='+id);if(!r.ok)return alert(em(r.s,r.d.error));
 const old=document.getElementById('rcfr');if(old)old.remove();const fr=document.createElement('iframe');fr.id='rcfr';fr.setAttribute('aria-hidden','true');fr.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0';document.body.appendChild(fr);
 fr.onload=()=>{setTimeout(()=>{try{fr.contentWindow.focus();fr.contentWindow.print();api('fees/receipt/printed',{id})}catch{}},250)};fr.srcdoc=rcHtml(r.d)}
