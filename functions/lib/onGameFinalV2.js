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
const aggregateGamePointsDistribution_1 = require("./aggregateGamePointsDistribution");
const updateUserStreak_1 = require("./updateUserStreak");
const updateTeamStats_1 = require("./updateTeamStats");
const updateTeamSeasonRecord_1 = require("./updateTeamSeasonRecord");
const teamStandingsSeasonPhase_1 = require("./teamStandingsSeasonPhase");
const db = () => (0, firestore_2.getFirestore)();
const MIN_MARKET = 10;
const UPSET_MARKET_RATIO = 0.6;
const UPSET_WIN_DIFF = 10;
exports.onGameFinalV2 = (0, firestore_1.onDocumentWritten)({
    document: "games/{gameId}",
    region: "asia-northeast1",
}, async (event) => {
    var _a, _b, _c, _d;
    const firestore = db();
    const before = (_b = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before) === null || _b === void 0 ? void 0 : _b.data();
    const after = (_d = (_c = event.data) === null || _c === void 0 ? void 0 : _c.after) === null || _d === void 0 ? void 0 : _d.data();
    if (!after)
        return;
    const gameId = event.params.gameId;
    const becameFinal = !(before === null || before === void 0 ? void 0 : before.final) && !!(after === null || after === void 0 ? void 0 : after.final);
    if (!becameFinal)
        return;
    /* ===== ① context 取得 ===== */
    const ctx = await (0, fetchGameContext_1.fetchGameContext)({
        db: firestore,
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
    let streakResultMap = new Map();
    if (becameFinal) {
        streakResultMap = await (0, updateUserStreak_1.updateUserStreak)({
            db: firestore,
            gameId,
            final: { home: game.homeScore, away: game.awayScore },
        });
        if ((0, teamStandingsSeasonPhase_1.countsTowardRegularSeasonTeamStats)(game.seasonPhase)) {
            await (0, updateTeamSeasonRecord_1.updateTeamSeasonRecord)({
                db: firestore,
                league: game.league,
                homeTeamId: game.homeTeamId,
                awayTeamId: game.awayTeamId,
                homeScore: game.homeScore,
                awayScore: game.awayScore,
                target: "regular",
            });
            await (0, updateTeamStats_1.updateTeamStats)({
                db: firestore,
                game: Object.assign(Object.assign({}, game), { homeRank,
                    awayRank }),
                homeConference,
                awayConference,
                homeWins,
                awayWins,
                target: "regular",
            });
        }
        if ((0, teamStandingsSeasonPhase_1.countsTowardPlayoffTeamStats)(game.seasonPhase)) {
            await (0, updateTeamSeasonRecord_1.updateTeamSeasonRecord)({
                db: firestore,
                league: game.league,
                homeTeamId: game.homeTeamId,
                awayTeamId: game.awayTeamId,
                homeScore: game.homeScore,
                awayScore: game.awayScore,
                target: "playoffs",
            });
            await (0, updateTeamStats_1.updateTeamStats)({
                db: firestore,
                game: Object.assign(Object.assign({}, game), { homeRank,
                    awayRank }),
                homeConference,
                awayConference,
                homeWins,
                awayWins,
                target: "playoffs",
            });
        }
    }
    /* ===== ③ market / upset ===== */
    let hadUpsetGame = false;
    const market = (0, marketCalculator_1.marketCalculator)(picks);
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
    /* ===== ④ finalize posts ===== */
    const batch = firestore.batch();
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
            streakResultMap,
        });
    }
    const pointsDistribution = (0, aggregateGamePointsDistribution_1.aggregateGamePointsDistributionFromPostsSnap)({
        postsSnap,
        game: {
            homeScore: game.homeScore,
            awayScore: game.awayScore,
            league: game.league,
        },
        market,
        hadUpsetGame,
        streakResultMap,
    });
    await batch.commit();
    await Promise.all(userUpdateTasks);
    /* ===== ⑤ finalize game ===== */
    const gamePatch = {
        market: {
            homeCount: market.homeCount,
            awayCount: market.awayCount,
            drawCount: market.drawCount,
            total: market.total,
            homeRate: market.homeRate,
            awayRate: market.awayRate,
            majority: market.majoritySide,
            majorityRatio: market.majorityRatio,
        },
        pointsDistribution: Object.assign(Object.assign({}, pointsDistribution), { updatedAtMillis: Date.now() }),
        "game.status": "final",
        "game.finalScore": {
            home: game.homeScore,
            away: game.awayScore,
        },
        resultComputedAtV2: firestore_2.FieldValue.serverTimestamp(),
    };
    if (upset.isUpsetGame && upset.meta) {
        gamePatch.upsetMeta = Object.assign({ homeRank,
            awayRank,
            homeWins,
            awayWins }, upset.meta);
    }
    await firestore.doc(`games/${gameId}`).set(gamePatch, { merge: true });
    if (becameFinal) {
        await firestore.doc("trend_jobs/users").set({
            needsRebuild: true,
            requestedAt: firestore_2.FieldValue.serverTimestamp(),
            gameId,
        }, { merge: true });
    }
});
//# sourceMappingURL=onGameFinalV2.js.map