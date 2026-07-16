"use strict";
/**
 * Gap 分析 — cumulative_stats から得点分解を読む（Functions 用）。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.readRankGapStatsSlice = readRankGapStatsSlice;
exports.averageRankGapSlices = averageRankGapSlices;
exports.buildRankGapCohortBandSnapshot = buildRankGapCohortBandSnapshot;
function safeNum(v) {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : 0;
}
function safeInt(v) {
    return Math.max(0, Math.floor(safeNum(v)));
}
function sliceFromBlock(block, opts) {
    var _a;
    if (!block || typeof block !== "object")
        return null;
    const posts = safeInt(block.totalPosts);
    if (posts <= 0)
        return null;
    const wins = safeInt(block.totalWins);
    const pointsSumV3 = safeNum(block.totalPoints);
    const upsetBonusSum = safeNum(block.upsetBonusSum);
    const streakBonusSum = safeNum(block.streakBonusSum);
    const goalScorerBonusSum = safeNum(block.goalScorerBonusSum);
    const winRateRaw = safeNum(block.winRate);
    const exactHitCount = opts.wcStage
        ? safeInt((_a = block.exactHitCount) !== null && _a !== void 0 ? _a : block.totalPrecision)
        : safeNum(block.totalPrecision);
    return {
        pointsSumV3,
        upsetBonusSum,
        streakBonusSum,
        goalScorerBonusSum,
        basePointsSum: Math.max(0, pointsSumV3 - upsetBonusSum - streakBonusSum - goalScorerBonusSum),
        exactHitCount,
        winRate: posts > 0 ? wins / posts : winRateRaw <= 1 ? winRateRaw : winRateRaw / 100,
        posts,
    };
}
function readRankGapStatsSlice(cumulative, context) {
    var _a, _b, _c;
    if (!cumulative)
        return null;
    if (context.kind === "wc") {
        const block = (_a = cumulative.rankingByWcStage) === null || _a === void 0 ? void 0 : _a[context.stage];
        return sliceFromBlock(block, { wcStage: true });
    }
    if (context.kind === "phase") {
        const block = (_b = cumulative.rankingByPhase) === null || _b === void 0 ? void 0 : _b[context.phase];
        return sliceFromBlock(block, { wcStage: false });
    }
    const block = (_c = cumulative.rankingByPlayoffRound) === null || _c === void 0 ? void 0 : _c[context.round];
    return sliceFromBlock(block, { wcStage: false });
}
function averageRankGapSlices(slices) {
    if (slices.length === 0)
        return null;
    let pointsSumV3 = 0;
    let basePointsSum = 0;
    let upsetBonusSum = 0;
    let streakBonusSum = 0;
    let goalScorerBonusSum = 0;
    let exactHitCount = 0;
    let winRate = 0;
    let posts = 0;
    for (const s of slices) {
        pointsSumV3 += s.pointsSumV3;
        basePointsSum += s.basePointsSum;
        upsetBonusSum += s.upsetBonusSum;
        streakBonusSum += s.streakBonusSum;
        goalScorerBonusSum += s.goalScorerBonusSum;
        exactHitCount += s.exactHitCount;
        winRate += s.winRate;
        posts += s.posts;
    }
    const n = slices.length;
    return {
        pointsSumV3: pointsSumV3 / n,
        basePointsSum: basePointsSum / n,
        upsetBonusSum: upsetBonusSum / n,
        streakBonusSum: streakBonusSum / n,
        goalScorerBonusSum: goalScorerBonusSum / n,
        exactHitCount: exactHitCount / n,
        winRate: winRate / n,
        posts: posts / n,
    };
}
function buildRankGapCohortBandSnapshot(slices) {
    if (slices.length === 0)
        return null;
    const avg = averageRankGapSlices(slices);
    if (!avg)
        return null;
    return { size: slices.length, avg, slices };
}
//# sourceMappingURL=readRankGapStatsSlice.js.map