"use strict";
/** Keep in sync with lib/wc/wcKickoffSlot.ts */
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveKickoffMsFromFields = resolveKickoffMsFromFields;
exports.kickoffSlotKey = kickoffSlotKey;
exports.hasConcurrentKickoffSlot = hasConcurrentKickoffSlot;
exports.computeWcSlotStreakOutcome = computeWcSlotStreakOutcome;
function resolveKickoffMsFromFields(game) {
    if (!game)
        return null;
    for (const v of [game.startAtJst, game.startAt, game.kickoffJst]) {
        const ms = timestampLikeToMs(v);
        if (ms != null)
            return ms;
    }
    return null;
}
function timestampLikeToMs(v) {
    if (v == null)
        return null;
    if (typeof v === "number" && Number.isFinite(v))
        return v;
    if (v instanceof Date)
        return v.getTime();
    if (typeof v === "object" && v !== null && "toDate" in v) {
        const d = v.toDate();
        if (d instanceof Date && !Number.isNaN(d.getTime()))
            return d.getTime();
    }
    if (typeof v === "object" && v !== null && "seconds" in v) {
        const sec = Number(v.seconds);
        if (Number.isFinite(sec))
            return sec * 1000;
    }
    return null;
}
function kickoffSlotKey(kickoffMs) {
    return `wc-kickoff:${kickoffMs}`;
}
function hasConcurrentKickoffSlot(games) {
    var _a;
    const counts = new Map();
    for (const g of games) {
        if (g.kickoffMs == null)
            continue;
        counts.set(g.kickoffMs, ((_a = counts.get(g.kickoffMs)) !== null && _a !== void 0 ? _a : 0) + 1);
    }
    return [...counts.values()].some((n) => n >= 2);
}
function computeWcSlotStreakOutcome(entryCurF, postedOutcomes) {
    const sorted = [...postedOutcomes].sort((a, b) => a.gameId.localeCompare(b.gameId));
    const perGame = new Map();
    const anyLoss = sorted.some((o) => !o.didWin);
    if (anyLoss) {
        for (const o of sorted)
            perGame.set(o.gameId, 0);
        return {
            finalCurF: -1,
            finalActiveWinStreak: 0,
            perGameActiveWinStreak: perGame,
        };
    }
    let curF = entryCurF;
    for (const o of sorted) {
        curF = curF > 0 ? curF + 1 : 1;
        perGame.set(o.gameId, curF);
    }
    return {
        finalCurF: curF,
        finalActiveWinStreak: curF > 0 ? curF : 0,
        perGameActiveWinStreak: perGame,
    };
}
//# sourceMappingURL=wcKickoffSlot.js.map