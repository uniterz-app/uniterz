"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.finalizePost = finalizePost;
const firestore_1 = require("firebase-admin/firestore");
const updateUserStatsV2_1 = require("./updateUserStatsV2");
const buildUserStatsWindowCache_1 = require("./stats/buildUserStatsWindowCache");
const calcPostResult_1 = require("./calcPostResult");
const calcUpsetPoints_1 = require("./calcUpsetPoints");
const calcStreakBonus_1 = require("./calcStreakBonus");
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
    const totalError = Math.abs((finalHome + finalAway) - (predHome + predAway));
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
    const basePoints = winPoints + diffPoints + totalPoints; // max 10
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
async function finalizePost({ postDoc, game, market, hadUpsetGame, after, batch, userUpdateTasks, streakResultMap, }) {
    var _a, _b, _c, _d, _e, _f, _g;
    const p = postDoc.data();
    if (p.settledAt)
        return;
    const final = { home: game.homeScore, away: game.awayScore };
    const result = (0, calcPostResult_1.calcPostResult)({
        prediction: p.prediction,
        final,
        market,
        hadUpsetGame,
        league: game.league,
    });
    // 従来の upset 指標
    const upsetPoints = result.upsetHit
        ? (0, calcUpsetPoints_1.calcUpsetPoints)(market.majorityRatio)
        : 0;
    // 総合得点用ボーナス
    const upsetBonus = result.upsetHit ? 2 : 0;
    const predHome = (_b = (_a = p.prediction) === null || _a === void 0 ? void 0 : _a.score) === null || _b === void 0 ? void 0 : _b.home;
    const predAway = (_d = (_c = p.prediction) === null || _c === void 0 ? void 0 : _c.score) === null || _d === void 0 ? void 0 : _d.away;
    const canScore = Number.isFinite(predHome) && Number.isFinite(predAway);
    const baseScore = canScore
        ? calcPointsV3({
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
    const activeWinStreak = (_e = streakInfo === null || streakInfo === void 0 ? void 0 : streakInfo.activeWinStreak) !== null && _e !== void 0 ? _e : 0;
    const streakBonus = (0, calcStreakBonus_1.calcStreakBonus)(activeWinStreak);
    const countsForRanking = (game === null || game === void 0 ? void 0 : game.countsForRanking) !== false;
    const totalPoints = baseScore.basePoints + upsetBonus + streakBonus;
    const now = firestore_1.Timestamp.now();
    batch.update(postDoc.ref, {
        result: final,
        marketMeta: {
            majoritySide: market.majoritySide,
            majorityRatio: market.majorityRatio,
        },
        stats: {
            isWin: result.isWin,
            scoreError: result.scoreError,
            scorePrecision: result.scorePrecision,
            scorePrecisionDetail: result.scorePrecisionDetail,
            marketCount: market.total,
            marketMajority: result.marketMajority,
            isMajorityPick: result.isMajorityPick,
            hadUpsetGame,
            upsetHit: result.upsetHit,
            upsetPoints,
            upsetBonus,
            streakBonus,
            countedForRanking: countsForRanking,
            pointsV3: totalPoints,
            pointsV3Detail: {
                basePoints: baseScore.basePoints,
                winnerCorrect: baseScore.winnerCorrect,
                winPoints: baseScore.winPoints,
                diffPoints: baseScore.diffPoints,
                totalPoints: baseScore.totalPoints,
                upsetBonus,
                streakBonus,
                activeWinStreak,
                diffError: baseScore.diffError,
                totalError: baseScore.totalError,
            },
        },
        status: "final",
        settledAt: now,
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    });
    const uid = p.authorUid;
    userUpdateTasks.push((0, updateUserStatsV2_1.applyPostToUserStatsV2)({
        uid,
        postId: postDoc.id,
        createdAt: p.createdAt,
        startAt: (_g = (_f = after.startAtJst) !== null && _f !== void 0 ? _f : after.startAt) !== null && _g !== void 0 ? _g : p.createdAt,
        league: game.league,
        isWin: result.isWin,
        scoreError: result.scoreError,
        scorePrecision: result.scorePrecision,
        hadUpsetGame,
        upsetHit: result.upsetHit,
        upsetPoints,
        upsetBonus,
        streakBonus,
        points: totalPoints,
        countsForRanking,
    }).then(() => (0, buildUserStatsWindowCache_1.buildWindowCacheForUser)(uid)));
}
//# sourceMappingURL=finalizePost.js.map