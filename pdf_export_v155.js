(function(){
  'use strict';

  const A4_PT_W = 595.28;
  const A4_PT_H = 841.89;
  const CSS_DPI = 96;
  const MM_PER_IN = 25.4;
  const A4_CSS_W = 210 / MM_PER_IN * CSS_DPI;
  const A4_CSS_H = 297 / MM_PER_IN * CSS_DPI;
  const RENDER_SCALE = 2.35;

  function v155Css(){
    return `
.ctPdfRoot{position:fixed;left:-100000px;top:0;width:210mm;z-index:-1000;background:#fff;color:#1d2433;}
.ctPdfRoot *{box-sizing:border-box;}
.ctPdfRoot .pdfPage{width:210mm!important;height:297mm!important;margin:0!important;padding:8mm 10mm 0 10mm!important;position:relative!important;overflow:hidden!important;background:#fff!important;box-shadow:none!important;border:0!important;color:#1d2433!important;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,"Hiragino Sans","Yu Gothic",Meiryo,sans-serif!important;font-size:9pt!important;line-height:1.34!important;}
.ctPdfRoot .pdfContent{height:279.5mm!important;max-height:279.5mm!important;overflow:hidden!important;position:relative!important;z-index:1!important;padding:0!important;margin:0!important;}
.ctPdfRoot .pdfFooter{position:absolute!important;left:0!important;right:0!important;bottom:5mm!important;height:3.5mm!important;display:flex!important;align-items:center!important;justify-content:center!important;text-align:center!important;font-size:8pt!important;line-height:1!important;color:#344054!important;z-index:5!important;pointer-events:none!important;}
.ctPdfRoot .pdfPrintHeader{display:grid!important;grid-template-columns:minmax(0,1fr) 36mm!important;align-items:start!important;gap:4mm!important;border-bottom:1px solid #d9deea!important;padding-bottom:1.4mm!important;margin:0 0 2mm!important;}
.ctPdfRoot .pdfPrintStamp{text-align:right!important;font-size:8pt!important;line-height:1.2!important;color:#344054!important;}
.ctPdfRoot .pdfPrintStamp b{font-size:8.4pt!important;}
.ctPdfRoot .pdfContinueTitle{font-size:10.5pt!important;font-weight:900!important;color:#344054!important;margin:0 0 2mm!important;padding-bottom:1.5mm!important;border-bottom:1px solid #d9deea!important;}
.ctPdfRoot .resultActionBar{margin:0 0 2.1mm!important;padding:0!important;border:0!important;background:transparent!important;border-radius:0!important;display:block!important;box-shadow:none!important;}
.ctPdfRoot .resultActionBar .pdfBtn{display:none!important;}
.ctPdfRoot .resultActionLabel{font-size:9pt!important;color:#647086!important;margin:0 0 .5mm!important;font-weight:900!important;line-height:1.15!important;}
.ctPdfRoot .resultActionIdentity{font-size:17pt!important;font-weight:900!important;line-height:1.12!important;color:#1d2433!important;}
.ctPdfRoot .resultExamLine{display:block!important;}
.ctPdfRoot .resultSubjectLine{display:block!important;margin-top:.8mm!important;font-size:1.08em!important;}
.ctPdfRoot .resultSummaryCard{margin:2mm 0!important;padding:2.25mm!important;border-radius:3mm!important;display:grid!important;grid-template-columns:43mm minmax(0,1fr)!important;gap:3mm!important;align-items:stretch!important;box-shadow:none!important;border:1px solid #dfe7fb!important;background:#fbfcff!important;}
.ctPdfRoot .resultSummarySubject{font-size:12pt!important;line-height:1.16!important;font-weight:900!important;}
.ctPdfRoot .resultSummaryMeta{font-size:7.5pt!important;margin-top:.8mm!important;color:#5b6475!important;font-weight:800!important;}
.ctPdfRoot .resultSummaryStats{display:grid!important;gap:1.7mm!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;}
.ctPdfRoot .resultSummaryStat{background:#fff!important;border:1px solid #e1e7f5!important;border-radius:2.2mm!important;padding:1.45mm 1.8mm!important;}
.ctPdfRoot .resultSummaryStat span{display:block!important;font-size:7pt!important;color:#647086!important;font-weight:800!important;}
.ctPdfRoot .resultSummaryStat b{display:block!important;margin-top:.5mm!important;font-size:12pt!important;line-height:1.15!important;font-weight:900!important;}
.ctPdfRoot .avgScoreMetric{margin-top:1mm!important;padding-top:1mm!important;border-top:1px solid #dfe7fb!important;}
.ctPdfRoot .avgScoreMetric .avgLabel{font-size:6.5pt!important;}
.ctPdfRoot .avgScoreMetric .avgValue{font-size:9.5pt!important;}
.ctPdfRoot .radarPanel{margin:2.2mm 0 0!important;padding:2.5mm!important;border-radius:3mm!important;box-shadow:none!important;border:1px solid #d9deea!important;background:#fbfcff!important;}
.ctPdfRoot .radarPanel h3{margin:0 0 1.4mm!important;font-size:11pt!important;line-height:1.2!important;}
.ctPdfRoot .radarWrap{display:grid!important;grid-template-columns:72mm minmax(0,1fr)!important;gap:4mm!important;align-items:center!important;}
.ctPdfRoot .radarSvg{display:block!important;width:68mm!important;max-width:68mm!important;height:68mm!important;max-height:68mm!important;margin:0!important;}
.ctPdfRoot .sectionStats{font-size:8.7pt!important;overflow:visible!important;width:100%!important;}
.ctPdfRoot .sectionStats table{min-width:0!important;width:100%!important;margin:0!important;table-layout:fixed!important;border-collapse:collapse!important;}
.ctPdfRoot .sectionStats th,.ctPdfRoot .sectionStats td{padding:1mm .95mm!important;line-height:1.20!important;border-bottom:1px solid #d9deea!important;vertical-align:middle!important;}
.ctPdfRoot .sectionStats th:nth-child(1),.ctPdfRoot .sectionStats td:nth-child(1){width:23mm!important;}
.ctPdfRoot .sectionStats th:nth-child(2),.ctPdfRoot .sectionStats td:nth-child(2){width:24mm!important;}
.ctPdfRoot .sectionStats th:nth-child(3),.ctPdfRoot .sectionStats td:nth-child(3){width:18mm!important;}
.ctPdfRoot .sectionStats th:nth-child(4),.ctPdfRoot .sectionStats td:nth-child(4){width:20mm!important;}
.ctPdfRoot .sectionStats th:nth-child(5),.ctPdfRoot .sectionStats td:nth-child(5){width:12mm!important;}
.ctPdfRoot .tableScrollNotice{display:none!important;}
.ctPdfRoot .resultTableWrap{overflow:visible!important;margin:2.4mm 0 0!important;width:100%!important;}
.ctPdfRoot .resultTableWrap table{min-width:0!important;width:100%!important;table-layout:fixed!important;margin:0!important;border-collapse:collapse!important;font-size:7.55pt!important;}
.ctPdfRoot .resultTable th,.ctPdfRoot .resultTable td{padding:1.03mm 1mm!important;line-height:1.25!important;border-bottom:1px solid #d9deea!important;vertical-align:middle!important;word-break:break-word!important;overflow:visible!important;text-overflow:clip!important;white-space:normal!important;}
.ctPdfRoot .resultTable th{font-size:7.2pt!important;background:#f7f8fc!important;color:#4a556b!important;}
.ctPdfRoot .resultTable th:nth-child(1),.ctPdfRoot .resultTable td:nth-child(1){width:27mm!important;}
.ctPdfRoot .resultTable th:nth-child(2),.ctPdfRoot .resultTable td:nth-child(2){width:18mm!important;}
.ctPdfRoot .resultTable th:nth-child(3),.ctPdfRoot .resultTable td:nth-child(3){width:39mm!important;}
.ctPdfRoot .resultTable th:nth-child(4),.ctPdfRoot .resultTable td:nth-child(4){width:17mm!important;}
.ctPdfRoot .resultTable th:nth-child(5),.ctPdfRoot .resultTable td:nth-child(5){width:12mm!important;text-align:center!important;}
.ctPdfRoot .resultTable td:nth-child(5){font-size:11pt!important;line-height:1!important;font-weight:900!important;}
.ctPdfRoot .resultTable td:nth-child(5).muted{font-size:9pt!important;color:#647086!important;}
.ctPdfRoot .resultTable th:nth-child(6),.ctPdfRoot .resultTable td:nth-child(6){width:22mm!important;}
.ctPdfRoot .resultTable th:nth-child(7),.ctPdfRoot .resultTable td:nth-child(7){width:auto!important;font-size:7pt!important;}
.ctPdfRoot .ok{color:#137333!important;font-weight:900!important;}.ctPdfRoot .ng{color:#b3261e!important;font-weight:900!important;}.ctPdfRoot .partial{color:#8a5b00!important;font-weight:900!important;}
.ctPdfRoot .missedPanel{margin:2.8mm 0 0!important;padding:2.4mm!important;border-radius:3mm!important;border:1px solid #f0c7c1!important;background:#fff7f6!important;}
.ctPdfRoot .missedPanel h3{margin:0 0 1.6mm!important;font-size:11pt!important;color:#8c1d18!important;}
.ctPdfRoot .missedList{display:flex!important;flex-wrap:wrap!important;gap:1.35mm!important;}
.ctPdfRoot .missedItem{font-size:7.3pt!important;line-height:1.28!important;padding:1mm 1.2mm!important;border-radius:2mm!important;background:#fff!important;border:1px solid #f0d0cb!important;}
.ctPdfRoot .missedItem b{font-weight:900!important;}
.ctPdfRoot .missedItem .judgeNg{color:#b3261e!important;font-weight:900!important;}.ctPdfRoot .missedItem .judgePartial{color:#8a5b00!important;font-weight:900!important;}
.ctPdfRoot .missedOk{margin-top:2.6mm!important;padding:1.8mm!important;font-size:9pt!important;border-radius:2.5mm!important;border:1px solid #cfe8d4!important;background:#f3faf5!important;color:#137333!important;font-weight:800!important;}
    `;
  }

  function ensureStyle(){
    let st = document.getElementById('ctPdfRasterStyleV155');
    if(!st){
      st = document.createElement('style');
      st.id = 'ctPdfRasterStyleV155';
      st.textContent = v155Css();
      document.head.appendChild(st);
    }
  }

  function dateText(d){
    if (typeof pdfDateText === 'function') return pdfDateText(d);
    const p = n => String(n).padStart(2,'0');
    return d.getFullYear() + '/' + p(d.getMonth()+1) + '/' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  function tableRowHtml(r,k){
    return `<tr><td>${esc(displayId(r.q))}</td><td>${esc(r.got.join('')||'未入力')}</td><td>${esc(expText(r.q))}</td><td>${r.included?`${r.earn} / ${r.pts}`:'対象外'}</td><td class="judgeCell ${!r.included?'muted':(r.earn===r.pts?'ok':(r.earn>0?'partial':'ng'))}">${!r.included?'—':(r.earn===r.pts?'○':(r.earn>0?'△':'×'))}</td><td class="rateCell">${statRateHtml(k,r.q)}</td><td>${esc(rowNote(k,r))}</td></tr>`;
  }

  function tableShell(){
    return `<div class="resultTableWrap"><table class="resultTable"><thead><tr><th>番号</th><th>自分</th><th>正解</th><th>得点</th><th>判定</th><th>受験者正答率</th><th>注記</th></tr></thead><tbody></tbody></table></div>`;
  }

  function makePage(root){
    const page = document.createElement('div');
    page.className = 'pdfPage';
    page.innerHTML = '<div class="pdfContent"></div><div class="pdfFooter"></div>';
    root.appendChild(page);
    return { page, content: page.querySelector('.pdfContent'), footer: page.querySelector('.pdfFooter') };
  }

  function isOverflow(content){
    return content.scrollHeight > content.clientHeight + 1;
  }

  function buildMeasuredPages(data){
    ensureStyle();
    const old = document.getElementById('ctPdfMeasureRootV155');
    if(old) old.remove();
    const root = document.createElement('div');
    root.id = 'ctPdfMeasureRootV155';
    root.className = 'ctPdfRoot';
    document.body.appendChild(root);

    const k = data.k;
    const rows = data.rows || [];
    const stamp = `<div class="pdfPrintHeader"><div></div><div class="pdfPrintStamp">出力日時<br><b>${esc(dateText(new Date()))}</b></div></div>`;
    const firstTop = stamp + resultActionBar(k) + resultSummary(k,data.disp,data.mx,data.rate,data.missing) + sectionPanel(rows);
    const missed = missedPanel(rows,k);

    const pages = [];
    let cur = makePage(root);
    pages.push(cur);
    cur.content.insertAdjacentHTML('beforeend', firstTop + tableShell());
    let tbody = cur.content.querySelector('tbody');

    for (const r of rows) {
      tbody.insertAdjacentHTML('beforeend', tableRowHtml(r,k));
      if (isOverflow(cur.content)) {
        tbody.lastElementChild.remove();
        cur = makePage(root);
        pages.push(cur);
        cur.content.insertAdjacentHTML('beforeend', `<div class="pdfContinueTitle">全問一覧（続き）</div>${tableShell()}`);
        tbody = cur.content.querySelector('tbody');
        tbody.insertAdjacentHTML('beforeend', tableRowHtml(r,k));
      }
    }

    cur.content.insertAdjacentHTML('beforeend', missed);
    if (isOverflow(cur.content)) {
      const maybe = cur.content.lastElementChild;
      if (maybe) maybe.remove();
      cur = makePage(root);
      pages.push(cur);
      cur.content.insertAdjacentHTML('beforeend', `<div class="pdfContinueTitle">間違えた問題・未入力</div>${missed}`);
    }

    pages.forEach((p,i) => { p.footer.textContent = `${i+1} / ${pages.length}`; });
    return {root, pageEls: pages.map(p => p.page)};
  }

  function xmlEscapeStyle(s){
    return String(s).replace(/]]>/g, ']]]]><![CDATA[>');
  }

  function blobToArrayBuffer(blob){
    return new Promise((resolve,reject)=>{
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = () => reject(fr.error || new Error('FileReader failed'));
      fr.readAsArrayBuffer(blob);
    });
  }

  function loadImage(src){
    return new Promise((resolve,reject)=>{
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('PDFページ画像の生成に失敗しました。'));
      img.src = src;
    });
  }

  async function pageToJpeg(pageEl){
    const css = (document.querySelector('style') ? document.querySelector('style').textContent : '') + '\n' + v155Css();
    const html = pageEl.outerHTML;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${A4_CSS_W}" height="${A4_CSS_H}" viewBox="0 0 ${A4_CSS_W} ${A4_CSS_H}"><foreignObject x="0" y="0" width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml"><style><![CDATA[${xmlEscapeStyle(css)}]]></style><div class="ctPdfRoot" style="position:static;left:auto;top:auto;width:210mm;">${html}</div></div></foreignObject></svg>`;
    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    const img = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(A4_CSS_W * RENDER_SCALE);
    canvas.height = Math.round(A4_CSS_H * RENDER_SCALE);
    const ctx = canvas.getContext('2d', {alpha:false});
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(img,0,0,canvas.width,canvas.height);
    const blob = await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Canvas export failed')), 'image/jpeg', 0.94));
    return {bytes:new Uint8Array(await blobToArrayBuffer(blob)), width:canvas.width, height:canvas.height};
  }

  function ascii(s){ return new TextEncoder().encode(s); }

  function buildPdf(images){
    const parts = [];
    const offsets = [0];
    let pos = 0;
    function write(part){
      if (typeof part === 'string') part = ascii(part);
      parts.push(part);
      pos += part.length;
    }
    function obj(id, bodyParts){
      offsets[id] = pos;
      write(id + ' 0 obj\n');
      for (const p of bodyParts) write(p);
      write('\nendobj\n');
    }

    write('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    const pageIds = images.map((_,i)=>3+i*3);
    const contentIds = images.map((_,i)=>4+i*3);
    const imageIds = images.map((_,i)=>5+i*3);

    obj(1,[`<< /Type /Catalog /Pages 2 0 R >>`]);
    obj(2,[`<< /Type /Pages /Kids [${pageIds.map(id=>id+' 0 R').join(' ')}] /Count ${images.length} >>`]);

    images.forEach((im,i)=>{
      const pageId = pageIds[i], contentId = contentIds[i], imageId = imageIds[i], name = 'Im' + (i+1);
      const content = `q\n${A4_PT_W.toFixed(2)} 0 0 ${A4_PT_H.toFixed(2)} 0 0 cm\n/${name} Do\nQ\n`;
      obj(pageId,[`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4_PT_W.toFixed(2)} ${A4_PT_H.toFixed(2)}] /Resources << /XObject << /${name} ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`]);
      obj(contentId,[`<< /Length ${ascii(content).length} >>\nstream\n${content}endstream`]);
      obj(imageId,[`<< /Type /XObject /Subtype /Image /Width ${im.width} /Height ${im.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${im.bytes.length} >>\nstream\n`, im.bytes, `\nendstream`]);
    });

    const xref = pos;
    write(`xref\n0 ${offsets.length}\n`);
    write('0000000000 65535 f \n');
    for(let i=1;i<offsets.length;i++) write(String(offsets[i]).padStart(10,'0') + ' 00000 n \n');
    write(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
    return new Blob(parts,{type:'application/pdf'});
  }

  function fileName(data){
    const k = data && data.k || {};
    const safe = s => String(s||'').replace(/[\\/:*?"<>|\s]+/g,'_').replace(/^_+|_+$/g,'');
    return `採点結果_${safe(k.year)}_${safe(k.subject)}_${Date.now()}.pdf`;
  }

  async function exportRasterPdf(){
    if(!window.__lastGrade || window.__lastGrade.sig !== selId()) grade();
    const data = window.__lastGrade;
    if(!data){ alert('先に採点してください。'); return; }
    const btn = document.getElementById('exportPdfResult') || document.getElementById('exportPdf');
    const oldText = btn ? btn.textContent : '';
    try{
      if(btn){ btn.disabled = true; btn.textContent = 'PDF生成中…'; }
      const built = buildMeasuredPages(data);
      await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
      const imgs = [];
      for(const page of built.pageEls) imgs.push(await pageToJpeg(page));
      built.root.remove();
      const pdf = buildPdf(imgs);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(pdf);
      a.download = fileName(data);
      document.body.appendChild(a);
      a.click();
      setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 30000);
    }catch(err){
      console.error(err);
      alert('PDF生成に失敗しました: ' + (err && err.message ? err.message : err));
    }finally{
      if(btn){ btn.disabled = false; btn.textContent = oldText || 'PDF出力（A4）'; }
    }
  }

  window.exportResultPdf = exportRasterPdf;
})();
