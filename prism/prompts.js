/* Based on Nozian/remake-media-bias-detector (Media Bias Detector v4).
   Prompts assist review; none of the buttons independently verifies a claim. */
(() => {
  'use strict';
  const safe = x => String(x ?? '').trim();
  const SERVICES={
    chatgpt: {label:'ChatGPT',url:'https://chatgpt.com/'},
    perplexity:{label:'Perplexity',url:'https://www.perplexity.ai/'},
    grok:{label:'Grok',url:'https://grok.com/'},
    claude:{label:'Claude',url:'https://claude.ai/new'},
    gemini:{label:'Gemini',url:'https://gemini.google.com/app'}
  };
  function searchQuery(kind,record) {
    const lead=safe(record.title||record.text?.slice(0,85)||'ニュース');
    return ({summary:`${lead} 要約 内容`,bias:`${lead} 異なる視点 メディア バイアス`,fact:`${lead} ファクトチェック 一次情報 事実確認`,deep:`${lead} 背景 解説 詳しく`})[kind]||lead;
  }
  function prompt(kind,record) {
    const title=safe(record.title).slice(0,240), url=safe(record.url).slice(0,500);
    const excerpt=safe(record.text).slice(0,2800);
    const source=`【タイトル／投稿者】${title}\n【URL】${url}\n【本文／投稿の抜粋】\n${excerpt || '本文は取得できていません。URLや見出しだけで断定せず、読める範囲を明示してください。'}`;
    const common='引用できる根拠と未確認の点を区別し、可能な限り一次情報の出典URLを示してください。記事本文にアクセスできない場合はその限界を明示してください。';
    if(kind==='summary')return `以下のニュース・投稿を要約してください。\n${source}\n①3行要約 ②5W1H ③主要論点 ④文脈や背景。${common}`;
    if(kind==='bias')return `以下のニュース・投稿のフレーミングや偏りを分析してください。\n${source}\n①主張と事実の区別 ②用語・強調・省略から見える視点 ③異なる立場からの見方 ④記事単体では判断できないこと。根拠のない政治的ラベルや数値の確信度は付けないでください。${common}`;
    if(kind==='fact')return `以下のニュース・投稿に含まれる検証可能な主張を点検してください。\n${source}\n①検証可能な主張の抽出 ②各主張を裏付ける一次情報と日付 ③矛盾・抜け ④確認済み／未確認／誤りを区別。証拠が足りなければ判定保留にしてください。${common}`;
    return `以下のニュース・投稿について歴史的・社会的背景と関連情報を深掘りしてください。\n${source}\n①背景 ②重要な関係者・制度 ③対立する見方 ④一次資料や統計の探し方。${common}`;
  }
  window.NZ_PRISM_PROMPTS={SERVICES,prompt,searchQuery};
})();
