/* 写真採点 v20261004-universal2: 全科目の用紙・解答欄をGoogle Geminiで照合 */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const escape = value => String(value ?? "").replace(/[&<>"']/g, c =>
    ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
  const norm = value => window.MarkReaderGrader.norm(value);
  const STORE = "ct-photo-universal-v1";
  const KANA = [..."アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン"];
  let context = null, key = null, entries = [], answers = [];
  let sheets = [], keyPhotos = [], selectedGroups = new Set();
  let run = 0, busy = false;
  const registered = () => context?.mode === "registered";
  const label = () => context?.subject || "全科目";
  const storeKey = () => context?.signature || "custom-photo-compare";
  const aiReady = () => Boolean(window.MarkReaderAI?.isConfigured());
  const stage = value => window.UILabPhotoNavigation?.setStage(value);
  const clone = value => JSON.parse(JSON.stringify(value));

  const slots = question => window.PhotoAnswerFormat.slots(question);
  const slotLabels = question => window.PhotoAnswerFormat.slotLabels(question);

  function prepareRegisteredKey() {
    if (!registered()) return;
    key = clone(context.registeredKey);
    key.questions.forEach(q => { q.group=window.PhotoAnswerFormat.group(q.group || q.problemNumber); q.problemNumber=q.group; });
    (key.selectionRules || []).forEach(rule => { rule.groups=rule.groups.map(window.PhotoAnswerFormat.group); });
    entries = [];
    key.questions.forEach((question, index) => {
      question.photoCodes = slotLabels(question).map((printed, slot) => {
        const code = "R" + (index + 1) + "-" + (slot + 1);
        entries.push({code, label: printed, group: question.group || question.problemNumber || "全体"});
        return code;
      });
    });
  }

  function show(id) {
    ["setupCard","captureCard","qualityCard","workingCard","errorCard","resultCard"]
      .forEach(name => $(name).classList.toggle("hidden", name !== id));
  }

  function updateAvailability() {
    const available = aiReady() && !busy;
    ["initialFileInput", "fileInput", "galleryFileInput"].forEach(id => { $(id).disabled = !available; });
    $("answerKeyPhotoInput").disabled = !available || !answers.length;
    $("answerKeyCameraInput").disabled = !available || !answers.length;
    $("answerKeyRetryButton").disabled = busy || !keyPhotos.length;
    $("answerKeyPhotoButton").classList.toggle("disabled", !available || !answers.length);
    $("startButton").classList.toggle("disabled", !available);
    $("startButton").setAttribute("aria-disabled", String(!available));
    $("answerKeyPhotoPanel").classList.toggle("hidden", registered());
    $("aiAvailability").textContent = aiReady()
      ? "全科目をGoogle Geminiで読み取ります。"
      : "AI読取を準備できませんでした。通信状態を確認してください。";
    $("retryButton").disabled = busy || !sheets.length;
    ["gradeButton","rescanButton","resumeButton"].forEach(id => { $(id).disabled = busy; });
    $("savedResumePanel").classList.toggle("hidden", !saved());
  }

  function configure(next) {
    run++;
    busy = false;
    context = next ? {...next} : {mode:"compare", template:"standard"};
    key = null; entries = []; answers = []; sheets = []; keyPhotos = [];
    selectedGroups = new Set();
    prepareRegisteredKey();
    $("customTemplatePicker").classList.add("hidden");
    $("lockedSheetCard").classList.toggle("hidden", !registered());
    $("photoToPhotoIntro").classList.toggle("hidden", registered());
    $("photoSheetSubject").textContent = label();
    $("photoSheetExam").textContent = context.examText || "";
    $("photoSheetTemplate").textContent = "用紙の形式・列数・番号は自動で読み取ります";
    $("photoContextExam").textContent = context.examText || "自分の持つ解答と照合";
    $("photoPageTitle").textContent = registered() ? "答案写真で採点" : "答案と解答の写真で採点";
    $("photoPageIntro").textContent = registered()
      ? label() + "の答案を1枚から読み取れます。別ページや拡大写真は後から追加できます。"
      : "答案写真を読み取り、手元の正解・配点一覧の写真と照合します。各写真はまとめて選べます。";
    $("photoNoticeTitle").textContent = "全科目でGoogle Geminiを使用します";
    $("photoNoticeText").textContent = "選んだ写真をGoogleに送信して読み取ります。氏名・受験番号などは隠して撮影してください。写真は別の試験へ移るまで一時保持し、端末への保存は解答番号だけです。";
    $("photoSetupTitle").textContent = "答案を撮影・選択";
    $("startButtonText").textContent = "答案を撮影する";
    $("setupHelp").textContent = "1枚から読取できます。表裏がある場合は、撮影済みの写真をまとめて選択できます。";
    $("aiOption").classList.remove("hidden");
    $("aiOption").querySelector("b").textContent = "全科目をGoogle Geminiで読み取ります";
    $("aiOption").querySelector("small").textContent = "用紙の配置を固定せず、写真にある欄番号・選択肢・記入値を読み取ります。";
    $("photoHomeBack").textContent = registered() ? "‹ 採点方法の選択へ戻る" : "‹ 試験選択へ戻る";
    $("retryButton").textContent = "同じ写真で再試行";
    $("errorBackButton").textContent = "写真選択へ戻る";
    $("rescanButton").textContent = "写真を追加";
    $("copyStatus").textContent = "";
    $("answerKeyPhotoStatus").textContent = "";
    $("answerKeyPhotoResult").innerHTML = "";
    $("answerKeyPhotoResult").classList.add("hidden");
    $("gradingResult").classList.add("hidden");
    $("savedResumeText").textContent = "前回の読取結果を開けます。写真の選択は不要です。";
    show("setupCard"); stage("capture"); updateAvailability();
  }

  function saved() {
    try {
      const current=JSON.parse(localStorage.getItem(STORE) || "{}")[storeKey()];
      if (current) return current;
      const legacyStore=JSON.parse(localStorage.getItem("ct-mark-reader-photo-answers-v2") || "{}").entries || {};
      const legacy=registered() ? legacyStore["photo||"+context.signature] :
        Object.values(legacyStore).filter(item => String(item.keySignature || "").startsWith("photo||custom||"))
          .sort((a,b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")))[0];
      if (!legacy) return null;
      const values=legacy.subject === "standard" ?
        (legacy.standardAnswers || []).map(answer => ({
          code:"N"+answer.number,label:String(answer.number),group:"全体",value:String(answer.value ?? ""),state:answer.state
        })) :
        (legacy.mathQuestions || []).flatMap(question => (question.answers || []).map(answer => ({
          code:"Q"+question.number+"-"+answer.symbol,label:answer.symbol,group:"第"+question.number+"問",
          value:answer.value || "",state:answer.state,aiConfidence:answer.aiConfidence
        })));
      let restored=values;
      if (registered()) {
        restored=entries.map(entry => {
          const previous=values.find(value => value.label === entry.label &&
            (legacy.subject === "standard" ||
              window.MarkReaderGrader.questionNumber({group:value.group}) === window.MarkReaderGrader.questionNumber({group:entry.group})));
          return previous ? {...previous,...entry} : {...entry,value:"",state:"warn",missing:true};
        });
      } else if (legacy.photoAnswerKey?.questions) {
        values.forEach(value => {
          const question=legacy.photoAnswerKey.questions.find(q => q.photoCodes?.includes(value.code));
          if (question) value.group=question.group || "全体";
        });
      }
      if (!restored.length) return null;
      const legacyKey=registered() ? key : legacy.photoAnswerKey || null;
      const groups=(legacyKey?.selectionRules || []).flatMap(rule => rule.groups || [])
        .filter(group => (legacy.selectedQuestions || []).includes(window.MarkReaderGrader.questionNumber({group})));
      return {answers:restored,selectedGroups:groups,key:registered() ? null : legacyKey};
    } catch (_) { return null; }
  }

  function save() {
    try {
      const data = JSON.parse(localStorage.getItem(STORE) || "{}");
      data[storeKey()] = {answers, selectedGroups:[...selectedGroups], key: registered() ? null : key};
      localStorage.setItem(STORE, JSON.stringify(data));
      $("autosaveStatus").textContent = "解答番号をこの端末に自動保存しました。写真は保存しません。";
    } catch (_) { $("autosaveStatus").textContent = "解答番号をこの端末へ保存できませんでした。"; }
    updateAvailability();
  }

  function restore() {
    const value = saved();
    if (!value?.answers?.length) return;
    run++; busy = false;
    answers = value.answers;
    selectedGroups = new Set(value.selectedGroups || []);
    if (!registered()) { key = value.key || null; entries = answers.map(({code,label,group}) => ({code,label,group})); }
    review(false);
  }

  async function convert(file) {
    let image, close = () => {};
    try {
      image = await createImageBitmap(file, {imageOrientation:"from-image"});
      close = () => image.close();
    } catch (_) {
      const url = URL.createObjectURL(file);
      image = new Image();
      try {
        await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = url; });
      } finally { URL.revokeObjectURL(url); }
    }
    try {
      const scale = Math.min(1, 2400 / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff"; ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(image,0,0,canvas.width,canvas.height);
      return {data:canvas.toDataURL("image/jpeg", .92).split(",")[1], mimeType:"image/jpeg"};
    } finally { close(); }
  }

  function checkImageSize(images) {
    if (images.reduce((total,image) => total + image.data.length,0) > 18 * 1024 * 1024) {
      throw new Error("写真の合計サイズが大きすぎます。解答欄に絞った写真を選んでください。");
    }
  }

  function uniqueFiles(existing, additions) {
    const result = existing.slice();
    const same = (a,b) => a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;
    for (const file of additions) if (!result.some(item => same(item,file))) result.push(file);
    if (result.length > 8) throw new Error("写真は8枚までまとめて読めます。解答欄の写る写真を選んでください。");
    return result;
  }

  function mergeAnswers(read, previous) {
    const old = new Map(previous.map(entry => [entry.code, entry]));
    const byCode = new Map(read.map(entry => [entry.code, entry]));
    // 手入力で確認した内容は、写真の追加・再試行でも維持する。
    for (const entry of previous) {
      if (entry.manual || !byCode.has(entry.code)) byCode.set(entry.code, entry);
    }
    if (registered()) {
      return entries.map(entry => byCode.get(entry.code) || old.get(entry.code) ||
        {...entry, value:"", state:"warn", aiConfidence:"low", missing:true});
    }
    return [...byCode.values()];
  }

  async function readSheets(files = [], replace = false) {
    if (busy) return;
    if (!aiReady()) { $("errorText").textContent = "AI読取を準備できませんでした。"; show("errorCard"); return; }
    try { sheets = uniqueFiles(replace ? [] : sheets, files); }
    catch (error) { $("errorText").textContent = error.message; show("errorCard"); return; }
    if (!sheets.length) return;
    if (replace) { answers = []; selectedGroups.clear(); keyPhotos=[]; if (!registered()) { key=null; entries=[]; }
      $("answerKeyPhotoResult").classList.add("hidden"); $("answerKeyPhotoStatus").textContent=""; }
    const token = ++run;
    busy = true; updateAvailability(); show("workingCard"); stage("capture");
    try {
      $("workingText").textContent = sheets.length + "枚の答案写真を読み取っています…";
      const images = [];
      for (const file of sheets) { images.push(await convert(file)); if (token !== run) return; }
      checkImageSize(images);
      const result = await window.MarkReaderAI.analyzeAnswerSheet({
        subjectLabel:label(), entries, images, allowAdditional:!registered()
      });
      if (token !== run) return;
      answers = mergeAnswers(result, answers);
      if (!registered()) {
        entries = answers.map(({code,label,group}) => ({code,label,group}));
        // 答案が増えた場合は既存の正解を保持し、必要なら同じ正解写真で照合し直せる。
        if (key) key.photoEntryCount = answers.length;
      }
      review(false);
    } catch (error) {
      if (token !== run) return;
      $("errorText").textContent = (error.message || "読み取れませんでした。") +
        " 写真は保持されています。再撮影せず再試行できます。";
      show("errorCard");
    } finally { if (token === run) { busy=false; updateAvailability(); } }
  }

  function selectionUi() {
    const rules = key?.selectionRules || [];
    $("selectionPanel").classList.toggle("hidden", !rules.length);
    if (!rules.length) return;
    $("selectionPanel").querySelector("strong").textContent = "採点する大問";
    $("selectionPanel").querySelector("p").textContent = "記入状況から選んでいます。選択した大問を確認してください。";
    for (const rule of rules) {
      const groups = rule.groups || [], choose = Number(rule.choose || 1);
      if (groups.filter(group => selectedGroups.has(group)).length !== choose) {
        groups.forEach(group => selectedGroups.delete(group));
        const ranked = groups.map((group,index) => ({
          group,index,count:(key.questions || []).filter(q => q.group === group)
            .flatMap(q => q.photoCodes || []).filter(code => answers.some(a => a.code === code && a.value)).length
        })).sort((a,b) => b.count-a.count || a.index-b.index);
        ranked.slice(0,choose).forEach(item => selectedGroups.add(item.group));
      }
    }
    $("selectionButtons").innerHTML = rules.map((rule,index) =>
      '<div><small>' + Number(rule.choose || 1) + '問を選択</small>' +
      (rule.groups || []).map(group => '<button type="button" data-rule="' + index +
        '" data-group="' + escape(group) + '" class="' + (selectedGroups.has(group) ? "selected" : "") +
        '">' + escape(window.MarkReaderGrader.groupLabel(group)) + '</button>').join("") + '</div>').join("");
    $("selectionButtons").querySelectorAll("button").forEach(button => {
      button.onclick = () => {
        const group = button.dataset.group, rule = rules[Number(button.dataset.rule)];
        if (selectedGroups.has(group)) selectedGroups.delete(group);
        else if (rule.groups.filter(g => selectedGroups.has(g)).length < Number(rule.choose || 1)) selectedGroups.add(group);
        else { $("copyStatus").textContent = "先に選択中の大問を外してください。"; return; }
        button.classList.toggle("selected",selectedGroups.has(group)); save();
      };
    });
  }

  function review(autoGrade = false) {
    const counts = {ok:0,warn:0,blank:0};
    answers.forEach(answer => counts[answer.state]++);
    const missing = answers.filter(answer => answer.missing).length;
    $("summary").textContent = "読取済み " + counts.ok + "欄・要確認 " + counts.warn + "欄・未記入 " + counts.blank + "欄";
    $("aiResultStatus").className = "ai-result-status " + (counts.warn ? "partial" : "verified");
    $("aiResultStatus").textContent = "Google Geminiで読み取りました。" +
      (missing ? " 写真に確認できなかった" + missing + "欄は要確認です。写真の追加か手入力で補えます。" : "");
    $("gradingResult").classList.add("hidden");
    $("mathResults").classList.add("hidden");
    $("standardResults").classList.add("hidden");
    $("universalResults").innerHTML = answers.map((answer,index) =>
      '<div class="answer ' + answer.state + '"><label for="photoAnswer' + index + '">' +
      escape(window.MarkReaderGrader.groupLabel(answer.group)) + ' ' + escape(answer.label) +
      '</label><input id="photoAnswer' + index + '" data-index="' + index + '" type="text" value="' +
      escape(answer.value) + '" maxlength="32" autocapitalize="off" autocomplete="off" aria-label="' +
      escape(answer.group + " " + answer.label) + '"></div>').join("");
    $("universalResults").querySelectorAll("input").forEach(input => {
      input.onchange = () => {
        const answer = answers[Number(input.dataset.index)];
        answer.value=norm(input.value); answer.state=answer.value ? "ok" : "blank";
        answer.manual=true; answer.missing=false; input.value=answer.value;
        input.parentElement.className="answer " + answer.state;
        $("gradingResult").classList.add("hidden"); save();
      };
    });
    $("gradeButton").textContent = "確認した内容で採点する";
    $("gradeButton").classList.toggle("hidden", !key);
    $("selectedKeyLabel").textContent = registered() ? "登録済みの正解・配点で採点します。" :
      key ? "解答写真の正解・配点で採点します。" : "次に解答・配点一覧の写真を選択してください。";
    $("previews").closest("details").classList.add("hidden");
    selectionUi(); show("resultCard"); stage("review"); save();
    if (autoGrade) grade();
  }

  function grade() {
    if (!key) return;
    const invalid = [...$("answerKeyPhotoResult").querySelectorAll("input")]
      .find(input => typeof input.checkValidity === "function" && !input.checkValidity());
    if (invalid) { invalid.reportValidity(); return; }
    for (const rule of key.selectionRules || []) {
      if ((rule.groups || []).filter(group => selectedGroups.has(group)).length !== Number(rule.choose || 1)) {
        $("copyStatus").textContent = "採点する大問を指定された数だけ選んでください。"; return;
      }
    }
    try {
      const result = window.MarkReaderGrader.grade({
        key, mode:"universal", answerEntries:answers, selectedGroups
      });
      save();
      window.UILabResults.showPhotoGrade(result,{...context,templateLabel:label()});
    } catch (error) {
      $("gradingResult").className = "grading-result grade-error";
      $("gradingResult").textContent = error.message || "採点できませんでした。";
    }
  }

  function makeKey(result) {
    const used = new Set(), byCode = new Map(entries.map(entry => [entry.code,entry]));
    const questions = [];
    for (const item of result.answers || []) {
      if (!item.codes?.length || item.codes.length !== item.answers?.length ||
          item.codes.some(code => !byCode.has(code) || used.has(code))) continue;
      const values = item.answers.map(norm);
      if (!item.alwaysAward && values.some(value => !value || value.length > 32)) continue;
      item.codes.forEach(code => used.add(code));
      const mapped = item.codes.map(code => byCode.get(code));
      const question = {
        id:mapped.map(entry => entry.label).join("・"),
        group:window.PhotoAnswerFormat.group(mapped[0].group),
        answers:values,points:item.points || 1,unordered:Boolean(item.unordered),
        photoCodes:item.codes.slice(),photoPoints:Boolean(item.points),photoConfidence:item.confidence,
        partialAnyCorrect:item.partialAnyCorrect || 0,
        partialAnswers:clone(item.partialAnswers || []),
        partialConditions:clone(item.partialConditions || []),
        conditionalCorrect:clone(item.conditionalCorrect || []),
        alwaysAward:Boolean(item.alwaysAward),note:item.note || ""
      };
      if (!question.conditionalCorrect.length) delete question.conditionalCorrect;
      const alternatives = (item.correctOptions || item.alternatives || []).map(value =>
        window.PhotoAnswerFormat.vector(value,values.length)).filter(Boolean);
      if (alternatives.length) question.correctOptions=[values,...alternatives];
      questions.push(question);
    }
    if (!questions.length) throw new Error("答案と対応する正解を読み取れませんでした。同じ写真で再試行できます。");
    return {
      year:"",exam:"photo",subject:label(),examLabel:result.examLabel || "解答写真",
      readerSubject:"universal",source:"撮影した解答・配点一覧",questions,
      pointsAvailable:questions.every(q => q.photoPoints),
      maxScore:result.maxScore || undefined,scaleScore:false,
      photoCoverage:used.size,photoEntryCount:entries.length,photoWarnings:result.warnings || [],
      selectionRules:(result.selectionRules || []).map(rule => ({
        groups:rule.groups.map(window.PhotoAnswerFormat.group),choose:rule.choose
      })).filter(rule => rule.groups.every(group => questions.some(q => q.group === group)))
    };
  }

  function renderKey() {
    $("answerKeyPhotoResult").classList.remove("hidden");
    const mode = q => q.photoRuleMode || (q.alwaysAward ? "award" : q.partialAnyCorrect
      ? q.unordered ? "each-unordered" : "each-ordered" : q.unordered ? "unordered" : "ordered");
    const describeRules = q => {
      const detail=[];
      const displayValues=values=>values.map(value=>value==="*" ? "不問" : value).join(" / ");
      for (const values of q.correctOptions || []) detail.push("正解：" + displayValues(values));
      for (const partial of [...q.partialAnswers || [],...q.partialConditions || []])
        detail.push(displayValues(partial.answers) + " → " + partial.points + "点");
      for (const condition of q.conditionalCorrect || []) {
        const dependencies=(condition.allOf || []).map(dependency => {
          const entry=entries.find(e=>e.code === dependency.ifId);
          return (entry ? window.MarkReaderGrader.groupLabel(entry.group) + " " + entry.label : dependency.ifId) +
            " が " + displayValues(dependency.ifEquals || []);
        }).join("、");
        detail.push(dependencies + " のとき " + displayValues(condition.answers || []));
      }
      return detail.length ? '<details><summary>別解・部分点・条件</summary><small class="photo-rule-note">' +
        detail.map(escape).join("<br>") + '</small></details>' : "";
    };
    const options = [["ordered","順番どおり・完答"],["unordered","順不同・完答"],
      ["each-ordered","順番どおり・各欄の部分点"],["each-unordered","順不同・各欄の部分点"],["award","全員得点"]];
    $("answerKeyPhotoResult").innerHTML =
      '<div class="answer-key-editor-wrap"><table class="answer-key-editor"><thead><tr><th>番号</th><th>正解</th><th>合計配点</th><th>採点方法</th><th>1つ正解の点</th></tr></thead><tbody>' +
      key.questions.map((q,index) => '<tr><td>' + escape(window.MarkReaderGrader.groupLabel(q.group) + " " + q.id) +
        (q.photoConfidence !== "high" ? "（要確認）" : "") +
        '<small class="photo-rule-note">' + escape(window.PhotoAnswerFormat.ruleText(q) +
          (q.note ? " / " + q.note : "")) + '</small>' + describeRules(q) + '</td><td><input data-key="' + index +
        '" data-field="answer" value="' + escape(q.answers.join(" / ")) + '" aria-label="正解"></td>' +
        '<td><input data-key="' + index + '" data-field="points" type="number" min="1" step="1" value="' +
        (q.photoPoints ? q.points : "") + '" aria-label="合計配点"></td><td><select data-key="' + index +
        '" data-field="mode" aria-label="採点方法">' + options.map(([value,text]) =>
          '<option value="' + value + '"' + (mode(q) === value ? " selected" : "") + '>' + text + '</option>').join("") +
        '</select></td><td><input data-key="' + index +
        '" data-field="each" type="number" min="1" step="1" value="' +
        (q.partialAnyCorrect || "") + '"' + (!mode(q).startsWith("each-") ? " disabled" : " required") +
        ' aria-label="1つ正解の点"></td></tr>').join("") +
      '</tbody></table></div><p>例：2欄で「21」は「2 / 1」へ分けられます。「両方正解」と「各○点」を確認してください。配点が不明な場合は正解数で採点します。</p>';
    $("answerKeyPhotoResult").querySelectorAll("input,select").forEach(input => {
      input.onchange = () => {
        const index=Number(input.dataset.key),q=key.questions[index];
        if (input.dataset.field === "answer") {
          const value=window.PhotoAnswerFormat.vector(input.value,q.photoCodes.length);
          if (!value || (!q.alwaysAward && value.some(v=>!v))) {
            input.setCustomValidity("欄数に合わせて正解を / で区切ってください。");input.reportValidity();return;
          }
          input.setCustomValidity("");
          if (q.conditionalCorrect?.length && window.MarkReaderGrader.equalAnswers(q.answers,q.conditionalCorrect[0].answers,false)) q.conditionalCorrect[0].answers=value;
          q.answers=value;
          if (q.correctOptions) q.correctOptions[0]=value;
        } else if (input.dataset.field === "points") {
          q.photoPoints=input.value !== "" && Number.isInteger(Number(input.value)) && Number(input.value)>0;
          q.points=q.photoPoints ? Number(input.value) : 1;
          key.pointsAvailable=key.questions.every(q=>q.photoPoints);
        } else if (input.dataset.field === "mode") {
          const each=input.value.startsWith("each-");
          q.unordered=input.value==="unordered" || input.value==="each-unordered";
          q.alwaysAward=input.value==="award";
          q.photoRuleMode=input.value;
          q.partialAnyCorrect=each ? q.partialAnyCorrect || 0 : 0;
          const pointInput=$("answerKeyPhotoResult").querySelector('input[data-key="' + index + '"][data-field="each"]');
          pointInput.disabled=!each;pointInput.required=each;pointInput.value=each ? q.partialAnyCorrect || "" : "";
          // 手動で採点方法を指定した場合は、写真からの複雑な規則をその指定に置き換える。
          delete q.conditionalCorrect;delete q.partialConditions;delete q.partialAnswers;
        } else {
          const value=Number(input.value);
          if (!Number.isInteger(value) || value<=0 || q.photoPoints && value*q.answers.length>q.points) {
            input.setCustomValidity("各欄の部分点の合計が合計配点を超えないようにしてください。");input.reportValidity();return;
          }
          input.setCustomValidity("");q.partialAnyCorrect=value;
        }
        const eachInput=$("answerKeyPhotoResult").querySelector('input[data-key="' + index + '"][data-field="each"]');
        if (!eachInput.disabled) eachInput.setCustomValidity(!q.partialAnyCorrect
          ? "1つ正解の点を入力してください。"
          : !q.photoPoints
          ? "各欄の部分点を使う場合は合計配点を入力してください。"
          : q.partialAnyCorrect*q.answers.length>q.points ? "部分点の合計が合計配点を超えています。" : "");
        q.photoConfidence="high";save();
      };
    });
    const missing=key.photoEntryCount-key.photoCoverage;
    const status=[];
    if (missing>0) status.push("正解を確認できなかった" + missing + "欄は採点対象外です。");
    if (key.photoWarnings?.length) status.push([...new Set(key.photoWarnings)].join(" "));
    if (!key.pointsAvailable) status.push("配点が未確認のため、現在は正解数で採点します。");
    $("answerKeyPhotoStatus").textContent="正解・配点・採点方法を確認してください。" +
      (status.length ? " " + status.join(" ") : "");
  }

  async function readKeyPhotos(files = []) {
    if (busy || !answers.length) return;
    try { keyPhotos=uniqueFiles(keyPhotos,files); }
    catch (error) { $("answerKeyPhotoStatus").textContent=error.message; return; }
    if (!keyPhotos.length) return;
    const token=++run; busy=true; updateAvailability();
    $("answerKeyPhotoStatus").textContent=keyPhotos.length + "枚の解答写真を読み取っています…";
    try {
      const images=[];
      for (const file of keyPhotos) { images.push(await convert(file)); if (token!==run) return; }
      checkImageSize(images);
      const result=await window.MarkReaderAI.analyzeAnswerKey({subjectLabel:label(),entries,images});
      if (token!==run) return;
      key=makeKey(result); selectedGroups.clear(); renderKey(); review(false);
    } catch (error) {
      if (token!==run) return;
      $("answerKeyPhotoStatus").textContent=(error.message || "読み取れませんでした。") + " 下の再試行で同じ写真を使えます。";
    } finally { if (token===run) { busy=false; updateAvailability(); } }
  }

  function inputHandler(id, action) {
    $(id).onchange = () => { const files=[...($(id).files || [])]; $(id).value=""; if (files.length) action(files); };
  }
  inputHandler("initialFileInput",files => readSheets(files,true));
  inputHandler("galleryFileInput",files => readSheets(files,true));
  inputHandler("fileInput",files => readSheets(files,false));
  inputHandler("answerKeyPhotoInput",readKeyPhotos);
  inputHandler("answerKeyCameraInput",readKeyPhotos);
  $("retryButton").onclick=() => readSheets();
  $("answerKeyRetryButton").onclick=() => readKeyPhotos();
  $("errorBackButton").onclick=() => { show("setupCard"); stage("capture"); };
  $("backButton").onclick=() => { show("setupCard"); stage("capture"); };
  $("rescanButton").onclick=() => {
    $("captureTitle").textContent="答案写真を追加";
    $("captureHelp").textContent="別ページ・裏面・読みにくい欄の拡大写真を追加できます。読取済みの欄は保持します。";
    $("stepIndicator").classList.add("hidden"); show("captureCard"); stage("capture");
  };
  $("gradeButton").onclick=grade;
  $("resumeButton").onclick=restore;
  $("copyButton").onclick=async () => {
    const text=answers.map(entry => entry.group + " " + entry.label + ": " + (entry.value || "—")).join("\n");
    try { await navigator.clipboard.writeText(text); $("copyStatus").textContent="解答番号をコピーしました。"; }
    catch (_) { $("copyStatus").textContent=text; }
  };
  window.addEventListener("mark-reader-ai-ready",updateAvailability);
  window.UILabPhotoFlow = {
    configure,
    getContext:() => context ? {...context} : null,
    showReview:() => { if (answers.length) { review(false); if (!registered() && key) renderKey(); } },
    releaseImages:() => { run++; busy=false; sheets=[]; keyPhotos=[]; }
  };
  // 画面を離れたら写真を破棄し、古いAI応答の反映を止める。
  new MutationObserver(() => {
    if ($("photoScreen").hidden && $("resultScreen").hidden) window.UILabPhotoFlow.releaseImages();
  }).observe($("photoScreen"),{attributes:true,attributeFilter:["hidden"]});
  window.addEventListener("pagehide",() => window.UILabPhotoFlow.releaseImages());
  window.__universalPhotoDebug = {slotLabels,slots,mergeAnswers,makeKey};
  configure({mode:"compare",template:"standard",signature:"custom-photo-compare"});
})();
