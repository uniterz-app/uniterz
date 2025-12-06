"use strict";
// functions/src/updateUserStatsV2.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.recomputeAllUsersStatsV2Daily = void 0;
exports.applyPostToUserStatsV2 = applyPostToUserStatsV2;
exports.recomputeUserStatsV2FromDaily = recomputeUserStatsV2FromDaily;
exports.getStatsV2 = getStatsV2;
const firestore_1 = require("firebase-admin/firestore");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const db = () => (0, firestore_1.getFirestore)();
const LEAGUES = ["bj", "nba", "pl"];
/* =========================================================
 * Utils
 * =======================================================*/
function toDateKeyJST(ts) {
    const d = ts.toDate();
    const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const yyyy = j.getUTCFullYear();
    const mm = String(j.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(j.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}
function normalizeLeague(raw) {
    const v = String(raw !== null && raw !== void 0 ? raw : "").toLowerCase();
    if (v.includes("b1") || v.includes("bj"))
        return "bj";
    if (v.includes("nba"))
        return "nba";
    if (v.includes("pl") || v.includes("premier"))
        return "pl";
    return null;
}
function emptyBucket() {
    return {
        posts: 0,
        wins: 0,
        scoreErrorSum: 0,
        brierSum: 0,
        upsetScoreSum: 0,
        scorePrecisionSum: 0, // ⭐ 追加
        winRate: 0,
        avgScoreError: 0,
        avgBrier: 0,
        avgUpset: 0,
        avgPrecision: 0, // ⭐ 追加
    };
}
function recomputeCache(b) {
    const posts = b.posts;
    const wins = b.wins;
    return Object.assign(Object.assign({}, b), { winRate: posts ? wins / posts : 0, avgScoreError: posts ? b.scoreErrorSum / posts : 0, avgBrier: posts ? b.brierSum / posts : 0, avgUpset: wins ? b.upsetScoreSum / wins : 0, avgPrecision: posts ? b.scorePrecisionSum / posts : 0 });
}
/* =========================================================
 * 投稿1件 → user_stats_v2_daily
 * =======================================================*/
async function applyPostToUserStatsV2(opts) {
    const { uid, postId, createdAt, league, isWin, scoreError, brier, upsetScore, scorePrecision } = opts;
    const dateKey = toDateKeyJST(createdAt);
    const leagueKey = normalizeLeague(league);
    const dailyRef = db().doc(`user_stats_v2_daily/${uid}_${dateKey}`);
    const markerRef = dailyRef.collection("applied_posts").doc(postId);
    await db().runTransaction(async (tx) => {
        const marker = await tx.get(markerRef);
        if (marker.exists)
            return;
        const inc = {
            posts: firestore_1.FieldValue.increment(1),
            wins: firestore_1.FieldValue.increment(isWin ? 1 : 0),
            scoreErrorSum: firestore_1.FieldValue.increment(scoreError),
            brierSum: firestore_1.FieldValue.increment(brier),
            upsetScoreSum: firestore_1.FieldValue.increment(isWin ? upsetScore : 0),
            scorePrecisionSum: firestore_1.FieldValue.increment(scorePrecision), // ⭐ 追加
        };
        const update = {
            date: dateKey,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
            all: inc,
        };
        if (leagueKey)
            update[`leagues.${leagueKey}`] = inc;
        tx.set(dailyRef, update, { merge: true });
        tx.set(markerRef, { at: firestore_1.FieldValue.serverTimestamp() });
    });
    await recomputeUserStatsV2FromDaily(uid);
}
/* =========================================================
 * 集計（7d / 30d）
 * =======================================================*/
async function sumRange(uid, end, days, league) {
    var _a;
    const coll = db().collection("user_stats_v2_daily");
    const ONE = 86400000;
    const start = new Date(end.getTime() - (days - 1) * ONE);
    let b = emptyBucket();
    for (let i = 0; i < days; i++) {
        const d = new Date(start.getTime() + i * ONE);
        const key = `${uid}_${d.toISOString().slice(0, 10)}`;
        const snap = await coll.doc(key).get();
        if (!snap.exists)
            continue;
        const v = snap.data();
        const src = league ? (_a = v.leagues) === null || _a === void 0 ? void 0 : _a[league] : v.all;
        if (!src)
            continue;
        b.posts += src.posts || 0;
        b.wins += src.wins || 0;
        b.scoreErrorSum += src.scoreErrorSum || 0;
        b.brierSum += src.brierSum || 0;
        b.upsetScoreSum += src.upsetScoreSum || 0;
        b.scorePrecisionSum += src.scorePrecisionSum || 0; // ⭐ 追加
    }
    return recomputeCache(b);
}
/* =========================================================
 * 集計（ALL）
 * =======================================================*/
async function sumAll(uid, league) {
    const snap = await db()
        .collection("user_stats_v2_daily")
        .where("__name__", ">=", `${uid}_`)
        .where("__name__", "<", `${uid}_\uf8ff`)
        .get();
    let b = emptyBucket();
    snap.forEach((s) => {
        var _a;
        const v = s.data();
        const src = league ? (_a = v.leagues) === null || _a === void 0 ? void 0 : _a[league] : v.all;
        if (!src)
            return;
        b.posts += src.posts || 0;
        b.wins += src.wins || 0;
        b.scoreErrorSum += src.scoreErrorSum || 0;
        b.brierSum += src.brierSum || 0;
        b.upsetScoreSum += src.upsetScoreSum || 0;
        b.scorePrecisionSum += src.scorePrecisionSum || 0; // ⭐ 追加
    });
    return recomputeCache(b);
}
/* =========================================================
 * user_stats_v2 再計算
 * =======================================================*/
async function recomputeUserStatsV2FromDaily(uid) {
    const now = firestore_1.Timestamp.now();
    const today0 = new Date(`${toDateKeyJST(now)}T00:00:00Z`);
    const result = {
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
        "7d": { all: await sumRange(uid, today0, 7, null), leagues: {} },
        "30d": { all: await sumRange(uid, today0, 30, null), leagues: {} },
        all: { all: await sumAll(uid, null), leagues: {} },
    };
    for (const l of LEAGUES) {
        result["7d"].leagues[l] = await sumRange(uid, today0, 7, l);
        result["30d"].leagues[l] = await sumRange(uid, today0, 30, l);
        result.all.leagues[l] = await sumAll(uid, l);
    }
    await db().doc(`user_stats_v2/${uid}`).set(result, { merge: true });
}
/* =========================================================
 * Cron
 * =======================================================*/
exports.recomputeAllUsersStatsV2Daily = (0, scheduler_1.onSchedule)({ schedule: "10 4 * * *", timeZone: "Asia/Tokyo" }, async () => {
    const users = await db().collection("users").select().get();
    for (const u of users.docs) {
        await recomputeUserStatsV2FromDaily(u.id);
    }
});
/* =========================================================
 * API
 * =======================================================*/
async function getStatsV2(uid) {
    const snap = await db().doc(`user_stats_v2/${uid}`).get();
    return snap.exists ? snap.data() : null;
}
//# sourceMappingURL=updateUserStatsV2.js.map