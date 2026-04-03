"use strict";
// functions/src/rankings/buildCumulativeStats.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCumulativeStats = buildCumulativeStats;
const firestore_1 = require("firebase-admin/firestore");
function db() {
    return (0, firestore_1.getFirestore)();
}
/* =========================================================
 * JST utils
 * =======================================================*/
function toDateKeyJST(d) {
    const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const y = j.getUTCFullYear();
    const m = String(j.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(j.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
}
function getTodayJST() {
    return toDateKeyJST(new Date());
}
/* =========================================================
 * Main
 * =======================================================*/
async function buildCumulativeStats() {
    var _a;
    const dateKey = getTodayJST();
    const dailySnap = await db()
        .collection("user_stats_v2_daily")
        .where("date", "==", dateKey)
        .get();
    let updated = 0;
    let skipped = 0;
    for (const doc of dailySnap.docs) {
        const data = doc.data();
        const uid = doc.id.split("_")[0];
        if (!uid)
            continue;
        const statsAll = data.all;
        if (!statsAll)
            continue;
        /** 日次に ranking が無い = デプロイ前データ → ランキング側も all と同じ増分 */
        const statsRanking = (_a = data.ranking) !== null && _a !== void 0 ? _a : data.all;
        const cumulativeRef = db().doc(`cumulative_stats/${uid}`);
        const userRef = db().doc(`users/${uid}`);
        const result = await db().runTransaction(async (tx) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v;
            const [cumulativeSnap, userSnap] = await Promise.all([
                tx.get(cumulativeRef),
                tx.get(userRef),
            ]);
            const lastAggregatedDate = (_a = cumulativeSnap.get("lastAggregatedDate")) !== null && _a !== void 0 ? _a : null;
            if (lastAggregatedDate === dateKey) {
                return { updated: false };
            }
            const user = userSnap.exists ? userSnap.data() : {};
            /* =========================
             * 累積値（プロフィール = 全試合）
             * =======================*/
            const prevPosts = (_b = cumulativeSnap.get("totalPosts")) !== null && _b !== void 0 ? _b : 0;
            const prevWins = (_c = cumulativeSnap.get("totalWins")) !== null && _c !== void 0 ? _c : 0;
            const prevPoints = (_d = cumulativeSnap.get("totalPoints")) !== null && _d !== void 0 ? _d : 0;
            const prevUpset = (_e = cumulativeSnap.get("totalUpset")) !== null && _e !== void 0 ? _e : 0;
            const prevPrecision = (_f = cumulativeSnap.get("totalPrecision")) !== null && _f !== void 0 ? _f : 0;
            const addPosts = (_g = statsAll.posts) !== null && _g !== void 0 ? _g : 0;
            const addWins = (_h = statsAll.wins) !== null && _h !== void 0 ? _h : 0;
            const addPoints = (_j = statsAll.pointsSumV3) !== null && _j !== void 0 ? _j : 0;
            const addUpset = (_k = statsAll.upsetPointsSum) !== null && _k !== void 0 ? _k : 0;
            const addPrecision = (_l = statsAll.scorePrecisionSum) !== null && _l !== void 0 ? _l : 0;
            const nextPosts = prevPosts + addPosts;
            const nextWins = prevWins + addWins;
            const nextPoints = prevPoints + addPoints;
            const nextUpset = prevUpset + addUpset;
            const nextPrecision = prevPrecision + addPrecision;
            const winRate = nextPosts > 0 ? nextWins / nextPosts : 0;
            /* =========================
             * ランキング用累積（プレーイン除外など）
             * ranking 未保存時はプロフィール累積でブートストラップ（二重計上防止）
             * =======================*/
            const prevR = cumulativeSnap.get("ranking");
            const bootPosts = (prevR === null || prevR === void 0 ? void 0 : prevR.totalPosts) != null ? prevR.totalPosts : prevPosts;
            const bootWins = (prevR === null || prevR === void 0 ? void 0 : prevR.totalWins) != null ? prevR.totalWins : prevWins;
            const bootPoints = (prevR === null || prevR === void 0 ? void 0 : prevR.totalPoints) != null ? prevR.totalPoints : prevPoints;
            const bootUpset = (prevR === null || prevR === void 0 ? void 0 : prevR.totalUpset) != null ? prevR.totalUpset : prevUpset;
            const bootPrecision = (prevR === null || prevR === void 0 ? void 0 : prevR.totalPrecision) != null ? prevR.totalPrecision : prevPrecision;
            const addRPosts = (_m = statsRanking.posts) !== null && _m !== void 0 ? _m : 0;
            const addRWins = (_o = statsRanking.wins) !== null && _o !== void 0 ? _o : 0;
            const addRPoints = (_p = statsRanking.pointsSumV3) !== null && _p !== void 0 ? _p : 0;
            const addRUpset = (_q = statsRanking.upsetPointsSum) !== null && _q !== void 0 ? _q : 0;
            const addRPrecision = (_r = statsRanking.scorePrecisionSum) !== null && _r !== void 0 ? _r : 0;
            const nextRPosts = bootPosts + addRPosts;
            const nextRWins = bootWins + addRWins;
            const nextRPoints = bootPoints + addRPoints;
            const nextRUpset = bootUpset + addRUpset;
            const nextRPrecision = bootPrecision + addRPrecision;
            const winRateRanking = nextRPosts > 0 ? nextRWins / nextRPosts : 0;
            tx.set(cumulativeRef, {
                uid,
                displayName: (_s = user.displayName) !== null && _s !== void 0 ? _s : "user",
                handle: (_t = user.handle) !== null && _t !== void 0 ? _t : null,
                photoURL: (_u = user.photoURL) !== null && _u !== void 0 ? _u : null,
                countryCode: (_v = user.countryCode) !== null && _v !== void 0 ? _v : null,
                totalPosts: nextPosts,
                totalWins: nextWins,
                totalPoints: nextPoints,
                totalUpset: nextUpset,
                totalPrecision: nextPrecision,
                winRate,
                ranking: {
                    totalPosts: nextRPosts,
                    totalWins: nextRWins,
                    totalPoints: nextRPoints,
                    totalUpset: nextRUpset,
                    totalPrecision: nextRPrecision,
                    winRate: winRateRanking,
                },
                lastAggregatedDate: dateKey,
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            }, { merge: true });
            return { updated: true };
        });
        if (result.updated)
            updated++;
        else
            skipped++;
    }
    return {
        date: dateKey,
        scanned: dailySnap.size,
        updated,
        skipped,
    };
}
//# sourceMappingURL=buildCumulativeStats.js.map