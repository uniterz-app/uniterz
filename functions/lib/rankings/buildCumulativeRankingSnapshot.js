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
function getValue(d, metric) {
    var _a, _b, _c, _d, _e;
    if (metric === "winRate")
        return (_a = d.winRate) !== null && _a !== void 0 ? _a : 0;
    if (metric === "totalPoints")
        return (_b = d.totalPoints) !== null && _b !== void 0 ? _b : 0;
    if (metric === "totalPrecision")
        return (_c = d.totalPrecision) !== null && _c !== void 0 ? _c : 0;
    if (metric === "totalUpset")
        return (_d = d.totalUpset) !== null && _d !== void 0 ? _d : 0;
    return (_e = d.activeWinStreak) !== null && _e !== void 0 ? _e : 0;
}
/* =========================================================
 * Main
 * =======================================================*/
async function buildCumulativeRankingSnapshot() {
    const snap = await db().collection("cumulative_stats").get();
    const baseRows = snap.docs.map((doc) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const d = doc.data();
        const totalPosts = (_a = d.totalPosts) !== null && _a !== void 0 ? _a : 0;
        const totalWins = (_b = d.totalWins) !== null && _b !== void 0 ? _b : 0;
        return {
            uid: doc.id,
            displayName: (_c = d.displayName) !== null && _c !== void 0 ? _c : "user",
            handle: (_d = d.handle) !== null && _d !== void 0 ? _d : null,
            photoURL: (_e = d.photoURL) !== null && _e !== void 0 ? _e : null,
            totalPosts,
            totalWins,
            winRate: totalPosts > 0 ? totalWins / totalPosts : 0,
            totalPoints: (_f = d.totalPoints) !== null && _f !== void 0 ? _f : 0,
            totalPrecision: (_g = d.totalPrecision) !== null && _g !== void 0 ? _g : 0,
            totalUpset: (_h = d.totalUpset) !== null && _h !== void 0 ? _h : 0,
            activeWinStreak: (_j = d.activeWinStreak) !== null && _j !== void 0 ? _j : 0,
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