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
exports.getCumulativeRanking = (0, https_1.onRequest)(async (req, res) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
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
                const myValue = metric === "winRate" ? (_c = me.winRate) !== null && _c !== void 0 ? _c : 0 : (_d = me[metric]) !== null && _d !== void 0 ? _d : 0;
                const higherSnap = await db()
                    .collection("cumulative_stats")
                    .where(metric === "winRate" ? "winRate" : metric, ">", myValue)
                    .count()
                    .get();
                myRank = ((_e = higherSnap.data().count) !== null && _e !== void 0 ? _e : 0) + 1;
                myRow = {
                    uid,
                    displayName: (_f = me.displayName) !== null && _f !== void 0 ? _f : "",
                    handle: (_g = me.handle) !== null && _g !== void 0 ? _g : null,
                    photoURL: (_h = me.photoURL) !== null && _h !== void 0 ? _h : null,
                    countryCode: (_j = me.countryCode) !== null && _j !== void 0 ? _j : null,
                    totalPosts: (_k = me.totalPosts) !== null && _k !== void 0 ? _k : 0,
                    totalWins: (_l = me.totalWins) !== null && _l !== void 0 ? _l : 0,
                    winRate: (_m = me.winRate) !== null && _m !== void 0 ? _m : 0,
                    totalPoints: (_o = me.totalPoints) !== null && _o !== void 0 ? _o : 0,
                    totalPrecision: (_p = me.totalPrecision) !== null && _p !== void 0 ? _p : 0,
                    totalUpset: (_q = me.totalUpset) !== null && _q !== void 0 ? _q : 0,
                    activeWinStreak: (_r = me.activeWinStreak) !== null && _r !== void 0 ? _r : 0,
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
            error: (_s = e === null || e === void 0 ? void 0 : e.message) !== null && _s !== void 0 ? _s : "unknown error",
        });
        return;
    }
});
//# sourceMappingURL=getCumulativeRanking.js.map