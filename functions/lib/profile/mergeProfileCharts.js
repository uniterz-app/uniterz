"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROFILE_CHARTS_LAST20_MAX = exports.PROFILE_CHARTS_RANK_MAX = exports.PROFILE_CHARTS_DAILY_MAX = exports.PROFILE_CHARTS_BUNDLE_VERSION = void 0;
exports.dailyRowFromSeasonBucket = dailyRowFromSeasonBucket;
exports.projectSeasonBucket = projectSeasonBucket;
exports.mergeProfileChartsOnSeasonSettle = mergeProfileChartsOnSeasonSettle;
exports.mergeProfileChartsOnRankSnapshot = mergeProfileChartsOnRankSnapshot;
/**
 * cumulative_stats.profileCharts の merge（Functions 側）。
 * クライアントの lib/profile/profileChartsBundle.ts とスキーマ同期。
 */
exports.PROFILE_CHARTS_BUNDLE_VERSION = 1;
exports.PROFILE_CHARTS_DAILY_MAX = 40;
exports.PROFILE_CHARTS_RANK_MAX = 10;
exports.PROFILE_CHARTS_LAST20_MAX = 20;
function num(v) {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : 0;
}
function hasActivity(row) {
    return (row.posts > 0 ||
        Math.abs(row.pointsV3) > 1e-9 ||
        Math.abs(row.upsetPoints) > 1e-9);
}
function readStored(cumulative, seasonKey, chartsDoc) {
    const raw = chartsDoc !== null && chartsDoc !== void 0 ? chartsDoc : cumulative === null || cumulative === void 0 ? void 0 : cumulative.profileCharts;
    if (!raw || typeof raw !== "object") {
        return { v: exports.PROFILE_CHARTS_BUNDLE_VERSION, seasonKey };
    }
    const o = raw;
    if (o.v !== exports.PROFILE_CHARTS_BUNDLE_VERSION) {
        return { v: exports.PROFILE_CHARTS_BUNDLE_VERSION, seasonKey };
    }
    const sk = typeof o.seasonKey === "string" ? o.seasonKey : "";
    if (sk !== seasonKey) {
        return { v: exports.PROFILE_CHARTS_BUNDLE_VERSION, seasonKey };
    }
    return {
        v: exports.PROFILE_CHARTS_BUNDLE_VERSION,
        seasonKey,
        dailyTrend: Array.isArray(o.dailyTrend)
            ? o.dailyTrend
            : undefined,
        rankTrend: Array.isArray(o.rankTrend)
            ? o.rankTrend
            : undefined,
        last20: Array.isArray(o.last20)
            ? o.last20
            : undefined,
    };
}
function pruneDaily(rows) {
    const filtered = rows.filter(hasActivity).sort((a, b) => a.date.localeCompare(b.date));
    if (filtered.length <= exports.PROFILE_CHARTS_DAILY_MAX)
        return filtered;
    return filtered.slice(filtered.length - exports.PROFILE_CHARTS_DAILY_MAX);
}
function dailyRowFromSeasonBucket(dateKey, bucket) {
    const posts = Math.max(0, Math.floor(num(bucket === null || bucket === void 0 ? void 0 : bucket.posts)));
    const wins = Math.max(0, Math.floor(num(bucket === null || bucket === void 0 ? void 0 : bucket.wins)));
    const pointsV3 = num(bucket === null || bucket === void 0 ? void 0 : bucket.pointsSumV3);
    const upsetPoints = num(bucket === null || bucket === void 0 ? void 0 : bucket.upsetPointsSum);
    return {
        date: dateKey,
        posts,
        wins,
        pointsV3,
        upsetPoints,
        winRate: posts > 0 ? wins / posts : 0,
        exactHitCount: 0,
    };
}
/** 既存日次バケット + 今回の increment を合算した行 */
function projectSeasonBucket(existing, inc) {
    return {
        posts: num(existing === null || existing === void 0 ? void 0 : existing.posts) + num(inc.posts),
        wins: num(existing === null || existing === void 0 ? void 0 : existing.wins) + num(inc.wins),
        pointsSumV3: num(existing === null || existing === void 0 ? void 0 : existing.pointsSumV3) + num(inc.pointsSumV3),
        upsetPointsSum: num(existing === null || existing === void 0 ? void 0 : existing.upsetPointsSum) + num(inc.upsetPointsSum),
    };
}
function mergeProfileChartsOnSeasonSettle(opts) {
    const prev = readStored(opts.cumulative, opts.seasonKey, opts.chartsDoc);
    const dailyPrev = Array.isArray(prev.dailyTrend) ? [...prev.dailyTrend] : [];
    const row = dailyRowFromSeasonBucket(opts.dateKey, opts.projectedSeasonBucket);
    const without = dailyPrev.filter((r) => r.date !== row.date);
    if (hasActivity(row))
        without.push(row);
    const lastPrev = Array.isArray(prev.last20) ? [...prev.last20] : [];
    const lastNext = lastPrev.filter((p) => p.postId !== opts.last20Point.postId);
    lastNext.push(opts.last20Point);
    lastNext.sort((a, b) => a.settledAtMs - b.settledAtMs);
    const last20 = lastNext.length <= exports.PROFILE_CHARTS_LAST20_MAX
        ? lastNext
        : lastNext.slice(lastNext.length - exports.PROFILE_CHARTS_LAST20_MAX);
    return {
        v: exports.PROFILE_CHARTS_BUNDLE_VERSION,
        seasonKey: opts.seasonKey,
        dailyTrend: pruneDaily(without),
        rankTrend: Array.isArray(prev.rankTrend) ? prev.rankTrend : undefined,
        last20,
    };
}
function mergeProfileChartsOnRankSnapshot(opts) {
    const prev = readStored(opts.cumulative, opts.seasonKey, opts.chartsDoc);
    const rankPrev = Array.isArray(prev.rankTrend) ? [...prev.rankTrend] : [];
    const point = { dateKey: opts.dateKey, rank: opts.totalPointsRank };
    const next = rankPrev.filter((p) => p.dateKey !== point.dateKey);
    next.push(point);
    next.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
    const rankTrend = next.length <= exports.PROFILE_CHARTS_RANK_MAX
        ? next
        : next.slice(next.length - exports.PROFILE_CHARTS_RANK_MAX);
    return {
        v: exports.PROFILE_CHARTS_BUNDLE_VERSION,
        seasonKey: opts.seasonKey,
        dailyTrend: Array.isArray(prev.dailyTrend) ? prev.dailyTrend : undefined,
        rankTrend,
        last20: Array.isArray(prev.last20) ? prev.last20 : undefined,
    };
}
//# sourceMappingURL=mergeProfileCharts.js.map