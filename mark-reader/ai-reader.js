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
  let modelPromise = null;

  function isConfigured() {
    return configured;
  }

  async function getModel() {
    if (!configured) {
      throw new Error("Firebase AI Logicがまだ設定されていません。");
    }
    if (!modelPromise) {
      modelPromise = (async () => {
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
        modelPromise = null;
        throw error;
      });
    }
    return modelPromise;
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
    const model = await getModel();
    const questionNumbers = blocks.map(block => block.question);
    const prompt = [
      "日本の大学入学共通テスト数学のマークシート解答欄を読み取ってください。",
      `科目は${subject === "math1" ? "数学①" : "数学②"}、第${pageNumber}面です。`,
      "この後の画像は大問ごとの解答欄です。",
      `この面にある大問番号の集合: ${questionNumbers.join(", ")}`,
      "画像の順番から大問番号を推測しないでください。各画像上部の枠内に印刷された大きな大問番号（1、2…）を読み、その実際の番号をquestionにしてください。",
      "まず、印刷された日本語とア・イ・ウ…が正立して読める向きを確認してください。画像が上下逆なら、頭の中で180度回転してから上から下へ読み取ってください。",
      "黒または灰色の鉛筆で塗られた丸だけを解答として扱ってください。",
      "赤ペン、赤鉛筆、印刷済みの黒い数字・罫線・丸の輪郭、薄い消し跡は無視してください。",
      "各行の左側に印刷されたア、イ、ウ…の記号と、どの丸が塗られているかを対応付けてください。",
      "数学の選択肢は、各行とも左から「−、0、1、2、3、4、5、6、7、8、9」です。",
      "先頭の「−」も正規の解答選択肢です。塗られている場合は無視せず、valueを半角文字列の\"-\"にしてください。",
      "数字が塗られている場合、valueには位置番号ではなく、丸の上に印刷された数字を文字列で返してください。例えば2の丸ならvalue=\"2\"です。",
      "明確な鉛筆の塗りがない行は、印刷された輪郭だけを選ばずvalue=\"blank\"にしてください。",
      "二重マークや判別困難は最も有力な値を返し、confidence=\"low\"にしてください。",
      "画像に実在する解答記号を上から順にすべて返してください。未記入行も省略せず、存在しない行は補完しないでください。"
    ].join("\n");
    const parts = [{text: prompt}];
    blocks.forEach((block, index) => {
      parts.push({text: `解答欄画像${index + 1}。大問番号は画像内の印刷見出しから判定してください。`});
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

  window.MarkReaderAI = Object.freeze({isConfigured, analyzeMathPage});
  window.dispatchEvent(new CustomEvent("mark-reader-ai-ready"));
})();
