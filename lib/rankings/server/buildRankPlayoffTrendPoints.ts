import { getAdminDb } from "@/lib/firebaseAdmin";
import { profileChartsDocId } from "@/lib/profile/profileChartsDivision";
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
  openSeasons?: Partial<Record<string, Record<string, unknown>>>;
};

function rankFromHistoryDoc(
  data: HistoryDoc | undefined,
  opts: {
    /** NBA: 明示キーのみ。省略時は現行。前シーズンへは落とさない */
    seasonKey?: string;
    /** open は PRO LEAGUE（openSeasons） */
    division?: "pickup" | "open";
  }
): number | null {
  if (!data) return null;
  const seasonKey = opts.seasonKey ?? CURRENT_NBA_SEASON_KEY;
  const block = opts.division === "open" ? data.openSeasons : data.seasons;
  return coerceTotalPointsRank(block?.[seasonKey]?.totalPoints);
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
    division?: "pickup" | "open";
  }
): Promise<RankPlayoffTrendPoint[]> {
  void opts.rankingLeague;
  const maxPoints = opts.maxPoints ?? RANK_PLAYOFF_TREND_MAX_POINTS;
  const seasonKey = opts.seasonKey ?? CURRENT_NBA_SEASON_KEY;
  const division = opts.division === "open" ? "open" : "pickup";
  const historyDocs = await loadRankSnapshotHistoryDocsWalkBack(uid, {
    maxDocs: maxPoints,
    maxLookbackDays: opts.maxLookbackDays ?? 90,
  });

  const points: RankPlayoffTrendPoint[] = [];
  const seen = new Set<string>();
  for (const d of historyDocs) {
    const rank = rankFromHistoryDoc(d.data as HistoryDoc, { seasonKey, division });
    if (rank == null || seen.has(d.id)) continue;
    seen.add(d.id);
    points.push({ dateKey: d.id, rank });
  }

  if (division === "open") {
    const chartSnap = await getAdminDb()
      .doc(
        `cumulative_stats/${uid}/profileCharts/${profileChartsDocId(seasonKey, "open")}`
      )
      .get();
    const raw = chartSnap.data()?.rankTrend;
    if (Array.isArray(raw)) {
      for (const item of raw) {
        if (!item || typeof item !== "object") continue;
        const dateKey = (item as { dateKey?: unknown }).dateKey;
        const rank = coerceTotalPointsRank((item as { rank?: unknown }).rank);
        if (typeof dateKey !== "string" || rank == null || seen.has(dateKey)) {
          continue;
        }
        seen.add(dateKey);
        points.push({ dateKey, rank });
      }
    }
  }

  points.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  if (points.length <= maxPoints) return points;
  return points.slice(points.length - maxPoints);
}
