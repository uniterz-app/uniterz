import type { GamePointsTopEntryV1 } from "@/lib/results/gamePointsTop";

/**
 * この試合の得点上位。
 * `games.pointsSummary.top` を正とし、無いときだけ旧 `pointsDistribution.top`。
 * 期間ランキング（cumulative / community leaderboard）とは混ぜない。
 */
export function resolveResultTopEntries(input: {
  pointsSummary?: { top?: GamePointsTopEntryV1[] } | null;
  pointsDistribution?: { top?: GamePointsTopEntryV1[] } | null;
}): GamePointsTopEntryV1[] {
  const summaryTop = input.pointsSummary?.top;
  if (Array.isArray(summaryTop) && summaryTop.length > 0) return summaryTop;
  const distTop = input.pointsDistribution?.top;
  if (Array.isArray(distTop) && distTop.length > 0) return distTop;
  return [];
}
