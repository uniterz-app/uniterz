import type { PlayoffRoundKey } from "@/lib/rankings/playoffRound";
import type { RankingPhase } from "@/lib/rankings/rankingPhase";
import type { WcRankingStage } from "@/lib/rankings/wcRankingStage";

export function resolveCumulativeRankingSnapshotDocId(input: {
  phase: RankingPhase;
  round: PlayoffRoundKey;
  metric: string;
  wcStage: WcRankingStage | null;
}): string {
  if (input.wcStage) {
    return `wc_${input.wcStage}_${input.metric}`;
  }
  if (input.round === "overall") {
    return `${input.phase}_${input.metric}`;
  }
  return `${input.phase}_${input.round}_${input.metric}`;
}
