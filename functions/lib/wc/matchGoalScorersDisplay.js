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
function formatWcGoalMinuteDisplay(minute) {
    if (minute == null || !Number.isFinite(Number(minute)))
        return "";
    const m = Math.floor(Number(minute));
    if (m > 90)
        return `90+${m - 90}'`;
    return `${m}'`;
}
function formatGroupedLine(playerName, minutes, ownGoal) {
    const mins = minutes
        .map((m) => formatWcGoalMinuteDisplay(m))
        .filter(Boolean)
        .join(", ");
    const core = mins ? `${playerName} ${mins}` : playerName.trim();
    return ownGoal ? `${core} (OG)` : core;
}
function sideForTeamId(teamId, homeTeamId, awayTeamId) {
    if (homeTeamId && teamId === homeTeamId)
        return "home";
    if (awayTeamId && teamId === awayTeamId)
        return "away";
    return null;
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
    const map = new Map();
    for (const g of list) {
        const side = sideForTeamId(g.teamId, homeTeamId, awayTeamId);
        if (!side)
            continue;
        const fullName = getPlayerName(g.teamId, g.playerId);
        const key = `${side}\0${g.playerId}\0${g.ownGoal ? 1 : 0}`;
        const prev = map.get(key);
        if (prev) {
            if (g.minute != null && Number.isFinite(g.minute)) {
                prev.minutes.push(g.minute);
            }
            continue;
        }
        map.set(key, {
            side,
            name: fullName,
            minutes: g.minute != null && Number.isFinite(g.minute) ? [g.minute] : [],
            ownGoal: Boolean(g.ownGoal),
        });
    }
    const rows = [];
    for (const g of map.values()) {
        g.minutes.sort((a, b) => a - b);
        rows.push(Object.assign({ side: g.side, minute: (_a = g.minutes[0]) !== null && _a !== void 0 ? _a : null, label: formatGroupedLine(g.name, g.minutes, g.ownGoal) }, (g.ownGoal ? { ownGoal: true } : {})));
    }
    return sortRows(rows);
}
//# sourceMappingURL=matchGoalScorersDisplay.js.map