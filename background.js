// background.js (タブ操作の司令塔)

// 右クリックメニューの作成
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "saveToPerplexity",
    title: "Perplexityに送る",
    contexts: ["selection"]
  });
});

// 右クリックメニューがクリックされたときの処理
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "saveToPerplexity") {
    const query = info.selectionText;
    const url = `https://www.perplexity.ai/search?q=${encodeURIComponent(query)}`;
    chrome.tabs.create({ url });
  }
});

// ポップアップからのメッセージを受け取り、タブを操作する
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "searchWithInjection") {
    const { url, query, targetSite } = request;

    // 新しいタブを作成
    chrome.tabs.create({ url: url, active: true }, (newTab) => {
      // タブの読み込み完了を待つリスナーを登録
      chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
        // 対象のタブIDで、かつ読み込みが完了したら実行
        if (tabId === newTab.id && changeInfo.status === 'complete') {
          // 実行するスクリプトを定義
          let injectionFunction;
          if (targetSite === 'claude') {
            injectionFunction = (text) => {
              const el = document.querySelector('div[contenteditable="true"]');
              if (el) {
                el.focus();
                el.textContent = text;
                // React/Vueなどのフレームワークに入力を認識させる
                el.dispatchEvent(new Event('input', { bubbles: true }));
              }
            };
          } else if (targetSite === 'gemini') {
            injectionFunction = (text) => {
              // Geminiの入力欄は少し複雑な構造をしている
              const el = document.querySelector('.input-area rich-textarea > div[contenteditable="true"]');
              if (el) {
                el.focus();
                el.textContent = text;
                el.dispatchEvent(new Event('input', { bubbles: true }));
              }
            };
          }

          if (injectionFunction) {
            chrome.scripting.executeScript({
              target: { tabId: newTab.id },
              func: injectionFunction,
              args: [query]
            });
          }
          
          // 一度実行したらリスナーを削除（重要）
          chrome.tabs.onUpdated.removeListener(listener);
        }
      });
    });
    return true; // 非同期処理を示す
  }
});