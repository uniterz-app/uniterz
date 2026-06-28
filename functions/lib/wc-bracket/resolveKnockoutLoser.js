"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveKnockoutLoserTeamId = resolveKnockoutLoserTeamId;
const resolveKnockoutWinner_1 = require("./resolveKnockoutWinner");
/** ノックアウト試合の敗者 teamId */
function resolveKnockoutLoserTeamId(game) {
    var _a, _b;
    const winner = (0, resolveKnockoutWinner_1.resolveKnockoutWinnerTeamId)(game);
    if (!winner)
        return null;
    const home = String((_a = game.homeTeamId) !== null && _a !== void 0 ? _a : "").trim();
    const away = String((_b = game.awayTeamId) !== null && _b !== void 0 ? _b : "").trim();
    if (!home || !away)
        return null;
    if (winner === home)
        return away;
    if (winner === away)
        return home;
    return null;
}
//# sourceMappingURL=resolveKnockoutLoser.js.map