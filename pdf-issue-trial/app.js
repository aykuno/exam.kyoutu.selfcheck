'use strict';

const DATA = JSON.parse(document.getElementById('test-data').textContent);
const W = 1240;
const H = 1754;

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

// 2026年6月前半に使われていた v158 系の発行経路を再現する。
// PDFバイナリを自前生成せず、ユーザー操作中に印刷専用ウィンドウを開き、
// A4ページを構築した後に window.print() を呼び出す。
function makePrintWindow() {
  const w = window.open('', '_blank');
  if (!w) {
    alert('ポップアップがブロックされました。Safariの設定でポップアップを許可してから、もう一度実行してください。');
    return null;
  }

  w.document.open();
  w.document.write(`<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>採点結果PDF</title>
<style>
  @page{size:A4 portrait;margin:0}
  *{box-sizing:border-box}
  html,body{margin:0!important;padding:0!important;background:#fff!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,"Hiragino Sans","Yu Gothic",Meiryo,sans-serif}
  #pdfRoot{width:210mm;margin:0 auto;background:#fff}
  .pdfPage{width:210mm;height:297mm;position:relative;overflow:hidden;background:#fff;margin:0 auto;page-break-after:always;break-after:page}
  .pdfPage:last-child{page-break-after:auto;break-after:auto}
  .pdfPage svg{display:block;width:210mm;height:297mm}
  @media print{html,body,#pdfRoot{margin:0!important;padding:0!important}}
</style>
</head>
<body><div id="pdfRoot"></div></body>
</html>`);
  w.document.close();
  return w;
}

function buildPrintPages(w) {
  const root = w.document.getElementById('pdfRoot');
  if (!root) throw new Error('印刷用ページを作成できませんでした。');
  [buildSVG(DATA, 0), buildSVG(DATA, 1)].forEach(svg => {
    const page = w.document.createElement('div');
    page.className = 'pdfPage';
    page.innerHTML = svg;
    root.appendChild(page);
  });
}

function generatePDF() {
  const button = document.getElementById('generate');
  const status = document.getElementById('status');
  button.disabled = true;
  const start = performance.now();

  // v158と同じく、ポップアップはクリックイベント中に同期的に開く。
  const w = makePrintWindow();
  if (!w) {
    button.disabled = false;
    status.textContent = '失敗：印刷用ウィンドウを開けませんでした。';
    return;
  }

  try {
    status.textContent = '6月前半の方式：印刷専用ページを構築中';
    buildPrintPages(w);

    // v158に合わせ、描画反映を待ってから focus → print を実行する。
    setTimeout(() => {
      try {
        w.focus();
        setTimeout(() => {
          try {
            w.print();
            status.textContent = `印刷ダイアログを呼び出しました。Safariでは共有/プリント画面からPDFとして保存してください。\n${((performance.now() - start) / 1000).toFixed(2)}秒`;
          } catch (error) {
            console.error(error);
            status.textContent = 'window.print() の呼び出しで失敗：' + error.message;
          } finally {
            button.disabled = false;
          }
        }, 250);
      } catch (error) {
        console.error(error);
        button.disabled = false;
        status.textContent = '印刷画面の準備で失敗：' + error.message;
      }
    }, 80);
  } catch (error) {
    console.error(error);
    try { w.close(); } catch (_) {}
    button.disabled = false;
    status.textContent = '印刷用ページの構築で失敗：' + error.message;
  }
}

document.getElementById('preview').innerHTML = [buildSVG(DATA, 0), buildSVG(DATA, 1)].join('');
document.getElementById('generate').addEventListener('click', generatePDF);
