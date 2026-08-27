/**
 * 公式 LP の表示コピーと会社情報。
 * 法人名・所在地などはここだけ直せば運営会社ページ / Footer / JSON-LD に反映される。
 *
 * 法務表現は弁護士レビュー（適法に実装可能、との結論）の範囲に限定する。
 * 法人情報の未確定項目は「準備中」のまま公開する。
 * Pro 料金は iOS（App Store）の税込予定価格。地域・ストアで異なる場合がある。
 */

import { INFO_EMAIL, SUPPORT_EMAIL } from "@/lib/contact/companyEmails";
import {
  TOKUSHOHO_HEADING,
  TOKUSHOHO_LEAD,
  TOKUSHOHO_ROWS,
} from "@/lib/legal/tokushohoCopy";

export type OfficialAssetBrief = {
  id: string;
  placement: string;
  asset: string;
  subject: string;
  spec: string;
  notes: string;
};

export const officialSite = {
  productName: "Uniterz",
  /** LP・公式・取引先・スポンサー・一般窓口 */
  infoEmail: INFO_EMAIL,
  /** アプリユーザーサポート（不具合・返金・ログイン等） */
  supportEmail: SUPPORT_EMAIL,
  termsHref: "/mobile/terms",
  privacyHref: "/mobile/privacy",
  tokushohoHref: "/lp-official/tokushoho",
  companyHref: "/lp-official/company",
  electronicNoticeHref: "/web/electronic-notice",
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
    { id: "faq", label: "FAQ" },
    { id: "contact", label: "Contact" },
  ],
  company: {
    name: "株式会社UNITERZ",
    address: "神奈川県横浜市西区浅間町1-4-3 ウィザードビル402",
    representative: "神谷陸登",
    founded: "準備中",
    corporateNumber: "取得後に追加",
    business: "スポーツ予想アプリケーションの企画・開発・運営",
    service: "Uniterz",
    note: "設立日、法人番号は確定後に更新します。",
  },
} as const;

export const officialHero = {
  catch: "予想の精度で、競え。",
  lead: "Uniterz は、NBAなどの試合結果を無料で予想し、的中などの成績をランキングで競うスポーツ予想アプリです。現金を賭けるサービスではありません。",
  ctaLabel: "ログイン",
  ctaHrefMobile: "/mobile/login",
  ctaHrefWeb: "/web/login",
} as const;

export const officialHeroScreens = {
  left: {
    src: "/lp/games.png",
    alt: "Uniterz の試合一覧画面",
    label: "Games",
  },
  leftBack: {
    src: "/lp/prediction.png",
    alt: "Uniterz の予想画面",
    label: "Predict",
  },
  right: {
    src: "/lp/ranking.png",
    alt: "Uniterz のランキング画面",
    label: "Ranking",
  },
} as const;

export const officialWhat = {
  heading: "What is Uniterz",
  headingJa: "Uniterz とは",
  statement: "試合を予想し、成績をランキングに残す。",
  purpose: {
    title: "目的",
    lines: [
      "スポーツの試合結果を予想する",
      "的中やスコア差をランキングで可視化する",
      "Unit でユニフォームなどの商品と交換できる",
    ],
  },
  difference: {
    title: "従来の観戦との違い",
    lines: [
      "見るだけで終わらない",
      "勝敗とスコアを投稿し、成績で競う",
      "予想は無料。現金を賭ける場所ではない",
    ],
  },
} as const;

