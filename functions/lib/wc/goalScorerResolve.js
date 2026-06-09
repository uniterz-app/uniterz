"use strict";
/** Keep resolve logic in sync with lib/wc/goalScorer.ts */
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveWcGameGoalScorers = resolveWcGameGoalScorers;
const squadNameIndex_1 = require("./squadNameIndex");
function wcTeamIdToIso3(teamId) {
    if (!teamId.startsWith("wc-"))
        return null;
    return teamId.slice(3).toLowerCase();
}
function getSquad(teamId) {
    var _a;
    const iso3 = wcTeamIdToIso3(teamId);
    if (!iso3)
        return null;
    return (_a = squadNameIndex_1.WC_SQUAD_NAME_INDEX[iso3]) !== null && _a !== void 0 ? _a : null;
}
function normalizePlayerNameForMatch(name) {
    return name.trim().toLowerCase().replace(/\s+/g, " ");
}
function findSquadPlayerByName(squad, name) {
    const q = normalizePlayerNameForMatch(name);
    if (!q)
        return undefined;
    const exact = squad.filter((p) => normalizePlayerNameForMatch(p.name) === q);
    if (exact.length === 1)
        return exact[0];
    if (exact.length > 1)
        return undefined;
    const partial = squad.filter((p) => {
        const pn = normalizePlayerNameForMatch(p.name);
        if (pn === q)
            return true;
        if (pn.includes(q) || q.includes(pn))
            return true;
        const parts = pn.split(" ");
        return parts.some((part) => part.length >= 2 && part === q);
    });
    if (partial.length === 1)
        return partial[0];
    return undefined;
}
function parseMinute(raw) {
    if (raw == null || raw === "")
        return null;
    return Number.isFinite(Number(raw)) ? Number(raw) : null;
}
function normalizePick(raw) {
    var _a, _b;
    if (!raw || typeof raw !== "object")
        return null;
    const playerId = String((_a = raw.playerId) !== null && _a !== void 0 ? _a : "").trim();
    const teamId = String((_b = raw.teamId) !== null && _b !== void 0 ? _b : "").trim();
    if (!playerId || !teamId)
        return null;
    return { playerId, teamId };
}
function resolveWcGameGoalScorers(raw, ctx) {
    var _a, _b, _c, _d, _e, _f, _g;
    if (!Array.isArray(raw))
        return [];
    const out = [];
    for (const item of raw) {
        if (!item || typeof item !== "object")
            continue;
        const minute = parseMinute(item.minute);
        const ownGoal = Boolean(item.ownGoal);
        const pick = normalizePick(item);
        if (pick) {
            out.push(Object.assign(Object.assign({}, pick), { minute, ownGoal }));
            continue;
        }
        const name = String((_b = (_a = item.name) !== null && _a !== void 0 ? _a : item.playerName) !== null && _b !== void 0 ? _b : "").trim();
        if (!name)
            continue;
        const sideRaw = String((_d = (_c = item.side) !== null && _c !== void 0 ? _c : item.team) !== null && _d !== void 0 ? _d : "")
            .trim()
            .toLowerCase();
        let teamId = String((_e = item.teamId) !== null && _e !== void 0 ? _e : "").trim();
        if (!teamId) {
            if (sideRaw === "home" || sideRaw === "h") {
                teamId = String((_f = ctx.homeTeamId) !== null && _f !== void 0 ? _f : "").trim();
            }
            else if (sideRaw === "away" || sideRaw === "a") {
                teamId = String((_g = ctx.awayTeamId) !== null && _g !== void 0 ? _g : "").trim();
            }
        }
        let player;
        if (teamId) {
            const squad = getSquad(teamId);
            player = squad ? findSquadPlayerByName(squad, name) : undefined;
        }
        else {
            const homeSquad = ctx.homeTeamId ? getSquad(ctx.homeTeamId) : null;
            const awaySquad = ctx.awayTeamId ? getSquad(ctx.awayTeamId) : null;
            const homeHit = homeSquad
                ? findSquadPlayerByName(homeSquad, name)
                : undefined;
            const awayHit = awaySquad
                ? findSquadPlayerByName(awaySquad, name)
                : undefined;
            if (homeHit && awayHit)
                continue;
            player = homeHit !== null && homeHit !== void 0 ? homeHit : awayHit;
            teamId = homeHit
                ? String(ctx.homeTeamId)
                : awayHit
                    ? String(ctx.awayTeamId)
                    : "";
        }
        if (!player || !teamId)
            continue;
        out.push({
            playerId: player.id,
            teamId,
            minute,
            ownGoal,
        });
    }
    return out;
}
//# sourceMappingURL=goalScorerResolve.js.map