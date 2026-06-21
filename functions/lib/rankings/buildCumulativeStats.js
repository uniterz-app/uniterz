"use strict";
// functions/src/rankings/buildCumulativeStats.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCumulativeStats = buildCumulativeStats;
const firestore_1 = require("firebase-admin/firestore");
const dailyWcStageBuckets_1 = require("./dailyWcStageBuckets");
const safeRankMetricNum_1 = require("./safeRankMetricNum");
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
    const precisionInc = inc.precisionFromExactHits
        ? (0, safeRankMetricNum_1.safeRankMetricNum)(inc.exactHitCount)
        : (0, safeRankMetricNum_1.safeRankMetricNum)(inc.scorePrecisionSum);
    return {
        totalPosts: (0, safeRankMetricNum_1.safeRankMetricNum)(base.totalPosts) + (0, safeRankMetricNum_1.safeRankMetricNum)(inc.posts),
        totalWins: (0, safeRankMetricNum_1.safeRankMetricNum)(base.totalWins) + (0, safeRankMetricNum_1.safeRankMetricNum)(inc.wins),
        totalPoints: (0, safeRankMetricNum_1.safeRankMetricNum)(base.totalPoints) + (0, safeRankMetricNum_1.safeRankMetricNum)(inc.pointsSumV3),
        totalUpset: (0, safeRankMetricNum_1.safeRankMetricNum)(base.totalUpset) + (0, safeRankMetricNum_1.safeRankMetricNum)(inc.upsetPointsSum),
        totalPrecision: (0, safeRankMetricNum_1.safeRankMetricNum)(base.totalPrecision) + precisionInc,
        totalGoalScorerHits: (0, safeRankMetricNum_1.safeRankMetricNum)(base.totalGoalScorerHits) +
            (0, safeRankMetricNum_1.safeRankMetricNum)(inc.goalScorerHitCount),
    };
}
/* =========================================================
 * Main
 * =======================================================*/
