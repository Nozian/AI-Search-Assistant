// Merge of original AI-Search-Assistant right-click + input-assist with integrated toolkit.
// Restrict cross-origin injection to explicit AI sites; do not auto-send messages.
const MENUS=[
 {id:'saveToPerplexity',title:'Perplexityに送る',base:'https://www.perplexity.ai/search?q='},
 {id:'nz-goog',title:'選択文字をGoogleで検索',base:'https://www.google.com/search?q='},
 {id:'nz-duck',title:'選択文字をDuckDuckGoで検索',base:'https://duckduckgo.com/?q='}
];
chrome.runtime.onInstalled.addListener(async()=>{
 await chrome.contextMenus.removeAll();for(const m of MENUS)chrome.contextMenus.create({id:m.id,title:m.title,contexts:['selection']});
});
chrome.contextMenus.onClicked.addListener(info=>{
 const m=MENUS.find(x=>x.id===info.menuItemId);if(m&&info.selectionText?.trim())chrome.tabs.create({url:m.base+encodeURIComponent(info.selectionText.trim())});
});
// Content scripts remain on sites; input assistant only operates in new user-initiated tabs.
function injectPrompt(text,site){
 let el=site==='gemini'?document.querySelector('.input-area rich-textarea > div[contenteditable="true"],rich-textarea [contenteditable="true"],div[contenteditable="true"][role="textbox"]'):
   document.querySelector('div[contenteditable="true"][role="textbox"],div[contenteditable="true"]');
 if(!el)return false;
 el.focus();el.textContent=text;
 el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:text}));return true;
}
chrome.runtime.onMessage.addListener((request,_sender,sendResponse)=>{
 if(request?.type==='NZ_OPEN_BATCH'&&Array.isArray(request.urls)){
  const urls=request.urls.filter(url=>typeof url==='string'&&/^https:\/\//.test(url)).slice(0,10);
  Promise.all(urls.map(url=>chrome.tabs.create({url,active:false}))).then(tabs=>sendResponse({ok:true,count:tabs.length})).catch(e=>sendResponse({ok:false,error:e.message}));return true;
 }
 if(request?.action==='searchWithInjection'){
  const site=request.targetSite;
  const url=site==='claude'?'https://claude.ai/new':site==='gemini'?'https://gemini.google.com/app':null;
  if(!url||typeof request.query!=='string'||request.query.length>20000){sendResponse({ok:false,error:'検索先またはテキストが不正です'});return false}
  chrome.tabs.create({url,active:true}).then(tab=>{
   let done=false;
   const finish=async(tabId,info)=>{
    if(done||tabId!==tab.id||info.status!=='complete')return;
    done=true;chrome.tabs.onUpdated.removeListener(finish);
    try{await chrome.scripting.executeScript({target:{tabId:tab.id},func:injectPrompt,args:[request.query,site]})}catch(e){console.debug('Input helper unavailable:',e.message)}
   };
   chrome.tabs.onUpdated.addListener(finish);
   // Prompt remains in originating popup text even if site changes DOM.
   sendResponse({ok:true,tabId:tab.id});
  }).catch(e=>sendResponse({ok:false,error:e.message}));return true;
 }
});

// Media Bias PRISM: place the analysis draft *into* the AI composer.
// Never hit Submit/Send; the user reviews the filled text and sends manually.
const NZ_PRISM_DESTINATIONS={
  chatgpt:'https://chatgpt.com/',
  perplexity:'https://www.perplexity.ai/',
  grok:'https://grok.com/',
  gemini:'https://gemini.google.com/app',
  claude:'https://claude.ai/new'
};
function nzPrismInjectDraft(prompt,provider) {
  const wanted={
    chatgpt:['#prompt-textarea','[data-testid="composer-input"]','[contenteditable="true"][role="textbox"]','[contenteditable="true"][data-placeholder]'],
    perplexity:['[contenteditable="true"][role="textbox"]','textarea[placeholder]','[contenteditable="true"]'],
    grok:['[contenteditable="true"][role="textbox"]','[contenteditable="true"][data-placeholder]','textarea[placeholder]'],
    gemini:['rich-textarea [contenteditable="true"]','.input-area [contenteditable="true"]','[contenteditable="true"][role="textbox"]'],
    claude:['[contenteditable="true"][data-testid]','.ProseMirror[contenteditable="true"]','[contenteditable="true"][role="textbox"]','[contenteditable="true"]']
  };
  const selectors=wanted[provider]||[];let attempts=0,completed=false;
  const report=(message,failure=false)=>{
    const id='nz-prism-input-report';let node=document.getElementById(id);
    if(!node){node=document.createElement('aside');node.id=id;
      Object.assign(node.style,{position:'fixed',bottom:'16px',right:'16px',zIndex:'2147483647',background:'#17314c',color:'#fff',padding:'10px 14px',borderRadius:'8px',font:'13px system-ui,sans-serif',maxWidth:'370px',boxShadow:'0 3px 15px #0008'});
      document.body.append(node);
    }
    node.replaceChildren();const label=document.createElement('span');label.textContent=message;node.append(label);
    if(failure){const retry=document.createElement('button');retry.type='button';retry.textContent='再入力';retry.style.marginLeft='8px';retry.addEventListener('click',()=>{attempts=0;tryOnce()});node.append(retry);
      const copy=document.createElement('button');copy.type='button';copy.textContent='コピー';copy.style.marginLeft='8px';copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(prompt);label.textContent='文章をコピーしました。'}catch{label.textContent='コピーできませんでした。'}});node.append(copy);
    } else setTimeout(()=>node.remove(),4800);
  };
  function tryOnce(){
    if(completed)return true;
    attempts++;
    for(const selector of selectors){
      const el=document.querySelector(selector);
      if(!el||!el.isConnected||el.getAttribute('aria-disabled')==='true')continue;
      if(el.offsetParent===null && getComputedStyle(el).position!=='fixed')continue;
      try{
        el.focus();
        if(el.matches('textarea,input')){
          const proto=el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
          Object.getOwnPropertyDescriptor(proto,'value').set.call(el,prompt);
          el.dispatchEvent(new Event('input',{bubbles:true}));
          el.dispatchEvent(new Event('change',{bubbles:true}));
        }else{
          const range=document.createRange();range.selectNodeContents(el);const sel=window.getSelection();sel.removeAllRanges();sel.addRange(range);
          const used=document.execCommand('insertText',false,prompt);
          if(!used || !(el.innerText||el.textContent||'').includes(prompt.slice(0,Math.min(35,prompt.length)))){
            el.textContent=prompt;
            el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:prompt}));
          }
        }
        if((el.value||el.innerText||el.textContent||'').includes(prompt.slice(0,Math.min(35,prompt.length)))){
          completed=true;report('PRISMの分析文を入力しました。確認してから送信してね。');return true;
        }
      }catch(e){/* another editor might be mounted later */}
    }
    return false;
  }
  if(tryOnce())return true;
  const interval=setInterval(()=>{
    if(tryOnce() || attempts>=45){clearInterval(interval);if(!completed)report('自動入力できませんでした。ログインや入力欄の状態を確認してください。',true);}
  },450);
  return true;
}
// Session-scoped pending drafts survive MV3 service-worker suspension.
// The top-level tab event is registered persistently, not only after a click.
const nzPrismRunning=new Set();
async function nzPrismTryTab(tabId){
  if(nzPrismRunning.has(tabId))return;
  const key='nzPrismDraft_'+tabId;
  const stored=await chrome.storage.session.get(key);
  const job=stored[key];if(!job)return;
  if(Date.now()-job.created>10*60*1000){await chrome.storage.session.remove(key);return;}
  const destination=NZ_PRISM_DESTINATIONS[job.provider];if(!destination){await chrome.storage.session.remove(key);return;}
  let tab;try{tab=await chrome.tabs.get(tabId)}catch{await chrome.storage.session.remove(key);return;}
  if(tab.status!=='complete'||!tab.url?.startsWith(destination.slice(0,destination.indexOf('/',8)+1)))return;
  nzPrismRunning.add(tabId);
  try{
    await chrome.scripting.executeScript({target:{tabId},func:nzPrismInjectDraft,args:[job.prompt,job.provider]});
    await chrome.storage.session.remove(key);
  }catch(err){console.debug('PRISM editor not ready:',String(err));}
  finally{nzPrismRunning.delete(tabId)}
}
chrome.tabs.onUpdated.addListener((tabId,changeInfo)=>{
  if(changeInfo.status==='complete')nzPrismTryTab(tabId).catch(console.warn);
});
chrome.tabs.onRemoved.addListener(tabId=>chrome.storage.session.remove('nzPrismDraft_'+tabId).catch(()=>{}));
chrome.runtime.onMessage.addListener((request,_sender,sendResponse)=>{
  if(request?.type!=='NZ_PRISM_OPEN_PREFILLED')return;
  const {provider,prompt}=request;
  const url=NZ_PRISM_DESTINATIONS[provider];
  if(!url||typeof prompt!=='string'||!prompt.trim()||prompt.length>12000){sendResponse({ok:false,error:'AIの選択または分析文が不正です'});return false;}
  (async()=>{
    const tab=await chrome.tabs.create({url,active:true});
    await chrome.storage.session.set({['nzPrismDraft_'+tab.id]:{prompt,provider,created:Date.now()}});
    // Catches a fast initial page load which finished before session storage was written.
    nzPrismTryTab(tab.id).catch(console.warn);
    return {ok:true,tabId:tab.id};
  })().then(sendResponse).catch(err=>sendResponse({ok:false,error:String(err?.message||err)}));
  return true;
});
