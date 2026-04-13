export type LPMediaType = "image" | "video";

export type LPMediaAsset = {
  type: LPMediaType;
  src: string;
  poster?: string;
  alt: string;
  imagePosition?: string;
  /** 動画デコード前の黒つぶれ対策（ネイティブ img で即表示） */
  videoBackdropSrc?: string;
};

export type LPFlowMediaSlot = {
  enabled: boolean;
  type: LPMediaType;
  src: string;
  poster?: string;
  alt: string;
};

/** ConnectedFlowCards 用アイコンキー（下部ナビ由来 + LP フロー��用） */
export type LPFlowNavIconKey =
  | "games"
  | "home"
  | "ranking"
  | "leaderboards"
  | "mypage"
  | "pen"
  | "resultSync"
  | "medal";

export type LPSlotMedia = {
  id: string;
  badge: string;
  title: string;
  type: LPMediaType;
  enabled: boolean;
  src: string;
  poster?: string;
  alt: string;
};

export type LPPlanScreenshot = {
  tier: "free" | "pro";
  title: string;
  enabled: boolean;
  src: string;
  alt: string;
};

export type LPPredictionFlowDemo = {
  enabled: boolean;
  type: LPMediaType;
  src: string;
  /** 同名ファイルを差し替えたときに変えるとブラウザキャッシュを避けられる */
  cacheKey?: string;
  poster?: string;
  alt: string;
  steps: readonly string[];
};

export const heroMediaViews = [
  {
    key: "ranking",
    label: "Ranking",
    title: "ランキングで、世界と競え。",
    desc: "ランキングは毎日更新。世界中のユーザーと競いながら、自分の実力を磨ける。",
    chip: "Daily Ranking",
    media: {
      type: "video",
      src: "/lp/ranking-v2.MP4",
      poster: "/lp/ranking-v2.PNG",
      videoBackdropSrc: "/lp/ranking-v2.PNG",
      alt: "ランキング画面",
      imagePosition: "center 68%",
    } satisfies LPMediaAsset,
  },
  {
    key: "games",
    label: "Games",
    title: "現在はNBA中心、順次拡張。",
    desc: "まずはNBAを中心に熱く競う。今後はBリーグやサッカー、国際大会へ順次拡張予定。",
    chip: "NBA First",
    media: {
      type: "image",
      src: "/lp/games-v2.PNG",
      poster: "/lp/games-v2.PNG",
      alt: "試合一覧画面",
      imagePosition: "center 32%",
    } satisfies LPMediaAsset,
  },
  {
    key: "post",
    label: "Post",
    title: "かんたんに、すぐ投稿。",
    desc: "日付から試合を選び、勝敗とスコアを入力するだけ。迷わず投稿できるシンプルな流れ。",
    chip: "Easy Post",
    media: {
      type: "image",
      src: "/lp/predict-v2.PNG",
      poster: "/lp/predict-v2.PNG",
      alt: "予想投稿画面",
      imagePosition: "center 32%",
    } satisfies LPMediaAsset,
  },
] as const;

export const mediaSlots: readonly LPSlotMedia[] = [
  {
    id: "hero-main",
    badge: "RANK SNAPSHOT",
    title: "世界ランキングの現在地",
    type: "video",
    enabled: true,
    src: "/lp/LP3.mp4",
    poster: "/lp/ranking-v2.png",
    alt: "世界ランキング画面のデモ動画",
  },
] as const;

export const planScreenshots: readonly LPPlanScreenshot[] = [
  {
    tier: "free",
    title: "Free プラン画面",
    enabled: false,
    src: "",
    alt: "Free プランのスクリーンショット",
  },
  {
    tier: "pro",
    title: "Pro プラン画面",
    enabled: false,
    src: "",
    alt: "Pro プランのスクリーンショット",
  },
] as const;

/** フロー動画は public/lp/prediction-flow.mp4（同名で上書きしたら cacheKey を変える） */
export const predictionFlowDemo: LPPredictionFlowDemo = {
  enabled: true,
  type: "video",
  src: "/lp/prediction-flow.mp4",
  cacheKey: "14",
  poster: "/lp/games-v2.PNG",
  alt: "試合選択から当たり外れまでのフロー動画",
  steps: [
    "試合選択",
    "数値入力",
    "投稿",
    "当たり外れ判定",
    "ランキング反映",
  ],
} as const;

export const heroHighlights = [
  {
    label: "INPUT",
    value: "試合選択",
    sub: "Bリーグ中心の試合から予想開始",
  },
  {
    label: "TRACKING",
    value: "毎日更新",
    sub: "ランキングが毎日変動して熱量が続く",
  },
  {
    label: "RANKING",
    value: "世界と競争",
    sub: "自分のコミュニティから世界上位を目指せる",
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
    title: "毎日更新ランキングで競う",
    text: "他ユーザーとの比較で現在地を把握し、世界と競うモチベーションにつながる。",
  },
  {
    eyebrow: "STEP 04",
    title: "自分のコミュニティで熱狂を作る",
    text: "仲間と順位を競い合い、観戦体験にゲームの熱狂を加える。",
  },
  {
    eyebrow: "STEP 05",
    title: "月間トップの豪華なプレゼントを狙う",
    text: "スコア制度で積み上げ、月間トップを取って豪華なプレゼントを目指す。",
  },
] as const;

