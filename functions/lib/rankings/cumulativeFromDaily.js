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
const safeRankMetricNum_1 = require("./safeRankMetricNum");
const cumulativeSnapshotIndex_1 = require("./cumulativeSnapshotIndex");
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
        : 0;
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
    const goalScorer = contrib.goalScorerHit ? s : 0;
    const upsetBonus = (0, safeRankMetricNum_1.safeRankMetricNum)(contrib.upsetBonus) * s;
    const streakBonus = (0, safeRankMetricNum_1.safeRankMetricNum)(contrib.streakBonus) * s;
    const out = {
        totalPosts: firestore_1.FieldValue.increment(posts),
        totalWins: firestore_1.FieldValue.increment(wins),
        totalPoints: firestore_1.FieldValue.increment(points),
        totalUpset: firestore_1.FieldValue.increment(upset),
    };
    if (upsetBonus !== 0)
        out.upsetBonusSum = firestore_1.FieldValue.increment(upsetBonus);
    if (streakBonus !== 0)
        out.streakBonusSum = firestore_1.FieldValue.increment(streakBonus);
    const applyBonusToPath = (path) => {
        if (upsetBonus !== 0) {
            out[`${path}.upsetBonusSum`] = firestore_1.FieldValue.increment(upsetBonus);
        }
        if (streakBonus !== 0) {
            out[`${path}.streakBonusSum`] = firestore_1.FieldValue.increment(streakBonus);
        }
    };
    const applySeasonPaths = (prefix) => {
        if (!contrib.nbaSeasonKey)
            return;
        const p = `${prefix}.${contrib.nbaSeasonKey}`;
        out[`${p}.totalPosts`] = firestore_1.FieldValue.increment(posts);
        out[`${p}.totalWins`] = firestore_1.FieldValue.increment(wins);
        out[`${p}.totalPoints`] = firestore_1.FieldValue.increment(points);
        out[`${p}.totalUpset`] = firestore_1.FieldValue.increment(upset);
        out[`${p}.totalGoalScorerHits`] = firestore_1.FieldValue.increment(goalScorer);
        applyBonusToPath(p);
    };
    // Pick Up（standard）
    if (contrib.forRanking) {
        out[cumulativeSnapshotIndex_1.CUMULATIVE_RANKING_TOTAL_POSTS_FIELD] = firestore_1.FieldValue.increment(posts);
        out["ranking.totalPosts"] = firestore_1.FieldValue.increment(posts);
        out["ranking.totalWins"] = firestore_1.FieldValue.increment(wins);
        out["ranking.totalPoints"] = firestore_1.FieldValue.increment(points);
        out["ranking.totalUpset"] = firestore_1.FieldValue.increment(upset);
        if (upsetBonus !== 0) {
            out["ranking.upsetBonusSum"] = firestore_1.FieldValue.increment(upsetBonus);
        }
        if (streakBonus !== 0) {
            out["ranking.streakBonusSum"] = firestore_1.FieldValue.increment(streakBonus);
        }
        applySeasonPaths("rankingBySeason");
    }
    // PRO LEAGUE（open）— 全試合
    if (contrib.forOpenRanking) {
        out["openRanking.totalPosts"] = firestore_1.FieldValue.increment(posts);
        out["openRanking.totalWins"] = firestore_1.FieldValue.increment(wins);
        out["openRanking.totalPoints"] = firestore_1.FieldValue.increment(points);
        out["openRanking.totalUpset"] = firestore_1.FieldValue.increment(upset);
        if (upsetBonus !== 0) {
            out["openRanking.upsetBonusSum"] = firestore_1.FieldValue.increment(upsetBonus);
        }
        if (streakBonus !== 0) {
            out["openRanking.streakBonusSum"] = firestore_1.FieldValue.increment(streakBonus);
        }
        applySeasonPaths("openRankingBySeason");
    }
    // プレーオフはピックアップ対象外 → ランキング対象の全試合
    if (contrib.forPlayoffsRanking && contrib.nbaPlayoffsSeasonKey) {
        const p = `rankingByNbaPlayoffs.${contrib.nbaPlayoffsSeasonKey}`;
        out[`${p}.totalPosts`] = firestore_1.FieldValue.increment(posts);
        out[`${p}.totalWins`] = firestore_1.FieldValue.increment(wins);
        out[`${p}.totalPoints`] = firestore_1.FieldValue.increment(points);
        out[`${p}.totalUpset`] = firestore_1.FieldValue.increment(upset);
        out[`${p}.totalGoalScorerHits`] = firestore_1.FieldValue.increment(goalScorer);
        applyBonusToPath(p);
    }
    return out;
}
function applyCumulativeIncrementInTransaction(tx, cumulativeRef, user, uid, contrib, sign = 1) {
    var _a, _b, _c, _d;
    tx.set(cumulativeRef, Object.assign({ uid, displayName: (_a = user.displayName) !== null && _a !== void 0 ? _a : "user", handle: (_b = user.handle) !== null && _b !== void 0 ? _b : null, photoURL: (_c = user.photoURL) !== null && _c !== void 0 ? _c : null, countryCode: (_d = user.countryCode) !== null && _d !== void 0 ? _d : null, plan: user.plan === "pro" ? "pro" : "free", cumulativeLiveUpdates: true, updatedAt: firestore_1.FieldValue.serverTimestamp() }, buildCumulativeIncrementFields(contrib, sign)), { merge: true });
}
function aggregateCumulativeFromDailyData(dailyDocs) {
    var _a, _b, _c, _d, _e, _f, _g;
    let profile = emptyRankingTotals();
    let ranking = emptyRankingTotals();
    let openRanking = emptyRankingTotals();
    const bySeason = new Map();
    const openBySeason = new Map();
    const byNbaPlayoffs = new Map();
    for (const data of dailyDocs) {
        profile = addRankingTotals(profile, bucketToInc(data.all));
        const rankBucket = (_a = data.ranking) !== null && _a !== void 0 ? _a : data.all;
        ranking = addRankingTotals(ranking, bucketToInc(rankBucket));
        const openBucket = data.openRanking;
        if (openBucket && typeof openBucket === "object") {
            openRanking = addRankingTotals(openRanking, bucketToInc(openBucket));
        }
        const bySeasonBuckets = ((_b = data.rankingBySeason) !== null && _b !== void 0 ? _b : {});
        for (const [seasonKey, bucket] of Object.entries(bySeasonBuckets)) {
            if (!bucket || typeof bucket !== "object")
                continue;
            bySeason.set(seasonKey, addRankingTotals((_c = bySeason.get(seasonKey)) !== null && _c !== void 0 ? _c : emptyRankingTotals(), bucketToInc(bucket)));
        }
        const openBySeasonBuckets = ((_d = data.openRankingBySeason) !== null && _d !== void 0 ? _d : {});
        for (const [seasonKey, bucket] of Object.entries(openBySeasonBuckets)) {
            if (!bucket || typeof bucket !== "object")
                continue;
            openBySeason.set(seasonKey, addRankingTotals((_e = openBySeason.get(seasonKey)) !== null && _e !== void 0 ? _e : emptyRankingTotals(), bucketToInc(bucket)));
        }
        const byPlayoffsBuckets = ((_f = data.rankingByNbaPlayoffs) !== null && _f !== void 0 ? _f : {});
        for (const [seasonKey, bucket] of Object.entries(byPlayoffsBuckets)) {
            if (!bucket || typeof bucket !== "object")
                continue;
            byNbaPlayoffs.set(seasonKey, addRankingTotals((_g = byNbaPlayoffs.get(seasonKey)) !== null && _g !== void 0 ? _g : emptyRankingTotals(), bucketToInc(bucket)));
        }
    }
    const rankingBySeason = {};
    for (const [seasonKey, totals] of bySeason) {
        rankingBySeason[seasonKey] = withWinRate(totals);
    }
    const openRankingBySeason = {};
    for (const [seasonKey, totals] of openBySeason) {
        openRankingBySeason[seasonKey] = withWinRate(totals);
    }
    const rankingByNbaPlayoffs = {};
    for (const [seasonKey, totals] of byNbaPlayoffs) {
        rankingByNbaPlayoffs[seasonKey] = withWinRate(totals);
    }
    return {
        profile: withWinRate(profile),
        ranking: withWinRate(ranking),
        openRanking: withWinRate(openRanking),
        rankingBySeason,
        openRankingBySeason,
        rankingByNbaPlayoffs,
    };
}
function totalsClose(a, b, eps = 0.0001) {
    return Math.abs(a - b) <= eps;
}
function aggregatedCumulativeMatchesDoc(agg, doc) {
    if (!doc)
        return false;
    const profilePosts = num(doc.totalPosts);
    const profilePoints = num(doc.totalPoints);
    const rankingBlock = doc.ranking;
    const rankPosts = num(rankingBlock === null || rankingBlock === void 0 ? void 0 : rankingBlock.totalPosts);
    const rankPoints = num(rankingBlock === null || rankingBlock === void 0 ? void 0 : rankingBlock.totalPoints);
    return (totalsClose(profilePosts, agg.profile.totalPosts) &&
        totalsClose(profilePoints, agg.profile.totalPoints) &&
        totalsClose(rankPosts, agg.ranking.totalPosts) &&
        totalsClose(rankPoints, agg.ranking.totalPoints));
}
function cumulativePayloadFromAggregate(uid, user, agg, lastReconciledDateKey) {
    var _a, _b, _c, _d;
    const payload = Object.assign(Object.assign({ uid, displayName: (_a = user.displayName) !== null && _a !== void 0 ? _a : "user", handle: (_b = user.handle) !== null && _b !== void 0 ? _b : null, photoURL: (_c = user.photoURL) !== null && _c !== void 0 ? _c : null, countryCode: (_d = user.countryCode) !== null && _d !== void 0 ? _d : null, plan: user.plan === "pro" ? "pro" : "free", totalPosts: agg.profile.totalPosts, totalWins: agg.profile.totalWins, totalPoints: agg.profile.totalPoints, totalUpset: agg.profile.totalUpset, totalPrecision: agg.profile.totalPrecision, winRate: agg.profile.winRate, ranking: agg.ranking, openRanking: agg.openRanking, rankingBySeason: agg.rankingBySeason, openRankingBySeason: agg.openRankingBySeason, rankingByNbaPlayoffs: agg.rankingByNbaPlayoffs }, (0, cumulativeSnapshotIndex_1.rankingTotalPostsFromAggregate)(agg.ranking.totalPosts)), { cumulativeLiveUpdates: true, lastReconciledDateKey, updatedAt: firestore_1.FieldValue.serverTimestamp() });
    return payload;
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