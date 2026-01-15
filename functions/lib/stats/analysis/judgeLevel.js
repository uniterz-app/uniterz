"use strict";
// functions/src/stats/analysis/judgeLevel.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.judgeLevels = judgeLevels;
const thresholds_1 = require("./thresholds");
/**
 * radar10 → S/M/W 判定
 */
function judgeLevels(radar10) {
    const levels = {
        winRate: (0, thresholds_1.toLevel)(radar10.winRate),
        accuracy: (0, thresholds_1.toLevel)(radar10.accuracy),
        precision: (0, thresholds_1.toLevel)(radar10.precision),
        upset: (0, thresholds_1.toLevel)(radar10.upset),
        volume: (0, thresholds_1.toLevel)(radar10.volume),
    };
    const counts = {
        S: 0,
        M: 0,
        W: 0,
    };
    for (const lv of Object.values(levels)) {
        counts[lv]++;
    }
    return {
        levels,
        counts,
    };
}
//# sourceMappingURL=judgeLevel.js.map