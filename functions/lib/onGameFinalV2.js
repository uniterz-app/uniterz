"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onGameFinalV2 = void 0;
// functions/src/onGameFinalV2.ts
const firestore_1 = require("firebase-functions/v2/firestore");
const firestore_2 = require("firebase-admin/firestore");
const fetchGameContext_1 = require("./fetchGameContext");
const marketCalculator_1 = require("./marketCalculator");
const upsetJudge_1 = require("./upsetJudge");
const finalizePost_1 = require("./finalizePost");
const updateUserStreak_1 = require("./updateUserStreak");
const updateTeamStats_1 = require("./updateTeamStats");
const db = () => (0, firestore_2.getFirestore)();
const MIN_MARKET = 10;
const UPSET_MARKET_RATIO = 0.7;
const UPSET_WIN_DIFF = 10;
exports.onGameFinalV2 = (0, firestore_1.onDocumentWritten)({
    document: "games/{gameId}",
    region: "asia-northeast1",
}, async (event) => {
    var _a, _b, _c, _d;
    const before = (_b = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before) === null || _b === void 0 ? void 0 : _b.data();
    const after = (_d = (_c = event.data) === null || _c === void 0 ? void 0 : _c.after) === null || _d === void 0 ? void 0 : _d.data();
    if (!after)
        return;
    const gameId = event.params.gameId;
    const becameFinal = !(before === null || before === void 0 ? void 0 : before.final) && !!(after === null || after === void 0 ? void 0 : after.final);
    const scoreChanged = (before === null || before === void 0 ? void 0 : before.homeScore) !== (after === null || after === void 0 ? void 0 : after.homeScore) ||
        (before === null || before === void 0 ? void 0 : before.awayScore) !== (after === null || after === void 0 ? void 0 : after.awayScore);
    if (!becameFinal && !scoreChanged)
        return;
    /* ===== ① context 取得 ===== */
    const ctx = await (0, fetchGameContext_1.fetchGameContext)({
        db: db(),
        gameId,
        after,
    });
    if (!ctx)
        return;
    const { game, postsSnap, picks, homeConference, awayConference, homeRank, awayRank, homeWins, awayWins, } = ctx;
    if (!game.final)
        return;
    if (game.homeScore == null || game.awayScore == null)
        return;
    /* ===== ② streak / team stats ===== */
    if (becameFinal) {
        await (0, updateUserStreak_1.updateUserStreak)({
            db: db(),
            gameId,
            final: { home: game.homeScore, away: game.awayScore },
        });
        await (0, updateTeamStats_1.updateTeamStats)({
            db: db(),
            game: Object.assign(Object.assign({}, game), { homeRank,
                awayRank }),
            homeConference,
            awayConference,
            homeWins,
            awayWins,
        });
    }
    /* ===== ③ market / upset ===== */
    let hadUpsetGame = false;
    const market = (0, marketCalculator_1.marketCalculator)(picks);
    await db().doc(`games/${gameId}`).set({
        market: {
            homeCount: market.homeCount,
            awayCount: market.awayCount,
            drawCount: market.drawCount,
            total: market.total,
            homeRate: market.homeRate,
            awayRate: market.awayRate,
            majority: market.majoritySide,
        },
    }, { merge: true });
    const winnerSide = game.homeScore > game.awayScore ? "home" : "away";
    const upset = (0, upsetJudge_1.upsetJudge)({
        market: {
            total: market.total,
            majoritySide: market.majoritySide,
            majorityRatio: market.majorityRatio,
        },
        result: { winnerSide },
        teams: { homeWins, awayWins },
        thresholds: {
            minMarket: MIN_MARKET,
            marketRatio: UPSET_MARKET_RATIO,
            winDiff: UPSET_WIN_DIFF,
        },
    });
    hadUpsetGame = upset.isUpsetGame;
    if (upset.isUpsetGame && upset.meta) {
        await db().doc(`games/${gameId}`).set({
            upsetMeta: Object.assign({ homeRank,
                awayRank,
                homeWins,
                awayWins }, upset.meta),
        }, { merge: true });
    }
    /* ===== ④ finalize posts ===== */
    const batch = db().batch();
    const userUpdateTasks = [];
    for (const doc of postsSnap.docs) {
        await (0, finalizePost_1.finalizePost)({
            postDoc: doc,
            game,
            market,
            hadUpsetGame,
            after,
            batch,
            userUpdateTasks,
        });
    }
    await batch.commit();
    await Promise.all(userUpdateTasks);
    /* ===== ⑤ finalize game ===== */
    if (becameFinal) {
        await db().doc("trend_jobs/users").set({
            needsRebuild: true,
            requestedAt: firestore_2.FieldValue.serverTimestamp(),
            gameId,
        }, { merge: true });
    }
    await db().doc(`games/${gameId}`).set({
        "game.status": "final",
        "game.finalScore": {
            home: game.homeScore,
            away: game.awayScore,
        },
        resultComputedAtV2: firestore_2.FieldValue.serverTimestamp(),
    }, { merge: true });
});
//# sourceMappingURL=onGameFinalV2.js.map