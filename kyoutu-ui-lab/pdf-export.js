/* Main PDF exporter: exact v1.3 issuance pipeline adapted to live results
 * live result data -> pure SVG (no foreignObject) -> high-resolution Canvas -> JPEG -> hand-built PDF
 * iPhone/iPad Safari: File + Web Share
 * Other browsers: Object URL direct download
 * No data-URI delivery and no print fallback.
 */
(function(){
  'use strict';

  const VERSION = 'v1.3-main-pure-svg';
  const W = 1240;
  const H = 1754;
  const RENDER_SCALE = 2.33;
  const RASTER_W = Math.round(W * RENDER_SCALE);
  const RASTER_H = Math.round(H * RENDER_SCALE);
  const JPEG_QUALITY = 0.97;
  const LEFT = 58;
  const RIGHT = 1182;
  const CONTENT_W = RIGHT - LEFT;
  const FOOTER_Y = 1700;
  const TEXT = '#1d2433';
  const MUTED = '#647086';
  const LINE = '#d9deea';
  const BLUE = '#2f5fd0';
  const BAD = '#b3261e';
  const WARN = '#8a5b00';
  const GOOD = '#137333';
  const FONT = '-apple-system,BlinkMacSystemFont,Segoe UI,Hiragino Sans,Yu Gothic,Meiryo,sans-serif';

  const xml = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'
  })[c]);
  const pad = n => String(n).padStart(2,'0');
  const fileStamp = d => d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate())+'_'+pad(d.getHours())+pad(d.getMinutes());
  const safeFile = s => String(s == null ? '' : s).replace(/[\\/:*?"<>|\s]+/g,'_').replace(/^_+|_+$/g,'').slice(0,70) || 'result';
  const textOf = el => (el && (el.innerText || el.textContent) || '').replace(/\s+/g,' ').trim();

  function fitSize(text, base, min, approxWidth){
    const s = String(text || '');
    if(!s) return base;
    const estimated = Array.from(s).reduce((sum,ch)=>sum + (/^[\x00-\xff]$/.test(ch) ? .56 : 1),0) * base;
    if(estimated <= approxWidth) return base;
    return Math.max(min, Math.floor(base * approxWidth / estimated));
  }

  function splitChars(text, maxChars, maxLines){
    const src = String(text == null ? '' : text);
    if(!src) return [''];
    const out=[];
    let current='';
    let width=0;
    for(const ch of Array.from(src)){
      const w = /^[\x00-\xff]$/.test(ch) ? .58 : 1;
      if(current && width + w > maxChars){ out.push(current); current=ch; width=w; }
      else { current += ch; width += w; }
    }
    if(current) out.push(current);
    if(maxLines && out.length > maxLines){
      const clipped = out.slice(0,maxLines);
      clipped[maxLines-1] = clipped[maxLines-1].replace(/.$/,'…');
      return clipped;
    }
    return out;
  }

  function getLiveData(){
    const result = document.getElementById('result');
    if(!result) throw new Error('採点結果エリアが見つかりません。');
    const table = result.querySelector('.resultTable');
    if(!table) throw new Error('全問正誤表が見つかりません。先に採点してください。');

    const exam = textOf(result.querySelector('.resultExamLine')) || textOf(result.querySelector('.resultSummaryMeta')) || '採点結果';
    const subject = textOf(result.querySelector('.resultSubjectLine')) || textOf(result.querySelector('.resultSummarySubject')) || '';

    const summary = Array.from(result.querySelectorAll('.resultSummaryStat')).map(el=>({
      label:textOf(el.querySelector('span')),
      value:textOf(el.querySelector('b'))
    }));
    while(summary.length < 4) summary.push({label:'',value:''});

    const averageLabel = textOf(result.querySelector('.avgScoreMetric .avgLabel'));
    const averageValue = textOf(result.querySelector('.avgScoreMetric .avgValue'));

    const sectionRows = Array.from(result.querySelectorAll('.sectionStats tbody tr')).map(tr=>Array.from(tr.cells).map(td=>textOf(td)));
    const headers = Array.from(table.querySelectorAll('thead th')).map(th=>textOf(th));
    const rows = Array.from(table.querySelectorAll('tbody tr')).map(tr=>Array.from(tr.cells).map(td=>textOf(td)));

    return {exam,subject,summary,averageLabel,averageValue,sectionRows,headers,rows};
  }

  function svgStart(){
    return [`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="white"/>`];
  }
  function text(p,s,x,y,size=18,color=TEXT,weight=400,anchor='start'){
    p.push(`<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" fill="${color}" font-weight="${weight}" text-anchor="${anchor}">${xml(s)}</text>`);
  }
  function rect(p,x,y,w,h,fill='#fbfcff',stroke=LINE,r=0){
    p.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}"/>`);
  }
  function line(p,x1,y1,x2,y2,color=LINE,width=1){
    p.push(`<path d="M${x1} ${y1}L${x2} ${y2}" fill="none" stroke="${color}" stroke-width="${width}"/>`);
  }
  function textLines(p,lines,x,y,size,color=TEXT,weight=400,lineHeight=null,anchor='start'){
    const lh = lineHeight || Math.round(size*1.25);
    lines.forEach((s,i)=>text(p,s,x,y+i*lh,size,color,weight,anchor));
  }

  function drawSummary(p,data){
    text(p,'採点結果',LEFT,62,16,MUTED,600);
    text(p,data.exam,LEFT,108,fitSize(data.exam,34,23,650),TEXT,700);
    text(p,data.subject,LEFT,150,fitSize(data.subject,34,23,650),TEXT,700);

    rect(p,LEFT,195,CONTENT_W,110,'#fbfcff','#dfe7fb',16);
    text(p,data.subject,78,234,fitSize(data.subject,23,17,245),TEXT,700);
    text(p,data.exam,78,271,fitSize(data.exam,15,11,245),MUTED,600);
    if(data.averageValue){
      text(p,data.averageLabel || '受験者平均点',78,289,11,MUTED,600);
      text(p,data.averageValue,190,289,14,TEXT,700);
    }

    data.summary.slice(0,4).forEach((item,i)=>{
      const x = 354 + i*200;
      rect(p,x,210,188,80,'#fff','#dfe7fb',10);
      text(p,item.label,x+12,235,14,MUTED,600);
      text(p,item.value,x+12,273,fitSize(item.value,25,18,162),TEXT,700);
    });
  }

  function drawRadarPanel(p,data){
    const rows = data.sectionRows;
    if(!rows.length) return 325;
    rect(p,LEFT,325,CONTENT_W,310,'#fbfcff',LINE,16);
    text(p,'問題番号別正答率',78,362,23,TEXT,700);

    const n = rows.length;
    const cx = 272, cy = 505, rad = Math.min(90, 105 - Math.max(0,n-5)*3);
    const point=(i,r)=>[cx+Math.cos(-Math.PI/2+i*Math.PI*2/n)*r,cy+Math.sin(-Math.PI/2+i*Math.PI*2/n)*r];
    for(let k=1;k<=4;k++){
      p.push(`<polygon points="${rows.map((_,i)=>point(i,rad*k/4).join(',')).join(' ')}" fill="none" stroke="${LINE}"/>`);
    }
    rows.forEach((row,i)=>{
      const end=point(i,rad); line(p,cx,cy,end[0],end[1]);
      const lab=point(i,rad+25); text(p,row[0],lab[0],lab[1]+5,Math.max(10,15-Math.max(0,n-6)),TEXT,600,'middle');
    });
    const scorePoints=rows.map((row,i)=>{
      const rate = Math.max(0,Math.min(100,parseFloat(String(row[2]||'0').replace('%',''))||0))/100;
      return point(i,rad*rate);
    });
    p.push(`<polygon points="${scorePoints.map(a=>a.join(',')).join(' ')}" fill="rgba(47,95,208,.20)" stroke="${BLUE}" stroke-width="2"/>`);
    scorePoints.forEach(a=>p.push(`<circle cx="${a[0]}" cy="${a[1]}" r="4" fill="${BLUE}"/>`));

    const startX=500, col=[0,145,285,405,535];
    const heads=['問題番号','得点','正答率','正答項目','未入力'];
    heads.forEach((h,j)=>text(p,h,startX+col[j],397,13,MUTED,700));
    rows.slice(0,8).forEach((row,i)=>{
      const yy=430+i*31;
      row.slice(0,5).forEach((v,j)=>text(p,v,startX+col[j],yy,15,TEXT,500));
      line(p,startX,yy+10,1158,yy+10);
    });
    return 635;
  }

  const COL_WIDTHS=[210,105,220,75,100,130,284];
  function colXs(){
    const xs=[LEFT];
    COL_WIDTHS.forEach((w,i)=>xs.push(xs[i]+w));
    return xs;
  }

  function drawTableHeader(p,y,headers){
    const xs=colXs();
    rect(p,LEFT,y,CONTENT_W,32,'#f7f8fc','#f7f8fc',0);
    (headers.length?headers:['番号','自分','正解','判定','得点','受験者正答率','注記']).slice(0,7).forEach((h,i)=>{
      const center = i===3 || i===4;
      text(p,h,center ? xs[i]+COL_WIDTHS[i]/2 : xs[i]+8,y+23,15,MUTED,700,center?'middle':'start');
    });
    return y+32;
  }

  function drawDataRow(p,row,y){
    const xs=colXs();
    const h=41;
    const judge=row[3]||'';
    row.slice(0,7).forEach((value,i)=>{
      const center=i===3||i===4;
      const color=i===3?(judge==='○'?GOOD:judge==='△'?WARN:judge==='×'?BAD:TEXT):(i===6?MUTED:TEXT);
      const weight=i===3?700:400;
      const size=i===3?24:(i===6?11:16);
      if(i===6){
        const lines=splitChars(value,25,2);
        textLines(p,lines,xs[i]+8,y+16,size,color,weight,13);
      }else if(i===2){
        const lines=splitChars(value,18,2);
        textLines(p,lines,center?xs[i]+COL_WIDTHS[i]/2:xs[i]+8,y+17,size,color,weight,16,center?'middle':'start');
      }else{
        text(p,value,center?xs[i]+COL_WIDTHS[i]/2:xs[i]+8,y+27,size,color,weight,center?'middle':'start');
      }
    });
    line(p,LEFT,y+h,RIGHT,y+h);
    return y+h;
  }

  function badRows(data){
    return data.rows.filter(r=>r[1]==='未入力'||r[3]==='×'||r[3]==='△');
  }

  function missedHeight(count){
    if(!count) return 70;
    return 58 + Math.ceil(count/6)*52 + 22;
  }

  function drawMissed(p,rows,y,maxRows){
    const use=rows.slice(0,maxRows);
    if(!rows.length){
      rect(p,LEFT,y,CONTENT_W,60,'#f3faf5','#cfe8d4',14);
      text(p,'間違えた問題・未入力はありません',76,y+37,17,GOOD,700);
      return {used:0,nextY:y+60};
    }
    const h=missedHeight(use.length);
    rect(p,LEFT,y,CONTENT_W,h,'#fff7f6','#f0c7c1',16);
    text(p,'間違えた問題・未入力',76,y+32,22,'#8c1d18',700);
    use.forEach((r,i)=>{
      const x=76+(i%6)*182;
      const yy=y+49+Math.floor(i/6)*52;
      rect(p,x,yy,173,45,'#fff','#f0d0cb',7);
      const judge=r[1]==='未入力'?'未入力':r[3]||'';
      text(p,(r[0]||'')+' '+judge,x+6,yy+14,11,'#8c1d18',700);
      text(p,'自分：'+(r[1]||'')+' / 正解：'+(r[2]||''),x+6,yy+28,9,TEXT,400);
      text(p,'得点：'+(r[4]||''),x+6,yy+40,9,TEXT,400);
    });
    return {used:use.length,nextY:y+h};
  }

  function buildSVGPages(data){
    const pages=[];
    let rowIndex=0;
    let missed=badRows(data);
    let first=true;

    while(first || rowIndex < data.rows.length){
      const p=svgStart();
      let y;
      if(first){
        drawSummary(p,data);
        y=drawRadarPanel(p,data)+36;
        first=false;
      }else{
        text(p,'全問一覧（続き）',LEFT,67,23,TEXT,700);
        y=98;
      }
      y=drawTableHeader(p,y,data.headers);
      while(rowIndex < data.rows.length && y+41 <= 1585){
        y=drawDataRow(p,data.rows[rowIndex],y);
        rowIndex++;
      }

      if(rowIndex >= data.rows.length && missed.length){
        const room=1625-y;
        const rowsFit=Math.max(0,Math.floor((room-80)/52)*6);
        if(rowsFit>0){
          const r=drawMissed(p,missed,y+18,rowsFit);
          missed=missed.slice(r.used);
        }
      }else if(rowIndex >= data.rows.length && !missed.length && y+85<1625){
        drawMissed(p,[],y+18,0);
      }
      p.push('</svg>');
      pages.push(p.join(''));
    }

    while(missed.length){
      const p=svgStart();
      text(p,'間違えた問題・未入力',LEFT,67,23,TEXT,700);
      const maxRows=6*Math.floor((1585-115)/52);
      const r=drawMissed(p,missed,98,maxRows);
      missed=missed.slice(r.used);
      p.push('</svg>');
      pages.push(p.join(''));
    }

    pages.forEach((svg,i)=>{
      const insert=`<text x="${W/2}" y="${FOOTER_Y}" font-family="${FONT}" font-size="17" fill="#344054" font-weight="600" text-anchor="middle">${i+1} / ${pages.length}</text>`;
      pages[i]=svg.replace('</svg>',insert+'</svg>');
    });
    return pages;
  }

  // This is intentionally the same SVG -> Image -> Canvas -> JPEG path used by pdf-issue-trial v1.3.
  function svgToJpegBytes(svg){
    return new Promise((resolve,reject)=>{
      const blob=new Blob([svg],{type:'image/svg+xml;charset=utf-8'});
      const url=URL.createObjectURL(blob);
      const img=new Image();
      img.onload=()=>{
        try{
          const canvas=document.createElement('canvas');
          canvas.width=RASTER_W;
          canvas.height=RASTER_H;
          const ctx=canvas.getContext('2d');
          if(!ctx) throw new Error('Canvasの描画領域を確保できませんでした。');
          ctx.fillStyle='#fff';
          ctx.fillRect(0,0,RASTER_W,RASTER_H);
          ctx.imageSmoothingEnabled=true;
          if('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality='high';
          ctx.drawImage(img,0,0,RASTER_W,RASTER_H);
          const dataUrl=canvas.toDataURL('image/jpeg',JPEG_QUALITY);
          const bin=atob(dataUrl.split(',')[1]||'');
          const bytes=new Uint8Array(bin.length);
          for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
          resolve(bytes);
        }catch(e){ reject(e); }
        finally{
          URL.revokeObjectURL(url);
          img.onload=img.onerror=null;
        }
      };
      img.onerror=()=>{
        URL.revokeObjectURL(url);
        reject(new Error('SVG画像を読み込めませんでした。'));
      };
      img.src=url;
    });
  }

  const enc=new TextEncoder();
  function ascii(s){ return enc.encode(String(s)); }

  // Same hand-built JPEG-in-PDF structure as v1.3.
  function makePdfBlob(jpegs){
    const pdfW=595.275590551;
    const pdfH=841.88976378;
    const parts=[];
    const offsets=[0];
    let len=0;
    function add(part){
      if(typeof part==='string') part=ascii(part);
      parts.push(part);
      len+=part.byteLength||part.length||0;
    }
    function obj(n,body){
      offsets[n]=len;
      add(n+' 0 obj\n');
      body.forEach(add);
      add('\nendobj\n');
    }
    add('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    const kids=[];
    for(let i=0;i<jpegs.length;i++) kids.push((3+i*3)+' 0 R');
    obj(1,['<< /Type /Catalog /Pages 2 0 R >>']);
    obj(2,['<< /Type /Pages /Kids [',kids.join(' '),'] /Count ',String(jpegs.length),' >>']);
    for(let i=0;i<jpegs.length;i++){
      const page=3+i*3;
      const content=page+1;
      const image=page+2;
      const name='Im'+(i+1);
      const stream='q\n'+pdfW.toFixed(3)+' 0 0 '+pdfH.toFixed(3)+' 0 0 cm\n/'+name+' Do\nQ\n';
      obj(page,['<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ',pdfW.toFixed(3),' ',pdfH.toFixed(3),'] /Resources << /XObject << /',name,' ',image,' 0 R >> >> /Contents ',content,' 0 R >>']);
      obj(content,['<< /Length ',String(ascii(stream).length),' >>\nstream\n',stream,'endstream']);
      offsets[image]=len;
      add(image+' 0 obj\n');
      add('<< /Type /XObject /Subtype /Image /Width '+RASTER_W+' /Height '+RASTER_H+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+jpegs[i].length+' >>\nstream\n');
      add(jpegs[i]);
      add('\nendstream\nendobj\n');
    }
    const xref=len;
    const maxObj=2+jpegs.length*3;
    add('xref\n0 '+(maxObj+1)+'\n0000000000 65535 f \n');
    for(let i=1;i<=maxObj;i++) add(String(offsets[i]).padStart(10,'0')+' 00000 n \n');
    add('trailer\n<< /Size '+(maxObj+1)+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF');
    return new Blob(parts,{type:'application/pdf'});
  }

  // Same iPhone/iPad Safari detection used by pdf-issue-trial v1.3.
  function isIOSSafariOnly(){
    const ua=navigator.userAgent||'';
    const platform=navigator.platform||'';
    const isiOS=/iPad|iPhone|iPod/.test(ua)||(platform==='MacIntel'&&navigator.maxTouchPoints>1);
    if(!isiOS) return false;
    return /Safari\//.test(ua)&&!/(CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|Instagram|FBAN|FBAV|Line)/.test(ua);
  }

  let iosPendingPdf=null;
  function closeIosPdfShareBox(){
    const old=document.getElementById('__iosPdfShareBox');
    if(old) old.remove();
  }

  // Same File + Web Share delivery UI as pdf-issue-trial v1.3.
  function showIosPdfShareBox(pdf,filename){
    closeIosPdfShareBox();
    iosPendingPdf={pdf,filename};
    const box=document.createElement('div');
    box.id='__iosPdfShareBox';
    box.style.cssText='position:fixed;inset:0;z-index:2147483647;background:rgba(15,23,42,.48);display:flex;align-items:center;justify-content:center;padding:22px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,"Hiragino Sans","Yu Gothic",Meiryo,sans-serif;';
    box.innerHTML='<div style="max-width:420px;width:100%;background:#fff;border-radius:18px;padding:18px;box-shadow:0 18px 50px rgba(15,23,42,.28);color:#1d2433">'
      +'<div style="font-weight:900;font-size:18px;margin-bottom:8px">PDFの準備ができました</div>'
      +'<div style="font-size:13px;line-height:1.55;color:#647086;font-weight:700;margin-bottom:14px">iPhone Safariでは、次のボタンからPDFファイルを共有します。共有シートで「ファイルに保存」を選んでください。プリントは使いません。</div>'
      +'<button type="button" class="iosPdfShareSave" style="width:100%;border:0;border-radius:14px;padding:13px 14px;background:#2f5fd0;color:#fff;font-weight:900;font-size:16px">PDFを保存</button>'
      +'<button type="button" class="iosPdfShareOpen" style="width:100%;border:0;border-radius:14px;padding:12px 14px;background:#e8ecf6;color:#1d2433;font-weight:900;font-size:15px;margin-top:8px">PDFを開く</button>'
      +'<button type="button" class="iosPdfShareClose" style="width:100%;border:0;border-radius:14px;padding:10px 14px;background:#fff;color:#647086;font-weight:900;font-size:14px;margin-top:6px">閉じる</button>'
      +'</div>';
    document.body.appendChild(box);
    const saveBtn=box.querySelector('.iosPdfShareSave');
    const openBtn=box.querySelector('.iosPdfShareOpen');
    const closeBtn=box.querySelector('.iosPdfShareClose');
    saveBtn.addEventListener('click',async function(){
      try{
        const p=iosPendingPdf;
        if(!p) return;
        const file=new File([p.pdf],p.filename,{type:'application/pdf'});
        if(navigator.canShare&&navigator.canShare({files:[file]})&&navigator.share){
          await navigator.share({files:[file],title:p.filename});
        }else{
          const url=URL.createObjectURL(p.pdf);
          window.open(url,'_blank','noopener');
          setTimeout(()=>URL.revokeObjectURL(url),60000);
        }
      }catch(e){
        if(e&&e.name==='AbortError') return;
        alert('PDFの共有に失敗しました: '+(e&&e.message?e.message:e));
      }
    });
    openBtn.addEventListener('click',function(){
      try{
        const p=iosPendingPdf;
        if(!p) return;
        const url=URL.createObjectURL(p.pdf);
        window.open(url,'_blank','noopener');
        setTimeout(()=>URL.revokeObjectURL(url),60000);
      }catch(e){ alert('PDFを開けませんでした: '+(e&&e.message?e.message:e)); }
    });
    closeBtn.addEventListener('click',closeIosPdfShareBox);
  }

  function deliverPdf(pdf,filename){
    if(isIOSSafariOnly()){
      showIosPdfShareBox(pdf,filename);
      return 'iPhone/iPad Safari: Web Share / File';
    }
    const url=URL.createObjectURL(pdf);
    const a=document.createElement('a');
    a.href=url;
    a.download=filename;
    a.rel='noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),30000);
    return 'Object URL direct download';
  }

  async function exportResultPdfV13(){
    const button=document.getElementById('exportPdfResult');
    const oldText=button?button.textContent:'';
    if(button){ button.disabled=true; button.textContent='PDF生成中…'; }
    try{
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      const data=getLiveData();
      const svgs=buildSVGPages(data);
      const jpegs=[];
      for(let i=0;i<svgs.length;i++) jpegs.push(await svgToJpegBytes(svgs[i]));
      const pdf=makePdfBlob(jpegs);
      const filename='採点結果_'+safeFile((data.exam?data.exam+'_':'')+(data.subject||''))+'_'+fileStamp(new Date())+'.pdf';
      deliverPdf(pdf,filename);
    }catch(error){
      console.error(error);
      alert('PDF生成に失敗しました: '+(error&&error.message?error.message:error));
    }finally{
      if(button){ button.disabled=false; button.textContent=oldText||'PDF出力（A4）'; }
    }
  }

  window.exportResultPdf=exportResultPdfV13;
  document.addEventListener('click',function(e){
    const button=e.target&&e.target.closest&&e.target.closest('#exportPdfResult');
    if(!button) return;
    e.preventDefault();
    e.stopPropagation();
    if(typeof e.stopImmediatePropagation==='function') e.stopImmediatePropagation();
    exportResultPdfV13();
  },true);

  console.info('PDF exporter loaded: '+VERSION);
})();