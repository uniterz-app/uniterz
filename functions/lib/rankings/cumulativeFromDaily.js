"use strict";
// functions/src/rankings/cumulativeFromDaily.ts
// cumulative_stats を日次（user_stats_v2_daily）と整合させる共通ロジック
Object.defineProperty(exports, "__esModule", { value: true });
exports.addRankingTotals = addRankingTotals;
exports.buildCumulativeIncrementFields = buildCumulativeIncrementFields;
exports.applyCumulativeIncrementInTransaction = applyCumulativeIncrementInTransaction;
exports.aggregateCumulativeFromDailyData = aggregateCumulativeFromDailyData;
exports.aggregatedCumulativeMatchesDoc = aggregatedCumulativeMatchesDoc;
exports.cumulativePayloadFromAggregate = cumulativePayloadFromAggregate;
exports.fetchAllDailyDocsForUid = fetchAllDailyDocsForUid;
exports.reconcileCumulativeStatsForUid = reconcileCumulativeStatsForUid;
const firestore_1 = require("firebase-admin/firestore");
const dailyWcStageBuckets_1 = require("./dailyWcStageBuckets");
const safeRankMetricNum_1 = require("./safeRankMetricNum");
function emptyRankingTotals() {
    return {
        totalPosts: 0,
        totalWins: 0,
        totalPoints: 0,
        totalUpset: 0,
        totalPrecision: 0,
        totalGoalScorerHits: 0,
    };
}
function withWinRate(raw) {
    return Object.assign(Object.assign({}, raw), { winRate: raw.totalPosts > 0 ? raw.totalWins / raw.totalPosts : 0 });
}
function addRankingTotals(base, inc) {
    const precisionInc = inc.precisionFromExactHits
        ? (0, safeRankMetricNum_1.safeRankMetricNum)(inc.exactHitCount)
        : (0, safeRankMetricNum_1.safeRankMetricNum)(inc.scorePrecisionSum);
    return {
        totalPosts: (0, safeRankMetricNum_1.safeRankMetricNum)(base.totalPosts) + (0, safeRankMetricNum_1.safeRankMetricNum)(inc.posts),
        totalWins: (0, safeRankMetricNum_1.safeRankMetricNum)(base.totalWins) + (0, safeRankMetricNum_1.safeRankMetricNum)(inc.wins),
        totalPoints: (0, safeRankMetricNum_1.safeRankMetricNum)(base.totalPoints) +
            (0, safeRankMetricNum_1.safeRankMetricNum)(inc.pointsSumV3),
        totalUpset: (0, safeRankMetricNum_1.safeRankMetricNum)(base.totalUpset) +
            (0, safeRankMetricNum_1.safeRankMetricNum)(inc.upsetPointsSum),
        totalPrecision: (0, safeRankMetricNum_1.safeRankMetricNum)(base.totalPrecision) + precisionInc,
        totalGoalScorerHits: (0, safeRankMetricNum_1.safeRankMetricNum)(base.totalGoalScorerHits) +
            (0, safeRankMetricNum_1.safeRankMetricNum)(inc.goalScorerHitCount),
    };
}
function num(v) {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : 0;
}
function bucketToInc(bucket, opts) {
    var _a, _b;
    if (!bucket || typeof bucket !== "object") {
        return {
            posts: 0,
            wins: 0,
            pointsSumV3: 0,
            upsetPointsSum: 0,
            scorePrecisionSum: 0,
            exactHitCount: 0,
            goalScorerHitCount: 0,
            precisionFromExactHits: (_a = opts === null || opts === void 0 ? void 0 : opts.precisionFromExactHits) !== null && _a !== void 0 ? _a : false,
        };
    }
    return {
        posts: num(bucket.posts),
        wins: num(bucket.wins),
        pointsSumV3: num(bucket.pointsSumV3),
        upsetPointsSum: num(bucket.upsetPointsSum),
        scorePrecisionSum: num(bucket.scorePrecisionSum),
        exactHitCount: num(bucket.exactHitCount),
        goalScorerHitCount: num(bucket.goalScorerHitCount),
        precisionFromExactHits: (_b = opts === null || opts === void 0 ? void 0 : opts.precisionFromExactHits) !== null && _b !== void 0 ? _b : false,
    };
}
/** 1投稿ぶんの加算/減算（sign = 1 | -1）を cumulative_stats 用 FieldValue に変換 */
function buildCumulativeIncrementFields(contrib, sign = 1) {
    const s = sign;
    const posts = s;
    const wins = contrib.isWin ? s : 0;
    const points = contrib.points * s;
    const upset = contrib.upsetPoints * s;
    const profilePrecision = contrib.isWc ? 0 : contrib.scorePrecision * s;
    const goalScorer = contrib.goalScorerHit ? s : 0;
    const wcExact = contrib.isWc && contrib.exactHit ? s : 0;
    const nbaPrecision = contrib.isWc ? 0 : contrib.scorePrecision * s;
    const upsetBonus = (0, safeRankMetricNum_1.safeRankMetricNum)(contrib.upsetBonus) * s;
    const streakBonus = (0, safeRankMetricNum_1.safeRankMetricNum)(contrib.streakBonus) * s;
    const out = {
        totalPosts: firestore_1.FieldValue.increment(posts),
        totalWins: firestore_1.FieldValue.increment(wins),
        totalPoints: firestore_1.FieldValue.increment(points),
        totalUpset: firestore_1.FieldValue.increment(upset),
        totalPrecision: firestore_1.FieldValue.increment(profilePrecision),
    };
    if (upsetBonus !== 0)
        out.upsetBonusSum = firestore_1.FieldValue.increment(upsetBonus);
    if (streakBonus !== 0)
        out.streakBonusSum = firestore_1.FieldValue.increment(streakBonus);
    if (!contrib.forRanking)
        return out;
    out["ranking.totalPosts"] = firestore_1.FieldValue.increment(posts);
    out["ranking.totalWins"] = firestore_1.FieldValue.increment(wins);
    out["ranking.totalPoints"] = firestore_1.FieldValue.increment(points);
    out["ranking.totalUpset"] = firestore_1.FieldValue.increment(upset);
    out["ranking.totalPrecision"] = firestore_1.FieldValue.increment(nbaPrecision);
    if (upsetBonus !== 0) {
        out["ranking.upsetBonusSum"] = firestore_1.FieldValue.increment(upsetBonus);
    }
    if (streakBonus !== 0) {
        out["ranking.streakBonusSum"] = firestore_1.FieldValue.increment(streakBonus);
    }
    const applyBonusToPath = (path) => {
        if (upsetBonus !== 0) {
            out[`${path}.upsetBonusSum`] = firestore_1.FieldValue.increment(upsetBonus);
        }
        if (streakBonus !== 0) {
            out[`${path}.streakBonusSum`] = firestore_1.FieldValue.increment(streakBonus);
        }
    };
    if (contrib.phaseKey === "play_in") {
        const p = "rankingByPhase.play_in";
        out[`${p}.totalPosts`] = firestore_1.FieldValue.increment(posts);
        out[`${p}.totalWins`] = firestore_1.FieldValue.increment(wins);
        out[`${p}.totalPoints`] = firestore_1.FieldValue.increment(points);
        out[`${p}.totalUpset`] = firestore_1.FieldValue.increment(upset);
        out[`${p}.totalPrecision`] = firestore_1.FieldValue.increment(nbaPrecision);
        out[`${p}.totalGoalScorerHits`] = firestore_1.FieldValue.increment(goalScorer);
        applyBonusToPath(p);
    }
    if (contrib.phaseKey === "playoffs") {
        const p = "rankingByPhase.playoffs";
        out[`${p}.totalPosts`] = firestore_1.FieldValue.increment(posts);
        out[`${p}.totalWins`] = firestore_1.FieldValue.increment(wins);
        out[`${p}.totalPoints`] = firestore_1.FieldValue.increment(points);
        out[`${p}.totalUpset`] = firestore_1.FieldValue.increment(upset);
        out[`${p}.totalPrecision`] = firestore_1.FieldValue.increment(nbaPrecision);
        out[`${p}.totalGoalScorerHits`] = firestore_1.FieldValue.increment(goalScorer);
        applyBonusToPath(p);
        if (contrib.roundKey) {
            const r = `rankingByPlayoffRound.${contrib.roundKey}`;
            out[`${r}.totalPosts`] = firestore_1.FieldValue.increment(posts);
            out[`${r}.totalWins`] = firestore_1.FieldValue.increment(wins);
            out[`${r}.totalPoints`] = firestore_1.FieldValue.increment(points);
            out[`${r}.totalUpset`] = firestore_1.FieldValue.increment(upset);
            out[`${r}.totalPrecision`] = firestore_1.FieldValue.increment(nbaPrecision);
            out[`${r}.totalGoalScorerHits`] = firestore_1.FieldValue.increment(goalScorer);
            applyBonusToPath(r);
        }
    }
    if (contrib.isWc && contrib.forRanking) {
        const stages = ["overall"];
        if (contrib.wcStage === "qualifying")
            stages.push("qualifying");
        if (contrib.wcStage === "main")
            stages.push("main");
        for (const stage of stages) {
            const w = `rankingByWcStage.${stage}`;
            out[`${w}.totalPosts`] = firestore_1.FieldValue.increment(posts);
            out[`${w}.totalWins`] = firestore_1.FieldValue.increment(wins);
            out[`${w}.totalPoints`] = firestore_1.FieldValue.increment(points);
            out[`${w}.totalUpset`] = firestore_1.FieldValue.increment(upset);
            out[`${w}.totalPrecision`] = firestore_1.FieldValue.increment(wcExact);
            out[`${w}.totalGoalScorerHits`] = firestore_1.FieldValue.increment(goalScorer);
            applyBonusToPath(w);
        }
    }
    return out;
}
function applyCumulativeIncrementInTransaction(tx, cumulativeRef, user, uid, contrib, sign = 1) {
    var _a, _b, _c, _d;
    tx.set(cumulativeRef, Object.assign({ uid, displayName: (_a = user.displayName) !== null && _a !== void 0 ? _a : "user", handle: (_b = user.handle) !== null && _b !== void 0 ? _b : null, photoURL: (_c = user.photoURL) !== null && _c !== void 0 ? _c : null, countryCode: (_d = user.countryCode) !== null && _d !== void 0 ? _d : null, plan: user.plan === "pro" ? "pro" : "free", cumulativeLiveUpdates: true, updatedAt: firestore_1.FieldValue.serverTimestamp() }, buildCumulativeIncrementFields(contrib, sign)), { merge: true });
}
function aggregateCumulativeFromDailyData(dailyDocs) {
    var _a, _b, _c;
    let profile = emptyRankingTotals();
    let ranking = emptyRankingTotals();
    let playIn = emptyRankingTotals();
    let playoffs = emptyRankingTotals();
    const byRound = {
        r1: emptyRankingTotals(),
        r2: emptyRankingTotals(),
        cf: emptyRankingTotals(),
        finals: emptyRankingTotals(),
    };
    const byWc = {
        overall: emptyRankingTotals(),
        qualifying: emptyRankingTotals(),
        main: emptyRankingTotals(),
    };
    for (const data of dailyDocs) {
        profile = addRankingTotals(profile, bucketToInc(data.all));
        const rankBucket = (_a = data.ranking) !== null && _a !== void 0 ? _a : data.all;
        ranking = addRankingTotals(ranking, bucketToInc(rankBucket));
        const byPhase = ((_b = data.rankingByPhase) !== null && _b !== void 0 ? _b : {});
        playIn = addRankingTotals(playIn, bucketToInc(byPhase.play_in));
        playoffs = addRankingTotals(playoffs, bucketToInc(byPhase.playoffs));
        const byPlayoffRound = ((_c = data.rankingByPlayoffRound) !== null && _c !== void 0 ? _c : {});
        for (const rk of ["r1", "r2", "cf", "finals"]) {
            byRound[rk] = addRankingTotals(byRound[rk], bucketToInc(byPlayoffRound[rk]));
        }
        const wcBuckets = (0, dailyWcStageBuckets_1.readDailyWcStageBuckets)(data);
        for (const wk of dailyWcStageBuckets_1.WC_RANKING_STAGES) {
            byWc[wk] = addRankingTotals(byWc[wk], bucketToInc(wcBuckets[wk], { precisionFromExactHits: true }));
        }
    }
    return {
        profile: withWinRate(profile),
        ranking: withWinRate(ranking),
        rankingByPhase: {
            play_in: withWinRate(playIn),
            playoffs: withWinRate(playoffs),
        },
        rankingByPlayoffRound: {
            r1: withWinRate(byRound.r1),
            r2: withWinRate(byRound.r2),
            cf: withWinRate(byRound.cf),
            finals: withWinRate(byRound.finals),
        },
        rankingByWcStage: {
            overall: withWinRate(byWc.overall),
            qualifying: withWinRate(byWc.qualifying),
            main: withWinRate(byWc.main),
        },
    };
}
function totalsClose(a, b, eps = 0.0001) {
    return Math.abs(a - b) <= eps;
}
function aggregatedCumulativeMatchesDoc(agg, doc) {
    var _a;
    if (!doc)
        return false;
    const profilePosts = num(doc.totalPosts);
    const profilePoints = num(doc.totalPoints);
    const wcOverall = (_a = doc.rankingByWcStage) === null || _a === void 0 ? void 0 : _a.overall;
    const wcPosts = num(wcOverall === null || wcOverall === void 0 ? void 0 : wcOverall.totalPosts);
    const wcPoints = num(wcOverall === null || wcOverall === void 0 ? void 0 : wcOverall.totalPoints);
    return (totalsClose(profilePosts, agg.profile.totalPosts) &&
        totalsClose(profilePoints, agg.profile.totalPoints) &&
        totalsClose(wcPosts, agg.rankingByWcStage.overall.totalPosts) &&
        totalsClose(wcPoints, agg.rankingByWcStage.overall.totalPoints));
}
function cumulativePayloadFromAggregate(uid, user, agg, lastReconciledDateKey) {
    var _a, _b, _c, _d;
    return {
        uid,
        displayName: (_a = user.displayName) !== null && _a !== void 0 ? _a : "user",
        handle: (_b = user.handle) !== null && _b !== void 0 ? _b : null,
        photoURL: (_c = user.photoURL) !== null && _c !== void 0 ? _c : null,
        countryCode: (_d = user.countryCode) !== null && _d !== void 0 ? _d : null,
        plan: user.plan === "pro" ? "pro" : "free",
        totalPosts: agg.profile.totalPosts,
        totalWins: agg.profile.totalWins,
        totalPoints: agg.profile.totalPoints,
        totalUpset: agg.profile.totalUpset,
        totalPrecision: agg.profile.totalPrecision,
        winRate: agg.profile.winRate,
        ranking: agg.ranking,
        rankingByPhase: agg.rankingByPhase,
        rankingByPlayoffRound: agg.rankingByPlayoffRound,
        rankingByWcStage: agg.rankingByWcStage,
        cumulativeLiveUpdates: true,
        lastReconciledDateKey,
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    };
}
async function fetchAllDailyDocsForUid(db, uid) {
    const snap = await db
        .collection("user_stats_v2_daily")
        .where(firestore_1.FieldPath.documentId(), ">=", `${uid}_`)
        .where(firestore_1.FieldPath.documentId(), "<=", `${uid}_\uf8ff`)
        .get();
    return snap.docs.map((d) => d.data());
}
async function reconcileCumulativeStatsForUid(db, uid, lastReconciledDateKey) {
    const dailyDocs = await fetchAllDailyDocsForUid(db, uid);
    if (dailyDocs.length === 0) {
        return { updated: false, reason: "no_daily" };
    }
    const agg = aggregateCumulativeFromDailyData(dailyDocs);
    const cumulativeRef = db.doc(`cumulative_stats/${uid}`);
    const userRef = db.doc(`users/${uid}`);
    const [cumulativeSnap, userSnap] = await Promise.all([
        cumulativeRef.get(),
        userRef.get(),
    ]);
    const user = userSnap.exists ? userSnap.data() : {};
    const current = cumulativeSnap.exists
        ? cumulativeSnap.data()
        : undefined;
    if (aggregatedCumulativeMatchesDoc(agg, current)) {
        return { updated: false, reason: "unchanged" };
    }
    await cumulativeRef.set(cumulativePayloadFromAggregate(uid, user, agg, lastReconciledDateKey), { merge: true });
    return { updated: true, reason: "ok" };
}
//# sourceMappingURL=cumulativeFromDaily.js.map