export const officialHow = {
  heading: "How It Works",
  headingJa: "使い方",
  lead: "試合を選んで予想する。成績がランキングになり、条件を満たすと Unit が付与されます。Unit はユニフォームなどの商品と交換できます。",
  steps: [
    {
      no: "01",
      icon: "match" as const,
      title: "試合を選択",
      text: "日程から気になる試合を開きます。まずは NBA を中心に提供します。",
      shot: { src: "/lp/games.png", alt: "Uniterz の試合一覧" },
    },
    {
      no: "02",
      icon: "predict" as const,
      title: "勝敗・スコアなどを予想",
      text: "勝敗とスコアを入力して投稿します。試合開始前なら見直しもできます。",
      shot: { src: "/lp/prediction.png", alt: "Uniterz の予想画面" },
    },
    {
      no: "03",
      icon: "rank" as const,
      title: "ランキングで競う",
      text: "的中などの成績で順位が決まります。スコアの計算方法は Free でも Pro でも同じです。",
      shot: { src: "/lp/ranking.png", alt: "Uniterz のランキング" },
    },
    {
      no: "04",
      icon: "exchange" as const,
      title: "Unit で商品と交換",
      text: "条件達成者に Unit が無償で付与されます。ユニフォームなどの NBA グッズと交換できます。Unit の購入・換金はできません。",
      shot: { src: "/lp/change.png", alt: "Uniterz の商品交換" },
    },
  ],
} as const;

export const officialUnit = {
  heading: "What is UNIT",
  headingJa: "Unit とは",
  statement: "運営が条件達成者に無償で付与するアプリ内報酬です。",
  lead: "予想には使いません。外れても減りません。Free と Pro で付与条件は同じです。",
  when: {
    title: "どんなときにもらえる",
    lines: [
      "週間・月間ランキングの上位になったとき",
      "招待の条件を達成したとき",
      "グループバトルの上位グループに入ったとき",
      "運営が事前に告知するイベントの対象になったとき",
    ],
  },
  can: {
    title: "できること",
    lines: [
      "ユニフォームなどの NBA グッズと交換する",
      "対象は正規販売店の新品",
    ],
  },
  cannot: {
    title: "できないこと",
    lines: [
      "Unit の購入",
      "換金・払戻し",
      "譲渡・販売",
      "Pro 加入で増やす",
    ],
  },
} as const;

export const officialFeatures = {
  heading: "Features",
  headingJa: "できること",
  lead: "予想と競争に必要な情報は、無料プランでも確認できます。",
  primary: [
    {
      id: "prediction",
      name: "予想",
      text: "勝敗だけでなくスコアまで投稿します。精度そのものが順位の材料になります。",
    },
    {
      id: "rankings",
      name: "ランキング",
      text: "期間ごとの成績で他のユーザーと競います。参加条件は Free / Pro で同一です。",
    },
  ],
  items: [
    {
      id: "units",
      name: "Unit 交換",
      text: "成績に応じて付与された Unit を、運営が用意したユニフォームなどの NBA グッズと交換できます。Unit の購入・換金はできません。",
    },
    {
      id: "data",
      name: "選手・チームデータ",
      text: "対戦前にチーム成績と選手成績を確認できます。無料プランでも閲覧できます。",
    },
    {
      id: "injury",
      name: "Injury",
      text: "欠場や出場可否など、予想前に確認したい情報をまとめています。無料プランでも閲覧できます。",
    },
    {
      id: "insight",
      name: "Insight",
      text: "PRO INSIGHT は、無料でも見られる情報を要約し、見るべき点を整理します。勝敗を断定したり、特定の予想を推奨したりする機能ではありません。",
    },
    {
      id: "report",
      name: "Report",
      text: "自分の予想の傾向を週次・月次で振り返ります。Pro の機能です。",
    },
    {
      id: "notify",
      name: "Notification",
      text: "締切、試合開始、結果反映をお知らせします。Pro は直前の重要変化にも対応します。",
    },
  ],
} as const;

