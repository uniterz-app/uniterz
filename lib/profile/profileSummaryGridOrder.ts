/**
 * プロフィール概要サマリーカードの並び（Web とネイティブで共有）
 *
 * - 無料: `SummaryCardsV2` compact（`grid-cols-2`）の DOM 順（Web / `MobileProfileViewV2` 非 Pro と同一）
 * - Pro: `WebProfileViewV2` は Row1 が AnalysisWin | MaxStreak | ScorePrecision（3 列）、Row2 が Upset | Total。
 *   `MobileProfileViewV2` は Row1 が AnalysisWin（広）| MaxStreak、Row2 が Precision | Upset、Row3 が Total 幅広。
 *   いずれも AnalysisWin を投稿数・勝率の 2 スロットに割ったあと、視覚順は次の配列と一致する。
 */

/** Web `SummaryCardsV2` compact（無料）と同一 */
export const profileSummaryGridKeysFreeTier = [
  "posts",
  "winrate",
  "precision",
  "upset",
  "streak",
  "total",
] as const;

/**
 * Pro 概要（Web デスクトップ・モバイル共通の視覚順を 2 列×3 行に畳んだもの）
 * posts → winrate → max streak → score precision → upset → total
 */
export const profileSummaryGridKeysProOverview = [
  "posts",
  "winrate",
  "streak",
  "precision",
  "upset",
  "total",
] as const;

export type ProfileSummaryCellKey =
  (typeof profileSummaryGridKeysFreeTier)[number];
