'use strict';

/*
 * Main-site adapter for pdf-issue-trial v1.3.
 *
 * IMPORTANT BOUNDARY:
 * - BEFORE the user presses the PDF button, syncDataFromResult() converts the live result DOM
 *   into the same DATA shape used by pdf-issue-trial v1.3.
 * - AFTER the user presses the PDF button, the rendering / JPEG / PDF / delivery path below
 *   is the v1.3 path: buildSVG -> svgToJpegBytes -> makePdfBlob -> deliverPdf.
 *
 * No foreignObject. No data-URI PDF delivery. No print fallback.
 */

let DATA = null;
let ACTIVE_FILENAME = '採点結果.pdf';

const W = 1240;
const H = 1754;
const RENDER_SCALE = 2.33;
const RASTER_W = Math.round(W * RENDER_SCALE);
const RASTER_H = Math.round(H * RENDER_SCALE);
const JPEG_QUALITY = 0.97;

const xml = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
}[c]));

/* ---------------- PRE-CLICK ADAPTER ONLY ---------------- */

function textOf(el) {
  return (el && (el.innerText || el.textContent) || '').replace(/\s+/g, ' ').trim();
}

function pad(n) { return String(n).padStart(2, '0'); }
function fileStamp(d) {
  return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '_' + pad(d.getHours()) + pad(d.getMinutes());
}
function safeFile(s) {
  return String(s == null ? '' : s).replace(/[\\/:*?"<>|\s]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 70) || 'result';
}

function syncDataFromResult() {
  const result = document.getElementById('result');
  if (!result) return;
  const exportButton = result.querySelector('#exportPdfResult');
  const resultTable = result.querySelector('.resultTable');
  if (!exportButton || !resultTable) return;

  const title = textOf(result.querySelector('.resultExamLine')) || textOf(result.querySelector('.resultSummaryMeta')) || '採点結果';
  const subject = textOf(result.querySelector('.resultSubjectLine')) || textOf(result.querySelector('.resultSummarySubject')) || '';

  const summaryMap = new Map();
  result.querySelectorAll('.resultSummaryStat').forEach(el => {
    summaryMap.set(textOf(el.querySelector('span')), textOf(el.querySelector('b')));
  });

  const score = summaryMap.get('点数') || summaryMap.get('正解数') || '—';
  const rate = summaryMap.get('正答率') || '—';
  const correct = summaryMap.get('正答項目') || '—';
  const missing = summaryMap.get('未入力') || '—';

  const sections = [['問題番号', '得点', '正答率', '正答項目', '未入力']];
  result.querySelectorAll('.sectionStats tbody tr').forEach(tr => {
    const cells = Array.from(tr.cells).map(td => textOf(td));
    while (cells.length < 5) cells.push('');
    sections.push(cells.slice(0, 5));
  });

  const headers = Array.from(resultTable.querySelectorAll('thead th')).map(th => textOf(th));
  const rows = [headers];
  resultTable.querySelectorAll('tbody tr').forEach(tr => {
    const cells = Array.from(tr.cells).map(td => textOf(td));
    while (cells.length < 7) cells.push('');
    rows.push(cells.slice(0, 7));
  });

  DATA = { title, subject, score, rate, correct, missing, sections, rows };
  ACTIVE_FILENAME = '採点結果_' + safeFile((title ? title + '_' : '') + subject) + '_' + fileStamp(new Date()) + '.pdf';
}

const resultObserver = new MutationObserver(() => syncDataFromResult());
resultObserver.observe(document.documentElement, { childList: true, subtree: true });
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', syncDataFromResult, { once: true });
} else {
  syncDataFromResult();
}

/* ---------------- FROM HERE: v1.3 POST-CLICK PIPELINE ---------------- */

function buildSVG(data, index) {
  const p = [`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="1240" height="1754" fill="white"/>`];
  const text = (s, x, y, size = 18, color = '#1d2433', weight = 400, anchor = 'start') => p.push(`<text x="${x}" y="${y}" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Hiragino Sans,Yu Gothic,Meiryo,sans-serif" font-size="${size}" fill="${color}" font-weight="${weight}" text-anchor="${anchor}">${xml(s)}</text>`);
  const rect = (x, y, w, h, fill = '#fbfcff', stroke = '#d9deea', r = 0) => p.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}"/>`);
  const line = (x, y, x2, y2) => p.push(`<path d="M${x} ${y}L${x2} ${y2}" fill="none" stroke="#d9deea"/>`);

  let y;
  if (index === 0) {
    text('採点結果', 58, 62, 16, '#647086');
    text(data.title, 58, 108, 34, '#1d2433', 700);
    text(data.subject, 58, 150, 34, '#1d2433', 700);
    rect(58, 195, 1124, 110, '#fbfcff', '#dfe7fb', 16);
    text(data.subject, 78, 234, 23, '#1d2433', 700);
    text(data.title, 78, 271, 15);
    [['点数', data.score], ['正答率', data.rate], ['正答項目', data.correct], ['未入力', data.missing]].forEach(([label, value], i) => {
      const x = 354 + i * 200;
      rect(x, 210, 188, 80, '#fff', '#dfe7fb', 10);
      text(label, x + 12, 235, 14, '#647086');
      text(value, x + 12, 273, 25, '#1d2433', 700);
    });

    rect(58, 325, 1124, 310, '#fbfcff', '#d9deea', 16);
    text('問題番号別正答率', 78, 362, 23, '#1d2433', 700);
    const cx = 272, cy = 505, rad = 90, n = 5;
    const point = (i, r) => [cx + Math.cos(-Math.PI / 2 + i * Math.PI * 2 / n) * r, cy + Math.sin(-Math.PI / 2 + i * Math.PI * 2 / n) * r];
    for (let k = 1; k <= 4; k++) {
      p.push(`<polygon points="${Array.from({ length: n }, (_, i) => point(i, rad * k / 4).join(',')).join(' ')}" fill="none" stroke="#d9deea"/>`);
    }
    for (let i = 0; i < n; i++) {
      const a = point(i, rad);
      line(cx, cy, ...a);
      const b = point(i, rad + 24);
      text('第' + (i + 1) + '問', b[0], b[1] + 6, 15, '#1d2433', 600, 'middle');
    }
    p.push(`<circle cx="${cx}" cy="${cy}" r="5" fill="#2f5fd0"/>`);
    data.sections.forEach((row, i) => {
      row.forEach((c, j) => text(c, 500 + j * 126, 400 + i * 35, i ? 17 : 15));
      line(494, 410 + i * 35, 1160, 410 + i * 35);
    });
    y = 671;
  } else {
    text('全問一覧（続き）', 58, 67, 23, '#1d2433', 700);
    y = 98;
  }

  const widths = [205, 110, 205, 80, 100, 130, 194];
  const xs = [58];
  widths.forEach((w, i) => xs.push(xs[i] + w));
  rect(58, y, 1124, 32, '#f7f8fc', '#f7f8fc');
  data.rows[0].forEach((s, i) => text(s, xs[i] + 8, y + 23, 16, '#4a556b', 600));
  y += 32;

  const rows = data.rows.slice(index === 0 ? 1 : 23, index === 0 ? 23 : undefined);
  rows.forEach(row => {
    row.forEach((s, i) => {
      if (i === 6 && s.length > 24) {
        const chars = Array.from(s);
        text(chars.slice(0, 22).join(''), xs[i] + 8, y + 19, 11, '#647086');
        text(chars.slice(22).join(''), xs[i] + 8, y + 33, 11, '#647086');
      } else {
        text(s, i === 3 || i === 4 ? xs[i] + widths[i] / 2 : xs[i] + 8, y + 27, i === 3 ? 25 : 17, i === 3 ? '#b3261e' : '#1d2433', i === 3 ? 700 : 400, i === 3 || i === 4 ? 'middle' : 'start');
      }
    });
    y += 41;
    line(58, y, 1182, y);
  });

  if (index === 1) {
    y += 20;
    rect(58, y, 1124, 382, '#fff7f6', '#f0c7c1', 16);
    text('間違えた問題・未入力', 76, y + 32, 22, '#8c1d18', 700);
    data.rows.slice(1).forEach((r, i) => {
      const x = 76 + (i % 6) * 182;
      const yy = y + 49 + Math.floor(i / 6) * 52;
      rect(x, yy, 173, 45, '#fff', '#f0d0cb', 7);
      text(r[0] + ' ' + (r[1] === '未入力' ? '未入力' : r[3]), x + 6, yy + 14, 12, '#8c1d18', 700);
      text('自分：' + r[1] + ' / 正解：' + r[2], x + 6, yy + 28, 10);
      text('得点：' + r[4], x + 6, yy + 40, 10);
    });
  }

  text((index + 1) + ' / 2', 620, 1700, 17, '#344054', 600, 'middle');
  p.push('</svg>');
  return p.join('');
}

