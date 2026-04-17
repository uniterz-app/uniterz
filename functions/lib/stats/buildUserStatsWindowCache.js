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
    upsetBonusSum: 0,
    streakBonusSum: 0,
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
    base.upsetBonusSum += safeNum(v.upsetBonusSum);
    base.streakBonusSum += safeNum(v.streakBonusSum);
    return base;
}
function computeForCards(b) {
    const posts = safeInt(b.posts);
    const wins = safeInt(b.wins);
    const pointsSumV3 = safeNum(b.pointsSumV3);
    const upsetBonusSum = safeNum(b.upsetBonusSum);
    const streakBonusSum = safeNum(b.streakBonusSum);
    const basePointsSum = Math.max(0, pointsSumV3 - upsetBonusSum - streakBonusSum);
    return {
        posts,
        wins,
        winRate: posts ? wins / posts : 0,
        scorePrecisionSum: safeNum(b.scorePrecisionSum),
        upsetPointsSum: safeNum(b.upsetPointsSum),
        pointsSumV3,
        upsetChanceCount: safeInt(b.upsetOpportunityCount),
        upsetHitCount: safeInt(b.upsetHitCount),
        upsetBonusSum,
        streakBonusSum,
        basePointsSum,
    };
}
const STALE_HOURS = 24;
/** app/lib の buildDailyTrendFromDailySnaps と同じ解決ルール（Functions 単体ビルドのため重複） */
function buildDailyTrendFromSnaps(snaps) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const rows = [];
    for (const snap of snaps) {
        if (!snap.exists)
            continue;
        const d = snap.data();
        if (!d)
            continue;
        const dateRaw = d.date;
        const date = typeof dateRaw === "string" ? dateRaw : "";
        if (!date)
            continue;
        const all = (_c = (_b = (_a = d.applied_posts) === null || _a === void 0 ? void 0 : _a.all) !== null && _b !== void 0 ? _b : d.applied_posts) !== null && _c !== void 0 ? _c : d.all;
        const posts = (_d = all === null || all === void 0 ? void 0 : all.posts) !== null && _d !== void 0 ? _d : 0;
        const wins = (_e = all === null || all === void 0 ? void 0 : all.wins) !== null && _e !== void 0 ? _e : 0;
        const pointsV3 = (_f = all === null || all === void 0 ? void 0 : all.pointsSumV3) !== null && _f !== void 0 ? _f : 0;
        const upsetPoints = (_g = all === null || all === void 0 ? void 0 : all.upsetPointsSum) !== null && _g !== void 0 ? _g : 0;
        const scorePrecisionSum = (_h = all === null || all === void 0 ? void 0 : all.scorePrecisionSum) !== null && _h !== void 0 ? _h : 0;
        rows.push({
            date,
            posts,
            wins,
            pointsV3,
            upsetPoints,
            winRate: posts > 0 ? wins / posts : 0,
            scorePrecision: scorePrecisionSum,
        });
    }
    rows.sort((a, b) => a.date.localeCompare(b.date));
    return rows;
}
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
    const recent3Bucket = dailyBuckets
        .slice(0, 3)
        .reduce((acc, row) => mergeBucket(acc, row.bucket), empty());
    const recent3Posts = safeInt(recent3Bucket.posts);
    const dailyTrend = buildDailyTrendFromSnaps(dailySnaps);
    const windowRef = db.doc(`user_stats_v2_window_cache/${uid}`);
    await windowRef.set({
        "7d": Object.assign({ fullPosts: seven.posts }, seven),
        "30d": Object.assign({ fullPosts: thirty.posts }, thirty),
        recent3Posts,
        dailyTrend,
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