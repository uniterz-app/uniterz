"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scorePlayoffBracket = scorePlayoffBracket;
const PLAYOFF_BRACKET_STRUCTURE = {
    R2_E1: ["R1_E1", "R1_E2"],
    R2_E2: ["R1_E3", "R1_E4"],
    R2_W1: ["R1_W1", "R1_W2"],
    R2_W2: ["R1_W3", "R1_W4"],
    CF_E: ["R2_E1", "R2_E2"],
    CF_W: ["R2_W1", "R2_W2"],
    FINALS: ["CF_E", "CF_W"],
};
const PLAYOFF_ROUND_POINTS = {
    R1: 4,
    R2: 5,
    CF: 6,
    FINALS: 6,
};
const PLAYOFF_GAMES_EXACT_POINTS = 2;
function getRound(seriesId) {
    if (seriesId.startsWith("R1"))
        return "R1";
    if (seriesId.startsWith("R2"))
        return "R2";
    if (seriesId.startsWith("CF"))
        return "CF";
    return "FINALS";
}
function isSeriesValid(seriesId, prediction) {
    var _a, _b, _c;
    const parents = PLAYOFF_BRACKET_STRUCTURE[seriesId];
    if (!parents)
        return true;
    const [p1, p2] = parents;
    const w1 = (_a = prediction[p1]) === null || _a === void 0 ? void 0 : _a.winner;
    const w2 = (_b = prediction[p2]) === null || _b === void 0 ? void 0 : _b.winner;
    if (!w1 || !w2)
        return false;
    const predWinner = (_c = prediction[seriesId]) === null || _c === void 0 ? void 0 : _c.winner;
    if (!predWinner)
        return false;
    return predWinner === w1 || predWinner === w2;
}
function scorePlayoffBracket(prediction, results) {
    let totalScore = 0;
    let winnerPoints = 0;
    let gamesPoints = 0;
    let alive = true;
    let firstMissSeriesId = null;
    for (const seriesId in results) {
        const id = seriesId;
        const result = results[id];
        const pred = prediction[id];
        if (!result || !pred)
            continue;
        if (!isSeriesValid(id, prediction))
            continue;
        if (pred.winner === result.winner) {
            const round = getRound(id);
            const pts = PLAYOFF_ROUND_POINTS[round];
            winnerPoints += pts;
            totalScore += pts;
            if (pred.games === result.games) {
                gamesPoints += PLAYOFF_GAMES_EXACT_POINTS;
                totalScore += PLAYOFF_GAMES_EXACT_POINTS;
            }
        }
        else if (alive) {
            alive = false;
            firstMissSeriesId = id;
        }
    }
    return {
        totalScore,
        winnerPoints,
        gamesPoints,
        alive,
        firstMissSeriesId,
    };
}
//# sourceMappingURL=scorePlayoffBracket.js.map