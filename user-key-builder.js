(() => {
  'use strict';

  const DATA_STORE_KEY = 'ct-marker-user-answer-keys-v1';
  const ANSWER_STORE_KEY = 'ct-marker-user-answers-v1';
  const VERSION = 'user-key-builder-standalone-v1';

  const $ = (id) => document.getElementById(id);
  const els = {
    year: $('yearInput'),
    exam: $('examInput'),
    subject: $('subjectInput'),
    maxScore: $('maxScoreInput'),
    tbody: $('questionTbody'),
    storedSelect: $('storedDatasetSelect'),
    importText: $('importText'),
    exportText: $('exportText'),
    inputMode: $('inputModeSelect'),
    filter: $('filterSelect'),
    inputPad: $('inputPad'),
    cards: $('scoringCards'),
    result: $('resultArea'),
    currentLabel: $('currentAnswerLabel'),
    toast: $('toast'),
  };

  const state = {
    editingId: null,
    rows: [],
    currentDataset: null,
    cards: [],
    activeIndex: -1,
    lastScores: new Map(),
  };

  function uid(prefix = 'ukey') {
    const rnd = Math.random().toString(36).slice(2, 8);
    return `${prefix}_${Date.now().toString(36)}_${rnd}`;
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function safeText(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (ch) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
    }[ch]));
  }

  function toast(message) {
    els.toast.textContent = message;
    els.toast.classList.add('show');
    window.clearTimeout(toast._timer);
    toast._timer = window.setTimeout(() => els.toast.classList.remove('show'), 2400);
  }

  function readStore() {
    const raw = localStorage.getItem(DATA_STORE_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(normalizeDataset).filter(Boolean);
      if (parsed && Array.isArray(parsed.keys)) return parsed.keys.map(normalizeDataset).filter(Boolean);
      if (parsed && Array.isArray(parsed.datasets)) return parsed.datasets.map(normalizeDataset).filter(Boolean);
      if (parsed && Array.isArray(parsed.items)) return parsed.items.map(normalizeDataset).filter(Boolean);
      if (parsed && parsed.questions) return [normalizeDataset(parsed)].filter(Boolean);
    } catch (error) {
      console.warn('Failed to parse user answer key store:', error);
    }
    return [];
  }

  function writeStore(items) {
    localStorage.setItem(DATA_STORE_KEY, JSON.stringify(items.map(normalizeDataset).filter(Boolean)));
  }

  function readAnswerStore() {
    const raw = localStorage.getItem(ANSWER_STORE_KEY);
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch (error) {
      console.warn('Failed to parse user answer store:', error);
      return {};
    }
  }

  function writeAnswerStore(obj) {
    localStorage.setItem(ANSWER_STORE_KEY, JSON.stringify(obj || {}));
  }

  function normalizeDataset(item) {
    if (!item || typeof item !== 'object') return null;
    const questions = Array.isArray(item.questions) ? item.questions.map(normalizeQuestion).filter(Boolean) : [];
    const maxScore = Number(item.maxScore ?? item.fullScore ?? item.totalScore ?? sumPoints(questions) ?? 0);
    return {
      id: String(item.id || item.keyId || uid()),
      year: String(item.year ?? ''),
      exam: String(item.exam ?? item.name ?? item.title ?? 'ユーザー登録データ'),
      subject: String(item.subject ?? ''),
      maxScore: Number.isFinite(maxScore) ? maxScore : sumPoints(questions),
      questions,
      createdAt: item.createdAt || nowIso(),
      updatedAt: item.updatedAt || nowIso(),
      source: item.source || VERSION,
    };
  }

  function normalizeQuestion(q, fallbackId) {
    if (!q || typeof q !== 'object') return null;
    const id = String(q.id ?? q.qid ?? q.number ?? fallbackId ?? '').trim();
    if (!id) return null;
    const points = Number(q.points ?? q.point ?? q.score ?? 0);
    const group = String(q.group ?? q.problemNumber ?? q.problem ?? q.section ?? '').trim();
    const note = String(q.note ?? q.memo ?? q.comment ?? '').trim();
    const nq = {
      id,
      points: Number.isFinite(points) ? points : 0,
      group,
      problemNumber: String(q.problemNumber ?? group ?? '').trim(),
      note,
    };
    if (Array.isArray(q.correctOptions)) {
      nq.correctOptions = q.correctOptions.map((slot) => Array.isArray(slot) ? slot.map(String) : [String(slot)]);
    } else if (Array.isArray(q.answers)) {
      nq.answers = q.answers.map(String);
    } else if (q.answer !== undefined) {
      nq.answer = String(q.answer);
    } else if (q.correct !== undefined) {
      nq.answer = String(q.correct);
    } else {
      nq.answer = '';
    }
    if (q.unordered) nq.unordered = true;
    if (q.partialAnyCorrect !== undefined && q.partialAnyCorrect !== '') {
      const partial = Number(q.partialAnyCorrect);
      if (Number.isFinite(partial)) nq.partialAnyCorrect = partial;
    }
    return nq;
  }

  function sumPoints(questions) {
    return questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);
  }

  function datasetTitle(d) {
    const pieces = [d.year, d.exam, d.subject].filter(Boolean);
    return pieces.length ? pieces.join(' / ') : d.id;
  }

  function makeEmptyRow(index) {
    return {
      localId: uid('row'),
      id: String(index || state.rows.length + 1),
      answer: '',
      points: '',
      group: '',
      mode: 'exact',
      partial: '',
      note: '',
    };
  }

  function questionToRow(q, index) {
    const row = makeEmptyRow(index);
    row.id = q.id || String(index);
    row.points = q.points === undefined ? '' : String(q.points);
    row.group = q.problemNumber || q.group || '';
    row.note = q.note || '';
    if (Array.isArray(q.correctOptions)) {
      row.mode = 'multiAccepted';
      row.answer = q.correctOptions.map((slot) => slot.join('|')).join(',');
    } else if (q.unordered) {
      row.mode = 'unordered';
      row.answer = (q.answers || [q.answer || '']).join(',');
    } else if (q.partialAnyCorrect !== undefined) {
      row.mode = 'partial';
      row.partial = String(q.partialAnyCorrect);
      row.answer = (q.answers || [q.answer || '']).join(',');
    } else if (Array.isArray(q.answers)) {
      row.mode = 'exact';
      row.answer = q.answers.join(',');
    } else {
      row.mode = 'exact';
      row.answer = q.answer || '';
    }
    return row;
  }

  function rowToQuestion(row) {
    const q = {
      id: String(row.id || '').trim(),
      points: Number(row.points || 0),
      group: String(row.group || '').trim(),
      problemNumber: String(row.group || '').trim(),
    };
    const note = String(row.note || '').trim();
    if (note) q.note = note;

    if (row.mode === 'multiAccepted') {
      q.correctOptions = parseCorrectOptions(row.answer);
    } else {
      const tokens = parseAnswerTokens(row.answer, row.mode !== 'exact');
      if (tokens.length > 1) q.answers = tokens;
      else q.answer = tokens[0] ?? '';
      if (row.mode === 'unordered') q.unordered = true;
      if (row.mode === 'partial') {
        const partial = Number(row.partial || 0);
        q.partialAnyCorrect = Number.isFinite(partial) ? partial : 0;
      }
    }
    return q;
  }

  function parseAnswerTokens(text, splitCharsWhenNoDelimiter = false) {
    const raw = String(text ?? '').trim();
    if (!raw) return [];
    if (/[,\s、，]+/.test(raw)) {
      return raw.split(/[,\s、，]+/).map((v) => v.trim()).filter(Boolean);
    }
    if (splitCharsWhenNoDelimiter && raw.length > 1) return Array.from(raw);
    return [raw];
  }

  function parseCorrectOptions(text) {
    const raw = String(text ?? '').trim();
    if (!raw) return [[]];
    return raw.split(/[,、，]+/).map((slot) => slot.split(/[|／/]+/).map((v) => v.trim()).filter(Boolean));
  }

  function renderRows() {
    els.tbody.innerHTML = '';
    state.rows.forEach((row, index) => {
      const tr = document.createElement('tr');
      tr.dataset.localId = row.localId;
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td><input class="id-col" data-field="id" value="${safeText(row.id)}" placeholder="例: 1"></td>
        <td><input class="answer-col" data-field="answer" value="${safeText(row.answer)}" placeholder="例: 2 / 1,2 / 1|3,2|4"></td>
        <td><input class="narrow" data-field="points" type="number" step="0.5" min="0" value="${safeText(row.points)}"></td>
        <td><input class="group-col" data-field="group" value="${safeText(row.group)}" placeholder="例: 第1問"></td>
        <td>
          <select data-field="mode">
            <option value="exact" ${row.mode === 'exact' ? 'selected' : ''}>通常</option>
            <option value="unordered" ${row.mode === 'unordered' ? 'selected' : ''}>順不同</option>
            <option value="multiAccepted" ${row.mode === 'multiAccepted' ? 'selected' : ''}>複数許容</option>
            <option value="partial" ${row.mode === 'partial' ? 'selected' : ''}>部分点</option>
          </select>
        </td>
        <td><input class="narrow" data-field="partial" type="number" step="0.5" min="0" value="${safeText(row.partial)}" placeholder="例: 2"></td>
        <td><input class="note-col" data-field="note" value="${safeText(row.note)}"></td>
        <td><button type="button" class="small danger" data-action="delete-row">削除</button></td>
      `;
      els.tbody.appendChild(tr);
    });
  }

  function syncRowsFromDom() {
    const rows = [];
    els.tbody.querySelectorAll('tr').forEach((tr) => {
      const old = state.rows.find((r) => r.localId === tr.dataset.localId) || makeEmptyRow();
      const next = { ...old };
      tr.querySelectorAll('[data-field]').forEach((input) => {
        next[input.dataset.field] = input.value;
      });
      rows.push(next);
    });
    state.rows = rows;
  }

  function editorToDataset() {
    syncRowsFromDom();
    const questions = state.rows
      .map(rowToQuestion)
      .filter((q) => q.id || q.answer || q.answers || q.correctOptions)
      .filter((q) => q.id);
    const maxRaw = Number(els.maxScore.value);
    const sum = sumPoints(questions);
    return normalizeDataset({
      id: state.editingId || uid(),
      year: els.year.value.trim(),
      exam: els.exam.value.trim() || 'ユーザー登録データ',
      subject: els.subject.value.trim(),
      maxScore: Number.isFinite(maxRaw) && maxRaw > 0 ? maxRaw : sum,
      questions,
      createdAt: state.currentDataset?.createdAt || nowIso(),
      updatedAt: nowIso(),
      source: VERSION,
    });
  }

  function loadDatasetToEditor(dataset) {
    const d = normalizeDataset(dataset);
    if (!d) return;
    state.editingId = d.id;
    state.currentDataset = d;
    els.year.value = d.year || '';
    els.exam.value = d.exam || '';
    els.subject.value = d.subject || '';
    els.maxScore.value = d.maxScore || sumPoints(d.questions) || '';
    state.rows = d.questions.map(questionToRow);
    if (!state.rows.length) state.rows.push(makeEmptyRow(1));
    renderRows();
    refreshExport();
  }

  function newDataset() {
    state.editingId = null;
    state.currentDataset = null;
    els.year.value = new Date().getFullYear();
    els.exam.value = 'ユーザー登録: ';
    els.subject.value = '';
    els.maxScore.value = 100;
    state.rows = Array.from({ length: 10 }, (_, i) => makeEmptyRow(i + 1));
    renderRows();
    refreshExport();
    toast('新規データを作成しました。');
  }

  function refreshStoredSelect() {
    const items = readStore();
    els.storedSelect.innerHTML = '';
    if (!items.length) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = '保存データなし';
      els.storedSelect.appendChild(opt);
      return;
    }
    items.forEach((item) => {
      const opt = document.createElement('option');
      opt.value = item.id;
      opt.textContent = datasetTitle(item);
      els.storedSelect.appendChild(opt);
    });
  }

  function saveDatasetFromEditor(showMessage = true) {
    const dataset = editorToDataset();
    const validation = validateDataset(dataset);
    if (validation.errors.length) {
      renderMessages(validation);
      toast('エラーがあります。保存前に確認してください。');
      return null;
    }
    const items = readStore();
    const idx = items.findIndex((d) => d.id === dataset.id);
    if (idx >= 0) items[idx] = dataset;
    else items.push(dataset);
    writeStore(items);
    state.editingId = dataset.id;
    state.currentDataset = dataset;
    refreshStoredSelect();
    els.storedSelect.value = dataset.id;
    refreshExport();
    if (showMessage) toast('保存しました。');
    return dataset;
  }

  function validateDataset(dataset) {
    const errors = [];
    const warnings = [];
    if (!dataset.exam.trim()) errors.push('試験名 / 登録名が空です。');
    if (!dataset.subject.trim()) warnings.push('科目名が空です。必要なら入力してください。');
    if (!dataset.questions.length) errors.push('設問がありません。');
    const seen = new Set();
    dataset.questions.forEach((q, index) => {
      const key = `${q.problemNumber || q.group || ''}::${q.id}`;
      if (!q.id) errors.push(`${index + 1}行目: 解答IDが空です。`);
      if (seen.has(key)) warnings.push(`${index + 1}行目: 同じ大問内でID「${q.id}」が重複しています。`);
      seen.add(key);
      if (!Number.isFinite(Number(q.points)) || Number(q.points) < 0) errors.push(`${index + 1}行目: 配点が不正です。`);
      if (q.correctOptions) {
        if (!q.correctOptions.length || q.correctOptions.some((slot) => !slot.length)) errors.push(`${index + 1}行目: 複数許容の正解欄が不正です。`);
      } else if (!q.answer && (!q.answers || !q.answers.length)) {
        warnings.push(`${index + 1}行目: 正解が空です。`);
      }
    });
    const total = sumPoints(dataset.questions);
    if (dataset.maxScore && Math.abs(total - dataset.maxScore) > 0.001) {
      warnings.push(`配点合計 ${total} 点と満点 ${dataset.maxScore} 点が一致しません。`);
    }
    return { errors, warnings, total };
  }

  function renderMessages(validation) {
    const parts = [];
    if (validation.errors.length) {
      parts.push(`<div class="message error"><strong>エラー</strong><br>${validation.errors.map(safeText).join('<br>')}</div>`);
    }
    if (validation.warnings.length) {
      parts.push(`<div class="message warn"><strong>警告</strong><br>${validation.warnings.map(safeText).join('<br>')}</div>`);
    }
    if (!validation.errors.length && !validation.warnings.length) {
      parts.push(`<div class="message ok">検査OKです。配点合計: ${safeText(validation.total)} 点</div>`);
    }
    els.result.innerHTML = `<div class="message-list">${parts.join('')}</div>`;
  }

  function refreshExport() {
    const dataset = editorToDataset();
    els.exportText.value = JSON.stringify(dataset, null, 2);
  }

  function parseImportText(text) {
    const raw = String(text || '').trim();
    if (!raw) throw new Error('貼り付け欄が空です。');
    if (/^[\[{]/.test(raw)) {
      const parsed = JSON.parse(raw);
      const datasets = Array.isArray(parsed) ? parsed : Array.isArray(parsed.keys) ? parsed.keys : Array.isArray(parsed.datasets) ? parsed.datasets : [parsed];
      if (datasets.length === 1 && !datasets[0].questions && Array.isArray(datasets[0])) {
        throw new Error('JSON形式を判定できません。');
      }
      return datasets.map(normalizeDataset).filter(Boolean);
    }
    return [parseDelimitedDataset(raw)];
  }

  function splitDelimitedLine(line) {
    const cells = [];
    let current = '';
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (quoted && line[i + 1] === '"') { current += '"'; i++; }
        else quoted = !quoted;
      } else if (!quoted && (ch === ',' || ch === '\t')) {
        cells.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    cells.push(current.trim());
    if (cells.length === 1) return line.trim().split(/\s+/);
    return cells;
  }

  function parseDelimitedDataset(raw) {
    const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('#'));
    const questions = [];
    const headerLike = /^(id|番号|解答id|正解|answer|points|配点)/i;
    lines.forEach((line, i) => {
      if (i === 0 && headerLike.test(line.replace(/[,\t].*$/, ''))) return;
      const cells = splitDelimitedLine(line);
      if (!cells.length) return;
      const [id, answer, points, group, mode, partial, ...noteParts] = cells;
      if (!id) return;
      const row = {
        id,
        answer: answer || '',
        points: points || 0,
        group: group || '',
        mode: normalizeMode(mode || 'exact'),
        partial: partial || '',
        note: noteParts.join(' '),
      };
      questions.push(rowToQuestion(row));
    });
    const sum = sumPoints(questions);
    return normalizeDataset({
      year: String(new Date().getFullYear()),
      exam: 'ユーザー登録: インポート',
      subject: '',
      maxScore: sum || 100,
      questions,
    });
  }

  function normalizeMode(mode) {
    const raw = String(mode || '').toLowerCase();
    if (/順|unordered/.test(raw)) return 'unordered';
    if (/複数|multi|option|許容/.test(raw)) return 'multiAccepted';
    if (/部分|partial/.test(raw)) return 'partial';
    return 'exact';
  }

  function buildScoringFromEditor() {
    const dataset = editorToDataset();
    const validation = validateDataset(dataset);
    if (validation.errors.length) {
      renderMessages(validation);
      toast('採点画面を作る前にエラーを直してください。');
      return;
    }
    state.currentDataset = dataset;
    state.cards = dataset.questions.map((q, index) => ({
      q,
      index,
      value: '',
      status: '',
      score: null,
    }));
    state.activeIndex = state.cards.length ? 0 : -1;
    state.lastScores = new Map();
    renderInputPad();
    renderCards();
    renderResultPlaceholder(dataset);
    toast('採点画面を作成しました。');
  }

  function modeButtons(mode, subject) {
    if (mode === 'auto') {
      if (/情報/.test(subject || '')) mode = 'info';
      else if (/数学|算数/.test(subject || '')) mode = 'math';
      else mode = 'digit';
    }
    const digits = ['0','1','2','3','4','5','6','7','8','9'];
    if (mode === 'math') return ['－', ...digits];
    if (mode === 'info') return [...digits, 'a','b','c','d','e','f'];
    if (mode === 'kana') return ['ア','イ','ウ','エ','オ','カ','キ','ク','ケ','コ','サ','シ','ス','セ','ソ','タ','チ','ツ','テ','ト','ナ','ニ','ヌ','ネ','ノ','ハ','ヒ','フ','ヘ','ホ','マ','ミ','ム','メ','モ','ヤ','ユ','ヨ','ラ','リ','ル','レ','ロ','ワ','ヲ','ン'];
    return digits;
  }

  function renderInputPad() {
    const subject = els.subject.value || state.currentDataset?.subject || '';
    const buttons = modeButtons(els.inputMode.value, subject);
    els.inputPad.innerHTML = '';
    buttons.forEach((label) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = label;
      btn.dataset.input = label;
      els.inputPad.appendChild(btn);
    });
  }

  function expectedSlots(q) {
    if (Array.isArray(q.correctOptions)) return q.correctOptions.length;
    if (Array.isArray(q.answers)) return q.answers.length;
    return 1;
  }

  function displayExpected(q) {
    if (Array.isArray(q.correctOptions)) return q.correctOptions.map((slot) => slot.join('|')).join(',');
    if (Array.isArray(q.answers)) return q.answers.join(',');
    return q.answer || '';
  }

  function userTokensForCard(card) {
    const slots = expectedSlots(card.q);
    const raw = String(card.value || '').trim();
    if (!raw) return [];
    if (/[,\s、，]+/.test(raw)) return parseAnswerTokens(raw);
    if (slots > 1) return Array.from(raw);
    return [raw];
  }

  function scoreCard(card) {
    const q = card.q;
    const points = Number(q.points) || 0;
    const user = userTokensForCard(card);
    const missing = user.length === 0 || user.every((v) => !v);
    if (missing) return { score: 0, correct: false, missing: true, user, expected: displayExpected(q) };

    if (Array.isArray(q.correctOptions)) {
      const ok = q.correctOptions.length === user.length && q.correctOptions.every((slot, i) => slot.map(String).includes(String(user[i])));
      return { score: ok ? points : 0, correct: ok, missing: false, user, expected: displayExpected(q) };
    }

    const expected = Array.isArray(q.answers) ? q.answers.map(String) : [String(q.answer ?? '')];
    if (q.unordered) {
      const sort = (arr) => arr.map(String).sort().join('\u0000');
      const ok = expected.length === user.length && sort(expected) === sort(user);
      return { score: ok ? points : 0, correct: ok, missing: false, user, expected: displayExpected(q) };
    }

    if (q.partialAnyCorrect !== undefined) {
      const per = Number(q.partialAnyCorrect) || 0;
      let count = 0;
      const n = Math.max(expected.length, user.length);
      for (let i = 0; i < n; i++) {
        if (String(expected[i] ?? '') === String(user[i] ?? '')) count++;
      }
      const score = Math.min(points, count * per);
      return { score, correct: score >= points && points > 0, missing: false, user, expected: displayExpected(q) };
    }

    const ok = expected.length === user.length && expected.every((v, i) => String(v) === String(user[i]));
    return { score: ok ? points : 0, correct: ok, missing: false, user, expected: displayExpected(q) };
  }

  function renderCards() {
    els.cards.innerHTML = '';
    state.cards.forEach((card, index) => {
      const q = card.q;
      const div = document.createElement('div');
      div.className = `answer-card ${state.activeIndex === index ? 'active' : ''} ${card.status || ''}`;
      div.dataset.index = String(index);
      div.innerHTML = `
        <div class="card-title">
          <strong>${safeText(q.id)}</strong>
          <span>${safeText(q.problemNumber || q.group || '')}</span>
        </div>
        <div class="answer-display">${safeText(card.value || '—')}</div>
        <div class="card-meta">配点 ${safeText(q.points)}点 / 正解枠 ${expectedSlots(q)}</div>
      `;
      els.cards.appendChild(div);
    });
    updateCurrentLabel();
    applyCardFilter();
  }

  function updateCurrentLabel() {
    if (state.activeIndex < 0 || !state.cards[state.activeIndex]) {
      els.currentLabel.textContent = '未選択';
      return;
    }
    const q = state.cards[state.activeIndex].q;
    els.currentLabel.textContent = `${q.problemNumber || q.group ? `${q.problemNumber || q.group} - ` : ''}${q.id}`;
  }

  function activateCard(index) {
    if (index < 0 || index >= state.cards.length) return;
    state.activeIndex = index;
    renderCards();
  }

  function appendInputChar(ch) {
    if (state.activeIndex < 0) return;
    state.cards[state.activeIndex].value += ch;
    renderCards();
  }

  function backspaceCurrent() {
    if (state.activeIndex < 0) return;
    const card = state.cards[state.activeIndex];
    card.value = Array.from(card.value || '').slice(0, -1).join('');
    renderCards();
  }

  function clearCurrent() {
    if (state.activeIndex < 0) return;
    state.cards[state.activeIndex].value = '';
    renderCards();
  }

  function clearAllAnswers() {
    state.cards.forEach((card) => { card.value = ''; card.status = ''; card.score = null; });
    state.lastScores = new Map();
    renderCards();
    renderResultPlaceholder(state.currentDataset);
    toast('全解答をクリアしました。');
  }

  function nextMissing() {
    const start = state.activeIndex + 1;
    const found = state.cards.findIndex((card, index) => index >= start && !String(card.value || '').trim());
    if (found >= 0) activateCard(found);
    else {
      const first = state.cards.findIndex((card) => !String(card.value || '').trim());
      if (first >= 0) activateCard(first);
      else toast('未入力はありません。');
    }
  }

  function scoreAll() {
    if (!state.cards.length) {
      buildScoringFromEditor();
      if (!state.cards.length) return;
    }
    let total = 0;
    const rows = [];
    const groupMap = new Map();
    state.cards.forEach((card) => {
      const result = scoreCard(card);
      card.score = result.score;
      card.status = result.missing ? 'missing' : result.correct ? 'correct' : 'wrong';
      total += result.score;
      const group = card.q.problemNumber || card.q.group || '未分類';
      if (!groupMap.has(group)) groupMap.set(group, { score: 0, max: 0, count: 0, correct: 0 });
      const g = groupMap.get(group);
      g.score += result.score;
      g.max += Number(card.q.points) || 0;
      g.count += 1;
      if (result.correct) g.correct += 1;
      rows.push({ card, result });
    });
    renderCards();
    renderResults(total, rows, groupMap);
    toast('採点しました。');
  }

  function renderResultPlaceholder(dataset) {
    if (!dataset) {
      els.result.innerHTML = '<div class="message warn">採点画面を作ると、ここに結果が表示されます。</div>';
      return;
    }
    els.result.innerHTML = `<div class="message ok">${safeText(datasetTitle(dataset))} の採点テスト画面です。設問数: ${dataset.questions.length}</div>`;
  }

  function renderResults(total, rows, groupMap) {
    const dataset = state.currentDataset || editorToDataset();
    const max = Number(dataset.maxScore) || sumPoints(dataset.questions);
    const answered = rows.filter(({ result }) => !result.missing).length;
    const correct = rows.filter(({ result }) => result.correct).length;
    const missing = rows.filter(({ result }) => result.missing).length;
    const wrong = rows.length - correct - missing;

    const groupRows = Array.from(groupMap.entries()).map(([group, g]) => `
      <tr><td>${safeText(group)}</td><td>${safeText(g.score)} / ${safeText(g.max)}</td><td>${safeText(g.correct)} / ${safeText(g.count)}</td></tr>
    `).join('');

    const detailRows = rows.map(({ card, result }) => `
      <tr>
        <td>${safeText(card.q.problemNumber || card.q.group || '')}</td>
        <td>${safeText(card.q.id)}</td>
        <td>${safeText(result.user.join(','))}</td>
        <td>${safeText(result.expected)}</td>
        <td>${safeText(result.score)} / ${safeText(card.q.points)}</td>
        <td>${result.missing ? '未入力' : result.correct ? '正解' : '誤答'}</td>
      </tr>
    `).join('');

    const wrongRows = rows.filter(({ result }) => result.missing || !result.correct).map(({ card, result }) => `
      <tr>
        <td>${safeText(card.q.problemNumber || card.q.group || '')}</td>
        <td>${safeText(card.q.id)}</td>
        <td>${safeText(result.user.join(',') || '未入力')}</td>
        <td>${safeText(result.expected)}</td>
        <td>${result.missing ? '未入力' : '誤答'}</td>
      </tr>
    `).join('') || '<tr><td colspan="5">誤答・未入力なし</td></tr>';

    els.result.innerHTML = `
      <div class="result-summary">
        <div class="metric"><span>得点</span><strong>${safeText(total)} / ${safeText(max)}</strong></div>
        <div class="metric"><span>正解</span><strong>${safeText(correct)}問</strong></div>
        <div class="metric"><span>誤答</span><strong>${safeText(wrong)}問</strong></div>
        <div class="metric"><span>未入力</span><strong>${safeText(missing)}問</strong></div>
      </div>
      <h3>大問別集計</h3>
      <table class="result-table"><thead><tr><th>大問</th><th>得点</th><th>正解数</th></tr></thead><tbody>${groupRows}</tbody></table>
      <h3>誤答・未入力一覧</h3>
      <table class="result-table"><thead><tr><th>大問</th><th>ID</th><th>入力</th><th>正解</th><th>状態</th></tr></thead><tbody>${wrongRows}</tbody></table>
      <h3>全問一覧</h3>
      <table class="result-table"><thead><tr><th>大問</th><th>ID</th><th>入力</th><th>正解</th><th>得点</th><th>状態</th></tr></thead><tbody>${detailRows}</tbody></table>
    `;
    applyCardFilter();
  }

  function applyCardFilter() {
    const filter = els.filter.value;
    els.cards.querySelectorAll('.answer-card').forEach((el) => {
      const card = state.cards[Number(el.dataset.index)];
      let hidden = false;
      if (filter === 'missing') hidden = Boolean(String(card?.value || '').trim());
      if (filter === 'wrongMissing') hidden = card?.status === 'correct';
      el.classList.toggle('hidden', hidden);
    });
  }

  function answerStoreKeyForCurrent() {
    const dataset = state.currentDataset || editorToDataset();
    return dataset.id || `${dataset.year}-${dataset.exam}-${dataset.subject}`;
  }

  function saveAnswers() {
    if (!state.cards.length) return toast('採点画面がありません。');
    const store = readAnswerStore();
    store[answerStoreKeyForCurrent()] = {
      savedAt: nowIso(),
      answers: Object.fromEntries(state.cards.map((card) => [card.q.id, card.value || ''])),
    };
    writeAnswerStore(store);
    toast('解答を保存しました。');
  }

  function loadAnswers() {
    if (!state.cards.length) buildScoringFromEditor();
    const store = readAnswerStore();
    const saved = store[answerStoreKeyForCurrent()];
    if (!saved) return toast('保存済み解答がありません。');
    state.cards.forEach((card) => {
      card.value = saved.answers?.[card.q.id] || '';
      card.status = '';
      card.score = null;
    });
    renderCards();
    toast('保存済み解答を読み込みました。');
  }

  function deleteAnswers() {
    const store = readAnswerStore();
    const key = answerStoreKeyForCurrent();
    if (!store[key]) return toast('削除対象の保存解答がありません。');
    delete store[key];
    writeAnswerStore(store);
    toast('保存解答を削除しました。');
  }

  function downloadText(filename, text, type = 'application/json') {
    const blob = new Blob([text], { type: `${type};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function makeFilename(dataset) {
    const base = [dataset.year, dataset.exam, dataset.subject].filter(Boolean).join('_') || 'user-answer-key';
    return `${base.replace(/[\\/:*?"<>|\s]+/g, '_')}.json`;
  }

  function loadSelectedStored() {
    const id = els.storedSelect.value;
    const item = readStore().find((d) => d.id === id);
    if (!item) return toast('保存データが見つかりません。');
    loadDatasetToEditor(item);
    toast('保存データを読み込みました。');
  }

  function duplicateSelectedStored() {
    const id = els.storedSelect.value;
    const items = readStore();
    const item = items.find((d) => d.id === id);
    if (!item) return toast('保存データが見つかりません。');
    const copy = normalizeDataset({ ...item, id: uid(), exam: `${item.exam} コピー`, createdAt: nowIso(), updatedAt: nowIso() });
    items.push(copy);
    writeStore(items);
    refreshStoredSelect();
    els.storedSelect.value = copy.id;
    loadDatasetToEditor(copy);
    toast('複製しました。');
  }

  function deleteSelectedStored() {
    const id = els.storedSelect.value;
    if (!id) return toast('保存データがありません。');
    const items = readStore().filter((d) => d.id !== id);
    writeStore(items);
    refreshStoredSelect();
    toast('削除しました。');
  }

  function importToEditor(saveAfter = false) {
    let datasets;
    try {
      datasets = parseImportText(els.importText.value);
    } catch (error) {
      toast(error.message || 'インポートに失敗しました。');
      return;
    }
    if (!datasets.length) return toast('読み込めるデータがありません。');
    if (saveAfter) {
      const items = readStore();
      datasets.forEach((d) => items.push(normalizeDataset({ ...d, id: d.id || uid(), updatedAt: nowIso() })));
      writeStore(items);
      refreshStoredSelect();
      loadDatasetToEditor(datasets[0]);
      toast(`${datasets.length}件を保存済みに追加しました。`);
    } else {
      loadDatasetToEditor(datasets[0]);
      toast('編集欄へ読み込みました。');
    }
  }

  function bindEvents() {
    $('newDatasetBtn').addEventListener('click', newDataset);
    $('saveDatasetBtn').addEventListener('click', () => saveDatasetFromEditor());
    $('exportJsonBtn').addEventListener('click', () => { refreshExport(); toast('JSON出力欄を更新しました。'); });
    $('addRowBtn').addEventListener('click', () => { syncRowsFromDom(); state.rows.push(makeEmptyRow(state.rows.length + 1)); renderRows(); });
    $('bulkAddRowsBtn').addEventListener('click', () => { syncRowsFromDom(); for (let i = 0; i < 10; i++) state.rows.push(makeEmptyRow(state.rows.length + 1)); renderRows(); });
    $('validateBtn').addEventListener('click', () => renderMessages(validateDataset(editorToDataset())));
    $('loadStoredBtn').addEventListener('click', loadSelectedStored);
    $('duplicateStoredBtn').addEventListener('click', duplicateSelectedStored);
    $('deleteStoredBtn').addEventListener('click', deleteSelectedStored);
    $('importToEditorBtn').addEventListener('click', () => importToEditor(false));
    $('importAndSaveBtn').addEventListener('click', () => importToEditor(true));
    $('copyExportBtn').addEventListener('click', async () => {
      refreshExport();
      try {
        await navigator.clipboard.writeText(els.exportText.value);
        toast('コピーしました。');
      } catch {
        els.exportText.select();
        document.execCommand('copy');
        toast('コピーしました。');
      }
    });
    $('downloadExportBtn').addEventListener('click', () => {
      const dataset = editorToDataset();
      refreshExport();
      downloadText(makeFilename(dataset), els.exportText.value);
    });

    els.tbody.addEventListener('input', () => { window.clearTimeout(bindEvents._timer); bindEvents._timer = window.setTimeout(refreshExport, 180); });
    els.tbody.addEventListener('change', refreshExport);
    els.tbody.addEventListener('click', (ev) => {
      const btn = ev.target.closest('[data-action="delete-row"]');
      if (!btn) return;
      const tr = btn.closest('tr');
      state.rows = state.rows.filter((row) => row.localId !== tr.dataset.localId);
      renderRows();
      refreshExport();
    });
    [els.year, els.exam, els.subject, els.maxScore].forEach((input) => input.addEventListener('input', () => { window.clearTimeout(bindEvents._metaTimer); bindEvents._metaTimer = window.setTimeout(refreshExport, 180); }));

    $('buildScoringBtn').addEventListener('click', buildScoringFromEditor);
    $('scoreBtn').addEventListener('click', scoreAll);
    $('saveAnswersBtn').addEventListener('click', saveAnswers);
    $('loadAnswersBtn').addEventListener('click', loadAnswers);
    $('deleteAnswersBtn').addEventListener('click', deleteAnswers);
    $('backspaceBtn').addEventListener('click', backspaceCurrent);
    $('clearCurrentBtn').addEventListener('click', clearCurrent);
    $('nextMissingBtn').addEventListener('click', nextMissing);
    $('clearAllAnswersBtn').addEventListener('click', clearAllAnswers);
    els.inputMode.addEventListener('change', renderInputPad);
    els.filter.addEventListener('change', applyCardFilter);
    els.inputPad.addEventListener('click', (ev) => {
      const btn = ev.target.closest('[data-input]');
      if (btn) appendInputChar(btn.dataset.input);
    });
    els.cards.addEventListener('click', (ev) => {
      const card = ev.target.closest('.answer-card');
      if (!card) return;
      activateCard(Number(card.dataset.index));
    });

    document.addEventListener('keydown', (ev) => {
      if (ev.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(ev.target.tagName)) return;
      if (/^[0-9a-f]$/i.test(ev.key)) appendInputChar(ev.key.toLowerCase());
      if (ev.key === 'Backspace') { ev.preventDefault(); backspaceCurrent(); }
      if (ev.key === 'Enter') { ev.preventDefault(); nextMissing(); }
    });
  }

  function init() {
    bindEvents();
    refreshStoredSelect();
    const first = readStore()[0];
    if (first) loadDatasetToEditor(first);
    else newDataset();
    renderInputPad();
    renderResultPlaceholder(null);
  }

  init();
})();
