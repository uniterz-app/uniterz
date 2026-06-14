import type { MobileMetric } from "@/app/component/rankings/_data/mockRows";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import type { RankingPhase } from "@/lib/rankings/rankingPhase";
import type { PlayoffRoundKey } from "@/lib/rankings/playoffRound";
import type { WcRankingStage } from "@/lib/rankings/wcRankingStage";
import type { RankingRow } from "@/lib/rankings/useRanking";

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
  round: PlayoffRoundKey
): number {
  if (rankingLeague === "worldcup") return 1;
  if (phase === "playoffs" && (round === "overall" || round === "r1")) return 20;
  return 1;
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
  return input.listReady && input.metricReady;
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
