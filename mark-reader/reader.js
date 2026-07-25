(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const fileInput = $("fileInput");
  const sourceCanvas = $("sourceCanvas");
  const sheetCanvas = $("sheetCanvas");
  const sourceCtx = sourceCanvas.getContext("2d", {willReadFrequently:true});
  const sheetCtx = sheetCanvas.getContext("2d", {willReadFrequently:true});
  const cornerNames = ["左上", "右上", "右下", "左下"];
  const controls = ["leftX","rightX","choiceWidth","topY","bottomY","threshold"];
  let sourceImage = null;
  let sourceBase = null;
  let rectifiedBase = null;
  let corners = [];
  let answers = [];

  function fitImage(img, maxSide=1400){
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    return {w:Math.round(img.naturalWidth*scale), h:Math.round(img.naturalHeight*scale)};
  }

  fileInput.addEventListener("change", () => {
    const file = fileInput.files && fileInput.files[0];
    if(!file) return;
    $("fileName").textContent = file.name;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const size = fitImage(img);
      sourceCanvas.width=size.w; sourceCanvas.height=size.h;
      sourceCtx.drawImage(img,0,0,size.w,size.h);
      sourceImage=img;
      sourceBase=sourceCtx.getImageData(0,0,size.w,size.h);
      corners=[];
      drawSource();
      $("cornerCard").classList.remove("hidden");
      $("scanCard").classList.add("hidden");
      $("resultCard").classList.add("hidden");
      updateCornerStatus();
      $("cornerCard").scrollIntoView({behavior:"smooth",block:"start"});
    };
    img.onerror = () => { URL.revokeObjectURL(url); alert("画像を読み込めませんでした。"); };
    img.src=url;
  });

  function canvasPoint(event){
    const rect=sourceCanvas.getBoundingClientRect();
    const touch=event.touches ? event.touches[0] : event;
    return {
      x:(touch.clientX-rect.left)*sourceCanvas.width/rect.width,
      y:(touch.clientY-rect.top)*sourceCanvas.height/rect.height
    };
  }

  sourceCanvas.addEventListener("pointerdown", event => {
    if(!sourceImage || corners.length>=4) return;
    corners.push(canvasPoint(event));
    drawSource();
    updateCornerStatus();
  });

  function drawSource(){
    if(!sourceBase) return;
    sourceCtx.putImageData(sourceBase,0,0);
    sourceCtx.lineWidth=Math.max(3,sourceCanvas.width/250);
    sourceCtx.font=`bold ${Math.max(18,sourceCanvas.width/35)}px sans-serif`;
    corners.forEach((p,i)=>{
      sourceCtx.fillStyle="#ff3158"; sourceCtx.strokeStyle="#fff";
      sourceCtx.beginPath(); sourceCtx.arc(p.x,p.y,sourceCanvas.width/70,0,Math.PI*2); sourceCtx.fill(); sourceCtx.stroke();
      sourceCtx.fillStyle="#fff"; sourceCtx.textAlign="center"; sourceCtx.textBaseline="middle"; sourceCtx.fillText(String(i+1),p.x,p.y);
    });
    if(corners.length>1){
      sourceCtx.strokeStyle="#ff3158"; sourceCtx.beginPath(); sourceCtx.moveTo(corners[0].x,corners[0].y);
      corners.slice(1).forEach(p=>sourceCtx.lineTo(p.x,p.y));
      if(corners.length===4) sourceCtx.closePath();
      sourceCtx.stroke();
    }
  }

  function updateCornerStatus(){
    $("rectifyButton").disabled=corners.length!==4;
    $("cornerStatus").textContent = corners.length<4
      ? `${cornerNames[corners.length]}をタップしてください（${corners.length}/4）`
      : "四隅を指定しました。「用紙を正面補正」を押してください。";
  }
  $("undoCorner").onclick=()=>{if(corners.length)corners.pop();drawSource();updateCornerStatus();};
  $("resetCorners").onclick=()=>{corners=[];drawSource();updateCornerStatus();};

  function solve8(a,b){
    for(let i=0;i<8;i++){
      let pivot=i;
      for(let r=i+1;r<8;r++) if(Math.abs(a[r][i])>Math.abs(a[pivot][i])) pivot=r;
      [a[i],a[pivot]]=[a[pivot],a[i]]; [b[i],b[pivot]]=[b[pivot],b[i]];
      const d=a[i][i]; if(Math.abs(d)<1e-9) throw new Error("四隅の指定を確認してください。");
      for(let c=i;c<8;c++)a[i][c]/=d; b[i]/=d;
      for(let r=0;r<8;r++) if(r!==i){
        const f=a[r][i]; for(let c=i;c<8;c++)a[r][c]-=f*a[i][c]; b[r]-=f*b[i];
      }
    }
    return b;
  }

  function homography(dst,src){
    const a=[],b=[];
    for(let i=0;i<4;i++){
      const x=dst[i].x,y=dst[i].y,u=src[i].x,v=src[i].y;
      a.push([x,y,1,0,0,0,-u*x,-u*y]); b.push(u);
      a.push([0,0,0,x,y,1,-v*x,-v*y]); b.push(v);
    }
    const h=solve8(a,b); return [...h,1];
  }

  $("rectifyButton").onclick=()=>{
    try{
      const W=1000,H=1414;
      sheetCanvas.width=W; sheetCanvas.height=H;
      const src=sourceCtx.getImageData(0,0,sourceCanvas.width,sourceCanvas.height);
      const out=sheetCtx.createImageData(W,H);
      const h=homography([{x:0,y:0},{x:W-1,y:0},{x:W-1,y:H-1},{x:0,y:H-1}],corners);
      for(let y=0;y<H;y++) for(let x=0;x<W;x++){
        const z=h[6]*x+h[7]*y+1, sx=Math.round((h[0]*x+h[1]*y+h[2])/z), sy=Math.round((h[3]*x+h[4]*y+h[5])/z);
        const di=(y*W+x)*4;
        if(sx>=0&&sy>=0&&sx<src.width&&sy<src.height){
          const si=(sy*src.width+sx)*4;
          out.data[di]=src.data[si];out.data[di+1]=src.data[si+1];out.data[di+2]=src.data[si+2];out.data[di+3]=255;
        }else out.data[di]=out.data[di+1]=out.data[di+2]=out.data[di+3]=255;
      }
      sheetCtx.putImageData(out,0,0);
      rectifiedBase=out;
      $("scanCard").classList.remove("hidden");
      $("resultCard").classList.add("hidden");
      drawGrid();
      $("scanCard").scrollIntoView({behavior:"smooth",block:"start"});
    }catch(error){alert(error.message);}
  };

  controls.forEach(id=>{
    const input=$(id), output=input.parentElement.querySelector("output");
    input.addEventListener("input",()=>{output.value=id==="threshold"?input.value:`${input.value}%`;drawGrid();});
  });

  function geometry(){
    const W=sheetCanvas.width,H=sheetCanvas.height;
    const left=+$("leftX").value/100*W, right=+$("rightX").value/100*W;
    const width=+$("choiceWidth").value/100*W;
    const top=+$("topY").value/100*H, bottom=+$("bottomY").value/100*H;
    return {starts:[left,right],dx:width/8,top,dy:(bottom-top)/29,r:Math.max(5,Math.min(width/22,(bottom-top)/29*.28))};
  }

  function drawGrid(){
    if(!rectifiedBase)return;
    sheetCtx.putImageData(rectifiedBase,0,0);
    const g=geometry();
    sheetCtx.strokeStyle="rgba(0,102,255,.85)";sheetCtx.fillStyle="rgba(0,102,255,.9)";
    sheetCtx.lineWidth=2;sheetCtx.font="bold 15px sans-serif";sheetCtx.textAlign="right";
    for(let block=0;block<2;block++) for(let row=0;row<30;row++){
      const y=g.top+row*g.dy;
      sheetCtx.fillText(String(block*30+row+1),g.starts[block]-g.r*1.8,y+5);
      for(let c=0;c<9;c++){sheetCtx.beginPath();sheetCtx.arc(g.starts[block]+c*g.dx,y,g.r,0,Math.PI*2);sheetCtx.stroke();}
    }
  }

  function darkness(data,cx,cy,r){
    let sum=0,count=0;
    const inner=r*.72;
    for(let y=Math.floor(cy-inner);y<=Math.ceil(cy+inner);y++) for(let x=Math.floor(cx-inner);x<=Math.ceil(cx+inner);x++){
      if((x-cx)**2+(y-cy)**2>inner**2||x<0||y<0||x>=data.width||y>=data.height)continue;
      const i=(y*data.width+x)*4;
      sum+=255-(.299*data.data[i]+.587*data.data[i+1]+.114*data.data[i+2]);count++;
    }
    return count?sum/count:0;
  }

  $("readButton").onclick=()=>{
    const g=geometry(), t=+$("threshold").value;
    answers=[];
    for(let block=0;block<2;block++) for(let row=0;row<30;row++){
      const y=g.top+row*g.dy;
      const scores=Array.from({length:9},(_,c)=>darkness(rectifiedBase,g.starts[block]+c*g.dx,y,g.r));
      const ranked=scores.map((score,i)=>({score,i})).sort((a,b)=>b.score-a.score);
      let state="ok",value=ranked[0].i+1;
      if(ranked[0].score<t){state="blank";value="—";}
      else if(ranked[1].score>=t || ranked[0].score-ranked[1].score<5){state="warn";value=`${ranked[0].i+1}?`;}
      answers.push({number:block*30+row+1,value,state,best:ranked[0].score,second:ranked[1].score});
    }
    renderResults();
  };

  function renderResults(){
    const counts={ok:0,warn:0,blank:0}; answers.forEach(a=>counts[a.state]++);
    $("summary").textContent=`読取 ${counts.ok}問 ／ 要確認 ${counts.warn}問 ／ 未記入 ${counts.blank}問`;
    $("results").innerHTML=answers.map(a=>`<div class="answer ${a.state}" title="濃さ ${a.best.toFixed(1)} / 次点 ${a.second.toFixed(1)}"><b>${a.number}</b><span>${a.value}</span></div>`).join("");
    $("resultCard").classList.remove("hidden");
    $("resultCard").scrollIntoView({behavior:"smooth",block:"start"});
  }

  $("copyButton").onclick=async()=>{
    const text=answers.map(a=>a.state==="ok"?a.value:"").join("");
    try{await navigator.clipboard.writeText(text);$("copyStatus").textContent="1〜60の解答番号をコピーしました（要確認・未記入は空欄）。";}
    catch(_){$("copyStatus").textContent=`コピーできませんでした：${text}`;}
  };
})();
