"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.footballWinnerCorrect = footballWinnerCorrect;
exports.calcPointsFootball = calcPointsFootball;
const judgeWin_1 = require("./judgeWin");
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
 * 的中時: 勝者4 + HOME得点2 + AWAY得点2 + 得失点差2（各完全一致のみ・ボーナスなし）
 * 基本点: 0 / 4 / 6 / 8 / 10 など
 *
 * diffPoints / totalPoints は basketball 系 API との互換用:
 * - diffPoints = HOME得点一致分 (0–2)
 * - totalPoints = AWAY得点一致分 (0–2)
 * - goalDiffPoints = 得失点差一致分 (0–2)
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
            goalDiffPoints: 0,
            homeMatch: false,
            awayMatch: false,
            goalDiffMatch: false,
            exactMatch: false,
            diffError: null,
            totalError: null,
        };
    }
    const line = (0, settlementGame_1.getFootballLineScore)(g);
    const lh = line.home;
    const la = line.away;
    const winPoints = 4;
    const homeMatch = predHome === lh;
    const awayMatch = predAway === la;
    const homePoints = homeMatch ? 2 : 0;
    const awayPoints = awayMatch ? 2 : 0;
    const predDiff = predHome - predAway;
    const lineDiff = lh - la;
    const goalDiffMatch = predDiff === lineDiff;
    const goalDiffPoints = goalDiffMatch ? 2 : 0;
    const exactMatch = homeMatch && awayMatch;
    const diffPoints = homePoints;
    const totalPoints = awayPoints;
    const basePoints = winPoints + homePoints + awayPoints + goalDiffPoints;
    const diffError = Math.abs(predDiff - lineDiff);
    const totalError = Math.abs(predHome - lh) + Math.abs(predAway - la);
    return {
        points: basePoints,
        basePoints,
        winnerCorrect: true,
        winPoints,
        diffPoints,
        totalPoints,
        goalDiffPoints,
        homeMatch,
        awayMatch,
        goalDiffMatch,
        exactMatch,
        diffError,
        totalError,
    };
}
//# sourceMappingURL=footballTotalScore.js.map