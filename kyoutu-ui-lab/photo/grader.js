(() => {
  "use strict";

  const KANA = [
    "ア","イ","ウ","エ","オ","カ","キ","ク","ケ","コ",
    "サ","シ","ス","セ","ソ","タ","チ","ツ","テ","ト",
    "ナ","ニ","ヌ","ネ","ノ","ハ","ヒ","フ","ヘ","ホ"
  ];
  const KANA_SET = new Set(KANA);

  function norm(value) {
    return String(value ?? "")
      .normalize("NFKC")
      .trim()
      .replace(/[−‐‑‒–—―ー－]/g, "-")
      .toLowerCase();
  }

  function points(question) {
    const value = question.points ?? question.point;
    return value == null ? 1 : (Number(value) || 0);
  }

  function groupLabel(value) {
    const text = String(value || "全体").normalize("NFKC").trim();
    const match = text.match(/^(?:Q\s*|第\s*)([0-9]+)(?:\s*問)?$/i);
    return match ? `第${Number(match[1])}問` : text;
  }

  function expected(question) {
    if (Array.isArray(question.answers)) return question.answers.map(norm);
    const values = window.PhotoAnswerFormat?.vector(question.answer, question.photoCodes?.length || 1);
    return values || [norm(question.answer)];
  }

  function toArray(value) {
    return Array.isArray(value) ? value.map(norm) : [norm(value)];
  }

  function equalAnswers(got, wanted, unordered) {
    const actual = toArray(got);
    const correct = toArray(wanted);
    if (actual.length !== correct.length) return false;
    if (!unordered) return actual.every((value, index) => value === correct[index]);
    return actual.slice().sort().every((value, index) => value === correct.slice().sort()[index]);
  }

  function questionNumber(question) {
    const candidates = [
      question.problemNumber,
      question.group,
      question.id
    ].filter(Boolean);
    for (const candidate of candidates) {
      const text = String(candidate).normalize("NFKC");
      const explicit = text.match(/(?:第\s*)?([1-7])\s*問|Q\s*([1-7])/i);
      if (explicit) return Number(explicit[1] || explicit[2]);
      const leading = text.match(/^\s*([1-7])(?:\s*[-－]|$)/);
      if (leading) return Number(leading[1]);
    }
    return null;
  }

  function answerSymbols(question) {
    return [...String(question.id || "").normalize("NFKC")]
      .filter(character => KANA_SET.has(character));
  }

  function standardNumbers(question) {
    return [...String(question.id || "").normalize("NFKC").matchAll(/\d+/g)]
      .map(match => Number(match[0]))
      .filter(Number.isFinite);
  }

  function standardNumber(question) {
    return standardNumbers(question)[0] ?? null;
  }

  function buildMathLookup(mathQuestions) {
    const lookup = new Map();
    for (const question of mathQuestions || []) {
      const answers = new Map();
      for (const answer of question.answers || []) {
        answers.set(norm(answer.symbol), norm(answer.value));
      }
      lookup.set(Number(question.number), answers);
    }
    return lookup;
  }

  function answersForQuestion(question, mode, standardAnswers, mathLookup, entryLookup) {
    if (mode === "universal") return (question.photoCodes || []).map(code => norm(entryLookup.get(code) || ""));
    if (mode === "standard") {
      return standardNumbers(question).map(number =>
        norm((standardAnswers || [])[number - 1]?.value)
      );
    }
    const number = questionNumber(question);
    const symbols = answerSymbols(question);
    const answers = mathLookup.get(number) || new Map();
    return symbols.map(symbol => answers.get(norm(symbol)) || "");
  }

  function makeAnswerLookup(rows) {
    const counts = new Map();
    for (const row of rows) {
      const id = norm(row.question.id);
      counts.set(id, (counts.get(id) || 0) + 1);
    }
    const lookup = new Map();
    for (const row of rows) {
      const id = norm(row.question.id);
      if ((counts.get(id) || 0) === 1) lookup.set(id, row.got);
      lookup.set(norm(`${row.question.problemNumber || row.question.group || ""}||${row.question.id}`), row.got);
    }
    for (const row of rows) (row.question.photoCodes || []).forEach((code,index) => {
      lookup.set(norm(code),[row.got[index] || ""]);
    });
    return (id,group) => lookup.get(norm(group + "||" + id)) || lookup.get(norm(id)) || [];
  }

  function match(got, question, getById) {
    const max = points(question);
    if (question.alwaysAward) return max;

    if (Array.isArray(question.conditionalCorrect) && question.conditionalCorrect.length) {
      for (const condition of question.conditionalCorrect) {
        const dependencyMatches = Array.isArray(condition.allOf)
          ? condition.allOf.every(dependency =>
              equalAnswers(
                getById(dependency.ifId, question.problemNumber || question.group),
                dependency.ifEquals || [],
                Boolean(dependency.ifUnordered)
              )
            )
          : equalAnswers(
              getById(condition.ifId, question.problemNumber || question.group),
              condition.ifEquals || [],
              Boolean(condition.ifUnordered)
            );
        if (
          dependencyMatches &&
          equalAnswers(got, condition.answers || [], Boolean(condition.unordered))
        ) return max;
      }
      return 0;
    }

    if (
      Array.isArray(question.correctOptions) &&
      question.correctOptions.some(option =>
        equalAnswers(got, option, Boolean(question.unordered))
      )
    ) return max;

    if (equalAnswers(got, expected(question), Boolean(question.unordered))) return max;

    if (question.partialAnyCorrect) {
      const correct = expected(question);
      let matches = 0;
      if (question.unordered) {
        const remaining = correct.slice();
        for (const value of got.map(norm)) {
          const index = remaining.indexOf(value);
          if (index >= 0) {
            matches++;
            remaining.splice(index, 1);
          }
        }
      } else {
        for (let index = 0; index < Math.min(got.length, correct.length); index++) {
          if (norm(got[index]) === norm(correct[index])) matches++;
        }
      }
      if (matches) {
        return Math.min(max, Number(question.partialAnyCorrect || 0) * matches);
      }
    }

    if (Array.isArray(question.partialConditions)) {
      for (const partial of question.partialConditions) {
        const answer = Array.isArray(partial.answers) ? partial.answers : [partial.answer];
        if (
          got.length === answer.length &&
          answer.every((value, index) =>
            value === "*" || value === null || norm(got[index]) === norm(value)
          )
        ) return Math.min(max, Math.max(0, Number(partial.points || 0)));
      }
    }

    if (Array.isArray(question.partialAnswers)) {
      for (const partial of question.partialAnswers) {
        const answer = Array.isArray(partial.answers) ? partial.answers : [partial.answer];
        if (equalAnswers(got, answer, Boolean(partial.unordered))) {
          return Math.min(max, Math.max(0, Number(partial.points || 0)));
        }
      }
    }
    return 0;
  }

  function expectedText(question) {
    if (question.alwaysAward) return "全員得点";
    if (Array.isArray(question.correctOptions)) {
      return question.correctOptions.map(option => option.join("")).join(" または ");
    }
    if (Array.isArray(question.conditionalCorrect)) {
      return question.conditionalCorrect
        .map(condition => (condition.answers || []).join(""))
        .filter(Boolean)
        .join(" または ");
    }
    return expected(question).join("");
  }

  function selectedRuleGroups(rule, selectedQuestions, rows) {
    const choose = Number(rule.choose || 1);
    const explicit = (rule.groups || []).filter(group =>
      selectedQuestions.has(questionNumber({group}))
    );
    if (explicit.length === choose) return explicit;

    return (rule.groups || [])
      .map(group => {
        const groupRows = rows.filter(row => row.question.group === group);
        return {
          group,
          hasAnswer: groupRows.some(row => row.answered),
          earned: groupRows.reduce((sum, row) => sum + row.earned, 0)
        };
      })
      .sort((a, b) => Number(b.hasAnswer) - Number(a.hasAnswer) || b.earned - a.earned)
      .slice(0, choose)
      .map(item => item.group);
  }

  function grade({key, mode, standardAnswers, mathQuestions, selectedQuestions, answerEntries, selectedGroups}) {
    if (!key || !Array.isArray(key.questions)) {
      throw new Error("先に解答写真を読み取ってください。");
    }
    const mathLookup = buildMathLookup(mathQuestions);
    const entryLookup = new Map((answerEntries || []).map(entry => [entry.code, entry.value]));
    const rows = key.questions.map((question, index) => {
      const got = answersForQuestion(question, mode, standardAnswers, mathLookup, entryLookup);
      return {
        index,
        question,
        got,
        answered: Boolean(question.alwaysAward) || got.some(value => norm(value) !== ""),
        complete: Boolean(question.alwaysAward) || (got.length > 0 && got.every(value => norm(value) !== "")),
        points: key.pointsAvailable === false ? 1 : points(question),
        earned: 0,
        included: true
      };
    });
    const getById = makeAnswerLookup(rows);
    rows.forEach(row => {
      const earned = match(row.got, row.question, getById);
      // 配点不明時も「一部正解」を「すべて正解」にしない。
      row.earned = key.pointsAvailable === false
        ? (earned >= points(row.question) ? 1 : earned > 0 ? .5 : 0) : earned;
      row.expected = expectedText(row.question);
    });

    const optionalGroups = new Set();
    const chosenGroups = new Set();
    const selected = new Set([...selectedQuestions || []].map(Number));
    for (const rule of key.selectionRules || []) {
      for (const group of rule.groups || []) optionalGroups.add(group);
      const explicit = (rule.groups || []).filter(group => selectedGroups?.has(group));
      if (mode === "universal" && explicit.length !== Number(rule.choose || 1)) {
        throw new Error("採点する大問を指定された数だけ選んでください。");
      }
      const groups = mode === "universal" ? explicit : selectedRuleGroups(rule, selected, rows);
      for (const group of groups) chosenGroups.add(group);
    }
    if (optionalGroups.size) {
      rows.forEach(row => {
        if (optionalGroups.has(row.question.group)) {
          row.included = chosenGroups.has(row.question.group);
        }
      });
    }

    const included = rows.filter(row => row.included);
    const rawScore = included.reduce((sum, row) => sum + row.earned, 0);
    const possible = included.reduce((sum, row) => sum + row.points, 0);
    const pointsAvailable = key.pointsAvailable !== false;
    const maxScore = Number(pointsAvailable ? (key.maxScore ?? possible) : possible);
    const score = key.scaleScore === false ? rawScore : possible ? rawScore * maxScore / possible : rawScore;
    const groups = [];
    const groupNames = [...new Set(included.map(row => row.question.group || "全体"))];
    for (const group of groupNames) {
      const groupRows = included.filter(row => (row.question.group || "全体") === group);
      groups.push({
        group: groupLabel(group),
        earned: groupRows.reduce((sum, row) => sum + row.earned, 0),
        possible: groupRows.reduce((sum, row) => sum + row.points, 0),
        correct: groupRows.filter(row => row.earned === row.points).length,
        items: groupRows.length,
        missing: groupRows.filter(row => !row.complete).length
      });
    }

    return {
      key,
      rows,
      groups,
      score,
      maxScore,
      rawScore,
      possible,
      pointsAvailable,
      correct: included.filter(row => row.earned === row.points).length,
      partial: included.filter(row => row.earned > 0 && row.earned < row.points).length,
      wrong: included.filter(row => row.answered && row.earned === 0).length,
      missing: included.filter(row => !row.complete).length,
      chosenGroups: [...chosenGroups].map(groupLabel)
    };
  }

  window.MarkReaderGrader = Object.freeze({
    grade,
    norm,
    points,
    expected,
    expectedText,
    questionNumber,
    answerSymbols,
    standardNumbers,
    standardNumber,
    equalAnswers,
    groupLabel
  });
})();
