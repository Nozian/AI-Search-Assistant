const providers={
 google:['Google','https://www.google.com/search?q='],bing:['Bing','https://www.bing.com/search?q='],ddg:['DuckDuckGo','https://duckduckgo.com/?q='],perplexity:['Perplexity','https://www.perplexity.ai/search?q='],chatgpt:['ChatGPT','https://chatgpt.com/'],gemini:['Gemini','https://gemini.google.com/app'],claude:['Claude','https://claude.ai/new']
};
const $=id=>document.getElementById(id),defaults=['google','ddg','perplexity'];
let composing=false;
async function init(){
 const cfg=await chrome.storage.local.get(['nzSettings','nzHistory','nzSelected']);
 const enabled=cfg.nzSelected||defaults;
 for(const [id,[label]] of Object.entries(providers)){
  const l=document.createElement('label');const c=document.createElement('input');c.type='checkbox';c.value=id;c.checked=enabled.includes(id);c.addEventListener('change',()=>chrome.storage.local.set({nzSelected:[...document.querySelectorAll('#engines input:checked')].map(x=>x.value)}));l.append(c,document.createTextNode(label));$('engines').append(l);
 }
 const s=cfg.nzSettings||{};
 for(const id of ['hideAds','hidePaa','hideAi']){$(id).checked=!!s[id];$(id).addEventListener('change',async()=>{const r=await chrome.storage.local.get('nzSettings');await chrome.storage.local.set({nzSettings:{...r.nzSettings,[id]:$(id).checked},...({hideAds:{ads:$(id).checked},hidePaa:{paa:$(id).checked},hideAi:{ai:$(id).checked}}[id])});});}
 drawHistory(cfg.nzHistory||[]);
}
function drawHistory(items){const host=$('history');host.replaceChildren();if(!items.length){host.textContent='履歴はまだありません';return;}for(const q of items.slice(-12).reverse()){let b=document.createElement('button');b.textContent=q;b.title=q;b.addEventListener('click',()=>{$('query').value=q;$('query').focus()});host.append(b);}}
async function saveHistory(){const q=$('query').value.trim();if(!q)return;const x=await chrome.storage.local.get('nzHistory');const hist=[...(x.nzHistory||[]).filter(s=>s!==q),q].slice(-30);await chrome.storage.local.set({nzHistory:hist});drawHistory(hist);$('status').textContent='検索履歴を保存しました';}
$('query').addEventListener('compositionstart',()=>composing=true);$('query').addEventListener('compositionend',()=>composing=false);
$('query').addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.metaKey||e.ctrlKey)&&!e.isComposing&&!composing){e.preventDefault();openSelected();}});
async function openSelected(){const q=$('query').value.trim();if(!q){$('status').textContent='検索語を入力してください';return}const selected=[...document.querySelectorAll('#engines input:checked')].map(x=>x.value);if(!selected.length){$('status').textContent='検索先を1つ以上選んでください';return;}const urls=selected.map(key=>['chatgpt','gemini','claude'].includes(key)?providers[key][1]:providers[key][1]+encodeURIComponent(q));const r=await chrome.runtime.sendMessage({type:'NZ_OPEN_BATCH',urls});$('status').textContent=r?.ok?`${r.count}タブを開きました。AIチャットには質問文を貼り付けてね。`:'タブを開けませんでした';if(r?.ok)await saveHistory();}
$('open').addEventListener('click',openSelected);
$('save').addEventListener('click',saveHistory);
$('clear').addEventListener('click',()=>{$('query').value='';$('query').focus()});
$('copy').addEventListener('click',()=>navigator.clipboard.writeText($('query').value).then(()=>$('status').textContent='コピーしました'));
$('webMode').addEventListener('click',()=>{const q=$('query').value.trim();chrome.tabs.create({url:'https://www.google.com/search?udm=14&q='+encodeURIComponent(q)});});
init();
