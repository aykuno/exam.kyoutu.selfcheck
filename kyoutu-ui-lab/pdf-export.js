/* v182 Safari PDF delivery wrapper + result UX fixes */
(function(){
  'use strict';

  const VERSION = 'v182-safari-native-share';

  function isSafari(){
    const ua = navigator.userAgent || '';
    const vendor = navigator.vendor || '';
    const safari = /Safari\//.test(ua) && /Apple/i.test(vendor || 'Apple');
    const other = /(CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|Instagram|FBAN|FBAV|Line|Chrome|Chromium|Firefox|Edg\/|OPR\/)/i.test(ua);
    return safari && !other;
  }

  function dataUriToPdfFile(uri, filename){
    const comma = String(uri || '').indexOf(',');
    if(comma < 0) return null;
    const bin = atob(uri.slice(comma + 1));
    const bytes = new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) bytes[i] = bin.charCodeAt(i) & 0xff;
    return new File([bytes], filename || '採点結果.pdf', {type:'application/pdf'});
  }

  function upgradeSafariPdfModal(){
    if(!isSafari()) return;
    const modal = document.getElementById('pdf-dl-modal');
    if(!modal || modal.dataset.nativeShareReady === '1') return;
    const link = modal.querySelector('a[download]');
    if(!link || !/^data:application\/pdf;base64,/i.test(link.href || '')) return;

    let file = null;
    try{ file = dataUriToPdfFile(link.href, link.download || '採点結果.pdf'); }catch(e){ return; }
    let canShare = false;
    try{ canShare = !!(file && navigator.share && navigator.canShare && navigator.canShare({files:[file]})); }catch(e){}
    if(!canShare) return;

    modal.dataset.nativeShareReady = '1';
    const guide = link.previousElementSibling;
    if(guide){ guide.innerHTML = '<b>Safari</b>：下の「PDFを保存」を押し、共有メニューから「ファイルに保存」を選んでください。'; }

    const fallback = link.cloneNode(true);
    fallback.textContent = 'うまくいかない場合：このリンクを長押し';
    fallback.style.cssText = 'display:none;color:#2563eb;font-size:12px;font-weight:700;text-decoration:underline;margin:0 0 12px;word-break:break-all;';

    const status = document.createElement('div');
    status.style.cssText = 'display:none;color:#b42318;font-size:12px;line-height:1.5;margin:0 0 10px;';

    link.textContent = 'PDFを保存';
    link.setAttribute('role','button');
    link.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      navigator.share({files:[file]}).catch(function(err){
        if(err && err.name === 'AbortError') return;
        status.textContent = '共有メニューを開けませんでした。下のリンクを長押しして「リンクをダウンロード」を選んでください。';
        status.style.display = 'block';
        fallback.style.display = 'block';
      });
    });
    link.insertAdjacentElement('afterend', status);
    status.insertAdjacentElement('afterend', fallback);
  }

  function installNoZoomStyles(){
    if(document.getElementById('__ctNoFastTapZoomStyle')) return;
    const style = document.createElement('style');
    style.id = '__ctNoFastTapZoomStyle';
    style.textContent = '#numberKeys button,#letterKeys button,.number-keys button,.letter-keys button{touch-action:manipulation!important;-webkit-user-select:none!important;user-select:none!important;-webkit-tap-highlight-color:transparent!important}#gradeAnotherSubject{touch-action:manipulation!important}';
    document.head.appendChild(style);
  }

  function goHome(){
    const home = document.getElementById('brandHome');
    if(home){ home.click(); requestAnimationFrame(function(){ window.scrollTo(0,0); }); return; }
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
  upgradeSafariPdfModal();
  const observer = new MutationObserver(function(){ ensureOtherSubjectButton(); upgradeSafariPdfModal(); });
  observer.observe(document.documentElement, {subtree:true, childList:true});

  const script = document.currentScript;
  const legacyUrl = new URL('pdf-export-v180-legacy.js?v=20260912-v182', script && script.src ? script.src : document.baseURI).href;

  fetch(legacyUrl, {cache:'no-store'})
    .then(function(r){
      if(!r.ok) throw new Error('PDFレンダラーを読み込めませんでした: ' + r.status);
      return r.text();
    })
    .then(function(source){
      if(isSafari()){
        source = source.replace('const RENDER_SCALE = 2.33; // 約350dpi相当（Android/iPhone共通）', 'const RENDER_SCALE = 1.55; // Safari安定化: 約230dpi相当');
        source = source.replace('const JPEG_QUALITY = 0.93;', 'const JPEG_QUALITY = 0.86;');
      }
      source += '\n//# sourceURL=pdf-export-v180-legacy.js';
      (0,eval)(source);
      console.info('PDF wrapper loaded: ' + VERSION);
    })
    .catch(function(err){
      console.error(err);
      window.exportResultPdf = function(){ alert('PDF出力機能の読み込みに失敗しました。ページを再読み込みしてください。\n' + (err && err.message ? err.message : err)); };
    });
})();
