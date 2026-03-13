"use strict";
// functions/src/shared/upset/upsetJudge.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsetJudge = upsetJudge;
function upsetJudge(input) {
    const { market, result, teams, thresholds } = input;
    // draw は Upset 対象外
    if (market.majoritySide === "draw") {
        return { isUpsetGame: false };
    }
    // 市場サンプル不足は除外
    if (market.total < thresholds.minMarket) {
        return { isUpsetGame: false };
    }
    // meta用に winDiff は算出して保持（判定には使わない）
    const winDiff = result.winnerSide === "home"
        ? teams.awayWins - teams.homeWins
        : teams.homeWins - teams.awayWins;
    // Upset判定は「市場偏りのみ」
    const isUpset = market.majoritySide !== result.winnerSide &&
        market.majorityRatio >= thresholds.marketRatio;
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