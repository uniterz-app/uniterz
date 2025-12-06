"use strict";
// functions/src/calcScorePrecision/scorePrecisionRules.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.scorePrecisionRules = void 0;
/**
 * バスケ向け 3段階ルール
 * 0〜6 → 5pt
 * 7〜13 → 2pt
 * 14+ → 0pt
 */
const basketballPoint = (diff) => {
    if (diff <= 6)
        return 5;
    if (diff <= 13)
        return 2;
    return 0;
};
/**
 * サッカー向け 3段階ルール
 * 0 → 5pt
 * 1 → 2pt
 * 2+ → 0pt
 */
const footballPoint = (diff) => {
    if (diff === 0)
        return 5;
    if (diff === 1)
        return 2;
    return 0;
};
exports.scorePrecisionRules = {
    basketball: {
        pointByHome: basketballPoint,
        pointByAway: basketballPoint,
        pointByDiff: basketballPoint,
    },
    football: {
        pointByHome: footballPoint,
        pointByAway: footballPoint,
        pointByDiff: footballPoint,
    },
};
//# sourceMappingURL=scorePrecisionRules.js.map