async function buildCumulativeStats() {
    const dateKey = getTodayJST();
    const firestore = db();
    const PAGE_SIZE = 500;
    const CONCURRENCY = 20;
    let updated = 0;
    let skipped = 0;
    let scanned = 0;
    const processDoc = async (doc) => {
        var _a, _b, _c;
        const data = doc.data();
        const uid = doc.id.split("_")[0];
        if (!uid)
            return { updated: false };
        const statsAll = data.all;
        if (!statsAll)
            return { updated: false };
        /** 日次に ranking が無い = デプロイ前データ → ランキング側も all と同じ増分 */
        const statsRanking = (_a = data.ranking) !== null && _a !== void 0 ? _a : data.all;
        const statsByPhase = (_b = data.rankingByPhase) !== null && _b !== void 0 ? _b : {};
        const statsByPlayoffRound = (_c = data.rankingByPlayoffRound) !== null && _c !== void 0 ? _c : {};
        const statsByWcStage = (0, dailyWcStageBuckets_1.readDailyWcStageBuckets)(data);
        const cumulativeRef = firestore.doc(`cumulative_stats/${uid}`);
        const userRef = firestore.doc(`users/${uid}`);
        return firestore.runTransaction(async (tx) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24, _25, _26, _27, _28, _29, _30, _31, _32, _33, _34, _35, _36, _37, _38;
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
                totalGoalScorerHits: 0,
                winRate: 0,
            };
            const prevPlayoffs = (_u = prevByPhase.playoffs) !== null && _u !== void 0 ? _u : {
                totalPosts: 0,
                totalWins: 0,
                totalPoints: 0,
                totalUpset: 0,
                totalPrecision: 0,
                totalGoalScorerHits: 0,
                winRate: 0,
            };
            const nextPlayInRaw = addRankingTotals(prevPlayIn, {
                posts: (_w = (_v = statsByPhase.play_in) === null || _v === void 0 ? void 0 : _v.posts) !== null && _w !== void 0 ? _w : 0,
                wins: (_y = (_x = statsByPhase.play_in) === null || _x === void 0 ? void 0 : _x.wins) !== null && _y !== void 0 ? _y : 0,
                pointsSumV3: (_0 = (_z = statsByPhase.play_in) === null || _z === void 0 ? void 0 : _z.pointsSumV3) !== null && _0 !== void 0 ? _0 : 0,
                upsetPointsSum: (_2 = (_1 = statsByPhase.play_in) === null || _1 === void 0 ? void 0 : _1.upsetPointsSum) !== null && _2 !== void 0 ? _2 : 0,
                scorePrecisionSum: (_4 = (_3 = statsByPhase.play_in) === null || _3 === void 0 ? void 0 : _3.scorePrecisionSum) !== null && _4 !== void 0 ? _4 : 0,
                goalScorerHitCount: (_6 = (_5 = statsByPhase.play_in) === null || _5 === void 0 ? void 0 : _5.goalScorerHitCount) !== null && _6 !== void 0 ? _6 : 0,
            });
            const nextPlayoffsRaw = addRankingTotals(prevPlayoffs, {
                posts: (_8 = (_7 = statsByPhase.playoffs) === null || _7 === void 0 ? void 0 : _7.posts) !== null && _8 !== void 0 ? _8 : 0,
                wins: (_10 = (_9 = statsByPhase.playoffs) === null || _9 === void 0 ? void 0 : _9.wins) !== null && _10 !== void 0 ? _10 : 0,
                pointsSumV3: (_12 = (_11 = statsByPhase.playoffs) === null || _11 === void 0 ? void 0 : _11.pointsSumV3) !== null && _12 !== void 0 ? _12 : 0,
                upsetPointsSum: (_14 = (_13 = statsByPhase.playoffs) === null || _13 === void 0 ? void 0 : _13.upsetPointsSum) !== null && _14 !== void 0 ? _14 : 0,
                scorePrecisionSum: (_16 = (_15 = statsByPhase.playoffs) === null || _15 === void 0 ? void 0 : _15.scorePrecisionSum) !== null && _16 !== void 0 ? _16 : 0,
                goalScorerHitCount: (_18 = (_17 = statsByPhase.playoffs) === null || _17 === void 0 ? void 0 : _17.goalScorerHitCount) !== null && _18 !== void 0 ? _18 : 0,
            });
            const nextPlayIn = Object.assign(Object.assign({}, nextPlayInRaw), { winRate: nextPlayInRaw.totalPosts > 0
                    ? nextPlayInRaw.totalWins / nextPlayInRaw.totalPosts
                    : 0 });
            const nextPlayoffs = Object.assign(Object.assign({}, nextPlayoffsRaw), { winRate: nextPlayoffsRaw.totalPosts > 0
                    ? nextPlayoffsRaw.totalWins / nextPlayoffsRaw.totalPosts
                    : 0 });
            /* =========================
             * プレーオフラウンド別ランキング累積（r1 / r2 / cf / finals）
             * =======================*/
            const prevByRound = ((_19 = cumulativeSnap.get("rankingByPlayoffRound")) !== null && _19 !== void 0 ? _19 : {});
            const roundKeys = ["r1", "r2", "cf", "finals"];
            const nextByRound = {};
            for (const rk of roundKeys) {
                const prevRound = (_20 = prevByRound[rk]) !== null && _20 !== void 0 ? _20 : {
                    totalPosts: 0,
                    totalWins: 0,
                    totalPoints: 0,
                    totalUpset: 0,
                    totalPrecision: 0,
                    totalGoalScorerHits: 0,
                    winRate: 0,
                };
                const nextRoundRaw = addRankingTotals(prevRound, {
                    posts: (_22 = (_21 = statsByPlayoffRound[rk]) === null || _21 === void 0 ? void 0 : _21.posts) !== null && _22 !== void 0 ? _22 : 0,
                    wins: (_24 = (_23 = statsByPlayoffRound[rk]) === null || _23 === void 0 ? void 0 : _23.wins) !== null && _24 !== void 0 ? _24 : 0,
                    pointsSumV3: (_26 = (_25 = statsByPlayoffRound[rk]) === null || _25 === void 0 ? void 0 : _25.pointsSumV3) !== null && _26 !== void 0 ? _26 : 0,
                    upsetPointsSum: (_28 = (_27 = statsByPlayoffRound[rk]) === null || _27 === void 0 ? void 0 : _27.upsetPointsSum) !== null && _28 !== void 0 ? _28 : 0,
                    scorePrecisionSum: (_30 = (_29 = statsByPlayoffRound[rk]) === null || _29 === void 0 ? void 0 : _29.scorePrecisionSum) !== null && _30 !== void 0 ? _30 : 0,
                    goalScorerHitCount: (_32 = (_31 = statsByPlayoffRound[rk]) === null || _31 === void 0 ? void 0 : _31.goalScorerHitCount) !== null && _32 !== void 0 ? _32 : 0,
                });
                nextByRound[rk] = Object.assign(Object.assign({}, nextRoundRaw), { winRate: nextRoundRaw.totalPosts > 0
                        ? nextRoundRaw.totalWins / nextRoundRaw.totalPosts
                        : 0 });
            }
            /* =========================
             * World Cup ステージ別（overall / qualifying / main）
             * =======================*/
            const prevByWc = ((_33 = cumulativeSnap.get("rankingByWcStage")) !== null && _33 !== void 0 ? _33 : {});
            const nextByWc = {};
            for (const wk of dailyWcStageBuckets_1.WC_RANKING_STAGES) {
                const prevW = (_34 = prevByWc[wk]) !== null && _34 !== void 0 ? _34 : {
                    totalPosts: 0,
                    totalWins: 0,
                    totalPoints: 0,
                    totalUpset: 0,
                    totalPrecision: 0,
                    totalGoalScorerHits: 0,
                    winRate: 0,
                };
                const src = statsByWcStage[wk];
                const num = (v) => {
                    const n = typeof v === "number" ? v : Number(v);
                    return Number.isFinite(n) ? n : 0;
                };
                const nextWRaw = addRankingTotals(prevW, {
                    posts: num(src === null || src === void 0 ? void 0 : src.posts),
                    wins: num(src === null || src === void 0 ? void 0 : src.wins),
                    pointsSumV3: num(src === null || src === void 0 ? void 0 : src.pointsSumV3),
                    upsetPointsSum: num(src === null || src === void 0 ? void 0 : src.upsetPointsSum),
                    exactHitCount: num(src === null || src === void 0 ? void 0 : src.exactHitCount),
                    goalScorerHitCount: num(src === null || src === void 0 ? void 0 : src.goalScorerHitCount),
                    precisionFromExactHits: true,
                });
                nextByWc[wk] = Object.assign(Object.assign({}, nextWRaw), { winRate: nextWRaw.totalPosts > 0
                        ? nextWRaw.totalWins / nextWRaw.totalPosts
                        : 0 });
            }
            tx.set(cumulativeRef, {
                uid,
                displayName: (_35 = user.displayName) !== null && _35 !== void 0 ? _35 : "user",
                handle: (_36 = user.handle) !== null && _36 !== void 0 ? _36 : null,
                photoURL: (_37 = user.photoURL) !== null && _37 !== void 0 ? _37 : null,
                countryCode: (_38 = user.countryCode) !== null && _38 !== void 0 ? _38 : null,
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
                rankingByPlayoffRound: nextByRound,
                rankingByWcStage: nextByWc,
                lastAggregatedDate: dateKey,
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            }, { merge: true });
            return { updated: true };
        });
    };
    let cursor;
    for (;;) {
        let q = firestore
            .collection("user_stats_v2_daily")
            .where("date", "==", dateKey)
            .orderBy(firestore_1.FieldPath.documentId())
            .limit(PAGE_SIZE);
        if (cursor)
            q = q.startAfter(cursor);
        const pageSnap = await q.get();
        if (pageSnap.empty)
            break;
        scanned += pageSnap.size;
        cursor = pageSnap.docs[pageSnap.docs.length - 1];
        for (let i = 0; i < pageSnap.docs.length; i += CONCURRENCY) {
            const chunk = pageSnap.docs.slice(i, i + CONCURRENCY);
            const chunkResults = await Promise.all(chunk.map((d) => processDoc(d)));
            chunkResults.forEach((r) => {
                if (r.updated)
                    updated++;
                else
                    skipped++;
            });
        }
    }
    return {
        date: dateKey,
        scanned,
        updated,
        skipped,
    };
}
//# sourceMappingURL=buildCumulativeStats.js.map