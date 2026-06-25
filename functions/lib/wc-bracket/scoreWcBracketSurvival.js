"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreWcBracketSurvival = scoreWcBracketSurvival;
exports.wcSurvivalRankKey = wcSurvivalRankKey;
const wcKnockoutMatchIds_1 = require("./wcKnockoutMatchIds");
const ROUND_DEPTH = {
    R32: 0,
    R16: 1,
    QF: 2,
    SF: 3,
    FINAL: 4,
};
/** M73–M88=R32, M89–M96=R16, M97–M100=QF, M101–M102=SF, M104=FINAL */
function survivedRoundsFromFirstMiss(firstMissMatchId) {
    if (!firstMissMatchId)
        return 5;
    const n = Number(firstMissMatchId.slice(1));
    if (n >= 73 && n <= 88)
        return ROUND_DEPTH.R32;
    if (n >= 89 && n <= 96)
        return ROUND_DEPTH.R16;
    if (n >= 97 && n <= 100)
        return ROUND_DEPTH.QF;
    if (n >= 101 && n <= 102)
        return ROUND_DEPTH.SF;
    if (n === 104)
        return ROUND_DEPTH.FINAL;
    return 0;
}
/**
 * 公式結果が入っている試合を順に評価。最初の miss で打ち切り。
 * onGameFinalV2 から 1 試合ずつ winners が増えるたびに全件再評価する。
 */
function scoreWcBracketSurvival(bracket, officialWinners) {
    var _a, _b, _c;
    const hitByMatch = {};
    let firstMissMatchId = null;
    for (const matchId of wcKnockoutMatchIds_1.WC_BRACKET_PREDICT_MATCH_IDS) {
        const official = (_a = officialWinners[matchId]) === null || _a === void 0 ? void 0 : _a.trim();
        if (!official)
            continue;
        const predicted = (_c = (_b = bracket[matchId]) === null || _b === void 0 ? void 0 : _b.winner) === null || _c === void 0 ? void 0 : _c.trim();
        if (!predicted) {
            hitByMatch[matchId] = false;
            if (!firstMissMatchId)
                firstMissMatchId = matchId;
            break;
        }
        const hit = predicted === official;
        hitByMatch[matchId] = hit;
        if (!hit) {
            if (!firstMissMatchId)
                firstMissMatchId = matchId;
            break;
        }
    }
    return {
        alive: firstMissMatchId === null,
        firstMissMatchId,
        survivedRounds: survivedRoundsFromFirstMiss(firstMissMatchId),
        hitByMatch,
    };
}
function wcSurvivalRankKey(scored) {
    const alivePart = scored.alive ? 1000000 : 0;
    const roundsPart = Math.max(0, Math.min(5, scored.survivedRounds)) * 10000;
    const missIdx = scored.firstMissMatchId
        ? wcKnockoutMatchIds_1.WC_BRACKET_PREDICT_MATCH_IDS.indexOf(scored.firstMissMatchId)
        : wcKnockoutMatchIds_1.WC_BRACKET_PREDICT_MATCH_IDS.length;
    const missPart = missIdx >= 0 ? missIdx : 0;
    return alivePart + roundsPart + missPart;
}
//# sourceMappingURL=scoreWcBracketSurvival.js.map