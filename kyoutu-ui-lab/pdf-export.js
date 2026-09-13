/* Main PDF exporter: v1.3 pipeline
 * SVG -> high-resolution Canvas -> JPEG -> hand-built PDF
 * iPhone/iPad Safari: File + Web Share
 * Other browsers: Object URL direct download
 * No data-URI delivery and no print fallback.
 */
(function(){
  'use strict';

  const VERSION = 'v1.3-main-pipeline';
  const PAGE_W = 1240;
  const PAGE_H = 1754;
  const RENDER_SCALE = 2.33;
  const RASTER_W = Math.round(PAGE_W * RENDER_SCALE);
  const RASTER_H = Math.round(PAGE_H * RENDER_SCALE);
  const JPEG_QUALITY = 0.97;
  const M_LEFT = 58;
  const M_RIGHT = 58;
  const M_TOP = 58;
  const M_BOTTOM = 92;
  const FOOTER_BOTTOM = 59;

  const PDF_CSS = [
    '*{box-sizing:border-box}',
    'html,body{margin:0;padding:0;background:#fff;color:#1d2433;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,"Hiragino Sans","Yu Gothic",Meiryo,sans-serif;-webkit-font-smoothing:antialiased}',
    '.pdfRasterPage{width:'+PAGE_W+'px;height:'+PAGE_H+'px;position:relative;overflow:hidden;background:#fff;color:#1d2433;font-size:16px;line-height:1.35}',
    '.pdfRasterContent{position:absolute;left:'+M_LEFT+'px;right:'+M_RIGHT+'px;top:'+M_TOP+'px;bottom:'+M_BOTTOM+'px;overflow:hidden}',
    '.pdfRasterFooter{position:absolute;left:0;right:0;bottom:'+FOOTER_BOTTOM+'px;height:18px;display:flex;align-items:flex-end;justify-content:center;font-size:15px;line-height:1;color:#344054;z-index:5}',
    '.pdfStamp{display:grid;grid-template-columns:minmax(0,1fr) 190px;gap:24px;align-items:start;margin:0 0 10px;padding-bottom:9px;border-bottom:1px solid #d9deea}',
    '.pdfStampText{text-align:right;font-size:15px;line-height:1.25;color:#344054}',
    '.pdfStampText b{font-size:15px}',
    '.pdfContinueTitle{font-size:20px;font-weight:900;color:#344054;margin:0 0 10px;padding-bottom:8px;border-bottom:1px solid #d9deea}',
    '.resultActionBar{margin:0 0 12px!important;padding:0!important;border:0!important;background:transparent!important;border-radius:0!important;display:block!important;box-shadow:none!important}',
    '.resultActionLabel{font-size:16px!important;color:#647086!important;margin:0 0 3px!important;font-weight:900!important;line-height:1.2!important}',
    '.resultActionIdentity{font-size:34px!important;font-weight:900!important;line-height:1.12!important;color:#1d2433!important}',
    '.resultExamLine{display:block!important;white-space:nowrap!important;letter-spacing:-0.02em!important;font-size:.88em!important}',
    '.resultSubjectLine{display:block!important;margin-top:4px!important;font-size:1.02em!important;white-space:nowrap!important}',
    '.resultSummaryCard{display:grid!important;grid-template-columns:245px minmax(0,1fr)!important;gap:18px!important;align-items:stretch!important;margin:12px 0!important;padding:14px!important;border:1px solid #dfe7fb!important;background:#fbfcff!important;border-radius:18px!important;box-shadow:none!important}',
    '.resultSummarySubject{font-size:23px!important;font-weight:900!important;line-height:1.16!important}',
    '.resultSummaryMeta{font-size:14px!important;margin-top:4px!important;color:#5b6475!important;font-weight:800!important}',
    '.resultSummaryStats{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:10px!important}',
    '.resultSummaryStat{background:#fff!important;border:1px solid #e1e7f5!important;border-radius:12px!important;padding:10px 12px!important}',
    '.resultSummaryStat span{display:block!important;font-size:13px!important;color:#647086!important;font-weight:800!important}',
    '.resultSummaryStat b{display:block!important;margin-top:2px!important;font-size:23px!important;line-height:1.15!important}',
    '.avgScoreMetric{margin-top:6px!important;padding-top:6px!important;border-top:1px solid #dfe7fb!important}',
    '.avgScoreMetric .avgLabel{font-size:12px!important}',
    '.avgScoreMetric .avgValue{font-size:18px!important}',
    '.metrics{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:10px!important;margin:12px 0!important}',
    '.metric{background:#f8faff!important;border:1px solid #dfe7fb!important;border-radius:14px!important;padding:12px!important}',
    '.metric b{display:block!important;font-size:23px!important}',
    '.radarPanel{margin-top:14px!important;margin-bottom:20px!important;padding:14px 14px 40px!important;border:1px solid #d9deea!important;border-radius:18px!important;background:#fbfcff!important;box-shadow:none!important;overflow:hidden!important}',
    '.radarPanel h3{margin:0 0 8px!important;font-size:21px!important;font-weight:900!important}',
    '.radarWrap{display:grid!important;grid-template-columns:430px minmax(0,1fr)!important;gap:24px!important;align-items:center!important}',
    '.radarSvg{width:405px!important;max-width:405px!important;height:405px!important;max-height:405px!important;margin:0!important;display:block!important}',
    '.radarGrid{fill:none;stroke:#d9deea;stroke-width:1}.radarAxis{stroke:#cbd3e3;stroke-width:1}.radarShape{fill:rgba(47,95,208,.20);stroke:#2f5fd0;stroke-width:2}.radarPoint{fill:#2f5fd0}',
    '.sectionStats{font-size:16px!important;overflow:visible!important}',
    '.sectionStats table{min-width:0!important;width:100%!important;margin:0!important;table-layout:fixed!important;border-collapse:collapse!important}',
    '.sectionStats th,.sectionStats td{padding:6px 6px!important;line-height:1.18!important;border-bottom:1px solid #d9deea!important;text-align:left!important}',
    '.sectionStats th{background:#f7f8fc!important;color:#4a556b!important;font-size:14px!important}',
    '.sectionStats th:nth-child(1),.sectionStats td:nth-child(1){width:130px!important}',
    '.sectionStats th:nth-child(2),.sectionStats td:nth-child(2){width:132px!important}',
    '.sectionStats th:nth-child(3),.sectionStats td:nth-child(3){width:105px!important}',
    '.sectionStats th:nth-child(4),.sectionStats td:nth-child(4){width:120px!important}',
    '.sectionStats th:nth-child(5),.sectionStats td:nth-child(5){width:75px!important}',
    '.tableScrollNotice{display:none!important}',
    '.resultTableWrap{overflow:visible!important;margin-top:14px!important;width:100%!important}',
    '.resultTable{min-width:0!important;max-width:none!important;width:100%!important;table-layout:fixed!important;margin:0!important;font-size:14px!important;border-collapse:collapse!important}',
    '.resultTable th,.resultTable td{padding:6px 7px!important;line-height:1.23!important;border-bottom:1px solid #d9deea!important;vertical-align:middle!important;word-break:break-word!important;overflow:visible!important;text-overflow:clip!important;white-space:normal!important;text-align:left!important}',
    '.resultTable th{font-size:13px!important;background:#f7f8fc!important;color:#4a556b!important;font-weight:900!important}',
    '.resultTable th:nth-child(1),.resultTable td:nth-child(1){width:215px!important;white-space:nowrap!important;word-break:keep-all!important;overflow-wrap:normal!important}',
    '.resultTable th:nth-child(2),.resultTable td:nth-child(2){width:110px!important}',
    '.resultTable th:nth-child(3),.resultTable td:nth-child(3){width:250px!important}',
    '.resultTable th:nth-child(4),.resultTable td:nth-child(4){width:70px!important;text-align:center!important;padding-left:0!important;padding-right:0!important}',
    '.resultTable td:nth-child(4){font-size:22px!important;line-height:1!important;font-weight:900!important;text-align:center!important;vertical-align:middle!important}',
    '.resultTable th:nth-child(5),.resultTable td:nth-child(5){width:95px!important;text-align:center!important;padding-left:0!important;padding-right:0!important;vertical-align:middle!important}',
    '.resultTable th:nth-child(6),.resultTable td:nth-child(6){width:115px!important}',
    '.resultTable th:nth-child(7),.resultTable td:nth-child(7){width:auto!important;font-size:12px!important;color:#647086!important}',
    '.ok{color:#137333!important;font-weight:900!important}.partial{color:#8a5b00!important;font-weight:900!important}.ng{color:#b3261e!important;font-weight:900!important}',
    '.missedPanel{margin:16px 0 0!important;padding:14px!important;border:1px solid #f0c7c1!important;background:#fff7f6!important;border-radius:18px!important}',
    '.missedPanel h3{margin:0 0 9px!important;font-size:21px!important;color:#8c1d18!important;font-weight:900!important}',
    '.missedList{display:flex!important;flex-wrap:wrap!important;gap:8px!important}',
    '.missedItem{background:#fff!important;border:1px solid #f0d0cb!important;border-radius:12px!important;padding:7px 9px!important;font-size:13px!important;line-height:1.25!important;min-width:0!important;flex:1 1 250px!important}',
    '.missedItem b{display:block!important;font-weight:900!important}.judgeNg{color:#b3261e!important;font-weight:900!important}.judgePartial{color:#8a5b00!important;font-weight:900!important}',
    '.missedOk{margin-top:16px!important;padding:10px!important;font-size:16px!important;border:1px solid #cfe8d4!important;background:#f3faf5!important;border-radius:14px!important;font-weight:900!important;color:#137333!important}'
  ].join('\n');

  function byId(id){ return document.getElementById(id); }
  function pad(n){ return String(n).padStart(2,'0'); }
  function dateText(d){ return d.getFullYear()+'/'+pad(d.getMonth()+1)+'/'+pad(d.getDate())+' '+pad(d.getHours())+':'+pad(d.getMinutes()); }
  function fileStamp(d){ return d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate())+'_'+pad(d.getHours())+pad(d.getMinutes()); }
  function safeFile(s){ return String(s == null ? '' : s).replace(/[\\/:*?"<>|\s]+/g,'_').replace(/^_+|_+$/g,'').slice(0,70) || 'result'; }

  function cloneForPdf(node){
    if(!node) return null;
    const c = node.cloneNode(true);
    c.querySelectorAll('button,.pdfBtn,.pdf-button,#exportPdfResult').forEach(el=>el.remove());
    c.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
    return c;
  }

  function makeRenderHost(){
    const old = byId('__pdfV13RenderHost');
    if(old) old.remove();
    const host = document.createElement('div');
    host.id = '__pdfV13RenderHost';
    host.style.cssText = 'position:fixed;left:-20000px;top:0;width:'+PAGE_W+'px;background:#fff;z-index:-1;pointer-events:none;';
    const style = document.createElement('style');
    style.textContent = PDF_CSS;
    host.appendChild(style);
    document.body.appendChild(host);
    return host;
  }

  function createPage(host){
    const page = document.createElement('div');
    page.className = 'pdfRasterPage';
    const content = document.createElement('div');
    content.className = 'pdfRasterContent';
    const footer = document.createElement('div');
    footer.className = 'pdfRasterFooter';
    page.append(content, footer);
    host.appendChild(page);
    return {page, content, footer};
  }

  function overflowed(content){ return content.scrollHeight > content.clientHeight + 1; }

  function appendChecked(content,node){
    content.appendChild(node);
    if(overflowed(content)){
      content.removeChild(node);
      return false;
    }
    return true;
  }

  function addStamp(content){
    const box = document.createElement('div');
    box.className = 'pdfStamp';
    const left = document.createElement('div');
    const right = document.createElement('div');
    right.className = 'pdfStampText';
    right.innerHTML = '出力日時<br><b>'+dateText(new Date())+'</b>';
    box.append(left,right);
    content.appendChild(box);
  }

  function addContinueTitle(content,text){
    const h = document.createElement('div');
    h.className = 'pdfContinueTitle';
    h.textContent = text;
    content.appendChild(h);
  }

  function fitExamTitleLines(host){
    host.querySelectorAll('.resultExamLine').forEach(el=>{
      const parent = el.parentElement;
      if(!parent) return;
      const max = Math.max(100,parent.clientWidth || (PAGE_W-M_LEFT-M_RIGHT));
      let size = parseFloat(getComputedStyle(el).fontSize) || 30;
      while(size > 24 && el.scrollWidth > max){
        size -= 1;
        el.style.fontSize = size+'px';
      }
    });
  }

  function makeTableShell(sourceTable){
    const wrap = document.createElement('div');
    wrap.className = 'resultTableWrap';
    const table = document.createElement('table');
    table.className = sourceTable.className || 'resultTable';
    if(sourceTable.tHead) table.appendChild(sourceTable.tHead.cloneNode(true));
    const tbody = document.createElement('tbody');
    table.appendChild(tbody);
    wrap.appendChild(table);
    return {wrap,table,tbody};
  }

  function makeMissedShell(source,continued){
    const panel = document.createElement('div');
    panel.className = source.className || 'missedPanel';
    const h = document.createElement('h3');
    const sourceH = source.querySelector('h3');
    h.textContent = continued ? '間違えた問題・未入力（続き）' : (sourceH ? sourceH.textContent : '間違えた問題・未入力');
    const list = document.createElement('div');
    list.className = 'missedList';
    panel.append(h,list);
    return {panel,list};
  }

  function buildPages(){
    const result = byId('result');
    if(!result) throw new Error('採点結果エリアが見つかりません。');
    const sourceTable = result.querySelector('.resultTable');
    if(!sourceTable) throw new Error('全問一覧が見つかりません。先に採点してください。');

    const host = makeRenderHost();
    let current = createPage(host);
    addStamp(current.content);

    const leading = [
      cloneForPdf(result.querySelector('.resultActionBar')),
      cloneForPdf(result.querySelector('.resultSummaryCard') || result.querySelector('.metrics')),
      cloneForPdf(result.querySelector('.radarPanel'))
    ].filter(Boolean);

    leading.forEach(node=>{
      if(!appendChecked(current.content,node)){
        current = createPage(host);
        current.content.appendChild(node);
      }
    });
    fitExamTitleLines(host);

    let shell = makeTableShell(sourceTable);
    if(!appendChecked(current.content,shell.wrap)){
      current = createPage(host);
      addContinueTitle(current.content,'全問一覧');
      shell = makeTableShell(sourceTable);
      current.content.appendChild(shell.wrap);
    }

    const bodyRows = sourceTable.tBodies[0] ? Array.from(sourceTable.tBodies[0].rows) : Array.from(sourceTable.rows).slice(sourceTable.tHead ? 0 : 1);
    bodyRows.forEach(sourceRow=>{
      const row = sourceRow.cloneNode(true);
      shell.tbody.appendChild(row);
      if(overflowed(current.content)){
        shell.tbody.removeChild(row);
        current = createPage(host);
        addContinueTitle(current.content,'全問一覧（続き）');
        shell = makeTableShell(sourceTable);
        current.content.appendChild(shell.wrap);
        shell.tbody.appendChild(row);
      }
    });

    const missedPanel = result.querySelector('.missedPanel');
    const missedOk = result.querySelector('.missedOk');
    if(missedPanel){
      const sourceItems = Array.from(missedPanel.querySelectorAll('.missedItem'));
      let ms = makeMissedShell(missedPanel,false);
      if(!appendChecked(current.content,ms.panel)){
        current = createPage(host);
        ms = makeMissedShell(missedPanel,false);
        current.content.appendChild(ms.panel);
      }
      sourceItems.forEach(sourceItem=>{
        const item = cloneForPdf(sourceItem);
        ms.list.appendChild(item);
        if(overflowed(current.content)){
          ms.list.removeChild(item);
          current = createPage(host);
          ms = makeMissedShell(missedPanel,true);
          current.content.appendChild(ms.panel);
          ms.list.appendChild(item);
        }
      });
    }else if(missedOk){
      const ok = cloneForPdf(missedOk);
      if(!appendChecked(current.content,ok)){
        current = createPage(host);
        current.content.appendChild(ok);
      }
    }

    const pages = Array.from(host.querySelectorAll('.pdfRasterPage'));
    pages.forEach((page,i)=>{
      const footer = page.querySelector('.pdfRasterFooter');
      if(footer) footer.textContent = (i+1)+' / '+pages.length;
    });
    return {host,pages};
  }

  function pageToSvg(page){
    const XHTML = 'http://www.w3.org/1999/xhtml';
    const wrapper = document.createElementNS(XHTML,'div');
    wrapper.setAttribute('style','width:'+PAGE_W+'px;height:'+PAGE_H+'px;margin:0;padding:0;background:#fff;');
    const style = document.createElementNS(XHTML,'style');
    style.textContent = PDF_CSS;
    wrapper.appendChild(style);
    wrapper.appendChild(page.cloneNode(true));
    const xhtml = new XMLSerializer().serializeToString(wrapper);
    return '<svg xmlns="http://www.w3.org/2000/svg" width="'+PAGE_W+'" height="'+PAGE_H+'" viewBox="0 0 '+PAGE_W+' '+PAGE_H+'"><rect width="'+PAGE_W+'" height="'+PAGE_H+'" fill="white"/><foreignObject x="0" y="0" width="100%" height="100%">'+xhtml+'</foreignObject></svg>';
  }

  function svgToJpegBytes(svg){
    return new Promise((resolve,reject)=>{
      const blob = new Blob([svg],{type:'image/svg+xml;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = ()=>{
        try{
          const canvas = document.createElement('canvas');
          canvas.width = RASTER_W;
          canvas.height = RASTER_H;
          const ctx = canvas.getContext('2d');
          if(!ctx) throw new Error('Canvasの描画領域を確保できませんでした。');
          ctx.fillStyle = '#fff';
          ctx.fillRect(0,0,RASTER_W,RASTER_H);
          ctx.imageSmoothingEnabled = true;
          if('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img,0,0,RASTER_W,RASTER_H);
          const dataUrl = canvas.toDataURL('image/jpeg',JPEG_QUALITY);
          const bin = atob(dataUrl.split(',')[1] || '');
          const bytes = new Uint8Array(bin.length);
          for(let i=0;i<bin.length;i++) bytes[i] = bin.charCodeAt(i);
          canvas.width = 1;
          canvas.height = 1;
          resolve(bytes);
        }catch(e){
          reject(e);
        }finally{
          URL.revokeObjectURL(url);
          img.onload = img.onerror = null;
        }
      };
      img.onerror = ()=>{
        URL.revokeObjectURL(url);
        reject(new Error('PDFページ画像を読み込めませんでした。'));
      };
      img.src = url;
    });
  }

  const enc = new TextEncoder();
  function ascii(s){ return enc.encode(String(s)); }

  function makePdfBlob(jpegs){
    const pdfW = 595.275590551;
    const pdfH = 841.88976378;
    const parts = [];
    const offsets = [0];
    let len = 0;
    function add(part){
      if(typeof part === 'string') part = ascii(part);
      parts.push(part);
      len += part.byteLength || part.length || 0;
    }
    function obj(n,body){
      offsets[n] = len;
      add(n+' 0 obj\n');
      body.forEach(add);
      add('\nendobj\n');
    }
    add('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    const kids = [];
    for(let i=0;i<jpegs.length;i++) kids.push((3+i*3)+' 0 R');
    obj(1,['<< /Type /Catalog /Pages 2 0 R >>']);
    obj(2,['<< /Type /Pages /Kids [',kids.join(' '),'] /Count ',String(jpegs.length),' >>']);
    for(let i=0;i<jpegs.length;i++){
      const page = 3+i*3;
      const content = page+1;
      const image = page+2;
      const name = 'Im'+(i+1);
      const stream = 'q\n'+pdfW.toFixed(3)+' 0 0 '+pdfH.toFixed(3)+' 0 0 cm\n/'+name+' Do\nQ\n';
      obj(page,['<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ',pdfW.toFixed(3),' ',pdfH.toFixed(3),'] /Resources << /XObject << /',name,' ',image,' 0 R >> >> /Contents ',content,' 0 R >>']);
      obj(content,['<< /Length ',String(ascii(stream).length),' >>\nstream\n',stream,'endstream']);
      offsets[image] = len;
      add(image+' 0 obj\n');
      add('<< /Type /XObject /Subtype /Image /Width '+RASTER_W+' /Height '+RASTER_H+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+jpegs[i].length+' >>\nstream\n');
      add(jpegs[i]);
      add('\nendstream\nendobj\n');
    }
    const xref = len;
    const maxObj = 2+jpegs.length*3;
    add('xref\n0 '+(maxObj+1)+'\n0000000000 65535 f \n');
    for(let i=1;i<=maxObj;i++) add(String(offsets[i]).padStart(10,'0')+' 00000 n \n');
    add('trailer\n<< /Size '+(maxObj+1)+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF');
    return new Blob(parts,{type:'application/pdf'});
  }

  function isIOSSafariOnly(){
    const ua = navigator.userAgent || '';
    const platform = navigator.platform || '';
    const isiOS = /iPad|iPhone|iPod/.test(ua) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if(!isiOS) return false;
    return /Safari\//.test(ua) && !/(CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|Instagram|FBAN|FBAV|Line)/.test(ua);
  }

  let iosPendingPdf = null;
  function closeIosPdfShareBox(){
    const old = byId('__iosPdfShareBox');
    if(old) old.remove();
  }

  function showIosPdfShareBox(pdf,filename){
    closeIosPdfShareBox();
    iosPendingPdf = {pdf,filename};
    const box = document.createElement('div');
    box.id = '__iosPdfShareBox';
    box.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(15,23,42,.48);display:flex;align-items:center;justify-content:center;padding:22px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,"Hiragino Sans","Yu Gothic",Meiryo,sans-serif;';
    box.innerHTML = '<div style="max-width:420px;width:100%;background:#fff;border-radius:18px;padding:18px;box-shadow:0 18px 50px rgba(15,23,42,.28);color:#1d2433">'
      + '<div style="font-weight:900;font-size:18px;margin-bottom:8px">PDFの準備ができました</div>'
      + '<div style="font-size:13px;line-height:1.55;color:#647086;font-weight:700;margin-bottom:14px">iPhone Safariでは、次のボタンからPDFファイルを共有します。共有シートで「ファイルに保存」を選んでください。プリントは使いません。</div>'
      + '<button type="button" class="iosPdfShareSave" style="width:100%;border:0;border-radius:14px;padding:13px 14px;background:#2f5fd0;color:#fff;font-weight:900;font-size:16px">PDFを保存</button>'
      + '<button type="button" class="iosPdfShareOpen" style="width:100%;border:0;border-radius:14px;padding:12px 14px;background:#e8ecf6;color:#1d2433;font-weight:900;font-size:15px;margin-top:8px">PDFを開く</button>'
      + '<button type="button" class="iosPdfShareClose" style="width:100%;border:0;border-radius:14px;padding:10px 14px;background:#fff;color:#647086;font-weight:900;font-size:14px;margin-top:6px">閉じる</button>'
      + '</div>';
    document.body.appendChild(box);
    const saveBtn = box.querySelector('.iosPdfShareSave');
    const openBtn = box.querySelector('.iosPdfShareOpen');
    const closeBtn = box.querySelector('.iosPdfShareClose');
    saveBtn.addEventListener('click',async function(){
      try{
        const p = iosPendingPdf;
        if(!p) return;
        const file = new File([p.pdf],p.filename,{type:'application/pdf'});
        if(navigator.canShare && navigator.canShare({files:[file]}) && navigator.share){
          await navigator.share({files:[file],title:p.filename});
        }else{
          const url = URL.createObjectURL(p.pdf);
          window.open(url,'_blank','noopener');
          setTimeout(()=>URL.revokeObjectURL(url),60000);
        }
      }catch(e){
        if(e && e.name === 'AbortError') return;
        alert('PDFの共有に失敗しました: '+(e && e.message ? e.message : e));
      }
    });
    openBtn.addEventListener('click',function(){
      try{
        const p = iosPendingPdf;
        if(!p) return;
        const url = URL.createObjectURL(p.pdf);
        window.open(url,'_blank','noopener');
        setTimeout(()=>URL.revokeObjectURL(url),60000);
      }catch(e){
        alert('PDFを開けませんでした: '+(e && e.message ? e.message : e));
      }
    });
    closeBtn.addEventListener('click',closeIosPdfShareBox);
  }

  function deliverPdf(pdf,filename){
    if(isIOSSafariOnly()){
      showIosPdfShareBox(pdf,filename);
      return;
    }
    const url = URL.createObjectURL(pdf);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),30000);
  }

  function filenameForResult(){
    const data = window.__lastGrade || {};
    const k = data.k || {};
    const base = (k.year ? String(k.year)+'_' : '') + (k.subject || '採点結果');
    return '採点結果_'+safeFile(base)+'_'+fileStamp(new Date())+'.pdf';
  }

  async function exportResultPdfV13(){
    const btn = byId('exportPdfResult');
    const oldText = btn ? btn.textContent : '';
    if(btn){ btn.disabled = true; btn.textContent = 'PDF生成中…'; }
    let built = null;
    try{
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      built = buildPages();
      const svgs = built.pages.map(pageToSvg);
      const jpegs = [];
      for(const svg of svgs) jpegs.push(await svgToJpegBytes(svg));
      const pdf = makePdfBlob(jpegs);
      deliverPdf(pdf,filenameForResult());
    }catch(err){
      console.error(err);
      alert('PDF生成に失敗しました: '+(err && err.message ? err.message : err));
    }finally{
      if(built && built.host) built.host.remove();
      if(btn){ btn.disabled = false; btn.textContent = oldText || 'PDF出力（A4）'; }
    }
  }

  window.exportResultPdf = exportResultPdfV13;
  document.addEventListener('click',function(e){
    const btn = e.target && e.target.closest && e.target.closest('#exportPdfResult');
    if(!btn) return;
    e.preventDefault();
    e.stopPropagation();
    if(typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
    exportResultPdfV13();
  },true);

  console.info('PDF exporter loaded: '+VERSION);
})();
