(()=>{'use strict';
const $=id=>document.getElementById(id), canvas=$('room'),ctx=canvas.getContext('2d');
let room={w:4,l:6,h:2.5,polygon:[{x:0,y:0},{x:4,y:0},{x:4,y:6},{x:0,y:6}]},points=[],scan=0,running=false,drag=-1,last=0,raf=0;
let objects=[],nextObjectId=1;
const DXF_UNIT_SCALE={mm:.001,cm:.01,m:1,in:.0254,ft:.3048};
function parseClosedDxfPolylines(text,scale){
 if(typeof text!=='string'||text.length>20000000)throw Error('DXF 檔案無效或超過 20 MB');
 const lines=text.replace(/^\uFEFF/,'').split(/\r?\n/);if(lines.at(-1)?.trim()==='')lines.pop();if(lines.length<4||lines.length%2!==0)throw Error('不是有效的 ASCII DXF 群組碼檔案');
 const pairs=[];for(let i=0;i<lines.length;i+=2){const code=Number(lines[i].trim());if(Number.isInteger(code))pairs.push([code,lines[i+1].trim()])}
 let inside=false,cur=null;const ents=[];
 for(const [code,val] of pairs){if(code===0&&val==='SECTION'){cur=null;continue}if(code===2&&val==='ENTITIES'){inside=true;continue}if(code===0&&val==='ENDSEC'){if(cur)ents.push(cur);cur=null;inside=false;continue}if(!inside)continue;if(code===0){if(cur)ents.push(cur);cur={kind:val,fields:[]}}else if(cur)cur.fields.push([code,val])}
 if(cur)ents.push(cur);const result=[];
 for(const e of ents){if(e.kind!=='LWPOLYLINE'||!e.fields.some(([c,v])=>c===70&&(Number(v)&1)))continue;let layer='0',verts=[],x=null;
  for(const [c,v] of e.fields){if(c===8)layer=v.slice(0,80);if(c===10){if(x!==null)throw Error('DXF 頂點座標配對錯誤');x=Number(v)}if(c===20&&x!==null){const y=Number(v);if(!Number.isFinite(x)||!Number.isFinite(y))throw Error('DXF 含有非數值座標');verts.push([x*scale,y*scale]);x=null}}
  if(x!==null)throw Error('DXF 有未完成的頂點座標');if(verts.length>1&&Math.hypot(verts[0][0]-verts.at(-1)[0],verts[0][1]-verts.at(-1)[1])<1e-9)verts.pop();if(verts.length<3)continue;if(verts.length>5000)throw Error('單一輪廓頂點超過 5000');
  const xs=verts.map(p=>p[0]),ys=verts.map(p=>p[1]),minX=Math.min(...xs),minY=Math.min(...ys),maxX=Math.max(...xs),maxY=Math.max(...ys);if(maxX-minX<.001||maxY-minY<.001)continue;
  const vertices=verts.map(p=>({x:p[0]-minX,y:p[1]-minY}));const area=vertices.reduce((s,p,i)=>{const q=vertices[(i+1)%vertices.length];return s+p.x*q.y-q.x*p.y},0)/2;if(Math.abs(area)<1e-6)continue;
  result.push({layer,name:'CAD '+layer,vertices,w:maxX-minX,d:maxY-minY,sourceMinX:minX,sourceMinY:minY});
 }
 if(!result.length)throw Error('找不到有效封閉 LWPOLYLINE；請在 CAD 將設備外框閉合後另存 ASCII DXF');if(result.length>200)throw Error('封閉輪廓超過 200 個，請分批匯入');
 const globalMinX=Math.min(...result.map(s=>s.sourceMinX)),globalMinY=Math.min(...result.map(s=>s.sourceMinY));
 return result.map(s=>({...s,offsetX:s.sourceMinX-globalMinX,offsetY:s.sourceMinY-globalMinY}));
}
function rotateDxfGroup(shapes,degrees){
 if(!Number.isFinite(degrees)||degrees < -360||degrees > 360)throw Error('旋轉角度須介於 -360° 至 360°');
 const rad=degrees*Math.PI/180;if(Math.abs(rad)<1e-12)return shapes;
 const maxX=Math.max(...shapes.map(s=>s.offsetX+s.w)),maxY=Math.max(...shapes.map(s=>s.offsetY+s.d)),cx=maxX/2,cy=maxY/2;
 const rotated=shapes.map(s=>{const pts=s.vertices.map(p=>{const x=s.offsetX+p.x-cx,y=s.offsetY+p.y-cy;return{x:x*Math.cos(rad)-y*Math.sin(rad)+cx,y:x*Math.sin(rad)+y*Math.cos(rad)+cy}});return{...s,_points:pts}});
 const all=rotated.flatMap(s=>s._points),minX=Math.min(...all.map(p=>p.x)),minY=Math.min(...all.map(p=>p.y));
 return rotated.map(s=>{const sx=Math.min(...s._points.map(p=>p.x)),sy=Math.min(...s._points.map(p=>p.y)),ex=Math.max(...s._points.map(p=>p.x)),ey=Math.max(...s._points.map(p=>p.y));return{...s,offsetX:sx-minX,offsetY:sy-minY,w:ex-sx,d:ey-sy,vertices:s._points.map(p=>({x:p.x-sx,y:p.y-sy})) ,_points:undefined}});
}

const defaults=()=>[{x:.5,y:.4,z:0},{x:3.5,y:.4,z:0},{x:3.5,y:5.5,z:0},{x:.5,y:5.5,z:0}];
function initPoints(){points=defaults().map(p=>({...p}));renderPoints();draw()}
function validDims(){let w=+$('width').value,l=+$('length').value,h=+$('height').value;if(![w,l,h].every(Number.isFinite)||w<1||w>30||l<1||l>30||h<1||h>10){log('尺寸無效：寬／長 1–30 m，高 1–10 m。');return false}room={w,l,h};points.forEach(p=>{p.x=Math.min(room.w,Math.max(0,p.x));p.y=Math.min(room.l,Math.max(0,p.y));p.z=Math.min(room.h,Math.max(0,p.z))});return true}
function polygonArea(poly){return Math.abs(poly.reduce((s,p,i)=>{const q=poly[(i+1)%poly.length];return s+p.x*q.y-q.x*p.y},0)/2)}
function volume(){return polygonArea(room.polygon||[{x:0,y:0},{x:room.w,y:0},{x:room.w,y:room.l},{x:0,y:room.l}])*room.h}
function orient2d(a,b,c){return (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)}
function segmentsIntersect(a,b,c,d,eps=1e-9){
 const o1=orient2d(a,b,c),o2=orient2d(a,b,d),o3=orient2d(c,d,a),o4=orient2d(c,d,b);
 const on=(p,q,r)=>Math.abs(orient2d(p,q,r))<=eps&&r.x>=Math.min(p.x,q.x)-eps&&r.x<=Math.max(p.x,q.x)+eps&&r.y>=Math.min(p.y,q.y)-eps&&r.y<=Math.max(p.y,q.y)+eps;
 if(((o1>eps&&o2< -eps)||(o1< -eps&&o2>eps))&&((o3>eps&&o4< -eps)||(o3< -eps&&o4>eps)))return true;
 return on(a,b,c)||on(a,b,d)||on(c,d,a)||on(c,d,b);
}
function polygonSelfIntersects(poly){
 for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length];if(Math.hypot(a.x-b.x,a.y-b.y)<1e-6)return true;
  for(let j=i+1;j<poly.length;j++){if(j===i||(j+1)%poly.length===i||(i+1)%poly.length===j)continue;const c=poly[j],d=poly[(j+1)%poly.length];if(segmentsIntersect(a,b,c,d))return true}
 }return false;
}
function parseRoomPolygon(text){const rows=text.trim().split(/\\r?\\n/).filter(s=>s.trim());if(rows.length<3||rows.length>50)throw Error('牆段頂點須為 3–50 個');const poly=rows.map((row,i)=>{const a=row.split(/[;,\\s]+/).filter(Boolean);if(a.length!==2)throw Error('第 '+(i+1)+' 行須為 X,Y');const x=Number(a[0]),y=Number(a[1]);if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||y<0||x>room.w||y>room.l)throw Error('第 '+(i+1)+' 行座標無效或超出房間寬長範圍');return{x,y}});if(new Set(poly.map(p=>p.x+','+p.y)).size!==poly.length)throw Error('牆段頂點不可重複');if(polygonSelfIntersects(poly))throw Error('輪廓存在自交或重疊牆段，請調整頂點順序');if(polygonArea(poly)<.1)throw Error('輪廓面積太小');return poly}
function pointDistance(a,b){return Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)}
function log(s){$('message').textContent='['+new Date().toLocaleTimeString()+'] '+s}
function renderPoints(){$('pointCount').textContent=points.length;$('pointDistance').textContent=(points.length>1?pointDistance(points[0],points[1]):0).toFixed(3);$('pointSummary').textContent=points.length+' points';$('pointList').textContent=points.map((p,i)=>'P'+(i+1)+'  X '+p.x.toFixed(3)+'  Y '+p.y.toFixed(3)+'  Z '+p.z.toFixed(3)).join('\n');$('volume').textContent=volume().toFixed(2)}
function project(x,y,z){const w=canvas.clientWidth,h=canvas.clientHeight,scale=Math.min(w/(room.w+room.l*.58+1),h/(room.h+room.l*.3+1))*0.78;return{x:w*.48+(x-y*.52)*scale,y:h*.72-(z*scale)-(x+y)*scale*.25}}
function line(a,b,color='#263b50',width=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}
function draw(){const dpr=window.devicePixelRatio||1,w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);ctx.fillStyle='#0a1119';ctx.fillRect(0,0,w,h);
const poly=room.polygon||[{x:0,y:0},{x:room.w,y:0},{x:room.w,y:room.l},{x:0,y:room.l}],n=poly.length;
const floor=poly.map(p=>project(p.x,p.y,0)),ceiling=poly.map(p=>project(p.x,p.y,room.h)),corners=floor.concat(ceiling),edges=[];
for(let i=0;i<n;i++){const j=(i+1)%n;edges.push([i,j],[i+n,j+n],[i,i+n])}
ctx.fillStyle='#14273a';ctx.beginPath();floor.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fill();
edges.forEach(([a,b])=>line(corners[a],corners[b],'#41617b',1.2));
for(let x=.5;x<room.w;x+=.5){line(project(x,0,0),project(x,room.l,0),'#263b50');line(project(x,0,room.h),project(x,room.l,room.h),'#263b50')}
for(let y=.5;y<room.l;y+=.5){line(project(0,y,0),project(room.w,y,0),'#263b50');line(project(0,y,room.h),project(room.w,y,room.h),'#263b50')}
for(let z=.5;z<room.h;z+=.5){for(let i=0;i<n;i++){const j=(i+1)%n;line(project(poly[i].x,poly[i].y,z),project(poly[j].x,poly[j].y,z),'#20364b')}}
objects.forEach(o=>{const fp=o.geometry==='cad-prism'?o.vertices:[{x:0,y:0},{x:o.w,y:0},{x:o.w,y:o.d},{x:0,y:o.d}],base=fp.map(p=>project(o.x+p.x,o.y+p.y,o.z)),top=fp.map(p=>project(o.x+p.x,o.y+p.y,o.z+o.h));const a=project(o.x,o.y,o.z),b=project(o.x+o.w,o.y,o.z),c=project(o.x+o.w,o.y+o.d,o.z),d=project(o.x,o.y+o.d,o.z),at=project(o.x,o.y,o.z+o.h),bt=project(o.x+o.w,o.y,o.z+o.h),ct=project(o.x+o.w,o.y+o.d,o.z+o.h),dt=project(o.x,o.y+o.d,o.z+o.h);const color=o.type==='cabinet'?'#d9a45b':o.type==='embedded'?'#69b9e8':o.type==='counter'?'#91c78b':'#ba9be8';ctx.globalAlpha=.2;ctx.fillStyle=color;(o.geometry==='cad-prism'?base.map((p,i)=>[p,base[(i+1)%base.length],top[(i+1)%top.length],top[i]]).concat([top]):[[a,b,bt,at],[b,c,ct,bt],[d,c,ct,dt],[a,d,dt,at],[at,bt,ct,dt]]).forEach(poly=>{ctx.beginPath();poly.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fill()});ctx.globalAlpha=1;(o.geometry==='cad-prism'?base.map((p,i)=>[p,base[(i+1)%base.length]]).concat(top.map((p,i)=>[p,top[(i+1)%top.length]]),base.map((p,i)=>[p,top[i]])):[[a,b],[b,c],[c,d],[d,a],[at,bt],[bt,ct],[ct,dt],[dt,at],[a,at],[b,bt],[c,ct],[d,dt]]).forEach(([p,q])=>line(p,q,color,1.5));ctx.fillStyle=color;ctx.font='11px system-ui';ctx.fillText(o.name.slice(0,18),at.x+3,at.y-4)});
points.forEach((p,i)=>{let q=project(p.x,p.y,p.z);ctx.beginPath();ctx.arc(q.x,q.y,drag===i?8:6,0,Math.PI*2);ctx.fillStyle='#5de1d0';ctx.fill();ctx.strokeStyle='#c7fff6';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#d8fff8';ctx.font='11px system-ui';ctx.fillText('P'+(i+1),q.x+9,q.y-8)});
if(running){ctx.fillStyle='#ffc66d';ctx.font='12px system-ui';ctx.fillText('SIMULATED SCAN · '+scan+'%',14,h-15)}}
function pointer(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
function nearest(pt){let best=-1,dist=18;points.forEach((p,i)=>{const q=project(p.x,p.y,p.z),d=Math.hypot(q.x-pt.x,q.y-pt.y);if(d<dist){dist=d;best=i}});return best}
canvas.addEventListener('pointerdown',e=>{const p=pointer(e);drag=nearest(p);if(drag>=0){canvas.setPointerCapture(e.pointerId);draw()}});
canvas.addEventListener('pointermove',e=>{if(drag<0)return;const p=pointer(e),base=project(0,0,0),sx=project(1,0,0),sy=project(0,1,0);const ax=sx.x-base.x,ay=sx.y-base.y,bx=sy.x-base.x,by=sy.y-base.y,det=ax*by-ay*bx;if(Math.abs(det)>1){const dx=p.x-base.x,dy=p.y-base.y;let x=(dx*by-dy*bx)/det,y=(ax*dy-ay*dx)/det;points[drag].x=Math.min(room.w,Math.max(0,x));points[drag].y=Math.min(room.l,Math.max(0,y));renderPoints();draw()}});
function endDrag(){if(drag>=0)log('量測點已移動。模擬座標已更新；不代表真實感測量測。');drag=-1;draw()}canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);
function download(name,content,type){const a=document.createElement('a'),u=URL.createObjectURL(new Blob([content],{type}));a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
function objectValid(o){const b=o&&Number.isInteger(o.id)&&o.id>0&&typeof o.name==='string'&&o.name.trim().length>0&&o.name.length<=80&&['embedded','cabinet','counter','other'].includes(o.type)&&[o.x,o.y,o.z,o.w,o.d,o.h].every(Number.isFinite)&&o.x>=0&&o.y>=0&&o.z>=0&&o.w>0&&o.d>0&&o.h>0&&o.x+o.w<=room.w+1e-6&&o.y+o.d<=room.l+1e-6&&o.z+o.h<=room.h+1e-6&&typeof o.notes==='string'&&o.notes.length<=300;if(!b)return false;return o.geometry!=='cad-prism'||(Array.isArray(o.vertices)&&o.vertices.length>=3&&o.vertices.length<=5000&&o.vertices.every(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=o.w+1e-6&&p.y>=0&&p.y<=o.d+1e-6))}
function renderObjects(){ $('objectCount').textContent=objects.length+' 件'; $('objectList').textContent=objects.length?objects.map(o=>'#'+o.id+' ['+({embedded:'內嵌設備',cabinet:'櫃子／固定櫃',counter:'檯面／工作台',other:'其他固定物'}[o.type])+'] '+o.name+' | 位置('+o.x.toFixed(2)+','+o.y.toFixed(2)+','+o.z.toFixed(2)+') m | 尺寸 '+o.w.toFixed(2)+'×'+o.d.toFixed(2)+'×'+o.h.toFixed(2)+' m'+(o.notes?' | '+o.notes:'')).join('\\n'):'尚無設備模型';}
function addObjectFromForm(){const o={id:nextObjectId++,name:$('objName').value.trim(),type:$('objType').value,x:+$('objX').value,y:+$('objY').value,z:+$('objZ').value,w:+$('objW').value,d:+$('objD').value,h:+$('objH').value,notes:$('objNotes').value.trim()};if(!objectValid(o)){nextObjectId--;log('模型資料無效：名稱必填；尺寸須大於 0，且模型需完整位於房間邊界內。');return}objects.push(o);renderObjects();draw();log('已建立 '+o.name+' 的參數化方盒模型。這是手動輸入模型，不是掃描重建。')}

function snapshot(){return{schemaVersion:1,simulationOnly:true,units:'m',room:{...room,polygon:(room.polygon||[]).map(p=>({...p}))},points:points.map(p=>({...p})),objects:objects.map(o=>({...o})),scanProgress:scan,savedAt:new Date().toISOString()}}
function startScan(){if(running)return;running=true;scan=0;last=0;$('start').disabled=true;log('開始模擬掃描；此流程不讀取真實相機或深度感測器。');raf=requestAnimationFrame(tick)}
function tick(t){if(!running)return;if(!last)last=t;scan=Math.min(100,Math.floor((t-last)/35));$('scanPct').textContent=scan+'%';$('bar').style.width=scan+'%';draw();if(scan>=100){running=false;$('start').disabled=false;log('模擬掃描完成。資料僅為合成幾何，尚未產生 Quest 感測資料。');return}raf=requestAnimationFrame(tick)}
$('apply').onclick=()=>{if(validDims()){renderPoints();draw();log('房間尺寸更新；體積 '+volume().toFixed(3)+' m³。')}};
$('applyPolygon').onclick=()=>{try{const poly=parseRoomPolygon($('roomPolygon').value);room.polygon=poly;$('polygonReport').textContent=poly.length+' 個頂點 · 面積 '+polygonArea(poly).toFixed(2)+' m²';renderPoints();draw();log('已套用非矩形房間輪廓；牆頂目前同高，尺寸仍須由 CAD／實測確認。')}catch(e){$('polygonReport').textContent='輪廓無效';log('牆段輪廓錯誤：'+e.message)}};
$('start').onclick=startScan;$('finish').onclick=()=>{running=false;cancelAnimationFrame(raf);$('start').disabled=false;log('已停止模擬掃描，進度 '+scan+'%。');draw()};
$('reset').onclick=()=>{running=false;cancelAnimationFrame(raf);$('start').disabled=false;objects=[];nextObjectId=1;renderObjects();scan=0;$('scanPct').textContent='0%';$('bar').style.width='0%';$('width').value=4;$('length').value=6;$('height').value=2.5;room={w:4,l:6,h:2.5,polygon:[{x:0,y:0},{x:4,y:0},{x:4,y:6},{x:0,y:6}]};$('roomPolygon').value='0,0\n4,0\n4,6\n0,6';$('polygonReport').textContent='矩形輪廓';initPoints();log('場景已重設。')};
$('addPoint').onclick=()=>{if(points.length>=100){log('最多 100 個模擬點。');return}points.push({x:room.w/2,y:room.l/2,z:0});renderPoints();draw();log('新增模擬量測點。')};
$('removePoint').onclick=()=>{if(points.length<=1){log('至少保留一個量測點。');return}points.pop();renderPoints();draw();log('已移除最後一個量測點。')};

let pdfDoc=null,pdfPageObj=null,pdfScale=1,pdfMode='idle',pdfClicks=[],pdfPoly=[],pdfMetersPerPx=0,pdfDetectedLines=[],pdfCalibrationChecks=[],pdfViewRegistry=[];
const pdfCanvas=$('pdfCanvas'),pdfCtx=pdfCanvas.getContext('2d');
function pdfStatus(s){$('pdfReport').textContent=s}
if(window.pdfjsLib)pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
$('loadPdf').onclick=async()=>{try{if(!window.pdfjsLib)throw Error('PDF.js 載入失敗，請確認網路後重新整理');const f=$('pdfFile').files[0];if(!f)throw Error('請先選擇 PDF');if(f.size>50000000)throw Error('PDF 不可超過 50 MB');pdfDoc=await pdfjsLib.getDocument({data:await f.arrayBuffer()}).promise;const n=+$('pdfPage').value;if(!Number.isInteger(n)||n<1||n>pdfDoc.numPages)throw Error('頁碼無效，共 '+pdfDoc.numPages+' 頁');pdfPageObj=await pdfDoc.getPage(n);pdfScale=Math.min(2,1400/pdfPageObj.getViewport({scale:1}).width);const v=pdfPageObj.getViewport({scale:pdfScale});pdfCanvas.width=Math.round(v.width);pdfCanvas.height=Math.round(v.height);await pdfPageObj.render({canvasContext:pdfCtx,viewport:v}).promise;pdfMode='idle';pdfClicks=[];pdfPoly=[];pdfMetersPerPx=0;pdfDetectedLines=[];pdfCalibrationChecks=[];$('pdfBaseline').innerHTML='<option value="">請先分析線條</option>';pdfStatus('PDF 第 '+n+' 頁已載入。先自動識別線條，再選基準線校正比例。')}catch(e){pdfStatus('載入失敗：'+e.message)}};
function pdfDetectStraightLines(){
 if(!pdfDoc)throw Error('請先載入 PDF');
 const w=pdfCanvas.width,h=pdfCanvas.height,data=pdfCtx.getImageData(0,0,w,h).data;
 const gray=(x,y)=>{const i=(y*w+x)*4;return .299*data[i]+.587*data[i+1]+.114*data[i+2]};
 const candidates=[],minLen=Math.max(45,Math.min(w,h)*.09),step=2;
 for(const axis of ['h','v']){
  const outer=axis==='h'?h:w,inner=axis==='h'?w:h;
  for(let o=2;o<outer-2;o+=step){
   let start=-1,last=-1,dark=0;
   for(let i=2;i<inner-2;i++){
    const x=axis==='h'?i:o,y=axis==='h'?o:i;
    if(gray(x,y)<150){if(start<0)start=i;last=i;dark++}
    else if(start>=0&&i-last>3){
     const len=last-start+1;
     if(len>=minLen&&dark/Math.max(1,len)>.55)candidates.push({axis,x1:axis==='h'?start:o,y1:axis==='h'?o:start,x2:axis==='h'?last:o,y2:axis==='h'?o:last,len,coord:o});
     start=-1;last=-1;dark=0;
    }
   }
   if(start>=0){const len=last-start+1;if(len>=minLen&&dark/Math.max(1,len)>.55)candidates.push({axis,x1:axis==='h'?start:o,y1:axis==='h'?o:start,x2:axis==='h'?last:o,y2:axis==='h'?o:last,len,coord:o})}
  }
 }
 candidates.sort((a,b)=>b.len-a.len);const kept=[];
 for(const c of candidates){if(kept.some(k=>k.axis===c.axis&&Math.abs(k.coord-c.coord)<=3&&Math.abs(k.x1-c.x1)<=8&&Math.abs(k.x2-c.x2)<=8))continue;kept.push(c);if(kept.length>=120)break}
 pdfDetectedLines=kept;const sel=$('pdfBaseline');sel.innerHTML='';
 if(!kept.length){sel.add(new Option('未找到長直線',''));pdfStatus('未找到可靠水平／垂直長線。請提高 PDF 清晰度或改用 DXF；不會猜測基準線。');return}
 kept.forEach((l,i)=>sel.add(new Option((i+1)+'. '+(l.axis==='h'?'水平':'垂直')+'線 · '+Math.round(l.len)+' px · '+Math.round(l.x1)+','+Math.round(l.y1)+' → '+Math.round(l.x2)+','+Math.round(l.y2),String(i))));
 pdfMode='idle';pdfRedraw();pdfStatus('找到 '+kept.length+' 條候選長直線。選擇與尺寸標註相符的線，輸入實際長度後校正。');
}
$('pdfDetectLines').onclick=()=>{try{pdfDetectStraightLines()}catch(e){pdfStatus('線條分析失敗：'+e.message)}};
function pdfRenderViewRegistry(){const el=$('pdfViewRegistry');if(!pdfViewRegistry.length){el.textContent='尚未保存平面／立面校正紀錄。';return}el.textContent='已保存視圖：'+pdfViewRegistry.map((v,i)=>(i+1)+'. '+v.view+'／第 '+v.page+' 頁／比例 '+v.scale.toPrecision(5)+' m/px／基準線 '+v.baselines+' 條').join('；')+'。不同視圖需確認方向、原點與同一構件對應後才能合併。'}
$('pdfSaveView').onclick=()=>{if(!pdfDoc||pdfMetersPerPx<=0||!pdfCalibrationChecks.length)return pdfStatus('請先載入圖面、識別線條並完成至少一條基準線校正');const page=+$('pdfPage').value,view=$('pdfViewType').value,record={view,page,scale:pdfMetersPerPx,baselines:pdfCalibrationChecks.length,file:($('pdfFile').files[0]?.name||'PDF').slice(0,160),lines:pdfDetectedLines.length};const i=pdfViewRegistry.findIndex(v=>v.file===record.file&&v.page===page&&v.view===view);if(i>=0)pdfViewRegistry[i]=record;else pdfViewRegistry.push(record);pdfRenderViewRegistry();pdfStatus('已保存此視圖校正紀錄。這是跨視圖配對的準備資料，尚未自動合併 3D。')};
$('pdfCalibrate').onclick=()=>{
 if(!pdfDoc)return pdfStatus('請先載入 PDF');
 const line=pdfDetectedLines[Number($('pdfBaseline').value)],m=+$('pdfKnownLength').value;
 if(!line||!Number.isFinite(m)||m<=0)return pdfStatus('請先分析線條、選擇基準線並輸入正確實際長度');
 const candidateScale=m/line.len;
 if(pdfCalibrationChecks.length){
  const scales=pdfCalibrationChecks.map(c=>c.scale).concat(candidateScale),mean=scales.reduce((a,b)=>a+b,0)/scales.length;
  const spread=(Math.max(...scales)-Math.min(...scales))/mean;
  if(spread>.02){pdfStatus('基準線交叉校驗不一致（比例差 '+(spread*100).toFixed(2)+'%）。請檢查所選線是否對應正確標註；本次不納入校正。');return}
 }
 pdfCalibrationChecks.push({scale:candidateScale,length:m,pixels:line.len,view:$('pdfViewType').value});
 pdfMetersPerPx=pdfCalibrationChecks.reduce((sum,c)=>sum+c.scale,0)/pdfCalibrationChecks.length;
 pdfMode='idle';pdfClicks=[{x:line.x1,y:line.y1},{x:line.x2,y:line.y2}];
 pdfRedraw();pdfStatus('基準線校正 '+pdfCalibrationChecks.length+' 條；綜合比例 '+pdfMetersPerPx.toPrecision(6)+' 公尺／像素。已知尺寸交叉差異須 ≤2%；請確認各線的實際標註值。');
};
$('pdfTrace').onclick=()=>{if(!pdfDoc||pdfMetersPerPx<=0)return pdfStatus('請先載入 PDF 並完成比例校正');pdfMode='trace';pdfPoly=[];pdfStatus('依序點選輪廓的每個轉角；完成後按「完成輪廓」。最多 50 點。')};
$('pdfUndo').onclick=()=>{if(pdfMode==='trace'&&pdfPoly.length)pdfPoly.pop();else if(pdfMode==='calibrate'&&pdfClicks.length)pdfClicks.pop();pdfRedraw()};
$('pdfClose').onclick=()=>{if(pdfMode!=='trace'||pdfPoly.length<3)return pdfStatus('輪廓至少需要 3 個頂點');pdfMode='closed';pdfRedraw();pdfStatus('輪廓完成，共 '+pdfPoly.length+' 個轉角；請檢查後轉 3D。')};
function pdfRedraw(){if(!pdfDoc)return;pdfPageObj.render({canvasContext:pdfCtx,viewport:pdfPageObj.getViewport({scale:pdfScale})}).promise.then(()=>{const pts=pdfMode==='calibrate'?pdfClicks:pdfPoly;if(pts.length){pdfCtx.save();pdfCtx.strokeStyle='#e0442f';pdfCtx.fillStyle='#e0442f';pdfCtx.lineWidth=3;pdfCtx.beginPath();pts.forEach((p,i)=>i?pdfCtx.lineTo(p.x,p.y):pdfCtx.moveTo(p.x,p.y));if(pdfMode==='closed')pdfCtx.closePath();pdfCtx.stroke();pts.forEach((p,i)=>{pdfCtx.beginPath();pdfCtx.arc(p.x,p.y,5,0,Math.PI*2);pdfCtx.fill();pdfCtx.fillText(String(i+1),p.x+7,p.y-7)});pdfCtx.restore()}pdfDrawDetectedLines()})}
function pdfSnapToEdge(p){if(!$('pdfSnapEdges').checked)return p;const x0=Math.max(1,Math.floor(p.x)-10),x1=Math.min(pdfCanvas.width-2,Math.ceil(p.x)+10),y0=Math.max(1,Math.floor(p.y)-10),y1=Math.min(pdfCanvas.height-2,Math.ceil(p.y)+10);let best=p,score=0;const data=pdfCtx.getImageData(x0,y0,x1-x0+1,y1-y0+1).data;for(let y=y0+1;y<y1;y++)for(let x=x0+1;x<x1;x++){const k=((y-y0)*(x1-x0+1)+(x-x0))*4,lum=(i)=>.299*data[i]+.587*data[i+1]+.114*data[i+2],gx=Math.abs(lum(k+4)-lum(k-4)),gy=Math.abs(lum(k+(x1-x0+1)*4)-lum(k-(x1-x0+1)*4)),g=gx+gy,dist=Math.hypot(x-p.x,y-p.y),v=g/(1+dist*.18);if(v>score){score=v;best={x,y}}}return score>18?best:p}
pdfCanvas.addEventListener('click',e=>{if(!pdfDoc||!['calibrate','trace'].includes(pdfMode))return;const r=pdfCanvas.getBoundingClientRect();let p={x:(e.clientX-r.left)*pdfCanvas.width/r.width,y:(e.clientY-r.top)*pdfCanvas.height/r.height};if(pdfMode==='trace')p=pdfSnapToEdge(p);if(pdfMode==='calibrate'){pdfClicks.push(p);if(pdfClicks.length===2){const px=Math.hypot(pdfClicks[1].x-pdfClicks[0].x,pdfClicks[1].y-pdfClicks[0].y),m=+$('pdfKnownLength').value;if(px<3||!Number.isFinite(m)||m<=0){pdfClicks=[];return pdfStatus('校正失敗，請重新點選並輸入正確長度')}pdfMetersPerPx=m/px;pdfMode='idle';pdfRedraw();pdfStatus('比例校正完成：'+pdfMetersPerPx.toPrecision(6)+' 公尺／像素')}else pdfRedraw()}else{if(pdfPoly.length>=50)return pdfStatus('每個輪廓最多 50 點');pdfPoly.push(p);pdfRedraw()}});
function pdfPolygonMetrics(vertices){if(!Array.isArray(vertices)||vertices.length<3)throw Error('輪廓至少需要 3 個頂點');const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x),on=(a,b,p)=>Math.abs(cross(a,b,p))<1e-9&&p.x>=Math.min(a.x,b.x)-1e-9&&p.x<=Math.max(a.x,b.x)+1e-9&&p.y>=Math.min(a.y,b.y)-1e-9&&p.y<=Math.max(a.y,b.y)+1e-9,intersects=(a,b,c,d)=>{const x1=cross(a,b,c),x2=cross(a,b,d),x3=cross(c,d,a),x4=cross(c,d,b);return (x1*x2<0&&x3*x4<0)||on(a,b,c)||on(a,b,d)||on(c,d,a)||on(c,d,b)};let area2=0,perimeter=0;for(let i=0;i<vertices.length;i++){const a=vertices[i],b=vertices[(i+1)%vertices.length];if(Math.hypot(a.x-b.x,a.y-b.y)<.002)throw Error('輪廓有重複或過近的相鄰頂點，請重新描繪');area2+=a.x*b.y-b.x*a.y;perimeter+=Math.hypot(a.x-b.x,a.y-b.y);for(let j=i+1;j<vertices.length;j++){const j2=(j+1)%vertices.length;if(j===i||j===i+1||j2===i)continue;if(intersects(a,b,vertices[j],vertices[j2]))throw Error('輪廓線段交叉或重疊，請修正轉角順序')}}const area=Math.abs(area2)/2;if(area<.0001)throw Error('輪廓面積太小或退化');return {area,perimeter}}
$('pdfBuild').onclick=()=>{try{if(!pdfDoc||pdfPoly.length<3||pdfMode!=='closed')throw Error('請載入 PDF、校正比例並完成封閉輪廓');const height=+$('pdfHeight').value,ox=+$('pdfX').value,oy=+$('pdfY').value,oz=+$('pdfZ').value;if(![height,ox,oy,oz].every(Number.isFinite)||height<=0||height>10||Math.min(ox,oy,oz)<0)throw Error('高度或位置無效');const raw=pdfPoly.map(p=>({x:p.x*pdfMetersPerPx,y:(pdfCanvas.height-p.y)*pdfMetersPerPx})),minX=Math.min(...raw.map(p=>p.x)),minY=Math.min(...raw.map(p=>p.y)),vertices=raw.map(p=>({x:p.x-minX,y:p.y-minY})),w=Math.max(...vertices.map(p=>p.x)),d=Math.max(...vertices.map(p=>p.y));if(w<.01||d<.01)throw Error('輪廓尺寸太小');const metrics=pdfPolygonMetrics(vertices);const o={id:nextObjectId,name:'PDF輪廓 '+nextObjectId,type:$('pdfCategory').value,geometry:'cad-prism',sourceFormat:'PDF-traced',sourceLayer:'page '+$('pdfPage').value,sourceFile:$('pdfFile').files[0].name.slice(0,160),x:ox,y:oy,z:oz,w,d,h:height,vertices,notes:'PDF 人工描繪；比例經已知尺寸校正；擠出高度由使用者輸入'};if(!objectValid(o))throw Error('模型超出房間範圍或幾何無效，請調整位置或房間尺寸');objects.push(o);nextObjectId++;renderObjects();draw();pdfMode='idle';pdfStatus('建立成功：1 個 PDF 來源 3D 柱體，輪廓 '+vertices.length+' 點，包圍盒 '+w.toFixed(3)+'×'+d.toFixed(3)+'×'+height.toFixed(3)+' m；平面面積 '+metrics.area.toFixed(3)+' m²、周長 '+metrics.perimeter.toFixed(3)+' m。人工描繪模型，請核對尺寸。');log('PDF 輪廓轉 3D 完成。')}catch(e){pdfStatus('建模失敗：'+e.message)}};

$('importDxf').onclick=async()=>{const file=$('cadFile').files&&$('cadFile').files[0];if(!file){$('cadReport').textContent='請先選擇 DXF 檔案。';return}try{const height=+$('cadHeight').value,rotation=+$('cadRotation').value,ox=+$('cadOffsetX').value,oy=+$('cadOffsetY').value,oz=+$('cadOffsetZ').value,scale=DXF_UNIT_SCALE[$('cadUnits').value];if(![height,rotation,ox,oy,oz,scale].every(Number.isFinite)||height<=0||height>10||rotation < -360||rotation > 360||Math.min(ox,oy,oz)<0)throw Error('擠出高度、旋轉角度或位置無效');const shapes=rotateDxfGroup(parseClosedDxfPolylines(await file.text(),scale),rotation),made=[];for(const s of shapes){const o={id:nextObjectId,name:(s.name+' '+nextObjectId).slice(0,80),type:$('cadCategory').value,geometry:'cad-prism',sourceFormat:'DXF',sourceLayer:s.layer,sourceFile:file.name.slice(0,160),x:ox+s.offsetX,y:oy+s.offsetY,z:oz,w:s.w,d:s.d,h:height,vertices:s.vertices,notes:'2D DXF 封閉輪廓擠出；圖層 '+s.layer+'；檔案 '+file.name};if(!objectValid(o))throw Error('模型超出房間邊界或幾何無效，請調整位置、房間尺寸或擠出高度');made.push(o);nextObjectId++}objects.push(...made);renderObjects();draw();$('cadReport').textContent='匯入成功：'+made.length+' 個封閉輪廓已轉成 3D 柱體；單位 '+$('cadUnits').value+'，擠出高度 '+height+' m。請人工核對尺度與位置。';log('DXF 匯入完成：'+made.length+' 個輪廓轉成 3D。')}catch(e){$('cadReport').textContent='匯入失敗：'+e.message;log('DXF 匯入失敗：'+e.message)}};
$('addObject').onclick=addObjectFromForm;$('clearObjects').onclick=()=>{objects=[];nextObjectId=1;renderObjects();draw();log('已清空設備／櫃體模型清單。')};
$('save').onclick=()=>{try{localStorage.setItem('or-roomscan-session-v1',JSON.stringify(snapshot()));log('已儲存至此瀏覽器的 localStorage。')}catch(e){log('儲存失敗：'+e.message)}};
$('load').onclick=()=>{try{const s=JSON.parse(localStorage.getItem('or-roomscan-session-v1')||'null');if(!s||s.schemaVersion!==1||s.simulationOnly!==true||s.units!=='m'||!s.room||!Array.isArray(s.points)||!s.points.length||s.points.length>100||!Array.isArray(s.objects||[])|| (s.objects||[]).length>200)throw Error('找不到有效的本機模擬工作階段');const d=[s.room.w,s.room.l,s.room.h];if(!d.every(Number.isFinite)||s.room.w<1||s.room.w>30||s.room.l<1||s.room.l>30||s.room.h<1||s.room.h>10)throw Error('本機房間尺寸超出允許範圍');const pts=s.points.map(p=>({x:p.x,y:p.y,z:p.z}));if(!pts.every(p=>[p.x,p.y,p.z].every(Number.isFinite)&&p.x>=0&&p.x<=s.room.w&&p.y>=0&&p.y<=s.room.l&&p.z>=0&&p.z<=s.room.h))throw Error('本機量測點座標無效或超出房間邊界');running=false;cancelAnimationFrame(raf);$('start').disabled=false;room={...s.room};if(!Array.isArray(room.polygon))room.polygon=[{x:0,y:0},{x:room.w,y:0},{x:room.w,y:room.l},{x:0,y:room.l}];if(room.polygon.length<3||room.polygon.length>50||!room.polygon.every(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=room.w&&p.y>=0&&p.y<=room.l)||polygonArea(room.polygon)<.1)throw Error('房間牆段輪廓無效');points=pts;objects=(s.objects||[]).map(o=>({...o}));if(!objects.every(objectValid))throw Error('本機設備模型資料無效或超出房間邊界');nextObjectId=Math.max(1,...objects.map(o=>o.id+1));scan=Number.isFinite(s.scanProgress)?Math.max(0,Math.min(100,s.scanProgress)):0;$('width').value=room.w;$('length').value=room.l;$('height').value=room.h;$('roomPolygon').value=room.polygon.map(p=>p.x+','+p.y).join('\\n');$('polygonReport').textContent=room.polygon.length+' 個頂點 · 面積 '+polygonArea(room.polygon).toFixed(2)+' m²';$('scanPct').textContent=scan+'%';$('bar').style.width=scan+'%';renderPoints();renderObjects();draw();log('已載入並驗證本機模擬工作階段與設備模型。')}catch(e){log('載入失敗：'+e.message)}};
$('csv').onclick=()=>download('or-roomscan-points.csv','id,x_m,y_m,z_m\n'+points.map((p,i)=>[i+1,p.x,p.y,p.z].join(',')).join('\n'),'text/csv;charset=utf-8');
$('json').onclick=()=>download('or-roomscan-session.json',JSON.stringify(snapshot(),null,2),'application/json');
$('importJson').onclick=()=>$('importFile').click();
$('importFile').onchange=async e=>{const file=e.target.files&&e.target.files[0];if(!file)return;try{const s=JSON.parse(await file.text());if(!s||s.schemaVersion!==1||s.simulationOnly!==true||s.units!=='m'||!s.room||!Array.isArray(s.points)||!s.points.length||s.points.length>100||!Array.isArray(s.objects||[])|| (s.objects||[]).length>200)throw Error('格式不符：需為 OR RoomScan 模擬器匯出的 JSON');const dims=[s.room.w,s.room.l,s.room.h];if(!dims.every(Number.isFinite)||s.room.w<1||s.room.w>30||s.room.l<1||s.room.l>30||s.room.h<1||s.room.h>10)throw Error('房間尺寸超出允許範圍');const pts=s.points.map(p=>({x:p.x,y:p.y,z:p.z}));if(!pts.every(p=>[p.x,p.y,p.z].every(Number.isFinite)&&p.x>=0&&p.x<=s.room.w&&p.y>=0&&p.y<=s.room.l&&p.z>=0&&p.z<=s.room.h))throw Error('量測點座標無效或超出房間邊界');running=false;cancelAnimationFrame(raf);$('start').disabled=false;room={...s.room};if(!Array.isArray(room.polygon))room.polygon=[{x:0,y:0},{x:room.w,y:0},{x:room.w,y:room.l},{x:0,y:room.l}];if(room.polygon.length<3||room.polygon.length>50||!room.polygon.every(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=room.w&&p.y>=0&&p.y<=room.l)||polygonArea(room.polygon)<.1)throw Error('房間牆段輪廓無效');points=pts;objects=(s.objects||[]).map(o=>({...o}));if(!objects.every(objectValid))throw Error('設備模型資料無效或超出房間邊界');nextObjectId=Math.max(1,...objects.map(o=>o.id+1));scan=Number.isFinite(s.scanProgress)?Math.max(0,Math.min(100,s.scanProgress)):0;$('width').value=room.w;$('length').value=room.l;$('height').value=room.h;$('roomPolygon').value=room.polygon.map(p=>p.x+','+p.y).join('\\n');$('polygonReport').textContent=room.polygon.length+' 個頂點 · 面積 '+polygonArea(room.polygon).toFixed(2)+' m²';$('scanPct').textContent=scan+'%';$('bar').style.width=scan+'%';renderPoints();renderObjects();draw();log('已匯入並驗證模擬 JSON 與設備模型；資料仍非真實感測掃描。')}catch(err){log('匯入失敗：'+err.message)}finally{e.target.value=''}};
$('runTests').onclick=()=>{const results=[];const test=(name,fn)=>{try{if(!fn())throw Error('assertion failed');results.push({name,ok:true})}catch(e){results.push({name,ok:false,error:e.message})}};test('尺寸／體積',()=>Math.abs(room.w*room.l*room.h-volume())<1e-9);test('公尺轉毫米',()=>Math.round(1.234*1000)===1234);test('三維點間距離',()=>Math.abs(pointDistance({x:0,y:0,z:0},{x:3,y:4,z:12})-13)<1e-9);test('量測點拖曳邊界',()=>points.every(p=>p.x>=0&&p.x<=room.w&&p.y>=0&&p.y<=room.l));test('儲存資料結構',()=>{const s=snapshot();return s.schemaVersion===1&&s.simulationOnly===true&&s.points.length===points.length});test('CSV／JSON 序列化',()=>{const csv='id,x_m,y_m,z_m\n'+points.map((p,i)=>[i+1,p.x,p.y,p.z].join(',')).join('\n'),j=JSON.stringify(snapshot());return csv.startsWith('id,x_m')&&JSON.parse(j).points.length===points.length});$('checks').innerHTML=results.map(r=>'<div class="check"><strong>'+r.name+'</strong><span class="tag '+(r.ok?'ok':'warn')+'">'+(r.ok?'PASS':'FAIL')+'</span>'+(r.error?'<span>'+r.error+'</span>':'')+'</div>').join('');$('testLog').textContent=results.map(r=>(r.ok?'[PASS] ':'[FAIL] ')+r.name+(r.error?' — '+r.error:'')).join('\n');log(results.every(r=>r.ok)?'自動測試全數通過。這不是 Unity 編譯或 Quest 3 實機測試。':'自動測試有失敗項目，請檢查測試面板。')};
window.addEventListener('resize',draw);initPoints();renderPoints();renderObjects();draw();
})();
