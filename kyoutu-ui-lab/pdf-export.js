/* v170 hybrid PDF exporter
 * - iPhone/iPad: v163 print/PDF fallback route, with v165 title/quality adjustments
 * - Android/Chrome and other non-iOS: v165 manual-canvas direct PDF route
 * index.html is not modified. Upload this file as pdf_export_v160.js.
 */
(function(){
  'use strict';

  const VERSION = 'v177-footer10mm-radar435-judge-center';
  const PAGE_W = 1240;
  const PAGE_H = 1754;
  const M_LEFT = 62;
  const M_RIGHT = 62;
  const M_TOP = 54;
  const M_BOTTOM_CONTENT = 92;
  const FOOTER_BOTTOM = 59; // about 10mm from the bottom on A4.

  function byId(id){ return document.getElementById(id); }
  function esc(s){
    if(typeof window.esc === 'function') return window.esc(s);
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];});
  }
  function pad(n){ return String(n).padStart(2,'0'); }
  function dateText(d){ return d.getFullYear() + '/' + pad(d.getMonth()+1) + '/' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function fileStamp(d){ return d.getFullYear() + pad(d.getMonth()+1) + pad(d.getDate()) + '_' + pad(d.getHours()) + pad(d.getMinutes()); }
  function safeText(s){ return String(s == null ? '' : s).replace(/[\\/:*?"<>|\s]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60) || 'result'; }

  function cloneForPdf(node){
    if(!node) return null;
    const c = node.cloneNode(true);
    c.querySelectorAll('button, .pdfBtn, #exportPdfResult').forEach(function(el){ el.remove(); });
    c.querySelectorAll('[id]').forEach(function(el){ el.removeAttribute('id'); });
    return c;
  }

  function getCss(){
    return [
      '*{box-sizing:border-box}',
      'html,body{margin:0;padding:0;background:#fff;color:#1d2433;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,"Hiragino Sans","Yu Gothic",Meiryo,sans-serif;-webkit-font-smoothing:antialiased}',
      '.pdfRasterPage{width:'+PAGE_W+'px;height:'+PAGE_H+'px;position:relative;overflow:hidden;background:#fff;color:#1d2433;font-size:16px;line-height:1.35;-webkit-print-color-adjust:exact;print-color-adjust:exact}',
      '.pdfRasterContent{position:absolute;left:'+M_LEFT+'px;right:'+M_RIGHT+'px;top:'+M_TOP+'px;bottom:'+M_BOTTOM_CONTENT+'px;overflow:hidden}',
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
      '.resultTable th:nth-child(4),.resultTable td:nth-child(4){width:95px!important}',
      '.resultTable th:nth-child(5),.resultTable td:nth-child(5){width:70px!important;text-align:center!important;padding-left:0!important;padding-right:0!important}',
      '.resultTable td:nth-child(5){font-size:22px!important;line-height:1!important;font-weight:900!important;text-align:center!important}',
      '.resultTable th:nth-child(6),.resultTable td:nth-child(6){width:115px!important}',
      '.resultTable th:nth-child(7),.resultTable td:nth-child(7){width:auto!important;font-size:12px!important;color:#647086!important}',
      '.ok{color:#137333!important;font-weight:900!important}.partial{color:#8a5b00!important;font-weight:900!important}.ng{color:#b3261e!important;font-weight:900!important}',
      '.missedPanel{margin:16px 0 0!important;padding:14px!important;border:1px solid #f0c7c1!important;background:#fff7f6!important;border-radius:18px!important}',
      '.missedPanel h3{margin:0 0 9px!important;font-size:21px!important;color:#8c1d18!important;font-weight:900!important}',
      '.missedList{display:flex!important;flex-wrap:wrap!important;gap:8px!important}',
      '.missedItem{background:#fff!important;border:1px solid #f0d0cb!important;border-radius:12px!important;padding:7px 9px!important;font-size:13px!important;line-height:1.25!important}',
      '.missedItem b{font-weight:900!important}.judgeNg{color:#b3261e!important;font-weight:900!important}.judgePartial{color:#8a5b00!important;font-weight:900!important}',
      '.missedOk{margin-top:16px!important;padding:10px!important;font-size:16px!important;border:1px solid #cfe8d4!important;background:#f3faf5!important;border-radius:14px!important;font-weight:900!important;color:#137333!important}'
    ].join('\n');
  }

  function makeRenderHost(){
    let host = document.getElementById('__pdfRasterHost');
    if(host) host.remove();
    host = document.createElement('div');
    host.id = '__pdfRasterHost';
    host.style.cssText = 'position:fixed;left:-20000px;top:0;width:'+PAGE_W+'px;background:#fff;z-index:-1;pointer-events:none;';
    const style = document.createElement('style');
    style.textContent = getCss();
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
    page.appendChild(content);
    page.appendChild(footer);
    host.appendChild(page);
    return {page: page, content: content, footer: footer};
  }

  function overflowed(content){ return content.scrollHeight > content.clientHeight + 1; }

  function appendChecked(content, node){
    content.appendChild(node);
    if(overflowed(content)){
      content.removeChild(node);
      return false;
    }
    return true;
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
    return {wrap: wrap, table: table, tbody: tbody};
  }

  function addStamp(content){
    const box = document.createElement('div');
    box.className = 'pdfStamp';
    const left = document.createElement('div');
    const right = document.createElement('div');
    right.className = 'pdfStampText';
    right.innerHTML = '出力日時<br><b>' + esc(dateText(new Date())) + '</b>';
    box.appendChild(left);
    box.appendChild(right);
    content.appendChild(box);
  }

  function addContinueTitle(content, text){
    const h = document.createElement('div');
    h.className = 'pdfContinueTitle';
    h.textContent = text;
    content.appendChild(h);
  }

  function fitExamTitleLines(host){
    if(!host) return;
    const lines = host.querySelectorAll('.resultExamLine');
    lines.forEach(function(el){
      const parent = el.parentElement;
      if(!parent) return;
      el.style.whiteSpace = 'nowrap';
      el.style.display = 'block';
      el.style.letterSpacing = '-0.02em';
      const max = Math.max(100, parent.clientWidth || (PAGE_W - M_LEFT - M_RIGHT));
      let size = parseFloat(getComputedStyle(el).fontSize) || 30;
      while(size > 24 && el.scrollWidth > max){
        size -= 1;
        el.style.fontSize = size + 'px';
      }
    });
  }

  function buildPages(){
    const result = byId('result');
    if(!result) throw new Error('採点結果エリアが見つかりません。');
    const sourceTable = result.querySelector('.resultTable');
    if(!sourceTable) throw new Error('全問正誤表が見つかりません。先に採点してください。');

    const host = makeRenderHost();
    let current = createPage(host);
    addStamp(current.content);

    const leading = [
      cloneForPdf(result.querySelector('.resultActionBar')),
      cloneForPdf(result.querySelector('.resultSummaryCard') || result.querySelector('.metrics')),
      cloneForPdf(result.querySelector('.radarPanel'))
    ].filter(Boolean);

    leading.forEach(function(node){
      if(!appendChecked(current.content, node)){
        current = createPage(host);
        appendChecked(current.content, node);
      }
    });
    fitExamTitleLines(host);

    let shell = makeTableShell(sourceTable);
    if(!appendChecked(current.content, shell.wrap)){
      current = createPage(host);
      addContinueTitle(current.content, '全問一覧');
      shell = makeTableShell(sourceTable);
      current.content.appendChild(shell.wrap);
    }

    const bodyRows = sourceTable.tBodies[0] ? Array.from(sourceTable.tBodies[0].rows) : Array.from(sourceTable.rows).slice(sourceTable.tHead ? 0 : 1);
    bodyRows.forEach(function(sourceRow){
      const row = sourceRow.cloneNode(true);
      shell.tbody.appendChild(row);
      if(overflowed(current.content)){
        shell.tbody.removeChild(row);
        current = createPage(host);
        addContinueTitle(current.content, '全問一覧（続き）');
        shell = makeTableShell(sourceTable);
        current.content.appendChild(shell.wrap);
        shell.tbody.appendChild(row);
      }
    });

    const missed = cloneForPdf(result.querySelector('.missedPanel') || result.querySelector('.missedOk'));
    if(missed){
      if(!appendChecked(current.content, missed)){
        current = createPage(host);
        addContinueTitle(current.content, '間違えた問題・未入力');
        current.content.appendChild(missed);
      }
    }

    const pages = Array.from(host.querySelectorAll('.pdfRasterPage'));
    pages.forEach(function(page, i){
      const f = page.querySelector('.pdfRasterFooter');
      if(f) f.textContent = (i + 1) + ' / ' + pages.length;
    });
    return {host: host, pages: pages};
  }

  function dataUrlToBytes(dataUrl){
    const base64 = dataUrl.split(',')[1] || '';
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  function loadImage(src){
    return new Promise(function(resolve, reject){
      const img = new Image();
      img.onload = function(){ resolve(img); };
      img.onerror = function(){ reject(new Error('PDFページ画像の生成に失敗しました。')); };
      img.src = src;
    });
  }

  async function pageToJpeg(page){
    const css = getCss();
    const clone = page.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
    const html = new XMLSerializer().serializeToString(clone);
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="'+PAGE_W+'" height="'+PAGE_H+'" viewBox="0 0 '+PAGE_W+' '+PAGE_H+'"><foreignObject x="0" y="0" width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml"><style>'+css+'</style>'+html+'</div></foreignObject></svg>';
    const url = URL.createObjectURL(new Blob([svg], {type:'image/svg+xml;charset=utf-8'}));
    try{
      const img = await loadImage(url);
      const canvas = document.createElement('canvas');
      canvas.width = PAGE_W;
      canvas.height = PAGE_H;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, PAGE_W, PAGE_H);
      ctx.drawImage(img, 0, 0, PAGE_W, PAGE_H);
      return dataUrlToBytes(canvas.toDataURL('image/jpeg', 0.88));
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  const __textEncoder = new TextEncoder();
  function ascii(s){ return __textEncoder.encode(String(s)); }

  function makePdfBlob(jpegs){
    const pdfW = 595.275590551;
    const pdfH = 841.88976378;
    const parts = [];
    const offsets = [0];
    let length = 0;
    function add(part){
      if(typeof part === 'string') part = ascii(part);
      parts.push(part);
      length += part.byteLength || part.length || 0;
    }
    function obj(n, bodyParts){
      offsets[n] = length;
      add(n + ' 0 obj\n');
      bodyParts.forEach(add);
      add('\nendobj\n');
    }

    add('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    const count = jpegs.length;
    const kids = [];
    for(let i=0;i<count;i++) kids.push((3 + i*3) + ' 0 R');
    obj(1, ['<< /Type /Catalog /Pages 2 0 R >>']);
    obj(2, ['<< /Type /Pages /Kids [', kids.join(' '), '] /Count ', String(count), ' >>']);

    for(let i=0;i<count;i++){
      const pageObj = 3 + i*3;
      const contentObj = pageObj + 1;
      const imageObj = pageObj + 2;
      const name = 'Im' + (i + 1);
      const stream = 'q\n' + pdfW.toFixed(3) + ' 0 0 ' + pdfH.toFixed(3) + ' 0 0 cm\n/' + name + ' Do\nQ\n';
      obj(pageObj, ['<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ', pdfW.toFixed(3), ' ', pdfH.toFixed(3), '] /Resources << /XObject << /', name, ' ', imageObj, ' 0 R >> >> /Contents ', contentObj, ' 0 R >>']);
      obj(contentObj, ['<< /Length ', String(ascii(stream).length), ' >>\nstream\n', stream, 'endstream']);
      offsets[imageObj] = length;
      add(imageObj + ' 0 obj\n');
      add('<< /Type /XObject /Subtype /Image /Width ' + PAGE_W + ' /Height ' + PAGE_H + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + jpegs[i].length + ' >>\nstream\n');
      add(jpegs[i]);
      add('\nendstream\nendobj\n');
    }

    const xrefStart = length;
    const maxObj = 2 + count*3;
    add('xref\n0 ' + (maxObj + 1) + '\n');
    add('0000000000 65535 f \n');
    for(let i=1;i<=maxObj;i++) add(String(offsets[i]).padStart(10, '0') + ' 00000 n \n');
    add('trailer\n<< /Size ' + (maxObj + 1) + ' /Root 1 0 R >>\nstartxref\n' + xrefStart + '\n%%EOF');
    return new Blob(parts, {type:'application/pdf'});
  }

  async function exportDirectPdf(){
    if(!window.__lastGrade || (typeof window.selId === 'function' && window.__lastGrade.sig !== window.selId())){
      if(typeof window.grade === 'function') window.grade();
    }
    if(!window.__lastGrade){
      alert('先に採点してください。');
      return;
    }
    const built = buildPages();
    try{
      await new Promise(function(resolve){ requestAnimationFrame(function(){ requestAnimationFrame(resolve); }); });
      const jpegs = [];
      for(const page of built.pages) jpegs.push(await pageToJpeg(page));
      const pdfBlob = makePdfBlob(jpegs);
      const k = window.__lastGrade && window.__lastGrade.k ? window.__lastGrade.k : {};
      const filename = '採点結果_' + safeText((k.year ? String(k.year) + '_' : '') + (k.subject || '')) + '_' + fileStamp(new Date()) + '.pdf';
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function(){ URL.revokeObjectURL(url); }, 30000);
    } finally {
      if(built.host) built.host.remove();
    }
  }

  function isIOSWebKit(){
    const ua = navigator.userAgent || '';
    const platform = navigator.platform || '';
    return /iPad|iPhone|iPod/.test(ua) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  function removeFallbackOverlay(){
    const old = document.getElementById('__pdfPrintFallbackOverlay');
    if(old) old.remove();
  }

  function showPrintFallback(reason){
    if(!window.__lastGrade || (typeof window.selId === 'function' && window.__lastGrade.sig !== window.selId())){
      if(typeof window.grade === 'function') window.grade();
    }
    if(!window.__lastGrade){
      alert('先に採点してください。');
      return;
    }

    let built = null;
    try{
      removeFallbackOverlay();
      built = buildPages();
      const pageBoxes = built.pages.map(function(page){
        return '<div class="pdfPrintPageBox">' + page.outerHTML + '</div>';
      }).join('\n');
      const message = reason ? 'この端末では直接PDF生成が制限されたため、印刷用画面に切り替えました。' : 'この端末では印刷用画面からPDF保存します。';
      const detail = reason ? String(reason && reason.message ? reason.message : reason) : '';
      const fallbackCss = getCss() + '\n' + [
        '#__pdfPrintFallbackOverlay{position:fixed;inset:0;z-index:2147483647;background:#f6f7fb;color:#1d2433;overflow:auto;-webkit-overflow-scrolling:touch;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,"Hiragino Sans","Yu Gothic",Meiryo,sans-serif}',
        '#__pdfPrintFallbackOverlay .pdfFallbackToolbar{position:sticky;top:0;z-index:10;background:#fff;border-bottom:1px solid #d9deea;padding:10px 12px;display:grid;gap:8px;box-shadow:0 2px 10px rgba(22,34,64,.08)}',
        '#__pdfPrintFallbackOverlay .pdfFallbackTitle{font-weight:900;font-size:15px;color:#1d2433}',
        '#__pdfPrintFallbackOverlay .pdfFallbackText{font-size:12px;color:#647086;line-height:1.45;font-weight:700}',
        '#__pdfPrintFallbackOverlay .pdfFallbackBtns{display:flex;gap:8px;flex-wrap:wrap}',
        '#__pdfPrintFallbackOverlay button{border:0;border-radius:12px;padding:10px 14px;font-weight:900;font-size:14px}',
        '#__pdfPrintFallbackOverlay .pdfFallbackPrint{background:#2f5fd0;color:#fff}',
        '#__pdfPrintFallbackOverlay .pdfFallbackClose{background:#e8ecf6;color:#1d2433}',
        '#__pdfPrintFallbackOverlay .pdfFallbackSheet{display:grid;gap:18px;justify-content:center;padding:14px 0 28px}',
        '#__pdfPrintFallbackOverlay .pdfPrintPageBox{width:620px;height:877px;overflow:hidden;background:#fff;box-shadow:0 2px 14px rgba(22,34,64,.15)}',
        '#__pdfPrintFallbackOverlay .pdfPrintPageBox>.pdfRasterPage{transform:scale(0.5);transform-origin:0 0;box-shadow:none}',
        '@media(max-width:700px){#__pdfPrintFallbackOverlay .pdfFallbackSheet{justify-content:start;align-items:start;padding-left:10px;padding-right:10px}#__pdfPrintFallbackOverlay .pdfPrintPageBox{width:620px;height:877px}}',
        '@media print{@page{size:A4;margin:0}html,body{margin:0!important;padding:0!important;background:#fff!important}body>*:not(#__pdfPrintFallbackOverlay){display:none!important}#__pdfPrintFallbackOverlay{position:static!important;inset:auto!important;z-index:auto!important;overflow:visible!important;background:#fff!important}#__pdfPrintFallbackOverlay .pdfFallbackToolbar{display:none!important}#__pdfPrintFallbackOverlay .pdfFallbackSheet{display:block!important;padding:0!important;margin:0!important}#__pdfPrintFallbackOverlay .pdfPrintPageBox{width:210mm!important;height:297mm!important;overflow:hidden!important;box-shadow:none!important;background:#fff!important;break-after:page;page-break-after:always}#__pdfPrintFallbackOverlay .pdfPrintPageBox:last-child{break-after:auto;page-break-after:auto}#__pdfPrintFallbackOverlay .pdfPrintPageBox>.pdfRasterPage{width:1240px!important;height:1754px!important;transform:scale(0.6400812806)!important;transform-origin:0 0!important;box-shadow:none!important}}'
      ].join('\n');
      const overlay = document.createElement('div');
      overlay.id = '__pdfPrintFallbackOverlay';
      const style = document.createElement('style');
      style.textContent = fallbackCss;
      overlay.appendChild(style);
      const toolbar = document.createElement('div');
      toolbar.className = 'pdfFallbackToolbar';
      const ios = isIOSWebKit();
      const iosGuide = 'iPhone/iPadでは、この画面自体がPDF保存用です。右上または下部の共有ボタンから「プリント」または「ファイルに保存」を選んでください。画面が余分に分かれないよう、別の印刷専用画面は開きません。';
      const normalGuide = '「PDF保存 / 印刷」を押して、印刷画面からPDF保存またはプリントしてください。';
      toolbar.innerHTML = '<div class="pdfFallbackTitle">PDF保存 / 印刷</div>' +
        '<div class="pdfFallbackText">' + esc(message) + (detail ? '<br>理由: ' + esc(detail) : '') + '<br>' + esc(ios ? iosGuide : normalGuide) + '</div>' +
        '<div class="pdfFallbackBtns">' + (ios ? '' : '<button type="button" class="pdfFallbackPrint">PDF保存 / 印刷</button>') + '<button type="button" class="pdfFallbackClose">閉じる</button></div>';
      const sheet = document.createElement('div');
      sheet.className = 'pdfFallbackSheet';
      sheet.innerHTML = pageBoxes;
      overlay.appendChild(toolbar);
      overlay.appendChild(sheet);
      document.body.appendChild(overlay);
      const printBtn = overlay.querySelector('.pdfFallbackPrint');
      const closeBtn = overlay.querySelector('.pdfFallbackClose');
      if(printBtn) printBtn.addEventListener('click', function(){ try{ window.print(); }catch(e){} });
      if(closeBtn) closeBtn.addEventListener('click', removeFallbackOverlay);
    } catch(err){
      console.error(err);
      alert('PDF出力画面の作成に失敗しました: ' + (err && err.message ? err.message : err));
    } finally {
      if(built && built.host) built.host.remove();
    }
  }

  window.exportResultPdf = function exportResultPdfCrossDevice(){
    if(isIOSWebKit()){
      showPrintFallback(null);
      return;
    }
    exportDirectPdf().catch(function(err){
      console.error(err);
      showPrintFallback(err);
    });
  };

  document.addEventListener('click', function(e){
    const btn = e.target && e.target.closest && e.target.closest('#exportPdfResult');
    if(!btn) return;
    e.preventDefault();
    e.stopPropagation();
    if(typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
    window.exportResultPdf();
  }, true);

  console.info('PDF export renderer loaded: ' + VERSION);
})();


/* Preserve v163 fallback before installing non-iOS direct renderer. */
window.__ctPdfV163FallbackExport = window.exportResultPdf;

function __ctPdfIsIOSWebKitV166(){
  var ua = navigator.userAgent || '';
  var platform = navigator.platform || '';
  return /iPad|iPhone|iPod/.test(ua) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

if(true){
(function(){
  'use strict';

  const VERSION = 'v178-safari-datauri-modal-chrome-firefox-unchanged';
  const PAGE_W = 1240;
  const PAGE_H = 1754;
  const RENDER_SCALE = 2.33; // 約350dpi相当（Android/iPhone共通）
  const RASTER_W = Math.round(PAGE_W * RENDER_SCALE);
  const RASTER_H = Math.round(PAGE_H * RENDER_SCALE);
  const M_LEFT = 58;
  const M_RIGHT = 58;
  const M_TOP = 58;
  const FOOTER_Y = PAGE_H - 59;
  const CONTENT_BOTTOM = PAGE_H - 92;
  const LINE = '#d9deea';
  const TEXT = '#1d2433';
  const MUTED = '#647086';
  const BLUE = '#2f5fd0';
  const GOOD = '#137333';
  const BAD = '#b3261e';
  const WARN = '#8a5b00';
  const JPEG_QUALITY = 0.97;

  function $(id){ return document.getElementById(id); }
  function txt(el){ return (el && (el.innerText || el.textContent) || '').replace(/\s+/g, ' ').trim(); }
  function escFile(s){ return String(s == null ? '' : s).replace(/[\\/:*?"<>|\s]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 70) || 'result'; }
  function pad(n){ return String(n).padStart(2,'0'); }
  function dateText(d){ return d.getFullYear() + '/' + pad(d.getMonth()+1) + '/' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function fileStamp(d){ return d.getFullYear() + pad(d.getMonth()+1) + pad(d.getDate()) + '_' + pad(d.getHours()) + pad(d.getMinutes()); }
  function sleepFrame(){ return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }

  function canvasFont(size, weight){ return (weight ? weight + ' ' : '') + size + 'px -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,"Hiragino Sans","Yu Gothic",Meiryo,sans-serif'; }
  function setFont(ctx, size, weight, color){ ctx.font = canvasFont(size, weight); ctx.fillStyle = color || TEXT; ctx.textBaseline = 'top'; }
  function rr(ctx, x, y, w, h, r){
    const m = Math.min(r, w/2, h/2);
    ctx.beginPath();
    ctx.moveTo(x+m, y); ctx.lineTo(x+w-m, y); ctx.quadraticCurveTo(x+w, y, x+w, y+m);
    ctx.lineTo(x+w, y+h-m); ctx.quadraticCurveTo(x+w, y+h, x+w-m, y+h);
    ctx.lineTo(x+m, y+h); ctx.quadraticCurveTo(x, y+h, x, y+h-m);
    ctx.lineTo(x, y+m); ctx.quadraticCurveTo(x, y, x+m, y);
    ctx.closePath();
  }
  function fillRound(ctx, x, y, w, h, r, fill, stroke){
    rr(ctx, x, y, w, h, r);
    if(fill){ ctx.fillStyle = fill; ctx.fill(); }
    if(stroke){ ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
  }
  function line(ctx, x1, y1, x2, y2, color, width){ ctx.beginPath(); ctx.strokeStyle = color || LINE; ctx.lineWidth = width || 1; ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); }

  function wrapText(ctx, text, maxWidth){
    text = String(text == null ? '' : text);
    if(!text) return [''];
    const raw = text.split(/\n/);
    const out = [];
    for(const part of raw){
      let line = '';
      const chars = Array.from(part);
      for(const ch of chars){
        const test = line + ch;
        if(line && ctx.measureText(test).width > maxWidth){ out.push(line); line = ch; }
        else line = test;
      }
      out.push(line);
    }
    return out;
  }
  function drawWrapped(ctx, text, x, y, maxWidth, size, weight, color, lineHeight, maxLines){
    setFont(ctx, size, weight, color);
    const lines = wrapText(ctx, text, maxWidth);
    const lh = lineHeight || Math.round(size * 1.28);
    const use = maxLines ? lines.slice(0, maxLines) : lines;
    use.forEach((l,i)=>ctx.fillText(l, x, y + i*lh));
    return use.length * lh;
  }
  function textHeight(ctx, text, maxWidth, size, lineHeight, maxLines){
    setFont(ctx, size, '400', TEXT);
    const lines = wrapText(ctx, text, maxWidth);
    const lh = lineHeight || Math.round(size * 1.28);
    return (maxLines ? Math.min(lines.length, maxLines) : lines.length) * lh;
  }

  function makePage(){
    const canvas = document.createElement('canvas');
    canvas.width = RASTER_W; canvas.height = RASTER_H;
    canvas.style.width = PAGE_W + 'px'; canvas.style.height = PAGE_H + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(RENDER_SCALE,0,0,RENDER_SCALE,0,0);
    ctx.fillStyle = '#fff'; ctx.fillRect(0,0,PAGE_W,PAGE_H);
    ctx.imageSmoothingEnabled = true;
    if('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'high';
    return {canvas, ctx, y: M_TOP};
  }
  function addPage(pages){ const p = makePage(); pages.push(p); return p; }
  function drawFooter(pages){
    pages.forEach((p,i)=>{
      const ctx = p.ctx;
      setFont(ctx, 15, '600', '#344054');
      const s = (i+1) + ' / ' + pages.length;
      const w = ctx.measureText(s).width;
      ctx.fillText(s, (PAGE_W-w)/2, FOOTER_Y);
    });
  }

  function getData(){
    if(!window.__lastGrade || (typeof window.selId === 'function' && window.__lastGrade.sig !== window.selId())){
      if(typeof window.grade === 'function') window.grade();
    }
    if(!window.__lastGrade) throw new Error('先に採点してください。');
    return window.__lastGrade;
  }
  function getIdentity(data){
    const root = $('result');
    const examLine = txt(root && root.querySelector('.resultExamLine')) || (data.k ? ((data.k.year ? String(data.k.year)+'年度 ' : '') + (data.k.exam || '')) : '');
    const subject = txt(root && root.querySelector('.resultSubjectLine')) || txt(root && root.querySelector('.resultSummarySubject')) || (data.k && data.k.subject) || '';
    const summaryMeta = txt(root && root.querySelector('.resultSummaryMeta')) || examLine;
    return {examLine, subject, summaryMeta};
  }
  function getStatsFromRows(data){
    try{
      if(typeof window.sectionStats === 'function') return window.sectionStats(data.rows || []);
    }catch(e){}
    const rows = Array.from(document.querySelectorAll('#result .sectionStats tbody tr'));
    return rows.map(tr=>{
      const c = Array.from(tr.cells).map(td=>txt(td));
      const m = (c[1]||'').match(/([\d.]+)\s*\/\s*([\d.]+)/);
      const cm = (c[3]||'').match(/(\d+)\s*\/\s*(\d+)/);
      return {group:c[0]||'', earn:m?Number(m[1]):0, max:m?Number(m[2]):0, correct:cm?Number(cm[1]):0, items:cm?Number(cm[2]):0, missing:Number(c[4]||0)};
    }).filter(s=>s.group);
  }
  function getSummaryStats(data){
    const root = $('result');
    const cells = Array.from(root ? root.querySelectorAll('.resultSummaryStat') : []);
    const result = cells.map(el=>({label:txt(el.querySelector('span')), value:txt(el.querySelector('b'))}));
    if(result.length) return result;
    return [
      {label:'点数', value: Math.round((data.disp||0)*10)/10 + ' / ' + (data.mx||'')},
      {label:'受験者平均点', value:'—'},
      {label:'正答率', value: Math.round((data.correctRate||0)*10)/10 + '%'},
      {label:'未入力', value:String(data.missing||0)}
    ];
  }
  function displayId(q){ try{ return typeof window.displayId === 'function' ? window.displayId(q) : String(q && q.id || ''); }catch(e){ return String(q && q.id || ''); } }
  function expText(q){ try{ return typeof window.expText === 'function' ? window.expText(q) : ''; }catch(e){ return ''; } }
  function statRate(data, q){ try{ return typeof window.statRateHtml === 'function' ? stripHtml(window.statRateHtml(data.k, q)) : '—'; }catch(e){ return '—'; } }
  function rowNote(data, r){ try{ return typeof window.rowNote === 'function' ? window.rowNote(data.k, r) : (r.q && r.q.note || ''); }catch(e){ return (r.q && r.q.note || ''); } }
  function stripHtml(s){ const d=document.createElement('div'); d.innerHTML=String(s||''); return txt(d); }
  function rowToCells(data, r){
    const judge = !r.included ? '—' : (r.earn === r.pts ? '○' : (r.earn > 0 ? '△' : '×'));
    return [displayId(r.q), (r.got || []).join('') || '未入力', expText(r.q), judge, r.included ? (r.earn + ' / ' + r.pts) : '対象外', statRate(data, r.q), rowNote(data, r) || '—'];
  }

  function drawFittedLine(ctx, text, x, y, maxWidth, maxSize, minSize, weight, color){
    text = String(text == null ? '' : text).replace(/\s+/g, ' ').trim();
    let size = maxSize;
    while(size > minSize){
      setFont(ctx, size, weight, color);
      if(ctx.measureText(text).width <= maxWidth) break;
      size -= 1;
    }
    setFont(ctx, size, weight, color);
    ctx.fillText(text, x, y);
    return Math.round(size * 1.22);
  }

  function drawHeader(ctx, data, y){
    const id = getIdentity(data);
    line(ctx, M_LEFT, y-12, PAGE_W-M_RIGHT, y-12, LINE, 1);
    setFont(ctx, 14, '900', MUTED); ctx.fillText('採点結果', M_LEFT, y);
    setFont(ctx, 14, '700', '#344054'); ctx.fillText('出力日時', PAGE_W-M_RIGHT-90, y-28);
    const dt = dateText(new Date()); ctx.fillText(dt, PAGE_W-M_RIGHT-116, y-8);
    y += 28;
    const title = id.examLine || '採点結果';
    const titleH = drawFittedLine(ctx, title, M_LEFT, y, PAGE_W-M_LEFT-M_RIGHT, 34, 24, '900', TEXT);
    y += titleH + 2;
    const subjectH = drawFittedLine(ctx, id.subject, M_LEFT, y, PAGE_W-M_LEFT-M_RIGHT, 32, 24, '900', TEXT);
    return y + subjectH + 38;
  }

  function drawSummary(ctx, data, y){
    const x = M_LEFT, w = PAGE_W-M_LEFT-M_RIGHT, h = 96;
    const id = getIdentity(data), stats = getSummaryStats(data);
    fillRound(ctx, x, y, w, h, 18, '#fbfcff', '#dfe7fb');
    drawWrapped(ctx, id.subject, x+18, y+18, 255, 22, '900', TEXT, 27, 2);
    drawWrapped(ctx, id.summaryMeta, x+18, y+52, 260, 14, '800', '#5b6475', 18, 2);
    const sx = x+290, gap=10, sw=(w-310 - gap*3)/4;
    stats.slice(0,4).forEach((s,i)=>{
      const bx = sx + i*(sw+gap);
      fillRound(ctx, bx, y+14, sw, h-28, 12, '#fff', '#e1e7f5');
      drawWrapped(ctx, s.label, bx+12, y+24, sw-24, 13, '900', MUTED, 18, 2);
      drawWrapped(ctx, s.value, bx+12, y+56, sw-24, 22, '900', TEXT, 27, 2);
    });
    return y + h + 18;
  }

  function drawRadarPanel(ctx, data, y){
    const stats = getStatsFromRows(data);
    if(!stats.length) return y;
    const x = M_LEFT, w = PAGE_W-M_LEFT-M_RIGHT, h = 435;
    fillRound(ctx, x, y, w, h, 18, '#fbfcff', LINE);
    drawWrapped(ctx, '問題番号別正答率', x+16, y+16, 350, 21, '900', TEXT, 26, 1);
    const cx = x + 215, cy = y + 210, r = 142;
    const n = stats.length;
    ctx.save();
    for(const frac of [0.25,0.5,0.75,1]){
      ctx.beginPath();
      stats.forEach((s,i)=>{ const a=-Math.PI/2+Math.PI*2*i/n; const px=cx+Math.cos(a)*r*frac, py=cy+Math.sin(a)*r*frac; if(i) ctx.lineTo(px,py); else ctx.moveTo(px,py); });
      ctx.closePath(); ctx.strokeStyle = '#d9deea'; ctx.lineWidth = 1; ctx.stroke();
    }
    stats.forEach((s,i)=>{ const a=-Math.PI/2+Math.PI*2*i/n; const px=cx+Math.cos(a)*r, py=cy+Math.sin(a)*r; line(ctx,cx,cy,px,py,'#cbd3e3',1); const lx=cx+Math.cos(a)*(r+34), ly=cy+Math.sin(a)*(r+34); setFont(ctx, 13, '700', '#344054'); const label=String(s.group||''); const tw=ctx.measureText(label).width; ctx.fillText(label,lx-tw/2,ly-8); });
    ctx.beginPath();
    stats.forEach((s,i)=>{ const a=-Math.PI/2+Math.PI*2*i/n; const rate=s.items?Math.max(0,Math.min(1,s.correct/s.items)):0; const px=cx+Math.cos(a)*r*rate, py=cy+Math.sin(a)*r*rate; if(i) ctx.lineTo(px,py); else ctx.moveTo(px,py); });
    ctx.closePath(); ctx.fillStyle='rgba(47,95,208,.20)'; ctx.fill(); ctx.strokeStyle=BLUE; ctx.lineWidth=3; ctx.stroke();
    stats.forEach((s,i)=>{ const a=-Math.PI/2+Math.PI*2*i/n; const rate=s.items?Math.max(0,Math.min(1,s.correct/s.items)):0; const px=cx+Math.cos(a)*r*rate, py=cy+Math.sin(a)*r*rate; ctx.beginPath(); ctx.arc(px,py,5,0,Math.PI*2); ctx.fillStyle=BLUE; ctx.fill(); });
    ctx.restore();

    const tx = x + 485, ty = y + 80;
    const cols = [150,150,120,120,70];
    const headers = ['問題番号','得点','正答率','正答項目','未入力'];
    drawTableHeader(ctx, tx, ty, cols, headers, 26, 13);
    let yy = ty + 26;
    stats.forEach(s=>{
      const row = [s.group, (Math.round(s.earn*10)/10)+' / '+s.max, s.items?Math.round(s.correct/s.items*1000)/10+'%':'0%', s.correct+' / '+s.items, String(s.missing)];
      drawSimpleRow(ctx, tx, yy, cols, row, 31, 15);
      yy += 31;
    });
    return y + h + 20;
  }

  function drawTableHeader(ctx, x, y, cols, headers, h, fs){
    ctx.fillStyle = '#f7f8fc'; ctx.fillRect(x, y, cols.reduce((a,b)=>a+b,0), h);
    let xx=x; setFont(ctx, fs||13, '900', '#4a556b');
    headers.forEach((head,i)=>{
      if(head === '判定'){
        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillText(head, xx + cols[i] / 2, y + 7);
        ctx.restore();
      } else {
        ctx.fillText(head, xx+8, y+7);
      }
      xx+=cols[i];
    });
    line(ctx,x,y+h,x+cols.reduce((a,b)=>a+b,0),y+h,LINE,1);
  }
  function drawSimpleRow(ctx, x, y, cols, row, h, fs){
    let xx=x;
    setFont(ctx, fs||14, '500', TEXT);
    row.forEach((cell,i)=>{ drawWrapped(ctx, cell, xx+8, y+6, cols[i]-16, fs||14, '500', TEXT, 18, 1); xx+=cols[i]; });
    line(ctx,x,y+h,x+cols.reduce((a,b)=>a+b,0),y+h,LINE,1);
  }
  function rowHeight(ctx, cells, cols){
    let max = 30;
    cells.forEach((c,i)=>{ const maxLines = i===0 ? 1 : (i===6 ? 3 : 2); const h = textHeight(ctx, c, cols[i]-16, i===3?26:14, i===3?26:18, maxLines) + 12; if(h>max) max=h; });
    return Math.min(Math.max(max, 30), 76);
  }
  function drawResultTableHeader(ctx, y, continued){
    if(continued){ drawWrapped(ctx, '全問一覧（続き）', M_LEFT, y, 360, 20, '900', TEXT, 26, 1); y += 34; }
    const cols=[215,110,250,70,95,115,PAGE_W-M_LEFT-M_RIGHT-215-110-250-70-95-115];
    drawTableHeader(ctx, M_LEFT, y, cols, ['番号','自分','正解','判定','得点','受験者正答率','注記'], 30, 13);
    return {y:y+30, cols};
  }
  function drawResultRow(ctx, y, cols, cells, h){
    let x=M_LEFT;
    cells.forEach((cell,i)=>{
      const color = i===3 ? (cell==='○'?GOOD:(cell==='△'?WARN:(cell==='×'?BAD:MUTED))) : (i===6?MUTED:TEXT);
      const size = i===3 ? 26 : (i===6?13:14);
      const weight = i===3 ? '900' : '500';
      const lh = i===3 ? 26 : (i===6?17:18);
      const mx = i===6 ? 3 : 2;
      if(i===3){
        setFont(ctx, size, weight, color);
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(cell, x + cols[i] / 2, y + Math.max(21, Math.round((h + size * 0.72) / 2)));
        ctx.restore();
      }
      else drawWrapped(ctx, cell, x+8, y+6, cols[i]-16, size, weight, color, lh, i===0 ? 1 : mx);
      x += cols[i];
    });
    line(ctx, M_LEFT, y+h, PAGE_W-M_RIGHT, y+h, LINE, 1);
  }

  function drawMissedPanel(pages, data){
    const bad = (data.rows || []).filter(r => r.included && (!r.got.length || r.earn < r.pts));
    if(!bad.length) return;
    let p = pages[pages.length-1], ctx = p.ctx;
    const cardW = 174, cardH = 56, gap = 8;
    const panelX = M_LEFT, panelW = PAGE_W-M_LEFT-M_RIGHT;
    const cardsPerRow = Math.floor((panelW-28+gap)/(cardW+gap));
    const rowsNeeded = Math.ceil(bad.length / cardsPerRow);
    let panelH = 52 + rowsNeeded*(cardH+gap) + 10;
    if(p.y + panelH > CONTENT_BOTTOM){ p = addPage(pages); ctx = p.ctx; p.y = M_TOP; }
    if(panelH > CONTENT_BOTTOM - p.y) panelH = CONTENT_BOTTOM - p.y;
    fillRound(ctx, panelX, p.y, panelW, panelH, 18, '#fff7f6', '#f0c7c1');
    drawWrapped(ctx, '間違えた問題・未入力', panelX+16, p.y+16, 320, 21, '900', '#8c1d18', 26, 1);
    let x = panelX+16, y = p.y+50;
    bad.forEach((r,idx)=>{
      if(y + cardH > p.y + panelH - 8){ return; }
      fillRound(ctx, x, y, cardW, cardH, 10, '#fff', '#f0d0cb');
      const judge = !r.got.length ? '未入力' : (r.earn>0?'△':'×');
      drawWrapped(ctx, displayId(r.q)+' '+judge, x+8, y+7, cardW-16, 13, '900', judge==='△'?WARN:BAD, 17, 1);
      drawWrapped(ctx, '自分：'+((r.got||[]).join('')||'未入力')+' / 正解：'+expText(r.q), x+8, y+25, cardW-16, 11, '600', TEXT, 14, 1);
      drawWrapped(ctx, '得点：'+r.earn+' / '+r.pts, x+8, y+39, cardW-16, 11, '600', TEXT, 14, 1);
      x += cardW + gap;
      if((idx+1)%cardsPerRow===0){ x = panelX+16; y += cardH+gap; }
    });
    p.y += panelH + 18;
  }

  function buildCanvases(data){
    const pages=[]; let p=addPage(pages); let ctx=p.ctx;
    p.y = drawHeader(ctx, data, p.y);
    p.y = drawSummary(ctx, data, p.y);
    p.y = drawRadarPanel(ctx, data, p.y);
    let th = drawResultTableHeader(ctx, p.y, false); p.y = th.y; let cols=th.cols;
    const rows = (data.rows || []).filter(r => r.included !== false);
    rows.forEach(r=>{
      const cells = rowToCells(data, r);
      const h = rowHeight(ctx, cells, cols);
      if(p.y + h > CONTENT_BOTTOM){ p = addPage(pages); ctx = p.ctx; th = drawResultTableHeader(ctx, M_TOP, true); p.y = th.y; cols = th.cols; }
      drawResultRow(ctx, p.y, cols, cells, h); p.y += h;
    });
    drawMissedPanel(pages, data);
    drawFooter(pages);
    return pages.map(p=>p.canvas);
  }

  function canvasToJpegBytes(canvas){
    return new Promise((resolve, reject)=>{
      if(canvas.toBlob){
        canvas.toBlob(async blob=>{
          try{
            if(!blob) throw new Error('canvas JPEG生成に失敗しました。');
            resolve(new Uint8Array(await blob.arrayBuffer()));
          }catch(e){ reject(e); }
        }, 'image/jpeg', JPEG_QUALITY);
      }else{
        try{
          const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
          const bin = atob(dataUrl.split(',')[1]||'');
          const bytes = new Uint8Array(bin.length);
          for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
          resolve(bytes);
        }catch(e){ reject(e); }
      }
    });
  }
  const enc = new TextEncoder();
  function ascii(s){ return enc.encode(String(s)); }
  function makePdfBlob(jpegs){
    const pdfW=595.275590551, pdfH=841.88976378, parts=[], offsets=[0]; let len=0;
    function add(part){ if(typeof part==='string') part=ascii(part); parts.push(part); len += part.byteLength || part.length || 0; }
    function obj(n, body){ offsets[n]=len; add(n+' 0 obj\n'); body.forEach(add); add('\nendobj\n'); }
    add('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    const kids=[]; for(let i=0;i<jpegs.length;i++) kids.push((3+i*3)+' 0 R');
    obj(1,['<< /Type /Catalog /Pages 2 0 R >>']);
    obj(2,['<< /Type /Pages /Kids [',kids.join(' '),'] /Count ',String(jpegs.length),' >>']);
    for(let i=0;i<jpegs.length;i++){
      const page=3+i*3, content=page+1, image=page+2, name='Im'+(i+1);
      const stream='q\n'+pdfW.toFixed(3)+' 0 0 '+pdfH.toFixed(3)+' 0 0 cm\n/'+name+' Do\nQ\n';
      obj(page,['<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ',pdfW.toFixed(3),' ',pdfH.toFixed(3),'] /Resources << /XObject << /',name,' ',image,' 0 R >> >> /Contents ',content,' 0 R >>']);
      obj(content,['<< /Length ',String(ascii(stream).length),' >>\nstream\n',stream,'endstream']);
      offsets[image]=len; add(image+' 0 obj\n');
      add('<< /Type /XObject /Subtype /Image /Width '+RASTER_W+' /Height '+RASTER_H+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+jpegs[i].length+' >>\nstream\n');
      add(jpegs[i]); add('\nendstream\nendobj\n');
    }
    const xref=len, maxObj=2+jpegs.length*3;
    add('xref\n0 '+(maxObj+1)+'\n0000000000 65535 f \n');
    for(let i=1;i<=maxObj;i++) add(String(offsets[i]).padStart(10,'0')+' 00000 n \n');
    add('trailer\n<< /Size '+(maxObj+1)+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF');
    return new Blob(parts,{type:'application/pdf'});
  }

  function showPrintFallback(reason){
    try{
      if(typeof window.__ctPdfV163FallbackExport === 'function'){
        window.__ctPdfV163FallbackExport();
        return;
      }
      alert('このブラウザでは直接PDF保存が制限されました。印刷画面から「PDFとして保存」を選んでください。\n' + (reason && reason.message ? reason.message : reason || ''));
      window.print();
    }catch(e){ alert('PDF出力に失敗しました: '+(e&&e.message?e.message:e)); }
  }

  function isIOSSafariOnly(){
    // Name is kept for compatibility with the surrounding code, but the branch is intentionally Safari-only.
    // Chrome/Firefox/Edge, including their iOS user agents, keep the existing direct-download path.
    const ua = navigator.userAgent || '';
    const vendor = navigator.vendor || '';
    const isSafari = /Safari\//.test(ua) && /Apple/i.test(vendor || 'Apple');
    const isOtherBrowser = /(Chrome|Chromium|CriOS|FxiOS|Firefox|EdgiOS|Edg\/|OPiOS|OPR\/|DuckDuckGo|Instagram|FBAN|FBAV|Line)/i.test(ua);
    return isSafari && !isOtherBrowser;
  }

  function safeFilename(s){
    let name = String(s || '採点結果.pdf').replace(/[\\/:*?"<>|]/g, '_').trim();
    if(!name) name = '採点結果.pdf';
    if(!/\.pdf$/i.test(name)) name += '.pdf';
    return name;
  }

  function arrayBufferToBase64(buffer){
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 8192;
    for(let i=0;i<bytes.length;i+=chunkSize){
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
  }

  function blobToDataUrl(blob){
    return new Promise((resolve, reject)=>{
      if(typeof FileReader !== 'undefined'){
        const reader = new FileReader();
        reader.onload = ()=> resolve(String(reader.result || ''));
        reader.onerror = ()=> reject(reader.error || new Error('PDFデータURLの作成に失敗しました。'));
        reader.readAsDataURL(blob);
        return;
      }
      if(blob && typeof blob.arrayBuffer === 'function'){
        blob.arrayBuffer().then(buffer=>{
          resolve('data:application/pdf;base64,' + arrayBufferToBase64(buffer));
        }).catch(reject);
        return;
      }
      reject(new Error('このブラウザではPDFデータURLを作成できません。'));
    });
  }

  function showPdfDownloadModal(dataUri, filename){
    const old = document.getElementById('pdf-dl-modal');
    if(old) old.remove();

    const safeName = safeFilename(filename || '採点結果.pdf');
    const overlay = document.createElement('div');
    overlay.id = 'pdf-dl-modal';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,"Hiragino Sans","Yu Gothic",Meiryo,sans-serif;';

    const card = document.createElement('div');
    card.style.cssText = 'background:white;border-radius:16px;padding:24px;max-width:440px;width:100%;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,.25);color:#1d2433;';

    const title = document.createElement('div');
    title.textContent = '採点結果PDF';
    title.style.cssText = 'font-weight:bold;font-size:16px;margin-bottom:8px;';

    const guide = document.createElement('div');
    guide.style.cssText = 'font-size:12px;color:#6b7280;margin-bottom:20px;line-height:1.7;';
    guide.innerHTML = '下のボタンを押してダウンロードしてください。<br><b>Safari</b>：長押し →「リンクをダウンロード」';

    const link = document.createElement('a');
    link.href = dataUri;
    link.download = safeName;
    link.textContent = safeName + ' をダウンロード';
    link.style.cssText = 'display:block;background:#2563eb;color:white;border-radius:12px;padding:13px;font-weight:bold;font-size:14px;text-decoration:none;margin-bottom:12px;word-break:break-all;';

    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = '閉じる';
    close.style.cssText = 'background:#e5e7eb;border:none;border-radius:10px;padding:9px 24px;font-size:13px;font-weight:600;cursor:pointer;';
    close.addEventListener('click', function(){ overlay.remove(); });

    card.appendChild(title);
    card.appendChild(guide);
    card.appendChild(link);
    card.appendChild(close);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
  }

  async function showSafariPdfDownloadModal(pdf, filename){
    const dataUri = await blobToDataUrl(pdf);
    if(!/^data:application\/pdf(?:;[^,]*)?;base64,/i.test(dataUri)){
      throw new Error('PDFのdata URI形式が不正です。');
    }
    showPdfDownloadModal(dataUri, filename);
  }

  async function deliverPdf(pdf, filename){
    if(isIOSSafariOnly()){
      await showSafariPdfDownloadModal(pdf, filename);
      return;
    }
    const url = URL.createObjectURL(pdf);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 30000);
  }

  async function exportResultPdfManual(){
    try{
      const data = getData();
      await sleepFrame();
      const canvases = buildCanvases(data);
      const jpegs = [];
      for(const c of canvases) jpegs.push(await canvasToJpegBytes(c));
      const pdf = makePdfBlob(jpegs);
      const k = data.k || {};
      const filename = '採点結果_' + escFile((k.year ? String(k.year)+'_' : '') + (k.subject || '')) + '_' + fileStamp(new Date()) + '.pdf';
      await deliverPdf(pdf, filename);
    }catch(err){
      console.error(err);
      if(isIOSSafariOnly()){
        alert('PDF生成に失敗しました: ' + (err && err.message ? err.message : err));
      }else{
        showPrintFallback(err);
      }
    }
  }

  window.exportResultPdf = exportResultPdfManual;
  document.addEventListener('click', function(e){
    const btn = e.target && e.target.closest && e.target.closest('#exportPdfResult');
    if(!btn) return;
    e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation();
    exportResultPdfManual();
  }, true);
  console.info('PDF export renderer loaded: ' + VERSION);
})();

}
