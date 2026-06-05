"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchGameContext = fetchGameContext;
const resolveWcStage_1 = require("./wc/resolveWcStage");
/* =========================
 * Helpers
 * ========================= */
function normalizePlayoffRoundKey(v) {
    const s = String(v !== null && v !== void 0 ? v : "").trim().toLowerCase();
    if (!s)
        return null;
    return s === "r1" || s === "r2" || s === "cf" || s === "finals" ? s : null;
}
function normalizeGame(after, gameId) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const seasonPhase = (_a = after === null || after === void 0 ? void 0 : after.seasonPhase) !== null && _a !== void 0 ? _a : null;
    return {
        id: gameId,
        league: after === null || after === void 0 ? void 0 : after.league,
        homeTeamId: (_b = after === null || after === void 0 ? void 0 : after.home) === null || _b === void 0 ? void 0 : _b.teamId,
        awayTeamId: (_c = after === null || after === void 0 ? void 0 : after.away) === null || _c === void 0 ? void 0 : _c.teamId,
        homeScore: (_d = after === null || after === void 0 ? void 0 : after.homeScore) !== null && _d !== void 0 ? _d : null,
        awayScore: (_e = after === null || after === void 0 ? void 0 : after.awayScore) !== null && _e !== void 0 ? _e : null,
        final: !!(after === null || after === void 0 ? void 0 : after.final),
        homeRank: null,
        awayRank: null,
        playedAt: (_g = (_f = after === null || after === void 0 ? void 0 : after.startAtJst) !== null && _f !== void 0 ? _f : after === null || after === void 0 ? void 0 : after.startAt) !== null && _g !== void 0 ? _g : null,
        seasonPhase,
        seasonRound: seasonPhase === "playoffs"
            ? normalizePlayoffRoundKey(after === null || after === void 0 ? void 0 : after.playoffRound)
            : null,
        regulationEtScore: (_h = after === null || after === void 0 ? void 0 : after.regulationEtScore) !== null && _h !== void 0 ? _h : null,
        advancingTeamId: (_j = after === null || after === void 0 ? void 0 : after.advancingTeamId) !== null && _j !== void 0 ? _j : null,
        knockout: (after === null || after === void 0 ? void 0 : after.knockout) === true,
        wcStage: (0, resolveWcStage_1.resolveWcStageFromGame)({
            knockout: (after === null || after === void 0 ? void 0 : after.knockout) === true,
            roundLabel: (_k = after === null || after === void 0 ? void 0 : after.roundLabel) !== null && _k !== void 0 ? _k : null,
            wcStage: (_l = after === null || after === void 0 ? void 0 : after.wcStage) !== null && _l !== void 0 ? _l : null,
        }),
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