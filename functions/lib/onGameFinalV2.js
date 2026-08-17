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
const enrichGamePointsTopFromUsers_1 = require("./enrichGamePointsTopFromUsers");
const buildTopScorerMarketEmbed_1 = require("./buildTopScorerMarketEmbed");
const updateUserStreak_1 = require("./updateUserStreak");
const updateTeamStats_1 = require("./updateTeamStats");
const updateTeamSeasonRecord_1 = require("./updateTeamSeasonRecord");
const notifyPushEvents_1 = require("./notifications/notifyPushEvents");
const teamStandingsSeasonPhase_1 = require("./teamStandingsSeasonPhase");
const settlementGame_1 = require("./settlementGame");
const db = () => (0, firestore_2.getFirestore)();
const MIN_MARKET = 10;
const UPSET_MARKET_RATIO = 0.6;
const UPSET_WIN_DIFF = 10;
/** Firestore batch max 500 ops; ~1 update per post, chunk below limit */
const FINALIZE_POSTS_CHUNK_SIZE = 400;
exports.onGameFinalV2 = (0, firestore_1.onDocumentWritten)({
    document: "games/{gameId}",
    region: "asia-northeast1",
    /** 投稿数が多い試合でヒープ不足（signal 6）になりやすいため明示 */
    memory: "1GiB",
    timeoutSeconds: 540,
}, async (event) => {
    var _a, _b, _c, _d, _e, _f, _g;
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
    const settlementGame = {
        homeScore: game.homeScore,
        awayScore: game.awayScore,
        league: game.league,
        homeTeamId: game.homeTeamId,
        awayTeamId: game.awayTeamId,
        regulationEtScore: (_e = game.regulationEtScore) !== null && _e !== void 0 ? _e : null,
        advancingTeamId: (_f = game.advancingTeamId) !== null && _f !== void 0 ? _f : null,
        knockout: game.knockout === true,
        goalScorers: game.goalScorers,
        leadingScorers: game.leadingScorers,
    };
    /* ===== ② streak / team stats ===== */
    let streakResultMap = new Map();
    if (becameFinal) {
        streakResultMap = await (0, updateUserStreak_1.updateUserStreak)({
            db: firestore,
            gameId,
            settlementGame,
            postsSnap,
        });
        const skipTeamSeasonRecord = (0, teamStandingsSeasonPhase_1.isExemptFromTeamSeasonRecord)(game.knockout);
        if (!skipTeamSeasonRecord &&
            (0, teamStandingsSeasonPhase_1.countsTowardRegularSeasonTeamStats)(game.seasonPhase)) {
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
        if (!skipTeamSeasonRecord &&
            (0, teamStandingsSeasonPhase_1.countsTowardPlayoffTeamStats)(game.seasonPhase)) {
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
    const upsetSport = (0, settlementGame_1.leagueToSport)(game.league);
    const actualOutcome = (0, settlementGame_1.resolveActualOutcomeForUpset)(settlementGame, upsetSport);
    const upset = (0, upsetJudge_1.upsetJudge)({
        market: {
            total: market.total,
            majoritySide: market.majoritySide,
            majorityRatio: market.majorityRatio,
        },
        actualOutcome,
        sport: upsetSport === "football" ? "football" : "basketball",
        teams: { homeWins, awayWins },
        thresholds: {
            minMarket: MIN_MARKET,
            marketRatio: UPSET_MARKET_RATIO,
            winDiff: UPSET_WIN_DIFF,
        },
    });
    hadUpsetGame = upset.isUpsetGame;
    /* ===== ④ 得点サマリ先行（同一 posts スナップ・追加 read なし） ===== */
    const { summary: pointsSummaryRaw, settlementByPostId } = (0, aggregateGamePointsDistribution_1.aggregateGamePointsSummaryFromPostsSnap)({
        postsSnap,
        game: settlementGame,
        market,
        hadUpsetGame,
        streakResultMap,
    });
    /** Top10 の表示名 / アバターは users から補完（posts.author が無いため） */
    const pointsSummary = Object.assign(Object.assign({}, pointsSummaryRaw), { top: await (0, enrichGamePointsTopFromUsers_1.enrichGamePointsTopFromUsers)(firestore, pointsSummaryRaw.top) });
    const topScorerMarket = (0, buildTopScorerMarketEmbed_1.buildTopScorerMarketEmbedFromPostsSnap)({
        league: game.league,
        postsSnap,
        leadingScorers: game.leadingScorers,
        topScorerCandidates: after === null || after === void 0 ? void 0 : after.topScorerCandidates,
    });
    /* ===== ⑤ finalize posts（scoreRel を同書き込みで埋め込み・決済は再利用） ===== */
    const postDocs = postsSnap.docs;
    for (let i = 0; i < postDocs.length; i += FINALIZE_POSTS_CHUNK_SIZE) {
        const slice = postDocs.slice(i, i + FINALIZE_POSTS_CHUNK_SIZE);
        const pendingInSlice = slice.filter((d) => !d.data().settledAt);
        if (pendingInSlice.length === 0)
            continue;
        const batch = firestore.batch();
        const userUpdateTasks = [];
        for (const doc of pendingInSlice) {
            const settlement = settlementByPostId.get(doc.id);
            const scoreRel = (0, aggregateGamePointsDistribution_1.resolveScoreRelFromSummary)((_g = settlement === null || settlement === void 0 ? void 0 : settlement.totalPoints) !== null && _g !== void 0 ? _g : 0, pointsSummary);
            await (0, finalizePost_1.finalizePost)({
                postDoc: doc,
                game,
                market,
                hadUpsetGame,
                after,
                batch,
                userUpdateTasks,
                streakResultMap,
                scoreRel,
                settlement,
            });
        }
        await batch.commit();
        await Promise.all(userUpdateTasks);
    }
    /* ===== ⑥ finalize game ===== */
    const gamePatch = Object.assign(Object.assign({ market: {
            homeCount: market.homeCount,
            awayCount: market.awayCount,
            drawCount: market.drawCount,
            total: market.total,
            homeRate: market.homeRate,
            awayRate: market.awayRate,
            majority: market.majoritySide,
            majorityRatio: market.majorityRatio,
        }, pointsSummary: Object.assign(Object.assign({}, pointsSummary), { updatedAtMillis: Date.now() }) }, (topScorerMarket ? { topScorerMarket } : {})), { "game.status": "final", "game.finalScore": {
            home: game.homeScore,
            away: game.awayScore,
        }, resultComputedAtV2: firestore_2.FieldValue.serverTimestamp() });
    if (upset.isUpsetGame && upset.meta) {
        gamePatch.upsetMeta = Object.assign({ homeRank,
            awayRank,
            homeWins,
            awayWins }, upset.meta);
    }
    await firestore.doc(`games/${gameId}`).set(gamePatch, { merge: true });
    if (becameFinal) {
        try {
            await (0, notifyPushEvents_1.notifyGameFinalPush)({
                gameId,
                after: after,
                postsSnap,
                homeScore: game.homeScore,
                awayScore: game.awayScore,
            });
        }
        catch (err) {
            console.error("[onGameFinalV2] push notify failed", err);
        }
    }
});
//# sourceMappingURL=onGameFinalV2.js.map