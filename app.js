const palette=['#ff4059','#ff9639','#ffd74d','#62d878','#36c6e7','#338ef1','#7959e8','#e85ab6','#fb6c8f','#64c6ad'];
const defaults=['Ăn phở','Uống cà phê','Xem phim','Đi du lịch','Ở nhà','Chơi game','Đi mua sắm','Đọc sách'];
let items=JSON.parse(localStorage.getItem('wheel-items')||'null')||defaults; let angle=0, spinning=false, winnerIndex=-1;
const canvas=document.querySelector('#wheel'),ctx=canvas.getContext('2d');
function save(){localStorage.setItem('wheel-items',JSON.stringify(items))}
function splitWheelText(text,maxChars,maxLines=3){
  const clean=String(text).replace(/\s+/g,' ').trim();
  if(!clean)return [''];
  const words=clean.split(' '), lines=[]; let line='';
  for(const word of words){
    const next=line?line+' '+word:word;
    if(next.length<=maxChars){line=next;continue}
    if(line)lines.push(line);
    line=word;
    if(lines.length===maxLines-1)break;
  }
  if(line&&lines.length<maxLines)lines.push(line);
  const used=lines.join(' ').length;
  if(used<clean.length){
    let last=lines[maxLines-1]||lines[lines.length-1]||'';
    last=last.slice(0,Math.max(2,maxChars-1)).trimEnd()+'…';
    lines[Math.min(maxLines-1,lines.length-1)]=last;
  }
  return lines.slice(0,maxLines);
}
function draw(){
  const n=items.length,w=canvas.width,c=w/2,r=w*.47;
  ctx.clearRect(0,0,w,w);ctx.save();ctx.translate(c,c);ctx.rotate(angle);
  if(!n){ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fillStyle='#e8edf5';ctx.fill();ctx.fillStyle='#778099';ctx.font='600 30px system-ui';ctx.textAlign='center';ctx.fillText('Thêm nội dung',0,10);ctx.restore();return}
  const arc=Math.PI*2/n;
  for(let i=0;i<n;i++){
    const a=i*arc-Math.PI/2;
    ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,r,a,a+arc);ctx.closePath();ctx.fillStyle=palette[i%palette.length];ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.stroke();
    ctx.save();
    // Clip tuyệt đối theo lát quay: chữ dài không thể tràn sang ô khác.
    ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,r-5,a+0.012,a+arc-0.012);ctx.closePath();ctx.clip();
    ctx.rotate(a+arc/2);ctx.translate(r*.61,0);ctx.rotate(Math.PI/2);
    ctx.fillStyle=(i%palette.length===2||i%palette.length===3||i%palette.length===4)?'#102044':'#fff';ctx.textAlign='center';ctx.textBaseline='middle';
    const density=Math.max(0,Math.min(1,(n-4)/12));
    const fs=Math.round(28-density*10);
    const maxChars=Math.max(5,Math.round(16-density*7));
    const lines=splitWheelText(items[i],maxChars,n>=13?2:3);
    ctx.font=`800 ${fs}px system-ui`;
    const lh=fs*1.05, y0=-(lines.length-1)*lh/2;
    lines.forEach((line,j)=>ctx.fillText(line,0,y0+j*lh,Math.max(70,r*.58)));
    ctx.restore();
  }
  ctx.beginPath();ctx.arc(0,0,52,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle='#e5eaf1';ctx.lineWidth=3;ctx.stroke();ctx.restore();
}
function render(){document.querySelector('#count').textContent=items.length;const box=document.querySelector('#items');box.innerHTML=items.length?'':'<div class="empty">Chưa có nội dung. Nhấn + để thêm.</div>';items.forEach((x,i)=>{const el=document.createElement('div');el.className='item';el.innerHTML=`<span class="dot" style="background:${palette[i%palette.length]}"></span><span></span><button class="trash">🗑</button>`;el.children[1].textContent=x;el.querySelector('.trash').onclick=()=>{if(spinning)return;items.splice(i,1);save();render();draw()};box.appendChild(el)});draw()}
function open(id){document.querySelector('#'+id).classList.remove('hidden')} function close(id){document.querySelector('#'+id).classList.add('hidden')}
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>close(b.dataset.close));['addBtn','addBtnTop'].forEach(id=>document.querySelector('#'+id).onclick=()=>open('addModal'));
document.querySelector('#confirmAdd').onclick=()=>{const vals=document.querySelector('#bulkInput').value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);if(vals.length){items.push(...vals);save();render();document.querySelector('#bulkInput').value='';close('addModal')}};
document.querySelector('#resetBtn').onclick=()=>{if(confirm('Đặt lại danh sách mẫu?')){items=[...defaults];save();render()}};
document.querySelector('#spinBtn').onclick=spin;document.querySelector('#againBtn').onclick=()=>{close('resultModal');setTimeout(spin,150)};
document.querySelector('#removeWinnerBtn').onclick=()=>{if(winnerIndex>=0&&winnerIndex<items.length){items.splice(winnerIndex,1);save();render()}close('resultModal')};
function spin(){if(spinning||items.length<2){if(items.length===1){winnerIndex=0;showResult()}return}spinning=true;const btn=document.querySelector('#spinBtn');btn.disabled=true;btn.textContent='↻ ĐANG QUAY...';const n=items.length,arc=Math.PI*2/n;winnerIndex=Math.floor(Math.random()*n);const current=((angle%(Math.PI*2))+Math.PI*2)%(Math.PI*2);const target=-winnerIndex*arc-arc/2;let delta=((target-current)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)+Math.PI*2*(5+Math.floor(Math.random()*3));const start=performance.now(),dur=4200,startAngle=angle;function frame(now){let p=Math.min(1,(now-start)/dur),ease=1-Math.pow(1-p,4);angle=startAngle+delta*ease;draw();if(p<1)requestAnimationFrame(frame);else{spinning=false;btn.disabled=false;btn.textContent='▶ QUAY';showResult()}}requestAnimationFrame(frame)}
function showResult(){document.querySelector('#resultText').textContent=items[winnerIndex]||'';open('resultModal')}
render();if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js'));
