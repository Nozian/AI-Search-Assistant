(() => {
  'use strict';
  const $=id=>document.getElementById(id),P=window.NZ_PRISM_PROMPTS;
  let active='search';
  function switchView(view) {
    active=view==='prism'?'prism':'search';
    $('mode-unified').hidden=active!=='search';$('mode-prism').hidden=active!=='prism';
    document.querySelectorAll('.nz-mode-tabs button').forEach(b=>{const on=b.dataset.mode===active;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));});
    chrome.storage.local.set({nzPopupMode:active});
  }
  document.querySelectorAll('.nz-mode-tabs button').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.mode)));
  chrome.storage.local.get(['nzPopupMode','nzPrismEnabled','nzPrismHover']).then(x=>{
    switchView(x.nzPopupMode==='prism'?'prism':'search');
    $('prismEnabled').checked=x.nzPrismEnabled!==false;
    $('prismHover').checked=x.nzPrismHover!==false;
  });
  $('prismEnabled').addEventListener('change',()=>chrome.storage.local.set({nzPrismEnabled:$('prismEnabled').checked}));
  $('prismHover').addEventListener('change',()=>chrome.storage.local.set({nzPrismHover:$('prismHover').checked}));
  async function getCurrentPage(){
    const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
    if(!tab?.id || !/^https?:/.test(tab.url||''))throw new Error('このページでは本文を読み取れません。ニュース記事のタブで実行してください。');
    const x=await chrome.scripting.executeScript({target:{tabId:tab.id},func:()=>{
      const sels=['article','.article-body','.article_body','.entry-content','[data-testid="article-body"]','main','[role="main"]'];
      let raw='';
      for(const s of sels){const e=document.querySelector(s);const val=e?.innerText?.trim();if(val?.length>120){raw=val;break;}}
      if(!raw)raw=document.body.innerText||'';
      return {title:document.title,url:location.href,text:raw.replace(/\n{3,}/g,'\n\n').slice(0,2800)};
    }});
    return x?.[0]?.result || {title:tab.title||'',url:tab.url||'',text:''};
  }
  let busy=false;
  $('prismActions').addEventListener('click',async e=>{
    const button=e.target.closest('[data-analyze]');if(!button||busy)return;
    const type=button.dataset.analyze;busy=true;button.disabled=true;$('prismStatus').textContent='ページ情報を確認中…';
    try {
      const page=await getCurrentPage();
      if(type==='deep'){
        const q=P.searchQuery('deep',page);await chrome.tabs.create({url:'https://www.google.com/search?q='+encodeURIComponent(q)});
        $('prismStatus').textContent='Googleで背景情報を検索しました。';return;
      }
      const prompt=P.prompt(type,page);
      const provider=$('prismProvider').value;
      const response=await chrome.runtime.sendMessage({type:'NZ_PRISM_OPEN_PREFILLED',provider,prompt});
      if(!response?.ok)throw Error(response?.error||'AIを開けませんでした');
      $('prismStatus').textContent=`${P.SERVICES[provider]?.label||'AI'}を開き、分析文の自動入力を試みています。自動送信はしません。`;
    }catch(err){$('prismStatus').textContent='実行できませんでした：'+(err?.message||err);}
    finally {busy=false;button.disabled=false;}
  });
})();
