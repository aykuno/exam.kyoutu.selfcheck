(() => {
  "use strict";

  const PAGE_W = 1240;
  const PAGE_H = 1754;
  const SCALE = 2.33;
  const RASTER_W = Math.round(PAGE_W * SCALE);
  const RASTER_H = Math.round(PAGE_H * SCALE);
  const LEFT = 58;
  const RIGHT = 58;
  const TOP = 58;
  const BOTTOM = 94;
  const CONTENT_W = PAGE_W - LEFT - RIGHT;
  const CONTENT_BOTTOM = PAGE_H - BOTTOM;
  const COLORS = {
    text: "#1d2433",
    muted: "#647086",
    line: "#d9deea",
    blue: "#2f5fd0",
    blueSoft: "#eef4ff",
    green: "#137333",
    red: "#b3261e",
    amber: "#8a5b00"
  };

  function font(size, weight = "500") {
    return `${weight} ${size}px -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,"Hiragino Sans","Yu Gothic",Meiryo,sans-serif`;
  }

  function setFont(ctx, size, weight, color = COLORS.text, align = "left") {
    ctx.font = font(size, weight);
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = "top";
  }

  function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function line(ctx, x1, y1, x2, y2, color = COLORS.line, width = 1) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }

  function wrapLines(ctx, value, maxWidth, maxLines = Infinity) {
    const paragraphs = String(value ?? "").split("\n");
    const lines = [];
    for (const paragraph of paragraphs) {
      let current = "";
      for (const character of Array.from(paragraph || " ")) {
        const candidate = current + character;
        if (current && ctx.measureText(candidate).width > maxWidth) {
          lines.push(current);
          current = character;
          if (lines.length >= maxLines) return lines;
        } else {
          current = candidate;
        }
      }
      lines.push(current);
      if (lines.length >= maxLines) return lines;
    }
    return lines;
  }

  function drawText(ctx, value, x, y, maxWidth, size, weight, color, lineHeight, maxLines) {
    setFont(ctx, size, weight, color);
    const lines = wrapLines(ctx, value, maxWidth, maxLines);
    lines.forEach((text, index) => ctx.fillText(text, x, y + index * lineHeight));
    return lines.length * lineHeight;
  }

  function scoreText(value) {
    const number = Math.round(Number(value || 0) * 10) / 10;
    return Number.isInteger(number) ? String(number) : number.toFixed(1);
  }

  function dateText(value) {
    const date = value ? new Date(value) : new Date();
    const pad = number => String(number).padStart(2, "0");
    return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function fileStamp() {
    const date = new Date();
    const pad = number => String(number).padStart(2, "0");
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}`;
  }

  function safeFilename(value) {
    let name = String(value || "採点結果.pdf")
      .normalize("NFKC")
      .replace(/[\\/:*?"<>|]/g, "_")
      .replace(/\s+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 90);
    if (!name) name = "採点結果";
    if (!/\.pdf$/i.test(name)) name += ".pdf";
    return name;
  }

  function newPage(pages) {
    const canvas = document.createElement("canvas");
    canvas.width = RASTER_W;
    canvas.height = RASTER_H;
    const ctx = canvas.getContext("2d");
    ctx.scale(SCALE, SCALE);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);
    const page = {canvas, ctx, y: TOP};
    pages.push(page);
    return page;
  }

  function drawHeader(ctx, data, y) {
    setFont(ctx, 15, "800", COLORS.blue);
    ctx.fillText("共テ・センター自動採点サイト", LEFT, y);
    setFont(ctx, 34, "900", COLORS.text);
    ctx.fillText("採点結果", LEFT, y + 30);
    drawText(ctx, `${data.examLabel} / ${data.subject}`, LEFT, y + 82, CONTENT_W - 270, 22, "800", COLORS.text, 28, 2);
    setFont(ctx, 13, "700", COLORS.muted, "right");
    ctx.fillText(`出力日時 ${dateText(data.generatedAt)}`, PAGE_W - RIGHT, y + 10);
    line(ctx, LEFT, y + 142, PAGE_W - RIGHT, y + 142, COLORS.blue, 3);
    return y + 168;
  }

  function drawSummary(ctx, data, y) {
    const cards = [
      {label: "得点", value: `${scoreText(data.score)} / ${scoreText(data.maxScore)}`, color: COLORS.blue, fill: COLORS.blueSoft, width: 350},
      {label: "正答項目", value: String(data.correct), color: COLORS.green, fill: "#f2faf5", width: 240},
      {label: "誤答・部分点", value: String(Number(data.wrong || 0) + Number(data.partial || 0)), color: COLORS.red, fill: "#fff6f5", width: 260},
      {label: "未入力", value: String(data.missing), color: COLORS.amber, fill: "#fffaf0", width: 238}
    ];
    let x = LEFT;
    for (const card of cards) {
      roundRect(ctx, x, y, card.width, 92, 15, card.fill, COLORS.line);
      setFont(ctx, 13, "800", COLORS.muted);
      ctx.fillText(card.label, x + 16, y + 13);
      setFont(ctx, card.label === "得点" ? 30 : 27, "900", card.color);
      ctx.fillText(card.value, x + 16, y + 42);
      x += card.width + 12;
    }
    if (data.chosenGroups && data.chosenGroups.length) {
      drawText(
        ctx,
        `採点対象：必答問題＋${data.chosenGroups.join("・")}`,
        LEFT,
        y + 107,
        CONTENT_W,
        14,
        "800",
        COLORS.blue,
        20,
        1
      );
      return y + 143;
    }
    return y + 116;
  }

  function shortLabel(value) {
    return String(value || "全体")
      .replace(/模擬試験|共通テスト|数学|国語/g, "")
      .replace(/\s+/g, "")
      .slice(0, 9) || "全体";
  }

  function drawRadar(ctx, groups, x, y, width, height) {
    roundRect(ctx, x, y, width, height, 16, "#fff", COLORS.line);
    setFont(ctx, 18, "900", COLORS.text);
    ctx.fillText("大問別レーダー", x + 18, y + 15);
    if (!groups.length) return;
    const cx = x + width / 2;
    const cy = y + height / 2 + 14;
    const radius = Math.min(width * .28, height * .30);
    const count = groups.length;
    for (let level = 1; level <= 4; level++) {
      ctx.beginPath();
      groups.forEach((_, index) => {
        const angle = -Math.PI / 2 + Math.PI * 2 * index / count;
        const r = radius * level / 4;
        const px = cx + Math.cos(angle) * r;
        const py = cy + Math.sin(angle) * r;
        if (index) ctx.lineTo(px, py);
        else ctx.moveTo(px, py);
      });
      ctx.closePath();
      ctx.strokeStyle = level === 4 ? "#b9c5db" : "#e1e6ef";
      ctx.lineWidth = level === 4 ? 2 : 1;
      ctx.stroke();
    }
    groups.forEach((group, index) => {
      const angle = -Math.PI / 2 + Math.PI * 2 * index / count;
      line(ctx, cx, cy, cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius, "#e1e6ef", 1);
      const lx = cx + Math.cos(angle) * (radius + 35);
      const ly = cy + Math.sin(angle) * (radius + 27);
      setFont(ctx, 12, "800", COLORS.muted, "center");
      ctx.fillText(shortLabel(group.group), lx, ly - 7);
    });
    ctx.beginPath();
    groups.forEach((group, index) => {
      const angle = -Math.PI / 2 + Math.PI * 2 * index / count;
      const rate = group.possible ? Math.max(0, Math.min(1, group.earned / group.possible)) : 0;
      const px = cx + Math.cos(angle) * radius * rate;
      const py = cy + Math.sin(angle) * radius * rate;
      if (index) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    });
    ctx.closePath();
    ctx.fillStyle = "rgba(47,95,208,.20)";
    ctx.fill();
    ctx.strokeStyle = COLORS.blue;
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  function drawGroupTable(ctx, groups, x, y, width, height) {
    roundRect(ctx, x, y, width, height, 16, "#fff", COLORS.line);
    setFont(ctx, 18, "900", COLORS.text);
    ctx.fillText("大問別得点", x + 18, y + 15);
    const columns = [width - 315, 170, 115];
    const headers = ["大問", "得点", "得点率"];
    let xx = x + 16;
    const headerY = y + 52;
    ctx.fillStyle = "#f5f7fb";
    ctx.fillRect(x + 12, headerY, width - 24, 30);
    headers.forEach((header, index) => {
      setFont(ctx, 11, "800", COLORS.muted, index ? "right" : "left");
      const tx = index ? xx + columns[index] - 8 : xx + 8;
      ctx.fillText(header, tx, headerY + 8);
      xx += columns[index];
    });
    let rowY = headerY + 30;
    const rowHeight = Math.min(42, Math.max(28, (height - 94) / Math.max(1, groups.length)));
    groups.forEach(group => {
      xx = x + 16;
      const rate = group.possible ? Math.round(group.earned / group.possible * 1000) / 10 : 0;
      const values = [
        group.group,
        `${scoreText(group.earned)} / ${scoreText(group.possible)}`,
        `${rate}%`
      ];
      values.forEach((value, index) => {
        setFont(ctx, 12, index ? "700" : "600", COLORS.text, index ? "right" : "left");
        const tx = index ? xx + columns[index] - 8 : xx + 8;
        ctx.fillText(String(value), tx, rowY + 8);
        xx += columns[index];
      });
      line(ctx, x + 16, rowY + rowHeight, x + width - 16, rowY + rowHeight);
      rowY += rowHeight;
    });
  }

  function drawAnalytics(ctx, data, y) {
    const height = 350;
    const leftWidth = 470;
    drawRadar(ctx, data.groups || [], LEFT, y, leftWidth, height);
    drawGroupTable(ctx, data.groups || [], LEFT + leftWidth + 14, y, CONTENT_W - leftWidth - 14, height);
    return y + height + 24;
  }

  const TABLE_COLUMNS = [205, 180, 405, 190, 144];

  function drawTableHeader(ctx, y, continued) {
    if (continued) {
      setFont(ctx, 20, "900", COLORS.text);
      ctx.fillText("全問正誤（続き）", LEFT, y);
      y += 35;
    } else {
      setFont(ctx, 21, "900", COLORS.text);
      ctx.fillText("全問正誤", LEFT, y);
      y += 38;
    }
    const headers = ["番号", "自分", "正解", "得点", "判定"];
    ctx.fillStyle = "#f5f7fb";
    ctx.fillRect(LEFT, y, CONTENT_W, 32);
    let x = LEFT;
    headers.forEach((header, index) => {
      setFont(ctx, 12, "800", COLORS.muted, index === 4 ? "center" : "left");
      ctx.fillText(header, index === 4 ? x + TABLE_COLUMNS[index] / 2 : x + 9, y + 8);
      x += TABLE_COLUMNS[index];
    });
    line(ctx, LEFT, y + 32, PAGE_W - RIGHT, y + 32);
    return y + 32;
  }

  function rowHeight(ctx, row) {
    setFont(ctx, 14, "600");
    const gotLines = wrapLines(ctx, row.got, TABLE_COLUMNS[1] - 18, 2).length;
    const expectedLines = wrapLines(ctx, row.expected, TABLE_COLUMNS[2] - 18, 3).length;
    return Math.max(34, 14 + Math.max(gotLines, expectedLines) * 18);
  }

  function drawRow(ctx, row, y, height) {
    const values = [
      row.id,
      row.got,
      row.expected,
      `${scoreText(row.earned)} / ${scoreText(row.points)}`,
      row.judge
    ];
    let x = LEFT;
    values.forEach((value, index) => {
      if (index === 4) {
        const color = value === "○" ? COLORS.green : value === "△" ? COLORS.amber : COLORS.red;
        setFont(ctx, 23, "900", color, "center");
        ctx.fillText(value, x + TABLE_COLUMNS[index] / 2, y + Math.max(5, (height - 25) / 2));
      } else {
        drawText(
          ctx,
          value,
          x + 9,
          y + 7,
          TABLE_COLUMNS[index] - 18,
          index === 0 ? 13 : 14,
          index === 3 ? "800" : "600",
          COLORS.text,
          18,
          index === 2 ? 3 : 2
        );
      }
      x += TABLE_COLUMNS[index];
    });
    line(ctx, LEFT, y + height, PAGE_W - RIGHT, y + height);
  }

  function drawMissed(pages, page, rows) {
    const missed = rows.filter(row => row.judge !== "○");
    if (!missed.length) return page;
    const cardHeight = 58;
    const columns = 3;
    const gap = 10;
    const cardWidth = (CONTENT_W - gap * (columns - 1)) / columns;
    const rowsNeeded = Math.ceil(missed.length / columns);
    const panelHeight = 53 + rowsNeeded * (cardHeight + gap);
    if (page.y + Math.min(panelHeight, 430) > CONTENT_BOTTOM) {
      page = newPage(pages);
      page.y = TOP;
    }
    setFont(page.ctx, 20, "900", COLORS.red);
    page.ctx.fillText("間違えた問題・未入力", LEFT, page.y);
    page.y += 38;
    let column = 0;
    missed.forEach(row => {
      if (page.y + cardHeight > CONTENT_BOTTOM) {
        page = newPage(pages);
        page.y = TOP;
        setFont(page.ctx, 20, "900", COLORS.red);
        page.ctx.fillText("間違えた問題・未入力（続き）", LEFT, page.y);
        page.y += 38;
        column = 0;
      }
      const x = LEFT + column * (cardWidth + gap);
      roundRect(page.ctx, x, page.y, cardWidth, cardHeight, 10, "#fff7f6", "#f0c7c1");
      drawText(page.ctx, `${row.id} ${row.judge}`, x + 10, page.y + 7, cardWidth - 20, 13, "900", row.judge === "△" ? COLORS.amber : COLORS.red, 17, 1);
      drawText(page.ctx, `自分：${row.got} / 正解：${row.expected}`, x + 10, page.y + 29, cardWidth - 20, 11, "600", COLORS.text, 15, 1);
      column++;
      if (column === columns) {
        column = 0;
        page.y += cardHeight + gap;
      }
    });
    if (column) page.y += cardHeight + gap;
    page.y += 12;
    return page;
  }

  function drawFooters(pages) {
    pages.forEach((page, index) => {
      line(page.ctx, LEFT, PAGE_H - 70, PAGE_W - RIGHT, PAGE_H - 70);
      setFont(page.ctx, 12, "700", COLORS.muted, "center");
      page.ctx.fillText(`${index + 1} / ${pages.length}`, PAGE_W / 2, PAGE_H - 54);
    });
  }

  function renderCanvases(data) {
    const pages = [];
    let page = newPage(pages);
    page.y = drawHeader(page.ctx, data, page.y);
    page.y = drawSummary(page.ctx, data, page.y);
    page.y = drawAnalytics(page.ctx, data, page.y);
    page.y = drawTableHeader(page.ctx, page.y, false);
    for (const row of data.rows || []) {
      const height = rowHeight(page.ctx, row);
      if (page.y + height > CONTENT_BOTTOM) {
        page = newPage(pages);
        page.y = drawTableHeader(page.ctx, TOP, true);
      }
      drawRow(page.ctx, row, page.y, height);
      page.y += height;
    }
    page.y += 24;
    page = drawMissed(pages, page, data.rows || []);
    drawFooters(pages);
    return pages.map(item => item.canvas);
  }

  function canvasToJpegBytes(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(async blob => {
        try {
          if (!blob) throw new Error("PDFページ画像を作成できませんでした。");
          resolve(new Uint8Array(await blob.arrayBuffer()));
        } catch (error) {
          reject(error);
        }
      }, "image/jpeg", .97);
    });
  }

  const encoder = new TextEncoder();

  function makePdfBlob(jpegs) {
    const pdfWidth = 595.275590551;
    const pdfHeight = 841.88976378;
    const parts = [];
    const offsets = [0];
    let length = 0;
    const add = value => {
      const part = typeof value === "string" ? encoder.encode(value) : value;
      parts.push(part);
      length += part.byteLength;
    };
    const object = (number, body) => {
      offsets[number] = length;
      add(`${number} 0 obj\n`);
      body.forEach(add);
      add("\nendobj\n");
    };
    add("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
    const children = jpegs.map((_, index) => `${3 + index * 3} 0 R`);
    object(1, ["<< /Type /Catalog /Pages 2 0 R >>"]);
    object(2, [`<< /Type /Pages /Kids [${children.join(" ")}] /Count ${jpegs.length} >>`]);
    jpegs.forEach((jpeg, index) => {
      const page = 3 + index * 3;
      const content = page + 1;
      const image = page + 2;
      const name = `Im${index + 1}`;
      const stream = `q\n${pdfWidth.toFixed(3)} 0 0 ${pdfHeight.toFixed(3)} 0 0 cm\n/${name} Do\nQ\n`;
      object(page, [
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pdfWidth.toFixed(3)} ${pdfHeight.toFixed(3)}] `,
        `/Resources << /XObject << /${name} ${image} 0 R >> >> /Contents ${content} 0 R >>`
      ]);
      object(content, [`<< /Length ${encoder.encode(stream).length} >>\nstream\n`, stream, "endstream"]);
      offsets[image] = length;
      add(`${image} 0 obj\n`);
      add(`<< /Type /XObject /Subtype /Image /Width ${RASTER_W} /Height ${RASTER_H} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
      add(jpeg);
      add("\nendstream\nendobj\n");
    });
    const xref = length;
    const maxObject = 2 + jpegs.length * 3;
    add(`xref\n0 ${maxObject + 1}\n0000000000 65535 f \n`);
    for (let index = 1; index <= maxObject; index++) {
      add(`${String(offsets[index]).padStart(10, "0")} 00000 n \n`);
    }
    add(`trailer\n<< /Size ${maxObject + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
    return new Blob(parts, {type: "application/pdf"});
  }

  function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const chunkSize = 8192;
    for (let index = 0; index < bytes.length; index += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
    }
    return btoa(binary);
  }

  async function blobToDataUri(blob) {
    return `data:application/pdf;base64,${arrayBufferToBase64(await blob.arrayBuffer())}`;
  }

  function isSafari() {
    const userAgent = navigator.userAgent || "";
    const vendor = navigator.vendor || "";
    const safari = /Safari\//.test(userAgent) && /Apple/i.test(vendor || "Apple");
    const other = /(Chrome|Chromium|CriOS|FxiOS|Firefox|EdgiOS|Edg\/|OPiOS|OPR\/|DuckDuckGo|Instagram|FBAN|FBAV|Line)/i.test(userAgent);
    return safari && !other;
  }

  function showDownloadModal(dataUri, filename) {
    document.getElementById("pdf-dl-modal")?.remove();
    const overlay = document.createElement("div");
    overlay.id = "pdf-dl-modal";
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,"Hiragino Sans","Yu Gothic",Meiryo,sans-serif;';
    const card = document.createElement("div");
    card.style.cssText = "background:white;border-radius:16px;padding:24px;max-width:440px;width:100%;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,.25);color:#1d2433;";
    const title = document.createElement("div");
    title.textContent = "採点結果PDF";
    title.style.cssText = "font-weight:bold;font-size:16px;margin-bottom:8px;";
    const guide = document.createElement("div");
    guide.innerHTML = "下のボタンを押してダウンロードしてください。<br><b>Safari</b>：長押し →「リンクをダウンロード」";
    guide.style.cssText = "font-size:12px;color:#6b7280;margin-bottom:20px;line-height:1.7;";
    const link = document.createElement("a");
    link.href = dataUri;
    link.download = filename;
    link.textContent = `${filename} をダウンロード`;
    link.style.cssText = "display:block;background:#2563eb;color:white;border-radius:12px;padding:13px;font-weight:bold;font-size:14px;text-decoration:none;margin-bottom:12px;word-break:break-all;";
    const close = document.createElement("button");
    close.type = "button";
    close.textContent = "閉じる";
    close.style.cssText = "background:#e5e7eb;color:#1d2433;border:none;border-radius:10px;padding:9px 24px;font-size:13px;font-weight:600;cursor:pointer;";
    close.onclick = () => overlay.remove();
    card.append(title, guide, link, close);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
  }

  async function deliver(pdf, filename) {
    if (isSafari()) {
      showDownloadModal(await blobToDataUri(pdf), filename);
      return;
    }
    const url = URL.createObjectURL(pdf);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  async function buildPdf(data) {
    if (!data || !Array.isArray(data.rows) || !Array.isArray(data.groups)) {
      throw new Error("採点結果がありません。");
    }
    const canvases = renderCanvases(data);
    const jpegs = [];
    for (const canvas of canvases) jpegs.push(await canvasToJpegBytes(canvas));
    return makePdfBlob(jpegs);
  }

  async function exportResult(data) {
    const pdf = await buildPdf(data);
    const filename = safeFilename(
      `採点結果_${data.year ? `${data.year}_` : ""}${data.subject}_${fileStamp()}.pdf`
    );
    await deliver(pdf, filename);
  }

  window.MarkReaderPDF = Object.freeze({
    exportResult,
    debug: Object.freeze({renderCanvases, canvasToJpegBytes, makePdfBlob, buildPdf})
  });
})();
