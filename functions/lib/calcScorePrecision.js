"use strict";
// functions/src/calcScorePrecision/calcScorePrecision.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcScorePrecision = calcScorePrecision;
const sportTypes_1 = require("./sportTypes");
const scorePrecisionRules_1 = require("./scorePrecisionRules");
/**
 * スコア精度（home / away / 得失点差）を合計して 0〜15 pt を返す
 */
function calcScorePrecision({ predictedHome, predictedAway, actualHome, actualAway, league, }) {
    var _a;
    const sport = (_a = sportTypes_1.SPORT_TYPE_BY_LEAGUE[league]) !== null && _a !== void 0 ? _a : "basketball"; // fallback
    const rules = scorePrecisionRules_1.scorePrecisionRules[sport];
    // 各軸のずれ
    const diffHome = Math.abs(predictedHome - actualHome);
    const diffAway = Math.abs(predictedAway - actualAway);
    const diff = Math.abs((predictedHome - predictedAway) - (actualHome - actualAway));
    // 点数化
    const homePt = rules.pointByHome(diffHome);
    const awayPt = rules.pointByAway(diffAway);
    const diffPt = rules.pointByDiff(diff);
    return {
        homePt,
        awayPt,
        diffPt,
        totalPt: homePt + awayPt + diffPt, // 最大15
    };
}
//# sourceMappingURL=calcScorePrecision.js.map