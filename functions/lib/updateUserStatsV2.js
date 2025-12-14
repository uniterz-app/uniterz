"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyPostToUserStatsV2 = applyPostToUserStatsV2;
exports.getStatsForDateRangeV2 = getStatsForDateRangeV2;
// functions/src/updateUserStatsV2.ts
const firestore_1 = require("firebase-admin/firestore");
const db = () => (0, firestore_1.getFirestore)();
const LEAGUES = ["bj", "j1", "nba"];
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
    if (!raw)
        return null;
    const v = String(raw).trim().toLowerCase();
    if (v === "bj" || v === "b1" || v.includes("b.league"))
        return "bj";
    if (v === "j1" || v === "j")
        return "j1";
    if (v === "nba")
        return "nba";
    return null;
}
/* =========================================================
 * Bucket helpers
 * =======================================================*/
function emptyBucket() {
    return {
        posts: 0,
        wins: 0,
        scoreErrorSum: 0,
        brierSum: 0,
        upsetScoreSum: 0,
        scorePrecisionSum: 0,
        calibrationErrorSum: 0,
        calibrationCount: 0,
        winRate: 0,
        avgScoreError: 0,
        avgBrier: 0,
        avgUpset: 0,
        avgPrecision: 0,
        avgCalibration: 0,
    };
}
function recomputeCache(b) {
    const posts = b.posts;
    const wins = b.wins;
    return Object.assign(Object.assign({}, b), { winRate: posts ? wins / posts : 0, avgScoreError: posts ? b.scoreErrorSum / posts : 0, avgBrier: posts ? b.brierSum / posts : 0, avgUpset: wins ? b.upsetScoreSum / wins : 0, avgPrecision: posts ? b.scorePrecisionSum / posts : 0, avgCalibration: b.calibrationCount > 0
            ? b.calibrationErrorSum / b.calibrationCount
            : null });
}
/* =========================================================
 * 投稿1件 → user_stats_v2_daily に即反映
 * =======================================================*/
async function applyPostToUserStatsV2(opts) {
    const { uid, postId, startAt, league, isWin, scoreError, brier, upsetScore, scorePrecision, } = opts;
    const dateKey = toDateKeyJST(startAt);
    const leagueKey = normalizeLeague(league);
    const dailyRef = db().doc(`user_stats_v2_daily/${uid}_${dateKey}`);
    const markerRef = dailyRef.collection("applied_posts").doc(postId);
    await db().runTransaction(async (tx) => {
        const marker = await tx.get(markerRef);
        if (marker.exists)
            return;
        // ---------- increment data ----------
        const inc = {
            posts: firestore_1.FieldValue.increment(1),
            wins: firestore_1.FieldValue.increment(isWin ? 1 : 0),
            scoreErrorSum: firestore_1.FieldValue.increment(scoreError),
            brierSum: firestore_1.FieldValue.increment(brier),
            upsetScoreSum: firestore_1.FieldValue.increment(isWin ? upsetScore : 0),
            scorePrecisionSum: firestore_1.FieldValue.increment(scorePrecision),
            calibrationErrorSum: firestore_1.FieldValue.increment(opts.calibrationError),
            calibrationCount: firestore_1.FieldValue.increment(1),
        };
        const update = {
            date: dateKey,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
            all: inc,
        };
        if (leagueKey) {
            update.leagues = Object.assign(Object.assign({}, (update.leagues || {})), { [leagueKey]: inc });
        }
        tx.set(dailyRef, update, { merge: true });
        tx.set(markerRef, { at: firestore_1.FieldValue.serverTimestamp() });
    });
}
/* =========================================================
 * 週間・月間ランキング用の唯一の集計処理
 * =======================================================*/
async function getStatsForDateRangeV2(uid, start, end, league) {
    var _a;
    const coll = db().collection("user_stats_v2_daily");
    const ONE = 86400000;
    let b = emptyBucket();
    for (let t = start.getTime(); t <= end.getTime(); t += ONE) {
        const d = new Date(t);
        const key = `${uid}_${toDateKeyJST(firestore_1.Timestamp.fromDate(d))}`;
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
        b.scorePrecisionSum += src.scorePrecisionSum || 0;
        b.calibrationErrorSum += src.calibrationErrorSum || 0;
        b.calibrationCount += src.calibrationCount || 0;
    }
    return recomputeCache(b);
}
//# sourceMappingURL=updateUserStatsV2.js.map