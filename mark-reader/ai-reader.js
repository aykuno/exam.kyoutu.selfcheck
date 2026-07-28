(() => {
  "use strict";

  const config = window.MARK_READER_AI_CONFIG || {};
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
          backend: new aiSdk.GoogleAIBackend(),
          useLimitedUseAppCheckTokens: true
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
                        value: aiSdk.Schema.integer(),
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
          model: config.model || "gemini-2.5-flash",
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
            Number.isInteger(answer.value) &&
            answer.value >= -1 &&
            answer.value <= 9 &&
            ["high", "medium", "low"].includes(answer.confidence)
          )
          .map(answer => ({
            symbol: answer.symbol.trim(),
            value: answer.value,
            confidence: answer.confidence
          }))
      }));
    if (!questions.length) {
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
      "この後の画像は大問ごとの解答欄で、画像の順番と大問番号は一致します。",
      `大問番号: ${questionNumbers.join(", ")}`,
      "黒または灰色の鉛筆で塗られた丸だけを解答として扱ってください。",
      "赤ペン、赤鉛筆、印刷済みの黒い数字・罫線・丸の輪郭、薄い消し跡は無視してください。",
      "各行の左側に印刷されたア、イ、ウ…の記号と、0〜9のどの丸が塗られているかを対応付けてください。",
      "塗られていない行はvalue=-1としてください。二重マークや判別困難は最も有力な値を返しconfidence=lowとしてください。",
      "画像に実在する解答記号だけを返し、存在しない行を補完しないでください。"
    ].join("\n");
    const parts = [{text: prompt}];
    blocks.forEach(block => {
      parts.push({text: `第${block.question}問の解答欄`});
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
