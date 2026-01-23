"use strict";
// functions/src/shared/market/marketCalculator.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.marketCalculator = marketCalculator;
function marketCalculator(picks) {
    let homeCount = 0;
    let awayCount = 0;
    let drawCount = 0;
    for (const p of picks) {
        if (p === "home")
            homeCount++;
        else if (p === "away")
            awayCount++;
        else
            drawCount++;
    }
    const total = homeCount + awayCount + drawCount;
    let majoritySide = "home";
    let majorityCount = homeCount;
    if (awayCount >= homeCount && awayCount >= drawCount) {
        majoritySide = "away";
        majorityCount = awayCount;
    }
    else if (drawCount >= homeCount && drawCount >= awayCount) {
        majoritySide = "draw";
        majorityCount = drawCount;
    }
    return {
        homeCount,
        awayCount,
        drawCount,
        total,
        homeRate: total ? homeCount / total : 0,
        awayRate: total ? awayCount / total : 0,
        drawRate: total ? drawCount / total : 0,
        majoritySide,
        majorityRatio: total ? majorityCount / total : 0,
    };
}
//# sourceMappingURL=marketCalculator.js.map