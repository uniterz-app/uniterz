"use strict";
// synced from lib/units/periodRankingUnitRewards.ts — run npm run sync:period-ranking-unit-rewards
/**
 * 個人ランキング Unit 配布表（設計正: docs/unit-reward-design.md §3）
 * Functions へは `npm run sync:period-ranking-unit-rewards` で同期。
 *
 * 順位ごと異なる Unit（帯の同額なし）。同点で同順位になった場合のみ同額。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PERIOD_WIN_RATE_PICKUP_PARTICIPATION_RATE = exports.PERIOD_RANKING_UNIT_MONTHLY_DEPARTMENT_MAX_RANK = exports.PERIOD_RANKING_UNIT_MONTHLY_OVERALL_MAX_RANK = exports.PERIOD_RANKING_UNIT_WEEKLY_OVERALL_MAX_RANK = exports.PERIOD_RANKING_UNIT_DEPARTMENT_METRICS = exports.PERIOD_RANKING_UNIT_OVERALL_METRIC = void 0;
exports.winRateMinPostsFromPickupCount = winRateMinPostsFromPickupCount;
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
/** 月間・部門 上位 30 */
exports.PERIOD_RANKING_UNIT_MONTHLY_DEPARTMENT_MAX_RANK = 30;
/**
 * 月間勝率部門の参加率ガード（パターン B）。
 * その時点までの pickup 試合数 × この率 以上の投稿が必要。
 */
exports.PERIOD_WIN_RATE_PICKUP_PARTICIPATION_RATE = 0.65;
/** 週間総合: 1→50 … 20→5（順位ごと差あり） */
const WEEKLY_OVERALL_BY_RANK = [
    50, 46, 42, 38, 35, 32, 29, 26, 24, 22, 20, 18, 16, 14, 12, 10, 8, 7, 6, 5,
];
/** 月間総合: 1→300 / 2→250 / 3→200 … 50→1 */
const MONTHLY_OVERALL_BY_RANK = [
    300, 250, 200, 185, 170, 160, 150, 140, 130, 120, 110, 100, 92, 85, 78, 72, 66,
    60, 55, 50, 46, 42, 38, 35, 32, 30, 28, 26, 24, 22, 20, 19, 18, 17, 16, 15, 14,
    13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1,
];
/** 月間部門: 1→50 … 30→3（連番寄り・順位ごと差あり） */
const MONTHLY_DEPARTMENT_BY_RANK = [
    50, 46, 42, 38, 35, 32, 29, 26, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13,
    12, 11, 10, 9, 8, 7, 6, 5, 4, 3,
];
function unitsFromRankTable(rank, table) {
    if (!Number.isFinite(rank) || rank < 1 || rank > table.length)
        return null;
    const units = table[rank - 1];
    return units > 0 ? units : null;
}
/** pickup 試合数から勝率部門の最低投稿数（ceil） */
function winRateMinPostsFromPickupCount(pickupCountSoFar) {
    if (!Number.isFinite(pickupCountSoFar) || pickupCountSoFar <= 0)
        return 0;
    return Math.ceil(pickupCountSoFar * exports.PERIOD_WIN_RATE_PICKUP_PARTICIPATION_RATE);
}
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
        return unitsFromRankTable(rank, WEEKLY_OVERALL_BY_RANK);
    }
    if (metric === exports.PERIOD_RANKING_UNIT_OVERALL_METRIC) {
        return unitsFromRankTable(rank, MONTHLY_OVERALL_BY_RANK);
    }
    return unitsFromRankTable(rank, MONTHLY_DEPARTMENT_BY_RANK);
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