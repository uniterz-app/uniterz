"use strict";
// functions/src/stats/buildUserStatsWindowCache.ts
// user_stats_v2_window_cache/{uid} を構築（7d/30d ロールアップ）
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildWindowCacheForUser = buildWindowCacheForUser;
exports.buildAllUsersWindowCache = buildAllUsersWindowCache;
exports.isWindowCacheStale = isWindowCacheStale;
const firestore_1 = require("firebase-admin/firestore");
const empty = () => ({
    posts: 0,
    wins: 0,
    scoreErrorSum: 0,
    upsetHitCount: 0,
    upsetOpportunityCount: 0,
    upsetPointsSum: 0,
    scorePrecisionSum: 0,
    pointsSumV3: 0,
});
function safeNum(v) {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : 0;
}
function safeInt(v) {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}
function dateKeyJST(d) {
    const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const yyyy = j.getUTCFullYear();
    const mm = String(j.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(j.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}
function mergeBucket(base, v) {
    if (!v)
        return base;
    base.posts += safeInt(v.posts);
    base.wins += safeInt(v.wins);
    base.scoreErrorSum += safeNum(v.scoreErrorSum);
    base.upsetHitCount += safeInt(v.upsetHitCount);
    base.upsetOpportunityCount += safeInt(v.upsetOpportunityCount);
    base.upsetPointsSum += safeNum(v.upsetPointsSum);
    base.scorePrecisionSum += safeNum(v.scorePrecisionSum);
    base.pointsSumV3 += safeNum(v.pointsSumV3);
    return base;
}
function computeForCards(b) {
    const posts = safeInt(b.posts);
    const wins = safeInt(b.wins);
    return {
        posts,
        wins,
        winRate: posts ? wins / posts : 0,
        scorePrecisionSum: safeNum(b.scorePrecisionSum),
        upsetPointsSum: safeNum(b.upsetPointsSum),
        pointsSumV3: safeNum(b.pointsSumV3),
        upsetChanceCount: safeInt(b.upsetOpportunityCount),
        upsetHitCount: safeInt(b.upsetHitCount),
    };
}
const STALE_HOURS = 24;
async function buildWindowCacheForUser(uid) {
    const db = (0, firestore_1.getFirestore)();
    const today = new Date();
    const dates = [];
    for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        dates.push(d);
    }
    const dailySnaps = await Promise.all(dates.map((d) => db.doc(`user_stats_v2_daily/${uid}_${dateKeyJST(d)}`).get()));
    const dailyBuckets = dates.map((d, i) => {
        var _a;
        const snap = dailySnaps[i];
        const raw = (snap === null || snap === void 0 ? void 0 : snap.exists)
            ? (_a = snap.data()) === null || _a === void 0 ? void 0 : _a.all
            : undefined;
        return {
            bucket: raw ? Object.assign(Object.assign({}, empty()), raw) : null,
        };
    });
    const sevenBucket = dailyBuckets
        .slice(0, 7)
        .reduce((acc, row) => mergeBucket(acc, row.bucket), empty());
    const thirtyBucket = dailyBuckets
        .slice(0, 30)
        .reduce((acc, row) => mergeBucket(acc, row.bucket), empty());
    const seven = computeForCards(sevenBucket);
    const thirty = computeForCards(thirtyBucket);
    const windowRef = db.doc(`user_stats_v2_window_cache/${uid}`);
    await windowRef.set({
        "7d": Object.assign({ fullPosts: seven.posts }, seven),
        "30d": Object.assign({ fullPosts: thirty.posts }, thirty),
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    }, { merge: true });
}
/** 全 user_stats_v2 ユーザーの window_cache を再構築（cron 用） */
async function buildAllUsersWindowCache() {
    const db = (0, firestore_1.getFirestore)();
    const snap = await db.collection("user_stats_v2").select().limit(500).get();
    let ok = 0;
    let err = 0;
    for (const d of snap.docs) {
        try {
            await buildWindowCacheForUser(d.id);
            ok++;
        }
        catch (e) {
            console.error(`[buildWindowCache] uid=${d.id}`, e);
            err++;
        }
    }
    return { ok, err };
}
function isWindowCacheStale(updatedAt) {
    if (!updatedAt)
        return true;
    const then = updatedAt.toDate();
    const now = new Date();
    return (now.getTime() - then.getTime()) > STALE_HOURS * 60 * 60 * 1000;
}
//# sourceMappingURL=buildUserStatsWindowCache.js.map