// AI Search Assistant original 7-destination buttons, with multi-site buttons retained.
// Reimplemented with idempotent refresh for SPA navigation; no automatic AI submission.
(()=>{'use strict';
 if(window.__nozianLegacyAIButtons)return;window.__nozianLegacyAIButtons=true;
 const cls='ac-btn-container-v13';
 const url={
  google:q=>`https://www.google.com/search?q=${encodeURIComponent(q)}`,
  perplexity:q=>`https://www.perplexity.ai/search?q=${encodeURIComponent(q)}`,
  chatgpt:q=>`https://chatgpt.com/?q=${encodeURIComponent(q)}`,
  claude:()=>`https://claude.ai/new`,gemini:()=>`https://gemini.google.com/app`,
  duckduckgo:q=>`https://duckduckgo.com/?q=${encodeURIComponent(q)}`,
  bing:q=>`https://www.bing.com/search?q=${encodeURIComponent(q)}`
 };
 const serviceNames={google:'Google',perplexity:'Perplexity',chatgpt:'ChatGPT',claude:'Claude',gemini:'Gemini',duckduckgo:'DuckDuckGo',bing:'Bing'};
 const configs={
  'google.com':{query:d=>d.querySelector('textarea[name="q"],input[name="q"]')?.value||new URLSearchParams(location.search).get('q'),point:d=>d.querySelector('#search'),exclude:['google']},
  'google.co.jp':{query:d=>d.querySelector('textarea[name="q"],input[name="q"]')?.value||new URLSearchParams(location.search).get('q'),point:d=>d.querySelector('#search'),exclude:['google']},
  'perplexity.ai':{query:d=>d.querySelector('textarea[placeholder*="Ask anything"],textarea')?.value,point:d=>d.querySelector('textarea[placeholder*="Ask anything"]')?.parentElement?.parentElement,exclude:['perplexity']},
  'chat.openai.com':{query:d=>d.querySelector('div[data-message-author-role="user"] .prose')?.innerText,point:d=>d.querySelector('div[data-message-author-role="user"]'),exclude:['chatgpt']},
  'chatgpt.com':{query:d=>d.querySelector('div[data-message-author-role="user"] .prose')?.innerText,point:d=>d.querySelector('div[data-message-author-role="user"]'),exclude:['chatgpt']},
  'claude.ai':{query:d=>d.querySelector('[data-testid^="chat-message-"]:has([data-testid="message-owner-avatar-USER"]) [data-testid="message-content"]')?.innerText,point:d=>d.querySelector('[data-testid^="chat-message-"]:has([data-testid="message-owner-avatar-USER"]) [data-testid="message-content"]'),exclude:['claude']},
  'gemini.google.com':{query:d=>d.querySelector('.query-text,.query')?.innerText,point:d=>d.querySelector('.prompt-history-item-container,.query-container'),exclude:['gemini','google']},
  'duckduckgo.com':{query:d=>d.querySelector('input[name="q"]')?.value||new URLSearchParams(location.search).get('q'),point:d=>d.querySelector('form#search_form,form[role="search"]'),exclude:['duckduckgo']},
  'bing.com':{query:d=>d.querySelector('input[name="q"]')?.value||new URLSearchParams(location.search).get('q'),point:d=>d.querySelector('.searchbox-container,#b_header'),exclude:['bing']},
  'x.com':{query:d=>d.querySelector('article[data-testid="tweet"] div[data-testid="tweetText"]')?.innerText,point:d=>d.querySelector('article[data-testid="tweet"] div[role="group"]'),only:['google']},
  'twitter.com':{query:d=>d.querySelector('article[data-testid="tweet"] div[data-testid="tweetText"]')?.innerText,point:d=>d.querySelector('article[data-testid="tweet"] div[role="group"]'),only:['google']}
 };
 const host=location.hostname.replace(/^www\./,'');const config=configs[host];if(!config)return;
 const services=config.only||Object.keys(serviceNames).filter(s=>!config.exclude.includes(s));
 const button=(site,getTerm)=>{
  const b=document.createElement('button');b.type='button';b.textContent=config.only?'Google検索':serviceNames[site];
  Object.assign(b.style,{border:'1px solid #dadce0',borderRadius:'8px',backgroundColor:'#f8f9fa',color:'#3c4043',fontSize:'11px',cursor:'pointer',padding:'5px 9px',margin:'0'});
  b.addEventListener('click',e=>{
   e.preventDefault();e.stopPropagation();const q=(getTerm()||'').trim();if(!q)return;
   if(site==='claude'||site==='gemini')chrome.runtime.sendMessage({action:'searchWithInjection',url:url[site](),query:q,targetSite:site});
   else window.open(url[site](q),'_blank','noopener');
  });return b;
 };
 let lastPoint=null,lastQuery='',scheduled=false;
 function render(){
  scheduled=false;
  const point=config.point(document);const query=(config.query(document)||'').trim();
  if(!point||!query)return;
  const old=document.querySelector(`.${cls}[data-nozian-legacy="1"]`);
  if(old&&point===lastPoint){lastQuery=query;return}
  old?.remove();
  const wrap=document.createElement('div');wrap.className=cls;wrap.dataset.nozianLegacy='1';
  Object.assign(wrap.style,{display:'flex',flexWrap:'wrap',gap:'7px',margin:'9px 0',padding:'6px 0',borderBottom:'1px solid #dfe1e5'});
  for(const s of services)wrap.appendChild(button(s,()=>config.query(document)));
  if(host==='google.com'||host==='google.co.jp')point.prepend(wrap);else point.append(wrap);
  lastPoint=point;lastQuery=query;
 }
 function schedule(){if(!scheduled){scheduled=true;setTimeout(render,400)}}
 if(document.body){render();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true})}
})();
