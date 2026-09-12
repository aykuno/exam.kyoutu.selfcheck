/* v181 Safari PDF delivery wrapper + result UX fixes
 * Keeps the accepted PDF renderer/layout in pdf-export-v180-legacy.js.
 * Safari: lower raster memory footprint, pure data-URI delivery, manual <a download> flow.
 * Also adds "他の科目を採点する" and disables double-tap zoom on answer key buttons.
 */
(function(){
  'use strict';

  const VERSION = 'v181-safari-stable-datauri-result-nav-nozoom';

  function isSafari(){
    const ua = navigator.userAgent || '';
    const vendor = navigator.vendor || '';
    const safari = /Safari\//.test(ua) && /Apple/i.test(vendor || 'Apple');
    const other = /(CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|Instagram|FBAN|FBAV|Line|Chrome|Chromium|Firefox|Edg\/|OPR\/)/i.test(ua);
    return safari && !other;
  }

  function installNoZoomStyles(){
    if(document.getElementById('__ctNoFastTapZoomStyle')) return;
    const style = document.createElement('style');
    style.id = '__ctNoFastTapZoomStyle';
    style.textContent = [
      '#numberKeys button,#letterKeys button,.number-keys button,.letter-keys button{',
      'touch-action:manipulation!important;',
      '-webkit-user-select:none!important;',
      'user-select:none!important;',
      '-webkit-tap-highlight-color:transparent!important;',
      '}',
      '#gradeAnotherSubject{touch-action:manipulation!important;}'
    ].join('');
    document.head.appendChild(style);
  }

  function goHome(){
    const home = document.getElementById('brandHome');
    if(home){
      home.click();
      requestAnimationFrame(function(){ window.scrollTo({top:0,left:0,behavior:'auto'}); });
      return;
    }
    const homeScreen = document.getElementById('homeScreen');
    document.querySelectorAll('.screen').forEach(function(el){ el.hidden = el !== homeScreen; });
    document.querySelectorAll('.steps .step').forEach(function(el, i){ el.classList.toggle('active', i===0); });
    window.scrollTo(0,0);
  }

  function ensureOtherSubjectButton(){
    const result = document.getElementById('result');
    if(!result || !result.children.length || document.getElementById('gradeAnotherSubject')) return;
    const wrap = document.createElement('div');
    wrap.id = '__gradeAnotherSubjectWrap';
    wrap.style.cssText = 'display:flex;justify-content:center;padding:22px 0 10px;';
    const btn = document.createElement('button');
    btn.id = 'gradeAnotherSubject';
    btn.type = 'button';
    btn.className = 'secondary-action-button';
    btn.textContent = '他の科目を採点する';
    btn.style.cssText = 'min-width:min(100%,320px);padding:13px 22px;border-radius:12px;font-weight:900;font-size:15px;cursor:pointer;';
    btn.addEventListener('click', goHome);
    wrap.appendChild(btn);
    result.appendChild(wrap);
  }

  installNoZoomStyles();
  ensureOtherSubjectButton();
  const observer = new MutationObserver(function(){ ensureOtherSubjectButton(); });
  observer.observe(document.documentElement, {subtree:true, childList:true});

  const script = document.currentScript;
  const legacyUrl = new URL('pdf-export-v180-legacy.js?v=20260912-v181', script && script.src ? script.src : document.baseURI).href;

  fetch(legacyUrl, {cache:'no-store'})
    .then(function(r){
      if(!r.ok) throw new Error('PDFレンダラーを読み込めませんでした: ' + r.status);
      return r.text();
    })
    .then(function(source){
      if(isSafari()){
        // The v180 renderer already uses Canvas -> JPEG -> handwritten PDF bytes -> data URI.
        // Safari failures were mainly caused by the very large 350dpi multi-page payload.
        // Keep the exact page design while reducing only Safari raster memory / URI size.
        source = source.replace('const RENDER_SCALE = 2.33; // 約350dpi相当（Android/iPhone共通）', 'const RENDER_SCALE = 1.55; // Safari安定化: 約230dpi相当');
        source = source.replace('const JPEG_QUALITY = 0.93;', 'const JPEG_QUALITY = 0.86;');
      }
      source += '\n//# sourceURL=pdf-export-v180-legacy.js';
      (0,eval)(source);
      console.info('PDF wrapper loaded: ' + VERSION + (isSafari() ? ' / Safari compact data URI' : ' / standard renderer'));
    })
    .catch(function(err){
      console.error(err);
      window.exportResultPdf = function(){
        alert('PDF出力機能の読み込みに失敗しました。ページを再読み込みしてください。\n' + (err && err.message ? err.message : err));
      };
    });
})();
