import { coerceTotalPointsRank } from "@/lib/profile/resolvePlayoffTotalPointsRank";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

export type RankHistoryContext = {
  rankingLeague: RankingLeagueSource;
};

/** rankSnapshotHistory doc から totalPoints 順位を読む（NBA は現行シーズンのみ） */
export function readTotalPointsRankFromHistoryDoc(
  data: Record<string, unknown> | null | undefined,
  _context: RankHistoryContext
): number | null {
  if (!data) return null;

  const seasons = data.seasons as
    | Record<string, Record<string, unknown>>
    | undefined;
  return coerceTotalPointsRank(
    seasons?.[CURRENT_NBA_SEASON_KEY]?.totalPoints
  );
}

/** cumulative_stats の snapshotRanks から現在の totalPoints 順位 */
export function readTotalPointsRankFromSnapshotRanks(
  cumulative: Record<string, unknown> | null | undefined,
  _context: RankHistoryContext
): number | null {
  if (!cumulative) return null;
  const snapshotRanks = cumulative.snapshotRanks as
    | Record<string, unknown>
    | undefined;
  if (!snapshotRanks) return null;

  const seasons = snapshotRanks.seasons as
    | Record<string, Record<string, unknown>>
    | undefined;
  return coerceTotalPointsRank(
    seasons?.[CURRENT_NBA_SEASON_KEY]?.totalPoints
  );
}
