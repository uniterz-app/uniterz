/**
 * 週次 / 月次ランキングの現順位から推定 Unit を計算（クライアント表示用）。
 * 付与本体は period_ranking_snapshots 確定後の grant ジョブ。
 */
import {
  unitsForPeriodRankingRank,
  type PeriodRankingUnitMetric,
  type PeriodRankingUnitPeriod,
} from "@/lib/units/periodRankingUnitRewards";

export type PeriodUnitRankSnapshot = {
  totalPoints?: number | null;
  winRate?: number | null;
  totalUpset?: number | null;
  totalGoalScorerHits?: number | null;
};

export type EstimatedPeriodUnitLine = {
  metric: PeriodRankingUnitMetric;
  rank: number;
  units: number;
};

export type EstimatedPeriodUnits = {
  period: PeriodRankingUnitPeriod;
  total: number;
  overall: number;
  departments: number;
  lines: EstimatedPeriodUnitLine[];
};

function pushLine(
  lines: EstimatedPeriodUnitLine[],
  period: PeriodRankingUnitPeriod,
  metric: PeriodRankingUnitMetric,
  rank: number | null | undefined
): number {
  if (rank == null || !Number.isFinite(rank) || rank < 1) return 0;
  const units = unitsForPeriodRankingRank(period, metric, Math.floor(rank));
  if (units == null) return 0;
  lines.push({ metric, rank: Math.floor(rank), units });
  return units;
}

/** 現時点の順位マップから推定獲得 Unit（付与対象外は 0） */
export function estimatePeriodRankingUnits(
  period: PeriodRankingUnitPeriod,
  ranks: PeriodUnitRankSnapshot
): EstimatedPeriodUnits {
  const lines: EstimatedPeriodUnitLine[] = [];
  const overall = pushLine(lines, period, "totalPoints", ranks.totalPoints);

  let departments = 0;
  if (period === "monthly") {
    departments += pushLine(lines, period, "winRate", ranks.winRate);
    departments += pushLine(lines, period, "totalUpset", ranks.totalUpset);
    departments += pushLine(
      lines,
      period,
      "totalGoalScorerHits",
      ranks.totalGoalScorerHits
    );
  }

  return {
    period,
    total: overall + departments,
    overall,
    departments,
    lines,
  };
}

/** bulk byMetric から自分の順位を抜く */
export function periodUnitRanksFromByMetric(
  byMetric:
    | Partial<
        Record<
          PeriodRankingUnitMetric,
          { myRank?: number | null } | null | undefined
        >
      >
    | null
    | undefined
): PeriodUnitRankSnapshot {
  return {
    totalPoints: byMetric?.totalPoints?.myRank ?? null,
    winRate: byMetric?.winRate?.myRank ?? null,
    totalUpset: byMetric?.totalUpset?.myRank ?? null,
    totalGoalScorerHits: byMetric?.totalGoalScorerHits?.myRank ?? null,
  };
}
