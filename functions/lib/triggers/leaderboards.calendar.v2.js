"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rebuildLeaderboardMonthV2 = exports.rebuildLeaderboardWeekV2 = exports.rebuildCalendarLeaderboardsHttpV2 = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
/* ============================================================================
 * Firestore
 * ============================================================================
 */
function db() {
    return (0, firestore_1.getFirestore)();
}
const LEAGUES = ["bj", "nba"];
/* ============================================================================
 * JST Date Utils（★ 重要：日付キーはこれだけ使う）
 * ============================================================================
 */
function toDateKeyJst(d) {
    const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const y = j.getUTCFullYear();
    const m = String(j.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(j.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
}
/**
 * 【前週】月曜〜日曜（JST）
 * 例：12/15(月) 実行 → 12/08(月)〜12/14(日)
 */
function getPreviousWeekRange() {
    const now = new Date();
    const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const base = new Date(jst.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dow = base.getDay(); // 0: Sun
    const monday = new Date(base.getFullYear(), base.getMonth(), base.getDate() - ((dow + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return {
        start: monday,
        end: sunday,
        id: toDateKeyJst(monday), // ★ JSTキー
    };
}
/**
 * 【前月】1日〜末日（JST）
 */
function getPreviousMonthRange() {
    const now = new Date();
    const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const year = jst.getMonth() === 0 ? jst.getFullYear() - 1 : jst.getFullYear();
    const month = jst.getMonth() === 0 ? 11 : jst.getMonth() - 1;
    const start = new Date(year, month, 1, 0, 0, 0, 0);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
    return {
        start,
        end,
        id: `${year}-${String(month + 1).padStart(2, "0")}`,
    };
}
async function buildRanking(kind, league) {
    var _a, _b, _c, _d, _e, _f, _g;
    const range = kind === "week" ? getPreviousWeekRange() : getPreviousMonthRange();
    const minPosts = kind === "week" ? 5 : 10;
    const docId = `${kind}_${league}_${range.id}`;
    const ref = db().collection("leaderboards_calendar_v2").doc(docId);
    /* ---- メタ ---- */
    await ref.set({
        kind,
        league,
        periodId: range.id,
        startAtJst: range.start,
        endAtJst: range.end,
        rebuiltAt: firestore_1.FieldValue.serverTimestamp(),
    }, { merge: true });
    /* ---- users 初期化 ---- */
    const old = await ref.collection("users").get();
    if (!old.empty) {
        const batch = db().batch();
        old.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
    }
    /* ---- JST 日付キーで範囲取得 ---- */
    const startDate = toDateKeyJst(range.start);
    const endDate = toDateKeyJst(range.end);
    const statsSnap = await db()
        .collection("user_stats_v2_daily")
        .where("date", ">=", startDate)
        .where("date", "<=", endDate)
        .get();
    console.log("[RANK]", { kind, league, startDate, endDate, size: statsSnap.size });
    const map = new Map();
    for (const doc of statsSnap.docs) {
        const d = doc.data();
        const uid = doc.id.split("_")[0];
        if (!uid)
            continue;
        const leagueStats = (_a = d.leagues) === null || _a === void 0 ? void 0 : _a[league];
        if (!leagueStats)
            continue;
        if (!map.has(uid)) {
            map.set(uid, {
                posts: 0,
                wins: 0,
                brierSum: 0,
                precisionSum: 0,
                upsetSum: 0,
                calibrationErrorSum: 0,
            });
        }
        const agg = map.get(uid);
        agg.posts += (_b = leagueStats.posts) !== null && _b !== void 0 ? _b : 0;
        agg.wins += (_c = leagueStats.wins) !== null && _c !== void 0 ? _c : 0;
        agg.brierSum += (_d = leagueStats.brierSum) !== null && _d !== void 0 ? _d : 0;
        agg.precisionSum += (_e = leagueStats.scorePrecisionSum) !== null && _e !== void 0 ? _e : 0;
        agg.upsetSum += (_f = leagueStats.upsetScoreSum) !== null && _f !== void 0 ? _f : 0;
        agg.calibrationErrorSum += (_g = leagueStats.calibrationErrorSum) !== null && _g !== void 0 ? _g : 0;
    }
    /* ---- 書き込み ---- */
    for (const [uid, agg] of map.entries()) {
        if (agg.posts < minPosts)
            continue;
        const accuracy = (1 - agg.brierSum / agg.posts) * 100;
        const avgPrecision = agg.precisionSum / agg.posts;
        const avgUpset = agg.upsetSum / agg.posts;
        const winRate = agg.wins / agg.posts;
        const consistency = agg.calibrationErrorSum > 0
            ? Math.max(0, Math.min(100, (1 - agg.calibrationErrorSum / agg.posts) * 100))
            : null;
        await ref.collection("users").doc(uid).set({
            uid,
            league,
            posts: agg.posts,
            wins: agg.wins,
            winRate,
            accuracy,
            avgPrecision,
            avgUpset,
            consistency,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        }, { merge: true });
    }
    return { kind, league, periodId: range.id };
}
/* ============================================================================
 * HTTP
 * ============================================================================
 */
exports.rebuildCalendarLeaderboardsHttpV2 = (0, https_1.onRequest)(async (req, res) => {
    try {
        const kind = req.query.kind === "week" ? "week" : "month";
        const league = typeof req.query.league === "string" ? req.query.league : "bj";
        const result = await buildRanking(kind, league);
        res.status(200).json(Object.assign({ ok: true }, result));
    }
    catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});
/* ============================================================================
 * Cron
 * ============================================================================
 */
exports.rebuildLeaderboardWeekV2 = (0, scheduler_1.onSchedule)({ schedule: "0 5 * * 1", timeZone: "Asia/Tokyo" }, async () => {
    for (const league of LEAGUES) {
        await buildRanking("week", league);
    }
});
exports.rebuildLeaderboardMonthV2 = (0, scheduler_1.onSchedule)({ schedule: "0 5 1 * *", timeZone: "Asia/Tokyo" }, async () => {
    for (const league of LEAGUES) {
        await buildRanking("month", league);
    }
});
//# sourceMappingURL=leaderboards.calendar.v2.js.map