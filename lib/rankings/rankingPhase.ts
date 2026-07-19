/**
 * NBA ランキングは 26-27 以降シーズンキー（lib/rankings/nbaSeason.ts）で管理する。
 * `playoffs` は旧 UI 互換のための唯一のフェーズ値（= NBA 現行シーズンボード）。
 */
export type RankingPhase = "playoffs";

export const RANKING_PHASES: RankingPhase[] = ["playoffs"];

/** Matches Functions: cumulative_stats/{uid}/rankSnapshotHistory/{yyyy-mm-dd} */
export const RANK_SNAPSHOT_HISTORY_SUBCOL = "rankSnapshotHistory" as const;

export function isRankingPhase(v: string | null | undefined): v is RankingPhase {
  return v === "playoffs";
}
