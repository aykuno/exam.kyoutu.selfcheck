/* 実際の画像変換とAI応答処理のモバイル試験。Google SDKは試験用応答へ置換。 */
const {chromium}=require("playwright"),fs=require("fs"),assert=require("node:assert/strict");
(async()=>{
  const output="audit/photo-accuracy/output";fs.mkdirSync(output,{recursive:true});
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:430,height:932}});
  const errors=[],googleCalls=[],consoleErrors=[];
  page.on("console",message=>{if(message.type()==="error")consoleErrors.push(message.text());});
  page.on("pageerror",error=>errors.push(error.message));
  page.on("request",request=>{if(/firebasevertexai|firebaseappcheck/.test(request.url()))googleCalls.push(request.url());});
  await page.route("https://www.gstatic.com/firebasejs/**",async route=>{
    const file=new URL(route.request().url()).pathname.split("/").pop();
    const modules={
      "firebase-app.js":'export const initializeApp=()=>({});',
      "firebase-app-check.js":'export class ReCaptchaEnterpriseProvider{}; export const initializeAppCheck=()=>({});',
      "firebase-ai.js":'export const getAI=()=>({}); export const Schema=Object.fromEntries(["object","array","string","integer","boolean","enumString"].map(type=>[type,value=>({type,...value})])); export const getGenerativeModel=(ai,args)=>({generateContent:async parts=>{window.__requestParts.push(parts);window.__schema=args.generationConfig.responseSchema;return {response:{text:()=>JSON.stringify(window.__fixtureResponse)}};}});'
    };
    await route.fulfill({status:200,contentType:"text/javascript",headers:{"access-control-allow-origin":"*"},body:modules[file]||"export {};"});
  });
  await page.route(/https:\/\/(?:.*googleapis\.com|.*recaptcha\.net)/,route=>route.abort());
  try{
    await page.goto(process.env.PHOTO_VERIFY_URL || "http://127.0.0.1:8765/kyoutu-ui-lab/",{waitUntil:"domcontentloaded"});
    await page.waitForFunction(()=>window.PhotoAnswerFormat&&window.PhotoImagePreparation&&window.UILabPhotoFlow&&window.MarkReaderAI?.isConfigured());
    const fixture=await page.evaluate(()=>{
      window.__requestParts=[];
      const canvas=document.createElement("canvas");canvas.width=1600;canvas.height=3000;
      const ctx=canvas.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,1600,3000);
      ctx.fillStyle="#111";ctx.font="48px sans-serif";ctx.fillText("ENGLISH / OPTIONS 1 - 10",80,120);
      for(let row=0;row<10;row++){
        const y=300+row*240;ctx.fillStyle="#111";ctx.fillText(String(row+1),90,y+15);
        for(let index=0;index<10;index++){
          const x=260+index*125;ctx.beginPath();ctx.ellipse(x,y,38,44,0,0,Math.PI*2);
          if(row===index){ctx.fillStyle="#333";ctx.fill();}else{ctx.strokeStyle="#111";ctx.lineWidth=3;ctx.stroke();ctx.fillStyle="#777";ctx.font="32px sans-serif";ctx.fillText(String(index+1),x-18,y+12);}
        }
      }
      return canvas.toDataURL("image/png").split(",")[1];
    });
    await page.evaluate(()=>{
      document.getElementById("customCompareButton").click();
      window.UILabPhotoFlow.configure({mode:"registered",subject:"英語リーディング",signature:"accuracy-english-test",
        registeredKey:{maxScore:20,questions:Array.from({length:10},(_,i)=>({id:String(i+1),group:"第1問",answer:String(i+1),points:2}))}});
      window.__fixtureResponse={layouts:[{id:"E",options:Array.from({length:10},(_,i)=>String(i+1)),confidence:"high"}],
        answers:Array.from({length:10},(_,i)=>({code:"R"+(i+1)+"-1",label:String(i+1),group:"第1問",kind:"mark",layoutId:"E",markedIndices:[i],value:"0",confidence:"high"}))};
    });
    const image={name:"english-sheet.png",mimeType:"image/png",buffer:Buffer.from(fixture,"base64")};
    await page.locator("#initialFileInput").setInputFiles(image);
    await page.waitForFunction(()=>document.querySelectorAll("#universalResults input").length===10);
    assert.deepEqual(await page.locator("#universalResults input").evaluateAll(inputs=>inputs.map(i=>i.value)),Array.from({length:10},(_,i)=>String(i+1)));
    const first=await page.evaluate(()=>{
      const parts=window.__requestParts[0],images=parts.filter(p=>p.inlineData),text=parts.filter(p=>p.text).map(p=>p.text).join("\n");
      return {requests:window.__requestParts.length,images:images.length,bytes:images.reduce((n,p)=>n+p.inlineData.data.length,0),
        profile:text.includes("左端が1"),detailLabels:text.includes("同じ写真の上部拡大")&&text.includes("同じ写真の下部拡大"),
        groupedColumns:window.__schema.properties.layouts.type==="array"};
    });
    assert.equal(first.requests,1);assert.equal(first.images,3);assert.equal(first.profile,true);
    assert.equal(first.detailLabels,true);assert.equal(first.groupedColumns,true);assert.ok(first.bytes<=16*1024*1024);
    await page.locator("#photoAnswer1").fill("9");await page.locator("#photoAnswer1").dispatchEvent("change");
    await page.locator("#reviewRetryButton").click();
    await page.waitForFunction(()=>window.__requestParts.length===2&&!document.getElementById("reviewRetryButton").disabled);
    assert.equal(await page.locator("#photoAnswer1").inputValue(),"9");
    assert.equal(await page.locator("#initialFileInput").inputValue(),"");
    await page.screenshot({path:output+"/english-review.png",fullPage:true});
    console.log("PHOTO_ACCURACY_IMAGE "+(await page.screenshot({type:"jpeg",quality:50,fullPage:true})).toString("base64"));
    // 真のGoogle呼出しなしで、数学の−・0・1と二重マークの全処理を確認。
    await page.evaluate(()=>{
      window.UILabPhotoFlow.configure({mode:"registered",subject:"数学Ⅰ・A",signature:"accuracy-math-test",
        registeredKey:{maxScore:8,questions:[{id:"ア・イ・ウ・エ",group:"第1問",answers:["-","0","1","2"],points:8}]}});
      window.__fixtureResponse={layouts:[{id:"M",options:["-","0","1","2","3","4","5","6","7","8","9"],confidence:"high"}],
        answers:["ア","イ","ウ","エ"].map((label,i)=>({code:"R1-"+(i+1),label,group:"第1問",kind:"mark",layoutId:"M",
          markedIndices:i===3?[3,4]:[i],value:i===3?"unknown":"9",confidence:i===3?"low":"high"}))};
    });
    await page.locator("#initialFileInput").setInputFiles(image);
    await page.waitForFunction(()=>document.querySelectorAll("#universalResults input").length===4);
    assert.deepEqual(await page.locator("#universalResults input").evaluateAll(inputs=>inputs.map(i=>i.value)),["-","0","1",""]);
    assert.equal(await page.locator("#photoAnswer3").evaluate(i=>i.parentElement.classList.contains("warn")),true);
    assert.equal(await page.evaluate(()=>window.__requestParts[2].some(p=>p.text?.includes("2列目は0"))),true);
    // 正解写真には大問名を含む欄一覧を送り、同じ欄名を混同しない。
    await page.evaluate(()=>{window.__fixtureResponse={examLabel:"試験",maxScore:2,selectionRules:[],
      answers:[{codes:["a"],answers:["1"],group:"第1問",points:2,unordered:false,confidence:"high"}]};});
    await page.evaluate(async()=>{
      await window.MarkReaderAI.analyzeAnswerKey({subjectLabel:"数学",entries:[
        {code:"a",label:"ア",group:"第1問"},{code:"b",label:"ア",group:"第2問"}],
        images:[{data:"AA==",mimeType:"image/jpeg"}]});
    });
    assert.equal(await page.evaluate(()=>window.__requestParts[3].some(p=>p.text?.includes("a: 第1問 / ア")&&p.text?.includes("b: 第2問 / ア"))),true);
    // 画像変換そのものを実行し、細部・透明背景・8枚の上限を確認。
    const prepared=await page.evaluate(async()=>{
      const decoded=Uint8Array.from(atob(window.__requestParts[0].find(p=>p.inlineData).inlineData.data),c=>c.charCodeAt(0));
      const file=new File([decoded],"test.jpg",{type:"image/jpeg"});
      const images=await window.PhotoImagePreparation.prepare([file]);
      const b=await createImageBitmap(new Blob([Uint8Array.from(atob(images[0].data),c=>c.charCodeAt(0))],{type:"image/jpeg"}));
      const result={count:images.length,width:b.width,height:b.height};
      b.close();
      const tiny=new File([Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jr5kAAAAASUVORK5CYII="),c=>c.charCodeAt(0))],"tiny.png",{type:"image/png"});
      const small=await window.PhotoImagePreparation.prepare([tiny]);
      result.small={count:small.length,width:small[0].width,height:small[0].height};
      const eight=await window.PhotoImagePreparation.prepare(Array(8).fill(file));
      result.eight={count:eight.length,bytes:eight.reduce((n,img)=>n+img.data.length,0)};
      return result;
    });
    assert.deepEqual(prepared.small,{count:1,width:1,height:1});
    assert.equal(prepared.count,3);assert.equal(prepared.width,1600);assert.equal(prepared.height,3000);
    assert.equal(prepared.eight.count,24);assert.ok(prepared.eight.bytes<=16*1024*1024);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    assert.equal(googleCalls.length,0);assert.deepEqual(errors,[]);
    const result={mobile:"pass",mathColumns:"pass",englishColumns:"pass",doubleMarks:"review",
      imageViews:first.images,oneRequestPerRead:true,manualRetry:"preserved",imageBudget:"pass",eightPhotos:"pass",
      correctKeyGroupMetadata:"pass",googleCalls:googleCalls.length};
    fs.writeFileSync(output+"/results.json",JSON.stringify(result,null,2));
    console.log("PHOTO_ACCURACY_BROWSER "+JSON.stringify(result));
  }catch(error){await page.screenshot({path:output+"/failure.png",fullPage:true}).catch(()=>{});console.error(error);console.error("PHOTO_FAILURE_CONTEXT "+JSON.stringify(await page.evaluate(()=>({error:document.getElementById("errorText")?.textContent,requests:window.__requestParts?.length,parts:window.__requestParts?.map(parts=>parts.filter(p=>p.text).map(p=>p.text.slice(0,150))),context:window.UILabPhotoFlow?.getContext()}))));console.error("PHOTO_CONSOLE_ERRORS "+JSON.stringify(consoleErrors));process.exitCode=1;}
  finally{await browser.close();}
})();
