const {chromium}=require('playwright');
const fs=require('fs');
const path=require('path');
(async()=>{
  const output='audit/photo-live/output';
  const fixtures=JSON.parse(fs.readFileSync(path.join(output,'fixtures.json'),'utf8'));
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:430,height:932}});
  const page=await context.newPage();
  const diagnostics={console:[],requests:[]};
  page.on('console',msg=>{
    if(['error','warning'].includes(msg.type())) diagnostics.console.push({type:msg.type(),text:msg.text()});
  });
  page.on('pageerror',error=>diagnostics.console.push({type:'pageerror',text:error.message}));
  page.on('response',response=>{
    const url=response.url();
    if(/firebaseappcheck|firebasevertexai|firebaseml|aiplatform|generativelanguage/.test(url)) {
      diagnostics.requests.push({host:new URL(url).host,path:new URL(url).pathname,status:response.status()});
    }
  });
  const results=[];
  try {
    await page.goto('https://aykuno.github.io/exam.kyoutu.selfcheck/?live-photo-audit=20261004',{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForFunction(()=>window.MarkReaderAI?.isConfigured() && window.UILabPhotoFlow && document.getElementById('galleryFileInput'),null,{timeout:60000});
    for(const fixture of fixtures) {
      const q=fixture.labels.map((label,index)=>({
        id:label,group:'第1問',answer:fixture.values[index]==='−'?'-':fixture.values[index],points:1
      }));
      await page.evaluate(({fixture,q})=>{
        window.UILabPhotoFlow.configure({
          mode:'registered',signature:'live-audit-'+fixture.name,subject:fixture.subject,
          registeredKey:{questions:q}
        });
        for(const id of ['homeScreen','methodScreen','entryScreen','resultScreen']) document.getElementById(id).hidden=true;
        document.getElementById('photoScreen').hidden=false;
        const original=window.MarkReaderAI.analyzeAnswerSheet;
        window.__auditRead=null;
        window.MarkReaderAI=Object.freeze({...window.MarkReaderAI,analyzeAnswerSheet:async args=>{
          const result=await original(args);
          window.__auditRead=result;
          return result;
        }});
      },{fixture,q});
      await page.locator('#initialFileInput').setInputFiles(fixture.path);
      await page.waitForFunction(()=>{
        const visible=id=>!document.getElementById(id).classList.contains('hidden');
        return visible('resultCard') || visible('errorCard');
      },null,{timeout:180000});
      const result=await page.evaluate(()=>{
        const error=!document.getElementById('errorCard').classList.contains('hidden');
        return {error:error?document.getElementById('errorText').textContent:null,
          summary:document.getElementById('summary').textContent,read:window.__auditRead,
          fields:[...document.querySelectorAll('#universalResults input')].map(input=>input.value)};
      });
      result.name=fixture.name;
      result.expected=fixture.values.map(value=>value==='−'?'-':value);
      result.correct=result.fields.filter((value,index)=>value===result.expected[index]).length;
      result.total=result.expected.length;
      results.push(result);
      console.log('LIVE_PHOTO_RESULT '+JSON.stringify(result));
      await page.screenshot({path:path.join(output,fixture.name+'-screen.png'),fullPage:true});
      // A blocked App Check or provider request affects all formats; don't repeat invalid requests.
      if(result.error)break;
    }
  } catch(error) {
    results.push({error:error.message});
    await page.screenshot({path:path.join(output,'failure-screen.png'),fullPage:true}).catch(()=>{});
  } finally {
    fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({results,diagnostics},null,2));
    console.log('LIVE_PHOTO_DIAGNOSTICS '+JSON.stringify(diagnostics));
    await browser.close();
  }
  if(results.length!==fixtures.length || results.some(result=>result.error || result.correct!==result.total))process.exitCode=1;
})();