export const officialPreview = {
  heading: "App",
  headingJa: "実際のアプリ画面",
  lead: "開発中の実機画面です。",
  screens: [
    {
      id: "result",
      label: "リザルトカード",
      src: "/lp/resultcard.png",
      alt: "Uniterz のリザルトカード",
    },
    {
      id: "teamstats",
      label: "チームスタッツ",
      src: "/lp/teamstats.png",
      alt: "Uniterz のチームスタッツ",
    },
    {
      id: "playerstats",
      label: "プレイヤースタッツ",
      src: "/lp/playerstats.png",
      alt: "Uniterz のプレイヤースタッツ",
    },
    {
      id: "teamdetail",
      label: "チーム詳細",
      src: "/lp/teamdetail.png",
      alt: "Uniterz のチーム詳細",
    },
    {
      id: "playerdetail",
      label: "選手詳細",
      src: "/lp/playerdetail.png",
      alt: "Uniterz の選手詳細",
    },
    {
      id: "standing",
      label: "順位予想",
      src: "/lp/standingprediction.png",
      alt: "Uniterz の順位予想",
    },
  ],
} as const;

export const officialSports = {
  heading: "Leagues",
  headingJa: "対応スポーツ / リーグ",
  current: "NBA からスタートします。",
  future: "対応リーグは順次拡大予定です。",
  disclaimer:
    "NBA、チーム、選手等の名称・ロゴは各権利者に帰属します。Uniterz は NBA またはその関係会社の公式サービスではありません。",
} as const;

export const officialPro = {
  heading: "Free / Pro",
  headingJa: "プラン",
  lead: "試合予想と基本ランキングは無料です。Pro は、予想を決める材料・振り返り・見た目のためのサブスクリプションです。競技上の加点や Unit の増量はありません。",
  revenue:
    "収益は Pro のサブスクリプション（予定）です。予想への参加課金や、Unit の販売は行いません。",
  priceNote:
    "表示は iOS（App Store）の税込予定価格です。地域やストアによって異なる場合があります。自動更新の解約は App Store のサブスクリプション管理から行います。",
  sameRules:
    "スコアの計算方法、ランキングへの参加条件、Unit の付与条件および付与量、商品交換の条件は、Free と Pro で同一です。",
  plans: [
    {
      id: "free",
      name: "Free",
      price: "¥0",
      period: "参加無料",
      variant: "free" as const,
      items: [
        "試合予想",
        "基本ランキング",
        "チーム・選手スタッツ / Injury",
        "基本通知",
        "Unit による商品交換",
      ],
    },
    {
      id: "weekly",
      name: "Weekly",
      price: "¥280",
      period: "/ 7日",
      variant: "pro" as const,
      items: [
        "Free の内容すべて",
        "PRO INSIGHT",
        "直前の重要変化アラート",
        "週次レポート",
        "Pro Skin / Pro Badge",
      ],
    },
    {
      id: "monthly",
      name: "Monthly",
      price: "¥780",
      period: "/ 月",
      variant: "pro" as const,
      items: [
        "Weekly の内容すべて",
        "月次レポート",
        "能力チャートと予想のクセ",
      ],
    },
    {
      id: "season",
      name: "Season Pass",
      price: "¥5,000",
      period: "買い切り",
      variant: "pro" as const,
      items: [
        "Monthly の内容すべて",
        "対象シーズン終了まで",
        "自動更新なし",
      ],
    },
  ],
  features: [
    {
      id: "insight",
      kicker: "PRO INSIGHT",
      title: "試合前に、見るべき点だけを出す",
      text: "無料でも見られるデータを要約し、その試合で重要な分析を 3〜5 件に絞ります。勝敗を断定したり、特定の予想を推奨したりする機能ではありません。最終的な予想は、自分で行います。",
      points: [
        "MATCHUP / 直近の変化 / Injury / スケジュールなど、重要なものだけ表示",
        "各カードに根拠となる数字を添える",
        "重要情報がないときは、無理にカードを作らない",
      ],
      shots: [{ src: "/lp/pro-insght.png", alt: "Uniterz の PRO INSIGHT" }],
    },
    {
      id: "report",
      kicker: "REPORT",
      title: "自分の予想を、週と月で振り返る",
      text: "成績の数字だけでなく、どこが強くてどこが偏っているかを整理します。順位を上げるための加点ではありません。",
      reports: [
        {
          name: "週次レポート",
          plan: "全 Pro プラン",
          text: "その週の結果、WIN / SCORER / UPSET の部門成績、順位の動き、次週の焦点を月曜に確定して届けます。",
        },
        {
          name: "月次レポート",
          plan: "Monthly / Season Pass",
          text: "月間順位、能力チャート、予想のクセ、チーム相性、ハイライトを翌月に確定します。Weekly には含まれません。",
        },
      ],
    },
    {
      id: "skin",
      kicker: "PRO SKIN / BADGE",
      title: "課金者として、見た目で分かる",
      text: "プロフィールとランキングで使える限定背景と、名前横の Pro バッジです。実績バッジもここに並べて表示できます。見た目の差であり、スコアや Unit には影響しません。",
      points: [
        "Pro Skin は加入中に選んで装着できる背景",
        "Pro バッジは名前の横に表示される加入中の印",
        "実績バッジはプロフィールに並べて見せられる",
      ],
      shots: [
        { src: "/lp/proskin.png", alt: "Uniterz の Pro Skin 選択画面" },
        { src: "/lp/profile-proskin.png", alt: "Pro Skin とバッジを付けたプロフィール" },
      ],
    },
    {
      id: "alert",
      kicker: "ALERT",
      title: "見直しが必要な変化だけ知らせる",
      text: "Free でも締切や試合開始は受け取れます。Pro は、重要選手の出場ステータス変更や PRO INSIGHT の更新など、予想を見直す必要が高い変化まで届けます。到達は通信環境などにより保証しません。",
      points: [
        "重要選手の出場可否の変化",
        "PRO INSIGHT の重要な更新",
        "予想済み試合の再確認",
      ],
    },
  ],
  rows: [
    { feature: "試合予想", free: "あり", pro: "あり" },
    { feature: "基本ランキング", free: "あり", pro: "あり" },
    { feature: "チーム・選手データ / Injury", free: "あり", pro: "あり" },
    { feature: "PRO INSIGHT", free: "なし", pro: "あり" },
    { feature: "直前アラート", free: "基本通知", pro: "重要変化まで" },
    { feature: "週次レポート", free: "なし", pro: "あり" },
    { feature: "月次レポート", free: "なし", pro: "Monthly / Season" },
    { feature: "Pro Skin / Badge", free: "なし", pro: "あり" },
    { feature: "Unit 付与・商品交換", free: "同一", pro: "同一" },
  ],
} as const;

