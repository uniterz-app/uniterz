/**
 * Pro 課金プレビュー用 — プラン定義（価格は仮。説明文は checklist §0.1.a）
 * Gap は迷い中のため課金コピーから除外。
 */

export type ProSubscribePreviewPlanId = "weekly" | "monthly" | "season";

export type ProSubscribePreviewFeature = {
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
    titleJa: "Pro Insight（試合前の読み）",
    titleEn: "Pro Insight",
    detailJa:
      "この試合で見るべきポイントが分かる。マッチアップ・日程・状況を短く整理",
    detailEn:
      "See what matters for this matchup—schedule & context, briefly.",
  },
  {
    titleJa: "My Rank Pro",
    titleEn: "My Rank Pro",
    detailJa: "TOP%、次の帯までの点数、進捗グラフが広がる",
    detailEn: "TOP%, points to the next band, and a longer progress graph.",
  },
  {
    titleJa: "Pro バッジ",
    titleEn: "Pro badge",
    detailJa: "プロフィールやランキングに Pro バッジが表示される",
    detailEn: "A Pro badge on your profile and rankings.",
  },
  {
    titleJa: "Pro Skin",
    titleEn: "Pro Skin",
    detailJa: "プロフィールカードの背景スキンを選べる",
    detailEn: "Choose a background skin for your profile card.",
  },
];

/** Monthly / Season 向け */
const SHADOW_FEATURE: ProSubscribePreviewFeature = {
  titleJa: "Shadow（ライバル帯）",
  titleEn: "Shadow (rival band)",
  detailJa:
    "先週同じ順位帯だった人との今週の差が分かる。個人の予想は非公開",
  detailEn:
    "Compare this week’s progress with last week’s rank band. Individual picks stay private.",
};

const WEEKLY_REPORT: ProSubscribePreviewFeature = {
  titleJa: "週次レポート",
  titleEn: "Weekly report",
  detailJa: "帯の動きの要約が届く",
  detailEn: "A short summary of how your band moved this week.",
};

const MONTHLY_REPORT: ProSubscribePreviewFeature = {
  titleJa: "月次レポート",
  titleEn: "Monthly report",
  detailJa: "自分の傾向のまとめが届く",
  detailEn: "A monthly summary of your trends and performance.",
};

const SEASON_EXTRA: ProSubscribePreviewFeature = {
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
    features: [...CORE_FEATURES, SHADOW_FEATURE, WEEKLY_REPORT, MONTHLY_REPORT],
  },
  {
    id: "season",
    labelJa: "Season Pass",
    labelEn: "Season Pass",
    priceJa: "¥4,800",
    priceEn: "¥4,800",
    periodJa: "/ シーズン",
    periodEn: "/ season",
    badgeJa: "お得",
    badgeEn: "Best value",
    blurbJa: "シーズン通しで使う人向け。途中解約の返金なし（方針仮）。",
    blurbEn: "Full season access. No mid-season refund (draft policy).",
    features: [
      ...CORE_FEATURES,
      SHADOW_FEATURE,
      WEEKLY_REPORT,
      MONTHLY_REPORT,
      SEASON_EXTRA,
    ],
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
