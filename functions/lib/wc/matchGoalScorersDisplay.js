"use strict";
/** Keep in sync with lib/wc/matchGoalScorers.ts */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPostMatchGoalScorersFromGame = buildPostMatchGoalScorersFromGame;
const goalScorerResolve_1 = require("./goalScorerResolve");
const squadNameIndex_1 = require("./squadNameIndex");
function wcTeamIdToIso3(teamId) {
    if (!teamId.startsWith("wc-"))
        return null;
    return teamId.slice(3).toLowerCase();
}
function getPlayerName(teamId, playerId) {
    var _a, _b, _c;
    const iso3 = wcTeamIdToIso3(teamId);
    if (!iso3)
        return playerId;
    const squad = (_a = squadNameIndex_1.WC_SQUAD_NAME_INDEX[iso3]) !== null && _a !== void 0 ? _a : [];
    return (_c = (_b = squad.find((p) => p.id === playerId)) === null || _b === void 0 ? void 0 : _b.name) !== null && _c !== void 0 ? _c : playerId;
}
function formatWcPlayerShortName(fullName) {
    var _a, _b;
    const trimmed = fullName.trim();
    if (!trimmed)
        return "";
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length === 1)
        return parts[0];
    const last = parts[parts.length - 1];
    const initial = (_b = (_a = parts[0][0]) === null || _a === void 0 ? void 0 : _a.toUpperCase()) !== null && _b !== void 0 ? _b : "";
    if (!initial)
        return last;
    return `${initial}.${last}`;
}
function formatLabel(fullName, minute, ownGoal) {
    const short = formatWcPlayerShortName(fullName);
    const withMin = minute != null && Number.isFinite(minute) ? `${short} ${minute}'` : short;
    return ownGoal ? `${withMin} OG` : withMin;
}
function sortRows(rows) {
    return [...rows].sort((a, b) => {
        var _a, _b;
        const am = (_a = a.minute) !== null && _a !== void 0 ? _a : 9999;
        const bm = (_b = b.minute) !== null && _b !== void 0 ? _b : 9999;
        if (am !== bm)
            return am - bm;
        if (a.side !== b.side)
            return a.side === "home" ? -1 : 1;
        return a.label.localeCompare(b.label);
    });
}
function buildPostMatchGoalScorersFromGame(raw, homeTeamId, awayTeamId) {
    var _a;
    const list = (0, goalScorerResolve_1.resolveWcGameGoalScorers)(raw, {
        homeTeamId,
        awayTeamId,
    });
    const rows = [];
    for (const g of list) {
        let side = null;
        if (homeTeamId && g.teamId === homeTeamId)
            side = "home";
        else if (awayTeamId && g.teamId === awayTeamId)
            side = "away";
        if (!side)
            continue;
        const fullName = getPlayerName(g.teamId, g.playerId);
        rows.push(Object.assign({ side, minute: (_a = g.minute) !== null && _a !== void 0 ? _a : null, label: formatLabel(fullName, g.minute, g.ownGoal) }, (g.ownGoal ? { ownGoal: true } : {})));
    }
    return sortRows(rows);
}
//# sourceMappingURL=matchGoalScorersDisplay.js.map