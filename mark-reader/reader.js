(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const KANA = ["ア","イ","ウ","エ","オ","カ","キ","ク","ケ","コ","サ","シ","ス","セ","ソ","タ","チ","ツ","テ","ト","ナ","ニ","ヌ","ネ","ノ","ハ","ヒ","フ","ヘ","ホ"];
  const TEMPLATES = {
    standard: {
      name: "国語・通常型",
      help: "国語で精度を確認できた従来の読取処理をそのまま使用します。",
      pages: [[1, 2]],
      standard: true
    },
    math1: {
      name: "数学①",
      help: "第1面と第2面を順に撮影します。数学専用の位置・判定基準を使用します。",
      pages: [[1, 2], [3, 4]]
    },
    math2: {
      name: "数学②",
      help: "両面を順に撮影し、第4〜7問から選択した3問を推定します。",
      pages: [[1, 2, 3], [4, 5, 6, 7]],
      choices: [4, 5, 6, 7]
    }
  };

  let subject = "standard";
  let pageIndex = 0;
  let pageData = [];
  let standardAnswers = [];
  let selectedQuestions = new Set();

  function aiConfigured() {
    return Boolean(window.MarkReaderAI && window.MarkReaderAI.isConfigured());
  }

  function updateAiAvailability() {
    const available = aiConfigured();
    const checkbox = $("aiAssist");
    checkbox.disabled = !available;
    if (!available) checkbox.checked = false;
    $("aiOption").classList.toggle("disabled", !available);
    $("aiAvailability").className = `ai-availability ${available ? "ready" : "unavailable"}`;
    $("aiAvailability").textContent = available
      ? "AI照合を利用できます。解答欄の切抜きだけを送信します。"
      : "Firebase AI Logicの設定後に利用できます。現在は端末内判定のみです。";
  }

  function updateSubjectUi() {
    document.querySelectorAll(".subject").forEach(button =>
      button.classList.toggle("selected", button.dataset.subject === subject)
    );
    $("startButton").textContent = subject === "standard"
      ? "国語・通常型を撮影する"
      : `${TEMPLATES[subject].name} 第1面を撮影する`;
    $("setupHelp").textContent = TEMPLATES[subject].help;
    $("aiOption").classList.toggle("hidden", subject === "standard");
    if (subject !== "standard") updateAiAvailability();
  }

  document.querySelectorAll(".subject").forEach(button => {
    button.onclick = () => {
      subject = button.dataset.subject;
      updateSubjectUi();
    };
  });
  if (window.addEventListener) {
    window.addEventListener("mark-reader-ai-ready", updateAiAvailability);
  }
  updateSubjectUi();

  $("startButton").onclick = begin;
  $("backButton").onclick = reset;
  $("errorBackButton").onclick = reset;
  $("retryButton").onclick = showCapture;
  $("rescanButton").onclick = reset;
  $("fileInput").onchange = () => {
    const file = $("fileInput").files && $("fileInput").files[0];
    if (file) readPage(file);
    $("fileInput").value = "";
  };

  function begin() {
    pageIndex = 0;
    pageData = [];
    standardAnswers = [];
    selectedQuestions.clear();
    showCapture();
  }

  function reset() {
    pageIndex = 0;
    pageData = [];
    standardAnswers = [];
    selectedQuestions.clear();
    show("setupCard");
  }

  function show(id) {
    ["setupCard","captureCard","workingCard","errorCard","resultCard"]
      .forEach(x => $(x).classList.toggle("hidden", x !== id));
  }

  function showCapture() {
    const standard = subject === "standard";
    $("stepIndicator").classList.toggle("hidden", standard);
    $("captureTitle").textContent = standard
      ? "国語・通常型を撮影"
      : `${TEMPLATES[subject].name} 第${pageIndex + 1}面を撮影`;
    $("captureHelp").textContent = standard
      ? "用紙全体と、左右の解答欄にある黒い基準四角をすべて入れてください。"
      : pageIndex === 0
        ? "第1面の用紙全体と、各解答欄の四隅にある黒い四角を入れてください。"
        : "裏返した第2面を、同じように用紙全体が入るよう撮影してください。";
    $("step1").className = pageIndex === 0 ? "active" : "done";
    $("step2").className = pageIndex === 1 ? "active" : "";
    show("captureCard");
  }

  function nextFrame() {
    return new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));
  }

  function rotateCanvas(source, angle) {
    if (!angle) return source;
    const out = document.createElement("canvas");
    if (Math.abs(angle) === 90) {
      out.width = source.height;
      out.height = source.width;
    } else {
      out.width = source.width;
      out.height = source.height;
    }
    const ctx = out.getContext("2d");
    ctx.translate(out.width / 2, out.height / 2);
    ctx.rotate(angle * Math.PI / 180);
    ctx.drawImage(source, -source.width / 2, -source.height / 2);
    return out;
  }

  async function readPage(file) {
    show("workingCard");
    $("workingText").textContent = "写真を読み込んでいます…";
    try {
      const bitmap = await createImageBitmap(file, {imageOrientation: "from-image"});
      const maxSide = subject === "standard" ? 1800 : 2200;
      const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
      const base = document.createElement("canvas");
      base.width = Math.round(bitmap.width * scale);
      base.height = Math.round(bitmap.height * scale);
      base.getContext("2d").drawImage(bitmap, 0, 0, base.width, base.height);
      bitmap.close();
      await nextFrame();

      if (subject === "standard") {
        await readStandardPage(base, file.name);
      } else {
        await readMathPage(base, file.name);
      }
    } catch (error) {
      $("errorText").textContent = error && error.message
        ? error.message
        : "画像を処理できませんでした。別の写真でお試しください。";
      show("errorCard");
    }
  }

  async function readStandardPage(canvas, fileName) {
    $("workingText").textContent = "国語・通常型の基準マークを検出しています…";
    await nextFrame();
    const image = canvas.getContext("2d", {willReadFrequently: true})
      .getImageData(0, 0, canvas.width, canvas.height);
    const boxes = detectStandardBoxes(image);
    if (boxes.length !== 2) {
      throw new Error("左右の解答欄を2組とも検出できませんでした。用紙全体を入れ、影や反射を避けて撮り直してください。");
    }
    boxes.sort((a, b) => a.centerX - b.centerX);
    $("workingText").textContent = "1〜60のマークを判定しています…";
    await nextFrame();
    standardAnswers = boxes.flatMap((box, block) => readStandardBlock(image, box, block));
    pageData = [{preview: makePreview(canvas, boxes, ["1〜30", "31〜60"]), fileName}];
    finishStandard();
  }

  async function readMathPage(base, fileName) {
    const expected = TEMPLATES[subject].pages[pageIndex].length;
    $("workingText").textContent = `第${pageIndex + 1}面の解答欄を自動検出しています…`;
    await nextFrame();

    const attempts = [];
    for (const angle of [0, 180, 90, -90]) {
      const canvas = rotateCanvas(base, angle);
      const image = canvas.getContext("2d", {willReadFrequently: true})
        .getImageData(0, 0, canvas.width, canvas.height);
      const result = detectMathBoxes(image, expected);
      attempts.push({angle, canvas, image, ...result});
    }
    attempts.sort((a, b) => b.quality - a.quality);
    const best = attempts[0];
    if (!best || best.boxes.length !== expected || best.quality < 0) {
      throw new Error(`第${pageIndex + 1}面の解答欄を${expected}個すべて特定できませんでした。用紙の端を切らず、黒い基準四角が全部入るように撮り直してください。`);
    }

    $("workingText").textContent = "数学専用の判定基準で鉛筆のマークを読んでいます…";
    await nextFrame();
    const questionNumbers = TEMPLATES[subject].pages[pageIndex];
    const questions = best.boxes.map((box, i) => ({
      number: questionNumbers[i],
      answers: readMathBlock(best.image, box)
    }));
    let aiStatus = "not-used";
    let aiMessage = "AI照合は使用していません。";
    if ($("aiAssist").checked && aiConfigured()) {
      $("workingText").textContent = "解答欄だけをGeminiで照合しています…";
      await nextFrame();
      try {
        const blocks = best.boxes.map((box, i) => ({
          question: questionNumbers[i],
          ...cropMathBlock(best.canvas, box)
        }));
        const aiQuestions = await window.MarkReaderAI.analyzeMathPage({
          subject,
          pageNumber: pageIndex + 1,
          blocks
        });
        const comparison = reconcileMathAnswers(questions, aiQuestions);
        aiStatus = comparison.disagreed ? "partial" : "verified";
        aiMessage = comparison.disagreed
          ? `Geminiと${comparison.disagreed}欄で不一致です。赤色の欄を確認してください。`
          : `Geminiと${comparison.agreed}欄で一致しました。`;
      } catch (error) {
        aiStatus = "failed";
        aiMessage = `Gemini照合に失敗したため端末内判定を使用しました。${error && error.message ? `（${error.message}）` : ""}`;
      }
    }
    pageData.push({
      questions,
      preview: makePreview(best.canvas, best.boxes, questionNumbers.map(n => `第${n}問`)),
      fileName,
      angle: best.angle,
      pageNumber: pageIndex + 1,
      aiStatus,
      aiMessage
    });
    pageIndex++;
    if (pageIndex < TEMPLATES[subject].pages.length) showCapture();
    else finishMath();
  }

  function grayAt(data, i) {
    return (data[i] * 77 + data[i + 1] * 150 + data[i + 2] * 29) >> 8;
  }

  /*
   * 国語・通常型は、精度が確認できた v2 の検出条件と座標を維持する。
   * 数学側の調整がこの処理へ影響しないよう、関数も完全に分離している。
   */
  function detectStandardComponents(image) {
    const {width: w, height: h, data} = image;
    const dark = new Uint8Array(w * h);
    for (let p = 0, i = 0; p < dark.length; p++, i += 4) {
      dark[p] = grayAt(data, i) < 72 ? 1 : 0;
    }
    const seen = new Uint8Array(w * h);
    const queue = new Int32Array(w * h);
    const found = [];
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const seed = y * w + x;
      if (!dark[seed] || seen[seed]) continue;
      let head = 0, tail = 1, area = 0, minX = x, maxX = x, minY = y, maxY = y;
      queue[0] = seed;
      seen[seed] = 1;
      while (head < tail) {
        const q = queue[head++], qx = q % w, qy = (q / w) | 0;
        area++;
        if (qx < minX) minX = qx;
        if (qx > maxX) maxX = qx;
        if (qy < minY) minY = qy;
        if (qy > maxY) maxY = qy;
        for (const n of [q - 1, q + 1, q - w, q + w]) {
          if (n > 0 && n < dark.length && !seen[n] && dark[n]) {
            seen[n] = 1;
            queue[tail++] = n;
          }
        }
      }
      const bw = maxX - minX + 1, bh = maxY - minY + 1;
      const fill = area / (bw * bh), aspect = bw / bh;
      if (area >= 35 && area <= 5000 && bw >= 7 && bh >= 7 &&
          aspect > .62 && aspect < 1.6 && fill > .48 &&
          bw < w * .045 && bh < h * .07) {
        found.push({x: (minX + maxX) / 2, y: (minY + maxY) / 2, w: bw, h: bh, area, fill});
      }
    }
    return found;
  }

  function detectStandardBoxes(image) {
    const {width: w, height: h} = image;
    const c = detectStandardComponents(image);
    const quads = [];
    for (let i = 0; i < c.length; i++) for (let j = i + 1; j < c.length; j++) {
      let tl = c[i], tr = c[j];
      if (tl.x > tr.x) [tl, tr] = [tr, tl];
      const dx = tr.x - tl.x;
      if (dx < w * .12 || dx > w * .20 || Math.abs(tr.y - tl.y) > h * .035 ||
          ((tl.y + tr.y) / 2) > h * .22) continue;
      for (const bl of c) {
        const tall = bl.y - tl.y;
        if (tall < h * .62 || tall > h * 1.02 || Math.abs(bl.x - tl.x) > w * .04) continue;
        const predicted = {x: bl.x + (tr.x - tl.x), y: bl.y + (tr.y - tl.y), w: tr.w, h: tr.h};
        const br = c.reduce((best, p) => {
          const distance = Math.hypot(p.x - predicted.x, (p.y - predicted.y) * 1.4);
          return distance < (best.distance || w * .055) ? {...p, distance} : best;
        }, predicted);
        delete br.distance;
        const centerX = (tl.x + tr.x + bl.x + br.x) / 4;
        if (centerX < w * .48) continue;
        const size = [tl, tr, bl, br].reduce((sum, p) => sum + p.w + p.h, 0) / 8;
        const widthChange = Math.abs((br.x - bl.x) - dx);
        quads.push({tl, tr, br, bl, centerX, score: tall * 2 + size * 3 - widthChange * 3});
      }
    }
    quads.sort((a, b) => b.score - a.score);
    const picked = [];
    for (const q of quads) {
      if (picked.every(p => Math.abs(p.centerX - q.centerX) > w * .12)) picked.push(q);
      if (picked.length === 2) break;
    }
    return picked;
  }

  function detectMathComponents(image) {
    const {width: w, height: h, data} = image;
    const rawDark = new Uint8Array(w * h);
    for (let p = 0, i = 0; p < rawDark.length; p++, i += 4) {
      const max = Math.max(data[i], data[i + 1], data[i + 2]);
      const min = Math.min(data[i], data[i + 1], data[i + 2]);
      rawDark[p] = grayAt(data, i) < 120 && max - min < 70 ? 1 : 0;
    }
    /*
     * 解答欄の黒四角が罫線へ接触して一つの巨大成分になる写真がある。
     * 3×3 の収縮で細い罫線だけを落としてから成分を取る。
     */
    const dark = new Uint8Array(w * h);
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      let neighbors = 0;
      for (let yy = -1; yy <= 1; yy++) for (let xx = -1; xx <= 1; xx++) {
        neighbors += rawDark[p + yy * w + xx];
      }
      dark[p] = neighbors >= 8 ? 1 : 0;
    }
    const seen = new Uint8Array(w * h);
    const queue = new Int32Array(w * h);
    const found = [];
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const seed = y * w + x;
      if (!dark[seed] || seen[seed]) continue;
      let head = 0, tail = 1, area = 0, minX = x, maxX = x, minY = y, maxY = y;
      queue[0] = seed;
      seen[seed] = 1;
      while (head < tail) {
        const q = queue[head++], qx = q % w, qy = (q / w) | 0;
        area++;
        minX = Math.min(minX, qx);
        maxX = Math.max(maxX, qx);
        minY = Math.min(minY, qy);
        maxY = Math.max(maxY, qy);
        for (const n of [q - 1, q + 1, q - w, q + w]) {
          if (n > 0 && n < dark.length && !seen[n] && dark[n]) {
            seen[n] = 1;
            queue[tail++] = n;
          }
        }
      }
      const bw = maxX - minX + 1, bh = maxY - minY + 1;
      const fill = area / (bw * bh), aspect = bw / bh;
      if (area >= 8 && area <= 12000 && bw >= 3 && bh >= 3 &&
          aspect > .45 && aspect < 2.2 && fill > .32 &&
          bw < w * .055 && bh < h * .09) {
        found.push({
          x: (minX + maxX) / 2,
          y: (minY + maxY) / 2,
          w: bw,
          h: bh,
          area,
          fill
        });
      }
    }
    return found;
  }

  function detectMathBoxes(image, expected) {
    const {width: w, height: h} = image;
    const components = detectMathComponents(image);
    const squareCandidates = components.filter(p => {
      const aspect = p.w / p.h;
      return p.fill >= .84 && aspect >= .65 && aspect <= 1.55 &&
        p.w >= 7 && p.h >= 7 && p.y < h * .22;
    });

    const rows = [];
    for (const seed of squareCandidates) {
      const row = squareCandidates
        .filter(p => Math.abs(p.y - seed.y) <= h * .014)
        .sort((a, b) => a.x - b.x);
      const unique = [];
      for (const p of row) {
        if (!unique.length || Math.abs(unique[unique.length - 1].x - p.x) > w * .008) {
          unique.push(p);
        } else if (p.fill * p.area > unique[unique.length - 1].fill * unique[unique.length - 1].area) {
          unique[unique.length - 1] = p;
        }
      }
      if (unique.length >= expected * 2) rows.push(unique);
    }
    if (!rows.length) return {boxes: [], quality: -Infinity, reason: "top-row"};

    let topMarkers = null;
    let topScore = -Infinity;
    for (const row of rows) {
      const chooseMarkers = (start, picked) => {
        if (picked.length === expected * 2) {
          const inside = [];
          const between = [];
          for (let i = 0; i < expected; i++) inside.push(picked[i * 2 + 1].x - picked[i * 2].x);
          for (let i = 0; i < expected - 1; i++) between.push(picked[i * 2 + 2].x - picked[i * 2 + 1].x);
          if (inside.some(g => g < w * .14 || g > w * .22)) return;
          if (between.some(g => g < w * .006 || g > w * .07)) return;
          const spread = values => values.length ? Math.max(...values) - Math.min(...values) : 0;
          const sizes = picked.map(p => (p.w + p.h) / 2);
          const score = picked.reduce((s, p) => s + p.fill * 30 + Math.sqrt(p.area), 0) -
            spread(inside) / w * 800 -
            spread(picked.map(p => p.y)) / h * 1000 -
            spread(sizes) * 2;
          if (score > topScore) {
            topScore = score;
            topMarkers = picked.slice();
          }
          return;
        }
        for (let i = start; i <= row.length - (expected * 2 - picked.length); i++) {
          chooseMarkers(i + 1, [...picked, row[i]]);
        }
      };
      chooseMarkers(0, []);
    }
    if (!topMarkers) return {boxes: [], quality: -Infinity, reason: "top-layout"};

    const markerSize = topMarkers.reduce((sum, p) => sum + (p.w + p.h) / 2, 0) / topMarkers.length;
    const bottomMarkers = findBottomMarkers(image, topMarkers, markerSize);
    if (bottomMarkers.some(marker => !marker || marker.density < .68)) {
      return {boxes: [], quality: -Infinity, reason: "bottom-density", debug: {topMarkers, bottomMarkers}};
    }
    const bottomSpread = Math.max(...bottomMarkers.map(p => p.y)) - Math.min(...bottomMarkers.map(p => p.y));
    if (bottomSpread > h * .055) {
      return {boxes: [], quality: -Infinity, reason: "bottom-row", debug: {topMarkers, bottomMarkers, bottomSpread}};
    }

    const boxes = [];
    for (let i = 0; i < expected; i++) {
      const tl = topMarkers[i * 2], tr = topMarkers[i * 2 + 1];
      const bl = bottomMarkers[i * 2], br = bottomMarkers[i * 2 + 1];
      const topWidth = tr.x - tl.x, bottomWidth = br.x - bl.x;
      const leftHeight = bl.y - tl.y, rightHeight = br.y - tr.y;
      const ratio = ((leftHeight + rightHeight) / 2) / ((topWidth + bottomWidth) / 2);
      const widthError = Math.abs(bottomWidth - topWidth) / topWidth;
      const heightError = Math.abs(rightHeight - leftHeight) / Math.max(1, leftHeight);
      if (ratio < 2.25 || ratio > 3.45 || widthError > .2 || heightError > .08) {
        return {boxes: [], quality: -Infinity, reason: "geometry", debug: {topMarkers, bottomMarkers, ratio, widthError, heightError}};
      }
      boxes.push({
        tl, tr, br, bl,
        centerX: (tl.x + tr.x + br.x + bl.x) / 4,
        centerY: (tl.y + tr.y + br.y + bl.y) / 4,
        width: (topWidth + bottomWidth) / 2,
        height: (leftHeight + rightHeight) / 2,
        quality: 300 - widthError * 200 - heightError * 300
      });
    }
    const bottomDensity = bottomMarkers.reduce((sum, p) => sum + p.density, 0);
    return {boxes, quality: topScore + bottomDensity * 50};
  }

  function findBottomMarkers(image, topMarkers, markerSize) {
    const {width: w, height: h, data} = image;
    const half = Math.max(4, Math.round(markerSize * .4));
    const patchDensity = (x, y) => {
      let dark = 0, count = 0;
      for (let yy = y - half; yy <= y + half; yy++) {
        for (let xx = x - half; xx <= x + half; xx++) {
          const i = (yy * w + xx) * 4;
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const chroma = Math.max(r, g, b) - Math.min(r, g, b);
          if (grayAt(data, i) < 130 && chroma < 70) dark++;
          count++;
        }
      }
      return dark / count;
    };
    const bestAtY = (estimatedX, y) => {
      const minX = Math.max(half, Math.floor(estimatedX - w * .04));
      const maxX = Math.min(w - half - 1, Math.ceil(estimatedX + w * .04));
      let best = null;
      for (let x = minX; x <= maxX; x += 2) {
        const density = patchDensity(x, y);
        const score = density * 100 - Math.abs(x - estimatedX) / w * 55;
        if (!best || score > best.score) best = {x, y, density, score};
      }
      return best;
    };

    const topY = Math.max(...topMarkers.map(p => p.y));
    const minY = Math.max(half, Math.floor(topY + h * .72));
    const maxY = Math.min(h - half - 1, Math.ceil(topY + h * .99));
    let common = null;
    for (let y = minY; y <= maxY; y += 3) {
      const points = topMarkers.map(marker => bestAtY(marker.x, y));
      const densities = points.map(p => p.density);
      const minDensity = Math.min(...densities);
      const average = densities.reduce((sum, value) => sum + value, 0) / densities.length;
      const score = minDensity * 100 + average * 35 + y / h;
      if (!common || score > common.score) common = {y, score};
    }
    if (!common) return [];

    return topMarkers.map(marker => {
      let best = null;
      const lowY = Math.max(minY, common.y - Math.ceil(h * .018));
      const highY = Math.min(maxY, common.y + Math.ceil(h * .018));
      for (let y = lowY; y <= highY; y += 2) {
        const point = bestAtY(marker.x, y);
        const score = point.score - Math.abs(y - common.y) * .18;
        if (!best || score > best.score) {
          best = {...point, score, w: half * 2 + 1, h: half * 2 + 1, fill: point.density};
        }
      }
      return best;
    });
  }

  function homography(dst, src) {
    const a = [], b = [];
    for (let i = 0; i < 4; i++) {
      const {x, y} = dst[i], u = src[i].x, v = src[i].y;
      a.push([x,y,1,0,0,0,-u*x,-u*y]); b.push(u);
      a.push([0,0,0,x,y,1,-v*x,-v*y]); b.push(v);
    }
    for (let i = 0; i < 8; i++) {
      let pivot = i;
      for (let r = i + 1; r < 8; r++) if (Math.abs(a[r][i]) > Math.abs(a[pivot][i])) pivot = r;
      [a[i], a[pivot]] = [a[pivot], a[i]];
      [b[i], b[pivot]] = [b[pivot], b[i]];
      const d = a[i][i];
      if (Math.abs(d) < 1e-9) throw new Error("用紙の傾きを補正できませんでした。");
      for (let x = i; x < 8; x++) a[i][x] /= d;
      b[i] /= d;
      for (let r = 0; r < 8; r++) if (r !== i) {
        const f = a[r][i];
        for (let x = i; x < 8; x++) a[r][x] -= f * a[i][x];
        b[r] -= f * b[i];
      }
    }
    return [...b, 1];
  }

  function sourcePoint(h, x, y) {
    const z = h[6] * x + h[7] * y + 1;
    return {
      x: Math.round((h[0] * x + h[1] * y + h[2]) / z),
      y: Math.round((h[3] * x + h[4] * y + h[5]) / z)
    };
  }

  function sampleStandardDarkness(image, h, x, y, rx, ry) {
    let sum = 0, count = 0;
    for (let yy = Math.floor(y - ry); yy <= Math.ceil(y + ry); yy++) {
      for (let xx = Math.floor(x - rx); xx <= Math.ceil(x + rx); xx++) {
        if (((xx - x) / rx) ** 2 + ((yy - y) / ry) ** 2 > 1) continue;
        const p = sourcePoint(h, xx, yy);
        if (p.x < 0 || p.y < 0 || p.x >= image.width || p.y >= image.height) continue;
        sum += 255 - grayAt(image.data, (p.y * image.width + p.x) * 4);
        count++;
      }
    }
    return count ? sum / count : 0;
  }

  function readStandardBlock(image, box, block) {
    const W = 600, H = 1800;
    const h = homography(
      [{x:0,y:0},{x:W,y:0},{x:W,y:H},{x:0,y:H}],
      [box.tl,box.tr,box.br,box.bl]
    );
    const out = [];
    for (let row = 0; row < 30; row++) {
      const y = 84 + row * (1790 - 84) / 29;
      const scores = [];
      for (let choice = 0; choice < 9; choice++) {
        scores.push(sampleStandardDarkness(image, h, 163 + choice * 48.3, y, 14, 20));
      }
      const ranked = scores.map((score, i) => ({score, i})).sort((a, b) => b.score - a.score);
      const baseline = scores.slice().sort((a, b) => a - b)[4];
      const lift = ranked[0].score - baseline;
      const gap = ranked[0].score - ranked[1].score;
      let state = "ok", value = ranked[0].i + 1;
      if (ranked[0].score < 52 || lift < 20) { state = "blank"; value = ""; }
      else if (gap < 12) state = "warn";
      out.push({number: block * 30 + row + 1, value, state, best: ranked[0].score, gap});
    }
    return out;
  }

  function sampleMathInk(image, h, x, y, rx, ry) {
    const inner = [];
    const background = [];
    const outerX = rx + 7, outerY = ry + 7;
    for (let yy = Math.floor(y - outerY); yy <= Math.ceil(y + outerY); yy++) {
      for (let xx = Math.floor(x - outerX); xx <= Math.ceil(x + outerX); xx++) {
        const p = sourcePoint(h, xx, yy);
        if (p.x < 0 || p.y < 0 || p.x >= image.width || p.y >= image.height) continue;
        const i = (p.y * image.width + p.x) * 4;
        const r = image.data[i], g = image.data[i + 1], b = image.data[i + 2];
        const gray = grayAt(image.data, i);
        const chroma = Math.max(r, g, b) - Math.min(r, g, b);
        if (chroma >= 65) continue;
        const ellipse = ((xx - x) / rx) ** 2 + ((yy - y) / ry) ** 2;
        if (ellipse <= 1) inner.push(gray);
        else if (Math.abs(xx - x) >= rx + 3 || Math.abs(yy - y) >= ry + 3) background.push(gray);
      }
    }
    if (!inner.length || !background.length) return {mean: 0, density: 0};
    background.sort((a, b) => a - b);
    const trim = Math.floor(background.length * .15);
    const bg = background.slice(trim, background.length - trim);
    const backgroundMean = bg.reduce((sum, value) => sum + value, 0) / bg.length;
    const innerMean = inner.reduce((sum, value) => sum + value, 0) / inner.length;
    const density = inner.filter(value => value < backgroundMean - 34).length / inner.length;
    return {mean: Math.max(0, backgroundMean - innerMean), density};
  }

  function readMathBlock(image, box) {
    const W = 600, H = 1800;
    const h = homography(
      [{x:0,y:0},{x:W,y:0},{x:W,y:H},{x:0,y:H}],
      [box.tl,box.tr,box.br,box.bl]
    );
    const sampleRows = [];
    for (let row = 0; row < 30; row++) {
      const y = 94 + row * (1760 - 94) / 29;
      sampleRows.push(Array.from({length: 10}, (_, choice) =>
        sampleMathInk(image, h, 142 + choice * 44, y, 13, 18)
      ));
    }
    const rawRows = sampleRows.map(samples => samples.map(s => s.mean + s.density * 120));
    const columnBaselines = Array.from({length: 10}, (_, choice) => {
      const values = rawRows.map(row => row[choice]).sort((a, b) => a - b);
      return values[12];
    });
    const out = [];
    for (let row = 0; row < 30; row++) {
      const corrected = rawRows[row].map((score, choice) => score - columnBaselines[choice]);
      const rowSorted = corrected.slice().sort((a, b) => a - b);
      const rowBaseline = (rowSorted[4] + rowSorted[5]) / 2;
      const scores = corrected.map(score => score - rowBaseline);
      const ranked = scores.map((score, i) => ({score, i, sample: sampleRows[row][i]}))
        .sort((a, b) => b.score - a.score);
      const lift = ranked[0].score;
      const gap = ranked[0].score - ranked[1].score;
      let state = "ok", value = ranked[0].i;
      if (ranked[0].sample.density < .18 || lift < 10 || ranked[0].sample.mean < 10) {
        state = "blank";
        value = "";
      } else if (ranked[0].sample.density < .34 || gap < 9 || lift < 25) {
        state = "warn";
      }
      out.push({
        symbol: KANA[row],
        value,
        state,
        best: ranked[0].score,
        gap,
        density: ranked[0].sample.density
      });
    }
    return out;
  }

  function makePreview(source, boxes, labels) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = source.width;
    canvas.height = source.height;
    ctx.drawImage(source, 0, 0);
    ctx.strokeStyle = "#1769ff";
    ctx.fillStyle = "#1769ff";
    ctx.lineWidth = Math.max(3, source.width / 450);
    ctx.font = `bold ${Math.max(18, source.width / 55)}px sans-serif`;
    boxes.forEach((q, i) => {
      ctx.beginPath();
      ctx.moveTo(q.tl.x, q.tl.y);
      ctx.lineTo(q.tr.x, q.tr.y);
      ctx.lineTo(q.br.x, q.br.y);
      ctx.lineTo(q.bl.x, q.bl.y);
      ctx.closePath();
      ctx.stroke();
      ctx.fillText(labels[i], q.tl.x, Math.max(20, q.tl.y - 8));
    });
    return canvas.toDataURL("image/jpeg", .82);
  }

  function cropMathBlock(source, box) {
    const xs = [box.tl.x, box.tr.x, box.br.x, box.bl.x];
    const ys = [box.tl.y, box.tr.y, box.br.y, box.bl.y];
    const padX = Math.max(8, source.width * .008);
    const padY = Math.max(8, source.height * .006);
    const sx = Math.max(0, Math.floor(Math.min(...xs) - padX));
    const sy = Math.max(0, Math.floor(Math.min(...ys) - padY));
    const ex = Math.min(source.width, Math.ceil(Math.max(...xs) + padX));
    const ey = Math.min(source.height, Math.ceil(Math.max(...ys) + padY));
    const sw = Math.max(1, ex - sx);
    const sh = Math.max(1, ey - sy);
    const scale = Math.min(1.5, 1400 / Math.max(sw, sh));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(sw * scale));
    canvas.height = Math.max(1, Math.round(sh * scale));
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    return {
      mimeType: "image/jpeg",
      data: canvas.toDataURL("image/jpeg", .88).split(",")[1]
    };
  }

  function reconcileMathAnswers(questions, aiQuestions) {
    const aiByQuestion = new Map(aiQuestions.map(question => [question.question, question]));
    let agreed = 0, disagreed = 0;
    questions.forEach(question => {
      const aiQuestion = aiByQuestion.get(question.number);
      if (!aiQuestion) return;
      const aiBySymbol = new Map(aiQuestion.answers.map(answer => [answer.symbol, answer]));
      question.answers.forEach(answer => {
        const ai = aiBySymbol.get(answer.symbol);
        if (!ai) return;
        const localValue = answer.value === "" ? -1 : answer.value;
        answer.localValue = localValue;
        answer.aiValue = ai.value;
        answer.aiConfidence = ai.confidence;
        if (localValue === ai.value) {
          agreed++;
          answer.aiMatched = true;
          if (localValue >= 0 && ai.confidence === "high") {
            answer.state = "ok";
          }
          return;
        }
        disagreed++;
        answer.aiMatched = false;
        answer.state = "warn";
      });
    });
    return {agreed, disagreed};
  }

  function finishStandard() {
    const counts = countStates(standardAnswers);
    $("summary").textContent = `国語・通常型・読取済み ${counts.ok}問・要確認 ${counts.warn}問・未記入 ${counts.blank}問`;
    $("selectionPanel").classList.add("hidden");
    $("aiResultStatus").classList.add("hidden");
    $("mathResults").classList.add("hidden");
    $("standardResults").classList.remove("hidden");
    $("standardResults").innerHTML = standardAnswers.map(a => `
      <div class="answer ${a.state}" title="判定差 ${a.gap.toFixed(1)}">
        <label for="a${a.number}">${a.number}</label>
        <select id="a${a.number}" data-index="${a.number - 1}" aria-label="${a.number}番">
          <option value="">—</option>
          ${Array.from({length: 9}, (_, i) => `<option value="${i + 1}"${a.value === i + 1 ? " selected" : ""}>${i + 1}</option>`).join("")}
        </select>
      </div>`).join("");
    $("standardResults").querySelectorAll("select").forEach(select => {
      select.onchange = () => {
        const answer = standardAnswers[+select.dataset.index];
        answer.value = select.value ? +select.value : "";
        answer.state = select.value ? "ok" : "blank";
        select.parentElement.className = `answer ${answer.state}`;
      };
    });
    renderPreviews();
    $("copyStatus").textContent = "";
    show("resultCard");
  }

  function finishMath() {
    const questions = pageData.flatMap(p => p.questions);
    const counts = countStates(questions.flatMap(q => q.answers));
    $("summary").textContent = `${TEMPLATES[subject].name}・読取済み ${counts.ok}欄・要確認 ${counts.warn}欄・未記入 ${counts.blank}欄`;
    const aiPages = pageData.filter(page => page.aiStatus && page.aiStatus !== "not-used");
    if (aiPages.length) {
      const failed = aiPages.some(page => page.aiStatus === "failed");
      const partial = aiPages.some(page => page.aiStatus === "partial");
      $("aiResultStatus").className = `ai-result-status ${failed ? "failed" : partial ? "partial" : "verified"}`;
      $("aiResultStatus").textContent = aiPages.map(page =>
        `第${page.pageNumber}面：${page.aiMessage}`
      ).join(" ");
    } else {
      $("aiResultStatus").classList.add("hidden");
    }
    if (subject === "math2") {
      const activity = questions.filter(q => q.number >= 4).map(q => ({
        number: q.number,
        confident: q.answers.filter(a => a.value !== "" && a.state === "ok").length,
        total: q.answers.filter(a => a.value !== "").length
      })).sort((a, b) => b.confident - a.confident || b.total - a.total || a.number - b.number);
      selectedQuestions = new Set(activity.slice(0, 3).map(x => x.number));
      renderSelection();
    } else {
      $("selectionPanel").classList.add("hidden");
    }
    $("standardResults").classList.add("hidden");
    $("mathResults").classList.remove("hidden");
    $("mathResults").innerHTML = questions.map(renderQuestion).join("");
    $("mathResults").querySelectorAll("select").forEach(select => {
      select.onchange = () => {
        const question = questions.find(x => x.number === +select.dataset.question);
        const answer = question.answers[+select.dataset.row];
        answer.value = select.value === "" ? "" : +select.value;
        answer.state = select.value === "" ? "blank" : "ok";
        select.closest(".answer").className = `answer ${answer.state}`;
      };
    });
    renderPreviews();
    $("copyStatus").textContent = "";
    show("resultCard");
  }

  function countStates(items) {
    return items.reduce((counts, item) => {
      counts[item.state]++;
      return counts;
    }, {ok: 0, warn: 0, blank: 0});
  }

  function renderQuestion(question) {
    const isChoice = subject === "math2" && question.number >= 4;
    const selected = !isChoice || selectedQuestions.has(question.number);
    return `
      <section class="question${selected ? "" : " unselected"}" data-question="${question.number}">
        <h3>第${question.number}問${isChoice ? ` <span>${selected ? "選択" : "未選択"}</span>` : ""}</h3>
        <div class="answers">
          ${question.answers.map((answer, row) => `
            <div class="answer ${answer.state}" title="${answerTitle(answer)}">
              <label>${answer.symbol}</label>
              <select data-question="${question.number}" data-row="${row}" aria-label="第${question.number}問 ${answer.symbol}">
                <option value="">—</option>
                ${Array.from({length: 10}, (_, i) => `<option value="${i}"${answer.value === i ? " selected" : ""}>${i}</option>`).join("")}
              </select>
              ${answer.aiMatched === false ? `<small class="ai-note">端末:${displayValue(answer.localValue)} AI:${displayValue(answer.aiValue)}</small>` : ""}
            </div>`).join("")}
        </div>
      </section>`;
  }

  function displayValue(value) {
    return value === -1 || value === "" ? "空欄" : value;
  }

  function answerTitle(answer) {
    const base = `濃度 ${(answer.density * 100).toFixed(1)}%・判定差 ${answer.gap.toFixed(1)}`;
    if (answer.aiMatched === true) return `${base}・Geminiと一致`;
    if (answer.aiMatched === false) {
      return `${base}・端末 ${displayValue(answer.localValue)}・Gemini ${displayValue(answer.aiValue)}（${answer.aiConfidence}）`;
    }
    return base;
  }

  function renderSelection() {
    $("selectionPanel").classList.remove("hidden");
    $("selectionButtons").innerHTML = [4,5,6,7].map(n =>
      `<button type="button" data-number="${n}" class="${selectedQuestions.has(n) ? "selected" : ""}">第${n}問</button>`
    ).join("");
    $("selectionButtons").querySelectorAll("button").forEach(button => {
      button.onclick = () => {
        const n = +button.dataset.number;
        if (selectedQuestions.has(n)) selectedQuestions.delete(n);
        else if (selectedQuestions.size < 3) selectedQuestions.add(n);
        else {
          $("copyStatus").textContent = "選択できる大問は3問です。";
          return;
        }
        renderSelectionState();
      };
    });
  }

  function renderSelectionState() {
    renderSelection();
    document.querySelectorAll(".question[data-question]").forEach(element => {
      const number = +element.dataset.question;
      if (number < 4) return;
      const selected = selectedQuestions.has(number);
      element.classList.toggle("unselected", !selected);
      element.querySelector("h3 span").textContent = selected ? "選択" : "未選択";
    });
  }

  function renderPreviews() {
    $("previews").innerHTML = pageData.map((page, i) => `
      <figure>
        <figcaption>${subject === "standard" ? "検出結果" : `第${i + 1}面の検出結果`}</figcaption>
        <img src="${page.preview}" alt="${subject === "standard" ? "検出結果" : `第${i + 1}面の検出結果`}">
      </figure>`).join("");
  }

  $("copyButton").onclick = async () => {
    let text;
    if (subject === "standard") {
      text = standardAnswers.map(a => a.value || "").join("");
    } else {
      if (subject === "math2" && selectedQuestions.size !== 3) {
        $("copyStatus").textContent = "選択した大問を3問にしてください。";
        return;
      }
      text = pageData.flatMap(p => p.questions)
        .filter(q => subject !== "math2" || q.number < 4 || selectedQuestions.has(q.number))
        .flatMap(q => q.answers)
        .map(a => a.value)
        .join("");
    }
    try {
      await navigator.clipboard.writeText(text);
      $("copyStatus").textContent = `${TEMPLATES[subject].name}の解答番号をコピーしました。`;
    } catch (_) {
      $("copyStatus").textContent = `コピーできませんでした：${text}`;
    }
  };

  // 実物写真を使う回帰テストから、検出結果と判定値だけを参照する。
  window.__markReaderDebug = {
    detectStandardBoxes,
    detectMathBoxes,
    detectMathComponents,
    readStandardBlock,
    readMathBlock,
    reconcileMathAnswers
  };
})();
