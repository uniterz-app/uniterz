import {
  CURRENT_NBA_SEASON_KEY,
  nbaSeasonSnapshotDocId,
} from "@/lib/rankings/nbaSeason";

/** 累積ランキング一覧スナップショット doc ID（NBA シーズンのみ） */
export function resolveCumulativeRankingSnapshotDocId(input: {
  metric: string;
  /** @deprecated WC 廃止 — 無視 */
  wcStage?: unknown;
}): string {
  return nbaSeasonSnapshotDocId(CURRENT_NBA_SEASON_KEY, input.metric);
}
