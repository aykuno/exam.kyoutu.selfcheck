/* 写真採点の形式・採点規則の回帰試験。Google APIを呼び出さない。 */
const fs=require("fs"),path=require("path"),vm=require("vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../../.."),window={};
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
for(const file of ["answer-format.js","grader.js"])vm.runInNewContext(read("kyoutu-ui-lab/photo/"+file),{window});
const F=window.PhotoAnswerFormat,G=window.MarkReaderGrader;
const u=read("kyoutu-ui-lab/photo/universal-reader.js");
const makeStart=u.indexOf("  function makeKey(result) {"),makeEnd=u.indexOf("  function renderKey()",makeStart);
const makeSource=u.slice(makeStart,makeEnd);
const makeKey=(result,entries)=>vm.runInNewContext(makeSource+"\nmakeKey(result);",{
  window,result,entries,label:()=>"試験",norm:F.norm,clone:value=>JSON.parse(JSON.stringify(value))
});
let cases=0;
function test(name,fn){fn();cases++;console.log("PASS "+name);}
const metadata=(labels,group="第1問")=>labels.map((label,i)=>({code:"R"+(i+1),label,group}));
const grade=(key,values,selectedGroups)=>G.grade({key,mode:"universal",
  answerEntries:values.map((value,i)=>({code:"R"+(i+1),value})),selectedGroups});
