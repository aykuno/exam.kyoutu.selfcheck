/* 写真採点の欄・採点単位の整理 v20261004-accuracy1 */
(() => {
  "use strict";
  const KANA = [..."アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン"];
  const norm = value => String(value ?? "").normalize("NFKC").trim()
    .replace(/[−‐‑‒–—―ー]/g, "-").toLowerCase();
  const group = value => {
    const text = String(value || "全体").normalize("NFKC").trim();
    const match = text.match(/^(?:Q\s*|第\s*)(\d+)(?:\s*問)?$/i);
    return match ? "第" + Number(match[1]) + "問" : text;
  };
  function labels(value) {
    let text = String(value ?? "").normalize("NFKC").trim();
    const prefix=text.match(/^(?:第\s*\d+\s*問|Q\s*\d+)\s*[:：/-]?\s*(.*)$/i);
    if (prefix?.[1]) text=prefix[1];
    let match = text.match(/^(\d+)\s*[-~〜～]\s*(\d+)$/);
    if (match) {
      const first = Number(match[1]), last = Number(match[2]);
      if (last >= first && last - first < 200)
        return Array.from({length:last-first+1}, (_,i) => String(first+i));
    }
    match = text.match(/^([ァ-ヶa-z])\s*[-~〜～]\s*([ァ-ヶa-z])$/i);
    if (match) {
      const order = KANA.includes(match[1]) ? KANA : [..."abcdefghijklmnopqrstuvwxyz"];
      const first = order.indexOf(match[1].toLowerCase()), last = order.indexOf(match[2].toLowerCase());
      if (first >= 0 && last >= first) return order.slice(first,last+1);
    }
    const parts = text.split(/\s*[,，、・/;]\s*|\s+/).filter(Boolean);
    if (parts.length > 1) return parts;
    const kana = [...text].filter(c => KANA.includes(c));
    if (kana.length && text.replace(/[ァ-ヶ\d\s:：()（）-]/g,"") === "") return kana;
    if (/^[a-z]{2,}$/i.test(text)) return [...text.toLowerCase()];
    return text ? [text] : [];
  }
  function slots(question) {
    if (question.photoLabels?.length) return question.photoLabels.length;
    const lengths = [question.answers?.length,
      ...(question.correctOptions || []).map(a => a.length),
      ...(question.conditionalCorrect || []).map(a => a.answers?.length)].filter(Number.isInteger);
    if (lengths.length) return Math.max(1,...lengths);
    const printed=labels(question.id);
    return printed.length && printed.every(label=>/^\d+$/.test(label) || KANA.includes(label) || /^[a-z]$/i.test(label)) ? printed.length : 1;
  }
  function slotLabels(question) {
    const count = slots(question), printed = labels(question.id);
    if (printed.length === count) return printed;
    if (question.photoLabels?.length === count) return question.photoLabels.slice();
    if (count === 1) return [String(question.id || "")];
    return Array.from({length:count},(_,i) => String(question.id || "") + "（" + (i+1) + "欄目）");
  }
  // 欄数が明確な場合だけ連結値を分解する。1欄の「10」は「1」「0」にしない。
  function vector(value,count) {
    if (!Number.isInteger(count) || count < 1 || value == null) return null;
    if (Array.isArray(value)) {
      if (value.length === count) return value.map(norm);
      if (value.length === 1 && count > 1) return vector(value[0],count);
      return null;
    }
    const text = norm(value);
    if (count === 1) return [text];
    const parts = text.split(/\s*[/,，、・;|]\s*|\s+/).filter(Boolean);
    if (parts.length === count) return parts;
    if (/^[-0-9a-z]+$/.test(text) && [...text].length === count) return [...text];
    return null;
  }
  function resolve(item,entries,allowAdditional=false) {
    const byCode = new Map(entries.map(e => [e.code,e]));
    const rawCodes = Array.isArray(item.codes) && item.codes.length ? item.codes :
      typeof item.codes === "string" ? item.codes.split(/[,，、;\s]+/).filter(Boolean) :
      item.code ? [item.code] : [];
    if (rawCodes.length > 1 && rawCodes.every(code => byCode.has(code)))
      return rawCodes.map(code => byCode.get(code));
    const printed = item.label ? labels(item.label) : rawCodes.flatMap(code => labels(code));
    const itemGroup = group(item.group);
    if (printed.length > 1) {
      const matches = printed.map(label => {
        let options = entries.filter(e => norm(e.label) === norm(label));
        const scoped = options.filter(e => group(e.group) === itemGroup);
        if (itemGroup !== "全体" || scoped.length) options = scoped;
        return options.length === 1 ? options[0] : null;
      });
      if (matches.every(Boolean)) return matches;
    }
    if (rawCodes.length && rawCodes.every(code => byCode.has(code)))
      return rawCodes.map(code => byCode.get(code));
    if (printed.length === 1) {
      let options = entries.filter(e => norm(e.label) === norm(printed[0]));
      const scoped = options.filter(e => group(e.group) === itemGroup);
      if (itemGroup !== "全体" || scoped.length) options = scoped;
      if (options.length === 1) return options;
    }
    if (!allowAdditional || !printed.length) return [];
    return printed.map(label => ({
      code:"C|" + itemGroup + "|" + norm(label),label,group:itemGroup
    }));
  }
  function columnProfile(subjectLabel) {
    const subject=String(subjectLabel || "").normalize("NFKC");
    if (/数学|\bmath/i.test(subject)) return {
      kind:"math",options:["-","0","1","2","3","4","5","6","7","8","9"],
      instruction:"共通テスト・センター数学の標準列は左から−、0、1、2、3、4、5、6、7、8、9です。左から1列目は−、2列目は0、3列目は1です。負号の列を飛ばさず確認してください。"
    };
    if (/英語|国語|地理|歴史|公共|政治|倫理|物理|化学|生物|地学|english|japanese/i.test(subject)) return {
      kind:"numbered",options:Array.from({length:10},(_,i)=>String(i+1)),
      instruction:"英語・国語等の標準的な番号選択欄は左端が1で、左から1、2、3…です。左から1列目を0にしないでください。列の数は行によって違うので、実際に印刷された最後の選択肢まで確認してください。"
    };
    return {kind:"mixed",options:[],
      instruction:"写真に印刷された科目・行ごとの選択肢を確認してください。数学の標準列は−、0、1…9、英語等の番号選択欄は1、2、3…です。情報などは0始まりや英字の欄もあるので、すべてを1始まりにしないでください。"};
  }
  function markLayouts(value) {
    const layouts=new Map();
    for (const item of Array.isArray(value.layouts) ? value.layouts : []) {
      if (!item || typeof item.id!=="string" || !item.id) continue;
      const options=Array.isArray(item.options) ? item.options.map(norm) : [];
      const valid=options.length>=2 && options.length<=50 &&
        options.every(x=>x && x.length<=32 && x!=="blank" && x!=="unknown") &&
        new Set(options).size===options.length && ["high","medium","low"].includes(item.confidence);
      if (layouts.has(item.id)) layouts.set(item.id,null);
      else layouts.set(item.id,valid ? {...item,options} : null);
    }
    return layouts;
  }
  function readMarkedColumn(item,layouts,count) {
    const hasEvidence=item.kind==="mark" || item.layoutId || item.markedIndices!==undefined;
    if (item.kind==="unknown") return {value:"unknown",confidence:"low"};
    if (!hasEvidence) return null; // 保存済み・旧応答の形式との互換性。
    const layout=layouts.get(item.layoutId),indices=item.markedIndices;
    const invalid={value:"unknown",confidence:"low"};
    if (item.kind==="handwritten" || count!==1 || !layout || !Array.isArray(indices)) return invalid;
    if (indices.length>1 || indices.some(i=>!Number.isInteger(i)||i<0||i>=layout.options.length)) return invalid;
    if (norm(item.value)==="unknown") return invalid;
    if (!indices.length) return norm(item.value)==="blank" ?
      {value:"blank",confidence:item.confidence==="high"&&layout.confidence==="high" ? "high":"low"} : invalid;
    if (norm(item.value)==="blank") return invalid;
    // 数字の返答よりも、印刷された列の並びと塗り位置の対応を採用する。
    return {value:layout.options[indices[0]],
      confidence:item.confidence==="high"&&layout.confidence==="high" ? "high":"low",
      markPosition:indices[0]+1,layoutId:item.layoutId};
  }
  function normalizeSheet(value,entries=[],allowAdditional=false) {
    if (!value || !Array.isArray(value.answers)) throw new Error("答案写真のAI応答形式を確認できませんでした。");
    const found = new Map(), layouts=markLayouts(value);
    for (const item of value.answers) {
      if (!item || !["high","medium","low"].includes(item.confidence)) continue;
      const mapped = resolve(item,entries,allowAdditional || !entries.length);
      if (!mapped.length || new Set(mapped.map(e => e.code)).size !== mapped.length) continue;
      const printed=item.label ? labels(item.label) : [];
      const metadataConflict=(printed.length===mapped.length && printed.some((label,i)=>norm(label)!==norm(mapped[i].label))) ||
        (item.group && group(item.group)!=="全体" && mapped.some(entry=>group(entry.group)!==group(item.group)));
      const marked=readMarkedColumn(item,layouts,mapped.length);
      const confidence=metadataConflict ? "low" : marked?.confidence || item.confidence;
      const values=metadataConflict ? null : marked ? vector(marked.value,mapped.length) :
        vector(Array.isArray(item.values) && item.values.length ? item.values : item.value,mapped.length);
      mapped.forEach((entry,index) => {
        const raw = values?.[index], uncertain = !values || raw === "unknown" || raw === "" || raw === undefined;
        const token = uncertain || raw === "blank" ? "" : norm(raw);
        const answer = {...entry,value:token.length <= 32 ? token : "",
          state:uncertain || token.length > 32 || confidence !== "high" ? "warn" : token ? "ok" : "blank",
          aiConfidence:uncertain ? "low" : confidence,
          ...(marked?.markPosition ? {markPosition:marked.markPosition} : {})};
        const old = found.get(entry.code);
        if (old) {
          if (old.value !== answer.value) {
            old.value="";old.state="warn";old.aiConfidence="low";
          } else if (answer.state === "warn") old.state="warn";
        } else found.set(entry.code,answer);
      });
    }
    if (!found.size) throw new Error("解答欄を特定できませんでした。同じ写真で再試行できます。");
    return [...found.values()];
  }
  function normalizeKey(value,entries) {
    if (!value || !Array.isArray(value.answers)) throw new Error("解答写真のAI応答形式を確認できませんでした。");
    const used = new Set(), answers = [], warnings = [];
    const cleanVector = (v,count) => {
      const result = vector(v,count);
      return result && result.every(x => x && x !== "unknown" && x !== "blank" && x.length <= 32) ? result : null;
    };
    for (const item of value.answers) {
      if (!item || !["high","medium","low"].includes(item.confidence)) continue;
      const mapped = resolve(item,entries), count = mapped.length;
      if (!count || new Set(mapped.map(e=>e.code)).size !== count || mapped.some(e=>used.has(e.code))) {
        warnings.push("解答欄を一意に照合できない採点項目があります。"); continue;
      }
      const values = item.alwaysAward ? Array(count).fill("") :
        cleanVector(item.answers ?? item.answer,count);
      const options = [...(item.correctOptions || []),...(item.alternatives || [])]
        .map(option => cleanVector(option.answers ?? option,count)).filter(Boolean);
      const conditionalCorrect = [];
      for (const rule of item.conditionalCorrect || []) {
        const wanted = cleanVector(rule.answers,count);
        const allOf = (rule.allOf || []).map(dependency => {
          const code = dependency.ifCode || dependency.ifId;
          const target = entries.find(e=>e.code === code);
          const expected = cleanVector(dependency.ifEquals,1);
          return target && expected ? {ifId:target.code,ifEquals:expected,ifUnordered:false} : null;
        });
        if (wanted && allOf.length && allOf.every(Boolean))
          conditionalCorrect.push({answers:wanted,allOf,unordered:Boolean(rule.unordered)});
      }
      if (!values && !options.length && !conditionalCorrect.length) {
        warnings.push("正解を判読できない採点項目があります。"); continue;
      }
      if ((item.conditionalCorrect || []).length !== conditionalCorrect.length) {
        warnings.push("条件付き正解の規則を照合できない採点項目があります。"); continue;
      }
      const points = Number.isInteger(item.points) && item.points > 0 ? item.points : null;
      const partialAnswers = (item.partialAnswers || []).map(partial => {
        const wanted = cleanVector(partial.answers,count), pts = Number(partial.points);
        return wanted && Number.isFinite(pts) && pts > 0 && points && pts < points
          ? {answers:wanted,points:pts,unordered:Boolean(partial.unordered)} : null;
      }).filter(Boolean);
      const partialConditions = (item.partialConditions || []).map(partial => {
        const wanted = vector(partial.answers,count), pts = Number(partial.points);
        return wanted && wanted.every(x=>x && x.length <=32) && points && pts > 0 && pts < points
          ? {answers:wanted,points:pts} : null;
      }).filter(Boolean);
      const each = Number(item.partialAnyCorrect);
      const partialAnyCorrect = points && each > 0 && each * count <= points ? each : 0;
      mapped.forEach(e=>used.add(e.code));
      answers.push({codes:mapped.map(e=>e.code),answers:values || options[0] || conditionalCorrect[0].answers,
        correctOptions:options,alternatives:[],group:group(mapped[0].group),
        points,unordered:Boolean(item.unordered),partialAnyCorrect,partialAnswers,partialConditions,
        conditionalCorrect,alwaysAward:Boolean(item.alwaysAward),
        confidence:item.confidence,note:typeof item.note === "string" ? item.note.slice(0,1000) : ""});
    }
    return {examLabel:typeof value.examLabel === "string" ? value.examLabel.trim() : "",
      maxScore:Number.isInteger(value.maxScore) && value.maxScore > 0 ? value.maxScore : null,
      answers,warnings,
      selectionRules:(value.selectionRules || []).filter(rule =>
        Array.isArray(rule.groups) && rule.groups.length &&
        rule.groups.every(g=>typeof g==="string" && g.length < 120) &&
        Number.isInteger(rule.choose) && rule.choose > 0 && rule.choose <= rule.groups.length
      ).map(rule=>({groups:rule.groups.map(group),choose:rule.choose}))
        .filter(rule=>new Set(rule.groups).size===rule.groups.length)};
  }
  function ruleText(question) {
    const result = [];
    if (question.alwaysAward) return "全員得点";
    if ((question.photoCodes || question.answers || []).length > 1)
      result.push(question.unordered ? "順不同" : "欄の順番どおり");
    if (question.partialAnyCorrect) result.push("1つ正解につき" + question.partialAnyCorrect + "点");
    else if ((question.photoCodes || question.answers || []).length > 1) result.push("すべて正解で得点");
    if (question.correctOptions?.length) result.push("別解あり");
    if (question.partialAnswers?.length || question.partialConditions?.length) result.push("指定の部分点あり");
    if (question.conditionalCorrect?.length) result.push("他の欄の解答に応じた正解");
    return result.join("・");
  }
  window.PhotoAnswerFormat = Object.freeze({norm,group,labels,slots,slotLabels,vector,resolve,
    normalizeSheet,normalizeKey,ruleText,columnProfile});
})();