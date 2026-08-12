"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.finalizePost = finalizePost;
const firestore_1 = require("firebase-admin/firestore");
const updateUserStatsV2_1 = require("./updateUserStatsV2");
const computePostSettlement_1 = require("./computePostSettlement");
const isPickupGame_1 = require("./rankings/isPickupGame");
async function finalizePost({ postDoc, game, market, hadUpsetGame, after, batch, userUpdateTasks, streakResultMap, }) {
    var _a, _b, _c;
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
            leadingScorers: game.leadingScorers,
        },
        market,
        hadUpsetGame,
        streakResultMap,
    });
    const countsForRanking = (game === null || game === void 0 ? void 0 : game.countsForRanking) !== false;
    const isPickup = (0, isPickupGame_1.isNbaPickupGame)(game);
    const now = firestore_1.Timestamp.now();
    const isWc = String((_a = game.league) !== null && _a !== void 0 ? _a : "").toLowerCase() === "wc";
    const matchGoalScorers = [];
    const pkScoreRaw = game === null || game === void 0 ? void 0 : game.pkScore;
    const pkScore = pkScoreRaw &&
        typeof pkScoreRaw === "object" &&
        pkScoreRaw.home != null &&
        pkScoreRaw.away != null
        ? {
            home: Number(pkScoreRaw.home),
            away: Number(pkScoreRaw.away),
        }
        : null;
    const pkScorePatch = pkScore &&
        Number.isFinite(pkScore.home) &&
        Number.isFinite(pkScore.away)
        ? { pkScore }
        : {};
    batch.update(postDoc.ref, Object.assign(Object.assign(Object.assign({ result: final }, (isWc ? { matchGoalScorers } : {})), pkScorePatch), { marketMeta: {
            majoritySide: market.majoritySide,
            majorityRatio: market.majorityRatio,
        }, stats: {
            isWin: result.isWin,
            scoreError: result.scoreError,
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
            countedForPickup: countsForRanking && isPickup,
            pointsV3: totalPoints,
            pointsV3Detail: {
                basePoints: baseScore.basePoints,
                winnerCorrect: baseScore.winnerCorrect,
                winPoints: baseScore.winPoints,
                diffPoints: baseScore.diffPoints,
                totalPoints: baseScore.totalPoints,
                goalDiffPoints: "goalDiffPoints" in baseScore
                    ? baseScore.goalDiffPoints
                    : 0,
                upsetBonus,
                streakBonus,
                goalScorerBonus,
                activeWinStreak,
                diffError: baseScore.diffError,
                totalError: baseScore.totalError,
                exactMatch: Boolean(baseScore.exactMatch),
            },
        }, status: "final", settledAt: now, updatedAt: firestore_1.FieldValue.serverTimestamp(), seasonPhase: (_b = game === null || game === void 0 ? void 0 : game.seasonPhase) !== null && _b !== void 0 ? _b : null, seasonRound: (_c = game === null || game === void 0 ? void 0 : game.seasonRound) !== null && _c !== void 0 ? _c : null, wcStage: null }));
    const uid = p.authorUid;
    const exactHit = Boolean(baseScore.exactMatch);
    userUpdateTasks.push((async () => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
        await (0, updateUserStatsV2_1.applyPostToUserStatsV2)({
            uid,
            postId: postDoc.id,
            createdAt: p.createdAt,
            startAt: (_b = (_a = after.startAtJst) !== null && _a !== void 0 ? _a : after.startAt) !== null && _b !== void 0 ? _b : p.createdAt,
            league: game.league,
            isWin: result.isWin,
            scoreError: result.scoreError,
            hadUpsetGame,
            upsetHit: result.upsetHit,
            upsetPoints,
            upsetBonus,
            streakBonus,
            goalScorerBonus,
            goalScorerHit: goalScorerBonus > 0,
            exactHit,
            points: totalPoints,
            countsForRanking,
            isPickup,
            seasonPhase: (_c = game === null || game === void 0 ? void 0 : game.seasonPhase) !== null && _c !== void 0 ? _c : null,
            wcStage: null,
            homeTeamId: (_f = (_d = game.homeTeamId) !== null && _d !== void 0 ? _d : (_e = p.home) === null || _e === void 0 ? void 0 : _e.teamId) !== null && _f !== void 0 ? _f : null,
            awayTeamId: (_j = (_g = game.awayTeamId) !== null && _g !== void 0 ? _g : (_h = p.away) === null || _h === void 0 ? void 0 : _h.teamId) !== null && _j !== void 0 ? _j : null,
        });
        const { syncProSkinProgressOnNbaSettle } = await Promise.resolve().then(() => __importStar(require("./profile/syncProSkinProgressOnNbaSettle")));
        await syncProSkinProgressOnNbaSettle({
            uid,
            postId: postDoc.id,
            startAt: (_l = (_k = after.startAtJst) !== null && _k !== void 0 ? _k : after.startAt) !== null && _l !== void 0 ? _l : p.createdAt,
            league: game.league,
            countsForRanking,
            seasonPhase: (_m = game === null || game === void 0 ? void 0 : game.seasonPhase) !== null && _m !== void 0 ? _m : null,
            exactHit,
            activeWinStreak,
        });
        try {
            const { syncUserCareerOnNbaSettle } = await Promise.resolve().then(() => __importStar(require("./profile/syncUserCareer")));
            const streakInfo = streakResultMap.get(uid);
            await syncUserCareerOnNbaSettle({
                uid,
                startAt: (_p = (_o = after.startAtJst) !== null && _o !== void 0 ? _o : after.startAt) !== null && _p !== void 0 ? _p : p.createdAt,
                league: game.league,
                countsForRanking,
                seasonPhase: (_q = game === null || game === void 0 ? void 0 : game.seasonPhase) !== null && _q !== void 0 ? _q : null,
                isWin: result.isWin,
                exactHit,
                activeWinStreak,
                maxWinStreak: streakInfo === null || streakInfo === void 0 ? void 0 : streakInfo.maxWinStreak,
            });
        }
        catch (careerErr) {
            console.warn("[finalizePost] user_career settle sync failed", careerErr);
        }
    })());
}
//# sourceMappingURL=finalizePost.js.map