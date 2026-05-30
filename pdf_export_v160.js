(function(){
  'use strict';

  const VERSION = 'v164-manual-canvas-direct';
  const PAGE_W = 1240;
  const PAGE_H = 1754;
  const M_LEFT = 58;
  const M_RIGHT = 58;
  const M_TOP = 58;
  const FOOTER_Y = PAGE_H - 30;
  const CONTENT_BOTTOM = PAGE_H - 74;
  const LINE = '#d9deea';
  const TEXT = '#1d2433';
  const MUTED = '#647086';
  const BLUE = '#2f5fd0';
  const GOOD = '#137333';
  const BAD = '#b3261e';
  const WARN = '#8a5b00';

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
    canvas.width = PAGE_W; canvas.height = PAGE_H;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0,0,PAGE_W,PAGE_H);
    ctx.imageSmoothingEnabled = true;
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
      {label:'得点率', value: Math.round((data.rate||0)*10)/10 + '%'},
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
    return [displayId(r.q), (r.got || []).join('') || '未入力', expText(r.q), r.included ? (r.earn + ' / ' + r.pts) : '対象外', judge, statRate(data, r.q), rowNote(data, r) || '—'];
  }

  function drawHeader(ctx, data, y){
    const id = getIdentity(data);
    line(ctx, M_LEFT, y-12, PAGE_W-M_RIGHT, y-12, LINE, 1);
    setFont(ctx, 14, '900', MUTED); ctx.fillText('採点結果', M_LEFT, y);
    setFont(ctx, 14, '700', '#344054'); ctx.fillText('出力日時', PAGE_W-M_RIGHT-90, y-28);
    const dt = dateText(new Date()); ctx.fillText(dt, PAGE_W-M_RIGHT-116, y-8);
    y += 28;
    const title = id.examLine || '採点結果';
    const titleH = drawWrapped(ctx, title, M_LEFT, y, PAGE_W-M_LEFT-M_RIGHT-210, 34, '900', TEXT, 39, 2);
    y += titleH;
    drawWrapped(ctx, id.subject, M_LEFT, y, PAGE_W-M_LEFT-M_RIGHT, 32, '900', TEXT, 37, 1);
    return y + 48;
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
    const x = M_LEFT, w = PAGE_W-M_LEFT-M_RIGHT, h = 385;
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
    stats.forEach((s,i)=>{ const a=-Math.PI/2+Math.PI*2*i/n; const rate=s.max?Math.max(0,Math.min(1,s.earn/s.max)):0; const px=cx+Math.cos(a)*r*rate, py=cy+Math.sin(a)*r*rate; if(i) ctx.lineTo(px,py); else ctx.moveTo(px,py); });
    ctx.closePath(); ctx.fillStyle='rgba(47,95,208,.20)'; ctx.fill(); ctx.strokeStyle=BLUE; ctx.lineWidth=3; ctx.stroke();
    stats.forEach((s,i)=>{ const a=-Math.PI/2+Math.PI*2*i/n; const rate=s.max?Math.max(0,Math.min(1,s.earn/s.max)):0; const px=cx+Math.cos(a)*r*rate, py=cy+Math.sin(a)*r*rate; ctx.beginPath(); ctx.arc(px,py,5,0,Math.PI*2); ctx.fillStyle=BLUE; ctx.fill(); });
    ctx.restore();

    const tx = x + 485, ty = y + 80;
    const cols = [150,150,120,120,70];
    const headers = ['問題番号','得点','得点率','正答項目','未入力'];
    drawTableHeader(ctx, tx, ty, cols, headers, 26, 13);
    let yy = ty + 26;
    stats.forEach(s=>{
      const row = [s.group, (Math.round(s.earn*10)/10)+' / '+s.max, s.max?Math.round(s.earn/s.max*1000)/10+'%':'0%', s.correct+' / '+s.items, String(s.missing)];
      drawSimpleRow(ctx, tx, yy, cols, row, 31, 15);
      yy += 31;
    });
    return y + h + 18;
  }

  function drawTableHeader(ctx, x, y, cols, headers, h, fs){
    ctx.fillStyle = '#f7f8fc'; ctx.fillRect(x, y, cols.reduce((a,b)=>a+b,0), h);
    let xx=x; setFont(ctx, fs||13, '900', '#4a556b');
    headers.forEach((head,i)=>{ ctx.fillText(head, xx+8, y+7); xx+=cols[i]; });
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
    cells.forEach((c,i)=>{ const h = textHeight(ctx, c, cols[i]-16, i===4?20:14, i===4?20:18, i===6?3:2) + 12; if(h>max) max=h; });
    return Math.min(Math.max(max, 30), 76);
  }
  function drawResultTableHeader(ctx, y, continued){
    if(continued){ drawWrapped(ctx, '全問一覧（続き）', M_LEFT, y, 360, 20, '900', TEXT, 26, 1); y += 34; }
    const cols=[150,100,240,95,70,126,PAGE_W-M_LEFT-M_RIGHT-150-100-240-95-70-126];
    drawTableHeader(ctx, M_LEFT, y, cols, ['番号','自分','正解','得点','判定','受験者正答率','注記'], 30, 13);
    return {y:y+30, cols};
  }
  function drawResultRow(ctx, y, cols, cells, h){
    let x=M_LEFT;
    cells.forEach((cell,i)=>{
      const color = i===4 ? (cell==='○'?GOOD:(cell==='△'?WARN:(cell==='×'?BAD:MUTED))) : (i===6?MUTED:TEXT);
      const size = i===4 ? 22 : (i===6?13:14);
      const weight = i===4 ? '900' : '500';
      const lh = i===4 ? 20 : (i===6?17:18);
      const mx = i===6 ? 3 : 2;
      if(i===4){ setFont(ctx, size, weight, color); const tw=ctx.measureText(cell).width; ctx.fillText(cell, x + (cols[i]-tw)/2, y+6); }
      else drawWrapped(ctx, cell, x+8, y+6, cols[i]-16, size, weight, color, lh, mx);
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
        }, 'image/jpeg', 0.88);
      }else{
        try{
          const dataUrl = canvas.toDataURL('image/jpeg',0.88);
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
      add('<< /Type /XObject /Subtype /Image /Width '+PAGE_W+' /Height '+PAGE_H+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+jpegs[i].length+' >>\nstream\n');
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
      alert('このブラウザでは直接PDF保存が制限されました。印刷画面から「PDFとして保存」を選んでください。\n' + (reason && reason.message ? reason.message : reason || ''));
      if(window.exportResultPdf && window.exportResultPdf !== exportResultPdfManual) return;
      window.print();
    }catch(e){ alert('PDF出力に失敗しました: '+(e&&e.message?e.message:e)); }
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
      const url = URL.createObjectURL(pdf);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.rel = 'noopener';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(url), 30000);
    }catch(err){
      console.error(err);
      showPrintFallback(err);
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
