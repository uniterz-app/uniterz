"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maybeUpdateWcBracketOnKnockoutFinal = maybeUpdateWcBracketOnKnockoutFinal;
const firestore_1 = require("firebase-admin/firestore");
const wcKnockoutMatchIds_1 = require("./wcKnockoutMatchIds");
const wcBracketRescoreChunked_1 = require("./wcBracketRescoreChunked");
const resolveKnockoutWinner_1 = require("./resolveKnockoutWinner");
/**
 * WC ノックアウト試合が final になったとき:
 * 1. wcBracketResults に当該試合の勝者を追記
 * 2. 全提出ブラケットの survivor 再評価キューを投入
 */
async function maybeUpdateWcBracketOnKnockoutFinal(db, game) {
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
    const season = String((_b = game.season) !== null && _b !== void 0 ? _b : wcKnockoutMatchIds_1.WC_KNOCKOUT_BRACKET_SEASON).trim();
    const resultsRef = db.collection("wcBracketResults").doc(season);
    await db.runTransaction(async (tx) => {
        var _a, _b, _c;
        const snap = await tx.get(resultsRef);
        const prev = ((_b = (_a = snap.data()) === null || _a === void 0 ? void 0 : _a.winners) !== null && _b !== void 0 ? _b : {});
        const existing = (_c = prev[matchId]) === null || _c === void 0 ? void 0 : _c.trim();
        if (existing && existing !== winnerTeamId) {
            console.warn(`[wc-bracket] winners.${matchId} overwrite ${existing} → ${winnerTeamId}`);
        }
        tx.set(resultsRef, {
            season,
            winners: Object.assign(Object.assign({}, prev), { [matchId]: winnerTeamId }),
            lastMatchId: matchId,
            lastGameId: game.gameId,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        }, { merge: true });
    });
    await (0, wcBracketRescoreChunked_1.enqueueWcBracketRescoreChain)(db, season);
    console.log(`[wc-bracket] ${matchId} final via game ${game.gameId} → winner ${winnerTeamId}`);
    return { updated: true, matchId, winnerTeamId };
}
//# sourceMappingURL=onKnockoutGameFinal.js.map