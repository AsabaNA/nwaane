// Tiny, safe formatter for help articles: "## Heading", blank-line paragraphs, "- bullets", **bold**, [text](https://link) and ![](img:ID) for screenshots.
function hcMd(src){const e=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const inl=s=>e(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>');
 return String(src||'').replace(/\r/g,'').split(/\n{2,}/).map(b=>{b=b.trim();if(!b)return'';
  const im=/^!\[[^\]]*\]\(img:(\d+)\)$/.exec(b);if(im)return`<img class=hc-img src="/help-img/${im[1]}" alt="" loading=lazy>`;
  if(/^## /.test(b))return`<h3>${inl(b.slice(3))}</h3>`;
  const ls=b.split('\n');if(ls.every(l=>/^- /.test(l)))return`<ul>${ls.map(l=>`<li>${inl(l.slice(2))}</li>`).join('')}</ul>`;
  return`<p>${ls.map(inl).join('<br>')}</p>`}).join('')}
