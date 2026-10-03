const palette=['#ff4059','#ff9639','#ffd74d','#62d878','#36c6e7','#338ef1','#7959e8','#e85ab6','#fb6c8f','#64c6ad'];
const defaults=['Ăn phở','Uống cà phê','Xem phim','Đi du lịch','Ở nhà','Chơi game','Đi mua sắm','Đọc sách'];
let items=JSON.parse(localStorage.getItem('wheel-items')||'null')||defaults; let angle=0, spinning=false, winnerIndex=-1;
const canvas=document.querySelector('#wheel'),ctx=canvas.getContext('2d');
function save(){localStorage.setItem('wheel-items',JSON.stringify(items))}
function fitWheelLabel(text, arc, radius, count){
  const clean=String(text).replace(/\s+/g,' ').trim();
  if(!clean)return {lines:[''],font:18,maxWidth:100};
  // Vùng chữ nằm ở khoảng 58% bán kính. Chiều rộng hữu dụng được tính
  // theo dây cung của chính lát quay, vì vậy lát càng hẹp chữ càng nhỏ.
  const labelR=radius*.60;
  const chord=Math.max(42,2*labelR*Math.sin(Math.min(arc*.72,Math.PI/2)));
  const maxWidth=Math.min(radius*.62,chord*.88);
  const maxLines=count>=14?2:3;
  const maxFont=count<=6?28:count<=9?24:count<=12?20:16;
  const minFont=count>=16?11:12;

  function wrap(font){
    ctx.font=`800 ${font}px system-ui`;
    const words=clean.split(' '), lines=[]; let line='';
    for(let wi=0;wi<words.length;wi++){
      const word=words[wi];
      const candidate=line?line+' '+word:word;
      if(ctx.measureText(candidate).width<=maxWidth){line=candidate;continue}
      if(line){lines.push(line);line=''; if(lines.length>=maxLines)break}
      // Từ đơn quá dài: cắt theo ký tự để không bao giờ chui khỏi lát.
      if(ctx.measureText(word).width>maxWidth){
        let part='';
        for(const ch of word){
          if(ctx.measureText(part+ch+'…').width>maxWidth){
            if(part) lines.push(part+'…');
            part='';
            if(lines.length>=maxLines)break;
          }
          part+=ch;
        }
        if(lines.length<maxLines && part) line=part;
      } else line=word;
      if(lines.length>=maxLines)break;
    }
    if(line&&lines.length<maxLines)lines.push(line);
    const represented=lines.join(' ');
    if(represented.replace(/…/g,'').length < clean.length && lines.length){
      let last=lines[lines.length-1].replace(/…$/,'');
      while(last && ctx.measureText(last+'…').width>maxWidth) last=last.slice(0,-1);
      lines[lines.length-1]=(last||'')+'…';
    }
    return lines.slice(0,maxLines);
  }
  for(let font=maxFont;font>=minFont;font--){
    const lines=wrap(font);
    if(lines.length<=maxLines && lines.every(x=>ctx.measureText(x).width<=maxWidth+1))
      return {lines,font,maxWidth};
  }
  return {lines:wrap(minFont),font:minFont,maxWidth};
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
    // Clip theo đúng hình lát quay; kể cả chuỗi rất dài cũng không thể đè sang lát bên cạnh.
    ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,r-7,a+.018,a+arc-.018);ctx.closePath();ctx.clip();
    ctx.rotate(a+arc/2);
    ctx.translate(r*.60,0);
    ctx.rotate(Math.PI/2);
    ctx.fillStyle=(i%palette.length===2||i%palette.length===3||i%palette.length===4)?'#102044':'#fff';
    ctx.textAlign='center';ctx.textBaseline='middle';
    const fitted=fitWheelLabel(items[i],arc,r,n);
    ctx.font=`800 ${fitted.font}px system-ui`;
    const lh=fitted.font*1.08, y0=-(fitted.lines.length-1)*lh/2;
    fitted.lines.forEach((line,j)=>ctx.fillText(line,0,y0+j*lh));
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
