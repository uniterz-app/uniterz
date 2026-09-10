// synced from lib/units/periodRankingUnitRewards.ts — run npm run sync:period-ranking-unit-rewards
/**
 * 個人ランキング Unit 配布表（設計正: docs/unit-reward-design.md §3）
 * Functions へは `npm run sync:period-ranking-unit-rewards` で同期。
 *
 * 原則は順位ごと異なる Unit。週間・月間総合の下位は短い同額帯（5刻み）を許可。
 * 同点で同順位になった場合のみ同額。
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

/** 週間総合: 1→50 / 2→40 … 20→5（5 Unit 刻み。下位は短い同額帯あり） */
const WEEKLY_OVERALL_BY_RANK: readonly number[] = [
  50, 40, 35, 30, 25, 20, 20, 15, 15, 15, 10, 10, 10, 10, 5, 5, 5, 5, 5, 5,
];

/** 月間総合: 1→250 / 2→220 … 50→20（5 Unit 刻み。下位は短い同額帯あり） */
const MONTHLY_OVERALL_BY_RANK: readonly number[] = [
  250, 220, 200, 185, 170, 160, 150, 140, 130, 120, 105, 100, 95, 90, 85, 80,
  75, 70, 65, 60, 55, 50, 45, 45, 45, 40, 40, 40, 35, 35, 35, 30, 30, 30, 30,
  25, 25, 25, 25, 25, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20,
];

/** 月間部門: 1→100 / 3→60 / 4–5→50 … 30→10（5 Unit 刻み。Top10は最低30） */
const MONTHLY_DEPARTMENT_BY_RANK: readonly number[] = [
  100, 80, 60, 50, 50, 45, 40, 35, 30, 30, 25, 25, 20, 20, 20, 15, 15, 15, 15,
  15, 15, 15, 10, 10, 10, 10, 10, 10, 10, 10,
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
