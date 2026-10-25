// One colour system for every timetable (screen and PDF): a few clearly different pale colours; once they run out the same colours come
// back with a distinct shape in the corner, so two teachers (or subjects) never look alike. Index = rank of the id among the school's teachers.
const{db}=require('./db');
const COLORS=[{bg:'#f7b6c0',fg:'#570f1b'},{bg:'#f7d4b6',fg:'#57310f'},{bg:'#f7eeb6',fg:'#574d0f'},{bg:'#b6f7bb',fg:'#0f5715'},{bg:'#b6f7ee',fg:'#0f574d'},{bg:'#b6d8f7',fg:'#0f3557'},{bg:'#cdb6f7',fg:'#290f57'},{bg:'#f7b6f1',fg:'#570f51'}];
// 100 x 100 paths
const SHAPES={triangle:'M50 6 L96 92 L4 92 Z',square:'M12 12 H88 V88 H12 Z',circle:'M50 6 A44 44 0 1 0 50.01 6 Z',diamond:'M50 2 L98 50 L50 98 L2 50 Z',star:'M50 3 L62 37 L98 38 L69 59 L80 94 L50 73 L20 94 L31 59 L2 38 L38 37 Z',cross:'M35 4 H65 V35 H96 V65 H65 V96 H35 V65 H4 V35 H35 Z',hexagon:'M26 6 H74 L98 50 L74 94 H26 L2 50 Z'};
const ORDER=Object.keys(SHAPES);
// colour + shape for the i-th item (0-based)
const slot=i=>{const c=COLORS[i%COLORS.length],r=Math.floor(i/COLORS.length);return{...c,shape:r?ORDER[(r-1)%ORDER.length]:null}};
function teacherIdx(sid){const m={};db.prepare("SELECT id FROM users WHERE school_id=? AND role='teacher' ORDER BY id").all(sid).forEach((u,i)=>m[u.id]=i);return m}
// "Physics (F1A, F2A) · Biology (F3A)" for each teacher
function loads(sid){const m={};for(const r of db.prepare("SELECT s.teacher_id t,s.name subj,COALESCE(NULLIF(c.short,''),c.name) cls FROM subjects s JOIN classes c ON c.id=s.class_id WHERE s.school_id=? AND s.teacher_id IS NOT NULL ORDER BY c.name,s.name").all(sid)){const a=(m[r.t]??={}),k=r.subj;(a[k]??=[]).push(r.cls)}
 const out={};for(const t in m)out[t]=Object.entries(m[t]).map(([s,c])=>s+' ('+c.join(', ')+')').join(' · ');return out}
const payload=sid=>({colors:COLORS,shapes:SHAPES,order:ORDER,idx:teacherIdx(sid),loads:loads(sid)});
// pdfkit: draw a shape inside a box
function drawShape(doc,name,x,y,size,color){const p=SHAPES[name];if(!p)return;doc.save();doc.translate(x,y).scale(size/100).path(p).fill(color);doc.restore()}
module.exports={COLORS,SHAPES,ORDER,slot,teacherIdx,loads,payload,drawShape};
