"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computePostSettlement = computePostSettlement;
const calcPostResult_1 = require("./calcPostResult");
const calcUpsetPoints_1 = require("./calcUpsetPoints");
const calcStreakBonus_1 = require("./calcStreakBonus");
const footballTotalScore_1 = require("./footballTotalScore");
const settlementGame_1 = require("./settlementGame");
const wcGoalScorerBonus_1 = require("./wcGoalScorerBonus");
function lerpByRange(value, min, max, start, end) {
    if (value <= min)
        return start;
    if (value >= max)
        return end;
    const t = (value - min) / (max - min);
    return start + (end - start) * t;
}
function calcDiffPointsGradient(diffError) {
    if (diffError <= 0)
        return 4;
    if (diffError <= 3)
        return lerpByRange(diffError, 0, 3, 4, 3);
    if (diffError <= 6)
        return lerpByRange(diffError, 3, 6, 3, 2);
    if (diffError <= 10)
        return lerpByRange(diffError, 6, 10, 2, 1);
    if (diffError <= 14)
        return lerpByRange(diffError, 10, 14, 1, 0);
    return 0;
}
function calcPointsV3({ predHome, predAway, finalHome, finalAway, }) {
    const finalDiff = finalHome - finalAway;
    const predDiff = predHome - predAway;
    const winnerCorrect = (finalDiff > 0 && predDiff > 0) || (finalDiff < 0 && predDiff < 0);
    const diffError = Math.abs(finalDiff - predDiff);
    const totalError = Math.abs(finalHome + finalAway - (predHome + predAway));
    if (!winnerCorrect) {
        return {
            points: 0,
            basePoints: 0,
            winnerCorrect: false,
            winPoints: 0,
            diffPoints: 0,
            totalPoints: 0,
            diffError,
            totalError,
        };
    }
    const winPoints = 4;
    const diffPoints = calcDiffPointsGradient(diffError);
    let totalPoints = 0;
    if (totalError <= 3)
        totalPoints = 2;
    else if (totalError <= 7)
        totalPoints = 1;
    const basePoints = winPoints + diffPoints + totalPoints;
    return {
        points: basePoints,
        basePoints,
        winnerCorrect: true,
        winPoints,
        diffPoints,
        totalPoints,
        diffError,
        totalError,
    };
}
/**
 * finalizePost と同じ inputs で pointsV3（totalPoints）などを算出。
 * 分布集計では settled 済み投稿も含めて呼ぶ。
 */
function computePostSettlement({ p, game, market, hadUpsetGame, streakResultMap, }) {
    var _a, _b, _c, _d, _e, _f, _g;
    const final = { home: game.homeScore, away: game.awayScore };
    const settlementGame = {
        homeScore: game.homeScore,
        awayScore: game.awayScore,
        league: game.league,
        homeTeamId: game.homeTeamId,
        awayTeamId: game.awayTeamId,
        regulationEtScore: game.regulationEtScore,
        advancingTeamId: game.advancingTeamId,
        knockout: game.knockout,
    };
    const result = (0, calcPostResult_1.calcPostResult)({
        prediction: p.prediction,
        final,
        market,
        hadUpsetGame,
        league: game.league,
        settlementGame,
    });
    const upsetPoints = result.upsetHit
        ? (0, calcUpsetPoints_1.calcUpsetPoints)(market.majorityRatio)
        : 0;
    const upsetBonus = result.upsetHit ? 2 : 0;
    const predHome = (_b = (_a = p.prediction) === null || _a === void 0 ? void 0 : _a.score) === null || _b === void 0 ? void 0 : _b.home;
    const predAway = (_d = (_c = p.prediction) === null || _c === void 0 ? void 0 : _c.score) === null || _d === void 0 ? void 0 : _d.away;
    const canScore = Number.isFinite(predHome) && Number.isFinite(predAway);
    const sport = (0, settlementGame_1.leagueToSport)(game.league);
    const baseScore = canScore
        ? sport === "football"
            ? (0, footballTotalScore_1.calcPointsFootball)(p.prediction, settlementGame)
            : calcPointsV3({
                predHome,
                predAway,
                finalHome: final.home,
                finalAway: final.away,
            })
        : {
            points: 0,
            basePoints: 0,
            winnerCorrect: false,
            winPoints: 0,
            diffPoints: 0,
            totalPoints: 0,
            diffError: null,
            totalError: null,
        };
    const streakInfo = p.authorUid ? streakResultMap.get(p.authorUid) : undefined;
    const activeWinStreak = (_e = streakInfo === null || streakInfo === void 0 ? void 0 : streakInfo.activeWinStreak) !== null && _e !== void 0 ? _e : (typeof ((_g = (_f = p.stats) === null || _f === void 0 ? void 0 : _f.pointsV3Detail) === null || _g === void 0 ? void 0 : _g.activeWinStreak) === "number"
        ? p.stats.pointsV3Detail.activeWinStreak
        : 0);
    const streakBonus = (0, calcStreakBonus_1.calcStreakBonus)(activeWinStreak);
    const goalScorerBonus = (0, wcGoalScorerBonus_1.calcWcGoalScorerBonus)(game.league, p.prediction, game.goalScorers, {
        homeTeamId: game.homeTeamId,
        awayTeamId: game.awayTeamId,
    });
    const totalPoints = baseScore.basePoints + upsetBonus + streakBonus + goalScorerBonus;
    return {
        totalPoints,
        result,
        baseScore,
        upsetPoints,
        upsetBonus,
        streakBonus,
        goalScorerBonus,
        activeWinStreak,
    };
}
//# sourceMappingURL=computePostSettlement.js.map