export const officialNoGambling = {
  heading: "No Gambling",
  headingJa: "現金を賭けません",
  lead: "Uniterz はベッティングサービスではありません。",
  rules: [
    {
      no: "01",
      title: "現金を賭けない",
      text: "現金を賭けることはできません。",
    },
    {
      no: "02",
      title: "Unit は買えない",
      text: "Unit を購入することはできません。",
    },
    {
      no: "03",
      title: "換金できない",
      text: "Unit を現金に換えることはできません。",
    },
    {
      no: "04",
      title: "予想は無料",
      text: "試合結果の予想は無料で行えます。予想が外れても、財産を失う仕組みではありません。",
    },
  ],
} as const;

export const officialLegal = {
  heading: "Legal",
  headingJa: "法務への取り組み",
  lead: "本ページの説明は、弁護士が了承した範囲の表現にとどめています。",
  items: [
    "サービス設計にあたり、弁護士に相談しています。",
    "利用規約およびプライバシーポリシーは、法的確認を行ったうえで公開しています。",
    "特定商取引法に基づく表記を掲載しています。法人情報は確定後に更新します。",
  ],
  links: [
    { label: "利用規約", href: "/mobile/terms" },
    { label: "プライバシーポリシー", href: "/mobile/privacy" },
    { label: "特定商取引法に基づく表記", href: "/lp-official/tokushoho" },
    { label: "電子公告", href: "/web/electronic-notice" },
    { label: "運営会社", href: "/lp-official/company" },
  ],
} as const;

