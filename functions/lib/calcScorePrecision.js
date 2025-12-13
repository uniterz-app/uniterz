"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcScorePrecision = calcScorePrecision;
const sportTypes_1 = require("./sportTypes");
const scorePrecisionRules_1 = require("./scorePrecisionRules");
/**
 * スコア精度（0〜15 pt）
 */
function calcScorePrecision({ predictedHome, predictedAway, actualHome, actualAway, league, }) {
    var _a;
    const sport = (_a = sportTypes_1.SPORT_TYPE_BY_LEAGUE[league]) !== null && _a !== void 0 ? _a : "basketball";
    /* =========================
     * Football（サッカー）
     * ========================= */
    if (sport === "football") {
        const { totalPt } = scorePrecisionRules_1.scorePrecisionRules.football.calc(predictedHome, predictedAway, actualHome, actualAway);
        // 既存 I/F を壊さない
        return {
            homePt: 0,
            awayPt: 0,
            diffPt: 0,
            totalPt, // 0–15
        };
    }
    /* =========================
     * Basketball（現行ロジック）
     * ========================= */
    const rules = scorePrecisionRules_1.scorePrecisionRules.basketball;
    const diffHome = Math.abs(predictedHome - actualHome);
    const diffAway = Math.abs(predictedAway - actualAway);
    const diff = Math.abs((predictedHome - predictedAway) -
        (actualHome - actualAway));
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