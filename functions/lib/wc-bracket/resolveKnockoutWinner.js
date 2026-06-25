"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveWcKnockoutMatchIdFromGame = resolveWcKnockoutMatchIdFromGame;
exports.resolveKnockoutWinnerTeamId = resolveKnockoutWinnerTeamId;
const wcKnockoutMatchIds_1 = require("./wcKnockoutMatchIds");
function resolveWcKnockoutMatchIdFromGame(game) {
    var _a, _b;
    const raw = (_a = game.wcKnockoutMatchId) !== null && _a !== void 0 ? _a : game.wcMatchId;
    const id = String(raw !== null && raw !== void 0 ? raw : "").trim().toUpperCase();
    if ((0, wcKnockoutMatchIds_1.isWcBracketPredictMatchId)(id))
        return id;
    const gameId = String((_b = game.id) !== null && _b !== void 0 ? _b : "").trim();
    const m = gameId.match(/(?:^|[-_])M(\d{2,3})$/i);
    if (m) {
        const candidate = `M${m[1]}`;
        if ((0, wcKnockoutMatchIds_1.isWcBracketPredictMatchId)(candidate))
            return candidate;
    }
    return null;
}
/** ノックアウト試合の勝者 teamId（PK 進出は advancingTeamId 優先） */
function resolveKnockoutWinnerTeamId(game) {
    var _a, _b, _c;
    const adv = String((_a = game.advancingTeamId) !== null && _a !== void 0 ? _a : "").trim();
    if (adv)
        return adv;
    const home = String((_b = game.homeTeamId) !== null && _b !== void 0 ? _b : "").trim();
    const away = String((_c = game.awayTeamId) !== null && _c !== void 0 ? _c : "").trim();
    const hs = game.homeScore;
    const as = game.awayScore;
    if (hs == null || as == null || !home || !away)
        return null;
    if (hs === as)
        return null;
    return hs > as ? home : away;
}
//# sourceMappingURL=resolveKnockoutWinner.js.map