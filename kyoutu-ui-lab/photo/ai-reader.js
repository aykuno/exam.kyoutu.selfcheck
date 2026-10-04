(() => {
  "use strict";

  const config = window.MARK_READER_AI_CONFIG || {};
  const MATH_VALUES = ["-", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "blank"];
  const KANA_ORDER = ["ア","イ","ウ","エ","オ","カ","キ","ク","ケ","コ","サ","シ","ス","セ","ソ","タ","チ","ツ","テ","ト","ナ","ニ","ヌ","ネ","ノ","ハ","ヒ","フ","ヘ","ホ"];
  const configured = Boolean(
    config.firebaseConfig &&
    config.firebaseConfig.apiKey &&
    config.firebaseConfig.appId &&
    config.firebaseConfig.projectId &&
    config.appCheckSiteKey
  );
  let aiContextPromise = null;
  let mathModelPromise = null;
  let answerKeyModelPromise = null;

  function isConfigured() {
    return configured;
  }

  async function getAiContext() {
    if (!configured) {
      throw new Error("Firebase AI Logicがまだ設定されていません。");
    }
    if (!aiContextPromise) {
      aiContextPromise = (async () => {
        const version = "12.16.0";
        const [{initializeApp}, appCheckSdk, aiSdk] = await Promise.all([
          import(`https://www.gstatic.com/firebasejs/${version}/firebase-app.js`),
          import(`https://www.gstatic.com/firebasejs/${version}/firebase-app-check.js`),
          import(`https://www.gstatic.com/firebasejs/${version}/firebase-ai.js`)
        ]);
        const firebaseApp = initializeApp(config.firebaseConfig, "mark-reader-ai");
        appCheckSdk.initializeAppCheck(firebaseApp, {
          provider: new appCheckSdk.ReCaptchaEnterpriseProvider(config.appCheckSiteKey),
          isTokenAutoRefreshEnabled: true
        });
        const ai = aiSdk.getAI(firebaseApp, {
          backend: new aiSdk.GoogleAIBackend()
        });
        return {ai, aiSdk};
      })().catch(error => {
        aiContextPromise = null;
        throw error;
      });
    }
    return aiContextPromise;
  }

  async function getMathModel() {
    if (!mathModelPromise) {
      mathModelPromise = (async () => {
        const {ai, aiSdk} = await getAiContext();
        const responseSchema = aiSdk.Schema.object({
          properties: {
            questions: aiSdk.Schema.array({
              items: aiSdk.Schema.object({
                properties: {
                  question: aiSdk.Schema.integer(),
                  answers: aiSdk.Schema.array({
                    items: aiSdk.Schema.object({
                      properties: {
                        symbol: aiSdk.Schema.string(),
                        value: aiSdk.Schema.enumString({
                          enum: MATH_VALUES
                        }),
                        confidence: aiSdk.Schema.enumString({
                          enum: ["high", "medium", "low"]
                        })
                      }
                    })
                  })
                }
              })
            })
          }
        });
        return aiSdk.getGenerativeModel(ai, {
          model: config.model || "gemini-3.5-flash-lite",
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 4096,
            responseMimeType: "application/json",
            responseSchema
          }
        });
      })().catch(error => {
        mathModelPromise = null;
        throw error;
      });
    }
    return mathModelPromise;
  }

  async function getAnswerKeyModel() {
    if (!answerKeyModelPromise) {
      answerKeyModelPromise = (async () => {
        const {ai, aiSdk} = await getAiContext();
        const responseSchema = aiSdk.Schema.object({
          properties: {
            examLabel: aiSdk.Schema.string(),
            maxScore: aiSdk.Schema.integer(),
            selectionRules: aiSdk.Schema.array({items: aiSdk.Schema.object({properties: {
              groups: aiSdk.Schema.array({items: aiSdk.Schema.string()}),
              choose: aiSdk.Schema.integer()
            }})}),
            answers: aiSdk.Schema.array({
              items: aiSdk.Schema.object({
                properties: {
                  codes: aiSdk.Schema.array({
                    items: aiSdk.Schema.string()
                  }),
                  answers: aiSdk.Schema.array({
                    items: aiSdk.Schema.string()
                  }),
                  alternatives: aiSdk.Schema.array({
                    items: aiSdk.Schema.string()
                  }),
                  group: aiSdk.Schema.string(),
                  points: aiSdk.Schema.integer(),
                  unordered: aiSdk.Schema.boolean(),
                  confidence: aiSdk.Schema.enumString({
                    enum: ["high", "medium", "low"]
                  })
                }
              })
            })
          }
        });
        return aiSdk.getGenerativeModel(ai, {
          model: config.model || "gemini-3.5-flash-lite",
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
            responseSchema
          }
        });
      })().catch(error => {
        answerKeyModelPromise = null;
        throw error;
      });
    }
    return answerKeyModelPromise;
  }

  function validateResponse(value, expectedQuestions) {
    if (!value || !Array.isArray(value.questions)) {
      throw new Error("Geminiの応答形式を確認できませんでした。");
    }
    const expected = new Set(expectedQuestions);
    const questions = value.questions
      .filter(question =>
        Number.isInteger(question.question) &&
        expected.has(question.question) &&
        Array.isArray(question.answers)
      )
      .map(question => ({
        question: question.question,
        answers: question.answers
          .filter(answer =>
            typeof answer.symbol === "string" &&
            MATH_VALUES.includes(answer.value) &&
            ["high", "medium", "low"].includes(answer.confidence)
          )
          .map(answer => ({
            symbol: answer.symbol.trim(),
            value: answer.value,
            confidence: answer.confidence
          }))
          .filter(answer => KANA_ORDER.includes(answer.symbol))
          .sort((a, b) => KANA_ORDER.indexOf(a.symbol) - KANA_ORDER.indexOf(b.symbol))
      }));
    const returnedQuestions = new Set(questions.map(question => question.question));
    if (
      questions.length !== expected.size ||
      [...expected].some(question => !returnedQuestions.has(question)) ||
      questions.some(question => !question.answers.length)
    ) {
      throw new Error("Geminiが有効な解答を返しませんでした。");
    }
    return questions;
  }

  async function analyzeMathPage({subject, pageNumber, blocks}) {
    const model = await getMathModel();
    const questionNumbers = blocks.map(block => block.question);
    const prompt = [
      "日本の大学入学共通テスト数学のマークシート解答欄を読み取ってください。",
      `科目は${subject === "math1" ? "数学①" : "数学②"}、第${pageNumber}面です。`,
      "この後の画像は大問ごとの解答欄です。",
      `この面にある大問番号の集合: ${questionNumbers.join(", ")}`,
      "各画像の直前に示す大問番号を、その画像のquestionとしてそのまま返してください。",
      "画像上部の枠内に印刷された大きな大問番号（1、2…）は照合に使い、別の大問の解答を混ぜないでください。",
      "画像は端末側で正立させています。まず、印刷された日本語とア・イ・ウ…が上から下へ正立していることを確認してください。万一上下逆なら、頭の中で180度回転してから読み取ってください。",
      "黒または灰色の鉛筆で塗られた丸だけを解答として扱ってください。",
      "赤ペン、赤鉛筆、印刷済みの黒い数字・罫線・丸の輪郭、薄い消し跡は無視してください。",
      "各行の左側に印刷されたア、イ、ウ…の記号と、どの丸が塗られているかを対応付けてください。",
      "数学の選択肢は各行に11列あり、左端から必ず「−、0、1、2、3、4、5、6、7、8、9」です。印刷文字が不鮮明でも、この列位置を優先してください。",
      "各行では最初に左端の「−」列を独立して確認してください。左端の丸が塗られていれば、数字として扱わずvalueを半角文字列の\"-\"にしてください。",
      "数字が塗られている場合、valueには位置番号ではなく、丸の上に印刷された数字を文字列で返してください。例えば2の丸ならvalue=\"2\"です。",
      "明確な鉛筆の塗りがない行は、印刷された輪郭だけを選ばずvalue=\"blank\"にしてください。",
      "二重マークや判別困難は最も有力な値を返し、confidence=\"low\"にしてください。",
      "画像に実在する解答記号を上から順にすべて返してください。未記入行も省略せず、存在しない行は補完しないでください。",
      "返答前に全行の左端列をもう一度見直し、「−」の塗りを数字やblankにしていないか確認してください。"
    ].join("\n");
    const parts = [{text: prompt}];
    blocks.forEach((block, index) => {
      parts.push({text: `解答欄画像${index + 1}は第${block.question}問です。question=${block.question}として返してください。`});
      parts.push({inlineData: {data: block.data, mimeType: block.mimeType}});
    });
    const result = await model.generateContent(parts);
    let parsed;
    try {
      parsed = JSON.parse(result.response.text());
    } catch (_) {
      throw new Error("Geminiの応答をJSONとして読み取れませんでした。");
    }
    return validateResponse(parsed, questionNumbers);
  }

  function validateAnswerKeyResponse(value, expectedCodes) {
    if (!value || !Array.isArray(value.answers)) {
      throw new Error("解答写真のAI応答形式を確認できませんでした。");
    }
    const expected = new Set(expectedCodes);
    const used = new Set();
    const answers = [];
    for (const item of value.answers) {
      const codes = Array.isArray(item?.codes)
        ? item.codes.map(code => typeof code === "string" ? code.trim() : "").filter(Boolean)
        : [];
      const values = Array.isArray(item?.answers)
        ? item.answers.map(answer => typeof answer === "string" ? answer.trim() : "")
        : [];
      if (
        !codes.length ||
        codes.length !== values.length ||
        new Set(codes).size !== codes.length ||
        codes.some(code => !expected.has(code) || used.has(code)) ||
        !["high", "medium", "low"].includes(item.confidence)
      ) {
        continue;
      }
      codes.forEach(code => used.add(code));
      answers.push({
        codes,
        answers: values,
        alternatives: Array.isArray(item.alternatives)
          ? item.alternatives.map(value => String(value || "").trim()).filter(Boolean)
          : [],
        group: typeof item.group === "string" && item.group.trim()
          ? item.group.trim()
          : "全体",
        points: Number.isInteger(item.points) && item.points > 0 ? item.points : null,
        unordered: Boolean(item.unordered),
        confidence: item.confidence
      });
    }
    return {
      examLabel: typeof value.examLabel === "string" ? value.examLabel.trim() : "",
      maxScore: Number.isInteger(value.maxScore) && value.maxScore > 0 ? value.maxScore : null,
      answers,
      selectionRules: Array.isArray(value.selectionRules) ? value.selectionRules.filter(rule =>
        Array.isArray(rule.groups) && rule.groups.length > 0 &&
        rule.groups.every(group => typeof group === "string" && group.length < 80) &&
        new Set(rule.groups).size === rule.groups.length &&
        Number.isInteger(rule.choose) && rule.choose > 0 && rule.choose <= rule.groups.length
      ).map(rule => ({groups: rule.groups.slice(), choose: rule.choose})) : []
    };
  }

  async function analyzeAnswerKey({subjectLabel, entries, images}) {
    if (!Array.isArray(entries) || !entries.length) {
      throw new Error("答案用紙の解答欄を確認できません。");
    }
    if (!Array.isArray(images) || !images.length) {
      throw new Error("解答の写真がありません。");
    }
    const model = await getAnswerKeyModel();
    const entryList = entries.map(entry => `${entry.code}: ${entry.label}`).join("\n");
    const prompt = [
      "日本の大学入学共通テストまたは模擬試験の、正解・配点一覧の写真を読み取ってください。",
      `科目: ${subjectLabel}`,
      "下記は、別の写真から読み取った答案用紙の解答欄コードと印刷ラベルです。正答の値は含まれていません。",
      entryList,
      "",
      "写真に実際に掲載され、正答を判読できる採点単位だけをanswersへ返してください。",
      "codesには上記コードをそのまま使い、answersには各コードに対応する正解の数字・英字・記号を同じ順で文字列として入れてください。0〜9やa〜fだけとは限りません。",
      "例: Q1-ア、Q1-イ、Q1-ウが「−、1、6」ならcodesを3件、answersを[\"-\",\"1\",\"6\"]にします。",
      "番号19と20が一括で4点なら、codesを2件まとめ、points=4の1採点単位にしてください。各欄が別配点なら分けてください。",
      "「−」は独立した正解1文字です。長音やダッシュにせず半角の\"-\"にしてください。",
      "別解が印刷されている場合、正解をコード順に連結した文字列をalternativesへ追加してください。",
      "順不同と明記されている採点単位だけunordered=trueにしてください。",
      "groupは答案欄一覧に示した大問名と一致させてください。大問を確認できなければ「全体」にしてください。",
      "pointsは、その採点単位の配点が写真に明記されている場合だけ正の整数にしてください。配点がない、または判読不能なら0にしてください。",
      "写真に試験名が明記されていればexamLabelへ転記し、なければ空文字にしてください。",
      "満点が明記されていればmaxScoreへ入れ、なければ0にしてください。配点や満点を推測しないでください。",
      "選択問題の規則が写真に明記されている場合だけ、selectionRulesにgroupsとchoose（選ぶ問数）を転記してください。明記されていなければ空配列にしてください。groupsはanswersのgroupと一致させてください。",
      "写真にない項目、隠れている項目、判読できない項目は返さないでください。",
      "一つのコードを複数の採点単位へ重複させないでください。",
      "複数写真に同じ項目がある場合は、最も鮮明なものを1件だけ返してください。",
      "返答前に、answers配列の各値と、左端の「−」を一つずつ再確認してください。"
    ].join("\n");
    const parts = [{text: prompt}];
    images.forEach((image, index) => {
      parts.push({text: `解答一覧の写真 ${index + 1}/${images.length}`});
      parts.push({inlineData: {data: image.data, mimeType: image.mimeType}});
    });
    const result = await model.generateContent(parts);
    let parsed;
    try {
      parsed = JSON.parse(result.response.text());
    } catch (_) {
      throw new Error("解答写真のAI応答をJSONとして読み取れませんでした。");
    }
    return validateAnswerKeyResponse(parsed, entries.map(entry => entry.code));
  }


  let sheetModelPromise = null;
  const CONFIDENCE = ["high", "medium", "low"];

  function normalizeToken(value) {
    return String(value ?? "").normalize("NFKC").trim()
      .replace(/[−‐‑‒–—―ー]/g, "-").toLowerCase();
  }

  function validateSheetResponse(value, entries = []) {
    if (!value || !Array.isArray(value.answers)) {
      throw new Error("答案写真のAI応答形式を確認できませんでした。同じ写真で再試行できます。");
    }
    const expected = new Map(entries.map(entry => [entry.code, entry]));
    const found = new Map();
    for (const item of value.answers) {
      if (!item || typeof item.code !== "string" || typeof item.value !== "string" ||
          !CONFIDENCE.includes(item.confidence)) continue;
      const code = item.code.trim();
      if (!code || code.length > 160 || (expected.size && !expected.has(code))) continue;
      const token = item.value === "blank" || item.value === "unknown" ? "" : normalizeToken(item.value);
      if (token.length > 32) continue;
      const metadata = expected.get(code);
      const answer = {
        code,
        label: metadata?.label || String(item.label || code).slice(0, 120),
        group: metadata?.group || String(item.group || "全体").slice(0, 80),
        value: token,
        state: item.value === "unknown" || item.confidence !== "high" ? "warn" :
          token === "" ? "blank" : "ok",
        aiConfidence: item.confidence
      };
      const previous = found.get(code);
      if (previous) {
        if (previous.value !== token) {
          previous.value = "";
          previous.state = "warn";
          previous.aiConfidence = "low";
        } else if (answer.state === "warn") previous.state = "warn";
      } else found.set(code, answer);
    }
    if (!found.size) throw new Error("解答欄を特定できませんでした。同じ写真で再試行するか、欄を写した写真を追加してください。");
    return [...found.values()];
  }

  async function getSheetModel() {
    if (!sheetModelPromise) {
      sheetModelPromise = (async () => {
        const {ai, aiSdk} = await getAiContext();
        return aiSdk.getGenerativeModel(ai, {
          model: config.model || "gemini-3.5-flash-lite",
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 16384,
            responseMimeType: "application/json",
            responseSchema: aiSdk.Schema.object({properties: {
              answers: aiSdk.Schema.array({items: aiSdk.Schema.object({properties: {
                code: aiSdk.Schema.string(),
                label: aiSdk.Schema.string(),
                group: aiSdk.Schema.string(),
                value: aiSdk.Schema.string(),
                confidence: aiSdk.Schema.enumString({enum: CONFIDENCE})
              }})})
            }})
          }
        });
      })().catch(error => { sheetModelPromise = null; throw error; });
    }
    return sheetModelPromise;
  }

  async function analyzeAnswerSheet({subjectLabel, entries = [], images}) {
    if (!images?.length) throw new Error("答案の写真がありません。");
    const model = await getSheetModel();
    const prompt = [
      "試験の答案写真から、受験者が実際にマーク・記入した解答を読み取ってください。科目や用紙の固定座標を仮定しないでください。",
      "科目: " + subjectLabel,
      "マークシート、手書きの番号・記号、印刷された解答欄に対応します。写真の問題を解いて答えを生成してはいけません。",
      "まず印刷された日本語が読める向きに解釈し、大問・小問・解答欄ラベルと選択肢を確認してください。",
      "列数や並びを決めつけず、各列に実際に印刷された数字・英字・記号を読み、塗られた列の値を返してください。",
      "数学の−は独立した選択肢です。0と取り違えず半角の-で返してください。情報等のa〜fや他の英字は小文字で返してください。",
      "赤い採点印、印刷の輪郭、薄い消し跡は解答に含めないでください。",
      "未記入と確認できる欄はvalue=blank。二重マーク、ラベル不明、読めない値はvalue=unknown、confidence=low。推測で埋めないでください。",
      "画像にない欄は返さないでください。未記入欄も実際に見える場合だけ返してください。",
      "複数写真は同じ試験の別ページまたは同じページの拡大です。用紙の順番や表裏を仮定しないでください。同じ欄は一度だけ返し、食い違う場合はunknownにしてください。",
      "答案写真に正解一覧や問題が混在していても受験者の解答欄のみを読んでください。",
      entries.length ?
        "照合先の欄一覧（正解の値は含みません）。必ずこのcodeを使い、group・labelで照合してください。別の大問や同名の欄を混同しないでください。\n" +
        entries.map(entry => entry.code + ": " + entry.group + " / " + entry.label).join("\n") :
        "欄一覧がないので、印刷されたラベルを使ってcodeを生成してください。codeは大問/小問/欄の一意な文字列（例 Q1/ア、N19）。groupは印刷された大問名、labelは欄ラベル。見えない大問は全体とし、同じ記号を勝手に統合しないでください。",
      "返答前に、ラベル・値・負号・英字を全欄見直してください。確信がない場合はlowにしてください。"
    ].join("\n");
    const parts = [{text: prompt}];
    images.forEach((image, index) => {
      parts.push({text: "答案写真 " + (index + 1) + "/" + images.length});
      parts.push({inlineData: {data: image.data, mimeType: image.mimeType}});
    });
    const result = await model.generateContent(parts);
    let parsed;
    try { parsed = JSON.parse(result.response.text()); }
    catch (_) { throw new Error("答案写真のAI応答をJSONとして読み取れませんでした。同じ写真で再試行できます。"); }
    return validateSheetResponse(parsed, entries);
  }

  window.MarkReaderAI = Object.freeze({
    isConfigured,
    analyzeMathPage,
    analyzeAnswerSheet,
    analyzeAnswerKey,
    debug: Object.freeze({validateAnswerKeyResponse, validateSheetResponse})
  });
  window.dispatchEvent(new CustomEvent("mark-reader-ai-ready"));
})();
