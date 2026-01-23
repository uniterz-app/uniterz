"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcPostResult = calcPostResult;
const judgeWin_1 = require("./judgeWin");
const calcScorePrecision_1 = require("./calcScorePrecision");
function calcBrier(isWin, confidence) {
    const p = Math.min(0.999, Math.max(0.001, confidence / 100));
    const y = isWin ? 1 : 0;
    return Math.round((p - y) * (p - y) * 10000) / 10000;
}
function calcScoreError(pred, real) {
    return Math.abs(pred.home - real.home) + Math.abs(pred.away - real.away);
}
function calcPostResult({ prediction, final, market, hadUpsetGame, league, }) {
    const isWin = (0, judgeWin_1.judgeWin)(prediction, final);
    const marketMajority = market.majoritySide;
    const isMajorityPick = prediction.winner === marketMajority;
    const scoreError = calcScoreError(prediction.score, final);
    const conf = Math.min(99, Math.max(1, prediction.confidence));
    const brier = calcBrier(isWin, conf);
    const calibrationError = Math.abs(conf / 100 - (isWin ? 1 : 0));
    const { homePt, awayPt, diffPt, totalPt } = (0, calcScorePrecision_1.calcScorePrecision)({
        predictedHome: prediction.score.home,
        predictedAway: prediction.score.away,
        actualHome: final.home,
        actualAway: final.away,
        league: league !== null && league !== void 0 ? league : "bj",
    });
    const upsetHit = hadUpsetGame && isWin;
    return {
        isWin,
        scoreError,
        brier,
        calibrationError,
        confidence: conf,
        scorePrecision: totalPt,
        scorePrecisionDetail: { homePt, awayPt, diffPt },
        marketMajority,
        isMajorityPick,
        upsetHit,
    };
}
//# sourceMappingURL=calcPostResult.js.map