"use strict";
// functions/src/upsetJudge.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsetJudge = upsetJudge;
function upsetJudge(input) {
    const { market, actualOutcome, sport, teams, thresholds } = input;
    // NBA/B1: 多数派が引き分けのときは upset 判定しない（試合も基本的に決着）
    if (sport === "basketball" && market.majoritySide === "draw") {
        return { isUpsetGame: false };
    }
    if (market.total < thresholds.minMarket) {
        return { isUpsetGame: false };
    }
    let winDiff = 0;
    if (actualOutcome === "home") {
        winDiff = teams.awayWins - teams.homeWins;
    }
    else if (actualOutcome === "away") {
        winDiff = teams.homeWins - teams.awayWins;
    }
    const isUpset = market.majoritySide !== actualOutcome &&
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