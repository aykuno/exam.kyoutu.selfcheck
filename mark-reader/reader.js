(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const inputs = [document.querySelector("#fileInput"), document.querySelector("#errorCard input")];
  const preview = $("previewCanvas");
  const pctx = preview.getContext("2d");
  let answers = [];

  inputs.forEach(input => input.addEventListener("change", () => {
    const file = input.files && input.files[0];
    if (file) start(file);
    input.value = "";
  }));
  $("rescanButton").onclick = () => inputs[0].click();

  async function start(file) {
    show("workingCard");
    $("workingText").textContent = "写真を読み込んでいます…";
    try {
      const bitmap = await createImageBitmap(file, {imageOrientation:"from-image"});
      await nextFrame();
      const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const ctx = canvas.getContext("2d", {willReadFrequently:true});
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      $("workingText").textContent = "解答欄の基準マークを検出しています…";
      await nextFrame();
      const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const boxes = detectAnswerBoxes(image);
      if (boxes.length !== 2) throw new Error("解答欄の黒い基準マークを2組とも検出できませんでした。用紙全体を入れ、影や反射を避けて、真上に近い位置から撮影してください。");
      boxes.sort((a,b) => a.centerX-b.centerX);
      $("workingText").textContent = "1〜60のマークを判定しています…";
      await nextFrame();
      answers = boxes.flatMap((box, block) => readBlock(image, box, block));
      drawPreview(canvas, boxes);
      render();
    } catch (error) {
      $("errorText").textContent = error && error.message ? error.message : "画像を処理できませんでした。別の写真でお試しください。";
      show("errorCard");
    }
  }

  function nextFrame(){ return new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0))); }
  function show(id){ ["workingCard","errorCard","resultCard"].forEach(x => $(x).classList.toggle("hidden",x!==id)); }

  function grayAt(data, i) {
    return (data[i]*77 + data[i+1]*150 + data[i+2]*29) >> 8;
  }

  function detectComponents(image) {
    const {width:w,height:h,data} = image;
    const dark = new Uint8Array(w*h);
    for(let p=0,i=0;p<dark.length;p++,i+=4) dark[p] = grayAt(data,i) < 72 ? 1 : 0;
    const seen = new Uint8Array(w*h), queue = new Int32Array(w*h);
    const found = [];
    for(let y=1;y<h-1;y++) for(let x=1;x<w-1;x++) {
      const seed=y*w+x;
      if(!dark[seed]||seen[seed]) continue;
      let head=0,tail=1,area=0,minX=x,maxX=x,minY=y,maxY=y;
      queue[0]=seed;seen[seed]=1;
      while(head<tail){
        const q=queue[head++], qx=q%w, qy=(q/w)|0;
        area++; if(qx<minX)minX=qx;if(qx>maxX)maxX=qx;if(qy<minY)minY=qy;if(qy>maxY)maxY=qy;
        const ns=[q-1,q+1,q-w,q+w];
        for(const n of ns) if(n>0&&n<dark.length&&!seen[n]&&dark[n]){seen[n]=1;queue[tail++]=n;}
      }
      const bw=maxX-minX+1,bh=maxY-minY+1,fill=area/(bw*bh),aspect=bw/bh;
      if(area>=35&&area<=5000&&bw>=7&&bh>=7&&aspect>.62&&aspect<1.6&&fill>.48&&bw<w*.045&&bh<h*.07){
        found.push({x:(minX+maxX)/2,y:(minY+maxY)/2,w:bw,h:bh,area,fill});
      }
    }
    return found;
  }

  function detectAnswerBoxes(image) {
    const {width:w,height:h}=image;
    const c=detectComponents(image);
    const quads=[];
    for(let i=0;i<c.length;i++) for(let j=i+1;j<c.length;j++){
      let tl=c[i],tr=c[j]; if(tl.x>tr.x)[tl,tr]=[tr,tl];
      const dx=tr.x-tl.x;
      if(dx<w*.12||dx>w*.20||Math.abs(tr.y-tl.y)>h*.035||((tl.y+tr.y)/2)>h*.22)continue;
      for(const bl of c){
        const tall=bl.y-tl.y;
        if(tall<h*.62||tall>h*1.02||Math.abs(bl.x-tl.x)>w*.04)continue;
        const predicted={x:bl.x+(tr.x-tl.x),y:bl.y+(tr.y-tl.y),w:tr.w,h:tr.h};
        const br=c.reduce((best,p)=>{
          const distance=Math.hypot(p.x-predicted.x,(p.y-predicted.y)*1.4);
          return distance<(best.distance||w*.055)?{...p,distance}:best;
        },predicted);
        delete br.distance;
        const centerX=(tl.x+tr.x+bl.x+br.x)/4;
        if(centerX<w*.48)continue;
        const size=[tl,tr,bl,br].reduce((s,p)=>s+p.w+p.h,0)/8;
        const widthChange=Math.abs((br.x-bl.x)-dx);
        quads.push({tl,tr,br,bl,centerX,score:tall*2+size*3-widthChange*3});
      }
    }
    quads.sort((a,b)=>b.score-a.score);
    const picked=[];
    for(const q of quads){
      if(picked.every(p=>Math.abs(p.centerX-q.centerX)>w*.12))picked.push(q);
      if(picked.length===2)break;
    }
    return picked;
  }

  function homography(dst,src) {
    const a=[],b=[];
    for(let i=0;i<4;i++){
      const x=dst[i].x,y=dst[i].y,u=src[i].x,v=src[i].y;
      a.push([x,y,1,0,0,0,-u*x,-u*y]);b.push(u);
      a.push([0,0,0,x,y,1,-v*x,-v*y]);b.push(v);
    }
    for(let i=0;i<8;i++){
      let pivot=i;for(let r=i+1;r<8;r++)if(Math.abs(a[r][i])>Math.abs(a[pivot][i]))pivot=r;
      [a[i],a[pivot]]=[a[pivot],a[i]];[b[i],b[pivot]]=[b[pivot],b[i]];
      const d=a[i][i];if(Math.abs(d)<1e-9)throw new Error("用紙の傾きを補正できませんでした。");
      for(let x=i;x<8;x++)a[i][x]/=d;b[i]/=d;
      for(let r=0;r<8;r++)if(r!==i){const f=a[r][i];for(let x=i;x<8;x++)a[r][x]-=f*a[i][x];b[r]-=f*b[i];}
    }
    return [...b,1];
  }

  function sampleDarkness(image,h,x,y,rx,ry){
    let sum=0,count=0;
    for(let yy=Math.floor(y-ry);yy<=Math.ceil(y+ry);yy++)for(let xx=Math.floor(x-rx);xx<=Math.ceil(x+rx);xx++){
      if(((xx-x)/rx)**2+((yy-y)/ry)**2>1)continue;
      const z=h[6]*xx+h[7]*yy+1,sx=Math.round((h[0]*xx+h[1]*yy+h[2])/z),sy=Math.round((h[3]*xx+h[4]*yy+h[5])/z);
      if(sx<0||sy<0||sx>=image.width||sy>=image.height)continue;
      const i=(sy*image.width+sx)*4;sum+=255-grayAt(image.data,i);count++;
    }
    return count?sum/count:0;
  }

  function readBlock(image,box,block){
    const W=600,H=1800;
    const h=homography([{x:0,y:0},{x:W,y:0},{x:W,y:H},{x:0,y:H}],[box.tl,box.tr,box.br,box.bl]);
    const out=[];
    for(let row=0;row<30;row++){
      const y=84+row*(1790-84)/29;
      const scores=[];
      for(let choice=0;choice<9;choice++)scores.push(sampleDarkness(image,h,163+choice*48.3,y,14,20));
      const ranked=scores.map((score,i)=>({score,i})).sort((a,b)=>b.score-a.score);
      const baseline=scores.slice().sort((a,b)=>a-b)[4];
      const lift=ranked[0].score-baseline, gap=ranked[0].score-ranked[1].score;
      let state="ok",value=ranked[0].i+1;
      if(ranked[0].score<52||lift<20){state="blank";value="";}
      else if(gap<12){state="warn";}
      out.push({number:block*30+row+1,value,state,best:ranked[0].score,gap});
    }
    return out;
  }

  function drawPreview(source,boxes){
    preview.width=source.width;preview.height=source.height;pctx.drawImage(source,0,0);
    pctx.strokeStyle="#1769ff";pctx.fillStyle="#1769ff";pctx.lineWidth=Math.max(3,source.width/450);pctx.font=`bold ${Math.max(18,source.width/55)}px sans-serif`;
    boxes.forEach((q,i)=>{pctx.beginPath();pctx.moveTo(q.tl.x,q.tl.y);pctx.lineTo(q.tr.x,q.tr.y);pctx.lineTo(q.br.x,q.br.y);pctx.lineTo(q.bl.x,q.bl.y);pctx.closePath();pctx.stroke();pctx.fillText(i===0?"1〜30":"31〜60",q.tl.x,q.tl.y-8);});
  }

  function render(){
    const counts={ok:0,warn:0,blank:0};answers.forEach(a=>counts[a.state]++);
    $("summary").textContent=`読取済み ${counts.ok}問・要確認 ${counts.warn}問・未記入 ${counts.blank}問`;
    $("results").innerHTML=answers.map(a=>`<div class="answer ${a.state}"><label for="a${a.number}">${a.number}</label><select id="a${a.number}" data-index="${a.number-1}" aria-label="${a.number}番"><option value="">—</option>${Array.from({length:9},(_,i)=>`<option value="${i+1}"${a.value===i+1?" selected":""}>${i+1}</option>`).join("")}</select></div>`).join("");
    $("results").querySelectorAll("select").forEach(select=>select.onchange=()=>{const a=answers[+select.dataset.index];a.value=select.value?+select.value:"";a.state=select.value?"ok":"blank";select.parentElement.className=`answer ${a.state}`;});
    $("copyStatus").textContent="";show("resultCard");
  }

  $("copyButton").onclick=async()=>{
    const text=answers.map(a=>a.value||"").join("");
    try{await navigator.clipboard.writeText(text);$("copyStatus").textContent="1〜60の解答番号をコピーしました。";}
    catch(_){$("copyStatus").textContent=`コピーできませんでした：${text}`;}
  };
})();
