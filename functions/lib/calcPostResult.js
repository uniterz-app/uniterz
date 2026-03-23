"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcPostResult = calcPostResult;
const judgeWin_1 = require("./judgeWin");
const calcScorePrecision_1 = require("./calcScorePrecision");
function calcScoreError(pred, real) {
    return Math.abs(pred.home - real.home) + Math.abs(pred.away - real.away);
}
function calcPostResult({ prediction, final, market, hadUpsetGame, league, }) {
    const isWin = (0, judgeWin_1.judgeWin)(prediction, final);
    const marketMajority = market.majoritySide;
    const isMajorityPick = prediction.winner === marketMajority;
    const scoreError = calcScoreError(prediction.score, final);
    const { homePt, awayPt, diffPt, totalPt } = (0, calcScorePrecision_1.calcScorePrecision)({
        predictedHome: prediction.score.home,
        predictedAway: prediction.score.away,
        actualHome: final.home,
        actualAway: final.away,
        league: league !== null && league !== void 0 ? league : "bj",
    });
    const pickSide = prediction.winner;
    const upsetHit = hadUpsetGame &&
        isWin &&
        pickSide !== "draw" &&
        marketMajority !== "draw" &&
        pickSide !== marketMajority;
    return {
        isWin,
        scoreError,
        scorePrecision: totalPt,
        scorePrecisionDetail: { homePt, awayPt, diffPt },
        marketMajority,
        isMajorityPick,
        upsetHit,
    };
}
//# sourceMappingURL=calcPostResult.js.map