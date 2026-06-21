"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadAuthorUidsPostedToday = void 0;
exports.jstDayBounds = jstDayBounds;
exports.loadAuthorUidsSettledToday = loadAuthorUidsSettledToday;
exports.isActiveWinStreakRankingEligible = isActiveWinStreakRankingEligible;
const firestore_1 = require("firebase-admin/firestore");
function toDateKeyJST(d) {
    const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const y = j.getUTCFullYear();
    const m = String(j.getUTCMonth() + 1).padStart(2, "0");
    const day = String(j.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}
function jstDayBounds(now = new Date()) {
    const j = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const startJst = new Date(Date.UTC(j.getUTCFullYear(), j.getUTCMonth(), j.getUTCDate(), 0, 0, 0, 0));
    startJst.setTime(startJst.getTime() - 9 * 60 * 60 * 1000);
    const endJst = new Date(startJst.getTime() + 24 * 60 * 60 * 1000);
    return {
        dateKey: toDateKeyJST(now),
        start: firestore_1.Timestamp.fromDate(startJst),
        end: firestore_1.Timestamp.fromDate(endJst),
    };
}
/** JST 今日に league 向け投稿が確定（settledAt）した authorUid — 16:00 スナップショット用 */
async function loadAuthorUidsSettledToday(league, now = new Date()) {
    var _a;
    const { start, end } = jstDayBounds(now);
    const snap = await (0, firestore_1.getFirestore)()
        .collection("posts")
        .where("league", "==", league)
        .where("schemaVersion", "==", 2)
        .where("status", "==", "final")
        .where("settledAt", ">=", start)
        .where("settledAt", "<", end)
        .select("authorUid")
        .get();
    const out = new Set();
    for (const doc of snap.docs) {
        const uid = String((_a = doc.data().authorUid) !== null && _a !== void 0 ? _a : "").trim();
        if (uid)
            out.add(uid);
    }
    return out;
}
/** @deprecated use loadAuthorUidsSettledToday */
exports.loadAuthorUidsPostedToday = loadAuthorUidsSettledToday;
function isActiveWinStreakRankingEligible(uid, activeWinStreak, settledTodayUids) {
    return settledTodayUids.has(uid) && activeWinStreak > 0;
}
//# sourceMappingURL=activeWinStreakRanking.js.map