/**
 * 公式 LP の表示コピーと会社情報。
 * 法人名・所在地などはここだけ直せば Company / Footer / JSON-LD に反映される。
 */

export const officialSite = {
  productName: "Uniterz",
  supportEmail: "support@uniterz.app",
  termsHref: "/mobile/terms",
  privacyHref: "/mobile/privacy",
  appStore: {
    status: "comingSoon" as const,
    label: "Coming Soon on iOS",
    href: null,
  },
  sns: {
    x: { label: "X", href: null as string | null },
    instagram: { label: "Instagram", href: null as string | null },
  },
  nav: [
    { id: "features", label: "Features" },
    { id: "how", label: "How It Works" },
    { id: "pro", label: "Pro" },
    { id: "company", label: "Company" },
    { id: "contact", label: "Contact" },
  ],
  company: {
    name: "準備中",
    address: "準備中",
    representative: "準備中",
    founded: "準備中",
    business: "スポーツ予想アプリケーションの企画・開発・運営",
    service: "Uniterz",
    note: "法人登記の確定後、会社名・所在地・代表者・設立日を更新します。",
  },
} as const;

export const officialHero = {
  kicker: "Sports Prediction App",
  title: "Uniterz",
  lead: "NBAなどの試合スコアを予想し、ユーザー同士で競うスポーツ予想アプリです。",
  points: [
    "勝敗とスコアを予想し、的中精度でランキングを競います。",
    "現金を賭けるサービスではありません。",
    "Unit を購入・換金することはできません。",
  ],
  ctaLabel: "Coming Soon on iOS",
} as const;

export const officialWhat = {
  heading: "What is Uniterz",
  lead: "Uniterz は、スポーツ観戦をより深く楽しむための予想ゲームです。お金を賭ける場所ではありません。",
  facts: [
    {
      title: "試合結果を予想する",
      text: "NBA などの試合を選び、勝敗とスコアを投稿します。",
    },
    {
      title: "精度がスコアになる",
      text: "的中やスコア差に応じて独自スコアが付き、ランキングの基準になります。",
    },
    {
      title: "ランキングで競う",
      text: "日々更新される順位で、他のユーザーと予想のうまさを競います。",
    },
    {
      title: "Unit は購入できない",
      text: "Unit は成績に応じて運営から付与されるポイントです。現金の賭けや購入・換金はできません。",
    },
  ],
} as const;

export const officialHow = {
  heading: "How It Works",
  lead: "使い方は4つのステップです。",
  steps: [
    {
      no: "01",
      title: "試合を選ぶ",
      text: "日程から気になる試合を開きます。まずは NBA を中心に提供します。",
    },
    {
      no: "02",
      title: "予想する",
      text: "勝敗とスコアを入力して投稿します。締切前なら見直しもできます。",
    },
    {
      no: "03",
      title: "結果を確認する",
      text: "試合終了後、結果が自動で反映され、自分の予想との差が見えます。",
    },
    {
      no: "04",
      title: "ランキングと Unit",
      text: "スコアで順位が決まります。成績に応じて Unit を獲得できる場合があります。",
    },
  ],
} as const;

export const officialFeatures = {
  heading: "Features",
  lead: "予想・競争・分析に必要な情報を、試合の前後で使えるようにしています。",
  items: [
    {
      id: "prediction",
      name: "Match Prediction",
      text: "勝敗だけでなくスコアまで予想します。精度そのものが順位になります。",
      featured: true,
    },
    {
      id: "rankings",
      name: "Rankings",
      text: "日次・週次・月次など、期間ごとのランキングで他ユーザーと競います。",
      featured: true,
    },
    {
      id: "team",
      name: "Team Stats",
      text: "対戦前にチーム成績を確認し、数字から試合を読めます。",
      featured: false,
    },
    {
      id: "player",
      name: "Player Stats",
      text: "選手単位の成績を見て、得点や役割の変化を把握できます。",
      featured: false,
    },
    {
      id: "injury",
      name: "Injury Information",
      text: "欠場や出場可否など、予想前に確認したい情報をまとめています。",
      featured: false,
    },
    {
      id: "insight",
      name: "PRO INSIGHT",
      text: "その試合で見るべきポイントを整理します。勝者を断言する機能ではありません。",
      featured: false,
    },
    {
      id: "reports",
      name: "Weekly / Monthly Report",
      text: "自分の予想の傾向を週次・月次で振り返り、次の試合に活かせます。",
      featured: false,
    },
    {
      id: "notify",
      name: "Notifications",
      text: "締切や試合開始、結果反映をお知らせします。Pro は直前の重要変化にも対応します。",
      featured: false,
    },
  ],
} as const;

export const officialPreview = {
  heading: "App Preview",
  lead: "実際のアプリ画面です。スクショは随時差し替えます。",
  screens: [
    {
      id: "games",
      label: "試合一覧",
      alt: "Uniterz の試合一覧画面",
      src: "/lp/games-v2.png",
      type: "image" as const,
    },
    {
      id: "predict",
      label: "予想画面",
      alt: "Uniterz の予想投稿画面",
      src: "/lp/predict-v2.png",
      type: "image" as const,
    },
    {
      id: "ranking",
      label: "ランキング",
      alt: "Uniterz のランキング画面",
      src: "/lp/ranking-v2.png",
      videoSrc: "/lp/ranking-v2.MP4",
      type: "video" as const,
    },
  ],
  coming: ["ホーム", "試合詳細", "チーム詳細", "プレイヤー詳細", "プロフィール"],
} as const;

export const officialPro = {
  heading: "Uniterz Pro",
  lead: "試合予想と基本ランキングは無料です。Pro は分析と継続のための有料プランです。価格は未確定のため、ここでは金額を表示しません。",
  revenue:
    "収益は Pro のサブスクリプション（予定）です。予想への参加課金や、Unit の販売は行いません。",
  rows: [
    { feature: "試合予想", free: "あり", pro: "あり" },
    { feature: "基本ランキング", free: "あり", pro: "あり" },
    { feature: "PRO INSIGHT", free: "なし", pro: "あり" },
    { feature: "直前アラート", free: "基本通知", pro: "重要変化まで" },
    { feature: "Weekly Report", free: "なし", pro: "あり" },
    { feature: "Monthly Report", free: "なし", pro: "あり" },
    { feature: "Pro Skin", free: "なし", pro: "あり" },
    { feature: "Pro Badge", free: "なし", pro: "あり" },
  ],
} as const;

export const officialNoGambling = {
  heading: "No Gambling",
  lead: "Uniterz はギャンブルサービスではありません。",
  statements: [
    "現金を賭けることはできません。",
    "Unit を購入することはできません。",
    "Unit を現金に換えることはできません。",
    "スポーツ予想を、ゲームとして楽しむサービスです。",
  ],
} as const;

export const officialContact = {
  heading: "Contact",
  lead: "サービスに関するお問い合わせは、下記メールまたはフォームから受け付けます。",
} as const;
