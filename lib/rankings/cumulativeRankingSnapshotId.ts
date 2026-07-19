import {
  CURRENT_NBA_SEASON_KEY,
  nbaSeasonSnapshotDocId,
} from "@/lib/rankings/nbaSeason";
import type { WcRankingStage } from "@/lib/rankings/wcRankingStage";

export function resolveCumulativeRankingSnapshotDocId(input: {
  metric: string;
  wcStage: WcRankingStage | null;
}): string {
  if (input.wcStage) {
    return `wc_${input.wcStage}_${input.metric}`;
  }
  return nbaSeasonSnapshotDocId(CURRENT_NBA_SEASON_KEY, input.metric);
}
