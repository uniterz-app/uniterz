"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rescorePlayoffBrackets = void 0;
const https_1 = require("firebase-functions/v2/https");
const firebase_1 = require("../firebase");
const playoffBracketRescoreChunked_1 = require("./playoffBracketRescoreChunked");
exports.rescorePlayoffBrackets = (0, https_1.onCall)(async (request) => {
    var _a, _b;
    const season = String((_b = (_a = request.data) === null || _a === void 0 ? void 0 : _a.season) !== null && _b !== void 0 ? _b : "").trim();
    if (!season) {
        throw new Error("season is required");
    }
    const resultsRef = firebase_1.db.collection("playoffResults").doc(season);
    const resultsSnap = await resultsRef.get();
    if (!resultsSnap.exists) {
        throw new Error(`playoffResults/${season} not found`);
    }
    await (0, playoffBracketRescoreChunked_1.enqueuePlayoffBracketRescoreChain)(firebase_1.db, season);
    return {
        ok: true,
        season,
        queued: true,
        message: "Rescore runs in background chunks (playoffBracketRescoreTasks). Check bracket scores after a short delay.",
    };
});
//# sourceMappingURL=rescorePlayoffBrackets.js.map