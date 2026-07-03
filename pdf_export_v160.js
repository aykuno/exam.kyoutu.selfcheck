/* v183 DOM-based PDF exporter restore
 * - Adds PDF output button after grading even when index.html is loaded from the base snapshot.
 * - Builds the PDF from the visible score result, so it does not depend on patched __lastGrade.
 * - Safari delivery uses data:application/pdf;base64 modal link.
 */
(function(){
  'use strict';

  const VERSION = 'v183-dom-pdf-restore';
  const PAGE_W = 1240;
  const PAGE_H = 1754;
  const RENDER_SCALE = 2.33;
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
  function pad(n){ return String(n).padStart(2, '0'); }
  function dateText(d){ return d.getFullYear() + '/' + pad(d.getMonth()+1) + '/' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function fileStamp(d){ return d.getFullYear() + pad(d.getMonth()+1) + pad(d.getDate()) + '_' + pad(d.getHours()) + pad(d.getMinutes()); }
  function escFile(s){ return String(s == null ? '' : s).replace(/[\\/:*?"<>|\s]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 70) || 'result'; }
  function sleepFrame(){ return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); }

  function injectStyles(){
    if($('__ctPdfRestoreStyle')) return;
    const style = document.createElement('style');
    style.id = '__ctPdfRestoreStyle';
    style.textContent = [
      '.resultActionBar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:16px 0 12px;padding:14px;border:1px solid #dfe7fb;background:#fbfcff;border-radius:16px}',
      '.resultActionLabel{font-size:13px;font-weight:900;color:#647086;margin-bottom:3px}',
      '.resultActionIdentity{font-size:22px;font-weight:900;line-height:1.22}',
      '.resultExamLine,.resultSubjectLine{display:block}',
      '.pdfBtn{background:#2f5fd0!important;color:#fff!important}',
      '.pdfBtn:disabled{opacity:.55}',
      '.missedPanel{margin:16px 0 0;border:1px solid #f0c7c1;background:#fff7f6;border-radius:16px;padding:12px}',
      '.missedPanel h3{margin:0 0 8px;color:#8c1d18}',
      '.missedList{display:flex;flex-wrap:wrap;gap:8px}',
      '.missedItem{background:#fff;border:1px solid #f0d0cb;border-radius:12px;padding:7px 9px;font-size:13px}',
      '.missedItem b{font-weight:900}',
      '.judgeNg{color:#b3261e;font-weight:900}',
      '.judgePartial{color:#8a5b00;font-weight:900}',
      '.missedOk{margin:16px 0 0;border:1px solid #cfe8d4;background:#f3faf5;border-radius:14px;padding:10px;font-weight:800;color:#137333}',
      '@media(max-width:560px){.resultActionBar{align-items:stretch;flex-direction:column}.resultActionIdentity{font-size:20px}.pdfBtn{width:100%}}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function getIdentity(){
    const year = $('year') ? $('year').value : '';
    const examSelect = $('exam');
    const examText = examSelect ? txt(examSelect.selectedOptions && examSelect.selectedOptions[0] ? examSelect.selectedOptions[0] : examSelect) : '';
    const subject = $('subject') ? $('subject').value : '';
    const examLine = (year ? year + '年度 ' : '') + examText;
    return {examLine: examLine || '採点結果', subject: subject || '', summaryMeta: examLine || ''};
  }

  function parseTableRows(){
    const table = document.querySelector('#result .resultTable');
    if(!table || !table.tBodies.length) return [];
    return Array.from(table.tBodies[0].rows).map(tr => {
      const c = Array.from(tr.cells).map(td => txt(td));
      const score = c[3] || '';
      const m = score.match(/([\d.]+)\s*\/\s*([\d.]+)/);
      return {
        no: c[0] || '',
        self: c[1] || '',
        correct: c[2] || '',
        score: score,
        judge: c[4] || '',
        rate: c[5] || '',
        note: c[6] || '',
        earn: m ? Number(m[1]) : 0,
        pts: m ? Number(m[2]) : 0,
        included: !/対象外/.test(score + ' ' + (c[4] || ''))
      };
    });
  }

  function parseSectionStats(){
    const rows = Array.from(document.querySelectorAll('#result .sectionStats tbody tr'));
    return rows.map(tr => {
      const c = Array.from(tr.cells).map(td => txt(td));
      const m = (c[1] || '').match(/([\d.]+)\s*\/\s*([\d.]+)/);
      const cm = (c[3] || '').match(/(\d+)\s*\/\s*(\d+)/);
      return {
        group: c[0] || '',
        earn: m ? Number(m[1]) : 0,
        max: m ? Number(m[2]) : 0,
        correct: cm ? Number(cm[1]) : 0,
        items: cm ? Number(cm[2]) : 0,
        missing: Number((c[4] || '0').replace(/[^\d.]/g, '')) || 0
      };
    }).filter(s => s.group);
  }

  function summaryStats(){
    const metrics = Array.from(document.querySelectorAll('#result .metric'));
    const out = metrics.slice(0, 4).map(m => ({label: txt(m.querySelector('span')), value: txt(m.querySelector('b'))}));
    return out.length ? out : [
      {label:'点数', value:'—'},
      {label:'正答項目数', value:'—'},
      {label:'得点率', value:'—'},
      {label:'未入力', value:'—'}
    ];
  }

  function missedRows(rows){
    return rows.filter(r => r.included && (r.self === '未入力' || (r.judge && !/○|対象外/.test(r.judge))));
  }

  function ensureMissedPanel(){
    const result = $('result');
    if(!result || !result.querySelector('.resultTable') || result.querySelector('.missedPanel,.missedOk')) return;
    const rows = parseTableRows();
    const bad = missedRows(rows);
    if(!bad.length){
      const ok = document.createElement('div');
      ok.className = 'missedOk';
      ok.textContent = '間違えた問題・未入力はありません。';
      result.appendChild(ok);
      return;
    }
    const panel = document.createElement('div');
    panel.className = 'missedPanel';
    const list = bad.map(r => {
      const judge = r.self === '未入力' ? '未入力' : (r.judge || '×');
      const cls = judge === '△' ? 'judgePartial' : 'judgeNg';
      return '<div class="missedItem"><b>' + escapeHtml(r.no) + '</b> <span class="' + cls + '">' + escapeHtml(judge) + '</span><br>自分：' + escapeHtml(r.self || '未入力') + ' / 正解：' + escapeHtml(r.correct) + '<br>得点：' + escapeHtml(r.score) + '</div>';
    }).join('');
    panel.innerHTML = '<h3>間違えた問題・未入力</h3><div class="missedList">' + list + '</div>';
    result.appendChild(panel);
  }

  function escapeHtml(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  }

  function ensureButton(){
    injectStyles();
    const result = $('result');
    if(!result || !result.querySelector('.resultTable')) return;
    const id = getIdentity();
    let bar = result.querySelector('.resultActionBar');
    if(!bar){
      bar = document.createElement('div');
      bar.className = 'resultActionBar';
      result.insertBefore(bar, result.firstChild);
    }
    bar.innerHTML = '<div><div class="resultActionLabel">採点結果</div><div class="resultActionIdentity"><span class="resultExamLine">' + escapeHtml(id.examLine) + '</span><span class="resultSubjectLine">' + escapeHtml(id.subject) + '</span></div></div><button id="exportPdfResult" class="pdfBtn" type="button">PDF出力（A4）</button>';
    ensureMissedPanel();
  }

  function canvasFont(size, weight){ return (weight ? weight + ' ' : '') + size + 'px -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,"Hiragino Sans","Yu Gothic",Meiryo,sans-serif'; }
  function setFont(ctx, size, weight, color){ ctx.font = canvasFont(size, weight); ctx.fillStyle = color || TEXT; ctx.textBaseline = 'top'; }
  function line(ctx, x1, y1, x2, y2, color, width){ ctx.beginPath(); ctx.strokeStyle = color || LINE; ctx.lineWidth = width || 1; ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); }
  function rr(ctx, x, y, w, h, r){
    const m = Math.min(r, w/2, h/2);
    ctx.beginPath();
    ctx.moveTo(x+m, y); ctx.lineTo(x+w-m, y); ctx.quadraticCurveTo(x+w, y, x+w, y+m);
    ctx.lineTo(x+w, y+h-m); ctx.quadraticCurveTo(x+w, y+h, x+w-m, y+h);
    ctx.lineTo(x+m, y+h); ctx.quadraticCurveTo(x, y+h, x, y+h-m);
    ctx.lineTo(x, y+m); ctx.quadraticCurveTo(x, y, x+m, y);
    ctx.closePath();
  }
  function fillRound(ctx, x, y, w, h, r, fill, stroke){ rr(ctx,x,y,w,h,r); if(fill){ ctx.fillStyle=fill; ctx.fill(); } if(stroke){ ctx.strokeStyle=stroke; ctx.lineWidth=1; ctx.stroke(); } }
  function wrapText(ctx, text, maxWidth){
    text = String(text == null ? '' : text);
    if(!text) return [''];
    const out = [];
    for(const part of text.split(/\n/)){
      let lineText = '';
      for(const ch of Array.from(part)){
        const test = lineText + ch;
        if(lineText && ctx.measureText(test).width > maxWidth){ out.push(lineText); lineText = ch; }
        else lineText = test;
      }
      out.push(lineText);
    }
    return out;
  }
  function drawWrapped(ctx, text, x, y, maxWidth, size, weight, color, lineHeight, maxLines){
    setFont(ctx, size, weight, color);
    const lines = wrapText(ctx, text, maxWidth);
    const lh = lineHeight || Math.round(size * 1.28);
    const use = maxLines ? lines.slice(0, maxLines) : lines;
    use.forEach((l,i) => ctx.fillText(l, x, y + i*lh));
    return use.length * lh;
  }
  function textHeight(ctx, text, maxWidth, size, lineHeight, maxLines){
    setFont(ctx, size, '400', TEXT);
    const lines = wrapText(ctx, text, maxWidth);
    const lh = lineHeight || Math.round(size * 1.28);
    return (maxLines ? Math.min(lines.length, maxLines) : lines.length) * lh;
  }
  function drawFittedLine(ctx, text, x, y, maxWidth, maxSize, minSize, weight, color){
    text = String(text == null ? '' : text).replace(/\s+/g, ' ').trim();
    let size = maxSize;
    while(size > minSize){ setFont(ctx, size, weight, color); if(ctx.measureText(text).width <= maxWidth) break; size -= 1; }
    setFont(ctx, size, weight, color);
    ctx.fillText(text, x, y);
    return Math.round(size * 1.22);
  }

  function makePage(){
    const canvas = document.createElement('canvas');
    canvas.width = RASTER_W;
    canvas.height = RASTER_H;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(RENDER_SCALE,0,0,RENDER_SCALE,0,0);
    ctx.fillStyle = '#fff'; ctx.fillRect(0,0,PAGE_W,PAGE_H);
    ctx.imageSmoothingEnabled = true;
    if('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'high';
    return {canvas, ctx, y:M_TOP};
  }
  function addPage(pages){ const p = makePage(); pages.push(p); return p; }
  function drawFooter(pages){
    pages.forEach((p,i) => {
      const s = (i+1) + ' / ' + pages.length;
      setFont(p.ctx, 15, '600', '#344054');
      const w = p.ctx.measureText(s).width;
      p.ctx.fillText(s, (PAGE_W-w)/2, FOOTER_Y);
    });
  }

  function drawHeader(ctx, id, y){
    line(ctx, M_LEFT, y-12, PAGE_W-M_RIGHT, y-12, LINE, 1);
    setFont(ctx, 14, '900', MUTED); ctx.fillText('採点結果', M_LEFT, y);
    setFont(ctx, 14, '700', '#344054'); ctx.fillText('出力日時', PAGE_W-M_RIGHT-90, y-28);
    const dt = dateText(new Date()); ctx.fillText(dt, PAGE_W-M_RIGHT-116, y-8);
    y += 28;
    y += drawFittedLine(ctx, id.examLine || '採点結果', M_LEFT, y, PAGE_W-M_LEFT-M_RIGHT, 34, 24, '900', TEXT) + 2;
    y += drawFittedLine(ctx, id.subject || '', M_LEFT, y, PAGE_W-M_LEFT-M_RIGHT, 32, 24, '900', TEXT) + 38;
    return y;
  }

  function drawSummary(ctx, id, y){
    const stats = summaryStats();
    const x = M_LEFT, w = PAGE_W-M_LEFT-M_RIGHT, h = 96;
    fillRound(ctx, x, y, w, h, 18, '#fbfcff', '#dfe7fb');
    drawWrapped(ctx, id.subject, x+18, y+18, 255, 22, '900', TEXT, 27, 2);
    drawWrapped(ctx, id.summaryMeta, x+18, y+52, 260, 14, '800', '#5b6475', 18, 2);
    const sx = x+290, gap=10, sw=(w-310 - gap*3)/4;
    stats.slice(0,4).forEach((s,i) => {
      const bx = sx + i*(sw+gap);
      fillRound(ctx, bx, y+14, sw, h-28, 12, '#fff', '#e1e7f5');
      drawWrapped(ctx, s.label, bx+12, y+24, sw-24, 13, '900', MUTED, 18, 2);
      drawWrapped(ctx, s.value, bx+12, y+56, sw-24, 22, '900', TEXT, 27, 2);
    });
    return y + h + 18;
  }

  function drawTableHeader(ctx, x, y, cols, headers, h, fs){
    ctx.fillStyle = '#f7f8fc'; ctx.fillRect(x, y, cols.reduce((a,b)=>a+b,0), h);
    let xx = x; setFont(ctx, fs || 13, '900', '#4a556b');
    headers.forEach((head,i) => {
      if(head === '判定'){
        ctx.save(); ctx.textAlign = 'center'; ctx.fillText(head, xx + cols[i]/2, y+7); ctx.restore();
      }else ctx.fillText(head, xx+8, y+7);
      xx += cols[i];
    });
    line(ctx, x, y+h, x+cols.reduce((a,b)=>a+b,0), y+h, LINE, 1);
  }
  function drawSimpleRow(ctx, x, y, cols, row, h, fs){
    let xx = x;
    row.forEach((cell,i) => { drawWrapped(ctx, cell, xx+8, y+6, cols[i]-16, fs || 14, '500', TEXT, 18, 1); xx += cols[i]; });
    line(ctx, x, y+h, x+cols.reduce((a,b)=>a+b,0), y+h, LINE, 1);
  }

  function drawRadarPanel(ctx, y){
    const stats = parseSectionStats();
    if(!stats.length) return y;
    const x = M_LEFT, w = PAGE_W-M_LEFT-M_RIGHT, h = 435;
    fillRound(ctx, x, y, w, h, 18, '#fbfcff', LINE);
    drawWrapped(ctx, '問題番号別正答率', x+16, y+16, 350, 21, '900', TEXT, 26, 1);
    const cx = x + 215, cy = y + 210, r = 142, n = stats.length;
    for(const frac of [0.25,0.5,0.75,1]){
      ctx.beginPath();
      stats.forEach((s,i) => { const a=-Math.PI/2+Math.PI*2*i/n; const px=cx+Math.cos(a)*r*frac, py=cy+Math.sin(a)*r*frac; if(i) ctx.lineTo(px,py); else ctx.moveTo(px,py); });
      ctx.closePath(); ctx.strokeStyle = '#d9deea'; ctx.lineWidth = 1; ctx.stroke();
    }
    stats.forEach((s,i) => { const a=-Math.PI/2+Math.PI*2*i/n; const px=cx+Math.cos(a)*r, py=cy+Math.sin(a)*r; line(ctx,cx,cy,px,py,'#cbd3e3',1); const lx=cx+Math.cos(a)*(r+34), ly=cy+Math.sin(a)*(r+34); setFont(ctx, 13, '700', '#344054'); const tw=ctx.measureText(s.group).width; ctx.fillText(s.group,lx-tw/2,ly-8); });
    ctx.beginPath();
    stats.forEach((s,i) => { const a=-Math.PI/2+Math.PI*2*i/n; const rate=s.max?Math.max(0,Math.min(1,s.earn/s.max)):0; const px=cx+Math.cos(a)*r*rate, py=cy+Math.sin(a)*r*rate; if(i) ctx.lineTo(px,py); else ctx.moveTo(px,py); });
    ctx.closePath(); ctx.fillStyle='rgba(47,95,208,.20)'; ctx.fill(); ctx.strokeStyle=BLUE; ctx.lineWidth=3; ctx.stroke();
    stats.forEach((s,i) => { const a=-Math.PI/2+Math.PI*2*i/n; const rate=s.max?Math.max(0,Math.min(1,s.earn/s.max)):0; const px=cx+Math.cos(a)*r*rate, py=cy+Math.sin(a)*r*rate; ctx.beginPath(); ctx.arc(px,py,5,0,Math.PI*2); ctx.fillStyle=BLUE; ctx.fill(); });
    const tx = x + 485, ty = y + 80;
    const cols = [150,150,120,120,70];
    drawTableHeader(ctx, tx, ty, cols, ['問題番号','得点','得点率','正答項目','未入力'], 26, 13);
    let yy = ty + 26;
    stats.forEach(s => {
      const row = [s.group, (Math.round(s.earn*10)/10)+' / '+s.max, s.max?Math.round(s.earn/s.max*1000)/10+'%':'0%', s.correct+' / '+s.items, String(s.missing)];
      drawSimpleRow(ctx, tx, yy, cols, row, 31, 15); yy += 31;
    });
    return y + h + 20;
  }

  function resultCols(){ return [215,110,250,95,70,115,PAGE_W-M_LEFT-M_RIGHT-215-110-250-95-70-115]; }
  function drawResultTableHeader(ctx, y, continued){
    if(continued){ drawWrapped(ctx, '全問一覧（続き）', M_LEFT, y, 360, 20, '900', TEXT, 26, 1); y += 34; }
    const cols = resultCols();
    drawTableHeader(ctx, M_LEFT, y, cols, ['番号','自分','正解','得点','判定','受験者正答率','注記'], 30, 13);
    return {y:y+30, cols};
  }
  function rowHeight(ctx, cells, cols){
    let max = 30;
    cells.forEach((c,i) => { const maxLines = i===0 ? 1 : (i===6 ? 3 : 2); const h = textHeight(ctx, c, cols[i]-16, i===4?20:14, i===4?20:18, maxLines) + 12; if(h>max) max=h; });
    return Math.min(Math.max(max, 30), 76);
  }
  function drawResultRow(ctx, y, cols, cells, h){
    let x = M_LEFT;
    cells.forEach((cell,i) => {
      const color = i===4 ? (cell==='○'?GOOD:(cell==='△'?WARN:(cell==='×'?BAD:MUTED))) : (i===6?MUTED:TEXT);
      const size = i===4 ? 22 : (i===6?13:14);
      const weight = i===4 ? '900' : '500';
      const lh = i===4 ? 20 : (i===6?17:18);
      const mx = i===6 ? 3 : 2;
      if(i===4){ setFont(ctx, size, weight, color); ctx.save(); ctx.textAlign='center'; ctx.textBaseline='alphabetic'; ctx.fillText(cell, x+cols[i]/2, y+Math.max(21, Math.round((h+size*0.72)/2))); ctx.restore(); }
      else drawWrapped(ctx, cell, x+8, y+6, cols[i]-16, size, weight, color, lh, i===0?1:mx);
      x += cols[i];
    });
    line(ctx, M_LEFT, y+h, PAGE_W-M_RIGHT, y+h, LINE, 1);
  }

  function drawMissedPanel(pages, rows){
    const bad = missedRows(rows);
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
    bad.forEach((r,idx) => {
      if(y + cardH > p.y + panelH - 8) return;
      fillRound(ctx, x, y, cardW, cardH, 10, '#fff', '#f0d0cb');
      const judge = r.self === '未入力' ? '未入力' : (r.judge || '×');
      drawWrapped(ctx, r.no + ' ' + judge, x+8, y+7, cardW-16, 13, '900', judge==='△'?WARN:BAD, 17, 1);
      drawWrapped(ctx, '自分：'+(r.self||'未入力')+' / 正解：'+r.correct, x+8, y+25, cardW-16, 11, '600', TEXT, 14, 1);
      drawWrapped(ctx, '得点：'+r.score, x+8, y+39, cardW-16, 11, '600', TEXT, 14, 1);
      x += cardW + gap;
      if((idx+1)%cardsPerRow===0){ x = panelX+16; y += cardH+gap; }
    });
    p.y += panelH + 18;
  }

  function buildCanvases(){
    const rows = parseTableRows();
    if(!rows.length) throw new Error('全問正誤表が見つかりません。先に採点してください。');
    const id = getIdentity();
    const pages = [];
    let p = addPage(pages), ctx = p.ctx;
    p.y = drawHeader(ctx, id, p.y);
    p.y = drawSummary(ctx, id, p.y);
    p.y = drawRadarPanel(ctx, p.y);
    let th = drawResultTableHeader(ctx, p.y, false); p.y = th.y; let cols = th.cols;
    rows.forEach(r => {
      const cells = [r.no, r.self || '未入力', r.correct, r.score, r.judge, r.rate, r.note || '—'];
      const h = rowHeight(ctx, cells, cols);
      if(p.y + h > CONTENT_BOTTOM){ p = addPage(pages); ctx = p.ctx; th = drawResultTableHeader(ctx, M_TOP, true); p.y = th.y; cols = th.cols; }
      drawResultRow(ctx, p.y, cols, cells, h); p.y += h;
    });
    drawMissedPanel(pages, rows);
    drawFooter(pages);
    return pages.map(p => p.canvas);
  }

  function canvasToJpegBytes(canvas){
    return new Promise((resolve, reject) => {
      if(canvas.toBlob){
        canvas.toBlob(async blob => {
          try{
            if(!blob) throw new Error('canvas JPEG生成に失敗しました。');
            resolve(new Uint8Array(await blob.arrayBuffer()));
          }catch(e){ reject(e); }
        }, 'image/jpeg', JPEG_QUALITY);
      }else{
        try{
          const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
          const bin = atob(dataUrl.split(',')[1] || '');
          const bytes = new Uint8Array(bin.length);
          for(let i=0;i<bin.length;i++) bytes[i] = bin.charCodeAt(i);
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

  function isSafariOnly(){
    const ua = navigator.userAgent || '';
    const vendor = navigator.vendor || '';
    const isSafari = /Safari\//.test(ua) && /Apple/i.test(vendor || 'Apple');
    const isOther = /(Chrome|Chromium|CriOS|FxiOS|Firefox|EdgiOS|Edg\/|OPiOS|OPR\/|DuckDuckGo|Instagram|FBAN|FBAV|Line)/i.test(ua);
    return isSafari && !isOther;
  }
  function safeFilename(s){ let name = String(s || '採点結果.pdf').replace(/[\\/:*?"<>|]/g, '_').trim(); if(!name) name='採点結果.pdf'; if(!/\.pdf$/i.test(name)) name += '.pdf'; return name; }
  function arrayBufferToBase64(buffer){
    const bytes = new Uint8Array(buffer); let binary = ''; const chunkSize = 8192;
    for(let i=0;i<bytes.length;i+=chunkSize) binary += String.fromCharCode(...bytes.subarray(i, i+chunkSize));
    return btoa(binary);
  }
  function blobToDataUrl(blob){
    return new Promise((resolve, reject) => {
      if(typeof FileReader !== 'undefined'){
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(reader.error || new Error('PDFデータURLの作成に失敗しました。'));
        reader.readAsDataURL(blob);
        return;
      }
      if(blob && typeof blob.arrayBuffer === 'function'){
        blob.arrayBuffer().then(buffer => resolve('data:application/pdf;base64,' + arrayBufferToBase64(buffer))).catch(reject);
        return;
      }
      reject(new Error('このブラウザではPDFデータURLを作成できません。'));
    });
  }
  function showPdfDownloadModal(dataUri, filename){
    const old = $('pdf-dl-modal'); if(old) old.remove();
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
    guide.innerHTML = '下のボタンを押してダウンロードしてください。<br>Safari：長押し →「リンクをダウンロード」';
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = safeName;
    link.textContent = safeName + ' をダウンロード';
    link.style.cssText = 'display:block;background:#2563eb;color:white;border-radius:12px;padding:13px;font-weight:bold;font-size:14px;text-decoration:none;margin-bottom:12px;word-break:break-all;';
    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = '閉じる';
    close.style.cssText = 'background:#e5e7eb;border:none;border-radius:10px;padding:9px 24px;font-size:13px;font-weight:600;cursor:pointer;';
    close.addEventListener('click', () => overlay.remove());
    card.appendChild(title); card.appendChild(guide); card.appendChild(link); card.appendChild(close); overlay.appendChild(card); document.body.appendChild(overlay);
  }
  async function deliverPdf(pdf, filename){
    if(isSafariOnly()){
      const dataUri = await blobToDataUrl(pdf);
      if(!/^data:application\/pdf(?:;[^,]*)?;base64,/i.test(dataUri)) throw new Error('PDFのdata URI形式が不正です。');
      showPdfDownloadModal(dataUri, filename);
      return;
    }
    const url = URL.createObjectURL(pdf);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  async function exportResultPdf(){
    if(!$('result') || !document.querySelector('#result .resultTable')){
      if(typeof window.grade === 'function') window.grade();
      await sleepFrame();
    }
    ensureButton();
    const id = getIdentity();
    const filename = '採点結果_' + escFile((id.examLine ? id.examLine + '_' : '') + (id.subject || '')) + '_' + fileStamp(new Date()) + '.pdf';
    const btn = $('exportPdfResult');
    if(btn){ btn.disabled = true; btn.textContent = 'PDF作成中…'; }
    try{
      await sleepFrame();
      const canvases = buildCanvases();
      const jpegs = [];
      for(const c of canvases) jpegs.push(await canvasToJpegBytes(c));
      await deliverPdf(makePdfBlob(jpegs), filename);
    }catch(err){
      console.error(err);
      alert('PDF生成に失敗しました: ' + (err && err.message ? err.message : err));
    }finally{
      const b = $('exportPdfResult');
      if(b){ b.disabled = false; b.textContent = 'PDF出力（A4）'; }
    }
  }

  window.exportResultPdf = exportResultPdf;
  document.addEventListener('click', function(e){
    const btn = e.target && e.target.closest && e.target.closest('#exportPdfResult');
    if(!btn) return;
    e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation();
    exportResultPdf();
  }, true);

  function start(){
    injectStyles();
    ensureButton();
    const mo = new MutationObserver(() => ensureButton());
    mo.observe(document.body, {childList:true, subtree:true});
    setTimeout(ensureButton, 500);
    setInterval(ensureButton, 1500);
    console.info('PDF export renderer loaded: ' + VERSION);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
