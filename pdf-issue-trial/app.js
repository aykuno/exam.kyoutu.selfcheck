'use strict';
const DATA=JSON.parse(document.getElementById('test-data').textContent);
const W=1240,H=1754,RASTER_W=2480,RASTER_H=3508;
const xml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function buildSVG(data, index){
 const p=[`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="1240" height="1754" fill="white"/>`];
 const text=(s,x,y,size=18,color='#1d2433',weight=400,anchor='start')=>p.push(`<text x="${x}" y="${y}" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Hiragino Sans,Yu Gothic,Meiryo,sans-serif" font-size="${size}" fill="${color}" font-weight="${weight}" text-anchor="${anchor}">${xml(s)}</text>`);
 const rect=(x,y,w,h,fill='#fbfcff',stroke='#d9deea',r=0)=>p.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}"/>`);
 const line=(x,y,x2,y2)=>p.push(`<path d="M${x} ${y}L${x2} ${y2}" fill="none" stroke="#d9deea"/>`);
 let y;
 if(index===0){
  text('採点結果',58,62,16,'#647086');text(data.title,58,108,34,'#1d2433',700);text(data.subject,58,150,34,'#1d2433',700);
  rect(58,195,1124,110,'#fbfcff','#dfe7fb',16);text(data.subject,78,234,23,'#1d2433',700);text(data.title,78,271,15);
  [['点数',data.score],['正答率',data.rate],['正答項目',data.correct],['未入力',data.missing]].forEach(([label,value],i)=>{const x=354+i*200;rect(x,210,188,80,'#fff','#dfe7fb',10);text(label,x+12,235,14,'#647086');text(value,x+12,273,25,'#1d2433',700)});
  rect(58,325,1124,310,'#fbfcff','#d9deea',16);text('問題番号別正答率',78,362,23,'#1d2433',700);
  const cx=272,cy=505,rad=90,n=5,point=(i,r)=>[cx+Math.cos(-Math.PI/2+i*Math.PI*2/n)*r,cy+Math.sin(-Math.PI/2+i*Math.PI*2/n)*r];
  for(let k=1;k<=4;k++)p.push(`<polygon points="${Array.from({length:n},(_,i)=>point(i,rad*k/4).join(',')).join(' ')}" fill="none" stroke="#d9deea"/>`);
  for(let i=0;i<n;i++){const a=point(i,rad);line(cx,cy,...a);const b=point(i,rad+24);text('第'+(i+1)+'問',b[0],b[1]+6,15,'#1d2433',600,'middle')}
  p.push(`<circle cx="${cx}" cy="${cy}" r="5" fill="#2f5fd0"/>`);
  data.sections.forEach((row,i)=>{row.forEach((c,j)=>text(c,500+j*126,400+i*35,i?17:15));line(494,410+i*35,1160,410+i*35)});
  y=671;
 }else{text('全問一覧（続き）',58,67,23,'#1d2433',700);y=98;}
 const widths=[205,110,205,80,100,130,194],xs=[58];widths.forEach((w,i)=>xs.push(xs[i]+w));
 rect(58,y,1124,32,'#f7f8fc','#f7f8fc');data.rows[0].forEach((s,i)=>text(s,xs[i]+8,y+23,16,'#4a556b',600));y+=32;
 const rows=data.rows.slice(index===0?1:23,index===0?23:undefined);
 rows.forEach(row=>{row.forEach((s,i)=>{if(i===6&&s.length>24){const chars=Array.from(s);text(chars.slice(0,22).join(''),xs[i]+8,y+19,11,'#647086');text(chars.slice(22).join(''),xs[i]+8,y+33,11,'#647086')}else text(s,i===3||i===4?xs[i]+widths[i]/2:xs[i]+8,y+27,i===3?25:17,i===3?'#b3261e':'#1d2433',i===3?700:400,i===3||i===4?'middle':'start')});y+=41;line(58,y,1182,y)});
 if(index===1){y+=20;rect(58,y,1124,382,'#fff7f6','#f0c7c1',16);text('間違えた問題・未入力',76,y+32,22,'#8c1d18',700);data.rows.slice(1).forEach((r,i)=>{const x=76+(i%6)*182,yy=y+49+Math.floor(i/6)*52;rect(x,yy,173,45,'#fff','#f0d0cb',7);text(r[0]+' '+(r[1]==='未入力'?'未入力':r[3]),x+6,yy+14,12,'#8c1d18',700);text('自分：'+r[1]+' / 正解：'+r[2],x+6,yy+28,10);text('得点：'+r[4],x+6,yy+40,10)})}
 text((index+1)+' / 2',620,1700,17,'#344054',600,'middle');p.push('</svg>');return p.join('');
}

// 2. SVG → Image → Canvas → JPEG. Japanese text is encoded as UTF-8 first.
function svgToJpegBytes(svgStr, width, height) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => reject(new Error('SVG画像を読み込めませんでした。'));
    img.onload = () => {
      const canvas = document.createElement('canvas');
      try {
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvasの描画領域を確保できませんでした。');
        const scale = Math.min(width / img.naturalWidth, height / img.naturalHeight);
        const drawW = img.naturalWidth * scale, drawH = img.naturalHeight * scale;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, (width - drawW) / 2, (height - drawH) / 2, drawW, drawH);
        const uri = canvas.toDataURL('image/jpeg', 0.98);
        if (!uri.startsWith('data:image/jpeg;base64,')) throw new Error('JPEG画像を生成できませんでした。');
        const bytes = atob(uri.split(',')[1]);
        resolve({bytes, len: bytes.length, width, height});
      } catch (error) {
        reject(error);
      } finally {
        canvas.width = 0;
        canvas.height = 0;
        img.onload = img.onerror = null;
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)));
  });
}

