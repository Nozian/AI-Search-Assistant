// popup.js (自動入力対応版)

// 履歴の表示・更新
function updateHistory() {
  chrome.storage.local.get(["inputHistory"], (result) => {
    const history = result.inputHistory || [];
    const list = document.getElementById("historyList");
    const noHistory = document.getElementById("noHistory");
    list.innerHTML = "";
    if (history.length === 0) {
      noHistory.style.display = "block";
      return;
    }
    noHistory.style.display = "none";
    history.slice().reverse().forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      li.style.cursor = "pointer";
      li.style.padding = "2px 0";
      li.style.borderBottom = "1px solid #f0f0f0";
      li.addEventListener("click", () => {
        inputText.value = item;
        handleSearch(item);
      });
      list.appendChild(li);
    });
  });
}

// 保存ボタン
const inputText = document.getElementById("inputText");
document.getElementById("saveBtn").addEventListener("click", () => {
  const text = inputText.value.trim();
  if (!text) return;
  chrome.storage.local.get(["inputHistory"], (result) => {
    let history = result.inputHistory || [];
    history = history.filter(t => t !== text);
    history.push(text);
    if (history.length > 20) history = history.slice(-20);
    chrome.storage.local.set({ inputHistory: history, savedText: text }, () => {
      updateHistory();
    });
  });
});

const serviceMeta = {
  google:     { icon: '🔍', label: 'Google',     color: '#4285F4', url: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}` },
  perplexity: { icon: '🧠', label: 'Perplexity', color: '#6C47FF', url: (q) => `https://www.perplexity.ai/search?q=${encodeURIComponent(q)}` },
  chatgpt:    { icon: '🤖', label: 'ChatGPT',    color: '#10A37F', url: (q) => `https://chat.openai.com/?q=${encodeURIComponent(q)}` },
  claude:     { icon: '🤖', label: 'Claude',     color: '#D97706', url: () => `https://claude.ai/new`, injection: true },
  gemini:     { icon: '✨', label: 'Gemini',     color: '#8E44AD', url: () => `https://gemini.google.com/app`, injection: true },
  bing:       { icon: '🔍', label: 'Bing',       color: '#008373', url: (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}` },
  duckduckgo: { icon: '🦆', label: 'DuckDuckGo', color: '#DE5833', url: (q) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}` },
};

const serviceSelect = document.getElementById("serviceSelect");
const searchBtn = document.getElementById("searchBtn");
const searchIcon = document.getElementById("searchIcon");
const searchLabel = document.getElementById("searchLabel");

function updateSearchBtn() {
  const val = serviceSelect.value;
  const meta = serviceMeta[val];
  searchIcon.textContent = meta.icon;
  searchLabel.textContent = meta.label;
  searchBtn.style.background = meta.color;
}

// 検索実行の共通処理
function handleSearch(query) {
    const service = serviceSelect.value;
    const meta = serviceMeta[service];

    if (meta.injection) {
      // 自動入力が必要なサービスの場合、background.jsにメッセージを送信
      chrome.runtime.sendMessage({
        action: "searchWithInjection",
        url: meta.url(),
        query: query,
        targetSite: service
      });
    } else {
      // 通常のサービスはURLにキーワードを含めて開く
      window.open(meta.url(query), '_blank');
    }
}

searchBtn.addEventListener("click", () => {
  const text = inputText.value.trim();
  if (text) {
    handleSearch(text);
  }
});

// Enterキーで検索
inputText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const text = inputText.value.trim();
        if (text) {
            handleSearch(text);
        }
    }
});


serviceSelect.addEventListener("change", updateSearchBtn);

// 初期化
// Geminiをセレクトボックスに追加
const geminiOption = document.createElement('option');
geminiOption.value = 'gemini';
geminiOption.textContent = 'Gemini';
// claudeの次に追加
const claudeOption = serviceSelect.querySelector('option[value="claude"]');
if (claudeOption) {
    claudeOption.insertAdjacentElement('afterend', geminiOption);
} else {
    serviceSelect.appendChild(geminiOption);
}


// 以前のEcosiaは削除（もしあれば）
const ecosiaOption = serviceSelect.querySelector('option[value="ecosia"]');
if (ecosiaOption) ecosiaOption.remove();


updateHistory();
updateSearchBtn();