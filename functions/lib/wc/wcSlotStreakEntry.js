"use strict";
/** Keep in sync with lib/wc/wcSlotStreakReplay.ts */
Object.defineProperty(exports, "__esModule", { value: true });
exports.replayFootballEntryBeforeKickoff = replayFootballEntryBeforeKickoff;
exports.clearWcGamesByKickoffCacheForTests = clearWcGamesByKickoffCacheForTests;
const wcKickoffSlot_1 = require("./wcKickoffSlot");
function entryActiveFootball(curF) {
    return curF > 0 ? curF : 0;
}
function buildTimelineUnits(posts, gamesByKickoff) {
    var _a, _b;
    const byKickoff = new Map();
    for (const post of posts) {
        const perGame = (_a = byKickoff.get(post.kickoffMs)) !== null && _a !== void 0 ? _a : new Map();
        perGame.set(post.gameId, post.isWin);
        byKickoff.set(post.kickoffMs, perGame);
    }
    const kickoffs = [...byKickoff.keys()].sort((a, b) => a - b);
    const units = [];
    for (const kickoffMs of kickoffs) {
        const posted = byKickoff.get(kickoffMs);
        if (!posted || posted.size === 0)
            continue;
        const slotGameIds = (_b = gamesByKickoff.get(kickoffMs)) !== null && _b !== void 0 ? _b : [];
        if (slotGameIds.length >= 2) {
            const outcomes = [...posted.entries()]
                .map(([gameId, didWin]) => ({ gameId, didWin }))
                .sort((a, b) => a.gameId.localeCompare(b.gameId));
            units.push({ kind: "slot", kickoffMs, outcomes });
            continue;
        }
        for (const [gameId, isWin] of posted) {
            units.push({ kind: "single", gameId, isWin });
        }
    }
    return units;
}
function replayFootballStreakWithSlots(units) {
    let curF = 0;
    for (const unit of units) {
        if (unit.kind === "single") {
            if (unit.isWin)
                curF = curF > 0 ? curF + 1 : 1;
            else
                curF = curF < 0 ? curF - 1 : -1;
            continue;
        }
        const entry = entryActiveFootball(curF);
        const slot = (0, wcKickoffSlot_1.computeWcSlotStreakOutcome)(entry, unit.outcomes);
        curF = slot.finalCurF;
    }
    return entryActiveFootball(curF);
}
async function loadWcGamesByKickoff(db) {
    var _a;
    const snap = await db.collection("games").where("league", "==", "wc").get();
    const out = new Map();
    for (const doc of snap.docs) {
        const ms = (0, wcKickoffSlot_1.resolveKickoffMsFromFields)(doc.data());
        if (ms == null)
            continue;
        const list = (_a = out.get(ms)) !== null && _a !== void 0 ? _a : [];
        list.push(doc.id);
        out.set(ms, list);
    }
    for (const [ms, ids] of out) {
        out.set(ms, [...ids].sort((a, b) => a.localeCompare(b)));
    }
    return out;
}
let wcGamesByKickoffCache = null;
async function getWcGamesByKickoff(db) {
    if (!wcGamesByKickoffCache) {
        wcGamesByKickoffCache = await loadWcGamesByKickoff(db);
    }
    return wcGamesByKickoffCache;
}
/** 同スロット試合を除き、キックオフ前までの football 連勝をリプレイする */
async function replayFootballEntryBeforeKickoff(db, uid, beforeKickoffMs, excludeGameIds) {
    var _a, _b;
    const postsSnap = await db
        .collection("posts")
        .where("authorUid", "==", uid)
        .where("league", "==", "wc")
        .where("schemaVersion", "==", 2)
        .get();
    const gamesByKickoff = await getWcGamesByKickoff(db);
    const replayPosts = [];
    for (const doc of postsSnap.docs) {
        const p = doc.data();
        const gameId = String((_a = p.gameId) !== null && _a !== void 0 ? _a : "").trim();
        if (!gameId || excludeGameIds.has(gameId))
            continue;
        const gameSnap = await db.doc(`games/${gameId}`).get();
        if (!gameSnap.exists || gameSnap.get("final") !== true)
            continue;
        const kickoffMs = (0, wcKickoffSlot_1.resolveKickoffMsFromFields)(gameSnap.data());
        if (kickoffMs == null || kickoffMs >= beforeKickoffMs)
            continue;
        const stats = ((_b = p.stats) !== null && _b !== void 0 ? _b : {});
        if (typeof stats.isWin !== "boolean")
            continue;
        replayPosts.push({ gameId, isWin: stats.isWin, kickoffMs });
    }
    const units = buildTimelineUnits(replayPosts, gamesByKickoff);
    return replayFootballStreakWithSlots(units);
}
/** テスト用: キャッシュをクリア */
function clearWcGamesByKickoffCacheForTests() {
    wcGamesByKickoffCache = null;
}
//# sourceMappingURL=wcSlotStreakEntry.js.map