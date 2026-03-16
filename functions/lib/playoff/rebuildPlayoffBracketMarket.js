"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rebuildPlayoffBracketMarket = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const firebase_1 = require("../firebase");
function inc(map, key, amount = 1) {
    var _a;
    if (!key)
        return;
    map[key] = ((_a = map[key]) !== null && _a !== void 0 ? _a : 0) + amount;
}
function incNestedWinner(target, seriesId, winner) {
    if (!target[seriesId]) {
        target[seriesId] = {
            winnerPickCounts: {},
            gamesPickCounts: {},
        };
    }
    inc(target[seriesId].winnerPickCounts, winner);
}
function incNestedGames(target, seriesId, games) {
    if (games == null || games === "")
        return;
    if (!target[seriesId]) {
        target[seriesId] = {
            winnerPickCounts: {},
            gamesPickCounts: {},
        };
    }
    inc(target[seriesId].gamesPickCounts, String(games));
}
function getPredWinner(prediction, seriesId) {
    var _a, _b;
    return (_b = (_a = prediction[seriesId]) === null || _a === void 0 ? void 0 : _a.winner) !== null && _b !== void 0 ? _b : null;
}
function getPredGames(prediction, seriesId) {
    var _a, _b;
    return (_b = (_a = prediction[seriesId]) === null || _a === void 0 ? void 0 : _a.games) !== null && _b !== void 0 ? _b : null;
}
function makeMatchupKey(round, a, b) {
    if (!a || !b)
        return null;
    const [t1, t2] = [a, b].sort();
    return `${round}|${t1}|${t2}`;
}
function ensureMatchupItem(target, matchupKey) {
    if (!target[matchupKey]) {
        target[matchupKey] = {
            total: 0,
            winnerPickCounts: {},
            gamesPickCounts: {},
        };
    }
    return target[matchupKey];
}
function addMatchupMarket(target, round, teamA, teamB, pickedWinner, pickedGames) {
    const matchupKey = makeMatchupKey(round, teamA, teamB);
    if (!matchupKey)
        return;
    const item = ensureMatchupItem(target, matchupKey);
    item.total += 1;
    inc(item.winnerPickCounts, pickedWinner);
    if (pickedGames != null && pickedGames !== "") {
        inc(item.gamesPickCounts, String(pickedGames));
    }
}
exports.rebuildPlayoffBracketMarket = (0, https_1.onCall)(async (request) => {
    var _a, _b, _c;
    const season = String((_b = (_a = request.data) === null || _a === void 0 ? void 0 : _a.season) !== null && _b !== void 0 ? _b : "").trim();
    if (!season) {
        throw new Error("season is required");
    }
    const bracketsSnap = await firebase_1.db
        .collection("playoffBrackets")
        .where("season", "==", season)
        .get();
    const championPickCounts = {};
    const round1SeriesMarkets = {};
    const teamProgressMarkets = {
        R2: {},
        CF: {},
        FINALS: {},
        CHAMPION: {},
    };
    const matchupMarkets = {
        R2: {},
        CF: {},
        FINALS: {},
    };
    let totalEntries = 0;
    for (const docSnap of bracketsSnap.docs) {
        const data = docSnap.data();
        const bracket = ((_c = data.bracket) !== null && _c !== void 0 ? _c : {});
        totalEntries += 1;
        // champion
        inc(championPickCounts, getPredWinner(bracket, "FINALS"));
        // Round 1 fixed series markets
        const round1Ids = [
            "R1_E1",
            "R1_E2",
            "R1_E3",
            "R1_E4",
            "R1_W1",
            "R1_W2",
            "R1_W3",
            "R1_W4",
        ];
        for (const id of round1Ids) {
            incNestedWinner(round1SeriesMarkets, id, getPredWinner(bracket, id));
            incNestedGames(round1SeriesMarkets, id, getPredGames(bracket, id));
        }
        // Advancement to R2 = Round 1 winners
        const r1e1 = getPredWinner(bracket, "R1_E1");
        const r1e2 = getPredWinner(bracket, "R1_E2");
        const r1e3 = getPredWinner(bracket, "R1_E3");
        const r1e4 = getPredWinner(bracket, "R1_E4");
        const r1w1 = getPredWinner(bracket, "R1_W1");
        const r1w2 = getPredWinner(bracket, "R1_W2");
        const r1w3 = getPredWinner(bracket, "R1_W3");
        const r1w4 = getPredWinner(bracket, "R1_W4");
        [r1e1, r1e2, r1e3, r1e4, r1w1, r1w2, r1w3, r1w4].forEach((team) => {
            inc(teamProgressMarkets.R2, team);
        });
        // R2 matchup markets
        addMatchupMarket(matchupMarkets.R2, "R2", r1e1, r1e2, getPredWinner(bracket, "R2_E1"), getPredGames(bracket, "R2_E1"));
        addMatchupMarket(matchupMarkets.R2, "R2", r1e3, r1e4, getPredWinner(bracket, "R2_E2"), getPredGames(bracket, "R2_E2"));
        addMatchupMarket(matchupMarkets.R2, "R2", r1w1, r1w2, getPredWinner(bracket, "R2_W1"), getPredGames(bracket, "R2_W1"));
        addMatchupMarket(matchupMarkets.R2, "R2", r1w3, r1w4, getPredWinner(bracket, "R2_W2"), getPredGames(bracket, "R2_W2"));
        // Advancement to CF = R2 winners
        const r2e1 = getPredWinner(bracket, "R2_E1");
        const r2e2 = getPredWinner(bracket, "R2_E2");
        const r2w1 = getPredWinner(bracket, "R2_W1");
        const r2w2 = getPredWinner(bracket, "R2_W2");
        [r2e1, r2e2, r2w1, r2w2].forEach((team) => {
            inc(teamProgressMarkets.CF, team);
        });
        // CF matchup markets
        addMatchupMarket(matchupMarkets.CF, "CF", r2e1, r2e2, getPredWinner(bracket, "CF_E"), getPredGames(bracket, "CF_E"));
        addMatchupMarket(matchupMarkets.CF, "CF", r2w1, r2w2, getPredWinner(bracket, "CF_W"), getPredGames(bracket, "CF_W"));
        // Advancement to FINALS = CF winners
        const cfe = getPredWinner(bracket, "CF_E");
        const cfw = getPredWinner(bracket, "CF_W");
        [cfe, cfw].forEach((team) => {
            inc(teamProgressMarkets.FINALS, team);
        });
        // FINALS matchup market
        addMatchupMarket(matchupMarkets.FINALS, "FINALS", cfe, cfw, getPredWinner(bracket, "FINALS"), getPredGames(bracket, "FINALS"));
        // Champion
        inc(teamProgressMarkets.CHAMPION, getPredWinner(bracket, "FINALS"));
    }
    await firebase_1.db
        .collection("playoffBracketMarket")
        .doc(season)
        .set({
        season,
        totalEntries,
        championPickCounts,
        round1SeriesMarkets,
        teamProgressMarkets,
        matchupMarkets,
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    }, { merge: true });
    return {
        ok: true,
        season,
        totalEntries,
    };
});
//# sourceMappingURL=rebuildPlayoffBracketMarket.js.map