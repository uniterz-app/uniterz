"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadAuthorUidsPostedToday = void 0;
exports.jstDayBounds = jstDayBounds;
exports.loadAuthorUidsSettledToday = loadAuthorUidsSettledToday;
exports.loadAuthorUidsSettledTodayForWcStage = loadAuthorUidsSettledTodayForWcStage;
exports.isActiveWinStreakRankingEligible = isActiveWinStreakRankingEligible;
const firestore_1 = require("firebase-admin/firestore");
const resolveWcStage_1 = require("../wc/resolveWcStage");
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
/**
 * JST 今日に WC の指定ステージ試合で投稿が確定した authorUid。
 * ノックアウト連勝ランキング（main）はノックアウト試合の当日確定のみ対象。
 */
async function loadAuthorUidsSettledTodayForWcStage(stage, now = new Date()) {
    var _a, _b;
    const { start, end } = jstDayBounds(now);
    const snap = await (0, firestore_1.getFirestore)()
        .collection("posts")
        .where("league", "==", "wc")
        .where("schemaVersion", "==", 2)
        .where("status", "==", "final")
        .where("settledAt", ">=", start)
        .where("settledAt", "<", end)
        .select("authorUid", "gameId")
        .get();
    if (snap.empty)
        return new Set();
    const gameIds = [
        ...new Set(snap.docs
            .map((d) => { var _a; return String((_a = d.data().gameId) !== null && _a !== void 0 ? _a : "").trim(); })
            .filter(Boolean)),
    ];
    const stageByGameId = new Map();
    const db = (0, firestore_1.getFirestore)();
    const CHUNK = 100;
    for (let i = 0; i < gameIds.length; i += CHUNK) {
        const chunk = gameIds.slice(i, i + CHUNK);
        const refs = chunk.map((id) => db.doc(`games/${id}`));
        const gameSnaps = await db.getAll(...refs);
        for (const gameSnap of gameSnaps) {
            if (!gameSnap.exists)
                continue;
            const data = gameSnap.data();
            stageByGameId.set(gameSnap.id, (0, resolveWcStage_1.resolveWcStageFromGame)({
                knockout: data.knockout === true,
                roundLabel: typeof data.roundLabel === "string" ? data.roundLabel : null,
                wcStage: typeof data.wcStage === "string" ? data.wcStage : null,
            }));
        }
    }
    const out = new Set();
    for (const doc of snap.docs) {
        const gameId = String((_a = doc.data().gameId) !== null && _a !== void 0 ? _a : "").trim();
        if (!gameId || stageByGameId.get(gameId) !== stage)
            continue;
        const uid = String((_b = doc.data().authorUid) !== null && _b !== void 0 ? _b : "").trim();
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