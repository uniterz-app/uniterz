"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.footballWinnerCorrect = footballWinnerCorrect;
exports.calcPointsFootball = calcPointsFootball;
const judgeWin_1 = require("./judgeWin");
const footballPaceCategory_1 = require("./footballPaceCategory");
const settlementGame_1 = require("./settlementGame");
/** ノックアウトは進出側／それ以外はラインスコアで勝敗 */
function footballWinnerCorrect(pred, g) {
    const line = (0, settlementGame_1.getFootballLineScore)(g);
    if (g.knockout &&
        g.advancingTeamId &&
        g.homeTeamId &&
        g.awayTeamId) {
        if (pred.winner === "draw")
            return false;
        const advancedHome = g.advancingTeamId === g.homeTeamId;
        const actualWinner = advancedHome ? "home" : "away";
        return pred.winner === actualWinner;
    }
    return (0, judgeWin_1.judgeWin)(pred, line);
}
/**
 * サッカー総合得点（1試合あたり最大10）
 * 勝者ゲート: 外れなら 0
 * 的中時: 勝者4 + テンポ2 + 得失点差2 + 完全一致2
 */
function calcPointsFootball(prediction, g) {
    const predHome = prediction.score.home;
    const predAway = prediction.score.away;
    const winnerCorrect = footballWinnerCorrect(prediction, g);
    if (!winnerCorrect) {
        return {
            points: 0,
            basePoints: 0,
            winnerCorrect: false,
            winPoints: 0,
            diffPoints: 0,
            totalPoints: 0,
            paceMatch: false,
            diffMatch: false,
            exactMatch: false,
            diffError: null,
            totalError: null,
        };
    }
    const line = (0, settlementGame_1.getFootballLineScore)(g);
    const lh = line.home;
    const la = line.away;
    const winPoints = 4;
    const paceMatch = (0, footballPaceCategory_1.footballPaceCategory)(predHome + predAway) === (0, footballPaceCategory_1.footballPaceCategory)(lh + la);
    const pacePoints = paceMatch ? 2 : 0;
    const predDiff = predHome - predAway;
    const lineDiff = lh - la;
    const diffMatch = Math.abs(predDiff) === Math.abs(lineDiff);
    const diffPairPoints = diffMatch ? 2 : 0;
    const exactMatch = predHome === lh && predAway === la;
    const exactPoints = exactMatch ? 2 : 0;
    const diffPoints = pacePoints + diffPairPoints;
    const totalPoints = exactPoints;
    const basePoints = winPoints + diffPoints + totalPoints;
    const diffError = Math.abs(predDiff - lineDiff);
    const totalError = Math.abs(predHome - lh) + Math.abs(predAway - la);
    return {
        points: basePoints,
        basePoints,
        winnerCorrect: true,
        winPoints,
        diffPoints,
        totalPoints,
        paceMatch,
        diffMatch,
        exactMatch,
        diffError,
        totalError,
    };
}
//# sourceMappingURL=footballTotalScore.js.map