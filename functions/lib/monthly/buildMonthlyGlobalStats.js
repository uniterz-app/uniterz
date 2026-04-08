"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMonthlyGlobalStats = buildMonthlyGlobalStats;
const firestore_1 = require("firebase-admin/firestore");
function db() {
    return (0, firestore_1.getFirestore)();
}
function sortedFinite(nums) {
    return nums.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
}
/** 線形補間分位数（0–1）。ソート済み配列を想定 */
function quantileLinear(sortedAsc, q) {
    if (sortedAsc.length === 0)
        return 0;
    if (sortedAsc.length === 1)
        return sortedAsc[0];
    const qq = Math.max(0, Math.min(1, q));
    const pos = (sortedAsc.length - 1) * qq;
    const lo = Math.floor(pos);
    const hi = Math.ceil(pos);
    if (lo === hi)
        return sortedAsc[lo];
    const w = pos - lo;
    return sortedAsc[lo] * (1 - w) + sortedAsc[hi] * w;
}
async function buildMonthlyGlobalStats(rows, month) {
    if (rows.length === 0)
        return;
    const MIN_POSTS_TOP = 30;
    const avg = (arr) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const [year, mm] = month.split("-");
    const start = new Date(`${year}-${mm}-01T00:00:00+09:00`);
    const end = new Date(new Date(start.getFullYear(), start.getMonth() + 1, 0).setHours(23, 59, 59, 999));
    const totalGamesSnap = await db()
        .collection("games")
        .where("league", "==", "nba")
        .where("resultComputedAtV2", ">=", start)
        .where("resultComputedAtV2", "<=", end)
        .get();
    const totalGames = totalGamesSnap.size;
    const upsetGamesSnap = await db()
        .collection("games")
        .where("league", "==", "nba")
        .where("upsetMeta", "!=", null)
        .where("resultComputedAtV2", ">=", start)
        .where("resultComputedAtV2", "<=", end)
        .get();
    const upsetGames = upsetGamesSnap.size;
    const top10Of = (arr) => {
        const n = Math.max(1, Math.floor(arr.length * 0.1));
        return arr.slice(-n);
    };
    const rowsForTop = rows.filter((r) => r.posts >= MIN_POSTS_TOP);
    const byWinRate = [...rowsForTop].sort((a, b) => a.winRate - b.winRate);
    const byPrecision = [...rowsForTop].sort((a, b) => a.avgPrecision - b.avgPrecision);
    const byPointsV3 = [...rowsForTop].sort((a, b) => a.avgPointsV3 - b.avgPointsV3);
    const byUpset = [...rowsForTop].sort((a, b) => a.upsetPointsSum - b.upsetPointsSum);
    const byVolume = [...rows].sort((a, b) => a.posts - b.posts);
    const sumSorted = sortedFinite(rows.map((r) => r.pointsSumV3));
    const pointsSumV3Benchmarks = {
        mean: avg(rows.map((r) => r.pointsSumV3)),
        median: quantileLinear(sumSorted, 0.5),
        p90: quantileLinear(sumSorted, 0.9),
        max: sumSorted.length > 0 ? sumSorted[sumSorted.length - 1] : 0,
    };
    const doc = {
        month,
        raw: {
            totalGames,
            upsetGames,
            upsetRate: totalGames > 0 ? upsetGames / totalGames : 0,
        },
        avg: {
            winRate: avg(rows.map((r) => r.winRate)),
            precision: avg(rows.map((r) => r.avgPrecision)),
            pointsV3: avg(rows.map((r) => r.avgPointsV3)),
            upset: avg(rows.map((r) => r.upsetPointsSum)),
            volume: avg(rows.map((r) => r.posts)),
        },
        top10: {
            winRate: avg(top10Of(byWinRate).map((r) => r.winRate)),
            precision: avg(top10Of(byPrecision).map((r) => r.avgPrecision)),
            pointsV3: avg(top10Of(byPointsV3).map((r) => r.avgPointsV3)),
            upset: avg(top10Of(byUpset).map((r) => r.upsetPointsSum)),
            volume: avg(top10Of(byVolume).map((r) => r.posts)),
        },
        users: rows.length,
        top10EligibleUsers: rowsForTop.length,
        /** 月次総合得点（合計）の基準（当月に投稿があるユーザー＝ avg と同じ母集団） */
        pointsSumV3Benchmarks,
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    };
    await db().collection("monthly_global_stats_v2").doc(month).set(doc);
}
//# sourceMappingURL=buildMonthlyGlobalStats.js.map