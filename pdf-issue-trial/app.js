'use strict';

const DATA = JSON.parse(document.getElementById('test-data').textContent);
const W = 1240;
const H = 1754;
const RENDER_SCALE = 2.33;
const RASTER_W = Math.round(W * RENDER_SCALE);
const RASTER_H = Math.round(H * RENDER_SCALE);
const JPEG_QUALITY = 0.97;

const xml = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
}[c]));

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

function isIOSSafariOnly() {
  const ua = navigator.userAgent || '';
  const vendor = navigator.vendor || '';
  const isSafari = /Safari\//.test(ua) && /Apple/i.test(vendor || 'Apple');
  const isOtherBrowser = /(Chrome|Chromium|CriOS|FxiOS|Firefox|EdgiOS|Edg\/|OPiOS|OPR\/|DuckDuckGo|Instagram|FBAN|FBAV|Line)/i.test(ua);
  return isSafari && !isOtherBrowser;
}

function safeFilename(s) {
  let name = String(s || '採点結果.pdf').replace(/[\\/:*?"<>|]/g, '_').trim();
  if (!name) name = '採点結果.pdf';
  if (!/\.pdf$/i.test(name)) name += '.pdf';
  return name;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    if (typeof FileReader !== 'undefined') {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error || new Error('PDFデータURLの作成に失敗しました。'));
      reader.readAsDataURL(blob);
      return;
    }
    if (blob && typeof blob.arrayBuffer === 'function') {
      blob.arrayBuffer().then(buffer => {
        resolve('data:application/pdf;base64,' + arrayBufferToBase64(buffer));
      }).catch(reject);
      return;
    }
    reject(new Error('このブラウザではPDFデータURLを作成できません。'));
  });
}

function showPdfDownloadModal(dataUri, filename) {
  const old = document.getElementById('pdf-dl-modal');
  if (old) old.remove();

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
  close.addEventListener('click', () => overlay.remove());

  card.append(title, guide, link, close);
  overlay.appendChild(card);
  document.body.appendChild(overlay);
}

async function showSafariPdfDownloadModal(pdf, filename) {
  const dataUri = await blobToDataUrl(pdf);
  if (!/^data:application\/pdf(?:;[^,]*)?;base64,/i.test(dataUri)) {
    throw new Error('PDFのdata URI形式が不正です。');
  }
  showPdfDownloadModal(dataUri, filename);
}

async function deliverPdf(pdf, filename) {
  if (isIOSSafariOnly()) {
    await showSafariPdfDownloadModal(pdf, filename);
    return 'Safari data URI modal';
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
  const button = document.getElementById('generate');
  const status = document.getElementById('status');
  button.disabled = true;
  const start = performance.now();
  try {
    status.textContent = '6/18版：350dpi相当でページをラスタライズ中';
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const svgs = [buildSVG(DATA, 0), buildSVG(DATA, 1)];
    const jpegs = [];
    for (let i = 0; i < svgs.length; i++) {
      status.textContent = `6/18版：JPEG生成 ${i + 1} / ${svgs.length}`;
      jpegs.push(await svgToJpegBytes(svgs[i]));
    }
    status.textContent = '6/18版：PDFを組み立て中';
    const pdf = makePdfBlob(jpegs);
    const route = await deliverPdf(pdf, '採点結果_2026_国語_0618trial.pdf');
    status.textContent = `生成成功：${jpegs.length}ページ / ${route}\n${((performance.now() - start) / 1000).toFixed(2)}秒`;
  } catch (error) {
    console.error(error);
    if (isIOSSafariOnly()) {
      alert('PDF生成に失敗しました: ' + (error && error.message ? error.message : error));
    } else {
      try {
        alert('直接PDF保存に失敗しました。印刷画面を開きます。');
        window.print();
      } catch (_) {}
    }
    status.textContent = '失敗：' + (error && error.message ? error.message : error);
  } finally {
    button.disabled = false;
  }
}

document.getElementById('preview').innerHTML = [buildSVG(DATA, 0), buildSVG(DATA, 1)].join('');
document.getElementById('generate').addEventListener('click', generatePDF);
