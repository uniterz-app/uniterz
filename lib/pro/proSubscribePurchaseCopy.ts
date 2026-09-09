/**
 * Get Pro 購入ページ用コピー（Web / Native 共通）。
 * 終了日の正: lib/legal/companyInfo.ts `SEASON_PASS_END_MONTH_DAY`
 */

import { SEASON_PASS_END_MONTH_DAY } from "@/lib/legal/companyInfo";
import { CURRENT_NBA_SEASON_KEY, nbaSeasonKeyFromDateJST } from "@/lib/rankings/nbaSeason";

export type ProSubscribeLang = "ja" | "en";

/** `"2026-27"` → 終了年 2027（原則 7/31） */
export function seasonPassEndYear(seasonKey: string): number {
  const start = Number.parseInt(seasonKey.slice(0, 4), 10);
  return Number.isFinite(start) ? start + 1 : new Date().getFullYear() + 1;
}

export function seasonPassTargetLabel(
  lang: ProSubscribeLang,
  now = new Date()
): string {
  const key = nbaSeasonKeyFromDateJST(now);
  const endY = seasonPassEndYear(key);
  return lang === "ja"
    ? `${key} · 〜${endY}/7/31`
    : `${key} · until ${endY}/7/31`;
}

export function seasonPassPeriodShort(
  lang: ProSubscribeLang,
  now = new Date()
): string {
  const key = nbaSeasonKeyFromDateJST(now);
  const endY = seasonPassEndYear(key);
  return lang === "ja" ? `〜${endY}/7/31` : `until ${endY}/7/31`;
}

export function seasonPassBlurb(lang: ProSubscribeLang, now = new Date()): string {
  const key = nbaSeasonKeyFromDateJST(now);
  const endY = seasonPassEndYear(key);
  if (lang === "ja") {
    return `${key} シーズン終了（原則 ${endY}/7/31・${SEASON_PASS_END_MONTH_DAY}）まで Pro。自動更新なし。途中解約の返金なし。次シーズンは再購入。`;
  }
  return `Pro through ${key} (through ${endY}/7/31). No auto-renew. No mid-season refund. Buy again next season.`;
}

export type PlanDiffCell = "yes" | "no";

export type PlanDiffRow = {
  id: string;
  labelJa: string;
  labelEn: string;
  weekly: PlanDiffCell;
  monthly: PlanDiffCell;
  season: PlanDiffCell;
};

/** スクロールなしで見せるプラン差（購入ページ上部） */
export const PRO_SUBSCRIBE_PLAN_DIFF_ROWS: readonly PlanDiffRow[] = [
  {
    id: "monthlyReport",
    labelJa: "月次レポート",
    labelEn: "Monthly report",
    weekly: "no",
    monthly: "yes",
    season: "yes",
  },
  {
    id: "trial",
    labelJa: "7日無料",
    labelEn: "7-day trial",
    weekly: "yes",
    monthly: "yes",
    season: "no",
  },
];

export function planDiffTitle(lang: ProSubscribeLang): string {
  return lang === "ja" ? "プランのちがい" : "Plan differences";
}

export function planDiffColLabel(
  col: "weekly" | "monthly" | "season",
  lang: ProSubscribeLang
): string {
  if (col === "weekly") return "Weekly";
  if (col === "monthly") return "Monthly";
  return lang === "ja" ? "Season" : "Season";
}

export function planDiffCellLabel(cell: PlanDiffCell, lang: ProSubscribeLang): string {
  if (cell === "yes") return lang === "ja" ? "あり" : "Yes";
  return lang === "ja" ? "なし" : "No";
}

export function trialConditionsTitle(lang: ProSubscribeLang): string {
  return lang === "ja" ? "無料トライアル" : "Free trial";
}

/** トライアル条件（購入ページ常時表示） */
export function trialConditionLines(lang: ProSubscribeLang): readonly string[] {
  if (lang === "ja") {
    return [
      "Weekly / Monthly の初回のみ（アカウントあたり原則1回）。Season Pass は対象外。",
      "お試し開始から7日後に初回請求（Weekly ¥280 / 週、Monthly ¥780 / 月。ストア表示を優先）。",
      "無料期間中に解約すれば課金されません。解約しなければ自動で有料に切り替わります。",
    ];
  }
  return [
    "First time only on Weekly / Monthly (generally once per account). Season Pass has no trial.",
    "First charge 7 days after trial starts (Weekly ¥280/week, Monthly ¥780/month; store price wins).",
    "Cancel during the free period and you won’t be charged. Otherwise it auto-renews to paid.",
  ];
}

export function purchaseDisclaimer(lang: ProSubscribeLang): string {
  return lang === "ja"
    ? "他人の予想は見せません。勝者は断言しません。"
    : "We never show others’ picks or declare winners.";
}

export type ProLegalLinkKind = "terms" | "privacy" | "tokushoho";

export function proLegalLinkLabel(
  kind: ProLegalLinkKind,
  lang: ProSubscribeLang
): string {
  if (kind === "terms") return lang === "ja" ? "利用規約" : "Terms";
  if (kind === "privacy") return lang === "ja" ? "プライバシー" : "Privacy";
  return lang === "ja" ? "特定商取引法" : "Legal notice";
}

/** モバイル Web パス（デスクトップは /web/* に差し替え） */
export const PRO_LEGAL_PATHS_MOBILE = {
  terms: "/mobile/terms",
  privacy: "/mobile/privacy",
  tokushoho: "/mobile/law",
} as const;

export const PRO_LEGAL_PATHS_WEB = {
  terms: "/web/terms",
  privacy: "/web/privacy",
  tokushoho: "/web/law",
} as const;

export function restorePurchasesLabel(lang: ProSubscribeLang): string {
  return lang === "ja" ? "購入を復元" : "Restore Purchases";
}

export function currentSeasonPassKey(): string {
  return CURRENT_NBA_SEASON_KEY;
}
