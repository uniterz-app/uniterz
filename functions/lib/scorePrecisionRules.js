"use strict";
// functions/src/calcScorePrecision/scorePrecisionRules.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.scorePrecisionRules = void 0;
function curvedScore(diff, full, zeroAt, gamma) {
    if (diff <= full)
        return 1;
    if (diff >= zeroAt)
        return 0;
    const r = 1 - (diff - full) / (zeroAt - full); // 線形
    return Math.pow(r, gamma); // 厳しく
}
exports.scorePrecisionRules = {
    basketball: {
        // 点差（最大7点）
        pointByDiff(diff) {
            const r = curvedScore(diff, 6, 16, 1.6);
            return Math.round(r * 7 * 10) / 10;
        },
        // HOME（最大4点）
        pointByHome(diff) {
            const r = curvedScore(diff, 6, 16, 1.6);
            return Math.round(r * 4 * 10) / 10;
        },
        // AWAY（最大4点）
        pointByAway(diff) {
            const r = curvedScore(diff, 6, 16, 1.6);
            return Math.round(r * 4 * 10) / 10;
        },
    },
};
//# sourceMappingURL=scorePrecisionRules.js.map