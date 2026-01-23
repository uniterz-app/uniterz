"use strict";
// functions/src/shared/upset/upsetJudge.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsetJudge = upsetJudge;
function upsetJudge(input) {
    const { market, result, teams, thresholds } = input;
    // ★ draw は Upset 対象外
    if (market.majoritySide === "draw") {
        return { isUpsetGame: false };
    }
    if (market.total < thresholds.minMarket) {
        return { isUpsetGame: false };
    }
    const winDiff = result.winnerSide === "home"
        ? teams.awayWins - teams.homeWins
        : teams.homeWins - teams.awayWins;
    const isUpset = market.majoritySide !== result.winnerSide &&
        market.majorityRatio >= thresholds.marketRatio &&
        winDiff >= thresholds.winDiff;
    if (!isUpset)
        return { isUpsetGame: false };
    return {
        isUpsetGame: true,
        meta: {
            marketMajoritySide: market.majoritySide,
            marketMajorityRatio: market.majorityRatio,
            winDiff,
        },
    };
}
//# sourceMappingURL=upsetJudge.js.map