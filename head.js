// Letterhead of every printed document: line 0 is the school name (Settings → School name, upper-cased);
// the next lines are the optional extras from Settings → "Under the name" (motto, address, phone).
module.exports=sc=>[String(sc.name||'').trim().toUpperCase(),...String(sc.header||'').split('\n').map(s=>s.trim()).filter(Boolean)].filter((v,i)=>i||v);
