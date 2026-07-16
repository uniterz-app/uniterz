import { coerceTotalPointsRank } from "@/lib/profile/resolvePlayoffTotalPointsRank";
import type { PlayoffRoundKey } from "@/lib/rankings/playoffRound";
import type { RankingPhase } from "@/lib/rankings/rankingPhase";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import type { WcRankingStage } from "@/lib/rankings/wcRankingStage";

export type RankHistoryContext = {
  rankingLeague: RankingLeagueSource;
  phase: RankingPhase;
  round: PlayoffRoundKey;
  wcStage: WcRankingStage | null;
};

/** rankSnapshotHistory doc から totalPoints 順位を読む */
export function readTotalPointsRankFromHistoryDoc(
  data: Record<string, unknown> | null | undefined,
  context: RankHistoryContext
): number | null {
  if (!data) return null;

  if (context.rankingLeague === "worldcup") {
    const stage = context.wcStage ?? "main";
    const wc = data.wc as Record<string, Record<string, unknown>> | undefined;
    return coerceTotalPointsRank(wc?.[stage]?.totalPoints);
  }

  if (context.phase === "playoffs" && context.round !== "overall") {
    const rounds = data.playoffRounds as
      | Record<string, Record<string, unknown>>
      | undefined;
    return coerceTotalPointsRank(rounds?.[context.round]?.totalPoints);
  }

  if (context.phase === "play_in") {
    const playIn = data.play_in as Record<string, unknown> | undefined;
    return coerceTotalPointsRank(playIn?.totalPoints);
  }

  const playoffs = data.playoffs as Record<string, unknown> | undefined;
  return coerceTotalPointsRank(playoffs?.totalPoints);
}

/** cumulative_stats の snapshotRanks から現在の totalPoints 順位 */
export function readTotalPointsRankFromSnapshotRanks(
  cumulative: Record<string, unknown> | null | undefined,
  context: RankHistoryContext
): number | null {
  if (!cumulative) return null;
  const snapshotRanks = cumulative.snapshotRanks as
    | Record<string, unknown>
    | undefined;
  if (!snapshotRanks) return null;

  if (context.rankingLeague === "worldcup") {
    const stage = context.wcStage ?? "main";
    const wc = snapshotRanks.wc as Record<string, Record<string, unknown>> | undefined;
    return coerceTotalPointsRank(wc?.[stage]?.totalPoints);
  }

  if (context.phase === "playoffs" && context.round !== "overall") {
    const rounds = snapshotRanks.playoffRounds as
      | Record<string, Record<string, unknown>>
      | undefined;
    return coerceTotalPointsRank(rounds?.[context.round]?.totalPoints);
  }

  if (context.phase === "play_in") {
    const playIn = snapshotRanks.play_in as Record<string, unknown> | undefined;
    return coerceTotalPointsRank(playIn?.totalPoints);
  }

  const playoffs = snapshotRanks.playoffs as Record<string, unknown> | undefined;
  return coerceTotalPointsRank(playoffs?.totalPoints);
}