const keyFrom=(raw,entries)=>makeKey(F.normalizeKey(raw,entries),entries);
test("numeric and kana ranges keep printed slots",()=>{
  assert.deepEqual(Array.from(F.slotLabels({id:"10-12",answers:["1","2","3"]})),["10","11","12"]);
  assert.deepEqual(Array.from(F.slotLabels({id:"ア〜ウ",answers:["-","1","2"]})),["ア","イ","ウ"]);
});
test("a two-digit option remains one slot",()=>{
  assert.deepEqual(Array.from(F.vector("10",1)),["10"]);
  assert.equal(F.slots({id:"1",answer:"10"}),1);
});
test("combined sheet digits and minus expand into atomic answers",()=>{
  const values=F.normalizeSheet({answers:[{code:"Q1/アイウ",label:"アイウ",group:"Q1",value:"−12",confidence:"high"}]});
  assert.deepEqual(Array.from(values,a=>a.value),["-","1","2"]);
  assert.deepEqual(Array.from(values,a=>a.group),["第1問","第1問","第1問"]);
});
test("explicit grouped sheet codes and values are accepted",()=>{
  const entries=metadata(["ア","イ"]);
  const values=F.normalizeSheet({answers:[{codes:["R1","R2"],label:"アイ",value:"21",confidence:"high"}]},entries);
  assert.deepEqual(Array.from(values,a=>a.value),["2","1"]);
});
test("ambiguous grouped values remain pending",()=>{
  const values=F.normalizeSheet({answers:[{codes:["R1","R2"],value:"123",confidence:"high"}]},metadata(["ア","イ"]));
  assert.ok(values.every(a=>a.state==="warn"&&a.value===""));
});
test("unregistered page additions retain old codes and accept new labels",()=>{
  const old=F.normalizeSheet({answers:[{code:"1",label:"1",group:"Q1",value:"2",confidence:"high"}]});
  const next=F.normalizeSheet({answers:[
    {code:"changed",label:"1",group:"Q1",value:"2",confidence:"high"},
    {code:"2",label:"2",group:"Q1",value:"3",confidence:"high"}
  ]},old,true);
  assert.equal(next[0].code,old[0].code);assert.equal(next.length,2);
});
test("same label in different groups is not mixed",()=>{
  const entries=[{code:"a",label:"ア",group:"第1問"},{code:"b",label:"ア",group:"第2問"}];
  const values=F.normalizeSheet({answers:[{code:"unknown",label:"ア",group:"Q2",value:"3",confidence:"high"}]},entries);
  assert.equal(values[0].code,"b");
});
test("duplicate conflicting marks require confirmation",()=>{
  const values=F.normalizeSheet({answers:[
    {code:"R1",value:"1",confidence:"high"},{code:"R1",value:"2",confidence:"high"}
  ]},metadata(["1"]));
  assert.equal(values[0].state,"warn");assert.equal(values[0].value,"");
});
test("blank and double marks remain distinct",()=>{
  const values=F.normalizeSheet({answers:[
    {code:"R1",value:"blank",confidence:"high"},{code:"R2",value:"unknown",confidence:"low"}
  ]},metadata(["1","2"]));
  assert.equal(values[0].state,"blank");assert.equal(values[1].state,"warn");
});
test("combined key -12 is preserved as one scoring unit",()=>{
  const key=keyFrom({maxScore:100,answers:[{codes:["R1","R2","R3"],answers:["−12"],points:3,confidence:"high"}]},metadata(["ア","イ","ウ"]));
  assert.equal(key.questions.length,1);
  assert.equal(grade(key,["-","1","2"]).rawScore,3);
  assert.equal(grade(key,["-","1","9"]).rawScore,0);
  assert.equal(grade(key,["-","1","2"]).score,3);
});
test("all-or-nothing and per-answer unordered scoring differ",()=>{
  const entries=metadata(["10","11"]);
  const raw={answers:[{codes:["R1","R2"],answers:["2","5"],points:4,unordered:true,confidence:"high"}]};
  const all=keyFrom(raw,entries);
  assert.equal(grade(all,["5","2"]).rawScore,4);
  assert.equal(grade(all,["2","9"]).rawScore,0);
  raw.answers[0].partialAnyCorrect=2;
  const each=keyFrom(raw,entries);
  assert.equal(grade(each,["2","9"]).rawScore,2);
  assert.equal(grade(each,["2","2"]).rawScore,2);
});
test("alternative answers keep multi-character tokens",()=>{
  const key=keyFrom({answers:[{codes:["R1","R2"],answers:["10","a"],correctOptions:[["11","b"]],points:3,confidence:"high"}]},metadata(["ア","イ"]));
  assert.equal(grade(key,["11","b"]).rawScore,3);
  assert.equal(grade(key,["1","1"]).rawScore,0);
});
test("specified and wildcard partial credits survive key construction",()=>{
  const entries=metadata(["ア","イ"]);
  const a=keyFrom({answers:[{codes:["R1","R2"],answers:["1","2"],points:4,confidence:"high",
    partialAnswers:[{answers:["3","4"],points:2}]}]},entries);
  assert.equal(grade(a,["3","4"]).rawScore,2);
  const b=keyFrom({answers:[{codes:["R1","R2"],answers:["1","2"],points:4,confidence:"high",
    partialConditions:[{answers:["1","*"],points:2}]}]},entries);
  assert.equal(grade(b,["1","9"]).rawScore,2);
});
test("conditional key references atomic photographed entries",()=>{
  const key=keyFrom({answers:[
    {codes:["R1"],answers:["1"],points:2,confidence:"high"},
    {codes:["R2"],answers:["0"],points:3,confidence:"high",
      conditionalCorrect:[{answers:["0"],allOf:[{ifCode:"R1",ifEquals:["1"]}]}]}
  ]},metadata(["ア","イ"]));
  assert.equal(grade(key,["1","0"]).rawScore,5);
  assert.equal(grade(key,["2","0"]).rawScore,0);
});
test("invalid dependencies are not downgraded to unconditional correctness",()=>{
  const result=F.normalizeKey({answers:[{codes:["R1"],answers:["0"],points:2,confidence:"high",
    conditionalCorrect:[{answers:["0"],allOf:[{ifCode:"missing",ifEquals:["1"]}]}]}]},metadata(["ア"]));
  assert.equal(result.answers.length,0);assert.ok(result.warnings.length);
});
test("conditional registered IDs resolve within the current group",()=>{
  const key={questions:[
    {id:"ア",group:"第1問",answer:"1",points:2,photoCodes:["R1"]},
    {id:"イ",group:"第1問",answers:["0"],points:3,photoCodes:["R2"],
      conditionalCorrect:[{ifId:"ア",ifEquals:["1"],answers:["0"]}]},
    {id:"ア",group:"第2問",answer:"2",points:2,photoCodes:["R3"]}
  ]};
  assert.equal(grade(key,["1","0","2"]).rawScore,7);
});
test("all-award corrections do not count as missing answers",()=>{
  const key=keyFrom({answers:[{codes:["R1"],answers:[],points:2,alwaysAward:true,confidence:"high"}]},metadata(["1"]));
  const result=grade(key,[""]);assert.equal(result.rawScore,2);assert.equal(result.missing,0);
});
test("incomplete grouped answers are reported as missing",()=>{
  const key=keyFrom({answers:[{codes:["R1","R2"],answers:["1","2"],points:3,confidence:"high"}]},metadata(["ア","イ"]));
  assert.equal(grade(key,["1",""]).missing,1);
});
test("missing points do not promote partial answers to correct",()=>{
  const key={pointsAvailable:false,questions:[{id:"1-2",group:"第1問",answers:["1","2"],points:4,
    unordered:true,partialAnyCorrect:2,photoCodes:["R1","R2"]}]};
  const result=grade(key,["1","9"]);assert.equal(result.correct,0);assert.equal(result.partial,1);
});
test("optional groups require explicit selection and use the chosen group",()=>{
  const key={selectionRules:[{groups:["第1問","第2問"],choose:1}],questions:[
    {id:"1",group:"第1問",answer:"1",points:2,photoCodes:["R1"]},
    {id:"1",group:"第2問",answer:"2",points:2,photoCodes:["R2"]}]};
  assert.throws(()=>grade(key,["1","9"]),/選んで/);
  assert.equal(grade(key,["1","9"],new Set(["第2問"])).rawScore,0);
});
test("an incomplete correct-key photograph is not scaled to full marks",()=>{
  const key=keyFrom({maxScore:100,answers:[{codes:["R1"],answers:["1"],points:3,confidence:"high"}]},metadata(["1","2"]));
  const result=grade(key,["1","2"]);assert.equal(result.score,3);assert.equal(result.maxScore,100);
});
test("saved legacy alternatives can still be reconstructed",()=>{
  const key=makeKey({answers:[{codes:["R1","R2"],answers:["1","2"],alternatives:["34"],points:2,confidence:"high"}]},metadata(["ア","イ"]));
  assert.equal(grade(key,["3","4"]).rawScore,2);
});

