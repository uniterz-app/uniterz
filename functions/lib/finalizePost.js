"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.finalizePost = finalizePost;
const firestore_1 = require("firebase-admin/firestore");
const updateUserStatsV2_1 = require("./updateUserStatsV2");
const buildUserStatsWindowCache_1 = require("./stats/buildUserStatsWindowCache");
const computePostSettlement_1 = require("./computePostSettlement");
async function finalizePost({ postDoc, game, market, hadUpsetGame, after, batch, userUpdateTasks, streakResultMap, }) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
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
            homeTeamId: game.homeTeamId,
            awayTeamId: game.awayTeamId,
            regulationEtScore: game.regulationEtScore,
            advancingTeamId: game.advancingTeamId,
            knockout: game.knockout,
            countsForRanking: game.countsForRanking,
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
        seasonPhase: (_a = game === null || game === void 0 ? void 0 : game.seasonPhase) !== null && _a !== void 0 ? _a : null,
        seasonRound: (_b = game === null || game === void 0 ? void 0 : game.seasonRound) !== null && _b !== void 0 ? _b : null,
        wcStage: (_c = game === null || game === void 0 ? void 0 : game.wcStage) !== null && _c !== void 0 ? _c : null,
    });
    const uid = p.authorUid;
    userUpdateTasks.push((0, updateUserStatsV2_1.applyPostToUserStatsV2)({
        uid,
        postId: postDoc.id,
        createdAt: p.createdAt,
        startAt: (_e = (_d = after.startAtJst) !== null && _d !== void 0 ? _d : after.startAt) !== null && _e !== void 0 ? _e : p.createdAt,
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
        seasonPhase: (_f = game === null || game === void 0 ? void 0 : game.seasonPhase) !== null && _f !== void 0 ? _f : null,
        seasonRound: (_g = game === null || game === void 0 ? void 0 : game.seasonRound) !== null && _g !== void 0 ? _g : null,
        wcStage: (_h = game === null || game === void 0 ? void 0 : game.wcStage) !== null && _h !== void 0 ? _h : null,
        homeTeamId: (_l = (_j = game.homeTeamId) !== null && _j !== void 0 ? _j : (_k = p.home) === null || _k === void 0 ? void 0 : _k.teamId) !== null && _l !== void 0 ? _l : null,
        awayTeamId: (_p = (_m = game.awayTeamId) !== null && _m !== void 0 ? _m : (_o = p.away) === null || _o === void 0 ? void 0 : _o.teamId) !== null && _p !== void 0 ? _p : null,
    }).then(() => (0, buildUserStatsWindowCache_1.buildWindowCacheForUser)(uid)));
}
//# sourceMappingURL=finalizePost.js.map