export const officialFairness = {
  heading: "Fair Play",
  headingJa: "安全性・公平性",
  items: [
    {
      title: "予想締切",
      text: "予想の投稿と変更は試合開始前までです。開始後はロックされます。",
    },
    {
      title: "結果確定",
      text: "試合終了後、公式の試合結果を反映して成績を集計します。",
    },
    {
      title: "不正行為への対応",
      text: "利用規約に反する行為は、調査のうえ利用制限などの対応を行います。",
    },
    {
      title: "ランキングの公平性",
      text: "スコア計算、ランキング参加、Unit 付与の条件は Free / Pro で同一です。有料プラン加入による加点や優遇はありません。",
    },
  ],
} as const;

export const officialFaq = {
  heading: "FAQ",
  headingJa: "よくある質問",
  items: [
    {
      q: "Uniterz とは？",
      a: "NBAなどの試合結果を無料で予想し、的中などの成績をランキングで競うスポーツ予想アプリです。現金を賭けるサービスではありません。",
    },
    {
      q: "無料で使える？",
      a: "試合予想と基本ランキング、チーム・選手データ、Injury 情報は無料で使えます。Pro は分析・通知・レポート・見た目のための有料プランです。",
    },
    {
      q: "お金を賭ける？",
      a: "賭けられません。予想は無料です。外れても財産を失う仕組みではありません。ベッティングサービスではありません。",
    },
    {
      q: "予想はいつまで出せる？",
      a: "投稿も変更も、試合開始前までです。開始後はロックされます。",
    },
    {
      q: "Unit とは？",
      a: "運営が条件達成者に無償で付与するアプリ内報酬ポイントです。ユニフォームなどの NBA グッズと交換できます。",
    },
    {
      q: "Unit は購入・換金できる？",
      a: "できません。購入、換金、払戻し、譲渡、販売はできません。商品との交換にのみ使えます。",
    },
    {
      q: "Unit で何と交換できる？",
      a: "運営が用意したユニフォームなどの NBA グッズです。対象は正規販売店の新品に限ります。カタログはアプリ内で案内します。",
    },
    {
      q: "Pro とは？",
      a: "サブスクリプション型の有料プランです。PRO INSIGHT、直前アラート、週次・月次レポート、Pro Skin とバッジが対象です。予想の参加費ではなく、競技上の優位を与えるものでもありません。",
    },
    {
      q: "Pro に入ると有利になる？",
      a: "なりません。スコアの計算、ランキングへの参加、Unit の付与条件と付与量、商品交換の条件は Free と Pro で同一です。",
    },
    {
      q: "Pro の料金は？",
      a: "iOS（App Store）の税込予定価格は、Weekly ¥280 / 7日、Monthly ¥780 / 月、Season Pass ¥5,000（対象シーズン終了までの買い切り）です。月次レポートは Monthly と Season Pass のみです。地域やストアによって異なる場合があります。",
    },
    {
      q: "Pro の解約は？",
      a: "購入したストアのサブスクリプション管理画面から行います。アプリを削除しても定期購入は解約されません。解約後も、支払済みの期間が終わるまでは Pro を利用できます。",
    },
    {
      q: "NBA の公式サービス？",
      a: "違います。NBA、チーム、選手等の名称・ロゴは各権利者に帰属します。Uniterz は NBA またはその関係会社の公式サービスではありません。",
    },
    {
      q: "いつリリース？",
      a: "iOS 向けに公開準備中です。公開日は決まり次第、このページで案内します。",
    },
    {
      q: "対応端末は？",
      a: "まずは iOS を予定しています。その他の端末は未定です。",
    },
  ],
} as const;

export const officialContact = {
  heading: "Contact",
  headingJa: "お問い合わせ",
  lead: `会社・提携・スポンサー等の一般窓口は ${INFO_EMAIL} です。アプリの不具合・アカウント・返金は ${SUPPORT_EMAIL} へお願いします。`,
} as const;

export const officialTokushoho = {
  heading: TOKUSHOHO_HEADING,
  lead: TOKUSHOHO_LEAD,
  rows: TOKUSHOHO_ROWS,
} as const;
