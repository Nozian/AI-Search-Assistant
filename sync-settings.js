// Preserve Google Cleaner original keys ai/paa/ads and Search Toolkit nzSettings.
// Bidirectional changes, no deletion of either storage representation.
(()=>{'use strict';
 const map={ai:'hideAi',paa:'hidePaa',ads:'hideAds'};
 chrome.storage.onChanged.addListener(async(changes,area)=>{
  if(area!=='local')return;
  if(changes.nzSettings){const config=changes.nzSettings.newValue||{};const raw=await chrome.storage.local.get(Object.keys(map));const patch={};for(const [old,modern] of Object.entries(map)){if(Object.hasOwn(config,modern)&&raw[old]!==!!config[modern])patch[old]=!!config[modern]}if(Object.keys(patch).length)await chrome.storage.local.set(patch);}
  else if(Object.keys(map).some(k=>changes[k])){
   const x=await chrome.storage.local.get('nzSettings');const cfg={...(x.nzSettings||{})};let modified=false;
   for(const [old,modern] of Object.entries(map)){if(changes[old]&&cfg[modern]!==!!changes[old].newValue){cfg[modern]=!!changes[old].newValue;modified=true}}
   if(modified)await chrome.storage.local.set({nzSettings:cfg});
  }
 });
 // On initial install, don't overwrite existing original preferences when no modern preferences exist.
 chrome.storage.local.get(['nzSettings','ai','paa','ads']).then(v=>{
  if(v.nzSettings){const patch={};for(const [old,modern] of Object.entries(map)){if(Object.hasOwn(v.nzSettings,modern)&&v[old]!==!!v.nzSettings[modern])patch[old]=!!v.nzSettings[modern];}if(Object.keys(patch).length)chrome.storage.local.set(patch);return;}
  if(['ai','paa','ads'].some(k=>v[k]!==undefined))chrome.storage.local.set({nzSettings:{hideAi:!!v.ai,hidePaa:!!v.paa,hideAds:!!v.ads}});
 });
})();
