// content.js (DuckDuckGo/Bingのボタンを追加・修正)

(function() {
    'use strict';

    // ===================================================================
    // ユーティリティ関数
    // ===================================================================
    const CONTAINER_CLASS = 'ac-btn-container-v13'; // コンテナ識別用のクラス名 (バージョン更新)

    function createButton(config) {
        const btn = document.createElement('button');
        btn.textContent = config.text;
        Object.assign(btn.style, config.style);
        btn.addEventListener('mouseover', () => btn.style.opacity = '0.8');
        btn.addEventListener('mouseout', () => btn.style.opacity = '1');
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!config.query) return;

            if (config.injection) {
                chrome.runtime.sendMessage({
                    action: "searchWithInjection",
                    url: config.urlFormatter(),
                    query: config.query,
                    targetSite: config.targetSite
                });
            } else {
                window.open(config.urlFormatter(config.query), '_blank');
            }
        });
        return btn;
    }

    // ===================================================================
    // メインの監視・実行エンジン
    // ===================================================================

    function observeAndAddButtons(siteConfig) {
        const observer = new MutationObserver((mutations, obs) => {
            const insertionPoint = siteConfig.getInsertionPoint(document);
            
            if (!insertionPoint || document.querySelector(`.${CONTAINER_CLASS}`)) {
                return;
            }

            const query = siteConfig.getQuery(document);
            if (!query) {
                return;
            }

            const btnContainer = document.createElement('div');
            btnContainer.className = CONTAINER_CLASS;
            Object.assign(btnContainer.style, siteConfig.containerStyle);

            siteConfig.buttons.forEach(buttonDef => {
                const btn = createButton({ ...buttonDef, query });
                btnContainer.appendChild(btn);
            });
            
            if (siteConfig.insertionMethod === 'prepend') {
                insertionPoint.prepend(btnContainer);
            } else {
                insertionPoint.appendChild(btnContainer);
            }

            obs.disconnect();
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    // ===================================================================
    // サイトごとの設定
    // ===================================================================

    const googleUrl = (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;
    const perplexityUrl = (q) => `https://www.perplexity.ai/search?q=${encodeURIComponent(q)}`;
    const chatgptUrl = (q) => `https://chat.openai.com/?q=${encodeURIComponent(q)}`;
    const duckduckgoUrl = (q) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`;
    const bingUrl = (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}`;
    const claudeUrl = () => `https://claude.ai/new`;
    const geminiUrl = () => `https://gemini.google.com/app`;

    const baseButtonStyle = {
        border: '1px solid #dadce0', borderRadius: '8px', backgroundColor: '#f8f9fa',
        color: '#3c4043', fontSize: '12px', cursor: 'pointer', padding: '6px 12px',
        margin: '0', transition: 'opacity 0.2s',
    };
    const simpleButtonStyle = { ...baseButtonStyle, fontSize: '11px', padding: '4px 10px', minWidth: '80px' };
    const baseContainerStyle = { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' };

    const allServiceButtons = [
        { text: '🔍 Google', urlFormatter: googleUrl, style: { ...simpleButtonStyle, backgroundColor: '#4285F4', color: '#fff' } },
        { text: '🧠 Perplexity', urlFormatter: perplexityUrl, style: { ...simpleButtonStyle, backgroundColor: '#6C47FF', color: '#fff' } },
        { text: '🤖 ChatGPT', urlFormatter: chatgptUrl, style: { ...simpleButtonStyle, backgroundColor: '#10A37F', color: '#fff' } },
        { text: '🤖 Claude', urlFormatter: claudeUrl, style: { ...simpleButtonStyle, backgroundColor: '#D97706', color: '#fff' }, injection: true, targetSite: 'claude' },
        { text: '✨ Gemini', urlFormatter: geminiUrl, style: { ...simpleButtonStyle, backgroundColor: '#8E44AD', color: '#fff' }, injection: true, targetSite: 'gemini' },
        { text: '🦆 DuckDuckGo', urlFormatter: duckduckgoUrl, style: { ...simpleButtonStyle, backgroundColor: '#DE5833', color: '#fff' } },
        { text: '🔍 Bing', urlFormatter: bingUrl, style: { ...simpleButtonStyle, backgroundColor: '#008373', color: '#fff' } },
    ];

    const siteConfigs = {
        'google.com': {
            getQuery: (doc) => doc.querySelector('textarea[name="q"]')?.value,
            getInsertionPoint: (doc) => doc.querySelector('#search'),
            insertionMethod: 'prepend',
            containerStyle: { 
                display: 'flex', flexWrap: 'wrap', gap: '8px', 
                paddingBottom: '16px', marginBottom: '16px', 
                borderBottom: '1px solid #dfe1e5'
            },
            buttons: allServiceButtons.filter(b => b.text !== '🔍 Google'),
        },
        'perplexity.ai': {
            getQuery: (doc) => doc.querySelector('textarea[placeholder*="Ask anything"]')?.value,
            getInsertionPoint: (doc) => doc.querySelector('textarea[placeholder*="Ask anything"]')?.parentElement.parentElement,
            containerStyle: { display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '0 10px 10px 10px' },
            buttons: allServiceButtons.filter(b => b.text !== '🧠 Perplexity'),
        },
        'chat.openai.com': {
            getQuery: (doc) => doc.querySelector('div[data-message-author-role="user"] .prose')?.innerText,
            getInsertionPoint: (doc) => doc.querySelector('div[data-message-author-role="user"]'),
            containerStyle: baseContainerStyle,
            buttons: allServiceButtons.filter(b => b.text !== '🤖 ChatGPT'),
        },
        'claude.ai': {
            getQuery: (doc) => doc.querySelector('[data-testid^="chat-message-"]:has([data-testid="message-owner-avatar-USER"]) [data-testid="message-content"]')?.innerText,
            getInsertionPoint: (doc) => doc.querySelector('[data-testid^="chat-message-"]:has([data-testid="message-owner-avatar-USER"]) [data-testid="message-content"]'),
            containerStyle: baseContainerStyle,
            buttons: allServiceButtons.filter(b => b.text !== '🤖 Claude'),
        },
        'gemini.google.com': {
            getQuery: (doc) => doc.querySelector('.query-text, .query')?.innerText,
            getInsertionPoint: (doc) => doc.querySelector('.prompt-history-item-container, .query-container'),
            containerStyle: baseContainerStyle,
            buttons: allServiceButtons.filter(b => !['✨ Gemini', '🔍 Google'].includes(b.text)),
        },
        'x.com': {
            getQuery: (doc) => doc.querySelector('article[data-testid="tweet"] div[data-testid="tweetText"]')?.innerText,
            getInsertionPoint: (doc) => doc.querySelector('article[data-testid="tweet"] div[role="group"]'),
            containerStyle: { display: 'flex', alignItems: 'center', marginTop: '4px' },
            buttons: [ { text: 'Google検索', urlFormatter: googleUrl, style: { ...baseButtonStyle, fontSize: '12px', padding: '4px 10px', marginLeft: '48px' } } ]
        },
        'twitter.com': {
            getQuery: (doc) => doc.querySelector('article[data-testid="tweet"] div[data-testid="tweetText"]')?.innerText,
            getInsertionPoint: (doc) => doc.querySelector('article[data-testid="tweet"] div[role="group"]'),
            containerStyle: { display: 'flex', alignItems: 'center', marginTop: '4px' },
            buttons: [ { text: 'Google検索', urlFormatter: googleUrl, style: { ...baseButtonStyle, fontSize: '12px', padding: '4px 10px', marginLeft: '48px' } } ]
        },
        'duckduckgo.com': {
            getQuery: (doc) => doc.querySelector('input[name="q"]')?.value,
            getInsertionPoint: (doc) => doc.querySelector('form#search_form'),
            containerStyle: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' },
            buttons: allServiceButtons.filter(b => b.text !== '🦆 DuckDuckGo'),
        },
        'bing.com': {
            getQuery: (doc) => doc.querySelector('input[name="q"]')?.value,
            getInsertionPoint: (doc) => doc.querySelector('.searchbox-container, #b_header'),
            containerStyle: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '5px', padding: '0 10px' },
            buttons: allServiceButtons.filter(b => b.text !== '🔍 Bing'),
        }
    };

    // ===================================================================
    // 実行ロジック
    // ===================================================================

    const currentHostname = window.location.hostname;
    for (const domainKey in siteConfigs) {
        if (currentHostname.includes(domainKey)) {
            observeAndAddButtons(siteConfigs[domainKey]);
            break;
        }
    }
})();