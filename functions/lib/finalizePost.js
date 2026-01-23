"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.finalizePost = finalizePost;
const firestore_1 = require("firebase-admin/firestore");
const updateUserStatsV2_1 = require("./updateUserStatsV2");
const calcPostResult_1 = require("./calcPostResult");
async function finalizePost({ postDoc, game, market, hadUpsetGame, after, batch, userUpdateTasks, }) {
    var _a, _b;
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
    const now = firestore_1.Timestamp.now();
    batch.update(postDoc.ref, {
        result: final,
        // ★ 追加ここ
        marketMeta: {
            majoritySide: market.majoritySide,
            majorityRatio: market.majorityRatio,
        },
        stats: {
            isWin: result.isWin,
            scoreError: result.scoreError,
            brier: result.brier,
            scorePrecision: result.scorePrecision,
            scorePrecisionDetail: result.scorePrecisionDetail,
            marketCount: market.total,
            marketMajority: result.marketMajority,
            isMajorityPick: result.isMajorityPick,
            hadUpsetGame,
            upsetHit: result.upsetHit,
        },
        status: "final",
        settledAt: now,
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    });
    userUpdateTasks.push((0, updateUserStatsV2_1.applyPostToUserStatsV2)({
        uid: p.authorUid,
        postId: postDoc.id,
        createdAt: p.createdAt,
        startAt: (_b = (_a = after.startAtJst) !== null && _a !== void 0 ? _a : after.startAt) !== null && _b !== void 0 ? _b : p.createdAt,
        league: game.league,
        isWin: result.isWin,
        scoreError: result.scoreError,
        brier: result.brier,
        scorePrecision: result.scorePrecision,
        confidence: result.confidence,
        calibrationError: result.calibrationError,
        hadUpsetGame,
    }));
}
//# sourceMappingURL=finalizePost.js.map