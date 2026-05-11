"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcPostResult = calcPostResult;
const calcScorePrecision_1 = require("./calcScorePrecision");
const predictionWin_1 = require("./predictionWin");
const settlementGame_1 = require("./settlementGame");
function calcScoreError(pred, real) {
    return Math.abs(pred.home - real.home) + Math.abs(pred.away - real.away);
}
function calcPostResult({ prediction, final, market, hadUpsetGame, league, settlementGame, }) {
    const gameSlice = settlementGame !== null && settlementGame !== void 0 ? settlementGame : {
        homeScore: final.home,
        awayScore: final.away,
        league,
    };
    const isWin = (0, predictionWin_1.predictionWin)(prediction, gameSlice);
    const marketMajority = market.majoritySide;
    const isMajorityPick = prediction.winner === marketMajority;
    const precisionActual = (0, settlementGame_1.leagueToSport)(league) === "football"
        ? (0, settlementGame_1.getFootballLineScore)(gameSlice)
        : final;
    const scoreError = calcScoreError(prediction.score, precisionActual);
    const { homePt, awayPt, diffPt, totalPt } = (0, calcScorePrecision_1.calcScorePrecision)({
        predictedHome: prediction.score.home,
        predictedAway: prediction.score.away,
        actualHome: precisionActual.home,
        actualAway: precisionActual.away,
        league: league !== null && league !== void 0 ? league : "bj",
    });
    const pickSide = prediction.winner;
    const sport = (0, settlementGame_1.leagueToSport)(league);
    const upsetHit = hadUpsetGame &&
        isWin &&
        pickSide !== marketMajority &&
        (sport === "football" ||
            (pickSide !== "draw" && marketMajority !== "draw"));
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