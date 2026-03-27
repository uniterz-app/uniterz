export const heroHighlights = [
  {
    label: "INPUT",
    value: "試合選択",
    sub: "気になる試合を開いて予想開始",
  },
  {
    label: "TRACKING",
    value: "自動集計",
    sub: "結果反映までそのままつながる",
  },
  {
    label: "ANALYTICS",
    value: "4指標分析",
    sub: "予想の質を立体的に可視化",
  },
] as const;

export const featureCards = [
  {
    eyebrow: "STEP 01",
    title: "試合を選んで予想する",
    text: "日付ごとに試合を確認し、勝敗とスコアをそのまま入力できる。",
  },
  {
    eyebrow: "STEP 02",
    title: "予想が結果に変わる",
    text: "試合終了後、的中・得点・各種成績に自動で反映され、記録が積み上がる。",
  },
  {
    eyebrow: "STEP 03",
    title: "ランキングで現在地が見える",
    text: "他ユーザーとの比較を通して、自分の順位や立ち位置をすぐに確認できる。",
  },
  {
    eyebrow: "STEP 04",
    title: "4指標で予想力を分解する",
    text: "勝率、スコア精度、アップセット得点、総合得点から強みと弱みを見返せる。",
  },
  {
    eyebrow: "STEP 05",
    title: "日次・月次の推移を追う",
    text: "一時的な好不調ではなく、継続して強いか、伸びているかまで確認できる。",
  },
] as const;

export const flowNodes = [
  {
    id: "pick",
    label: "PICK",
    title: "試合選択",
    text: "日付ごとに試合を見て、予想するカードを選ぶ。",
  },
  {
    id: "input",
    label: "INPUT",
    title: "予想入力",
    text: "勝敗とスコアを記録する。",
  },
  {
    id: "sync",
    label: "SYNC",
    title: "結果反映",
    text: "試合終了後に成績へ自動反映される。",
  },
  {
    id: "rank",
    label: "RANK",
    title: "順位比較",
    text: "ランキングで自分の現在地を確認する。",
  },
  {
    id: "analyze",
    label: "ANALYZE",
    title: "分析",
    text: "4指標と推移で予想力を見返す。",
  },
] as const;

export const metrics = [
  {
    key: "winRate",
    short: "WIN",
    title: "勝率",
    text: "どれだけ勝敗を当てたか。ベースとなる基本指標。",
  },
  {
    key: "scorePrecision",
    short: "SCORE",
    title: "スコア精度",
    text: "試合展開や点差までどれだけ近く読めたかを評価。",
  },
  {
    key: "upsetPoints",
    short: "UPSET",
    title: "アップセット得点",
    text: "難しい試合を当てた価値を反映し、簡単な的中と区別する。",
  },
  {
    key: "totalPoints",
    short: "TOTAL",
    title: "総合得点",
    text: "各指標を横断して、総合的な予想力を評価。",
  },
] as const;

export const metricRadar = [
  { label: "勝率", value: 84 },
  { label: "スコア精度", value: 78 },
  { label: "アップセット", value: 69 },
  { label: "総合得点", value: 81 },
] as const;

export const trendBars = [
  { label: "W1", value: 48 },
  { label: "W2", value: 62 },
  { label: "W3", value: 58 },
  { label: "W4", value: 74 },
  { label: "W5", value: 83 },
  { label: "W6", value: 79 },
] as const;

export const steps = [
  {
    no: "01",
    title: "試合を選んで予想",
    text: "気になる試合を開き、勝敗とスコアを入力する。",
  },
  {
    no: "02",
    title: "結果が自動で記録",
    text: "試合終了後、成績や各種指標に自動で反映される。",
  },
  {
    no: "03",
    title: "順位と分析を見る",
    text: "ランキング、4指標、推移データから自分の現在地を確認できる。",
  },
] as const;

/** プラン比較表のセル種別（LPPlans で表示に変換） */
export type PlanComparisonAccess = "full" | "limited" | "none";

export const planComparisonRows = [
  {
    feature: "試合予想に参加",
    free: "full" satisfies PlanComparisonAccess,
    pro: "full" satisfies PlanComparisonAccess,
  },
  {
    feature: "ランキング閲覧",
    free: "full" satisfies PlanComparisonAccess,
    pro: "full" satisfies PlanComparisonAccess,
  },
  {
    feature: "基本プロフィール表示",
    free: "full" satisfies PlanComparisonAccess,
    pro: "full" satisfies PlanComparisonAccess,
  },
  {
    feature: "勝率・スコア精度・アップセット・総合の4指標ビュー",
    free: "limited" satisfies PlanComparisonAccess,
    pro: "full" satisfies PlanComparisonAccess,
  },
  {
    feature: "日次・月次の推移トレンド",
    free: "none" satisfies PlanComparisonAccess,
    pro: "full" satisfies PlanComparisonAccess,
  },
  {
    feature: "詳細な比較・分析画面",
    free: "none" satisfies PlanComparisonAccess,
    pro: "full" satisfies PlanComparisonAccess,
  },
] as const;

export const planTrustLines = [
  "料金の確認・契約・解約はアプリ内の設定からいつでも行えます。",
  "まずは Free で参加し、必要になったタイミングで Pro に切り替えられます。",
] as const;

/** Pro を検討しやすいユーザーの目安（LP 用短文） */
export const planProGuide = "週に何試合も予想したり、推移や4指標で振り返したい人向き。";

export const plans = [
  {
    tier: "free" as const,
    name: "Free",
    price: "¥0",
    /** メイン価格行の直下に表示する補足（期待値の明確化） */
    priceNote: "ずっと無料",
    subtitle: "参加無料",
    caption: "まず参加して記録する",
    summaryLines: [
      "ランキングと基本成績で立ち位置を把握できる",
      "予想への参加は Free のままでも問題ありません",
    ],
    ctaHref: "#signup",
    button: "無料で始める",
  },
  {
    tier: "pro" as const,
    name: "Pro",
    price: "月額プラン",
    priceNote: "金額はアプリ内で表示",
    subtitle: "分析をフルで使う",
    caption: "推移と4指標で予想力を深く見返す",
    summaryLines: [
      "日次・月次の推移で継続力や伸びを追える",
      "詳細ビューで他者との比較まで踏み込める",
    ],
    ctaHref: "#signup",
    button: "登録後、アプリで Pro を確認",
  },
] as const;

export const stats = [
  { label: "Metrics", value: "4" },
  { label: "Flow", value: "Pick → Rank" },
  { label: "Mode", value: "Free / Pro" },
  { label: "Focus", value: "NBA First" },
] as const;

export const rankingRows = [
  { rank: "#1", name: "RIKUTO", score: "92.4", trend: "+4.8" },
  { rank: "#2", name: "AKIRA", score: "90.8", trend: "+2.1" },
  { rank: "#3", name: "SORA", score: "89.7", trend: "+1.6" },
  { rank: "#4", name: "YUTO", score: "87.9", trend: "-0.4" },
] as const;

export const signupPoints = [
  {
    title: "試合予想を投稿できる",
    sub: "日付ごとに試合を選び、そのまま予想まで進める。",
  },
  {
    title: "結果が自動で集計される",
    sub: "試合終了後、成績や得点が自動で反映される。",
  },
  {
    title: "ランキングで現在地が見える",
    sub: "他ユーザーとの比較で、自分の立ち位置が分かる。",
  },
  {
    title: "4指標で予想の質を分析できる",
    sub: "勝率、スコア精度、アップセット得点、総合得点を見返せる。",
  },
] as const;
