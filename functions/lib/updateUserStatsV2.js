"use strict";
// functions/src/updateUserStatsV2.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.recomputeAllUsersStatsV2Daily = void 0;
exports.applyPostToUserStatsV2 = applyPostToUserStatsV2;
exports.getStatsForDateRangeV2 = getStatsForDateRangeV2;
exports.recomputeUserStatsV2FromDaily = recomputeUserStatsV2FromDaily;
exports.getStatsV2 = getStatsV2;
const firestore_1 = require("firebase-admin/firestore");
const scheduler_1 = require("firebase-functions/v2/scheduler");
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
    // --- B1 / bj / b.league ---
    if (v === "bj" || v === "b1" || v.includes("b.league"))
        return "bj";
    // --- J1 ---
    if (v === "j1" || v === "j")
        return "j1";
    // --- NBA ---
    if (v === "nba")
        return "nba";
    return null;
}
/* ======================
   Calibration Utils
====================== */
function emptyBins() {
    return {
        "50": { total: 0, wins: 0, sumProb: 0 },
        "60": { total: 0, wins: 0, sumProb: 0 },
        "70": { total: 0, wins: 0, sumProb: 0 },
        "80": { total: 0, wins: 0, sumProb: 0 },
        "90": { total: 0, wins: 0, sumProb: 0 },
    };
}
function getCalibrationBin(p) {
    if (p >= 0.9)
        return "90";
    if (p >= 0.8)
        return "80";
    if (p >= 0.7)
        return "70";
    if (p >= 0.6)
        return "60";
    if (p >= 0.5)
        return "50";
    return null; // 50%未満は評価対象外
}
function computeCalibrationError(bins) {
    let total = 0;
    let count = 0;
    for (const k of Object.keys(bins)) {
        const b = bins[k];
        if (!b.total)
            continue;
        const avgProb = b.sumProb / b.total;
        const winRate = b.wins / b.total;
        const err = Math.abs(avgProb - winRate);
        total += err * b.total;
        count += b.total;
    }
    return count === 0 ? null : total / count;
}
/* ========================================================= */
function emptyBucket() {
    return {
        posts: 0,
        wins: 0,
        scoreErrorSum: 0,
        brierSum: 0,
        upsetScoreSum: 0,
        scorePrecisionSum: 0, // ⭐ 追加
        calibrationBins: emptyBins(),
        winRate: 0,
        avgScoreError: 0,
        avgBrier: 0,
        avgUpset: 0,
        avgPrecision: 0, // ⭐ 追加
        calibrationError: 0,
    };
}
function recomputeCache(b) {
    const posts = b.posts;
    const wins = b.wins;
    return Object.assign(Object.assign({}, b), { winRate: posts ? wins / posts : 0, avgScoreError: posts ? b.scoreErrorSum / posts : 0, avgBrier: posts ? b.brierSum / posts : 0, avgUpset: wins ? b.upsetScoreSum / wins : 0, avgPrecision: posts ? b.scorePrecisionSum / posts : 0, calibrationError: computeCalibrationError(b.calibrationBins) });
}
/* =========================================================
 * 投稿1件 → user_stats_v2_daily
 * =======================================================*/
async function applyPostToUserStatsV2(opts) {
    const { uid, postId, createdAt, league, isWin, scoreError, brier, upsetScore, scorePrecision, confidence } = opts;
    const dateKey = toDateKeyJST(createdAt);
    const leagueKey = normalizeLeague(league);
    const bin = getCalibrationBin(confidence);
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
        if (bin) {
            inc[`calibrationBins.${bin}.total`] = firestore_1.FieldValue.increment(1);
            inc[`calibrationBins.${bin}.wins`] = firestore_1.FieldValue.increment(isWin ? 1 : 0);
            inc[`calibrationBins.${bin}.sumProb`] = firestore_1.FieldValue.increment(confidence);
        }
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
    await recomputeUserStatsV2FromDaily(uid);
}
/* =========================================================
 * 集計（7d / 30d）
 * =======================================================*/
async function sumRange(uid, end, days, league) {
    var _a, _b;
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
        b.scorePrecisionSum += src.scorePrecisionSum || 0;
        // ✅ bins 加算
        for (const k of ["50", "60", "70", "80", "90"]) {
            const sb = (_b = src.calibrationBins) === null || _b === void 0 ? void 0 : _b[k];
            if (!sb)
                continue;
            b.calibrationBins[k].total += sb.total || 0;
            b.calibrationBins[k].wins += sb.wins || 0;
            b.calibrationBins[k].sumProb += sb.sumProb || 0;
        }
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
        var _a, _b;
        const v = s.data();
        const src = league ? (_a = v.leagues) === null || _a === void 0 ? void 0 : _a[league] : v.all;
        if (!src)
            return;
        b.posts += src.posts || 0;
        b.wins += src.wins || 0;
        b.scoreErrorSum += src.scoreErrorSum || 0;
        b.brierSum += src.brierSum || 0;
        b.upsetScoreSum += src.upsetScoreSum || 0;
        b.scorePrecisionSum += src.scorePrecisionSum || 0;
        // ✅ bins 加算
        for (const k of ["50", "60", "70", "80", "90"]) {
            const sb = (_b = src.calibrationBins) === null || _b === void 0 ? void 0 : _b[k];
            if (!sb)
                continue;
            b.calibrationBins[k].total += sb.total || 0;
            b.calibrationBins[k].wins += sb.wins || 0;
            b.calibrationBins[k].sumProb += sb.sumProb || 0;
        }
    });
    return recomputeCache(b);
}
/* =========================================================
 * 任意の期間 start〜end を集計（週間・月間ランキング用）
 * =======================================================*/
async function getStatsForDateRangeV2(uid, start, end, league) {
    var _a, _b;
    const coll = db().collection("user_stats_v2_daily");
    const ONE = 86400000;
    let b = emptyBucket();
    for (let t = start.getTime(); t <= end.getTime(); t += ONE) {
        const d = new Date(t);
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
        b.scorePrecisionSum += src.scorePrecisionSum || 0;
        // ✅ bins 加算
        for (const k of ["50", "60", "70", "80", "90"]) {
            const sb = (_b = src.calibrationBins) === null || _b === void 0 ? void 0 : _b[k];
            if (!sb)
                continue;
            b.calibrationBins[k].total += sb.total || 0;
            b.calibrationBins[k].wins += sb.wins || 0;
            b.calibrationBins[k].sumProb += sb.sumProb || 0;
        }
    }
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