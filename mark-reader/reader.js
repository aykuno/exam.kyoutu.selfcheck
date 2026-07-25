(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const KANA = ["ア","イ","ウ","エ","オ","カ","キ","ク","ケ","コ","サ","シ","ス","セ","ソ","タ","チ","ツ","テ","ト","ナ","ニ","ヌ","ネ","ノ","ハ","ヒ","フ","ヘ","ホ"];
  const TEMPLATES = {
    math1: {name:"数学①", pages:[[1,2],[3,4]], choices:null},
    math2: {name:"数学②", pages:[[1,2,3],[4,5,6,7]], choices:[4,5,6,7]}
  };
  let subject = "math1", pageIndex = 0, pageData = [], selectedQuestions = new Set();

  document.querySelectorAll(".subject").forEach(button => button.onclick = () => {
    subject = button.dataset.subject;
    document.querySelectorAll(".subject").forEach(x => x.classList.toggle("selected", x === button));
    $("startButton").textContent = `${TEMPLATES[subject].name} 第1面を撮影する`;
  });
  $("startButton").onclick = begin;
  $("backButton").onclick = () => show("setupCard");
  $("retryButton").onclick = () => showCapture();
  $("rescanButton").onclick = reset;
  $("fileInput").onchange = () => {
    const file = $("fileInput").files && $("fileInput").files[0];
    if (file) readPage(file);
    $("fileInput").value = "";
  };

  function begin(){ pageIndex=0;pageData=[];selectedQuestions.clear();showCapture(); }
  function reset(){ pageIndex=0;pageData=[];selectedQuestions.clear();show("setupCard"); }
  function show(id){ ["setupCard","captureCard","workingCard","errorCard","resultCard"].forEach(x => $(x).classList.toggle("hidden",x!==id)); }
  function showCapture(){
    $("captureTitle").textContent=`${TEMPLATES[subject].name} 第${pageIndex+1}面を撮影`;
    $("captureHelp").textContent=pageIndex===0?"用紙全体と、各解答欄の四隅にある黒い四角を入れてください。":"裏返した第2面を、同じように用紙全体が入るよう撮影してください。";
    $("step1").className=pageIndex===0?"active":"done";
    $("step2").className=pageIndex===1?"active":"";
    show("captureCard");
  }
  function nextFrame(){ return new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve,0))); }
  function rotateCanvas(source,angle){
    if(!angle)return source;
    const out=document.createElement("canvas");out.width=source.height;out.height=source.width;
    const ctx=out.getContext("2d");ctx.translate(out.width/2,out.height/2);ctx.rotate(angle*Math.PI/180);ctx.drawImage(source,-source.width/2,-source.height/2);
    return out;
  }

  async function readPage(file){
    show("workingCard");$("workingText").textContent="写真を読み込んでいます…";
    try{
      const bitmap=await createImageBitmap(file,{imageOrientation:"from-image"});
      const scale=Math.min(1,2000/Math.max(bitmap.width,bitmap.height));
      const base=document.createElement("canvas");
      base.width=Math.round(bitmap.width*scale);base.height=Math.round(bitmap.height*scale);
      base.getContext("2d").drawImage(bitmap,0,0,base.width,base.height);bitmap.close();
      await nextFrame();$("workingText").textContent="解答欄を自動検出しています…";
      const expected=TEMPLATES[subject].pages[pageIndex].length;
      let canvas,image,boxes=[];
      for(const angle of[0,90,-90]){
        const candidate=rotateCanvas(base,angle);
        const candidateImage=candidate.getContext("2d",{willReadFrequently:true}).getImageData(0,0,candidate.width,candidate.height);
        const candidateBoxes=detectAnswerBoxes(candidateImage,expected);
        if(candidateBoxes.length===expected){canvas=candidate;image=candidateImage;boxes=candidateBoxes;break;}
      }
      if(boxes.length!==expected) throw new Error(`第${pageIndex+1}面の解答欄を${expected}個すべて検出できませんでした。用紙全体を入れ、影や反射を避けて撮り直してください。`);
      await nextFrame();$("workingText").textContent="鉛筆のマークを判定しています…";
      const questionNumbers=TEMPLATES[subject].pages[pageIndex];
      const questions=boxes.map((box,i)=>({number:questionNumbers[i],answers:readBlock(image,box)}));
      pageData.push({questions,preview:makePreview(canvas,boxes,questionNumbers),fileName:file.name});
      pageIndex++;
      if(pageIndex<2) showCapture(); else finish();
    }catch(error){
      $("errorText").textContent=error?.message||"画像を処理できませんでした。別の写真でお試しください。";
      show("errorCard");
    }
  }

  function grayAt(data,i){ return(data[i]*77+data[i+1]*150+data[i+2]*29)>>8; }
  function detectComponents(image){
    const {width:w,height:h,data}=image,dark=new Uint8Array(w*h),seen=new Uint8Array(w*h),queue=new Int32Array(w*h),found=[];
    for(let p=0,i=0;p<dark.length;p++,i+=4)dark[p]=grayAt(data,i)<90?1:0;
    for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
      const seed=y*w+x;if(!dark[seed]||seen[seed])continue;
      let head=0,tail=1,area=0,minX=x,maxX=x,minY=y,maxY=y;queue[0]=seed;seen[seed]=1;
      while(head<tail){const q=queue[head++],qx=q%w,qy=(q/w)|0;area++;minX=Math.min(minX,qx);maxX=Math.max(maxX,qx);minY=Math.min(minY,qy);maxY=Math.max(maxY,qy);
        for(const n of[q-1,q+1,q-w,q+w])if(n>0&&n<dark.length&&!seen[n]&&dark[n]){seen[n]=1;queue[tail++]=n;}
      }
      const bw=maxX-minX+1,bh=maxY-minY+1,fill=area/(bw*bh),aspect=bw/bh;
      if(area>=20&&area<=10000&&bw>=5&&bh>=5&&aspect>.45&&aspect<2.1&&fill>.22&&bw<w*.055&&bh<h*.09)found.push({x:(minX+maxX)/2,y:(minY+maxY)/2,w:bw,h:bh});
    }return found;
  }
  function detectAnswerBoxes(image,expected){
    const {width:w,height:h}=image,c=detectComponents(image),quads=[];
    for(let i=0;i<c.length;i++)for(let j=i+1;j<c.length;j++){
      let tl=c[i],tr=c[j];if(tl.x>tr.x)[tl,tr]=[tr,tl];
      const dx=tr.x-tl.x;if(dx<w*.105||dx>w*.245||Math.abs(tr.y-tl.y)>h*.05||((tl.y+tr.y)/2)>h*.25)continue;
      for(const bl of c){const tall=bl.y-tl.y;if(tall<h*.58||tall>h*1.04||Math.abs(bl.x-tl.x)>w*.05)continue;
        const target={x:bl.x+(tr.x-tl.x),y:bl.y+(tr.y-tl.y)},near=c.map(p=>({...p,d:Math.hypot(p.x-target.x,(p.y-target.y)*1.35)})).sort((a,b)=>a.d-b.d)[0];
        if(!near||near.d>w*.06)continue;const br=near,centerX=(tl.x+tr.x+bl.x+br.x)/4,centerY=(tl.y+tr.y+bl.y+br.y)/4;
        const widthChange=Math.abs((br.x-bl.x)-dx),score=tall*2+(tl.w+tr.w+bl.w+br.w)*1.5-widthChange*3;
        quads.push({tl,tr,br,bl,centerX,centerY,score});
      }
    }
    quads.sort((a,b)=>b.score-a.score);const picked=[];
    for(const q of quads){if(picked.every(p=>Math.abs(p.centerX-q.centerX)>w*.09))picked.push(q);if(picked.length===expected)break;}
    return picked.sort((a,b)=>a.centerX-b.centerX);
  }
  function homography(dst,src){
    const a=[],b=[];for(let i=0;i<4;i++){const{x,y}=dst[i],u=src[i].x,v=src[i].y;a.push([x,y,1,0,0,0,-u*x,-u*y]);b.push(u);a.push([0,0,0,x,y,1,-v*x,-v*y]);b.push(v);}
    for(let i=0;i<8;i++){let pivot=i;for(let r=i+1;r<8;r++)if(Math.abs(a[r][i])>Math.abs(a[pivot][i]))pivot=r;[a[i],a[pivot]]=[a[pivot],a[i]];[b[i],b[pivot]]=[b[pivot],b[i]];
      const d=a[i][i];if(Math.abs(d)<1e-9)throw new Error("用紙の傾きを補正できませんでした。");for(let x=i;x<8;x++)a[i][x]/=d;b[i]/=d;
      for(let r=0;r<8;r++)if(r!==i){const f=a[r][i];for(let x=i;x<8;x++)a[r][x]-=f*a[i][x];b[r]-=f*b[i];}
    }return[...b,1];
  }
  function sampleDarkness(image,h,x,y,rx,ry){
    let sum=0,count=0;for(let yy=Math.floor(y-ry);yy<=Math.ceil(y+ry);yy++)for(let xx=Math.floor(x-rx);xx<=Math.ceil(x+rx);xx++){
      if(((xx-x)/rx)**2+((yy-y)/ry)**2>1)continue;const z=h[6]*xx+h[7]*yy+1,sx=Math.round((h[0]*xx+h[1]*yy+h[2])/z),sy=Math.round((h[3]*xx+h[4]*yy+h[5])/z);
      if(sx<0||sy<0||sx>=image.width||sy>=image.height)continue;sum+=255-grayAt(image.data,(sy*image.width+sx)*4);count++;
    }return count?sum/count:0;
  }
  function readBlock(image,box){
    const W=600,H=1800,h=homography([{x:0,y:0},{x:W,y:0},{x:W,y:H},{x:0,y:H}],[box.tl,box.tr,box.br,box.bl]),out=[];
    for(let row=0;row<30;row++){const y=84+row*(1790-84)/29,scores=[];for(let choice=0;choice<10;choice++)scores.push(sampleDarkness(image,h,115+choice*48.3,y,14,20));
      const ranked=scores.map((score,i)=>({score,i})).sort((a,b)=>b.score-a.score),baseline=scores.slice().sort((a,b)=>a-b)[5],lift=ranked[0].score-baseline,gap=ranked[0].score-ranked[1].score;
      let state="ok",value=ranked[0].i;if(ranked[0].score<52||lift<20){state="blank";value="";}else if(gap<12)state="warn";
      out.push({symbol:KANA[row],value,state,best:ranked[0].score,gap});
    }return out;
  }
  function makePreview(source,boxes,numbers){
    const canvas=document.createElement("canvas"),ctx=canvas.getContext("2d");canvas.width=source.width;canvas.height=source.height;ctx.drawImage(source,0,0);
    ctx.strokeStyle="#1769ff";ctx.fillStyle="#1769ff";ctx.lineWidth=Math.max(3,source.width/450);ctx.font=`bold ${Math.max(18,source.width/55)}px sans-serif`;
    boxes.forEach((q,i)=>{ctx.beginPath();ctx.moveTo(q.tl.x,q.tl.y);ctx.lineTo(q.tr.x,q.tr.y);ctx.lineTo(q.br.x,q.br.y);ctx.lineTo(q.bl.x,q.bl.y);ctx.closePath();ctx.stroke();ctx.fillText(`第${numbers[i]}問`,q.tl.x,q.tl.y-8);});
    return canvas.toDataURL("image/jpeg",.82);
  }

  function finish(){
    const questions=pageData.flatMap(p=>p.questions),counts={ok:0,warn:0,blank:0};questions.flatMap(q=>q.answers).forEach(a=>counts[a.state]++);
    $("summary").textContent=`${TEMPLATES[subject].name}・全${questions.length}欄／読取済み ${counts.ok}・要確認 ${counts.warn}・未記入 ${counts.blank}`;
    if(subject==="math2"){const activity=questions.filter(q=>q.number>=4).map(q=>({number:q.number,count:q.answers.filter(a=>a.value!==""&&a.state!=="blank").length})).sort((a,b)=>b.count-a.count);selectedQuestions=new Set(activity.slice(0,3).map(x=>x.number));renderSelection();}
    else $("selectionPanel").classList.add("hidden");
    $("results").innerHTML=questions.map(renderQuestion).join("");
    $("results").querySelectorAll("select").forEach(select=>select.onchange=()=>{const q=questions.find(x=>x.number===+select.dataset.question),a=q.answers[+select.dataset.row];a.value=select.value===""?"":+select.value;a.state=select.value===""?"blank":"ok";select.closest(".answer").className=`answer ${a.state}`;});
    $("previews").innerHTML=pageData.map((p,i)=>`<figure><figcaption>第${i+1}面</figcaption><img src="${p.preview}" alt="第${i+1}面の検出結果"></figure>`).join("");
    $("copyStatus").textContent="";show("resultCard");
  }
  function renderQuestion(q){
    return `<section class="question${subject==="math2"&&q.number>=4&&!selectedQuestions.has(q.number)?" unselected":""}" data-question="${q.number}"><h3>第${q.number}問${subject==="math2"&&q.number>=4?` <span>${selectedQuestions.has(q.number)?"選択":"未選択"}</span>`:""}</h3><div class="results">${q.answers.map((a,row)=>`<div class="answer ${a.state}"><label>${a.symbol}</label><select data-question="${q.number}" data-row="${row}" aria-label="第${q.number}問 ${a.symbol}"><option value="">—</option>${Array.from({length:10},(_,i)=>`<option value="${i}"${a.value===i?" selected":""}>${i}</option>`).join("")}</select></div>`).join("")}</div></section>`;
  }
  function renderSelection(){
    $("selectionPanel").classList.remove("hidden");
    $("selectionButtons").innerHTML=[4,5,6,7].map(n=>`<button type="button" data-number="${n}" class="${selectedQuestions.has(n)?"selected":""}">第${n}問</button>`).join("");
    $("selectionButtons").querySelectorAll("button").forEach(button=>button.onclick=()=>{const n=+button.dataset.number;if(selectedQuestions.has(n))selectedQuestions.delete(n);else if(selectedQuestions.size<3)selectedQuestions.add(n);else{$("copyStatus").textContent="選択できる大問は3問です。";return;}renderSelectionState();});
  }
  function renderSelectionState(){
    renderSelection();document.querySelectorAll(".question[data-question]").forEach(el=>{const n=+el.dataset.question;if(n<4)return;const on=selectedQuestions.has(n);el.classList.toggle("unselected",!on);el.querySelector("h3 span").textContent=on?"選択":"未選択";});
  }
  $("copyButton").onclick=async()=>{
    if(subject==="math2"&&selectedQuestions.size!==3){$("copyStatus").textContent="選択した大問を3問にしてください。";return;}
    const questions=pageData.flatMap(p=>p.questions).filter(q=>subject!=="math2"||q.number<4||selectedQuestions.has(q.number)),text=questions.flatMap(q=>q.answers).map(a=>a.value).join("");
    try{await navigator.clipboard.writeText(text);$("copyStatus").textContent=`${TEMPLATES[subject].name}の解答番号をコピーしました。`;}catch(_){$("copyStatus").textContent=`コピーできませんでした：${text}`;}
  };
})();
