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
 * JST Date Utils
 * ============================================================================
 */
function toDateKeyJst(d) {
    const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const y = j.getUTCFullYear();
    const m = String(j.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(j.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
}
function getPreviousWeekRange() {
    const now = new Date();
    const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const base = new Date(jst.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dow = base.getDay();
    const monday = new Date(base.getFullYear(), base.getMonth(), base.getDate() - ((dow + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return {
        start: monday,
        end: sunday,
        id: toDateKeyJst(monday),
    };
}
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
/* ============================================================================
 * Ranking Core
 * ============================================================================
 */
// ★ 追加：リーグ × 期間ごとの最低投稿数
const MIN_POSTS = {
    week: {
        nba: 20, // NBA 週間
        bj: 5, // Bリーグ 週間
    },
    month: {
        nba: 30, // NBA 月間
        bj: 25, // Bリーグ 月間
    },
};
function topN(rows, key, n = 10) {
    return [...rows]
        .sort((a, b) => { var _a, _b; return Number((_a = b[key]) !== null && _a !== void 0 ? _a : 0) - Number((_b = a[key]) !== null && _b !== void 0 ? _b : 0); })
        .slice(0, n);
}
async function buildRanking(kind, league) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    const range = kind === "week" ? getPreviousWeekRange() : getPreviousMonthRange();
    // ★ 修正：期間 × リーグで最低投稿数を決める
    const minPosts = (_b = (_a = MIN_POSTS[kind]) === null || _a === void 0 ? void 0 : _a[league]) !== null && _b !== void 0 ? _b : (kind === "week" ? 5 : 20);
    const docId = `${kind}_${league}_${range.id}`;
    const ref = db().collection("leaderboards_calendar_v2").doc(docId);
    await ref.set({
        kind,
        league,
        periodId: range.id,
        startAtJst: range.start,
        endAtJst: range.end,
        rebuiltAt: firestore_1.FieldValue.serverTimestamp(),
    }, { merge: true });
    const startDate = toDateKeyJst(range.start);
    const endDate = toDateKeyJst(range.end);
    const statsSnap = await db()
        .collection("user_stats_v2_daily")
        .where("date", ">=", startDate)
        .where("date", "<=", endDate)
        .get();
    const map = new Map();
    for (const doc of statsSnap.docs) {
        const d = doc.data();
        const uid = doc.id.split("_")[0];
        if (!uid)
            continue;
        const leagueStats = (_c = d.leagues) === null || _c === void 0 ? void 0 : _c[league];
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
        agg.posts += (_d = leagueStats.posts) !== null && _d !== void 0 ? _d : 0;
        agg.wins += (_e = leagueStats.wins) !== null && _e !== void 0 ? _e : 0;
        agg.brierSum += (_f = leagueStats.brierSum) !== null && _f !== void 0 ? _f : 0;
        agg.precisionSum += (_g = leagueStats.scorePrecisionSum) !== null && _g !== void 0 ? _g : 0;
        agg.upsetSum += (_h = leagueStats.upsetScoreSum) !== null && _h !== void 0 ? _h : 0;
        agg.calibrationErrorSum += (_j = leagueStats.calibrationErrorSum) !== null && _j !== void 0 ? _j : 0;
    }
    /* ---- rows 作成 ---- */
    const rows = [];
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
        const userSnap = await db().collection("users").doc(uid).get();
        const user = userSnap.exists ? userSnap.data() : {};
        rows.push({
            uid,
            handle: (_k = user === null || user === void 0 ? void 0 : user.handle) !== null && _k !== void 0 ? _k : null,
            displayName: (_l = user === null || user === void 0 ? void 0 : user.displayName) !== null && _l !== void 0 ? _l : "user",
            photoURL: (_m = user === null || user === void 0 ? void 0 : user.photoURL) !== null && _m !== void 0 ? _m : null,
            league,
            posts: agg.posts,
            wins: agg.wins,
            winRate,
            accuracy,
            avgPrecision,
            avgUpset,
            consistency,
        });
    }
    /* ---- Top10 保存（★ 追加部分） ---- */
    const top10 = {
        winRate: topN(rows, "winRate"),
        accuracy: topN(rows, "accuracy"),
        consistency: topN(rows, "consistency"),
        avgPrecision: topN(rows, "avgPrecision"),
        avgUpset: topN(rows, "avgUpset"),
    };
    await ref.set({ top10 }, { merge: true });
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