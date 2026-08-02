(function(){
  'use strict';

  const DATA_FILES = [
    '../answer_keys_mock_kawai_2026_02_english_info.json',
    '../answer_keys_mock_kawai_2026_02_geo_history.json',
    '../answer_keys_mock_kawai_2026_02_civics_combined.json',
    '../answer_keys_mock_kawai_2026_02_japanese.json',
    '../answer_keys_mock_kawai_2026_02_math1.json',
    '../answer_keys_mock_kawai_2026_02_math2.json',
    '../answer_keys_mock_kawai_2026_02_science_basic.json',
    '../answer_keys_mock_kawai_2026_02_science_advanced.json'
  ];
  const STORAGE_KEY = 'ct-ui-lab-realdata-v1';
  const EXAM_LABELS = {
    main:'本試験',
    'mock-kawai-zento-2026-02':'第2回 河合全統共通テスト模試'
  };
  const $ = id => document.getElementById(id);
  const deepClone = value => JSON.parse(JSON.stringify(value));
  let keys = [];
  let statistics = {entries:[]};
  let currentKey = null;
  let answers = {};
  let currentIndex = 0;
  let currentGroupIndex = 0;
  let currentScreen = 'home';
  let lastResult = null;

  function norm(value){
    return String(value == null ? '' : value).normalize('NFKC').trim().replace(/[−ー―–—－]/g,'-').toLowerCase();
  }
  function esc(value){
    return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function qPoints(q){ return Number(q.points == null ? 1 : q.points) || 1; }
  function totalScore(k){ return (k.questions || []).reduce((sum,q)=>sum+qPoints(q),0); }
  function expected(q){ return Array.isArray(q.answers) ? q.answers.map(norm) : [norm(q.answer)]; }
  function expectedLength(q){
    if(Array.isArray(q.answers)) return q.answers.length;
    if(Array.isArray(q.conditionalCorrect)) return Math.max(1,...q.conditionalCorrect.map(c=>(c.answers||[]).length));
    if(Array.isArray(q.correctOptions)) return Math.max(1,...q.correctOptions.map(c=>c.length));
    return Math.max(1,norm(q.answer).length);
  }
  function normalizedGroup(value){
    const raw = String(value || '未分類');
    const match = raw.match(/^Q(\d+)([A-Z])?$/i);
    return match ? `第${match[1]}問${match[2] ? ' '+match[2].toUpperCase() : ''}` : raw;
  }
  function normalizeKey(k){
    const out = deepClone(k);
    out.questions = (out.questions || []).map(q=>{
      q.group = normalizedGroup(q.group || q.problemNumber);
      q.problemNumber = q.group;
      return q;
    });
    if(Array.isArray(out.selectionRules)){
      out.selectionRules.forEach(rule=>{ rule.groups = (rule.groups || []).map(normalizedGroup); });
    }
    return out;
  }
  function groupsFor(k){ return [...new Set((k.questions || []).map(q=>q.group || '未分類'))]; }
  function qKey(q){ return norm(q.group || q.problemNumber) + '||' + norm(q.id); }
  function keySignature(k){ return k ? [String(k.year),k.exam,k.subject].join('||') : ''; }
  function examText(k){ return `${k.year}年度 ${EXAM_LABELS[k.exam] || k.exam}`; }
  function answerFor(q){ return answers[qKey(q)] || []; }
  function displayId(q){
    const id = String(q.id || '');
    const group = normalizedGroup(q.group || q.problemNumber);
    if(!group || id.includes(group) || /^第\s*\d+\s*問/.test(id)) return id;
    return `${group}-${id}`;
  }
  function groupSortValue(group){
    const match = String(group).match(/第\s*(\d+)\s*問(?:\s*([A-Z]))?/i);
    return match ? [Number(match[1]),match[2] || ''] : [999,String(group)];
  }
  function groupCompare(a,b){
    const aa=groupSortValue(a),bb=groupSortValue(b);
    return aa[0]-bb[0] || String(aa[1]).localeCompare(String(bb[1]),'ja');
  }

  function readStore(){
    try{ return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"records":{}}'); }
    catch(_){ return {records:{}}; }
  }
  function writeStore(store){ localStorage.setItem(STORAGE_KEY,JSON.stringify(store)); }
  function saveCurrent(){
    if(!currentKey) return;
    const store=readStore();
    store.records=store.records||{};
    store.records[keySignature(currentKey)]={answers:deepClone(answers),currentIndex,savedAt:new Date().toISOString()};
    store.last=keySignature(currentKey);
    writeStore(store);
    renderResume();
  }
  function loadSaved(k){
    const record=(readStore().records||{})[keySignature(k)];
    answers=record&&record.answers?deepClone(record.answers):{};
    currentIndex=record&&Number.isInteger(record.currentIndex)?Math.min(record.currentIndex,k.questions.length-1):0;
  }

  async function loadData(){
    try{
      const [mainResponse,statsResponse,...mockResponses]=await Promise.all([
        fetch('../answer_keys_verified.json',{cache:'no-store'}),
        fetch('../statistics_final.json',{cache:'no-store'}),
        ...DATA_FILES.map(file=>fetch(file,{cache:'no-store'}))
      ]);
      if(!mainResponse.ok) throw new Error('2025年度本試験データを読み込めませんでした。');
      const mainObject=await mainResponse.json();
      const mainKeys=(mainObject.keys||[]).filter(k=>String(k.year)==='2025'&&k.exam==='main');
      const mockObjects=await Promise.all(mockResponses.map(async response=>{
        if(!response.ok) throw new Error('河合模試データを読み込めませんでした。');
        return response.json();
      }));
      const mockKeys=mockObjects.flatMap(obj=>obj.keys||[]).filter(k=>String(k.year)==='2026'&&k.exam==='mock-kawai-zento-2026-02');
      keys=[...mainKeys,...mockKeys].map(normalizeKey);
      if(statsResponse.ok) statistics=await statsResponse.json();
      setupSelectors();
      renderResume();
    }catch(error){
      $('loadError').hidden=false;
      $('loadError').textContent='正解データの読み込みに失敗しました。ページを再読み込みしてください。 '+error.message;
      console.error(error);
    }
  }

  function setupSelectors(){
    const years=[...new Set(keys.map(k=>String(k.year)))].sort().reverse();
    $('yearSelect').innerHTML=years.map(y=>`<option value="${esc(y)}">${esc(y)}年度</option>`).join('');
    $('yearSelect').disabled=false;
    $('examSelect').disabled=false;
    $('subjectSelect').disabled=false;
    $('startButton').disabled=false;
    refreshExamOptions();
  }
  function refreshExamOptions(){
    const year=$('yearSelect').value;
    const exams=[...new Set(keys.filter(k=>String(k.year)===year).map(k=>k.exam))];
    $('examSelect').innerHTML=exams.map(exam=>`<option value="${esc(exam)}">${esc(EXAM_LABELS[exam]||exam)}</option>`).join('');
    refreshSubjectOptions();
  }
  function subjectPriority(subject){
    const order=['国語','数学IA','数学Ⅰ，数学A','数学IIBC','数学Ⅱ，数学B，数学C','英語R','英語（リーディング）','英語L','英語（リスニング）','情報I','情報Ⅰ','物理','化学','生物','地学'];
    const i=order.indexOf(subject);
    return i<0?999:i;
  }
  function refreshSubjectOptions(){
    const year=$('yearSelect').value,exam=$('examSelect').value;
    const subjects=keys.filter(k=>String(k.year)===year&&k.exam===exam).map(k=>k.subject).sort((a,b)=>subjectPriority(a)-subjectPriority(b)||String(a).localeCompare(String(b),'ja'));
    const previous=$('subjectSelect').value;
    $('subjectSelect').innerHTML=subjects.map(subject=>`<option>${esc(subject)}</option>`).join('');
    if(subjects.includes(previous)) $('subjectSelect').value=previous;
    renderSubjectPreview();
  }
  function selectedKey(){
    return keys.find(k=>String(k.year)===$('yearSelect').value&&k.exam===$('examSelect').value&&k.subject===$('subjectSelect').value)||null;
  }
  function renderSubjectPreview(){
    const k=selectedKey();
    if(!k) return;
    $('previewSubject').textContent=k.subject;
    $('previewMeta').textContent=`${groupsFor(k).length}大問・${k.questions.length}項目${k.selectionRules?'・選択問題あり':''}`;
    $('questionCount').textContent=`${k.questions.length}項目`;
    $('maxScore').textContent=`${k.maxScore==null?totalScore(k):k.maxScore}点`;
    const links=[];
    if(k.sourceUrl) links.push(`<a href="${esc(k.sourceUrl)}" target="_blank" rel="noopener">正解</a>`);
    if(k.problemUrl) links.push(`<a href="${esc(k.problemUrl)}" target="_blank" rel="noopener">問題</a>`);
    if(k.explanationSourceUrl) links.push(`<a href="${esc(k.explanationSourceUrl)}" target="_blank" rel="noopener">解説</a>`);
    $('sourceLinks').innerHTML=links.join('');
  }
  function renderResume(){
    if(!keys.length) return;
    const store=readStore(),record=store.last&&(store.records||{})[store.last],k=keys.find(item=>keySignature(item)===store.last);
    if(!record||!k){ $('resumeCard').hidden=true; return; }
    const entered=Object.values(record.answers||{}).filter(v=>Array.isArray(v)&&v.length).length;
    $('resumeCard').hidden=false;
    $('resumeSubject').textContent=k.subject;
    $('resumeMeta').textContent=`${examText(k)}　${entered} / ${k.questions.length}項目入力`;
    $('resumeBar').style.width=`${k.questions.length?entered/k.questions.length*100:0}%`;
    $('resumeButton').dataset.signature=store.last;
  }

  function startKey(k){
    if(!k) return;
    currentKey=k;
    loadSaved(k);
    const groups=groupsFor(k),activeGroup=k.questions[currentIndex]&&k.questions[currentIndex].group;
    currentGroupIndex=Math.max(0,groups.indexOf(activeGroup));
    lastResult=null;
    window.__lastGrade=null;
    renderEntry();
    showScreen('entry');
  }
  function startSelected(){ startKey(selectedKey()); }
  function resumeLast(){ startKey(keys.find(k=>keySignature(k)===$('resumeButton').dataset.signature)); }

  function tokenSet(k){
    const values=[];
    (k.questions||[]).forEach(q=>{
      if(q.answer!=null) values.push(q.answer);
      if(Array.isArray(q.answers)) values.push(...q.answers);
      if(Array.isArray(q.correctOptions)) q.correctOptions.forEach(option=>values.push(...option));
      if(Array.isArray(q.conditionalCorrect)) q.conditionalCorrect.forEach(c=>values.push(...(c.answers||[])));
    });
    const joined=values.join('').normalize('NFKC').toUpperCase();
    const usedLetters=[...new Set(joined.match(/[A-Z]/g)||[])].sort();
    const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const highest=usedLetters.length?Math.max(2,...usedLetters.map(letter=>alphabet.indexOf(letter))):-1;
    const letters=highest>=0?alphabet.slice(0,highest+1):[];
    return {minus:joined.includes('-')||String(k.subject).includes('数学'),letters};
  }
  function renderNumberKeys(){
    const tokens=tokenSet(currentKey),layout=['7','8','9','4','5','6','1','2','3'];
    let html=layout.map(token=>`<button class="key" type="button" data-token="${token}">${token}</button>`).join('');
    if(tokens.minus) html+=`<button class="key" type="button" data-token="-">－</button><button class="key" type="button" data-token="0">0</button>`;
    else html+=`<button class="key zero-wide" type="button" data-token="0">0</button>`;
    html+=`<button class="key erase" type="button" data-action="erase" aria-label="1文字消す">⌫</button>`;
    $('numberKeys').innerHTML=html;
    $('numberKeys').querySelectorAll('[data-token]').forEach(button=>button.onclick=()=>inputToken(button.dataset.token));
    $('numberKeys').querySelector('[data-action="erase"]').onclick=eraseToken;
    $('letterKeys').hidden=!tokens.letters.length;
    $('letterKeys').innerHTML=tokens.letters.map(letter=>`<button class="key" type="button" data-token="${letter.toLowerCase()}">${letter}</button>`).join('');
    $('letterKeys').querySelectorAll('[data-token]').forEach(button=>button.onclick=()=>inputToken(button.dataset.token));
    requestAnimationFrame(updateKeypadHeight);
  }
  function renderEntry(){
    if(!currentKey) return;
    $('entryExam').textContent=examText(currentKey);
    $('entrySubject').textContent=currentKey.subject;
    renderGroupTabs();
    renderAnswerGrid();
    renderNumberKeys();
    renderProgress();
    renderKeypadCurrent();
  }
  function renderGroupTabs(){
    const groups=groupsFor(currentKey);
    $('groupTabs').innerHTML=groups.map((group,i)=>{
      const qs=currentKey.questions.filter(q=>q.group===group),done=qs.filter(q=>answerFor(q).length).length;
      return `<button class="group-tab ${i===currentGroupIndex?'active':''}" type="button" data-group="${i}">${esc(group)} ${done}/${qs.length}</button>`;
    }).join('');
    $('groupTabs').querySelectorAll('[data-group]').forEach(button=>button.onclick=()=>showGroup(Number(button.dataset.group)));
    const active=$('groupTabs').querySelector('.active');
    if(active) active.scrollIntoView({block:'nearest',inline:'center'});
  }
  function renderAnswerGrid(){
    const groups=groupsFor(currentKey),group=groups[currentGroupIndex],questions=currentKey.questions.filter(q=>q.group===group);
    $('groupHeading').textContent=group;
    const done=questions.filter(q=>answerFor(q).length).length;
    $('groupProgress').textContent=`${done} / ${questions.length}入力`;
    $('answerGrid').innerHTML=questions.map(q=>{
      const index=currentKey.questions.indexOf(q),value=answerFor(q).join('');
      return `<button type="button" class="answer-cell ${index===currentIndex?'active':''} ${value?'done':'empty'}" data-index="${index}" title="${esc(displayId(q))}"><span class="cell-id">${esc(q.id)}</span><span class="cell-value">${esc(value||'—')}</span></button>`;
    }).join('');
    $('answerGrid').querySelectorAll('[data-index]').forEach(button=>button.onclick=()=>selectQuestion(Number(button.dataset.index)));
    $('prevGroup').disabled=currentGroupIndex===0;
    $('nextGroup').disabled=currentGroupIndex===groups.length-1;
  }
  function renderProgress(){
    const entered=currentKey.questions.filter(q=>answerFor(q).length).length,total=currentKey.questions.length;
    $('entryProgressText').textContent=`${entered} / ${total}`;
    $('entryProgressBar').style.width=`${total?entered/total*100:0}%`;
  }
  function renderKeypadCurrent(){
    const q=currentKey.questions[currentIndex];
    if(!q) return;
    const value=answerFor(q).join('');
    $('currentQuestion').textContent=displayId(q);
    $('currentAnswer').textContent=value||'未入力';
  }
  function updateKeypadHeight(){
    if(window.innerWidth<=780&&$('keypad')) document.documentElement.style.setProperty('--keypad-height',$('keypad').offsetHeight+'px');
  }
  function selectQuestion(index){
    currentIndex=Math.max(0,Math.min(index,currentKey.questions.length-1));
    const group=currentKey.questions[currentIndex].group;
    currentGroupIndex=Math.max(0,groupsFor(currentKey).indexOf(group));
    renderGroupTabs();renderAnswerGrid();renderKeypadCurrent();saveCurrent();
  }
  function showGroup(index){
    const groups=groupsFor(currentKey);
    currentGroupIndex=Math.max(0,Math.min(index,groups.length-1));
    const first=currentKey.questions.findIndex(q=>q.group===groups[currentGroupIndex]);
    if(first>=0) currentIndex=first;
    renderGroupTabs();renderAnswerGrid();renderKeypadCurrent();saveCurrent();
  }
  function moveToIndex(index){ selectQuestion((index+currentKey.questions.length)%currentKey.questions.length); }
  function nextUnfilled(){
    for(let offset=1;offset<=currentKey.questions.length;offset++){
      const index=(currentIndex+offset)%currentKey.questions.length;
      if(!answerFor(currentKey.questions[index]).length){ selectQuestion(index); return; }
    }
    moveToIndex(currentIndex+1);
  }
  function inputToken(token){
    const q=currentKey.questions[currentIndex],id=qKey(q),max=expectedLength(q);
    let value=answers[id]||[];
    if(value.length>=max) value=[];
    value.push(norm(token));
    answers[id]=value;
    if(value.length>=max){
      const next=currentKey.questions.findIndex((item,i)=>i>currentIndex&&!answerFor(item).length);
      if(next>=0) currentIndex=next; else if(currentIndex<currentKey.questions.length-1) currentIndex++;
      currentGroupIndex=Math.max(0,groupsFor(currentKey).indexOf(currentKey.questions[currentIndex].group));
    }
    renderGroupTabs();renderAnswerGrid();renderProgress();renderKeypadCurrent();saveCurrent();
  }
  function eraseToken(){
    const q=currentKey.questions[currentIndex],id=qKey(q);
    answers[id]=(answers[id]||[]).slice(0,-1);
    if(!answers[id].length) delete answers[id];
    renderGroupTabs();renderAnswerGrid();renderProgress();renderKeypadCurrent();saveCurrent();
  }

  function eq(a,b,unordered){
    a=(a||[]).map(norm);b=(b||[]).map(norm);
    if(a.length!==b.length) return false;
    if(unordered){a=a.slice().sort();b=b.slice().sort();}
    return a.every((value,i)=>value===b[i]);
  }
  function getById(id,group){
    const inGroup=currentKey.questions.find(q=>q.group===group&&norm(q.id)===norm(id));
    if(inGroup) return answerFor(inGroup);
    const all=currentKey.questions.filter(q=>norm(q.id)===norm(id));
    return all.length===1?answerFor(all[0]):[];
  }
  function matchAnswer(got,q){
    if(q.alwaysAward) return qPoints(q);
    if(Array.isArray(q.conditionalCorrect)){
      for(const condition of q.conditionalCorrect){
        const conditionOk=Array.isArray(condition.allOf)
          ?condition.allOf.every(d=>eq(getById(d.ifId,q.group),d.ifEquals||[],!!d.ifUnordered))
          :eq(getById(condition.ifId,q.group),condition.ifEquals||[],!!condition.ifUnordered);
        if(conditionOk&&eq(got,condition.answers||[],!!condition.unordered)) return qPoints(q);
      }
      return 0;
    }
    if(Array.isArray(q.correctOptions)&&q.correctOptions.some(option=>eq(got,option,!!q.unordered))) return qPoints(q);
    if(eq(got,expected(q),!!q.unordered)) return qPoints(q);
    if(q.partialAnyCorrect){
      const ex=expected(q);let matches=0;
      if(q.unordered){
        const remaining=ex.slice();
        for(const value of (got||[]).map(norm)){const index=remaining.indexOf(value);if(index>=0){matches++;remaining.splice(index,1);}}
      }else{
        for(let i=0;i<Math.min((got||[]).length,ex.length);i++) if(norm(got[i])===norm(ex[i])) matches++;
      }
      if(matches>0) return Math.min(qPoints(q),Number(q.partialAnyCorrect)*matches);
    }
    if(Array.isArray(q.partialConditions)) for(const partial of q.partialConditions){
      const partialAnswers=Array.isArray(partial.answers)?partial.answers:[partial.answer];
      if(got.length===partialAnswers.length&&partialAnswers.every((value,i)=>value==='*'||value===null||norm(got[i])===norm(value))) return Number(partial.points||0);
    }
    if(Array.isArray(q.partialAnswers)) for(const partial of q.partialAnswers){
      const partialAnswers=Array.isArray(partial.answers)?partial.answers:[partial.answer];
      if(eq(got,partialAnswers,!!partial.unordered)) return Number(partial.points||0);
    }
    return 0;
  }
  function expText(q){
    if(q.alwaysAward) return '全員得点';
    if(Array.isArray(q.correctOptions)) return q.correctOptions.map(option=>option.join('')).join(' または ');
    if(Array.isArray(q.conditionalCorrect)) return q.conditionalCorrect.map(c=>`${Array.isArray(c.allOf)?c.allOf.map(d=>`${d.ifId}=${(d.ifEquals||[]).join('')}`).join('&'):`${c.ifId}=${(c.ifEquals||[]).join('')}`}→${(c.answers||[]).join('')}`).join(' / ');
    return expected(q).join('');
  }
  function statsFor(k){ return (statistics.entries||[]).find(s=>String(s.year)===String(k.year)&&s.exam===k.exam&&s.subject===k.subject)||null; }
  function statForQuestion(k,q){
    const stats=statsFor(k);
    return stats&&Array.isArray(stats.items)?stats.items.find(item=>String(item.id)===String(q.id)):null;
  }
  function statRateHtml(k,q){
    const stat=statForQuestion(k,q);
    if(!stat) return '—';
    if(Array.isArray(stat.correctRateByPart)) return stat.correctRateByPart.map(x=>`${esc(x.id)}：${Number(x.correctRate).toFixed(2)}%`).join('<br>');
    return stat.correctRate==null?'—':Number(stat.correctRate).toFixed(2)+'%';
  }
  function rowNote(k,row){
    const stat=statForQuestion(k,row.q);
    return [row.q.note||'',stat&&stat.note||''].filter(Boolean).join(' / ');
  }
  function sectionStats(rows){
    const included=rows.filter(row=>row.included);
    const map=new Map();
    included.forEach(row=>{
      const group=normalizedGroup(row.q.group||row.q.problemNumber);
      if(!map.has(group)) map.set(group,{group,earn:0,max:0,items:0,correct:0,missing:0});
      const stat=map.get(group);stat.earn+=row.earn;stat.max+=row.pts;stat.items++;
      if(row.earn===row.pts) stat.correct++;
      if(!row.got.length) stat.missing++;
    });
    return [...map.values()].sort((a,b)=>groupCompare(a.group,b.group));
  }
  function calculateResult(){
    const rows=currentKey.questions.map((q,i)=>({q,i,got:answerFor(q),earn:matchAnswer(answerFor(q),q),pts:qPoints(q),included:true}));
    let score=0,possible=0,correct=0,missing=0;
    const optionalGroups=new Set();
    if(Array.isArray(currentKey.selectionRules)){
      currentKey.selectionRules.forEach(rule=>(rule.groups||[]).forEach(group=>optionalGroups.add(group)));
      rows.filter(row=>!optionalGroups.has(row.q.group)).forEach(row=>{possible+=row.pts;score+=row.earn;if(row.earn===row.pts)correct++;if(!row.got.length)missing++;});
      currentKey.selectionRules.forEach(rule=>{
        const stats=(rule.groups||[]).map(group=>{
          const groupRows=rows.filter(row=>row.q.group===group);
          return {group,rows:groupRows,max:groupRows.reduce((sum,row)=>sum+row.pts,0),earn:groupRows.reduce((sum,row)=>sum+row.earn,0),has:groupRows.some(row=>row.got.length)};
        }).sort((a,b)=>(Number(b.has)-Number(a.has))||(b.earn-a.earn));
        const chosen=stats.slice(0,Number(rule.choose||1)),chosenSet=new Set(chosen.map(item=>item.group));
        stats.forEach(item=>item.rows.forEach(row=>{row.included=chosenSet.has(item.group);}));
        chosen.forEach(item=>item.rows.forEach(row=>{possible+=row.pts;score+=row.earn;if(row.earn===row.pts)correct++;if(!row.got.length)missing++;}));
      });
    }else rows.forEach(row=>{possible+=row.pts;score+=row.earn;if(row.earn===row.pts)correct++;if(!row.got.length)missing++;});
    const max=currentKey.maxScore==null?possible:Number(currentKey.maxScore),display=possible?score*max/possible:score,rate=possible?score/possible*100:0;
    return {k:currentKey,rows,score,possible,okc:correct,missing,mx:max,disp:display,rate,sig:keySignature(currentKey),createdAt:new Date()};
  }

  function radarSvg(stats){
    if(!stats.length) return '';
    const n=stats.length,cx=160,cy=160,r=110;
    const point=(i,ratio)=>{const angle=-Math.PI/2+Math.PI*2*i/n;return [cx+Math.cos(angle)*r*ratio,cy+Math.sin(angle)*r*ratio];};
    const grid=[.25,.5,.75,1].map(ratio=>`<polygon class="radarGrid" points="${stats.map((_,i)=>point(i,ratio).join(',')).join(' ')}"></polygon>`).join('');
    const axes=stats.map((stat,i)=>{const end=point(i,1),angle=-Math.PI/2+Math.PI*2*i/n,label=[cx+Math.cos(angle)*(r+26),cy+Math.sin(angle)*(r+26)];return `<line class="radarAxis" x1="${cx}" y1="${cy}" x2="${end[0]}" y2="${end[1]}"></line><text x="${label[0]}" y="${label[1]}" text-anchor="middle" dominant-baseline="middle" font-size="11" fill="#344054">${esc(stat.group)}</text>`;}).join('');
    const scorePoints=stats.map((stat,i)=>point(i,stat.max?stat.earn/stat.max:0));
    return `<svg class="radarSvg" viewBox="0 0 320 320" role="img" aria-label="問題番号別正答率レーダーチャート">${grid}${axes}<polygon class="radarShape" points="${scorePoints.map(p=>p.join(',')).join(' ')}"></polygon>${scorePoints.map(p=>`<circle class="radarPoint" cx="${p[0]}" cy="${p[1]}" r="3"></circle>`).join('')}</svg>`;
  }
  function renderResult(result){
    const stats=sectionStats(result.rows),included=result.rows.filter(row=>row.included),average=statsFor(result.k),bad=included.filter(row=>!row.got.length||row.earn<row.pts);
    const averageValue=average&&average.averageScore!=null?Number(average.averageScore).toFixed(2):'—';
    const sectionRows=stats.map(stat=>`<tr><td>${esc(stat.group)}</td><td>${Math.round(stat.earn*10)/10} / ${stat.max}</td><td>${stat.max?Math.round(stat.earn/stat.max*1000)/10:0}%</td><td>${stat.correct} / ${stat.items}</td><td>${stat.missing}</td></tr>`).join('');
    const allRows=result.rows.map(row=>{
      const judge=!row.included?'—':row.earn===row.pts?'○':row.earn>0?'△':'×',judgeClass=judge==='○'?'ok':judge==='△'?'partial':judge==='×'?'ng':'';
      return `<tr><td>${esc(displayId(row.q))}</td><td>${esc(row.got.join('')||'未入力')}</td><td>${esc(expText(row.q))}</td><td>${row.included?`${row.earn} / ${row.pts}`:'対象外'}</td><td class="${judgeClass}">${judge}</td><td>${statRateHtml(result.k,row.q)}</td><td>${esc(rowNote(result.k,row)||'—')}</td></tr>`;
    }).join('');
    const missed=bad.length?`<div class="missedPanel"><h3>間違えた問題・未入力</h3><div class="missedList">${bad.map(row=>`<div class="missedItem"><b>${esc(displayId(row.q))}　${!row.got.length?'未入力':row.earn>0?'△':'×'}</b>自分：${esc(row.got.join('')||'未入力')} / 正解：${esc(expText(row.q))}<br>得点：${row.earn} / ${row.pts}</div>`).join('')}</div></div>`:'<div class="missedOk">間違えた問題・未入力はありません</div>';
    $('result').innerHTML=`
      <div class="result-action-top">
        <div class="resultActionBar"><div class="resultActionLabel">採点結果</div><div class="resultActionIdentity"><span class="resultExamLine">${esc(examText(result.k))}</span><span class="resultSubjectLine">${esc(result.k.subject)}</span></div></div>
        <div class="result-buttons"><button type="button" id="editFromResult">解答を修正</button><button class="pdf-button" type="button" id="exportPdfResult">PDF出力（A4）</button></div>
      </div>
      <div class="resultSummaryCard">
        <div><div class="resultSummarySubject">${esc(result.k.subject)}</div><div class="resultSummaryMeta">${esc(examText(result.k))}</div><div class="avgScoreMetric"><span class="avgLabel">受験者平均点</span><b class="avgValue">${esc(averageValue)}</b></div></div>
        <div class="resultSummaryStats"><div class="resultSummaryStat"><span>点数</span><b>${Math.round(result.disp*10)/10} / ${result.mx}</b></div><div class="resultSummaryStat"><span>得点率</span><b>${Math.round(result.rate*10)/10}%</b></div><div class="resultSummaryStat"><span>正答項目</span><b>${result.okc} / ${included.length}</b></div><div class="resultSummaryStat"><span>未入力</span><b>${result.missing}</b></div></div>
      </div>
      ${stats.length?`<div class="radarPanel"><h3>問題番号別正答率</h3><div class="radarWrap">${radarSvg(stats)}<div class="sectionStats"><table><thead><tr><th>問題番号</th><th>得点</th><th>得点率</th><th>正答項目</th><th>未入力</th></tr></thead><tbody>${sectionRows}</tbody></table></div></div></div>`:''}
      <h2 class="table-title">全問正誤</h2><p class="tableScrollNotice">表は右にスクロールできます</p>
      <div class="resultTableWrap"><table class="resultTable"><thead><tr><th>番号</th><th>自分</th><th>正解</th><th>得点</th><th>判定</th><th>受験者正答率</th><th>注記</th></tr></thead><tbody>${allRows}</tbody></table></div>
      ${missed}
      <div class="result-bottom"><button type="button" id="editBottom">解答を修正</button><button type="button" id="anotherSubject">別の科目を選ぶ</button></div>`;
    $('editFromResult').onclick=$('editBottom').onclick=()=>showScreen('entry');
    $('anotherSubject').onclick=()=>showScreen('home');
  }
  function requestGrade(){
    const missing=currentKey.questions.filter(q=>!answerFor(q).length).length;
    if(missing){
      $('missingMessage').textContent=`${missing}項目が未入力です。未入力は0点として採点できます。`;
      $('missingModal').hidden=false;
    }else gradeNow();
  }
  function gradeNow(){
    $('missingModal').hidden=true;
    saveCurrent();
    lastResult=calculateResult();
    window.__lastGrade=lastResult;
    renderResult(lastResult);
    showScreen('result');
  }

  function fillCheckAnswers(){
    const available=tokenSet(currentKey),candidates=['1','2','3','4','5','6','7','8','9','0',...(available.minus?['-']:[]),...available.letters.map(x=>x.toLowerCase())];
    currentKey.questions.forEach((q,index)=>{
      if(index%9===0){ delete answers[qKey(q)]; return; }
      let correct=Array.isArray(q.correctOptions)?q.correctOptions[0]:(Array.isArray(q.conditionalCorrect)?(q.conditionalCorrect[0].answers||[]):expected(q));
      correct=(correct||[]).map(norm);
      if(index%4===0){
        const wrong=candidates.find(token=>token!==correct[0])||'0';
        correct=correct.map((value,i)=>i===0?wrong:value);
      }
      answers[qKey(q)]=correct;
    });
    currentIndex=0;currentGroupIndex=0;renderEntry();saveCurrent();
  }
  function clearAllAnswers(){
    if(!confirm('この科目の入力をすべて消します。よろしいですか？')) return;
    answers={};currentIndex=0;currentGroupIndex=0;renderEntry();saveCurrent();
  }

  function updateSteps(step){
    document.querySelectorAll('.step').forEach((el,i)=>{
      el.classList.toggle('active',i===step-1);el.classList.toggle('done',i<step-1);
    });
  }
  function applyScreen(name){
    currentScreen=name;
    $('homeScreen').hidden=name!=='home';$('entryScreen').hidden=name!=='entry';$('resultScreen').hidden=name!=='result';
    document.body.classList.toggle('entry-mode',name==='entry');
    $('headerBack').hidden=name==='home';
    updateSteps(name==='home'?1:name==='entry'?2:3);
    if(name==='home'){renderResume();renderSubjectPreview();}
    if(name==='entry'){renderEntry();requestAnimationFrame(updateKeypadHeight);}
    window.scrollTo({top:0,behavior:'instant'});
  }
  function showScreen(name,push=true){
    applyScreen(name);
    if(push&&history.state&&history.state.screen!==name) history.pushState({screen:name},'',location.href);
  }
  function backOne(){
    if(currentScreen==='result') showScreen('entry');
    else if(currentScreen==='entry') showScreen('home');
  }
  function handleKeyboard(event){
    if(currentScreen!=='entry'||event.metaKey||event.ctrlKey||event.altKey) return;
    const token=event.key==='-'?'-':event.key.toLowerCase(),tokens=tokenSet(currentKey);
    if(/[0-9]/.test(token)||(token==='-'&&tokens.minus)||tokens.letters.map(x=>x.toLowerCase()).includes(token)){event.preventDefault();inputToken(token);}
    else if(event.key==='Backspace'||event.key==='Delete'){event.preventDefault();eraseToken();}
    else if(event.key==='ArrowLeft'){event.preventDefault();moveToIndex(currentIndex-1);}
    else if(event.key==='ArrowRight'||event.key==='Enter'){event.preventDefault();nextUnfilled();}
  }

  function bind(){
    $('yearSelect').onchange=refreshExamOptions;$('examSelect').onchange=refreshSubjectOptions;$('subjectSelect').onchange=renderSubjectPreview;
    $('startButton').onclick=startSelected;$('resumeButton').onclick=resumeLast;$('brandHome').onclick=()=>showScreen('home');
    $('headerBack').onclick=backOne;$('backToSelection').onclick=()=>showScreen('home');
    $('previousField').onclick=()=>moveToIndex(currentIndex-1);$('nextBlank').onclick=nextUnfilled;$('gradeButton').onclick=requestGrade;
    $('prevGroup').onclick=()=>showGroup(currentGroupIndex-1);$('nextGroup').onclick=()=>showGroup(currentGroupIndex+1);
    $('returnToEntry').onclick=()=>{$('missingModal').hidden=true;};$('scoreAnyway').onclick=gradeNow;
    $('fillCheckAnswers').onclick=fillCheckAnswers;$('clearAllAnswers').onclick=clearAllAnswers;
    window.addEventListener('resize',updateKeypadHeight);window.addEventListener('orientationchange',()=>setTimeout(updateKeypadHeight,200));
    window.addEventListener('popstate',event=>applyScreen(event.state&&event.state.screen||'home'));
    document.addEventListener('keydown',handleKeyboard);
  }

  window.selId=()=>keySignature(currentKey);
  window.grade=gradeNow;
  window.sectionStats=sectionStats;
  window.displayId=displayId;
  window.expText=expText;
  window.statRateHtml=statRateHtml;
  window.rowNote=rowNote;
  window.esc=esc;

  history.replaceState({screen:'home'},'',location.href);
  bind();
  applyScreen('home');
  loadData();
})();
