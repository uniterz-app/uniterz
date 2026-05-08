"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leagueToSport = leagueToSport;
exports.getFootballLineScore = getFootballLineScore;
exports.resolveActualOutcomeForUpset = resolveActualOutcomeForUpset;
const sportTypes_1 = require("./sportTypes");
function leagueToSport(league) {
    var _a;
    const key = String(league !== null && league !== void 0 ? league : "")
        .trim()
        .toLowerCase();
    return (_a = sportTypes_1.SPORT_TYPE_BY_LEAGUE[key]) !== null && _a !== void 0 ? _a : "basketball";
}
function getFootballLineScore(g) {
    const r = g.regulationEtScore;
    if (r &&
        Number.isFinite(r.home) &&
        Number.isFinite(r.away)) {
        return { home: r.home, away: r.away };
    }
    return { home: g.homeScore, away: g.awayScore };
}
/** アップセット判定用の実結果（home / away / draw） */
function resolveActualOutcomeForUpset(g, sport) {
    if (sport === "football" &&
        g.knockout &&
        g.advancingTeamId &&
        g.homeTeamId &&
        g.awayTeamId) {
        return g.advancingTeamId === g.homeTeamId ? "home" : "away";
    }
    if (g.homeScore === g.awayScore)
        return "draw";
    return g.homeScore > g.awayScore ? "home" : "away";
}
//# sourceMappingURL=settlementGame.js.map