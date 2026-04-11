"use strict";
/**
 * pointsV3 ヒストグラム（games.pointsDistribution 用）。
 * ビン境界は lib/results/gamePointsDistribution.ts のクライアント型と同じ並びに合わせる。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildGamePointsDistributionAgg = buildGamePointsDistributionAgg;
/** [lo, hi) 。最終ビンは hi を大きく取り 10 超を包含 */
const BIN_EDGES = [
    { lo: 0, hi: 0 },
    { lo: 4, hi: 4.5 },
    { lo: 4.5, hi: 5.5 },
    { lo: 5.5, hi: 6.5 },
    { lo: 6.5, hi: 7.5 },
    { lo: 7.5, hi: 8.5 },
    { lo: 8.5, hi: 10.02 },
    { lo: 10.02, hi: 1e6 },
];
function binIndexForScore(score) {
    if (score === 0)
        return 0;
    if (score > 0 && score < 4)
        return 1;
    for (let i = 1; i < BIN_EDGES.length; i++) {
        const { lo, hi } = BIN_EDGES[i];
        if (score >= lo && score < hi)
            return i;
    }
    return BIN_EDGES.length - 1;
}
function buildGamePointsDistributionAgg(scores) {
    const bins = BIN_EDGES.map(({ lo, hi }) => ({
        lo,
        hi,
        count: 0,
    }));
    for (const s of scores) {
        if (!Number.isFinite(s))
            continue;
        const idx = binIndexForScore(s);
        bins[idx].count += 1;
    }
    const n = scores.filter((s) => Number.isFinite(s)).length;
    if (n === 0) {
        return { v: 1, bins, n: 0, median: null, mean: null };
    }
    const sorted = [...scores].filter(Number.isFinite).sort((a, b) => a - b);
    const mean = sorted.reduce((a, b) => a + b, 0) / sorted.length;
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 1
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;
    return { v: 1, bins, n, median, mean };
}
//# sourceMappingURL=gamePointsDistributionAgg.js.map