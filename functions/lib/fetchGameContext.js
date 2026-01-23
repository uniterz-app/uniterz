"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchGameContext = fetchGameContext;
/* =========================
 * Helpers
 * ========================= */
function normalizeGame(after, gameId) {
    var _a, _b, _c, _d;
    return {
        id: gameId,
        league: after === null || after === void 0 ? void 0 : after.league,
        homeTeamId: (_a = after === null || after === void 0 ? void 0 : after.home) === null || _a === void 0 ? void 0 : _a.teamId,
        awayTeamId: (_b = after === null || after === void 0 ? void 0 : after.away) === null || _b === void 0 ? void 0 : _b.teamId,
        homeScore: (_c = after === null || after === void 0 ? void 0 : after.homeScore) !== null && _c !== void 0 ? _c : null,
        awayScore: (_d = after === null || after === void 0 ? void 0 : after.awayScore) !== null && _d !== void 0 ? _d : null,
        final: !!(after === null || after === void 0 ? void 0 : after.final),
        homeRank: null,
        awayRank: null,
    };
}
/* =========================
 * Main
 * ========================= */
async function fetchGameContext({ db, gameId, after, }) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const game = normalizeGame(after, gameId);
    if (!game.homeTeamId || !game.awayTeamId)
        return null;
    const [hSnap, aSnap] = await Promise.all([
        db.doc(`teams/${game.homeTeamId}`).get(),
        db.doc(`teams/${game.awayTeamId}`).get(),
    ]);
    const homeConference = (_a = hSnap.data()) === null || _a === void 0 ? void 0 : _a.conference;
    const awayConference = (_b = aSnap.data()) === null || _b === void 0 ? void 0 : _b.conference;
    const homeRank = Number((_d = (_c = hSnap.data()) === null || _c === void 0 ? void 0 : _c.rank) !== null && _d !== void 0 ? _d : null);
    const awayRank = Number((_f = (_e = aSnap.data()) === null || _e === void 0 ? void 0 : _e.rank) !== null && _f !== void 0 ? _f : null);
    const homeWins = Number((_h = (_g = hSnap.data()) === null || _g === void 0 ? void 0 : _g.wins) !== null && _h !== void 0 ? _h : 0);
    const awayWins = Number((_k = (_j = aSnap.data()) === null || _j === void 0 ? void 0 : _j.wins) !== null && _k !== void 0 ? _k : 0);
    game.homeRank = homeRank;
    game.awayRank = awayRank;
    const postsSnap = await db
        .collection("posts")
        .where("gameId", "==", gameId)
        .where("schemaVersion", "==", 2)
        .get();
    const picks = postsSnap.docs.map((d) => d.data().prediction.winner);
    return {
        game,
        postsSnap,
        picks,
        homeConference,
        awayConference,
        homeRank,
        awayRank,
        homeWins,
        awayWins,
    };
}
//# sourceMappingURL=fetchGameContext.js.map