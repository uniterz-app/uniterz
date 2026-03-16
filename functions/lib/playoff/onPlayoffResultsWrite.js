"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onPlayoffResultsWrite = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const firestore_2 = require("firebase-admin/firestore");
const firebase_1 = require("../firebase");
const scorePlayoffBracket_1 = require("./scorePlayoffBracket");
exports.onPlayoffResultsWrite = (0, firestore_1.onDocumentWritten)({
    document: "playoffResults/{season}",
    region: "asia-northeast1",
}, async (event) => {
    var _a, _b, _c, _d;
    const season = String((_a = event.params.season) !== null && _a !== void 0 ? _a : "").trim();
    if (!season)
        return;
    const after = (_b = event.data) === null || _b === void 0 ? void 0 : _b.after;
    if (!(after === null || after === void 0 ? void 0 : after.exists))
        return;
    const resultsData = after.data();
    const results = ((_c = resultsData === null || resultsData === void 0 ? void 0 : resultsData.results) !== null && _c !== void 0 ? _c : {});
    const bracketsSnap = await firebase_1.db
        .collection("playoffBrackets")
        .where("season", "==", season)
        .get();
    let batch = firebase_1.db.batch();
    let opCount = 0;
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
            scoredAt: firestore_2.FieldValue.serverTimestamp(),
        }, { merge: true });
        opCount += 1;
        if (opCount >= 400) {
            await batch.commit();
            batch = firebase_1.db.batch();
            opCount = 0;
        }
    }
    if (opCount > 0) {
        await batch.commit();
    }
});
//# sourceMappingURL=onPlayoffResultsWrite.js.map