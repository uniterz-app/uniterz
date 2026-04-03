"use strict";
// functions/src/rankings/buildCumulativeRankingSnapshot.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCumulativeRankingSnapshot = buildCumulativeRankingSnapshot;
const firestore_1 = require("firebase-admin/firestore");
/* =========================================================
 * Firestore
 * =======================================================*/
function db() {
    return (0, firestore_1.getFirestore)();
}
const METRICS = [
    "totalPoints",
    "winRate",
    "totalPrecision",
    "totalUpset",
    "activeWinStreak",
];
/* =========================================================
 * Utils
 * =======================================================*/
/** ランキング掲載用（プレーイン除外トラック）。未移行ドキュメントはルートをそのまま使う */
function rankingSlice(d) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    const rk = d.ranking;
    if (rk && typeof rk === "object") {
        const tp = (_a = rk.totalPosts) !== null && _a !== void 0 ? _a : 0;
        const tw = (_b = rk.totalWins) !== null && _b !== void 0 ? _b : 0;
        return {
            totalPosts: tp,
            totalWins: tw,
            winRate: tp > 0 ? tw / tp : (_c = rk.winRate) !== null && _c !== void 0 ? _c : 0,
            totalPoints: (_d = rk.totalPoints) !== null && _d !== void 0 ? _d : 0,
            totalPrecision: (_e = rk.totalPrecision) !== null && _e !== void 0 ? _e : 0,
            totalUpset: (_f = rk.totalUpset) !== null && _f !== void 0 ? _f : 0,
        };
    }
    const totalPosts = (_g = d.totalPosts) !== null && _g !== void 0 ? _g : 0;
    const totalWins = (_h = d.totalWins) !== null && _h !== void 0 ? _h : 0;
    return {
        totalPosts,
        totalWins,
        winRate: (_j = d.winRate) !== null && _j !== void 0 ? _j : 0,
        totalPoints: (_k = d.totalPoints) !== null && _k !== void 0 ? _k : 0,
        totalPrecision: (_l = d.totalPrecision) !== null && _l !== void 0 ? _l : 0,
        totalUpset: (_m = d.totalUpset) !== null && _m !== void 0 ? _m : 0,
    };
}
function getValue(d, metric) {
    var _a, _b, _c, _d, _e;
    if (metric === "activeWinStreak")
        return (_a = d.activeWinStreak) !== null && _a !== void 0 ? _a : 0;
    const r = rankingSlice(d);
    if (metric === "winRate")
        return (_b = r.winRate) !== null && _b !== void 0 ? _b : 0;
    if (metric === "totalPoints")
        return (_c = r.totalPoints) !== null && _c !== void 0 ? _c : 0;
    if (metric === "totalPrecision")
        return (_d = r.totalPrecision) !== null && _d !== void 0 ? _d : 0;
    return (_e = r.totalUpset) !== null && _e !== void 0 ? _e : 0;
}
/* =========================================================
 * Main
 * =======================================================*/
async function buildCumulativeRankingSnapshot() {
    const snap = await db().collection("cumulative_stats").get();
    const baseRows = snap.docs.map((doc) => {
        var _a, _b, _c, _d, _e;
        const d = doc.data();
        const r = rankingSlice(d);
        return {
            uid: doc.id,
            displayName: (_a = d.displayName) !== null && _a !== void 0 ? _a : "user",
            handle: (_b = d.handle) !== null && _b !== void 0 ? _b : null,
            photoURL: (_c = d.photoURL) !== null && _c !== void 0 ? _c : null,
            countryCode: (_d = d.countryCode) !== null && _d !== void 0 ? _d : null,
            totalPosts: r.totalPosts,
            totalWins: r.totalWins,
            winRate: r.winRate,
            totalPoints: r.totalPoints,
            totalPrecision: r.totalPrecision,
            totalUpset: r.totalUpset,
            activeWinStreak: (_e = d.activeWinStreak) !== null && _e !== void 0 ? _e : 0,
        };
    });
    for (const metric of METRICS) {
        const sorted = [...baseRows]
            .sort((a, b) => {
            var _a, _b, _c, _d;
            const diff = getValue(b, metric) - getValue(a, metric);
            if (diff !== 0)
                return diff;
            if (metric === "winRate") {
                const postsDiff = ((_a = b.totalPosts) !== null && _a !== void 0 ? _a : 0) - ((_b = a.totalPosts) !== null && _b !== void 0 ? _b : 0);
                if (postsDiff !== 0)
                    return postsDiff;
            }
            return ((_c = b.totalPoints) !== null && _c !== void 0 ? _c : 0) - ((_d = a.totalPoints) !== null && _d !== void 0 ? _d : 0);
        })
            .slice(0, 20)
            .map((row, index) => (Object.assign(Object.assign({}, row), { rank: index + 1 })));
        await db()
            .collection("cumulative_ranking_snapshots")
            .doc(metric)
            .set({
            metric,
            rows: sorted,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        }, { merge: true });
    }
    return {
        ok: true,
        metrics: METRICS.length,
    };
}
//# sourceMappingURL=buildCumulativeRankingSnapshot.js.map