export type RankingPhase = "play_in" | "playoffs";

export const RANKING_PHASES: RankingPhase[] = ["play_in", "playoffs"];

/** Matches Functions: cumulative_stats/{uid}/rankSnapshotHistory/{yyyy-mm-dd} */
export const RANK_SNAPSHOT_HISTORY_SUBCOL = "rankSnapshotHistory" as const;

export function isRankingPhase(v: string | null | undefined): v is RankingPhase {
  return v === "play_in" || v === "playoffs";
}
