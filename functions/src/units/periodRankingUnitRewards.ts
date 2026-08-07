// synced from lib/units/periodRankingUnitRewards.ts — run npm run sync:period-ranking-unit-rewards
/**
 * 個人ランキング Unit 配布表（設計正: docs/unit-reward-design.md §3）
 * Functions へは `npm run sync:period-ranking-unit-rewards` で同期。
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

/** 月間・部門 上位 10 */
export const PERIOD_RANKING_UNIT_MONTHLY_DEPARTMENT_MAX_RANK = 10;

type Band = { maxRank: number; units: number };

/** rank 1..max を帯で解決（competition 順位番号をそのまま渡す） */
function unitsFromBands(rank: number, bands: readonly Band[]): number | null {
  if (!Number.isFinite(rank) || rank < 1) return null;
  for (const band of bands) {
    if (rank <= band.maxRank) {
      return band.units > 0 ? band.units : null;
    }
  }
  return null;
}

/** 週間総合: 1→40 … 11–20→6 */
const WEEKLY_OVERALL_BANDS: readonly Band[] = [
  { maxRank: 1, units: 40 },
  { maxRank: 3, units: 30 },
  { maxRank: 5, units: 20 },
  { maxRank: 10, units: 12 },
  { maxRank: 20, units: 6 },
];

/** 月間総合: 1→200 … 31–50→15 */
const MONTHLY_OVERALL_BANDS: readonly Band[] = [
  { maxRank: 1, units: 200 },
  { maxRank: 2, units: 150 },
  { maxRank: 3, units: 120 },
  { maxRank: 5, units: 100 },
  { maxRank: 10, units: 80 },
  { maxRank: 20, units: 50 },
  { maxRank: 30, units: 30 },
  { maxRank: 50, units: 15 },
];

/** 月間部門: 1→50 … 6–10→8 */
const MONTHLY_DEPARTMENT_BANDS: readonly Band[] = [
  { maxRank: 1, units: 50 },
  { maxRank: 2, units: 35 },
  { maxRank: 3, units: 25 },
  { maxRank: 5, units: 15 },
  { maxRank: 10, units: 8 },
];

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
    return unitsFromBands(rank, WEEKLY_OVERALL_BANDS);
  }
  if (metric === PERIOD_RANKING_UNIT_OVERALL_METRIC) {
    return unitsFromBands(rank, MONTHLY_OVERALL_BANDS);
  }
  return unitsFromBands(rank, MONTHLY_DEPARTMENT_BANDS);
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
