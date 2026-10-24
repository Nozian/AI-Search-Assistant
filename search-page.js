(()=>{'use strict';if(window.__nzSearchToolkit)return;window.__nzSearchToolkit=true;
const host=new URL(location.href).hostname;const google=/^(www\.)?google\.(com|co\.jp)$/.test(host);
const bing=host==='www.bing.com';const duck=host==='duckduckgo.com';
if(!google&&!bing&&!duck)return;
const root=document.createElement('div');root.id='nz-search-tools';root.innerHTML=`<div class="nz-panel"><b>検索ツール</b><div class="nz-links"></div><div class="nz-google"></div><div class="nz-tip">検索演算子："完全一致" / site:example.com / -除外語 / filetype:pdf</div></div><button type="button" class="nz-open">検索ツール</button>`;
(document.body||document.documentElement).append(root);
root.querySelector('.nz-open').addEventListener('click',()=>{root.classList.toggle('nz-expanded');if(root.classList.contains('nz-expanded'))document.getElementById('gso-panel')?.classList.remove('open');});
const params=new URLSearchParams(location.search);const term=params.get('q')||params.get('query')||'';
const targets={Google:'https://www.google.com/search?q=',Bing:'https://www.bing.com/search?q=',DuckDuckGo:'https://duckduckgo.com/?q=',Perplexity:'https://www.perplexity.ai/search?q='};
for(const [n,prefix] of Object.entries(targets)){const b=document.createElement('button');b.textContent=n;b.title='検索結果を新しいタブで開く';b.addEventListener('click',()=>window.open(prefix+encodeURIComponent(term),'_blank','noopener'));root.querySelector('.nz-links').append(b);}
if(google){const area=root.querySelector('.nz-google');for(const [key,name] of [['hideAds','広告を隠す'],['hidePaa','関連する質問を隠す'],['hideAi','AI概要を隠す']]){const label=document.createElement('label');const inp=document.createElement('input');inp.type='checkbox';inp.dataset.key=key;label.append(inp,document.createTextNode(' '+name));area.append(label);inp.addEventListener('change',async()=>{const x=await chrome.storage.local.get('nzSettings');await chrome.storage.local.set({nzSettings:{...(x.nzSettings||{}),[key]:inp.checked}});});}
 const b=document.createElement('button');b.textContent='ウェブのみで検索';b.addEventListener('click',()=>{const url=new URL(location.href);url.searchParams.set('udm','14');location.href=url.href});area.append(b);
}
function apply(s){document.body.classList.toggle('nz-hide-ads',!!s.hideAds&&google);document.body.classList.toggle('nz-hide-ai',!!s.hideAi&&google);root.querySelectorAll('input[data-key]').forEach(x=>x.checked=!!s[x.dataset.key]);
 document.querySelectorAll('[data-nz-paa-hidden]').forEach(el=>{el.style.display='';el.removeAttribute('data-nz-paa-hidden')});
 if(s.hidePaa&&google){document.querySelectorAll('h2,h3,span').forEach(el=>{if(!['他の人はこちらも質問','関連する質問','People also ask'].includes(el.textContent?.trim()))return;const container=el.closest('.MjjYud,.hlcw0c')||el.parentElement?.parentElement;if(container&&container!==document.body&&container!==root&&container.textContent.length<2500){container.style.display='none';container.dataset.nzPaaHidden='1';}});}}
let settings={};chrome.storage.local.get('nzSettings').then(x=>{settings=x.nzSettings||{};apply(settings)});
chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&changes.nzSettings){settings=changes.nzSettings.newValue||{};apply(settings)}});
let timer;const obs=new MutationObserver(()=>{if(!settings.hidePaa)return;clearTimeout(timer);timer=setTimeout(()=>apply(settings),700)});obs.observe(document.body,{childList:true,subtree:true});
})();
