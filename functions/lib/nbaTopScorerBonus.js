"use strict";
/** NBA 最多得点者ボーナス（functions 側。lib/nba/topScorer.ts と同ロジック） */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NBA_TOP_SCORER_BONUS_POINTS = void 0;
exports.calcNbaTopScorerBonus = calcNbaTopScorerBonus;
exports.NBA_TOP_SCORER_BONUS_POINTS = 2;
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
function normalizeLeadingScorers(raw) {
    if (!Array.isArray(raw))
        return [];
    const parsed = [];
    for (const row of raw) {
        if (!row || typeof row !== "object")
            continue;
        const pick = normalizePick(row);
        if (!pick)
            continue;
        const points = Number(row.points);
        if (!Number.isFinite(points) || points < 0)
            continue;
        parsed.push(Object.assign(Object.assign({}, pick), { points }));
    }
    if (parsed.length === 0)
        return [];
    const maxPts = Math.max(...parsed.map((p) => Number(p.points)));
    return parsed.filter((p) => Number(p.points) === maxPts);
}
function calcNbaTopScorerBonus(league, prediction, leadingScorers) {
    if (String(league !== null && league !== void 0 ? league : "").toLowerCase() !== "nba")
        return 0;
    const pick = normalizePick(prediction === null || prediction === void 0 ? void 0 : prediction.goalScorer);
    if (!pick)
        return 0;
    const leaders = normalizeLeadingScorers(leadingScorers);
    const hit = leaders.some((g) => g.playerId === pick.playerId && g.teamId === pick.teamId);
    return hit ? exports.NBA_TOP_SCORER_BONUS_POINTS : 0;
}
//# sourceMappingURL=nbaTopScorerBonus.js.map