"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maybeUpdateWcBracketOnKnockoutFinal = maybeUpdateWcBracketOnKnockoutFinal;
const wcKnockoutMatchIds_1 = require("./wcKnockoutMatchIds");
const resolveKnockoutWinner_1 = require("./resolveKnockoutWinner");
const resolveKnockoutLoser_1 = require("./resolveKnockoutLoser");
const createChildKnockoutGames_1 = require("./createChildKnockoutGames");
const wcFirestoreWriteDeps_1 = require("./wcFirestoreWriteDeps");
/**
 * WC ノックアウト試合が final になったとき（onGameFinalV2 / 管理スクリプト）:
 * 1. wcBracketResults に当該試合の勝者を追記
 * 2. 両親が確定した子試合を games に自動生成
 *
 * ユーザー提出ブラケットの survivor 再採点は廃止（2026-07）。
 */
async function maybeUpdateWcBracketOnKnockoutFinal(db, game, writeDeps = (0, wcFirestoreWriteDeps_1.defaultWcFirestoreWriteDeps)()) {
    var _a, _b;
    if (String((_a = game.league) !== null && _a !== void 0 ? _a : "").trim().toLowerCase() !== "wc") {
        return { updated: false };
    }
    if (game.knockout !== true) {
        return { updated: false };
    }
    const matchId = (0, resolveKnockoutWinner_1.resolveWcKnockoutMatchIdFromGame)(Object.assign(Object.assign({}, game), { id: game.gameId, wcKnockoutMatchId: game.wcKnockoutMatchId }));
    if (!matchId) {
        console.warn(`[wc-bracket] skip game ${game.gameId}: missing wcKnockoutMatchId`);
        return { updated: false };
    }
    const winnerTeamId = (0, resolveKnockoutWinner_1.resolveKnockoutWinnerTeamId)(game);
    if (!winnerTeamId) {
        console.warn(`[wc-bracket] skip game ${game.gameId} (${matchId}): no winner teamId`);
        return { updated: false };
    }
    const loserTeamId = (0, resolveKnockoutLoser_1.resolveKnockoutLoserTeamId)({
        homeTeamId: game.homeTeamId,
        awayTeamId: game.awayTeamId,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
        advancingTeamId: game.advancingTeamId,
        knockout: game.knockout === true,
        final: true,
    });
    const season = String((_b = game.season) !== null && _b !== void 0 ? _b : wcKnockoutMatchIds_1.WC_KNOCKOUT_BRACKET_SEASON).trim();
    const resultsRef = db.collection("wcBracketResults").doc(season);
    let mergedWinners = {};
    let mergedLosers = {};
    await db.runTransaction(async (tx) => {
        var _a, _b, _c, _d;
        const snap = await tx.get(resultsRef);
        const prev = (_a = snap.data()) !== null && _a !== void 0 ? _a : {};
        const prevWinners = ((_b = prev.winners) !== null && _b !== void 0 ? _b : {});
        const prevLosers = ((_c = prev.losers) !== null && _c !== void 0 ? _c : {});
        const existing = (_d = prevWinners[matchId]) === null || _d === void 0 ? void 0 : _d.trim();
        if (existing && existing !== winnerTeamId) {
            console.warn(`[wc-bracket] winners.${matchId} overwrite ${existing} → ${winnerTeamId}`);
        }
        mergedWinners = Object.assign(Object.assign({}, prevWinners), { [matchId]: winnerTeamId });
        mergedLosers = Object.assign({}, prevLosers);
        if (loserTeamId) {
            mergedLosers[matchId] = loserTeamId;
        }
        tx.set(resultsRef, {
            season,
            winners: mergedWinners,
            losers: mergedLosers,
            lastMatchId: matchId,
            lastGameId: game.gameId,
            updatedAt: writeDeps.serverTimestamp(),
        }, { merge: true });
    });
    let childGamesCreated = [];
    try {
        childGamesCreated = await (0, createChildKnockoutGames_1.maybeCreateChildKnockoutGames)(db, {
            season,
            finishedMatchId: matchId,
            winners: mergedWinners,
        });
    }
    catch (err) {
        console.error(`[wc-bracket] child game creation failed after ${matchId}`, err);
    }
    console.log(`[wc-bracket] ${matchId} final via game ${game.gameId} → winner ${winnerTeamId}` +
        (childGamesCreated.length
            ? `; child games: ${childGamesCreated.join(", ")}`
            : ""));
    return {
        updated: true,
        matchId,
        winnerTeamId,
        childGamesCreated,
    };
}
//# sourceMappingURL=onKnockoutGameFinal.js.map