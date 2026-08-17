// synced from lib/units/periodRankingUnitRewards.ts — run npm run sync:period-ranking-unit-rewards
/**
 * 個人ランキング Unit 配布表（設計正: docs/unit-reward-design.md §3）
 * Functions へは `npm run sync:period-ranking-unit-rewards` で同期。
 *
 * 順位ごと異なる Unit（帯の同額なし）。同点で同順位になった場合のみ同額。
 */

export type PeriodRankingUnitPeriod = "weekly" | "monthly";

/** period_ranking_snapshots の metric キー（standard のみ付与） */
export type PeriodRankingUnitMetric =
  | "totalPoints"
  | "winRate"
  | "totalUpset"
  | "totalGoalScorerHits";

export const PERIOD_RANKING_UNIT_OVERALL_METRIC: PeriodRankingUnitMetric =
  "totalPoints";

/** 月間のみ付与する部門指標 */
export const PERIOD_RANKING_UNIT_DEPARTMENT_METRICS: readonly PeriodRankingUnitMetric[] =
  ["winRate", "totalUpset", "totalGoalScorerHits"] as const;

/** 週間・総合 上位 20 */
export const PERIOD_RANKING_UNIT_WEEKLY_OVERALL_MAX_RANK = 20;

/** 月間・総合 上位 50 */
export const PERIOD_RANKING_UNIT_MONTHLY_OVERALL_MAX_RANK = 50;

/** 月間・部門 上位 30 */
export const PERIOD_RANKING_UNIT_MONTHLY_DEPARTMENT_MAX_RANK = 30;

/**
 * 月間勝率部門の参加率ガード（パターン B）。
 * その時点までの pickup 試合数 × この率 以上の投稿が必要。
 */
export const PERIOD_WIN_RATE_PICKUP_PARTICIPATION_RATE = 0.65;

/** 週間総合: 1→50 … 20→5（順位ごと差あり） */
const WEEKLY_OVERALL_BY_RANK: readonly number[] = [
  50, 46, 42, 38, 35, 32, 29, 26, 24, 22, 20, 18, 16, 14, 12, 10, 8, 7, 6, 5,
];

/** 月間総合: 1→300 / 2→250 / 3→200 … 50→1 */
const MONTHLY_OVERALL_BY_RANK: readonly number[] = [
  300, 250, 200, 185, 170, 160, 150, 140, 130, 120, 110, 100, 92, 85, 78, 72, 66,
  60, 55, 50, 46, 42, 38, 35, 32, 30, 28, 26, 24, 22, 20, 19, 18, 17, 16, 15, 14,
  13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1,
];

/** 月間部門: 1→50 … 30→3（連番寄り・順位ごと差あり） */
const MONTHLY_DEPARTMENT_BY_RANK: readonly number[] = [
  50, 46, 42, 38, 35, 32, 29, 26, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13,
  12, 11, 10, 9, 8, 7, 6, 5, 4, 3,
];

function unitsFromRankTable(
  rank: number,
  table: readonly number[]
): number | null {
  if (!Number.isFinite(rank) || rank < 1 || rank > table.length) return null;
  const units = table[rank - 1];
  return units > 0 ? units : null;
}

/** pickup 試合数から勝率部門の最低投稿数（ceil） */
export function winRateMinPostsFromPickupCount(pickupCountSoFar: number): number {
  if (!Number.isFinite(pickupCountSoFar) || pickupCountSoFar <= 0) return 0;
  return Math.ceil(pickupCountSoFar * PERIOD_WIN_RATE_PICKUP_PARTICIPATION_RATE);
}

export function periodRankingUnitMaxRank(
  period: PeriodRankingUnitPeriod,
  metric: PeriodRankingUnitMetric
): number {
  if (period === "weekly") {
    return metric === PERIOD_RANKING_UNIT_OVERALL_METRIC
      ? PERIOD_RANKING_UNIT_WEEKLY_OVERALL_MAX_RANK
      : 0;
  }
  if (metric === PERIOD_RANKING_UNIT_OVERALL_METRIC) {
    return PERIOD_RANKING_UNIT_MONTHLY_OVERALL_MAX_RANK;
  }
  return PERIOD_RANKING_UNIT_MONTHLY_DEPARTMENT_MAX_RANK;
}

export function unitsForPeriodRankingRank(
  period: PeriodRankingUnitPeriod,
  metric: PeriodRankingUnitMetric,
  rank: number
): number | null {
  const max = periodRankingUnitMaxRank(period, metric);
  if (max <= 0 || rank > max) return null;
  if (period === "weekly") {
    return unitsFromRankTable(rank, WEEKLY_OVERALL_BY_RANK);
  }
  if (metric === PERIOD_RANKING_UNIT_OVERALL_METRIC) {
    return unitsFromRankTable(rank, MONTHLY_OVERALL_BY_RANK);
  }
  return unitsFromRankTable(rank, MONTHLY_DEPARTMENT_BY_RANK);
}

/** その period で付与対象の metric 一覧 */
export function periodRankingUnitMetricsForPeriod(
  period: PeriodRankingUnitPeriod
): PeriodRankingUnitMetric[] {
  if (period === "weekly") return [PERIOD_RANKING_UNIT_OVERALL_METRIC];
  return [
    PERIOD_RANKING_UNIT_OVERALL_METRIC,
    ...PERIOD_RANKING_UNIT_DEPARTMENT_METRICS,
  ];
}

export function periodRankingUnitIdempotencyKey(input: {
  period: PeriodRankingUnitPeriod;
  label: string;
  metric: PeriodRankingUnitMetric;
  uid: string;
}): string {
  return `pr:${input.period}:${input.label}:${input.metric}:uid${input.uid}`;
}

export function periodRankingUnitLedgerReason(
  period: PeriodRankingUnitPeriod
): "weekly_rank" | "monthly_rank" {
  return period === "weekly" ? "weekly_rank" : "monthly_rank";
}

export function periodRankingUnitMetricLabel(
  metric: PeriodRankingUnitMetric,
  language: "ja" | "en"
): string {
  const ja = language === "ja";
  switch (metric) {
    case "totalPoints":
      return ja ? "総合" : "Overall";
    case "winRate":
      return ja ? "勝率" : "Win%";
    case "totalUpset":
      return ja ? "アップセット" : "Upset";
    case "totalGoalScorerHits":
      return ja ? "得点者" : "Scorer";
    default:
      return metric;
  }
}
