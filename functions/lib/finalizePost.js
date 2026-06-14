"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.finalizePost = finalizePost;
const firestore_1 = require("firebase-admin/firestore");
const updateUserStatsV2_1 = require("./updateUserStatsV2");
const buildUserStatsWindowCache_1 = require("./stats/buildUserStatsWindowCache");
const computePostSettlement_1 = require("./computePostSettlement");
const matchGoalScorersDisplay_1 = require("./wc/matchGoalScorersDisplay");
const resolveWcStage_1 = require("./wc/resolveWcStage");
async function finalizePost({ postDoc, game, market, hadUpsetGame, after, batch, userUpdateTasks, streakResultMap, }) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    const p = postDoc.data();
    if (p.settledAt)
        return;
    const final = { home: game.homeScore, away: game.awayScore };
    const { totalPoints, result, baseScore, upsetPoints, upsetBonus, streakBonus, goalScorerBonus, activeWinStreak, } = (0, computePostSettlement_1.computePostSettlement)({
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
            goalScorers: game.goalScorers,
        },
        market,
        hadUpsetGame,
        streakResultMap,
    });
    const countsForRanking = (game === null || game === void 0 ? void 0 : game.countsForRanking) !== false;
    const resolvedWcStage = (0, resolveWcStage_1.resolveWcStageFromGame)({
        knockout: game === null || game === void 0 ? void 0 : game.knockout,
        roundLabel: game === null || game === void 0 ? void 0 : game.roundLabel,
        wcStage: game === null || game === void 0 ? void 0 : game.wcStage,
    });
    const now = firestore_1.Timestamp.now();
    const isWc = String((_a = game.league) !== null && _a !== void 0 ? _a : "").toLowerCase() === "wc";
    const matchGoalScorers = isWc
        ? (0, matchGoalScorersDisplay_1.buildPostMatchGoalScorersFromGame)(game.goalScorers, game.homeTeamId, game.awayTeamId)
        : [];
    batch.update(postDoc.ref, Object.assign(Object.assign({ result: final }, (isWc ? { matchGoalScorers } : {})), { marketMeta: {
            majoritySide: market.majoritySide,
            majorityRatio: market.majorityRatio,
        }, stats: {
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
            goalScorerBonus,
            exactMatch: Boolean(baseScore.exactMatch),
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
                goalScorerBonus,
                activeWinStreak,
                diffError: baseScore.diffError,
                totalError: baseScore.totalError,
                exactMatch: Boolean(baseScore.exactMatch),
            },
        }, status: "final", settledAt: now, updatedAt: firestore_1.FieldValue.serverTimestamp(), seasonPhase: (_b = game === null || game === void 0 ? void 0 : game.seasonPhase) !== null && _b !== void 0 ? _b : null, seasonRound: (_c = game === null || game === void 0 ? void 0 : game.seasonRound) !== null && _c !== void 0 ? _c : null, wcStage: resolvedWcStage }));
    const uid = p.authorUid;
    userUpdateTasks.push((0, updateUserStatsV2_1.applyPostToUserStatsV2)({
        uid,
        postId: postDoc.id,
        createdAt: p.createdAt,
        startAt: (_e = (_d = after.startAtJst) !== null && _d !== void 0 ? _d : after.startAt) !== null && _e !== void 0 ? _e : p.createdAt,
        league: game.league,
        isWin: result.isWin,
        scoreError: result.scoreError,
        scorePrecision: isWc ? 0 : result.scorePrecision,
        hadUpsetGame,
        upsetHit: result.upsetHit,
        upsetPoints,
        upsetBonus,
        streakBonus,
        goalScorerBonus,
        goalScorerHit: goalScorerBonus > 0,
        exactHit: isWc && Boolean(baseScore.exactMatch),
        points: totalPoints,
        countsForRanking,
        seasonPhase: (_f = game === null || game === void 0 ? void 0 : game.seasonPhase) !== null && _f !== void 0 ? _f : null,
        seasonRound: (_g = game === null || game === void 0 ? void 0 : game.seasonRound) !== null && _g !== void 0 ? _g : null,
        wcStage: resolvedWcStage,
        homeTeamId: (_k = (_h = game.homeTeamId) !== null && _h !== void 0 ? _h : (_j = p.home) === null || _j === void 0 ? void 0 : _j.teamId) !== null && _k !== void 0 ? _k : null,
        awayTeamId: (_o = (_l = game.awayTeamId) !== null && _l !== void 0 ? _l : (_m = p.away) === null || _m === void 0 ? void 0 : _m.teamId) !== null && _o !== void 0 ? _o : null,
    }).then(() => (0, buildUserStatsWindowCache_1.buildWindowCacheForUser)(uid)));
}
//# sourceMappingURL=finalizePost.js.map