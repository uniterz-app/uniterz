"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rescorePlayoffBrackets = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const firebase_1 = require("../firebase");
const scorePlayoffBracket_1 = require("./scorePlayoffBracket");
exports.rescorePlayoffBrackets = (0, https_1.onCall)(async (request) => {
    var _a, _b, _c, _d;
    const season = String((_b = (_a = request.data) === null || _a === void 0 ? void 0 : _a.season) !== null && _b !== void 0 ? _b : "").trim();
    if (!season) {
        throw new Error("season is required");
    }
    const resultsRef = firebase_1.db.collection("playoffResults").doc(season);
    const resultsSnap = await resultsRef.get();
    if (!resultsSnap.exists) {
        throw new Error(`playoffResults/${season} not found`);
    }
    const resultsData = resultsSnap.data();
    const results = ((_c = resultsData === null || resultsData === void 0 ? void 0 : resultsData.results) !== null && _c !== void 0 ? _c : {});
    const bracketsSnap = await firebase_1.db
        .collection("playoffBrackets")
        .where("season", "==", season)
        .get();
    let batch = firebase_1.db.batch();
    let opCount = 0;
    let updatedCount = 0;
    for (const bracketDoc of bracketsSnap.docs) {
        const data = bracketDoc.data();
        const prediction = ((_d = data.bracket) !== null && _d !== void 0 ? _d : {});
        const scored = (0, scorePlayoffBracket_1.scorePlayoffBracket)(prediction, results);
        batch.set(bracketDoc.ref, {
            totalScore: scored.totalScore,
            winnerPoints: scored.winnerPoints,
            gamesPoints: scored.gamesPoints,
            alive: scored.alive,
            firstMissSeriesId: scored.firstMissSeriesId,
            scoredAt: firestore_1.FieldValue.serverTimestamp(),
        }, { merge: true });
        opCount += 1;
        updatedCount += 1;
        if (opCount >= 400) {
            await batch.commit();
            batch = firebase_1.db.batch();
            opCount = 0;
        }
    }
    if (opCount > 0) {
        await batch.commit();
    }
    return {
        ok: true,
        season,
        updatedCount,
    };
});
//# sourceMappingURL=rescorePlayoffBrackets.js.map