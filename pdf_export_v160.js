(function(){
  'use strict';

  const VERSION = 'v160';
  const PAGE_W = 1240;
  const PAGE_H = 1754;
  const M_LEFT = 62;
  const M_RIGHT = 62;
  const M_TOP = 54;
  const M_BOTTOM_CONTENT = 76;
  const FOOTER_BOTTOM = 30; // 30px at 150dpi is about 5.1mm on A4.

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
      '.pdfRasterPage{width:'+PAGE_W+'px;height:'+PAGE_H+'px;position:relative;overflow:hidden;background:#fff;color:#1d2433;font-size:16px;line-height:1.35}',
      '.pdfRasterContent{position:absolute;left:'+M_LEFT+'px;right:'+M_RIGHT+'px;top:'+M_TOP+'px;bottom:'+M_BOTTOM_CONTENT+'px;overflow:hidden}',
      '.pdfRasterFooter{position:absolute;left:0;right:0;bottom:'+FOOTER_BOTTOM+'px;height:18px;display:flex;align-items:flex-end;justify-content:center;font-size:15px;line-height:1;color:#344054;z-index:5}',
      '.pdfStamp{display:grid;grid-template-columns:minmax(0,1fr) 190px;gap:24px;align-items:start;margin:0 0 10px;padding-bottom:9px;border-bottom:1px solid #d9deea}',
      '.pdfStampText{text-align:right;font-size:15px;line-height:1.25;color:#344054}',
      '.pdfStampText b{font-size:15px}',
      '.pdfContinueTitle{font-size:20px;font-weight:900;color:#344054;margin:0 0 10px;padding-bottom:8px;border-bottom:1px solid #d9deea}',
      '.resultActionBar{margin:0 0 12px!important;padding:0!important;border:0!important;background:transparent!important;border-radius:0!important;display:block!important;box-shadow:none!important}',
      '.resultActionLabel{font-size:16px!important;color:#647086!important;margin:0 0 3px!important;font-weight:900!important;line-height:1.2!important}',
      '.resultActionIdentity{font-size:34px!important;font-weight:900!important;line-height:1.12!important;color:#1d2433!important}',
      '.resultExamLine{display:block!important}',
      '.resultSubjectLine{display:block!important;margin-top:2px!important;font-size:1.08em!important}',
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
      '.radarPanel{margin-top:14px!important;padding:14px!important;border:1px solid #d9deea!important;border-radius:18px!important;background:#fbfcff!important;box-shadow:none!important;overflow:hidden!important}',
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
      '.resultTable th:nth-child(1),.resultTable td:nth-child(1){width:155px!important}',
      '.resultTable th:nth-child(2),.resultTable td:nth-child(2){width:100px!important}',
      '.resultTable th:nth-child(3),.resultTable td:nth-child(3){width:225px!important}',
      '.resultTable th:nth-child(4),.resultTable td:nth-child(4){width:95px!important}',
      '.resultTable th:nth-child(5),.resultTable td:nth-child(5){width:70px!important;text-align:center!important}',
      '.resultTable td:nth-child(5){font-size:22px!important;line-height:1!important;font-weight:900!important}',
      '.resultTable th:nth-child(6),.resultTable td:nth-child(6){width:126px!important}',
      '.resultTable th:nth-child(7),.resultTable td:nth-child(7){width:auto!important;font-size:13px!important;color:#647086!important}',
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

  window.exportResultPdf = function exportResultPdfV159(){
    exportDirectPdf().catch(function(err){
      console.error(err);
      alert('PDF出力に失敗しました: ' + (err && err.message ? err.message : err));
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

  console.info('PDF export direct renderer loaded: ' + VERSION);
})();
