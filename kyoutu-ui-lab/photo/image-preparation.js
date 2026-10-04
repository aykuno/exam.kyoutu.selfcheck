/* 写真の全体像と重なり付き拡大 v20261004-accuracy1 */
(() => {
  "use strict";
  // インライン要求の上限20MBに対し、文字列・JSON用の余裕を残す。
  const MAX_DATA_CHARS=16*1024*1024;
  function detailRegions(width,height) {
    if (Math.max(width,height)<2200 || Math.min(width,height)<1000) return [];
    // 左端の欄名と全選択肢を分断しないよう、全幅の帯にする。
    return [
      {x:0,y:0,width,height:Math.ceil(height*.56),label:"上部"},
      {x:0,y:Math.floor(height*.44),width,height:height-Math.floor(height*.44),label:"下部"}
    ];
  }
  async function decode(file) {
    try {
      const image=await createImageBitmap(file,{imageOrientation:"from-image"});
      return {image,close:()=>image.close()};
    } catch (_) {
      const url=URL.createObjectURL(file),image=new Image();
      try {
        await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=url;});
        return {image,close:()=>{}};
      } finally { URL.revokeObjectURL(url); }
    }
  }
  function encode(image,region,maxEdge,budget) {
    let edge=Math.min(maxEdge,Math.max(region.width,region.height));
    for (let attempt=0;attempt<8;attempt++,edge*=.78) {
      const scale=Math.min(1,edge/Math.max(region.width,region.height));
      const canvas=document.createElement("canvas");
      canvas.width=Math.max(1,Math.round(region.width*scale));
      canvas.height=Math.max(1,Math.round(region.height*scale));
      const ctx=canvas.getContext("2d");
      if (!ctx) throw new Error("写真を読み込む画面処理を準備できませんでした。");
      ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
      ctx.drawImage(image,region.x,region.y,region.width,region.height,0,0,canvas.width,canvas.height);
      const data=canvas.toDataURL("image/jpeg",.94).split(",")[1];
      const dimensions={width:canvas.width,height:canvas.height};
      canvas.width=canvas.height=1;
      if (data && data.length<=budget) return {data,mimeType:"image/jpeg",...dimensions};
    }
    throw new Error("写真のサイズを調整できませんでした。同じ写真で再試行できます。");
  }
  async function prepare(files) {
    if (!files?.length || files.length>8) throw new Error("写真は1〜8枚を選択してください。");
    const images=[],perPage=Math.floor(MAX_DATA_CHARS/files.length);
    for (let page=0;page<files.length;page++) {
      const {image,close}=await decode(files[page]);
      try {
        if (!image.width || !image.height) throw new Error("写真の大きさを確認できませんでした。");
        const regions=detailRegions(image.width,image.height);
        const whole=encode(image,{x:0,y:0,width:image.width,height:image.height},3072,
          regions.length ? Math.floor(perPage*.5) : perPage);
        images.push({...whole,page:page+1,view:"overview",region:"全体"});
        if (regions.length) {
          const budget=Math.floor((perPage-whole.data.length)/regions.length);
          for (const region of regions) {
            images.push({...encode(image,region,2400,budget),page:page+1,view:"detail",
              region:region.label,sourceRegion:{
                x:region.x/image.width,y:region.y/image.height,
                width:region.width/image.width,height:region.height/image.height
              }});
          }
        }
      } finally { close(); }
    }
    return images;
  }
  window.PhotoImagePreparation=Object.freeze({prepare,detailRegions,MAX_DATA_CHARS});
})();