function svgToJpegBytes(svg) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = RASTER_W;
        canvas.height = RASTER_H;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvasの描画領域を確保できませんでした。');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, RASTER_W, RASTER_H);
        ctx.imageSmoothingEnabled = true;
        if ('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, RASTER_W, RASTER_H);
        const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
        const bin = atob(dataUrl.split(',')[1] || '');
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        resolve(bytes);
      } catch (e) {
        reject(e);
      } finally {
        URL.revokeObjectURL(url);
        img.onload = img.onerror = null;
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('SVG画像を読み込めませんでした。'));
    };
    img.src = url;
  });
}

const enc = new TextEncoder();
function ascii(s) { return enc.encode(String(s)); }

function makePdfBlob(jpegs) {
  const pdfW = 595.275590551;
  const pdfH = 841.88976378;
  const parts = [];
  const offsets = [0];
  let len = 0;

  function add(part) {
    if (typeof part === 'string') part = ascii(part);
    parts.push(part);
    len += part.byteLength || part.length || 0;
  }
  function obj(n, body) {
    offsets[n] = len;
    add(n + ' 0 obj\n');
    body.forEach(add);
    add('\nendobj\n');
  }

  add('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  const kids = [];
  for (let i = 0; i < jpegs.length; i++) kids.push((3 + i * 3) + ' 0 R');
  obj(1, ['<< /Type /Catalog /Pages 2 0 R >>']);
  obj(2, ['<< /Type /Pages /Kids [', kids.join(' '), '] /Count ', String(jpegs.length), ' >>']);

  for (let i = 0; i < jpegs.length; i++) {
    const page = 3 + i * 3;
    const content = page + 1;
    const image = page + 2;
    const name = 'Im' + (i + 1);
    const stream = 'q\n' + pdfW.toFixed(3) + ' 0 0 ' + pdfH.toFixed(3) + ' 0 0 cm\n/' + name + ' Do\nQ\n';
    obj(page, ['<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ', pdfW.toFixed(3), ' ', pdfH.toFixed(3), '] /Resources << /XObject << /', name, ' ', image, ' 0 R >> >> /Contents ', content, ' 0 R >>']);
    obj(content, ['<< /Length ', String(ascii(stream).length), ' >>\nstream\n', stream, 'endstream']);
    offsets[image] = len;
    add(image + ' 0 obj\n');
    add('<< /Type /XObject /Subtype /Image /Width ' + RASTER_W + ' /Height ' + RASTER_H + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + jpegs[i].length + ' >>\nstream\n');
    add(jpegs[i]);
    add('\nendstream\nendobj\n');
  }

  const xref = len;
  const maxObj = 2 + jpegs.length * 3;
  add('xref\n0 ' + (maxObj + 1) + '\n0000000000 65535 f \n');
  for (let i = 1; i <= maxObj; i++) add(String(offsets[i]).padStart(10, '0') + ' 00000 n \n');
  add('trailer\n<< /Size ' + (maxObj + 1) + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF');
  return new Blob(parts, { type: 'application/pdf' });
}

// 2026-05-30 23:11 JST の v192 系と同じ Safari 判定。
function isIOSSafariOnly() {
  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';
  const isiOS = /iPad|iPhone|iPod/.test(ua) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!isiOS) return false;
  return /Safari\//.test(ua) && !/(CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|Instagram|FBAN|FBAV|Line)/.test(ua);
}

let __iosPendingPdf = null;
function closeIosPdfShareBox() {
  const old = document.getElementById('__iosPdfShareBox');
  if (old) old.remove();
}

function showIosPdfShareBox(pdf, filename) {
  closeIosPdfShareBox();
  __iosPendingPdf = { pdf, filename };

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

  saveBtn.addEventListener('click', async function() {
    try {
      const p = __iosPendingPdf;
      if (!p) return;
      const file = new File([p.pdf], p.filename, { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
        await navigator.share({ files: [file], title: p.filename });
      } else {
        const url = URL.createObjectURL(p.pdf);
        window.open(url, '_blank', 'noopener');
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      }
    } catch (e) {
      alert('PDFの共有に失敗しました: ' + (e && e.message ? e.message : e));
    }
  });

  openBtn.addEventListener('click', function() {
    try {
      const p = __iosPendingPdf;
      if (!p) return;
      const url = URL.createObjectURL(p.pdf);
      window.open(url, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      alert('PDFを開けませんでした: ' + (e && e.message ? e.message : e));
    }
  });

  closeBtn.addEventListener('click', closeIosPdfShareBox);
}

function deliverPdf(pdf, filename) {
  if (isIOSSafariOnly()) {
    showIosPdfShareBox(pdf, filename);
    return 'iPhone/iPad Safari: Web Share / File';
  }

  const url = URL.createObjectURL(pdf);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  return 'Object URL direct download';
}

async function generatePDF() {
  const button = document.getElementById('exportPdfResult');
  if (!button) return;
  if (!DATA) {
    alert('PDF用データの準備ができていません。採点結果を表示し直してください。');
    return;
  }
  button.disabled = true;
  const oldText = button.textContent;
  button.textContent = 'PDF生成中…';
  const start = performance.now();

  try {
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    const svgs = [buildSVG(DATA, 0), buildSVG(DATA, 1)];
    const jpegs = [];
    for (let i = 0; i < svgs.length; i++) {
      jpegs.push(await svgToJpegBytes(svgs[i]));
    }

    const pdf = makePdfBlob(jpegs);
    deliverPdf(pdf, ACTIVE_FILENAME);
    console.info('v1.3 PDF generated: ' + jpegs.length + ' pages / ' + ((performance.now() - start) / 1000).toFixed(2) + 's');
  } catch (error) {
    console.error(error);
    try {
      alert('PDF生成に失敗しました: ' + (error && error.message ? error.message : error));
    } catch (_) {}
  } finally {
    button.disabled = false;
    button.textContent = oldText || 'PDF出力（A4）';
  }
}

document.addEventListener('click', function(e) {
  const button = e.target && e.target.closest && e.target.closest('#exportPdfResult');
  if (!button) return;
  e.preventDefault();
  e.stopPropagation();
  if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
  generatePDF();
}, true);

console.info('Main PDF exporter: post-click flow synchronized with pdf-issue-trial v1.3');
