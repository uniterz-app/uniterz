import type { WcRankingStage } from "@/lib/rankings/wcRankingStage";

function signedActiveWinStreak(raw: unknown): number {
  return typeof raw === "number" && Number.isFinite(raw) && raw > 0 ? raw : 0;
}

/** cumulative_stats の WC 全体連勝（qualifying + main 合算） */
export function activeFootballStreakFromCumulative(
  data: Record<string, unknown>
): number {
  const signed =
    data.activeWinStreakFootball ??
    (data.streakBySport as Record<string, unknown> | undefined)?.football ??
    data.streakFootball ??
    0;
  return signedActiveWinStreak(signed);
}

/**
 * WC ランキングステージ別の現在連勝。
 * qualifying / main はステージ内のみ（グループ連勝をノックアウトタブに混ぜない）。
 */
export function activeFootballStreakForWcStage(
  data: Record<string, unknown>,
  wcStage: WcRankingStage
): number {
  if (wcStage === "overall") {
    return activeFootballStreakFromCumulative(data);
  }

  const block = (
    data.rankingByWcStage as Record<string, Record<string, unknown>> | undefined
  )?.[wcStage];
  if (block && typeof block.activeWinStreak === "number") {
    return signedActiveWinStreak(block.activeWinStreak);
  }

  const byStage = (data.activeWinStreakByWcStage ?? {}) as Record<string, unknown>;
  const live = byStage[wcStage];
  if (typeof live === "number") {
    return signedActiveWinStreak(live);
  }

  return 0;
}
