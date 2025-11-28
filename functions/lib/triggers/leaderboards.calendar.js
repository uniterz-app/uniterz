"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rebuildCalendarLeaderboardsCronWeek = exports.rebuildCalendarLeaderboardsCronMonth = exports.rebuildCalendarLeaderboardsHttp = void 0;
// functions/src/triggers/leaderboards.calendar.ts
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firestore_1 = require("firebase-admin/firestore");
const updateUserStats_1 = require("../updateUserStats");
const periods_1 = require("../periods");
const db = (0, firestore_1.getFirestore)();
/** kind に応じて「対象期間」を決めるラッパー */
function resolveRange(kind) {
    const now = new Date();
    return kind === "month" ? (0, periods_1.getLastMonthRangeJst)(now) : (0, periods_1.getLastWeekRangeJst)(now);
}
/** 「先月 / 先週」のリーダーボードを leaderboards_calendar に書き出す */
async function rebuildCalendarLeaderboard(kind, league) {
    var _a, _b, _c, _d;
    const { start, end, id } = resolveRange(kind);
    const minPosts = kind === "month" ? 10 : 3;
    const usersSnap = await db.collection("users").get();
    const docId = `${kind}_${league}_${id}`;
    const periodDocRef = db.collection("leaderboards_calendar").doc(docId);
    await periodDocRef.set({
        kind,
        league,
        periodId: id,
        startAtJst: start.toISOString(),
        endAtJst: end.toISOString(),
        rebuiltAt: firestore_1.FieldValue.serverTimestamp(),
    }, { merge: true });
    // 古い users サブコレクションを削除
    const oldUsersSnap = await periodDocRef.collection("users").get();
    if (!oldUsersSnap.empty) {
        const batchDelete = db.batch();
        oldUsersSnap.docs.forEach((d) => batchDelete.delete(d.ref));
        await batchDelete.commit();
    }
    // 対象期間の成績を書き出す
    for (const userDoc of usersSnap.docs) {
        const uid = userDoc.id;
        const u = userDoc.data();
        const bucket = await (0, updateUserStats_1.getBucketForDateRangeJst)(uid, start, end, league);
        if (bucket.posts < minPosts)
            continue;
        const posts = bucket.posts || 0;
        const hit = bucket.hit || 0;
        const units = bucket.units || 0;
        const oddsSum = bucket.oddsSum || 0;
        const oddsCnt = bucket.oddsCnt || 0;
        const winRate = posts > 0 ? hit / posts : 0;
        const avgOdds = oddsCnt > 0 ? oddsSum / oddsCnt : 0;
        const postsTotal = Number((_b = (_a = u === null || u === void 0 ? void 0 : u.counts) === null || _a === void 0 ? void 0 : _a.posts) !== null && _b !== void 0 ? _b : 0);
        await periodDocRef.collection("users").doc(uid).set({
            uid,
            displayName: (_c = u.displayName) !== null && _c !== void 0 ? _c : "user",
            photoURL: (_d = u.photoURL) !== null && _d !== void 0 ? _d : null,
            postsTotal,
            posts,
            hit,
            units,
            oddsSum,
            oddsCnt,
            winRate,
            avgOdds,
            league,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        }, { merge: true });
    }
    return { kind, league, periodId: id };
}
/* ===================================================
 * HTTP 手動実行
 * ===================================================*/
exports.rebuildCalendarLeaderboardsHttp = (0, https_1.onRequest)(async (req, res) => {
    var _a;
    try {
        const kindParam = req.query.kind || "month";
        const leagueParam = req.query.league || "all";
        const kind = kindParam === "week" ? "week" : "month";
        const league = leagueParam === "b1" ? "b1" :
            leagueParam === "j1" ? "j1" : "all";
        const result = await rebuildCalendarLeaderboard(kind, league);
        res.status(200).json(Object.assign({ ok: true }, result));
    }
    catch (e) {
        console.error("[rebuildCalendarLeaderboardsHttp] failed:", e);
        res.status(500).json({ ok: false, error: (_a = e === null || e === void 0 ? void 0 : e.message) !== null && _a !== void 0 ? _a : "failed" });
    }
});
/* ===================================================
 * Cron（毎月）
 * ===================================================*/
exports.rebuildCalendarLeaderboardsCronMonth = (0, scheduler_1.onSchedule)({
    schedule: "0 20 31 * *", // JST 05:00
    timeZone: "Asia/Tokyo",
}, async () => {
    try {
        await rebuildCalendarLeaderboard("month", "all");
        await rebuildCalendarLeaderboard("month", "b1");
        await rebuildCalendarLeaderboard("month", "j1");
    }
    catch (e) {
        console.error("[rebuildCalendarLeaderboardsCronMonth] failed:", e);
    }
});
/* ===================================================
 * Cron（毎週）
 * ===================================================*/
exports.rebuildCalendarLeaderboardsCronWeek = (0, scheduler_1.onSchedule)({
    schedule: "0 20 * * 0", // JST 月曜05:00
    timeZone: "Asia/Tokyo",
}, async () => {
    try {
        await rebuildCalendarLeaderboard("week", "all");
        await rebuildCalendarLeaderboard("week", "b1");
        await rebuildCalendarLeaderboard("week", "j1");
    }
    catch (e) {
        console.error("[rebuildCalendarLeaderboardsCronWeek] failed:", e);
    }
});
//# sourceMappingURL=leaderboards.calendar.js.map