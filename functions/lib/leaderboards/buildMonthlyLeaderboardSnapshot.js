"use strict";
// functions/src/leaderboards/buildMonthlyLeaderboardSnapshot.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMonthlyLeaderboardSnapshot = buildMonthlyLeaderboardSnapshot;
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
];
/* =========================================================
 * Utils
 * =======================================================*/
function getValue(d, metric) {
    var _a, _b, _c, _d;
    if (metric === "winRate")
        return (_a = d.winRate) !== null && _a !== void 0 ? _a : 0;
    if (metric === "totalPoints")
        return (_b = d.totalPoints) !== null && _b !== void 0 ? _b : 0;
    if (metric === "totalPrecision")
        return (_c = d.totalPrecision) !== null && _c !== void 0 ? _c : 0;
    return (_d = d.totalUpset) !== null && _d !== void 0 ? _d : 0;
}
/* =========================================================
 * Main
 * =======================================================*/
async function buildMonthlyLeaderboardSnapshot(params) {
    var _a, _b;
    const { league, month } = params;
    const docId = `${league}_${month}`;
    const leaderboardSnap = await db()
        .collection("leaderboards_monthly")
        .doc(docId)
        .get();
    if (!leaderboardSnap.exists) {
        return {
            ok: false,
            error: "monthly leaderboard not found",
            league,
            month,
        };
    }
    const rows = (_b = (_a = leaderboardSnap.data()) === null || _a === void 0 ? void 0 : _a.rows) !== null && _b !== void 0 ? _b : [];
    for (const metric of METRICS) {
        const top10 = [...rows]
            .sort((a, b) => {
            var _a, _b, _c, _d;
            const diff = getValue(b, metric) - getValue(a, metric);
            if (diff !== 0)
                return diff;
            if (metric === "winRate") {
                const postsDiff = ((_a = b.posts) !== null && _a !== void 0 ? _a : 0) - ((_b = a.posts) !== null && _b !== void 0 ? _b : 0);
                if (postsDiff !== 0)
                    return postsDiff;
            }
            return ((_c = b.totalPoints) !== null && _c !== void 0 ? _c : 0) - ((_d = a.totalPoints) !== null && _d !== void 0 ? _d : 0);
        })
            .slice(0, 10)
            .map((row, index) => (Object.assign(Object.assign({}, row), { rank: index + 1 })));
        await db()
            .collection("monthly_leaderboard_snapshots")
            .doc(`${league}_${month}_${metric}`)
            .set({
            league,
            month,
            metric,
            rows: top10,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        }, { merge: true });
    }
    return {
        ok: true,
        league,
        month,
        metrics: METRICS.length,
    };
}
//# sourceMappingURL=buildMonthlyLeaderboardSnapshot.js.map