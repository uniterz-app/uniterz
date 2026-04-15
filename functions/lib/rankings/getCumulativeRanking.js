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
function isRankingPhase(v) {
    return v === "play_in" || v === "playoffs";
}
function rankingSlice(d, phase) {
    var _a, _b, _c, _d, _e, _f, _g;
    const byPhase = (_a = d.rankingByPhase) === null || _a === void 0 ? void 0 : _a[phase];
    if (byPhase && typeof byPhase === "object") {
        const tp = (_b = byPhase.totalPosts) !== null && _b !== void 0 ? _b : 0;
        const tw = (_c = byPhase.totalWins) !== null && _c !== void 0 ? _c : 0;
        return {
            totalPosts: tp,
            totalWins: tw,
            winRate: tp > 0 ? tw / tp : (_d = byPhase.winRate) !== null && _d !== void 0 ? _d : 0,
            totalPoints: (_e = byPhase.totalPoints) !== null && _e !== void 0 ? _e : 0,
            totalPrecision: (_f = byPhase.totalPrecision) !== null && _f !== void 0 ? _f : 0,
            totalUpset: (_g = byPhase.totalUpset) !== null && _g !== void 0 ? _g : 0,
        };
    }
    return {
        totalPosts: 0,
        totalWins: 0,
        winRate: 0,
        totalPoints: 0,
        totalPrecision: 0,
        totalUpset: 0,
    };
}
exports.getCumulativeRanking = (0, https_1.onRequest)(async (req, res) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
    try {
        const rawMetric = req.query.metric;
        const uid = req.query.uid;
        const rawPhase = req.query.phase;
        const metric = isMetric(rawMetric) ? rawMetric : "totalPoints";
        const phase = isRankingPhase(rawPhase) ? rawPhase : "playoffs";
        /* =========================
         * ① Top20（snapshot）
         * =======================*/
        const snapDoc = await db()
            .collection("cumulative_ranking_snapshots")
            .doc(`${phase}_${metric}`)
            .get();
        const rawRows = snapDoc.exists
            ? ((_b = (_a = snapDoc.data()) === null || _a === void 0 ? void 0 : _a.rows) !== null && _b !== void 0 ? _b : [])
            : [];
        let rows = rawRows.map((row) => (Object.assign(Object.assign({}, row), { plan: row.plan === "pro" ? "pro" : "free" })));
        // スナップショットが plan 未保存の世代だけ users.plan を補完（常時20件readを避ける）
        const missingPlanUids = rawRows
            .filter((r) => (r === null || r === void 0 ? void 0 : r.uid) && r.plan !== "pro" && r.plan !== "free")
            .map((r) => r.uid);
        const rowUids = [...new Set(missingPlanUids)];
        const planByUid = new Map();
        if (rowUids.length > 0) {
            const refs = rowUids.map((id) => db().collection("users").doc(id));
            const userSnaps = await db().getAll(...refs);
            userSnaps.forEach((s, i) => {
                const id = rowUids[i];
                if (!id)
                    return;
                if (!s.exists) {
                    planByUid.set(id, "free");
                    return;
                }
                const u = s.data();
                planByUid.set(id, (u === null || u === void 0 ? void 0 : u.plan) === "pro" ? "pro" : "free");
            });
            rows = rows.map((r) => {
                var _a;
                return (Object.assign(Object.assign({}, r), { plan: (_a = planByUid.get(r.uid)) !== null && _a !== void 0 ? _a : r.plan }));
            });
        }
        let myRank = null;
        let myRow = null;
        /* =========================
         * ② 自分の順位 + 自分のデータ
         * =======================*/
        if (uid) {
            const mySnap = await db().collection("cumulative_stats").doc(uid).get();
            if (mySnap.exists) {
                const me = mySnap.data();
                const rk = rankingSlice(me, phase);
                if (((_c = rk.totalPosts) !== null && _c !== void 0 ? _c : 0) <= 0) {
                    res.status(200).json({
                        ok: true,
                        metric,
                        phase,
                        count: rows.length,
                        rows,
                        myRank: null,
                        myRow: null,
                    });
                    return;
                }
                const storedRankRaw = (_e = (_d = me.snapshotRanks) === null || _d === void 0 ? void 0 : _d[phase]) === null || _e === void 0 ? void 0 : _e[metric];
                const storedRank = typeof storedRankRaw === "number" &&
                    Number.isFinite(storedRankRaw) &&
                    storedRankRaw >= 1
                    ? Math.floor(storedRankRaw)
                    : null;
                if (storedRank != null) {
                    myRank = storedRank;
                }
                else {
                    const myValue = metric === "activeWinStreak"
                        ? (_f = me.activeWinStreak) !== null && _f !== void 0 ? _f : 0
                        : metric === "winRate"
                            ? (_g = rk.winRate) !== null && _g !== void 0 ? _g : 0
                            : (_h = rk[metric]) !== null && _h !== void 0 ? _h : 0;
                    const hasRankingObj = ((_j = me.rankingByPhase) === null || _j === void 0 ? void 0 : _j[phase]) &&
                        typeof me.rankingByPhase[phase] === "object" &&
                        (me.rankingByPhase[phase].totalPosts != null ||
                            me.rankingByPhase[phase].totalPoints != null);
                    const rankField = metric === "activeWinStreak"
                        ? new firestore_1.FieldPath("activeWinStreak")
                        : hasRankingObj
                            ? metric === "winRate"
                                ? new firestore_1.FieldPath("rankingByPhase", phase, "winRate")
                                : new firestore_1.FieldPath("rankingByPhase", phase, metric)
                            : metric === "winRate"
                                ? "winRate"
                                : metric;
                    const higherSnap = await db()
                        .collection("cumulative_stats")
                        .where(rankField, ">", myValue)
                        .count()
                        .get();
                    myRank = ((_k = higherSnap.data().count) !== null && _k !== void 0 ? _k : 0) + 1;
                }
                // myRow は cumulative_stats の plan を優先（追加readを避ける）
                const myPlanResolved = me.plan === "pro" ? "pro" : "free";
                myRow = {
                    uid,
                    displayName: (_l = me.displayName) !== null && _l !== void 0 ? _l : "",
                    handle: (_m = me.handle) !== null && _m !== void 0 ? _m : null,
                    photoURL: (_o = me.photoURL) !== null && _o !== void 0 ? _o : null,
                    countryCode: (_p = me.countryCode) !== null && _p !== void 0 ? _p : null,
                    plan: myPlanResolved,
                    totalPosts: rk.totalPosts,
                    totalWins: rk.totalWins,
                    winRate: rk.winRate,
                    totalPoints: rk.totalPoints,
                    totalPrecision: rk.totalPrecision,
                    totalUpset: rk.totalUpset,
                    activeWinStreak: (_q = me.activeWinStreak) !== null && _q !== void 0 ? _q : 0,
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
            phase,
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
            error: (_r = e === null || e === void 0 ? void 0 : e.message) !== null && _r !== void 0 ? _r : "unknown error",
        });
        return;
    }
});
//# sourceMappingURL=getCumulativeRanking.js.map