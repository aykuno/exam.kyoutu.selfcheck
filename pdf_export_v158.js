(function(){
  'use strict';

  const VERSION = 'v158';

  function byId(id){ return document.getElementById(id); }
  function pad(n){ return String(n).padStart(2,'0'); }
  function dateText(d){ return d.getFullYear() + '/' + pad(d.getMonth()+1) + '/' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }

  function cloneForPdf(node){
    if(!node) return null;
    const c = node.cloneNode(true);
    c.querySelectorAll('button, .pdfBtn, #exportPdfResult').forEach(el => el.remove());
    c.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
    return c;
  }

  function makePrintWindow(){
    const w = window.open('', '_blank');
    if(!w){
      alert('ポップアップがブロックされました。ブラウザでポップアップを許可してから再度実行してください。');
      return null;
    }
    w.document.open();
    w.document.write('<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>採点結果PDF</title></head><body><div id="pdfRoot"></div></body></html>');
    w.document.close();
    return w;
  }

  function buildCss(baseCss){
    return baseCss + '\n' + [
      '@page{size:A4 portrait;margin:0}',
      '*{box-sizing:border-box}',
      'html,body{margin:0!important;padding:0!important;background:#fff!important;color:#1d2433!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}',
      'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,"Hiragino Sans","Yu Gothic",Meiryo,sans-serif;font-size:9pt;line-height:1.35}',
      '#pdfRoot{width:210mm;margin:0 auto;background:#fff}',
      '.pdfPage{width:210mm;height:297mm;position:relative;overflow:hidden;background:#fff;margin:0 auto;page-break-after:always;break-after:page}',
      '.pdfPage:last-child{page-break-after:auto;break-after:auto}',
      '.pdfContent{position:absolute;left:8mm;right:8mm;top:8mm;bottom:12mm;overflow:hidden}',
      '.pdfFooter{position:absolute;left:0;right:0;bottom:5mm;height:4mm;display:flex;align-items:flex-end;justify-content:center;font-size:8pt;line-height:1;color:#344054;z-index:5;pointer-events:none}',
      '.pdfStamp{display:grid;grid-template-columns:minmax(0,1fr) 38mm;gap:4mm;align-items:start;margin:0 0 2mm;padding-bottom:1.5mm;border-bottom:1px solid #d9deea}',
      '.pdfStampText{text-align:right;font-size:8pt;line-height:1.25;color:#344054}',
      '.pdfStampText b{font-size:8.5pt}',
      '.pdfContinueTitle{font-size:10.5pt;font-weight:900;color:#344054;margin:0 0 2mm;padding-bottom:1.5mm;border-bottom:1px solid #d9deea}',
      '.pdfPage .resultActionBar{margin:0 0 2mm!important;padding:0!important;border:0!important;background:transparent!important;border-radius:0!important;display:block!important;box-shadow:none!important}',
      '.pdfPage .resultActionLabel{font-size:9pt!important;color:#647086!important;margin-bottom:.6mm!important}',
      '.pdfPage .resultActionIdentity{font-size:17pt!important;font-weight:900!important;line-height:1.13!important;color:#1d2433!important}',
      '.pdfPage .resultExamLine{display:block!important}',
      '.pdfPage .resultSubjectLine{display:block!important;margin-top:.8mm!important;font-size:1.08em!important}',
      '.pdfPage .resultSummaryCard{margin:2mm 0!important;padding:2.2mm!important;border-radius:3mm!important;grid-template-columns:43mm minmax(0,1fr)!important;gap:3mm!important;box-shadow:none!important;break-inside:avoid-page!important;page-break-inside:avoid!important}',
      '.pdfPage .resultSummarySubject{font-size:12pt!important;line-height:1.16!important}',
      '.pdfPage .resultSummaryMeta{font-size:7.5pt!important;margin-top:.9mm!important}',
      '.pdfPage .resultSummaryStats{gap:1.7mm!important;grid-template-columns:repeat(4,minmax(0,1fr))!important}',
      '.pdfPage .resultSummaryStat{padding:1.45mm 1.8mm!important;border-radius:2.2mm!important}',
      '.pdfPage .resultSummaryStat span{font-size:7pt!important}',
      '.pdfPage .resultSummaryStat b{font-size:12pt!important;line-height:1.15!important}',
      '.pdfPage .radarPanel{margin-top:2.2mm!important;padding:2.4mm!important;border-radius:3mm!important;box-shadow:none!important;break-inside:avoid-page!important;page-break-inside:avoid!important}',
      '.pdfPage .radarPanel h3{margin:0 0 1.3mm!important;font-size:11pt!important}',
      '.pdfPage .radarWrap{display:grid!important;grid-template-columns:72mm minmax(0,1fr)!important;gap:4mm!important;align-items:center!important}',
      '.pdfPage .radarSvg{width:68mm!important;max-width:68mm!important;height:68mm!important;max-height:68mm!important;margin:0!important}',
      '.pdfPage .sectionStats{font-size:8.7pt!important;overflow:visible!important}',
      '.pdfPage .sectionStats table{min-width:0!important;width:100%!important;margin:0!important;table-layout:fixed!important}',
      '.pdfPage .sectionStats th,.pdfPage .sectionStats td{padding:1mm .9mm!important;line-height:1.20!important}',
      '.pdfPage .sectionStats th:nth-child(1),.pdfPage .sectionStats td:nth-child(1){width:23mm!important}',
      '.pdfPage .sectionStats th:nth-child(2),.pdfPage .sectionStats td:nth-child(2){width:24mm!important}',
      '.pdfPage .sectionStats th:nth-child(3),.pdfPage .sectionStats td:nth-child(3){width:18mm!important}',
      '.pdfPage .sectionStats th:nth-child(4),.pdfPage .sectionStats td:nth-child(4){width:20mm!important}',
      '.pdfPage .sectionStats th:nth-child(5),.pdfPage .sectionStats td:nth-child(5){width:12mm!important}',
      '.pdfPage .tableScrollNotice{display:none!important}',
      '.pdfPage .resultTableWrap{overflow:visible!important;margin-top:2.4mm!important;width:100%!important}',
      '.pdfPage .resultTable{min-width:0!important;max-width:none!important;width:100%!important;table-layout:fixed!important;margin:0!important;font-size:7.55pt!important;border-collapse:collapse!important}',
      '.pdfPage .resultTable th,.pdfPage .resultTable td{padding:1.05mm .95mm!important;line-height:1.24!important;border-bottom:1px solid #d9deea!important;vertical-align:middle!important;word-break:break-word!important;overflow:visible!important;text-overflow:clip!important;white-space:normal!important}',
      '.pdfPage .resultTable th{font-size:7.2pt!important;background:#f7f8fc!important;color:#4a556b!important}',
      '.pdfPage .resultTable th:nth-child(1),.pdfPage .resultTable td:nth-child(1){width:27mm!important}',
      '.pdfPage .resultTable th:nth-child(2),.pdfPage .resultTable td:nth-child(2){width:18mm!important}',
      '.pdfPage .resultTable th:nth-child(3),.pdfPage .resultTable td:nth-child(3){width:39mm!important}',
      '.pdfPage .resultTable th:nth-child(4),.pdfPage .resultTable td:nth-child(4){width:17mm!important}',
      '.pdfPage .resultTable th:nth-child(5),.pdfPage .resultTable td:nth-child(5){width:12mm!important;text-align:center!important}',
      '.pdfPage .resultTable td:nth-child(5){font-size:12pt!important;line-height:1!important;font-weight:900!important}',
      '.pdfPage .resultTable th:nth-child(6),.pdfPage .resultTable td:nth-child(6){width:22mm!important}',
      '.pdfPage .resultTable th:nth-child(7),.pdfPage .resultTable td:nth-child(7){width:auto!important;font-size:7pt!important}',
      '.pdfPage .missedPanel{margin:2.6mm 0 0!important;padding:2.3mm!important;border-radius:3mm!important}',
      '.pdfPage .missedPanel h3{margin:0 0 1.5mm!important;font-size:11pt!important}',
      '.pdfPage .missedList{gap:1.3mm!important}',
      '.pdfPage .missedItem{font-size:7.3pt!important;line-height:1.28!important;padding:1mm 1.2mm!important;border-radius:2mm!important}',
      '.pdfPage .missedOk{margin-top:2.6mm!important;padding:1.8mm!important;font-size:9pt!important;border-radius:2.5mm!important}',
      '@media print{button{display:none!important}#pdfRoot{margin:0!important}}'
    ].join('\n');
  }

  function addStyle(doc){
    const style = doc.createElement('style');
    const base = (document.querySelector('style') && document.querySelector('style').textContent) || '';
    style.textContent = buildCss(base);
    doc.head.appendChild(style);
  }

  function createPage(doc, root){
    const page = doc.createElement('div');
    page.className = 'pdfPage';
    const content = doc.createElement('div');
    content.className = 'pdfContent';
    const footer = doc.createElement('div');
    footer.className = 'pdfFooter';
    page.appendChild(content);
    page.appendChild(footer);
    root.appendChild(page);
    return {page, content, footer};
  }

  function overflowed(content){
    return content.scrollHeight > content.clientHeight + 1;
  }

  function appendWithOverflowCheck(content, node){
    content.appendChild(node);
    if(overflowed(content)){
      content.removeChild(node);
      return false;
    }
    return true;
  }

  function makeTableShell(doc, sourceTable){
    const wrap = doc.createElement('div');
    wrap.className = 'resultTableWrap';
    const table = doc.createElement('table');
    table.className = sourceTable.className || 'resultTable';
    const thead = sourceTable.tHead ? sourceTable.tHead.cloneNode(true) : null;
    const tbody = doc.createElement('tbody');
    if(thead) table.appendChild(thead);
    table.appendChild(tbody);
    wrap.appendChild(table);
    return {wrap, table, tbody};
  }

  function addContinueTitle(doc, content, text){
    const h = doc.createElement('div');
    h.className = 'pdfContinueTitle';
    h.textContent = text;
    content.appendChild(h);
  }

  function addStamp(doc, content){
    const box = doc.createElement('div');
    box.className = 'pdfStamp';
    const left = doc.createElement('div');
    const right = doc.createElement('div');
    right.className = 'pdfStampText';
    right.innerHTML = '出力日時<br><b>' + dateText(new Date()) + '</b>';
    box.appendChild(left);
    box.appendChild(right);
    content.appendChild(box);
  }

  function buildPages(w){
    const doc = w.document;
    const root = doc.getElementById('pdfRoot');
    const result = byId('result');
    if(!result) throw new Error('採点結果エリアが見つかりません。');

    const action = cloneForPdf(result.querySelector('.resultActionBar'));
    const summary = cloneForPdf(result.querySelector('.resultSummaryCard') || result.querySelector('.metrics'));
    const radar = cloneForPdf(result.querySelector('.radarPanel'));
    const table = result.querySelector('.resultTable');
    const missed = cloneForPdf(result.querySelector('.missedPanel') || result.querySelector('.missedOk'));
    if(!table) throw new Error('全問正誤表が見つかりません。先に採点してください。');

    let current = createPage(doc, root);
    addStamp(doc, current.content);
    [action, summary, radar].filter(Boolean).forEach(node => {
      if(!appendWithOverflowCheck(current.content, node)){
        current = createPage(doc, root);
        appendWithOverflowCheck(current.content, node);
      }
    });

    let shell = makeTableShell(doc, table);
    if(!appendWithOverflowCheck(current.content, shell.wrap)){
      current = createPage(doc, root);
      addContinueTitle(doc, current.content, '全問一覧');
      shell = makeTableShell(doc, table);
      current.content.appendChild(shell.wrap);
    }

    const rows = Array.from(table.tBodies[0] ? table.tBodies[0].rows : table.rows).map(r => r.cloneNode(true));
    rows.forEach(row => {
      shell.tbody.appendChild(row);
      if(overflowed(current.content)){
        shell.tbody.removeChild(row);
        current = createPage(doc, root);
        addContinueTitle(doc, current.content, '全問一覧（続き）');
        shell = makeTableShell(doc, table);
        current.content.appendChild(shell.wrap);
        shell.tbody.appendChild(row);
      }
    });

    if(missed){
      if(!appendWithOverflowCheck(current.content, missed)){
        current = createPage(doc, root);
        addContinueTitle(doc, current.content, '間違えた問題・未入力');
        current.content.appendChild(missed);
      }
    }

    const pages = Array.from(doc.querySelectorAll('.pdfPage'));
    pages.forEach((p, i) => {
      const f = p.querySelector('.pdfFooter');
      if(f) f.textContent = (i + 1) + ' / ' + pages.length;
    });
  }

  function safeGrade(){
    if(typeof window.grade === 'function') window.grade();
  }

  window.exportResultPdf = function exportResultPdfV158(){
    try{
      if(!window.__lastGrade || (typeof window.selId === 'function' && window.__lastGrade.sig !== window.selId())){
        safeGrade();
      }
      if(!window.__lastGrade){
        alert('先に採点してください。');
        return;
      }
      const w = makePrintWindow();
      if(!w) return;
      addStyle(w.document);
      // Build after the popup document has applied CSS; this lets us measure true page height.
      setTimeout(function(){
        try{
          buildPages(w);
          setTimeout(function(){ w.focus(); w.print(); }, 250);
        }catch(err){
          w.close();
          console.error(err);
          alert('PDF出力の準備に失敗しました: ' + (err && err.message ? err.message : err));
        }
      }, 80);
    }catch(err){
      console.error(err);
      alert('PDF出力に失敗しました: ' + (err && err.message ? err.message : err));
    }
  };

  document.addEventListener('click', function(e){
    const btn = e.target && e.target.closest && e.target.closest('#exportPdfResult');
    if(!btn) return;
    e.preventDefault();
    e.stopPropagation();
    if(typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
    window.exportResultPdf();
  }, true);

  console.info('PDF export override loaded: ' + VERSION);
})();
