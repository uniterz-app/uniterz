"use strict";
// synced from lib/units/periodRankingUnitRewards.ts — run npm run sync:period-ranking-unit-rewards
/**
 * 個人ランキング Unit 配布表（設計正: docs/unit-reward-design.md §3）
 * Functions へは `npm run sync:period-ranking-unit-rewards` で同期。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PERIOD_RANKING_UNIT_MONTHLY_DEPARTMENT_MAX_RANK = exports.PERIOD_RANKING_UNIT_MONTHLY_OVERALL_MAX_RANK = exports.PERIOD_RANKING_UNIT_WEEKLY_OVERALL_MAX_RANK = exports.PERIOD_RANKING_UNIT_DEPARTMENT_METRICS = exports.PERIOD_RANKING_UNIT_OVERALL_METRIC = void 0;
exports.periodRankingUnitMaxRank = periodRankingUnitMaxRank;
exports.unitsForPeriodRankingRank = unitsForPeriodRankingRank;
exports.periodRankingUnitMetricsForPeriod = periodRankingUnitMetricsForPeriod;
exports.periodRankingUnitIdempotencyKey = periodRankingUnitIdempotencyKey;
exports.periodRankingUnitLedgerReason = periodRankingUnitLedgerReason;
exports.periodRankingUnitMetricLabel = periodRankingUnitMetricLabel;
exports.PERIOD_RANKING_UNIT_OVERALL_METRIC = "totalPoints";
/** 月間のみ付与する部門指標 */
exports.PERIOD_RANKING_UNIT_DEPARTMENT_METRICS = ["winRate", "totalUpset", "totalGoalScorerHits"];
/** 週間・総合 上位 20 */
exports.PERIOD_RANKING_UNIT_WEEKLY_OVERALL_MAX_RANK = 20;
/** 月間・総合 上位 50 */
exports.PERIOD_RANKING_UNIT_MONTHLY_OVERALL_MAX_RANK = 50;
/** 月間・部門 上位 10 */
exports.PERIOD_RANKING_UNIT_MONTHLY_DEPARTMENT_MAX_RANK = 10;
/** rank 1..max を帯で解決（competition 順位番号をそのまま渡す） */
function unitsFromBands(rank, bands) {
    if (!Number.isFinite(rank) || rank < 1)
        return null;
    for (const band of bands) {
        if (rank <= band.maxRank) {
            return band.units > 0 ? band.units : null;
        }
    }
    return null;
}
/** 週間総合: 1→40 … 11–20→6 */
const WEEKLY_OVERALL_BANDS = [
    { maxRank: 1, units: 40 },
    { maxRank: 3, units: 30 },
    { maxRank: 5, units: 20 },
    { maxRank: 10, units: 12 },
    { maxRank: 20, units: 6 },
];
/** 月間総合: 1→200 … 31–50→15 */
const MONTHLY_OVERALL_BANDS = [
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
const MONTHLY_DEPARTMENT_BANDS = [
    { maxRank: 1, units: 50 },
    { maxRank: 2, units: 35 },
    { maxRank: 3, units: 25 },
    { maxRank: 5, units: 15 },
    { maxRank: 10, units: 8 },
];
function periodRankingUnitMaxRank(period, metric) {
    if (period === "weekly") {
        return metric === exports.PERIOD_RANKING_UNIT_OVERALL_METRIC
            ? exports.PERIOD_RANKING_UNIT_WEEKLY_OVERALL_MAX_RANK
            : 0;
    }
    if (metric === exports.PERIOD_RANKING_UNIT_OVERALL_METRIC) {
        return exports.PERIOD_RANKING_UNIT_MONTHLY_OVERALL_MAX_RANK;
    }
    return exports.PERIOD_RANKING_UNIT_MONTHLY_DEPARTMENT_MAX_RANK;
}
function unitsForPeriodRankingRank(period, metric, rank) {
    const max = periodRankingUnitMaxRank(period, metric);
    if (max <= 0 || rank > max)
        return null;
    if (period === "weekly") {
        return unitsFromBands(rank, WEEKLY_OVERALL_BANDS);
    }
    if (metric === exports.PERIOD_RANKING_UNIT_OVERALL_METRIC) {
        return unitsFromBands(rank, MONTHLY_OVERALL_BANDS);
    }
    return unitsFromBands(rank, MONTHLY_DEPARTMENT_BANDS);
}
/** その period で付与対象の metric 一覧 */
function periodRankingUnitMetricsForPeriod(period) {
    if (period === "weekly")
        return [exports.PERIOD_RANKING_UNIT_OVERALL_METRIC];
    return [
        exports.PERIOD_RANKING_UNIT_OVERALL_METRIC,
        ...exports.PERIOD_RANKING_UNIT_DEPARTMENT_METRICS,
    ];
}
function periodRankingUnitIdempotencyKey(input) {
    return `pr:${input.period}:${input.label}:${input.metric}:uid${input.uid}`;
}
function periodRankingUnitLedgerReason(period) {
    return period === "weekly" ? "weekly_rank" : "monthly_rank";
}
function periodRankingUnitMetricLabel(metric, language) {
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
//# sourceMappingURL=periodRankingUnitRewards.js.map