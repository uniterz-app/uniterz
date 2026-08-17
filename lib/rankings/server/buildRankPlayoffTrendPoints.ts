import { coerceTotalPointsRank } from "@/lib/profile/resolvePlayoffTotalPointsRank";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { loadRankSnapshotHistoryDocsWalkBack } from "@/lib/rankings/server/loadRankSnapshotHistoryDocs";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";

/** ランキングスナップショット最新 N 件（「過去 N 日」ではない） */
export const RANK_PLAYOFF_TREND_MAX_POINTS = 10;

export type RankPlayoffTrendPoint = {
  dateKey: string;
  rank: number;
};

type HistoryDoc = {
  seasons?: Partial<Record<string, Record<string, unknown>>>;
};

function rankFromHistoryDoc(
  data: HistoryDoc | undefined,
  opts: {
    /** NBA: 明示キーのみ。省略時は現行。前シーズンへは落とさない */
    seasonKey?: string;
  }
): number | null {
  if (!data) return null;
  const seasonKey = opts.seasonKey ?? CURRENT_NBA_SEASON_KEY;
  return coerceTotalPointsRank(data.seasons?.[seasonKey]?.totalPoints);
}

/**
 * cumulative_stats/{uid}/rankSnapshotHistory から総合得点順位の推移を返す。
 * NBA は seasons.<CURRENT_NBA_SEASON_KEY> のみ（前シーズンフォールバックなし）。
 */
export async function buildRankPlayoffTrendPoints(
  uid: string,
  opts: {
    rankingLeague: RankingLeagueSource;
    maxPoints?: number;
    maxLookbackDays?: number;
    seasonKey?: string;
  }
): Promise<RankPlayoffTrendPoint[]> {
  void opts.rankingLeague;
  const maxPoints = opts.maxPoints ?? RANK_PLAYOFF_TREND_MAX_POINTS;
  const seasonKey = opts.seasonKey ?? CURRENT_NBA_SEASON_KEY;
  const historyDocs = await loadRankSnapshotHistoryDocsWalkBack(uid, {
    maxDocs: maxPoints,
    maxLookbackDays: opts.maxLookbackDays ?? 90,
  });

  const points: RankPlayoffTrendPoint[] = [];
  for (const d of historyDocs) {
    const rank = rankFromHistoryDoc(d.data as HistoryDoc, { seasonKey });
    if (rank != null) {
      points.push({ dateKey: d.id, rank });
    }
  }

  return points;
}