test("optional empty grouping fields do not hide a scalar answer",()=>{
  const answer=F.normalizeSheet({answers:[{code:"R1",codes:[],values:[],label:"",group:"",value:"2",confidence:"high"}]},metadata(["1"]));
  assert.equal(answer[0].value,"2");
});
test("printed labels in grouped key codes can be matched unambiguously",()=>{
  const key=keyFrom({answers:[{codes:["ア","イ"],group:"Q1",answers:["21"],points:2,confidence:"high"}]},metadata(["ア","イ"]));
  assert.equal(grade(key,["2","1"]).rawScore,2);
});

// 登録済み59科目の写真採点結果を既存の番号入力採点と比較する。
const app=read("kyoutu-ui-lab/app.js");
const eqStart=app.indexOf("  function eq("),matchEnd=app.indexOf("  function expText(",eqStart);
const goldenSource=app.slice(eqStart,matchEnd);
const main=JSON.parse(read("answer_keys_verified.json")).keys.filter(k=>String(k.year)==="2025"&&k.exam==="main");
const mockNames=app.match(/\.\.\/answer_keys_mock_kawai_[^']+\.json/g)||[];
const mocks=mockNames.flatMap(name=>JSON.parse(read(name.slice(3))).keys);
let comparisons=0;
for(const source of [...main,...mocks]){
  const key=JSON.parse(JSON.stringify(source));
  key.questions.forEach((q,i)=>{q.group=F.group(q.group||q.problemNumber);q.problemNumber=q.group;
    q.photoCodes=F.slotLabels(q).map((_,j)=>"R"+i+"-"+j);});
  (key.selectionRules||[]).forEach(rule=>{rule.groups=rule.groups.map(F.group);});
  for(const variant of ["correct","mixed"]){
    const got=key.questions.map((q,i)=>{
      const expected=q.answers||q.correctOptions?.[0]||q.conditionalCorrect?.[0]?.answers||[q.answer];
      const value=Array.from(expected,x=>F.norm(x));
      return variant==="mixed" ? value.map((x,j)=>(i+j)%5===0?"":(i+j)%4===0?"x":x):value;
    });
    const golden=vm.runInNewContext(goldenSource+"\n(q,answer)=>matchAnswer(answer,q);",{
      currentKey:key,answerFor:q=>got[key.questions.indexOf(q)],norm:F.norm,
      qPoints:q=>Number(q.points==null?1:q.points)||1,
      expected:q=>Array.isArray(q.answers)?q.answers.map(F.norm):[F.norm(q.answer)]
    });
    const selectedGroups=new Set((key.selectionRules||[]).flatMap(rule=>rule.groups.slice(0,Number(rule.choose||1))));
    const answerEntries=key.questions.flatMap((q,i)=>q.photoCodes.map((code,j)=>({code,value:got[i][j]||""})));
    const actual=G.grade({key,mode:"universal",answerEntries,selectedGroups});
    actual.rows.forEach((row,i)=>{
      const wanted=golden(key.questions[i],got[i]);
      if (row.earned!==wanted) console.log("SCORING_MISMATCH "+JSON.stringify({
        subject:source.subject,question:key.questions[i],got:got[i],wanted,earned:row.earned,
        questions:key.questions.map((q,index)=>({id:q.id,group:q.group,answers:got[index],codes:q.photoCodes}))
      }));
      assert.equal(row.earned,wanted,
        source.subject+" "+variant+" "+key.questions[i].group+" "+key.questions[i].id);
      comparisons++;
    });
  }
}
console.log("PHOTO_RULE_TESTS "+JSON.stringify({cases,subjects:main.length+mocks.length,comparisons}));
