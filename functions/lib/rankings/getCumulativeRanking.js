"use strict";
// functions/src/rankings/getCumulativeRanking.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCumulativeRanking = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
function db() {
    return (0, firestore_1.getFirestore)();
}
function isMetric(v) {
    return (v === "winRate" ||
        v === "totalPoints" ||
        v === "totalPrecision" ||
        v === "totalUpset" ||
        v === "activeWinStreak");
}
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
exports.getCumulativeRanking = (0, https_1.onRequest)(async (req, res) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    try {
        const rawMetric = req.query.metric;
        const uid = req.query.uid;
        const metric = isMetric(rawMetric) ? rawMetric : "totalPoints";
        /* =========================
         * ① Top20（snapshot）
         * =======================*/
        const snapDoc = await db()
            .collection("cumulative_ranking_snapshots")
            .doc(metric)
            .get();
        const rows = snapDoc.exists
            ? ((_b = (_a = snapDoc.data()) === null || _a === void 0 ? void 0 : _a.rows) !== null && _b !== void 0 ? _b : [])
            : [];
        let myRank = null;
        let myRow = null;
        /* =========================
         * ② 自分の順位 + 自分のデータ
         * =======================*/
        if (uid) {
            const mySnap = await db().collection("cumulative_stats").doc(uid).get();
            if (mySnap.exists) {
                const me = mySnap.data();
                const rk = rankingSlice(me);
                const myValue = metric === "activeWinStreak"
                    ? (_c = me.activeWinStreak) !== null && _c !== void 0 ? _c : 0
                    : metric === "winRate"
                        ? (_d = rk.winRate) !== null && _d !== void 0 ? _d : 0
                        : (_e = rk[metric]) !== null && _e !== void 0 ? _e : 0;
                const hasRankingObj = me.ranking &&
                    typeof me.ranking === "object" &&
                    (me.ranking.totalPosts != null || me.ranking.totalPoints != null);
                const rankField = metric === "activeWinStreak"
                    ? new firestore_1.FieldPath("activeWinStreak")
                    : hasRankingObj
                        ? metric === "winRate"
                            ? new firestore_1.FieldPath("ranking", "winRate")
                            : new firestore_1.FieldPath("ranking", metric)
                        : metric === "winRate"
                            ? "winRate"
                            : metric;
                const higherSnap = await db()
                    .collection("cumulative_stats")
                    .where(rankField, ">", myValue)
                    .count()
                    .get();
                myRank = ((_f = higherSnap.data().count) !== null && _f !== void 0 ? _f : 0) + 1;
                myRow = {
                    uid,
                    displayName: (_g = me.displayName) !== null && _g !== void 0 ? _g : "",
                    handle: (_h = me.handle) !== null && _h !== void 0 ? _h : null,
                    photoURL: (_j = me.photoURL) !== null && _j !== void 0 ? _j : null,
                    countryCode: (_k = me.countryCode) !== null && _k !== void 0 ? _k : null,
                    totalPosts: rk.totalPosts,
                    totalWins: rk.totalWins,
                    winRate: rk.winRate,
                    totalPoints: rk.totalPoints,
                    totalPrecision: rk.totalPrecision,
                    totalUpset: rk.totalUpset,
                    activeWinStreak: (_l = me.activeWinStreak) !== null && _l !== void 0 ? _l : 0,
                    rank: myRank,
                };
            }
        }
        /* =========================
         * response
         * =======================*/
        res.status(200).json({
            ok: true,
            metric,
            count: rows.length,
            rows,
            myRank,
            myRow,
        });
        return;
    }
    catch (e) {
        res.status(500).json({
            ok: false,
            error: (_m = e === null || e === void 0 ? void 0 : e.message) !== null && _m !== void 0 ? _m : "unknown error",
        });
        return;
    }
});
//# sourceMappingURL=getCumulativeRanking.js.map