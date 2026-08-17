/**
 * Pro 課金プレビュー用 — プラン定義（docs/pro-billing-design.md）
 * Gap / Shadow は V1 対象外のため課金コピーから除外。
 */

export type ProSubscribePreviewPlanId = "weekly" | "monthly" | "season";

export type ProSubscribeFeatureIcon =
  | "insight"
  | "alert"
  | "rank"
  | "badge"
  | "skin"
  | "proLeague"
  | "weeklyReport"
  | "monthlyReport"
  | "season";

export type ProSubscribePreviewFeature = {
  icon: ProSubscribeFeatureIcon;
  titleJa: string;
  titleEn: string;
  detailJa: string;
  detailEn: string;
};

export type ProSubscribePreviewPlan = {
  id: ProSubscribePreviewPlanId;
  labelJa: string;
  labelEn: string;
  /** 表示用価格（プレビュー仮） */
  priceJa: string;
  priceEn: string;
  periodJa: string;
  periodEn: string;
  badgeJa?: string;
  badgeEn?: string;
  blurbJa: string;
  blurbEn: string;
  features: readonly ProSubscribePreviewFeature[];
  /** 並び・強調 */
  recommended?: boolean;
};

/** Weekly 含む共通（Gap・Shadow なし） */
const CORE_FEATURES: readonly ProSubscribePreviewFeature[] = [
  {
    icon: "insight",
    titleJa: "Pro Insight（試合前の読み）",
    titleEn: "Pro Insight",
    detailJa:
      "この試合で見るべきポイントが分かる。マッチアップ・日程・状況を短く整理",
    detailEn:
      "See what matters for this matchup—schedule & context, briefly.",
  },
  {
    icon: "alert",
    titleJa: "試合直前アラート",
    titleEn: "Pre-tipoff alerts",
    detailJa: "欠場・先発変更など、予想を見直す材料だけを通知",
    detailEn:
      "Injury / lineup changes that matter—only when you should revisit.",
  },
  {
    icon: "rank",
    titleJa: "My Rank Pro",
    titleEn: "My Rank Pro",
    detailJa: "TOP%、次の帯までの点数、進捗グラフが広がる",
    detailEn: "TOP%, points to the next band, and a longer progress graph.",
  },
  {
    icon: "badge",
    titleJa: "Pro バッジ",
    titleEn: "Pro badge",
    detailJa: "プロフィールやランキングに Pro バッジが表示される",
    detailEn: "A Pro badge on your profile and rankings.",
  },
  {
    icon: "skin",
    titleJa: "Pro Skin",
    titleEn: "Pro Skin",
    detailJa: "プロフィールカードの背景スキンを選べる",
    detailEn: "Choose a background skin for your profile card.",
  },
  {
    icon: "proLeague",
    titleJa: "PRO LEAGUE（無差別級）",
    titleEn: "PRO LEAGUE",
    detailJa: "全試合対象の Pro 限定ランキングに参加・閲覧できる",
    detailEn: "Join and view the Pro-only all-games ranking board.",
  },
];

/** Monthly / Season 向け（Shadow は V1 対象外） */
const WEEKLY_REPORT: ProSubscribePreviewFeature = {
  icon: "weeklyReport",
  titleJa: "週次レポート",
  titleEn: "Weekly report",
  detailJa: "毎週月曜に確定。順位・ライバル・次のターゲットが届く",
  detailEn: "Finals each Monday—rank, rivals, and your next target.",
};

const MONTHLY_REPORT: ProSubscribePreviewFeature = {
  icon: "monthlyReport",
  titleJa: "月次レポート",
  titleEn: "Monthly report",
  detailJa: "レーダー・クセ・相性など、自分の傾向のまとめが届く",
  detailEn: "Radar, habits, affinity—your monthly self-analysis.",
};

const SEASON_EXTRA: ProSubscribePreviewFeature = {
  icon: "season",
  titleJa: "シーズン通し + 振り返り",
  titleEn: "Full season + recap",
  detailJa: "シーズン終了まで Pro。大会／シーズンの振り返り（予定）",
  detailEn: "Pro through the season, plus a season recap (planned).",
};

export const PRO_SUBSCRIBE_PREVIEW_PLANS: readonly ProSubscribePreviewPlan[] = [
  {
    id: "weekly",
    labelJa: "Weekly",
    labelEn: "Weekly",
    priceJa: "¥280",
    priceEn: "¥280",
    periodJa: "/ 週",
    periodEn: "/ week",
    badgeJa: "7日無料",
    badgeEn: "7-day free",
    blurbJa: "まずは1週間。気軽に Pro を体験 · 初回7日無料",
    blurbEn: "Start with one week. Try Pro lightly · 7-day trial first",
    features: [...CORE_FEATURES, WEEKLY_REPORT],
  },
  {
    id: "monthly",
    labelJa: "Monthly",
    labelEn: "Monthly",
    priceJa: "¥780",
    priceEn: "¥780",
    periodJa: "/ 月",
    periodEn: "/ month",
    badgeJa: "7日無料",
    badgeEn: "7-day free",
    recommended: true,
    blurbJa: "毎週ランキングを追う人の定番 · 初回7日無料",
    blurbEn: "Standard for ranking chasers · 7-day trial first",
    features: [...CORE_FEATURES, WEEKLY_REPORT, MONTHLY_REPORT],
  },
  {
    id: "season",
    labelJa: "Season Pass",
    labelEn: "Season Pass",
    priceJa: "¥5,000",
    priceEn: "¥5,000",
    periodJa: "/ シーズン",
    periodEn: "/ season",
    badgeJa: "買い切り",
    badgeEn: "One-time",
    blurbJa: "シーズン通しで使う人向け。自動更新なし・途中解約の返金なし。",
    blurbEn: "Full season access. No auto-renew / no mid-season refund.",
    features: [...CORE_FEATURES, WEEKLY_REPORT, MONTHLY_REPORT, SEASON_EXTRA],
  },
];

export function proSubscribePreviewPlanById(
  id: ProSubscribePreviewPlanId
): ProSubscribePreviewPlan {
  return (
    PRO_SUBSCRIBE_PREVIEW_PLANS.find((p) => p.id === id) ??
    PRO_SUBSCRIBE_PREVIEW_PLANS[1]!
  );
}
