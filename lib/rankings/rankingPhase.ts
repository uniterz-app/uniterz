export type RankingPhase = "play_in" | "playoffs";

export const RANKING_PHASES: RankingPhase[] = ["play_in", "playoffs"];

/**
 * Cloud Function `buildCumulativeRankingSnapshot` が日次で更新するフェーズ。
 * プレーイン終了後は `playoffs` のみ更新し、プレーインは Firestore 上の最終スナップショットをそのまま表示する。
 * （functions の `SNAPSHOT_BUILD_PHASES` と同期すること）
 */
export const RANKING_SNAPSHOT_BUILD_PHASES: RankingPhase[] = ["playoffs"];

export function isRankingSnapshotBuiltDailyForPhase(
  phase: RankingPhase
): boolean {
  return RANKING_SNAPSHOT_BUILD_PHASES.includes(phase);
}

/** Matches Functions: cumulative_stats/{uid}/rankSnapshotHistory/{yyyy-mm-dd} */
export const RANK_SNAPSHOT_HISTORY_SUBCOL = "rankSnapshotHistory" as const;

export function isRankingPhase(v: string | null | undefined): v is RankingPhase {
  return v === "play_in" || v === "playoffs";
}
