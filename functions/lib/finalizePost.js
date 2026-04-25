"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.finalizePost = finalizePost;
const firestore_1 = require("firebase-admin/firestore");
const updateUserStatsV2_1 = require("./updateUserStatsV2");
const buildUserStatsWindowCache_1 = require("./stats/buildUserStatsWindowCache");
const computePostSettlement_1 = require("./computePostSettlement");
async function finalizePost({ postDoc, game, market, hadUpsetGame, after, batch, userUpdateTasks, streakResultMap, }) {
    var _a, _b, _c, _d;
    const p = postDoc.data();
    if (p.settledAt)
        return;
    const final = { home: game.homeScore, away: game.awayScore };
    const { totalPoints, result, baseScore, upsetPoints, upsetBonus, streakBonus, activeWinStreak, } = (0, computePostSettlement_1.computePostSettlement)({
        p,
        game: {
            homeScore: final.home,
            awayScore: final.away,
            league: game.league,
        },
        market,
        hadUpsetGame,
        streakResultMap,
    });
    const countsForRanking = (game === null || game === void 0 ? void 0 : game.countsForRanking) !== false;
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
        startAt: (_b = (_a = after.startAtJst) !== null && _a !== void 0 ? _a : after.startAt) !== null && _b !== void 0 ? _b : p.createdAt,
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
        seasonPhase: (_c = game === null || game === void 0 ? void 0 : game.seasonPhase) !== null && _c !== void 0 ? _c : null,
        seasonRound: (_d = game === null || game === void 0 ? void 0 : game.seasonRound) !== null && _d !== void 0 ? _d : null,
    }).then(() => (0, buildUserStatsWindowCache_1.buildWindowCacheForUser)(uid)));
}
//# sourceMappingURL=finalizePost.js.map