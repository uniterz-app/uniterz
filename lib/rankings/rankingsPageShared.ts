import type { MobileMetric } from "@/app/component/rankings/_data/mockRows";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import type { RankingPhase } from "@/lib/rankings/rankingPhase";
import type { PlayoffRoundKey } from "@/lib/rankings/playoffRound";
import type { WcRankingStage } from "@/lib/rankings/wcRankingStage";
import type { RankingRow } from "@/lib/rankings/useRanking";
import { minPostsForWinRate } from "@/lib/rankings/winRateMinPosts";

function safeRank(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) && v >= 1
    ? Math.floor(v)
    : null;
}

function safeRankDelta(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) && v !== 0
    ? Math.trunc(v)
    : null;
}

type ListRankRow = { uid?: string; rank?: number; rankDeltaPlaces?: number | null };

function rankFromListRows(
  rows: unknown[] | undefined,
  uid: string
): ListRankRow | null {
  if (!Array.isArray(rows)) return null;
  for (const row of rows) {
    const r = row as ListRankRow;
    if (r?.uid !== uid) continue;
    const rank = safeRank(r.rank);
    if (rank == null) return null;
    return { uid, rank, rankDeltaPlaces: r.rankDeltaPlaces };
  }
  return null;
}

/** MyRankCard 用 — API myRank → myRow.rank → 一覧行の順 */
export function resolveMyRankForCard(input: {
  myUid: string | null | undefined;
  myRank?: number | null;
  myRankDeltaPlaces?: number | null;
  myRow?: { rank?: number; rankDeltaPlaces?: number | null } | null;
  listRows?: unknown[];
}): { myRank: number | null; myRankDeltaPlaces: number | null } {
  const directRank = safeRank(input.myRank);
  if (directRank != null) {
    return {
      myRank: directRank,
      myRankDeltaPlaces: safeRankDelta(input.myRankDeltaPlaces),
    };
  }

  const rowRank = safeRank(input.myRow?.rank);
  if (rowRank != null) {
    return {
      myRank: rowRank,
      myRankDeltaPlaces:
        safeRankDelta(input.myRankDeltaPlaces) ??
        safeRankDelta(input.myRow?.rankDeltaPlaces),
    };
  }

  if (input.myUid) {
    const fromList = rankFromListRows(input.listRows, input.myUid);
    if (fromList?.rank != null) {
      return {
        myRank: fromList.rank,
        myRankDeltaPlaces:
          safeRankDelta(input.myRankDeltaPlaces) ??
          safeRankDelta(fromList.rankDeltaPlaces),
      };
    }
  }

  return { myRank: null, myRankDeltaPlaces: null };
}

/** 自分の指標値（MyRankCard 用） */
export function getMyMetricValue(
  metric: MobileMetric,
  row: RankingRow | null | undefined
): number {
  if (!row) return 0;

  if (metric === "totalScore") return row.totalPoints ?? 0;
  if (metric === "marginPrecision") return row.totalPrecision ?? 0;
  if (metric === "exactHits") return row.totalExactHits ?? row.totalPrecision ?? 0;
  if (metric === "upsetScore") return row.totalUpset ?? 0;

  if (metric === "winRate") {
    const raw = row.winRate ?? 0;
    return raw <= 1 ? Math.round(raw * 100) : Math.round(raw);
  }

  if (metric === "goalScorerHits") return row.totalGoalScorerHits ?? 0;

  return row.activeWinStreak ?? 0;
}

/** 勝率ランキングの最低投稿数 */
export function computeWinRateMinPosts(
  rankingLeague: RankingLeagueSource,
  phase: RankingPhase,
  round: PlayoffRoundKey,
  wcStage?: WcRankingStage | null
): number {
  return minPostsForWinRate({ rankingLeague, phase, round, wcStage });
}

export function buildRankingsPageKey(input: {
  phase: RankingPhase;
  effectiveRound: PlayoffRoundKey;
  metric: MobileMetric;
  rankingLeague: RankingLeagueSource;
  wcStage?: WcRankingStage | null;
}): string {
  const { phase, effectiveRound, metric, rankingLeague, wcStage } = input;
  if (rankingLeague === "worldcup") {
    return `${phase}-${effectiveRound}-${wcStage ?? "overall"}-${metric}`;
  }
  return `${phase}-${effectiveRound}-${metric}`;
}

export function computeRankingListContentReady(input: {
  listReady: boolean;
  /** 現在タブの指標バンドルが取得済みか */
  metricReady: boolean;
}): boolean {
  // 一覧本体（totalPoints）は metric タブより先に出す
  return input.listReady;
}

export function computeRankingHasNoEntries(input: {
  listReady: boolean;
  metricReady: boolean;
  rowsLength: number;
  rankingLeague: RankingLeagueSource;
  rankingListCount: number;
}): boolean {
  const { listReady, metricReady, rowsLength, rankingLeague, rankingListCount } =
    input;
  return (
    listReady &&
    metricReady &&
    (rowsLength === 0 ||
      (rankingLeague === "worldcup" && rankingListCount === 0))
  );
}