// 3. Catalog / Pages / Page / Contents / Image and byte-accurate xref.
function buildPdfBytes(pages) {
  if (!pages.length) throw new Error('PDFのページがありません。');
  const PW = 595.276, PH = 841.890, objects = [];
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
  const kids = pages.map((_, i) => (3 + i * 3) + ' 0 R').join(' ');
  objects.push(`2 0 obj\n<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>\nendobj`);
  pages.forEach((jpeg, i) => {
    if (!Number.isInteger(jpeg.width) || jpeg.width <= 0 || !Number.isInteger(jpeg.height) || jpeg.height <= 0 || jpeg.len !== jpeg.bytes.length) {
      throw new Error('JPEG画像の寸法またはバイト長が不正です。');
    }
    const page = 3 + i * 3, content = page + 1, image = page + 2;
    const stream = `q ${PW} 0 0 ${PH} 0 0 cm /Im1 Do Q`;
    objects.push(`${page} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Contents ${content} 0 R /Resources << /XObject << /Im1 ${image} 0 R >> >> >>\nendobj`);
    objects.push(`${content} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj`);
    objects.push(`${image} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${jpeg.width} /Height ${jpeg.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.len} >>\nstream\n${jpeg.bytes}\nendstream\nendobj`);
  });
  const header = '%PDF-1.4\n';
  const offsets = [];
  let body = '', pos = header.length;
  for (const obj of objects) {
    offsets.push(pos);
    body += obj + '\n';
    pos = header.length + body.length;
  }
  const xrefPos = pos;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) xref += String(offset).padStart(10, '0') + ' 00000 n \n';
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
  const pdfStr = header + body + xref + trailer;
  const bytes = new Uint8Array(pdfStr.length);
  for (let i = 0; i < pdfStr.length; i++) bytes[i] = pdfStr.charCodeAt(i) & 0xff;
  return bytes;
}

// 4. Offer two manually activated data-URI links; never auto-open a window.
function triggerDownload(pdfBytes, filename) {
  let bin = '';
  for (let i = 0; i < pdfBytes.length; i += 8192) {
    bin += String.fromCharCode(...pdfBytes.subarray(i, i + 8192));
  }
  const uri = 'data:application/pdf;base64,' + btoa(bin);
  document.getElementById('pdf-issue-modal')?.remove();
  const overlay = document.createElement('div');
  overlay.id = 'pdf-issue-modal';
  overlay.className = 'overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'PDFファイル');
  const card = document.createElement('div');
  card.className = 'card';
  const title = document.createElement('h2');
  title.textContent = 'PDFファイル';
  const guide = document.createElement('p');
  guide.textContent = '下のリンクを押してPDFを保存してください。新しいタブで開けない場合は、ダウンロードしてからファイルを開いてください。';
  const save = document.createElement('a');
  save.href = uri;
  save.download = filename;
  save.textContent = 'ダウンロード';
  const open = document.createElement('a');
  open.href = uri;
  open.target = '_blank';
  open.rel = 'noopener noreferrer';
  open.textContent = '新しいタブで開く';
  open.style.background = '#475569';
  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = '閉じる';
  const dismiss = () => {overlay.remove(); document.getElementById('generate').focus();};
  close.addEventListener('click', dismiss);
  overlay.addEventListener('keydown', event => {
    if (event.key === 'Escape') dismiss();
    if (event.key === 'Tab') {
      if (event.shiftKey && document.activeElement === save) {event.preventDefault(); close.focus();}
      else if (!event.shiftKey && document.activeElement === close) {event.preventDefault(); save.focus();}
    }
  });
  card.append(title, guide, save, open, close);
  overlay.append(card);
  document.body.append(overlay);
  save.focus();
}

async function generatePDF() {
  const button = document.getElementById('generate'), status = document.getElementById('status');
  button.disabled = true;
  const start = performance.now();
  let step = 'SVG作成';
  try {
    const svgs = [buildSVG(DATA, 0), buildSVG(DATA, 1)];
    const pages = [];
    for (let i = 0; i < svgs.length; i++) {
      step = `SVG → Canvas → JPEG（${i + 1} / ${svgs.length}ページ）`;
      status.textContent = step;
      pages.push(await svgToJpegBytes(svgs[i], RASTER_W, RASTER_H));
    }
    step = 'PDF組み立て';
    const pdfBytes = buildPdfBytes(pages);
    step = '保存リンク作成';
    triggerDownload(pdfBytes, 'pdf-issue-trial-result.pdf');
    status.textContent = `生成成功：${pages.length}ページ、${pdfBytes.length.toLocaleString()} bytes、${((performance.now() - start) / 1000).toFixed(2)}秒\n保存方法を選んでください。`;
  } catch (error) {
    status.textContent = `${step}で失敗：${error.message}`;
    console.error(error);
  } finally {
    button.disabled = false;
  }
}

document.getElementById('preview').innerHTML = [buildSVG(DATA, 0), buildSVG(DATA, 1)].join('');
document.getElementById('generate').addEventListener('click', generatePDF);
