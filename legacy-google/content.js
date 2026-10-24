// Google Cleaner (original controls preserved, isolated to Google search pages)
(()=>{
 'use strict';
 if(document.getElementById('gso-wrapper'))return;
 const panelHTML=`
 <div id="gso-wrapper"><div id="gso-panel">
 <h3>Google検索の設定</h3>
 <div class="gso-switch-box"><label><input type="checkbox" id="gso-ai"> AI概要を非表示</label></div>
 <div class="gso-switch-box"><label><input type="checkbox" id="gso-paa"> 関連する質問を非表示</label></div>
 <div class="gso-switch-box"><label><input type="checkbox" id="gso-ads"> 広告を非表示</label></div>
 <button class="gso-btn gso-reload-btn" id="btn-reload">設定を反映（再検索）</button>
 <div class="gso-tips-area"><b>お助けTips (クリックで反映)</b>
 <button class="gso-btn gso-tip-btn" data-text=" -Amazon -楽天">通販サイトを除外 (-Amazon)</button>
 <button class="gso-btn gso-tip-btn" data-text=' ""'>完全一致 (""の間に文字)</button>
 <button class="gso-btn gso-tip-btn" data-text=" site:">サイト内検索 (site:)</button>
 <button class="gso-btn gso-tip-btn" data-text=" filetype:pdf">PDFファイルを探す</button>
 <button class="gso-btn gso-tip-btn" data-text=" before:2023">2023年より古い記事</button>
 <button class="gso-btn gso-tip-btn" data-text=" after:2023">2023年より新しい記事</button>
 </div></div><button id="gso-toggle" title="設定を開く/閉じる" type="button">設定</button></div>`;
 // Googleページでbodyへの一度きりの注入
 const template=document.createElement('template');template.innerHTML=panelHTML.trim();
 document.body.appendChild(template.content);
 const $=s=>document.getElementById(s), panel=$('gso-panel');
 $('gso-toggle').addEventListener('click',()=>{panel.classList.toggle('open');if(panel.classList.contains('open'))document.getElementById('nz-search-tools')?.classList.remove('nz-expanded')});
 const switches={ai:$('gso-ai'),paa:$('gso-paa'),ads:$('gso-ads')};
 let originalDisplay=new WeakMap(), hidden=new Set();
 const choices=['他の人はこちらも質問','関連する質問','People also ask'];
 function forceRemovePAA(){
  for(const el of hidden){el.style.display=originalDisplay.get(el)||'';hidden.delete(el)}
  if(!switches.paa.checked)return;
  for(const tag of document.querySelectorAll('span,h2,h3')){
   if(!choices.includes(tag.textContent.trim()))continue;
   const c=tag.closest('.MjjYud,.hlcw0c');
   if(c&&c!==document.body&&!c.contains($('gso-wrapper'))){originalDisplay.set(c,c.style.display);c.style.display='none';hidden.add(c)}
  }
 }
 function apply(){document.body.classList.toggle('gso-hide-ads',switches.ads.checked);forceRemovePAA()}
 function saveAndApplySettings(){
  const s={ai:switches.ai.checked,paa:switches.paa.checked,ads:switches.ads.checked};
  chrome.storage.local.set(s);apply();
 }
 Object.values(switches).forEach(s=>s.addEventListener('change',saveAndApplySettings));
 $('btn-reload').addEventListener('click',()=>{
  const u=new URL(location.href);if(switches.ai.checked)u.searchParams.set('udm','14');else u.searchParams.delete('udm');location.href=u.href;
 });
 chrome.storage.local.get(['ai','paa','ads'],data=>{
  Object.entries(switches).forEach(([key,s])=>s.checked=!!data[key]);apply();
 });
 // Original Google Cleaner periodically reapplies PAA removal on dynamic results.
 setInterval(()=>{if(switches.paa.checked)forceRemovePAA()},1500);
 for(const b of document.querySelectorAll('#gso-wrapper .gso-tip-btn')){
  b.addEventListener('click',()=>{
   const box=document.querySelector('textarea[name="q"]')||document.querySelector('input[name="q"]');
   if(!box)return;
   const v=b.dataset.text||'';const from=box.selectionStart??box.value.length;const to=box.selectionEnd??box.value.length;
   box.setRangeText(v,from,to,'end');box.dispatchEvent(new Event('input',{bubbles:true}));box.focus();
  });
 }
})();