export const flowNodes = [
  {
    id: "pick",
    label: "STEP 01",
    title: "試合選択",
    text: "試合カードを選んで予想を始める。",
    navIconKey: "games" satisfies LPFlowNavIconKey,
    media: {
      enabled: false,
      type: "video",
      src: "",
      poster: "",
      alt: "STEP 01 クリップ",
    } satisfies LPFlowMediaSlot,
  },
  {
    id: "input",
    label: "STEP 02",
    title: "予想入力",
    text: "勝敗とスコアを入力する。",
    navIconKey: "pen" satisfies LPFlowNavIconKey,
    media: {
      enabled: false,
      type: "video",
      src: "",
      poster: "",
      alt: "STEP 02 クリップ",
    } satisfies LPFlowMediaSlot,
  },
  {
    id: "sync",
    label: "STEP 03",
    title: "結果反映",
    text: "試合終了後に自動で反映。",
    navIconKey: "resultSync" satisfies LPFlowNavIconKey,
    media: {
      enabled: false,
      type: "video",
      src: "",
      poster: "",
      alt: "STEP 03 クリップ",
    } satisfies LPFlowMediaSlot,
  },
  {
    id: "rank",
    label: "STEP 04",
    title: "現在地の確認",
    text: "毎日更新されるランキングで、今の順位を確認。",
    navIconKey: "ranking" satisfies LPFlowNavIconKey,
    media: {
      enabled: false,
      type: "video",
      src: "",
      poster: "",
      alt: "STEP 04 クリップ",
    } satisfies LPFlowMediaSlot,
  },
  {
    id: "analyze",
    label: "STEP 05",
    title: "月間報酬",
    text: "月間トップで\n豪華なプレゼント。",
    navIconKey: "medal" satisfies LPFlowNavIconKey,
    media: {
      enabled: false,
      type: "video",
      src: "",
      poster: "",
      alt: "STEP 05 クリップ",
    } satisfies LPFlowMediaSlot,
  },
] as const;

export type LPConnectedFlowNode = (typeof flowNodes)[number];

export const steps = [
  {
    no: "01",
    title: "試合を選んで予想",
    text: "気になる試合を開き、勝敗とスコアを入力する。",
  },
  {
    no: "02",
    title: "結果が自動で記録",
    text: "試合終了後、成績とスコアが自動で反映される。",
  },
  {
    no: "03",
    title: "毎日更新ランキングで競う",
    text: "コミュニティから世界ランキングへ挑み、1位を目指せる。",
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
    feature: "ランキング詳細ビュー",
    free: "limited" satisfies PlanComparisonAccess,
    pro: "full" satisfies PlanComparisonAccess,
  },
  {
    feature: "ランキング推移トレンド",
    free: "none" satisfies PlanComparisonAccess,
    pro: "full" satisfies PlanComparisonAccess,
  },
  {
    feature: "コミュニティ比較・世界順位ビュー",
    free: "none" satisfies PlanComparisonAccess,
    pro: "full" satisfies PlanComparisonAccess,
  },
] as const;

export const planTrustLines = [
  "ランキングは毎日更新され、最新の順位で競えます。",
  "月間トップには豪華なプレゼントがあります。",
  "料金の確認・契約・解約はアプリ内の設定からいつでも行えます。",
  "まずは Free で参加し、必要になったタイミングで Pro に切り替えられます。",
] as const;

/** Pro を検討しやすいユーザーの目安（LP 用短文） */
export const planProGuide = "毎日ランキングを追い、コミュニティ比較や世界順位まで深く見たい人向き。";

export const plans = [
  {
    tier: "free" as const,
    name: "Free",
    price: "¥0",
    /** メイン価格行の直下に表示する補足（期待値の明確化） */
    priceNote: "ずっと無料",
    subtitle: "参加無料",
    caption: "まず参加してランキングに挑む",
    summaryLines: [
      "毎日更新ランキングと基本成績で立ち位置を把握できる",
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
    subtitle: "ランキング機能をフルで使う",
    caption: "推移・比較・世界順位まで使って上位を狙う",
    summaryLines: [
      "ランキング推移で継続力や伸びを追える",
      "コミュニティ比較と世界順位ビューで差を詰められる",
    ],
    ctaHref: "#signup",
    button: "登録後、アプリで Pro を確認",
  },
] as const;

export const stats = [
  { label: "Update", value: "Daily" },
  { label: "Reward", value: "Top1 Gift" },
  { label: "Mode", value: "Free / Pro" },
  { label: "Focus", value: "B League First" },
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
    title: "毎日更新ランキングで競える",
    sub: "自分のコミュニティの仲間と、世界中のユーザーとも競いながら立ち位置が分かる。",
  },
  {
    title: "月間トップの豪華なプレゼントを狙える",
    sub: "スコア制度で順位を上げ、月間トップ報酬の獲得に挑戦できる。",
  },
] as const;
