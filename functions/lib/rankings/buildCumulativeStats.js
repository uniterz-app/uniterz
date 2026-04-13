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
function addRankingTotals(base, inc) {
    var _a, _b, _c, _d, _e;
    return {
        totalPosts: base.totalPosts + ((_a = inc.posts) !== null && _a !== void 0 ? _a : 0),
        totalWins: base.totalWins + ((_b = inc.wins) !== null && _b !== void 0 ? _b : 0),
        totalPoints: base.totalPoints + ((_c = inc.pointsSumV3) !== null && _c !== void 0 ? _c : 0),
        totalUpset: base.totalUpset + ((_d = inc.upsetPointsSum) !== null && _d !== void 0 ? _d : 0),
        totalPrecision: base.totalPrecision + ((_e = inc.scorePrecisionSum) !== null && _e !== void 0 ? _e : 0),
    };
}
/* =========================================================
 * Main
 * =======================================================*/
async function buildCumulativeStats() {
    var _a, _b;
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
        const statsByPhase = (_b = data.rankingByPhase) !== null && _b !== void 0 ? _b : {};
        const cumulativeRef = db().doc(`cumulative_stats/${uid}`);
        const userRef = db().doc(`users/${uid}`);
        const result = await db().runTransaction(async (tx) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18;
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
            /* =========================
             * フェーズ別ランキング累積（play_in / playoffs）
             * =======================*/
            const prevByPhase = ((_s = cumulativeSnap.get("rankingByPhase")) !== null && _s !== void 0 ? _s : {});
            const prevPlayIn = (_t = prevByPhase.play_in) !== null && _t !== void 0 ? _t : {
                totalPosts: 0,
                totalWins: 0,
                totalPoints: 0,
                totalUpset: 0,
                totalPrecision: 0,
                winRate: 0,
            };
            const prevPlayoffs = (_u = prevByPhase.playoffs) !== null && _u !== void 0 ? _u : {
                totalPosts: 0,
                totalWins: 0,
                totalPoints: 0,
                totalUpset: 0,
                totalPrecision: 0,
                winRate: 0,
            };
            const nextPlayInRaw = addRankingTotals(prevPlayIn, {
                posts: (_w = (_v = statsByPhase.play_in) === null || _v === void 0 ? void 0 : _v.posts) !== null && _w !== void 0 ? _w : 0,
                wins: (_y = (_x = statsByPhase.play_in) === null || _x === void 0 ? void 0 : _x.wins) !== null && _y !== void 0 ? _y : 0,
                pointsSumV3: (_0 = (_z = statsByPhase.play_in) === null || _z === void 0 ? void 0 : _z.pointsSumV3) !== null && _0 !== void 0 ? _0 : 0,
                upsetPointsSum: (_2 = (_1 = statsByPhase.play_in) === null || _1 === void 0 ? void 0 : _1.upsetPointsSum) !== null && _2 !== void 0 ? _2 : 0,
                scorePrecisionSum: (_4 = (_3 = statsByPhase.play_in) === null || _3 === void 0 ? void 0 : _3.scorePrecisionSum) !== null && _4 !== void 0 ? _4 : 0,
            });
            const nextPlayoffsRaw = addRankingTotals(prevPlayoffs, {
                posts: (_6 = (_5 = statsByPhase.playoffs) === null || _5 === void 0 ? void 0 : _5.posts) !== null && _6 !== void 0 ? _6 : 0,
                wins: (_8 = (_7 = statsByPhase.playoffs) === null || _7 === void 0 ? void 0 : _7.wins) !== null && _8 !== void 0 ? _8 : 0,
                pointsSumV3: (_10 = (_9 = statsByPhase.playoffs) === null || _9 === void 0 ? void 0 : _9.pointsSumV3) !== null && _10 !== void 0 ? _10 : 0,
                upsetPointsSum: (_12 = (_11 = statsByPhase.playoffs) === null || _11 === void 0 ? void 0 : _11.upsetPointsSum) !== null && _12 !== void 0 ? _12 : 0,
                scorePrecisionSum: (_14 = (_13 = statsByPhase.playoffs) === null || _13 === void 0 ? void 0 : _13.scorePrecisionSum) !== null && _14 !== void 0 ? _14 : 0,
            });
            const nextPlayIn = Object.assign(Object.assign({}, nextPlayInRaw), { winRate: nextPlayInRaw.totalPosts > 0
                    ? nextPlayInRaw.totalWins / nextPlayInRaw.totalPosts
                    : 0 });
            const nextPlayoffs = Object.assign(Object.assign({}, nextPlayoffsRaw), { winRate: nextPlayoffsRaw.totalPosts > 0
                    ? nextPlayoffsRaw.totalWins / nextPlayoffsRaw.totalPosts
                    : 0 });
            tx.set(cumulativeRef, {
                uid,
                displayName: (_15 = user.displayName) !== null && _15 !== void 0 ? _15 : "user",
                handle: (_16 = user.handle) !== null && _16 !== void 0 ? _16 : null,
                photoURL: (_17 = user.photoURL) !== null && _17 !== void 0 ? _17 : null,
                countryCode: (_18 = user.countryCode) !== null && _18 !== void 0 ? _18 : null,
                plan: user.plan === "pro" ? "pro" : "free",
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
                rankingByPhase: {
                    play_in: nextPlayIn,
                    playoffs: nextPlayoffs,
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