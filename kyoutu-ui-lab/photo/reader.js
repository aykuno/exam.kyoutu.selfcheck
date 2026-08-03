(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const TEMPLATES = {
    standard: {
      name: "国語・通常型",
      help: "国語で精度を確認できた従来の読取処理をそのまま使用します。",
      pages: [[1, 2]],
      standard: true
    },
    math1: {
      name: "数学①",
      help: "第1面と第2面を順に撮影し、Geminiで解答欄を読み取ります。",
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
  let photoAnswerKey = null;
  let pendingPhoto = null;
  let lastGrade = null;
  let answerKeyPhotoRun = 0;
  let photoContext = null;
  const ANSWER_STORE = "ct-mark-reader-photo-answers-v2";

  function setOuterStage(stage) {
    window.__photoFlowStage = stage;
    if (window.UILabPhotoNavigation && typeof window.UILabPhotoNavigation.setStage === "function") {
      window.UILabPhotoNavigation.setStage(stage);
    }
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function selectedAnswerKey() {
    return photoAnswerKey;
  }

  function subjectStoreKey() {
    return photoContext?.signature
      ? `photo||${photoContext.signature}`
      : `photo||${subject}`;
  }

  function activeSubjectLabel() {
    return photoContext?.subject || TEMPLATES[subject].name;
  }

  function templateDisplayName() {
    if (subject === "standard" && photoContext?.subject && !photoContext.subject.includes("国語")) {
      return "通常型";
    }
    return TEMPLATES[subject].name;
  }

  function templateDescription() {
    if (subject === "standard") return `${templateDisplayName()}・1〜60・片面`;
    if (subject === "math1") return "数学①・第1面＋第2面";
    return "数学②・両面・選択問題";
  }

  function readAnswerStore() {
    try {
      const value = JSON.parse(localStorage.getItem(ANSWER_STORE) || "{}");
      return value && value.version === 2 && value.entries && typeof value.entries === "object"
        ? value
        : {version: 2, entries: {}};
    } catch (_) {
      return {version: 2, entries: {}};
    }
  }

  function savedEntry() {
    return readAnswerStore().entries[subjectStoreKey()] || null;
  }

  function formatSavedTime(value) {
    try {
      return new Date(value).toLocaleString("ja-JP", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });
    } catch (_) {
      return "";
    }
  }

  function refreshSavedUi() {
    const entry = savedEntry();
    $("savedResumePanel").classList.toggle("hidden", !entry);
    if (!entry) return;
    const count = entry.subject === "standard"
      ? (entry.standardAnswers || []).filter(answer => answer.value !== "").length
      : (entry.mathQuestions || []).flatMap(question => question.answers || [])
        .filter(answer => answer.value !== "").length;
    $("savedResumeText").textContent =
      `${formatSavedTime(entry.updatedAt)}更新・${count}欄入力済み`;
  }

  function answerSnapshot() {
    const entry = {
      version: 2,
      keySignature: subjectStoreKey(),
      subject,
      updatedAt: new Date().toISOString(),
      selectedQuestions: [...selectedQuestions].sort((a, b) => a - b),
      photoAnswerKey
    };
    if (subject === "standard") {
      entry.standardAnswers = standardAnswers.map(answer => ({
        number: Number(answer.number),
        value: answer.value === "" ? "" : Number(answer.value),
        state: answer.state === "warn" ? "warn" : answer.value === "" ? "blank" : "ok"
      }));
    } else {
      entry.mathQuestions = pageData.flatMap(page => page.questions || []).map(question => ({
        number: Number(question.number),
        answers: (question.answers || []).map(answer => ({
          symbol: answer.symbol,
          value: answer.value || "",
          state: answer.state === "warn" ? "warn" : answer.value === "" ? "blank" : "ok",
          aiConfidence: answer.aiConfidence || ""
        }))
      }));
    }
    if (lastGrade) {
      entry.lastScore = lastGrade.score;
      entry.maxScore = lastGrade.maxScore;
    }
    return entry;
  }

  function saveAnswers() {
    const entry = answerSnapshot();
    if (!entry) return;
    try {
      const store = readAnswerStore();
      store.entries[entry.keySignature] = entry;
      localStorage.setItem(ANSWER_STORE, JSON.stringify(store));
      $("autosaveStatus").textContent =
        `解答番号をこの端末に自動保存しました（${formatSavedTime(entry.updatedAt)}）。`;
      refreshSavedUi();
    } catch (error) {
      $("autosaveStatus").textContent = "この端末へ解答番号を保存できませんでした。";
      console.error("answer autosave failed", error);
    }
  }

  function updateStartAvailability() {
    const readerReady = subject === "standard" || aiConfigured();
    $("startButton").disabled = !readerReady;
    updateAnswerKeyPhotoAvailability();
  }

  function updateAnswerKeyPhotoAvailability() {
    const hasAnswers = subject === "standard"
      ? standardAnswers.length > 0
      : pageData.some(page => (page.questions || []).length);
    const available = hasAnswers && aiConfigured();
    $("answerKeyPhotoInput").disabled = !available;
    $("answerKeyPhotoButton").classList.toggle("disabled", !available);
  }

  function clearAnswerKeyPhotoResult() {
    answerKeyPhotoRun++;
    $("answerKeyPhotoStatus").className = "answer-key-photo-status";
    $("answerKeyPhotoStatus").textContent = "";
    $("answerKeyPhotoResult").classList.add("hidden");
    $("answerKeyPhotoResult").innerHTML = "";
  }

  function aiConfigured() {
    return Boolean(window.MarkReaderAI && window.MarkReaderAI.isConfigured());
  }

  function updateAiAvailability() {
    const available = aiConfigured();
    $("aiOption").classList.toggle("disabled", !available);
    $("aiAvailability").className = `ai-availability ${available ? "ready" : "unavailable"}`;
    $("aiAvailability").textContent = available
      ? "AI読取を利用できます。解答欄の切抜きだけを送信します。"
      : "AI読取を準備できませんでした。ページを再読み込みしてください。";
    updateStartAvailability();
  }

  function updateSubjectUi() {
    document.querySelectorAll(".subject").forEach(button =>
      button.classList.toggle("selected", button.dataset.subject === subject)
    );
    $("startButton").textContent = subject === "standard"
      ? `${templateDisplayName()}を撮影する`
      : `${TEMPLATES[subject].name} 第1面を撮影する`;
    $("photoContextExam").textContent = photoContext?.examText || "写真同士で照合";
    $("photoContextSubject").textContent = activeSubjectLabel();
    $("photoSheetSubject").textContent = activeSubjectLabel();
    $("photoSheetExam").textContent = photoContext?.examText || "";
    $("photoSheetTemplate").textContent = `対応用紙：${templateDescription()}`;
    $("setupHelp").textContent = TEMPLATES[subject].help;
    $("aiOption").classList.toggle("hidden", subject === "standard");
    photoAnswerKey = null;
    clearAnswerKeyPhotoResult();
    refreshSavedUi();
    if (subject !== "standard") updateAiAvailability();
    else updateStartAvailability();
    setOuterStage("capture");
  }

  document.querySelectorAll(".subject").forEach(button => {
    button.onclick = () => {
      subject = button.dataset.subject;
      clearAnswerKeyPhotoResult();
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
  $("resumeButton").onclick = restoreSavedAnswers;
  $("qualityRetakeButton").onclick = () => {
    pendingPhoto = null;
    showCapture();
  };
  $("qualityUseButton").onclick = () => {
    if (!pendingPhoto) return showCapture();
    const photo = pendingPhoto;
    pendingPhoto = null;
    processPageCanvas(photo.canvas, photo.fileName);
  };
  $("pdfButton").onclick = exportPdf;
  $("fileInput").onchange = () => {
    const file = $("fileInput").files && $("fileInput").files[0];
    if (file) readPage(file);
    $("fileInput").value = "";
  };
  $("answerKeyPhotoInput").onchange = () => {
    const files = [...($("answerKeyPhotoInput").files || [])];
    $("answerKeyPhotoInput").value = "";
    if (files.length) compareAnswerKeyPhotos(files);
  };

  function begin() {
    if (subject !== "standard" && !aiConfigured()) {
      $("errorText").textContent = "数学のAI読取を準備できませんでした。通信状態を確認してページを再読み込みしてください。";
      show("errorCard");
      return;
    }
    pageIndex = 0;
    pageData = [];
    standardAnswers = [];
    selectedQuestions.clear();
    photoAnswerKey = null;
    pendingPhoto = null;
    clearAnswerKeyPhotoResult();
    clearGrade();
    setOuterStage("capture");
    showCapture();
  }

  function reset() {
    pageIndex = 0;
    pageData = [];
    standardAnswers = [];
    selectedQuestions.clear();
    photoAnswerKey = null;
    pendingPhoto = null;
    clearAnswerKeyPhotoResult();
    clearGrade();
    refreshSavedUi();
    setOuterStage("capture");
    show("setupCard");
  }

  function restoreSavedAnswers() {
    const entry = savedEntry();
    if (!entry || entry.subject !== subject) {
      refreshSavedUi();
      return;
    }
    pageIndex = TEMPLATES[subject].pages.length;
    pendingPhoto = null;
    clearGrade();
    photoAnswerKey = entry.photoAnswerKey && Array.isArray(entry.photoAnswerKey.questions)
      ? entry.photoAnswerKey
      : null;
    if (subject === "standard") {
      standardAnswers = (entry.standardAnswers || []).map(answer => ({
        number: Number(answer.number),
        value: answer.value === "" ? "" : Number(answer.value),
        state: answer.state === "warn" ? "warn" : answer.value === "" ? "blank" : "ok",
        best: 0,
        gap: 0
      }));
      pageData = [];
      if (!standardAnswers.length) return;
      finishStandard();
      return;
    }
    standardAnswers = [];
    selectedQuestions = new Set((entry.selectedQuestions || []).map(Number));
    const questions = (entry.mathQuestions || []).map(question => ({
      number: Number(question.number),
      answers: (question.answers || []).map(answer => ({
        symbol: answer.symbol,
        value: answer.value || "",
        state: answer.state === "warn" ? "warn" : answer.value === "" ? "blank" : "ok",
        aiConfidence: answer.aiConfidence || ""
      }))
    }));
    if (!questions.length) return;
    pageData = [{questions}];
    finishMath(true);
  }

  function show(id) {
    ["setupCard","captureCard","qualityCard","workingCard","errorCard","resultCard"]
      .forEach(x => $(x).classList.toggle("hidden", x !== id));
  }

  function showCapture() {
    const standard = subject === "standard";
    $("stepIndicator").classList.toggle("hidden", standard);
    $("captureTitle").textContent = standard
      ? `${templateDisplayName()}を撮影`
      : `${TEMPLATES[subject].name} 第${pageIndex + 1}面を撮影`;
    $("captureHelp").textContent = standard
      ? "用紙全体と、左右の解答欄にある黒い基準四角をすべて入れてください。"
      : pageIndex === 0
        ? "第1面の用紙全体と、各解答欄の四隅にある黒い四角を入れてください。"
        : "裏返した第2面を、同じように用紙全体が入るよう撮影してください。";
    $("step1").className = pageIndex === 0 ? "active" : "done";
    $("step2").className = pageIndex === 1 ? "active" : "";
    setOuterStage("capture");
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

  function normalizeAngle(angle) {
    const normalized = ((angle % 360) + 360) % 360;
    return normalized > 180 ? normalized - 360 : normalized;
  }

  function mathLayoutBias(boxes, width) {
    if (!boxes.length || !width) return 0;
    const leftEdge = Math.min(...boxes.flatMap(box => [box.tl.x, box.bl.x]));
    const rightEdge = Math.max(...boxes.flatMap(box => [box.tr.x, box.br.x]));
    const leftMargin = leftEdge / width;
    const rightMargin = (width - rightEdge) / width;
    return leftMargin - rightMargin;
  }

  function rotateMathBoxes180(boxes, width, height) {
    const turn = point => ({
      ...point,
      x: width - point.x,
      y: height - point.y
    });
    return boxes.map(box => {
      const tl = turn(box.br);
      const tr = turn(box.bl);
      const br = turn(box.tl);
      const bl = turn(box.tr);
      return {
        ...box,
        tl, tr, br, bl,
        centerX: (tl.x + tr.x + br.x + bl.x) / 4,
        centerY: (tl.y + tr.y + br.y + bl.y) / 4
      };
    }).sort((a, b) => a.centerX - b.centerX);
  }

  /*
   * 実物の数学解答用紙は、日本語が正立する向きでは解答欄が右寄りになる。
   * 黒い基準四角だけでは 0° と 180° を区別できないため、解答欄が明確に
   * 左寄りなら、画像と大問順を一緒に180°戻す。左右差が小さい面は、
   * 検出時に選ばれた向きを維持する。
   */
  function normalizeMathOrientation(attempt) {
    if (!attempt || !attempt.boxes.length) return attempt;
    const bias = mathLayoutBias(attempt.boxes, attempt.canvas.width);
    if (bias > -.03) return {...attempt, layoutBias: bias, orientationCorrected: false};
    const canvas = rotateCanvas(attempt.canvas, 180);
    const boxes = rotateMathBoxes180(
      attempt.boxes,
      attempt.canvas.width,
      attempt.canvas.height
    );
    return {
      ...attempt,
      angle: normalizeAngle(attempt.angle + 180),
      canvas,
      boxes,
      layoutBias: mathLayoutBias(boxes, canvas.width),
      orientationCorrected: true
    };
  }

  function photoQuality(canvas, originalWidth, originalHeight) {
    const sample = document.createElement("canvas");
    const scale = Math.min(1, 480 / Math.max(canvas.width, canvas.height));
    sample.width = Math.max(1, Math.round(canvas.width * scale));
    sample.height = Math.max(1, Math.round(canvas.height * scale));
    const ctx = sample.getContext("2d", {willReadFrequently: true});
    ctx.drawImage(canvas, 0, 0, sample.width, sample.height);
    const {data, width, height} = ctx.getImageData(0, 0, sample.width, sample.height);
    const gray = new Uint8Array(width * height);
    let total = 0;
    let dark = 0;
    for (let p = 0, i = 0; p < gray.length; p++, i += 4) {
      const value = grayAt(data, i);
      gray[p] = value;
      total += value;
      if (value < 35) dark++;
    }
    let lapTotal = 0;
    let lapSquared = 0;
    let lapCount = 0;
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const p = y * width + x;
        const lap = Math.abs(
          gray[p - 1] + gray[p + 1] + gray[p - width] + gray[p + width] - gray[p] * 4
        );
        lapTotal += lap;
        lapSquared += lap * lap;
        lapCount++;
      }
    }
    const lapMean = lapCount ? lapTotal / lapCount : 0;
    const sharpness = lapCount
      ? Math.sqrt(Math.max(0, lapSquared / lapCount - lapMean * lapMean))
      : 0;
    const mean = gray.length ? total / gray.length : 0;
    const issues = [];
    const shortSide = Math.min(originalWidth, originalHeight);
    if (shortSide < 1000) {
      issues.push(`画像が小さめです（短辺${shortSide}px）。短辺1200px以上を目安にしてください。`);
    }
    if (mean < 72 || dark / gray.length > .32) {
      issues.push("写真が暗い、または影が広く写っています。明るい場所で影を避けてください。");
    } else if (mean > 238) {
      issues.push("写真が明るすぎます。照明の反射や白飛びを避けてください。");
    }
    if (sharpness < 14) {
      issues.push("手ぶれ・ピンぼけの可能性があります。端末を止めて文字にピントを合わせてください。");
    }
    return {issues, mean, sharpness, shortSide};
  }

  function answerKeyPhotoStatus(kind, text) {
    $("answerKeyPhotoStatus").className = `answer-key-photo-status ${kind || ""}`.trim();
    $("answerKeyPhotoStatus").textContent = text;
  }

  function answerKeyEntryLabel(question) {
    if (subject === "standard") return String(question.id || "");
    const number = window.MarkReaderGrader.questionNumber(question);
    const symbols = window.MarkReaderGrader.answerSymbols(question);
    return number && symbols.length
      ? `第${number}問 ${symbols.join("・")}`
      : String(question.id || "");
  }

  function answerSheetEntries() {
    if (subject === "standard") {
      return standardAnswers.map(answer => ({
        code: `N${answer.number}`,
        label: `解答番号${answer.number}`,
        number: Number(answer.number)
      }));
    }
    return pageData.flatMap(page => page.questions || []).flatMap(question =>
      (question.answers || []).map(answer => ({
        code: `Q${question.number}-${answer.symbol}`,
        label: `第${question.number}問 ${answer.symbol}`,
        number: Number(question.number),
        symbol: answer.symbol
      }))
    );
  }

  function normalizePrintedAnswer(value) {
    return String(value ?? "")
      .normalize("NFKC")
      .replace(/[−‐‑‒–—―ー]/g, "-")
      .replace(/[^0-9-]/g, "");
  }

  function answerOption(value, length) {
    const normalized = normalizePrintedAnswer(value);
    const characters = [...normalized];
    return characters.length === length ? characters : null;
  }

  function makePhotoAnswerKey(readResult, entries) {
    const byCode = new Map(entries.map(entry => [entry.code, entry]));
    const usedCodes = new Set();
    const questions = [];
    for (const item of readResult.answers || []) {
      const mapped = item.codes.map(code => byCode.get(code));
      if (
        mapped.some(entry => !entry) ||
        item.codes.some(code => usedCodes.has(code))
      ) continue;
      const answers = item.answers.map(normalizePrintedAnswer);
      if (
        answers.some(answer => !/^[-0-9]$/.test(answer)) ||
        answers.length !== mapped.length
      ) continue;
      const alternatives = (item.alternatives || [])
        .map(value => answerOption(value, answers.length))
        .filter(Boolean);
      item.codes.forEach(code => usedCodes.add(code));
      const group = window.MarkReaderGrader.groupLabel(item.group || (
        subject === "standard" ? "全体" : `第${mapped[0].number}問`
      ));
      const question = {
        id: subject === "standard"
          ? mapped.map(entry => entry.number).join("-")
          : mapped.map(entry => entry.symbol).join("・"),
        group,
        problemNumber: group,
        answers,
        points: item.points || 1,
        unordered: Boolean(item.unordered),
        photoPoints: Boolean(item.points),
        photoConfidence: item.confidence,
        photoCodes: item.codes.slice()
      };
      if (alternatives.length) {
        question.correctOptions = [answers, ...alternatives];
      }
      questions.push(question);
    }
    if (!questions.length) {
      throw new Error("解答写真から、答案用紙と対応する正解を読み取れませんでした。");
    }
    const pointsAvailable = questions.every(question => question.photoPoints);
    const key = {
      year: "",
      exam: "photo",
      examLabel: readResult.examLabel || "解答写真",
      readerSubject: subject,
      source: "撮影した解答・配点一覧",
      questions,
      pointsAvailable,
      photoCoverage: usedCodes.size,
      photoEntryCount: entries.length,
      photoDeclaredMaxScore: readResult.maxScore || null
    };
    if (subject === "math2") {
      const groups = [...new Set(questions
        .map(question => window.MarkReaderGrader.questionNumber(question))
        .filter(number => number >= 4 && number <= 7)
        .map(number => `第${number}問`))];
      if (groups.length >= 3) {
        key.selectionRules = [{groups, choose: 3}];
      }
    }
    return key;
  }

  async function answerKeyPhotoImage(file) {
    const bitmap = await createImageBitmap(file, {imageOrientation: "from-image"});
    const maxSide = 2200;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const quality = photoQuality(canvas, bitmap.width, bitmap.height);
    bitmap.close();
    return {
      mimeType: "image/jpeg",
      data: canvas.toDataURL("image/jpeg", .9).split(",")[1],
      issues: quality.issues
    };
  }

  function renderPhotoAnswerKey(qualityIssues) {
    const key = photoAnswerKey;
    const lowConfidence = key.questions.filter(question => question.photoConfidence === "low");
    const missing = Math.max(0, key.photoEntryCount - key.photoCoverage);
    $("answerKeyPhotoResult").classList.remove("hidden");
    $("answerKeyPhotoResult").innerHTML = `
      <div class="answer-key-photo-summary">
        <div><span>採点単位</span><b>${key.questions.length}</b></div>
        <div><span>対応した解答欄</span><b>${key.photoCoverage}</b></div>
        <div><span>配点</span><b>${key.pointsAvailable ? "読取済み" : "一部なし"}</b></div>
      </div>
      <div class="answer-key-editor-wrap">
        <table class="answer-key-editor">
          <thead><tr><th>番号</th><th>正解</th><th>配点</th><th>AI確信度</th></tr></thead>
          <tbody>
            ${key.questions.map((question, index) => `
              <tr>
                <td>${escapeHtml(answerKeyEntryLabel(question))}</td>
                <td><input data-key-index="${index}" data-key-field="answer" value="${escapeHtml(question.answers.join(""))}" aria-label="${escapeHtml(answerKeyEntryLabel(question))}の正解"></td>
                <td><input type="number" min="0" step="1" data-key-index="${index}" data-key-field="points" value="${question.photoPoints ? question.points : ""}" placeholder="不明" aria-label="${escapeHtml(answerKeyEntryLabel(question))}の配点"></td>
                <td><span class="answer-key-confidence ${escapeHtml(question.photoConfidence)}">${({high:"高",medium:"中",low:"低"})[question.photoConfidence] || "—"}</span></td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>
      <p class="answer-key-photo-notes">
        ${qualityIssues.length
          ? `写真の注意：${escapeHtml([...new Set(qualityIssues)].join(" "))}<br>`
          : ""}
        ${lowConfidence.length
          ? `AI確信度が低い項目：${escapeHtml(lowConfidence.map(answerKeyEntryLabel).join("、"))}<br>`
          : ""}
        ${missing
          ? `答案用紙のうち${missing}欄は、解答写真から正解を確認できなかったため採点対象外です。<br>`
          : ""}
        読取結果を直すと、その内容で自動的に再採点します。写真自体は保存されません。
      </p>`;
    $("answerKeyPhotoResult").querySelectorAll("input").forEach(input => {
      input.onchange = updatePhotoAnswerKeyFromEditor;
    });
    $("gradeButton").classList.remove("hidden");
    $("selectedKeyLabel").textContent =
      `${key.examLabel}・解答写真から${key.photoCoverage}欄を読取`;
    answerKeyPhotoStatus(
      key.pointsAvailable && !lowConfidence.length ? "success" : "warning",
      key.pointsAvailable
        ? "解答写真から正解と配点を読み取り、答案写真を採点しました。"
        : "解答写真から正解を読み取りました。配点のない項目は正解数として採点します。"
    );
  }

  function updatePhotoAnswerKeyFromEditor(event) {
    const input = event.currentTarget;
    const question = photoAnswerKey?.questions?.[Number(input.dataset.keyIndex)];
    if (!question) return;
    if (input.dataset.keyField === "answer") {
      const option = answerOption(input.value, question.answers.length);
      if (!option) {
        input.setCustomValidity(`正解は${question.answers.length}文字で入力してください。`);
        input.reportValidity();
        return;
      }
      input.setCustomValidity("");
      question.answers = option;
      if (Array.isArray(question.correctOptions) && question.correctOptions.length) {
        question.correctOptions[0] = option;
      }
    } else {
      const value = Number(input.value);
      question.photoPoints = Number.isFinite(value) && value > 0;
      question.points = question.photoPoints ? value : 1;
      photoAnswerKey.pointsAvailable = photoAnswerKey.questions.every(item => item.photoPoints);
      delete photoAnswerKey.maxScore;
    }
    clearGrade();
    saveAnswers();
    gradeAnswers();
  }

  async function compareAnswerKeyPhotos(files) {
    const entries = answerSheetEntries();
    if (!entries.length) {
      answerKeyPhotoStatus("error", "先に答案用紙を撮影して、読取結果を表示してください。");
      return;
    }
    if (!aiConfigured() || !window.MarkReaderAI?.analyzeAnswerKey) {
      answerKeyPhotoStatus("error", "解答写真の読取を準備できませんでした。ページを再読み込みしてください。");
      return;
    }
    if (files.length > 4) {
      answerKeyPhotoStatus("error", "一度に照合できる写真は4枚までです。");
      return;
    }
    const run = ++answerKeyPhotoRun;
    $("answerKeyPhotoResult").classList.add("hidden");
    $("answerKeyPhotoResult").innerHTML = "";
    $("answerKeyPhotoInput").disabled = true;
    $("answerKeyPhotoButton").classList.add("disabled");
    answerKeyPhotoStatus("working", `${files.length}枚の解答写真を読み込んでいます…`);
    try {
      const converted = [];
      for (const file of files) {
        converted.push(await answerKeyPhotoImage(file));
        if (run !== answerKeyPhotoRun) return;
      }
      answerKeyPhotoStatus("working", "解答写真から正解・配点を読み取り、答案写真と照合しています…");
      const readResult = await window.MarkReaderAI.analyzeAnswerKey({
        subjectLabel: activeSubjectLabel(),
        entries: entries.map(({code, label}) => ({code, label})),
        images: converted.map(({data, mimeType}) => ({data, mimeType}))
      });
      if (run !== answerKeyPhotoRun) return;
      photoAnswerKey = makePhotoAnswerKey(readResult, entries);
      renderPhotoAnswerKey(converted.flatMap(image => image.issues || []));
      clearGrade();
      gradeAnswers();
    } catch (error) {
      if (run !== answerKeyPhotoRun) return;
      console.error("answer key photo comparison failed", error);
      answerKeyPhotoStatus(
        "error",
        `解答写真から採点できませんでした：${error && error.message ? error.message : error}`
      );
    } finally {
      if (run === answerKeyPhotoRun) updateAnswerKeyPhotoAvailability();
    }
  }

  async function processPageCanvas(canvas, fileName) {
    show("workingCard");
    try {
      if (subject === "standard") {
        await readStandardPage(canvas, fileName);
      } else {
        await readMathPage(canvas, fileName);
      }
    } catch (error) {
      $("errorText").textContent = error && error.message
        ? error.message
        : "画像を処理できませんでした。別の写真でお試しください。";
      show("errorCard");
    }
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
      const quality = photoQuality(base, bitmap.width, bitmap.height);
      bitmap.close();
      await nextFrame();

      if (quality.issues.length) {
        pendingPhoto = {canvas: base, fileName: file.name};
        $("qualityIssues").innerHTML = quality.issues
          .map(issue => `<li>${escapeHtml(issue)}</li>`).join("");
        show("qualityCard");
        return;
      }
      await processPageCanvas(base, file.name);
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
    const best = normalizeMathOrientation(attempts[0]);
    if (!best || best.boxes.length !== expected || best.quality < 0) {
      throw new Error(`第${pageIndex + 1}面の解答欄を${expected}個すべて特定できませんでした。用紙の端を切らず、黒い基準四角が全部入るように撮り直してください。`);
    }

    if (!aiConfigured()) {
      throw new Error("数学のAI読取を準備できませんでした。通信状態を確認してページを再読み込みしてください。");
    }
    $("workingText").textContent = "解答欄だけをGeminiで読み取っています…";
    await nextFrame();
    const questionNumbers = TEMPLATES[subject].pages[pageIndex];
    const blocks = best.boxes.map((box, i) => ({
      question: questionNumbers[i],
      ...cropMathBlock(best.canvas, box)
    }));
    const aiQuestions = await window.MarkReaderAI.analyzeMathPage({
      subject,
      pageNumber: pageIndex + 1,
      blocks
    });
    const questions = makeAiMathQuestions(aiQuestions, questionNumbers);
    const needsReview = questions.flatMap(question => question.answers)
      .filter(answer => answer.state === "warn").length;
    const aiStatus = needsReview ? "partial" : "verified";
    const aiMessage = needsReview
      ? `Geminiで読み取りました。判別が難しい${needsReview}欄を確認してください。`
      : "Geminiで読み取りました。";
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
    const blockWidth = Math.max(...xs) - Math.min(...xs);
    const blockHeight = Math.max(...ys) - Math.min(...ys);
    const padX = Math.max(10, blockWidth * .035);
    const padTop = Math.max(12, blockHeight * .025);
    const padBottom = Math.max(10, blockHeight * .015);
    const sx = Math.max(0, Math.floor(Math.min(...xs) - padX));
    const sy = Math.max(0, Math.floor(Math.min(...ys) - padTop));
    const ex = Math.min(source.width, Math.ceil(Math.max(...xs) + padX));
    const ey = Math.min(source.height, Math.ceil(Math.max(...ys) + padBottom));
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

  function makeAiMathQuestions(aiQuestions, questionNumbers) {
    const byNumber = new Map(aiQuestions.map(question => [question.question, question]));
    return questionNumbers.map(number => {
      const question = byNumber.get(number);
      if (!question || !question.answers.length) {
        throw new Error(`Geminiが第${number}問の解答欄を返しませんでした。同じ面をもう一度読み取ってください。`);
      }
      return {
        number,
        answers: question.answers.map(answer => ({
          symbol: answer.symbol,
          value: answer.value === "blank" ? "" : answer.value,
          state: answer.confidence === "low"
            ? "warn"
            : answer.value === "blank" ? "blank" : "ok",
          aiConfidence: answer.confidence
        }))
      };
    });
  }

  function updateGradingHeader() {
    const key = selectedAnswerKey();
    $("selectedKeyLabel").textContent = key
      ? `${key.examLabel}・解答写真から${key.photoCoverage || 0}欄を読取`
      : "解答写真を読み取ると自動採点します。";
  }

  function clearGrade() {
    const result = $("gradingResult");
    if (!result) return;
    result.className = "grading-result hidden";
    result.innerHTML = "";
    lastGrade = null;
    window.__markReaderPdfData = null;
    $("pdfButton").classList.add("hidden");
    $("gradeButton").classList.toggle("hidden", !selectedAnswerKey());
    setOuterStage("review");
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
        clearGrade();
        saveAnswers();
      };
    });
    updateGradingHeader();
    clearGrade();
    renderPreviews();
    $("copyStatus").textContent = "";
    setOuterStage("review");
    show("resultCard");
    saveAnswers();
    updateAnswerKeyPhotoAvailability();
    if (photoAnswerKey) {
      renderPhotoAnswerKey([]);
      gradeAnswers();
    }
  }

  function finishMath(preserveSelection = false) {
    const questions = pageData.flatMap(p => p.questions);
    const counts = countStates(questions.flatMap(q => q.answers));
    $("summary").textContent = `${activeSubjectLabel()}・読取済み ${counts.ok}欄・要確認 ${counts.warn}欄・未記入 ${counts.blank}欄`;
    const aiPages = pageData.filter(page => page.aiStatus);
    if (aiPages.length) {
      const partial = aiPages.some(page => page.aiStatus === "partial");
      $("aiResultStatus").className = `ai-result-status ${partial ? "partial" : "verified"}`;
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
      if (!preserveSelection || selectedQuestions.size !== 3) {
        selectedQuestions = new Set(activity.slice(0, 3).map(x => x.number));
      }
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
        answer.value = select.value;
        answer.state = select.value === "" ? "blank" : "ok";
        select.closest(".answer").className = `answer ${answer.state}`;
        clearGrade();
        saveAnswers();
      };
    });
    updateGradingHeader();
    clearGrade();
    renderPreviews();
    $("copyStatus").textContent = "";
    setOuterStage("review");
    show("resultCard");
    saveAnswers();
    updateAnswerKeyPhotoAvailability();
    if (photoAnswerKey) {
      renderPhotoAnswerKey([]);
      gradeAnswers();
    }
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
                ${["-", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].map(value => `<option value="${value}"${answer.value === value ? " selected" : ""}>${value === "-" ? "－" : value}</option>`).join("")}
              </select>
            </div>`).join("")}
        </div>
      </section>`;
  }

  function answerTitle(answer) {
    const confidence = {high: "高", medium: "中", low: "低"}[answer.aiConfidence] || "不明";
    return `Gemini読取・確信度 ${confidence}`;
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
        clearGrade();
        renderSelectionState();
        saveAnswers();
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
    const previewPages = pageData.filter(page => page.preview);
    $("previews").closest("details").classList.toggle("hidden", !previewPages.length);
    $("previews").innerHTML = previewPages.map((page, i) => `
      <figure>
        <figcaption>${subject === "standard" ? "検出結果" : `第${i + 1}面の検出結果`}</figcaption>
        <img src="${page.preview}" alt="${subject === "standard" ? "検出結果" : `第${i + 1}面の検出結果`}">
      </figure>`).join("");
  }

  function formatScore(value) {
    const rounded = Math.round(Number(value || 0) * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  }

  function displayGradeId(question) {
    return answerKeyEntryLabel(question);
  }

  function gradeStatus(row) {
    if (!row.included) return {className: "excluded", text: "対象外"};
    if (!row.answered) return {className: "missing", text: "未入力"};
    if (row.earned === row.points) return {className: "correct", text: "○"};
    if (row.earned > 0) return {className: "partial", text: "△"};
    return {className: "wrong", text: "×"};
  }

  function shortGroupLabel(value) {
    return window.MarkReaderGrader.groupLabel(value)
      .replace(/模擬試験|共通テスト|数学|国語/g, "")
      .replace(/\s+/g, "")
      .slice(0, 10) || "全体";
  }

  function drawRadarChart(canvas, groups) {
    if (!canvas || !groups.length) return;
    const size = 560;
    canvas.width = size;
    canvas.height = 430;
    const ctx = canvas.getContext("2d");
    const cx = size / 2;
    const cy = 205;
    const radius = 132;
    const count = groups.length;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '700 18px -apple-system,BlinkMacSystemFont,"Segoe UI","Yu Gothic",sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let level = 1; level <= 4; level++) {
      ctx.beginPath();
      groups.forEach((_, index) => {
        const angle = -Math.PI / 2 + Math.PI * 2 * index / count;
        const r = radius * level / 4;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (index) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      });
      ctx.closePath();
      ctx.strokeStyle = level === 4 ? "#bcc7dc" : "#dde3ee";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    groups.forEach((group, index) => {
      const angle = -Math.PI / 2 + Math.PI * 2 * index / count;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
      ctx.strokeStyle = "#e0e5ee";
      ctx.lineWidth = 1;
      ctx.stroke();
      const lx = cx + Math.cos(angle) * (radius + 46);
      const ly = cy + Math.sin(angle) * (radius + 36);
      ctx.fillStyle = "#43506a";
      ctx.fillText(shortGroupLabel(group.group), lx, ly);
    });
    ctx.beginPath();
    groups.forEach((group, index) => {
      const angle = -Math.PI / 2 + Math.PI * 2 * index / count;
      const rate = group.items ? Math.max(0, Math.min(1, group.correct / group.items)) : 0;
      const x = cx + Math.cos(angle) * radius * rate;
      const y = cy + Math.sin(angle) * radius * rate;
      if (index) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = "rgba(49,95,206,.20)";
    ctx.fill();
    ctx.strokeStyle = "#315fce";
    ctx.lineWidth = 5;
    ctx.stroke();
  }

  function pdfData(result) {
    const key = selectedAnswerKey();
    return {
      examLabel: photoContext?.examText || (key ? key.examLabel : ""),
      year: photoContext?.year || (key ? key.year : ""),
      subject: activeSubjectLabel(),
      score: result.score,
      maxScore: result.maxScore,
      pointsAvailable: result.pointsAvailable,
      correct: result.correct,
      partial: result.partial,
      wrong: result.wrong,
      missing: result.missing,
      chosenGroups: result.chosenGroups,
      groups: result.groups,
      rows: result.rows.filter(row => row.included).map(row => {
        const status = gradeStatus(row);
        return {
          id: displayGradeId(row.question),
          got: row.got.join("") || "未入力",
          expected: row.expected,
          earned: row.earned,
          points: row.points,
          judge: status.text,
          correctRate: "—",
          note: ({high:"AI確信度：高",medium:"AI確信度：中",low:"AI確信度：低"})[row.question.photoConfidence] || "—"
        };
      }),
      generatedAt: new Date().toISOString()
    };
  }

  function renderGrade(result) {
    const includedCount = result.rows.filter(row => row.included).length;
    const groupHtml = result.groups.map(group => `
      <div>
        <span>${escapeHtml(group.group)}</span>
        <b>${result.pointsAvailable
          ? `${formatScore(group.earned)} / ${formatScore(group.possible)}`
          : `${group.correct} / ${group.items}`}</b>
      </div>`).join("");
    const rowsHtml = result.rows.map(row => {
      const status = gradeStatus(row);
      const note = ({high:"AI確信度：高",medium:"AI確信度：中",low:"AI確信度：低"})[row.question.photoConfidence] || "—";
      return `
        <tr class="${status.className}">
          <td>${escapeHtml(displayGradeId(row.question))}</td>
          <td>${escapeHtml(row.got.join("") || "未入力")}</td>
          <td>${escapeHtml(row.expected)}</td>
          <td>${status.text}</td>
          <td>${row.included
            ? result.pointsAvailable
              ? `${formatScore(row.earned)} / ${formatScore(row.points)}`
              : "配点なし"
            : "—"}</td>
          <td>—</td>
          <td>${escapeHtml(note)}</td>
        </tr>`;
    }).join("");
    const groupTableHtml = result.groups.map(group => `
      <tr>
        <td>${escapeHtml(group.group)}</td>
        <td>${result.pointsAvailable
          ? `${formatScore(group.earned)} / ${formatScore(group.possible)}`
          : `${group.correct} / ${group.items}`}</td>
        <td>${group.items ? Math.round(group.correct / group.items * 1000) / 10 : 0}%</td>
      </tr>`).join("");
    $("gradingResult").className = "grading-result";
    $("gradingResult").innerHTML = `
      <div class="score-summary">
        <div class="score-main"><span>${result.pointsAvailable ? "得点" : "正解数"}</span><b>${result.pointsAvailable
          ? `${formatScore(result.score)} / ${formatScore(result.maxScore)}`
          : `${result.correct} / ${includedCount}`}</b></div>
        <div><span>採点単位</span><b>${includedCount}</b></div>
        <div><span>誤答・部分点</span><b>${result.wrong + result.partial}</b></div>
        <div><span>未入力</span><b>${result.missing}</b></div>
      </div>
      ${result.chosenGroups.length
        ? `<p class="chosen-groups">採点対象：必答問題＋${result.chosenGroups.map(escapeHtml).join("・")}</p>`
        : ""}
      <div class="group-scores">${groupHtml}</div>
      <div class="result-analytics">
        <section class="radar-card">
          <h3>大問別レーダー</h3>
          <canvas id="scoreRadar" aria-label="大問別正答率のレーダーチャート"></canvas>
        </section>
        <section class="group-table-card">
          <h3>${result.pointsAvailable ? "大問別得点" : "大問別正解数"}</h3>
          <table class="group-score-table">
            <thead><tr><th>大問</th><th>${result.pointsAvailable ? "得点" : "正解数"}</th><th>正答率</th></tr></thead>
            <tbody>${groupTableHtml}</tbody>
          </table>
        </section>
      </div>
      <details class="grade-details">
        <summary>採点内訳を表示</summary>
        <div class="grade-table-wrap">
          <table class="grade-table">
            <thead><tr><th>番号</th><th>自分</th><th>正解</th><th>判定</th><th>得点</th><th>受験者正答率</th><th>注記</th></tr></thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </div>
      </details>`;
    drawRadarChart($("scoreRadar"), result.groups);
  }

  function gradeAnswers() {
    const key = selectedAnswerKey();
    if (!key) {
      $("gradingResult").className = "grading-result grade-error";
      $("gradingResult").textContent = "先に解答写真を読み取ってください。";
      return;
    }
    if (subject === "math2" && selectedQuestions.size !== 3) {
      $("gradingResult").className = "grading-result grade-error";
      $("gradingResult").textContent = "採点する大問を3問選択してください。";
      return;
    }
    try {
      const result = window.MarkReaderGrader.grade({
        key,
        mode: subject,
        standardAnswers,
        mathQuestions: pageData.flatMap(page => page.questions || []),
        selectedQuestions
      });
      lastGrade = result;
      window.__markReaderPdfData = pdfData(result);
      renderGrade(result);
      setOuterStage("result");
      $("pdfButton").classList.remove("hidden");
      saveAnswers();
      $("gradingResult").scrollIntoView({behavior: "smooth", block: "nearest"});
    } catch (error) {
      $("gradingResult").className = "grading-result grade-error";
      $("gradingResult").textContent = error && error.message
        ? error.message
        : "採点できませんでした。";
    }
  }

  async function exportPdf() {
    if (!lastGrade || !window.__markReaderPdfData) {
      $("gradingResult").className = "grading-result grade-error";
      $("gradingResult").textContent = "先に採点してください。";
      return;
    }
    if (!window.MarkReaderPDF || typeof window.MarkReaderPDF.exportResult !== "function") {
      $("copyStatus").textContent = "PDF出力を準備できませんでした。ページを再読み込みしてください。";
      return;
    }
    const button = $("pdfButton");
    button.disabled = true;
    button.classList.add("busy");
    button.textContent = "PDFを作成しています…";
    try {
      await window.MarkReaderPDF.exportResult(window.__markReaderPdfData);
    } catch (error) {
      console.error("PDF export failed", error);
      $("copyStatus").textContent = `PDFを作成できませんでした：${error && error.message ? error.message : error}`;
    } finally {
      button.disabled = false;
      button.classList.remove("busy");
      button.textContent = "採点結果PDFを保存";
    }
  }

  $("gradeButton").onclick = gradeAnswers;

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
      $("copyStatus").textContent = `${activeSubjectLabel()}の解答番号をコピーしました。`;
    } catch (_) {
      $("copyStatus").textContent = `コピーできませんでした：${text}`;
    }
  };

  window.UILabPhotoFlow = {
    configure(context) {
      const nextSubject = context && TEMPLATES[context.template]
        ? context.template
        : "standard";
      photoContext = context ? {...context, template: nextSubject} : null;
      subject = nextSubject;
      updateSubjectUi();
      reset();
    },
    getContext() {
      return photoContext ? {...photoContext} : null;
    }
  };

  // 実物写真を使う回帰テストから、検出結果と国語の端末内判定だけを参照する。
  window.__markReaderDebug = {
    detectStandardBoxes,
    detectMathBoxes,
    detectMathComponents,
    readStandardBlock,
    makeAiMathQuestions,
    makePhotoAnswerKey,
    answerOption,
    photoQuality,
    mathLayoutBias,
    rotateMathBoxes180,
    normalizeMathOrientation
  };
})();
