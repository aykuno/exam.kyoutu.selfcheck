/* 列対応と拡大画像の回帰試験。Google APIは呼び出さない。 */
const fs=require("fs"),path=require("path"),vm=require("vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../../.."),window={};
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
for(const file of ["answer-format.js","image-preparation.js"])vm.runInNewContext(read("kyoutu-ui-lab/photo/"+file),{window});
const F=window.PhotoAnswerFormat,P=window.PhotoImagePreparation;
let cases=0;
function test(name,fn){fn();cases++;console.log("PASS "+name);}
const entries=[{code:"R1",label:"ア",group:"第1問"}];
const sheet=(options,item={},layout={})=>F.normalizeSheet({
  layouts:[{id:"L1",options,confidence:"high",...layout}],
  answers:[{code:"R1",label:"ア",group:"第1問",kind:"mark",layoutId:"L1",markedIndices:[0],
    value:"1",confidence:"high",...item}]
},entries)[0];
const math=["-","0","1","2","3","4","5","6","7","8","9"];
const english=["1","2","3","4","5","6","7","8","9","10"];
test("math column positions map independently of the AI digit value",()=>{
  math.forEach((option,index)=>assert.equal(sheet(math,{markedIndices:[index],value:"9"}).value,option));
});
test("English starts at 1 and a two-digit printed option is one value",()=>{
  english.forEach((option,index)=>assert.equal(sheet(english,{markedIndices:[index],value:"0"}).value,option));
});
test("different option counts retain each row's printed order",()=>{
  assert.equal(sheet(["1","2","3","4"],{markedIndices:[3],value:"3"}).value,"4");
  assert.equal(sheet(["0","1","2"],{markedIndices:[0]}).value,"0");
  assert.equal(sheet(["c","a","b"],{markedIndices:[0]}).value,"c");
});
test("negative sign typography is normalized",()=>{
  assert.equal(sheet(["−","０","１"],{markedIndices:[0]}).value,"-");
});
test("double marks cannot become a confident single answer",()=>{
  const got=sheet(english,{markedIndices:[0,1],value:"1"});
  assert.equal(got.state,"warn");assert.equal(got.value,"");
});
test("out-of-range and fractional column positions require review",()=>{
  for(const indices of [[10],[-1],[.5],["0"]])assert.equal(sheet(english,{markedIndices:indices}).state,"warn");
});
test("empty positions represent blank only when explicitly confirmed",()=>{
  assert.equal(sheet(english,{markedIndices:[],value:"blank"}).state,"blank");
  assert.equal(sheet(english,{markedIndices:[],value:"1"}).state,"warn");
});
test("missing layout or positions cannot use an unchecked numeric answer",()=>{
  assert.equal(sheet(english,{layoutId:"missing"}).value,"");
  assert.equal(sheet(english,{markedIndices:undefined}).state,"warn");
});
test("unreadable and duplicate options require review",()=>{
  for(const options of [[],["1","1"],["1","unknown"],["blank","2"]])assert.equal(sheet(options).state,"warn");
});
test("conflicting definitions of the same layout require review",()=>{
  const got=F.normalizeSheet({layouts:[
    {id:"L1",options:["1","2"],confidence:"high"},
    {id:"L1",options:["2","1"],confidence:"high"}],
    answers:[{code:"R1",kind:"mark",layoutId:"L1",markedIndices:[0],value:"1",confidence:"high"}]},entries)[0];
  assert.equal(got.state,"warn");assert.equal(got.value,"");
});
test("weak option-label confidence is not promoted by a clear mark",()=>{
  assert.equal(sheet(english,{}, {confidence:"low"}).state,"warn");
});
test("unknown or contradictory blank evidence remains uncertain",()=>{
  assert.equal(sheet(english,{value:"unknown"}).value,"");
  assert.equal(sheet(english,{value:"blank"}).state,"warn");
});
test("a conflicting printed row label or question group is not accepted",()=>{
  assert.equal(sheet(english,{label:"イ"}).value,"");
  assert.equal(sheet(english,{group:"第2問"}).value,"");
});
test("handwritten and previously saved answer formats remain supported",()=>{
  const got=F.normalizeSheet({answers:[{code:"R1",kind:"handwritten",value:"−",confidence:"high"}]},entries)[0];
  assert.equal(got.value,"-");assert.equal(got.state,"ok");
  assert.equal(F.normalizeSheet({answers:[{code:"R1",value:"2",confidence:"high"}]},entries)[0].value,"2");
});
test("subject profiles distinguish math, English, and mixed information rows",()=>{
  assert.equal(F.columnProfile("数学Ⅱ・B・C").kind,"math");
  assert.equal(F.columnProfile("英語リーディング").options[0],"1");
  assert.equal(F.columnProfile("情報Ⅰ").kind,"mixed");
});
test("detail bands preserve row labels and all columns, with overlap",()=>{
  const regions=P.detailRegions(3000,4000);
  assert.equal(regions.length,2);
  assert.ok(regions.every(r=>r.x===0&&r.width===3000));
  assert.equal(regions[0].y,0);assert.equal(regions[1].y+regions[1].height,4000);
  assert.ok(regions[0].height>regions[1].y);
  for(let y=0;y<4000;y++)assert.ok(regions.some(r=>y>=r.y&&y<r.y+r.height));
});
test("small photos are not enlarged or needlessly tiled",()=>{
  assert.equal(P.detailRegions(700,1000).length,0);
  assert.equal(P.detailRegions(500,4000).length,0);
});
test("all groups retain their separate option layouts",()=>{
  const got=F.normalizeSheet({layouts:[
    {id:"math",options:math,confidence:"high"},{id:"english",options:english,confidence:"high"}],
    answers:[
      {code:"m",label:"ア",group:"第1問",kind:"mark",layoutId:"math",markedIndices:[0],value:"1",confidence:"high"},
      {code:"e",label:"1",group:"第2問",kind:"mark",layoutId:"english",markedIndices:[0],value:"0",confidence:"high"}
    ]},[],true);
  assert.deepEqual(Array.from(got,a=>a.value),["-","1"]);
});
console.log("PHOTO_COLUMN_TESTS "+JSON.stringify({cases}));
