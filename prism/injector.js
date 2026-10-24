/* Search Toolkit × Media Bias Prism. Article hover tools + news-page floating bar. */
(() => {
  'use strict';
  if(window.__nzPrismInjected)return;window.__nzPrismInjected=true;
  const P=window.NZ_PRISM_PROMPTS;
  const hostname=location.hostname;
  const isX=/^(x\.com|twitter\.com)$/.test(hostname);
  const isGoogle=/^www\.google\.(com|co\.jp)$/.test(hostname);
  const isGoogleNews=hostname==='news.google.com';
  const isYahooNews=hostname==='news.yahoo.co.jp';
  const isPreview=isX||isGoogle||isGoogleNews||isYahooNews;
  const labels=[['summary','要約'],['bias','バイアス分析'],['fact','ファクトチェック'],['deep','深掘り検索']];
  let enabled=true,hoverEnabled=true;
  const safeUrl=value=>{try{const x=new URL(value,location.href);return /^https?:$/.test(x.protocol)?x.href:''}catch{return ''}};
  const text=value=>String(value||'').replace(/\s+/g,' ').trim().slice(0,2000);
  function getRecord(card){
    if(isX){const articleText=card.querySelector('[data-testid="tweetText"]')?.innerText||'';
      const link=[...card.querySelectorAll('a[href*="/status/"]')].find(a=>/\/status\/\d+/.test(a.getAttribute('href')||''));
      const handle=card.querySelector('[data-testid="User-Name"]')?.innerText||'Xの投稿';
      return {title:handle,url:safeUrl(link?.href||location.href),text:articleText};}
    const h=card.querySelector('h3,h2,[role="heading"]');
    const a=h?.closest('a[href]')||h?.querySelector('a[href]')||card.querySelector('a[href]');
    const title=text(h?.innerText||a?.innerText||a?.getAttribute('aria-label')||'');
    return {title,url:safeUrl(a?.href||location.href),text:text(card.innerText).slice(0,1800)};
  }
  function openSearch(q){window.open('https://www.google.com/search?q='+encodeURIComponent(q),'_blank','noopener,noreferrer');}
  async function openAnalysis(kind,record,provider){
    if(kind==='deep'){openSearch(P.searchQuery(kind,record));return;}
    const prompt=P.prompt(kind,record);
    try{
      const reply=await chrome.runtime.sendMessage({type:'NZ_PRISM_OPEN_PREFILLED',provider,prompt});
      if(!reply?.ok)throw Error(reply?.error||'AIを開けませんでした');
      notify('AIの入力欄に分析文を自動入力します。内容を確認して送信してください。');
    }catch(err){
      // Fall back to clipboard so the evidence is not lost if site input changes.
      try{await navigator.clipboard.writeText(prompt);notify('自動入力できませんでした。分析文をコピーしました：'+(err?.message||err));}
      catch{notify('AIへの自動入力に失敗しました：'+(err?.message||err));}
    }
  }
  function notify(s){let n=document.querySelector('#nz-prism-toast');if(!n){n=document.createElement('div');n.id='nz-prism-toast';document.body.append(n);}n.textContent=s;n.hidden=false;clearTimeout(n._tid);n._tid=setTimeout(()=>n.hidden=true,4200);}
  function makeBar(record,standalone=false){
    const el=document.createElement('div');el.className='nz-prism-bar'+(standalone?' nz-prism-floating':'');el.setAttribute('lang','ja');
    const name=document.createElement('strong');name.textContent='PRISM';el.append(name);
    for(const [kind,label] of labels){
      const slot=document.createElement('div');slot.className='nz-prism-action';
      const button=document.createElement('button');button.type='button';button.textContent=label;button.title=label;slot.append(button);
      const menu=document.createElement('div');menu.className='nz-prism-menu';
      if(kind==='deep'){
        const a=document.createElement('button');a.textContent='Googleで深掘り';a.addEventListener('click',e=>{e.stopPropagation();openSearch(P.searchQuery(kind,record));});menu.append(a);
        const b=document.createElement('button');b.textContent='Perplexityで深掘り';b.addEventListener('click',e=>{e.stopPropagation();window.open('https://www.perplexity.ai/search?q='+encodeURIComponent(P.searchQuery(kind,record)),'_blank','noopener,noreferrer');});menu.append(b);
      }else{
        for(const provider of ['chatgpt','perplexity','grok']){
          const b=document.createElement('button');b.type='button';b.textContent=P.SERVICES[provider].label;
          b.addEventListener('click',e=>{e.stopPropagation();openAnalysis(kind,record,provider);});menu.append(b);
        }
      }
      button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();menu.classList.toggle('nz-prism-open');});
      slot.append(menu);el.append(slot);
    }
    return el;
  }
  function decorateCard(card){
    if(!card||card.dataset.nzPrismSeen ||card.closest('.nz-prism-bar,#gso-wrapper,#nz-search-panel'))return;
    const record=getRecord(card);if(!record.title||(!isX&&record.title.length<2))return;
    card.dataset.nzPrismSeen='1';
    const el=makeBar(record);el.classList.add('nz-prism-card-bar');
    card.appendChild(el);
  }
  function scan(){
    if(!enabled||!hoverEnabled||!isPreview)return;
    const selectors=isX?'article[data-testid="tweet"]':isGoogle?'#search .MjjYud:has(h3),#search .g:has(h3)':isGoogleNews?'article:has(h3),article:has(h2)':'article:has(h2),article:has(h3),li:has(h3)';
    for(const card of [...document.querySelectorAll(selectors)].slice(0,220))decorateCard(card);
  }
  function isArticleSite(){return !isPreview&&/\b(nhk\.or\.jp|asahi\.com|mainichi\.jp|yomiuri\.co\.jp|nikkei\.com|sankei\.com|jiji\.com|reuters\.com|bbc\.com|huffingtonpost\.jp|tokyo-np\.co\.jp|47news\.jp|newsweekjapan\.jp|forbesjapan\.com|bunshun\.jp|president\.jp)$/.test(hostname);}
  function makeFloating(){if(!enabled||!isArticleSite()||document.querySelector('.nz-prism-floating'))return;
    const rec={title:document.title,url:location.href,text:document.querySelector('article')?.innerText?.slice(0,1800)||''};
    const el=makeBar(rec,true);document.body.append(el);
  }
  chrome.storage.local.get(['nzPrismEnabled','nzPrismHover']).then(r=>{
    enabled=r.nzPrismEnabled!==false;hoverEnabled=r.nzPrismHover!==false;
    if(enabled){scan();makeFloating();}
  });
  let scheduled=false;
  new MutationObserver(()=>{if(scheduled||!enabled)return;scheduled=true;setTimeout(()=>{scheduled=false;scan();},900);})
    .observe(document.documentElement,{childList:true,subtree:true});
  chrome.storage.onChanged.addListener((changes,area)=>{if(area!=='local')return;
    if(changes.nzPrismEnabled){enabled=changes.nzPrismEnabled.newValue!==false;document.querySelectorAll('.nz-prism-bar').forEach(e=>e.remove());if(enabled){document.querySelectorAll('[data-nz-prism-seen]').forEach(e=>delete e.dataset.nzPrismSeen);scan();makeFloating();}}
    if(changes.nzPrismHover){hoverEnabled=changes.nzPrismHover.newValue!==false;document.querySelectorAll('.nz-prism-card-bar').forEach(e=>e.remove());document.querySelectorAll('[data-nz-prism-seen]').forEach(e=>delete e.dataset.nzPrismSeen);scan();}
  });
})();
