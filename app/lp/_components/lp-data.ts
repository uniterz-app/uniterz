export const featureCards = [
  {
    eyebrow: "PREDICTION",
    title: "試合を予想して投稿",
    text: "NBAを中心に、各試合の勝敗予想を投稿。単発で終わらず、すべての予想が成績として積み上がる。",
  },
  {
    eyebrow: "RANKING",
    title: "実力が順位として可視化",
    text: "的中率だけでなく、複数指標でユーザーを評価。誰が本当に強いのかをランキングで確認できる。",
  },
  {
    eyebrow: "ANALYTICS",
    title: "5指標で精度を分析",
    text: "勝率、スコア精度、確率精度、アップセット得点、総合得点。予想の質を多面的に可視化。",
  },
  {
    eyebrow: "TREND",
    title: "日次・月次の推移を追跡",
    text: "一時的な好調ではなく、継続して強いかまで見える。自分の波や成長も確認できる。",
  },
  {
    eyebrow: "PLAYOFF",
    title: "プレーオフブラケットにも対応",
    text: "シリーズ単位ではなく、プレーオフ全体を通して予想。提出後はスコアと生存状況を追跡可能。",
  },
  {
    eyebrow: "IDENTITY",
    title: "予想スタイルが個性になる",
    text: "ただ参加するだけではなく、ランキング・分析・プロフィールを通して自分の強みが形になる。",
  },
];

export const metrics = [
  {
    title: "勝率",
    text: "どれだけ勝敗を当てたか。ベースとなる基本指標。",
  },
  {
    title: "スコア精度",
    text: "試合展開や点差までどれだけ近く読めたかを評価。",
  },
  {
    title: "確率精度",
    text: "予想の自信度と実際の結果のズレを可視化。",
  },
  {
    title: "アップセット得点",
    text: "難しい試合を当てた価値を反映。簡単な的中と区別する。",
  },
  {
    title: "総合得点",
    text: "各指標を統合し、総合的な予想力を評価。",
  },
];

export const steps = [
  {
    no: "01",
    title: "試合を選ぶ",
    text: "気になる試合を開き、勝敗や内容を予想する。",
  },
  {
    no: "02",
    title: "結果が自動反映",
    text: "試合終了後、成績と各種指標に自動で反映される。",
  },
  {
    no: "03",
    title: "ランキングと分析を見る",
    text: "自分の強み、弱み、現在地を数字で確認できる。",
  },
];

export const plans = [
  {
    name: "Free",
    price: "¥0",
    items: [
      "試合予想に参加",
      "ランキング閲覧",
      "基本プロフィール表示",
      "成績のベース確認",
    ],
    accent: "border-white/12 bg-white/[0.04]",
    button: "無料で始める",
  },
  {
    name: "Pro",
    price: "More Analytics",
    items: [
      "詳細分析の開放",
      "日次・月次トレンド",
      "深い比較データ",
      "より高度な成績可視化",
    ],
    accent: "border-cyan-300/30 bg-cyan-400/[0.08]",
    button: "Proを見る",
  },
];

export const stats = [
  { label: "Metrics", value: "5" },
  { label: "Leagues", value: "Multi" },
  { label: "Mode", value: "Free / Pro" },
  { label: "Focus", value: "NBA First" },
];

export const rankingRows = [
  { rank: "#1", name: "RIKUTO", score: "92.4" },
  { rank: "#2", name: "AKIRA", score: "90.8" },
  { rank: "#3", name: "SORA", score: "89.7" },
  { rank: "#4", name: "YUTO", score: "87.9" },
];