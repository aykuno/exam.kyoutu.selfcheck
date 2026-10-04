/* モバイル画面の写真採点操作試験。AI応答は既知の値に固定し、APIは呼ばない。 */
const {chromium}=require("playwright"),fs=require("fs"),path=require("path"),assert=require("node:assert/strict");
(async()=>{
  const output="audit/photo-rules/output";fs.mkdirSync(output,{recursive:true});
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:430,height:932}});
  const page=await context.newPage(),googleCalls=[],errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  page.on("request",request=>{if(/firebasevertexai|firebaseappcheck/.test(request.url()))googleCalls.push(request.url());});
  await page.route(/https:\/\/(?:www\.gstatic\.com\/firebasejs|.*googleapis\.com|.*recaptcha\.net)/,route=>route.abort());
  try{
    await page.goto(process.env.PHOTO_VERIFY_URL || "http://127.0.0.1:8765/kyoutu-ui-lab/",{waitUntil:"domcontentloaded"});
    await page.waitForFunction(()=>window.PhotoAnswerFormat&&window.UILabPhotoFlow&&window.MarkReaderAI?.isConfigured());
    await page.evaluate(()=>{
      const F=window.PhotoAnswerFormat;
      window.__sheetPayload={answers:[
        {code:"Q1/アイウ",label:"アイウ",group:"Q1",value:"−12",confidence:"high"},
        {code:"Q2/10-11",label:"10-11",group:"Q2",value:"25",confidence:"high"},
        {code:"Q3/1",label:"1",group:"Q3",value:"10",confidence:"high"}
      ]};
      window.MarkReaderAI=Object.freeze({isConfigured:()=>true,
        analyzeAnswerSheet:async args=>F.normalizeSheet(window.__sheetPayload,args.entries,args.allowAdditional),
        analyzeAnswerKey:async args=>{
          const codes=group=>args.entries.filter(e=>e.group===group).map(e=>e.code);
          return F.normalizeKey({maxScore:100,answers:[
            {codes:codes("第1問"),answers:["−12"],points:3,confidence:"high"},
            {codes:codes("第2問"),answers:["2","5"],points:4,unordered:true,partialAnyCorrect:2,confidence:"high"},
            {codes:codes("第3問"),answers:["10"],points:2,confidence:"high"}
          ]},args.entries);
        }
      });
      document.getElementById("customCompareButton").click();
      window.UILabPhotoFlow.configure({mode:"compare",subject:"形式確認",signature:"rules-ui-test"});
    });
    const image={name:"fixture.png",mimeType:"image/png",buffer:Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jr5kAAAAASUVORK5CYII=","base64")};
    await page.locator("#initialFileInput").setInputFiles(image);
    await page.waitForFunction(()=>document.querySelectorAll("#universalResults input").length===6);
    assert.deepEqual(await page.locator("#universalResults input").evaluateAll(inputs=>inputs.map(i=>i.value)),["-","1","2","2","5","10"]);
    await page.locator("#answerKeyPhotoInput").setInputFiles(image);
    await page.waitForFunction(()=>document.querySelectorAll("#answerKeyPhotoResult tbody tr").length===3);
    assert.equal(await page.locator('select[data-key="1"]').inputValue(),"each-unordered");
    assert.equal(await page.locator('input[data-key="1"][data-field="each"]').inputValue(),"2");
    await page.screenshot({path:output+"/rules-review.png",fullPage:true});
    console.log("PHOTO_REVIEW_IMAGE "+(await page.screenshot({type:"jpeg",quality:60,fullPage:true})).toString("base64"));
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await page.locator("#photoAnswer4").fill("9");
    await page.locator("#photoAnswer4").dispatchEvent("change");
    await page.locator("#gradeButton").click();
    await page.waitForFunction(()=>window.__lastGrade?.inputMode==="photo");
    assert.equal(await page.evaluate(()=>window.__lastGrade.score),7);
    assert.equal(await page.evaluate(()=>window.__lastGrade.rows.filter(r=>r.earn>0&&r.earn<r.pts).length),1);
    await page.screenshot({path:output+"/partial-result.png",fullPage:true});
    await page.locator("#editFromResult").click();
    await page.locator('select[data-key="1"]').selectOption("unordered");
    await page.locator("#gradeButton").click();
    assert.equal(await page.evaluate(()=>window.__lastGrade.score),5);
    // 欄数不一致の手動修正は、古い正解のまま採点しない。
    await page.locator("#editFromResult").click();
    await page.locator('input[data-key="0"][data-field="answer"]').fill("12");
    await page.locator('input[data-key="0"][data-field="answer"]').dispatchEvent("change");
    assert.equal(await page.locator('input[data-key="0"][data-field="answer"]').evaluate(i=>i.checkValidity()),false);
    await page.locator("#gradeButton").click();
    assert.equal(await page.locator("#photoScreen").evaluate(el=>el.hidden),false);
    // 連結値の手動修正も同じ欄数で分解される。
    await page.locator('input[data-key="0"][data-field="answer"]').fill("-12");
    await page.locator('input[data-key="0"][data-field="answer"]').dispatchEvent("change");
    assert.equal(await page.locator('input[data-key="0"][data-field="answer"]').evaluate(i=>i.checkValidity()),true);
    await page.locator("#gradeButton").click();
    assert.equal(await page.evaluate(()=>window.__lastGrade.score),5);
    assert.equal(googleCalls.length,0);assert.deepEqual(errors,[]);
    const result={mobileFlow:"pass",collapsedSheet:"pass",collapsedKey:"pass",partialScore:7,
      allOrNothingScore:5,invalidKeyEdit:"blocked",apiCalls:googleCalls.length};
    fs.writeFileSync(output+"/browser-results.json",JSON.stringify(result,null,2));
    console.log("PHOTO_BROWSER_TEST "+JSON.stringify(result));
    const screenshot=await page.screenshot({type:"jpeg",quality:55,fullPage:true});
    console.log("PHOTO_UI_IMAGE "+screenshot.toString("base64"));
  }catch(error){
    await page.screenshot({path:output+"/failure.png",fullPage:true}).catch(()=>{});
    console.error(error);process.exitCode=1;
  }finally{await browser.close();}
})();
