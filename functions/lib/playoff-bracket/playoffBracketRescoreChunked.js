"use strict";
// Chunked playoff bracket rescoring: avoid loading all playoffBrackets in one function run.
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLAYOFF_BRACKET_RESCORE_TASKS = exports.PLAYOFF_BRACKET_RESCORE_PAGE_SIZE = void 0;
exports.enqueuePlayoffBracketRescoreChain = enqueuePlayoffBracketRescoreChain;
exports.processPlayoffBracketRescorePage = processPlayoffBracketRescorePage;
const firestore_1 = require("firebase-admin/firestore");
const scorePlayoffBracket_1 = require("./scorePlayoffBracket");
/** Bracket docs processed per task (tune for timeout / memory). */
exports.PLAYOFF_BRACKET_RESCORE_PAGE_SIZE = 250;
const BATCH_COMMIT_MAX = 400;
exports.PLAYOFF_BRACKET_RESCORE_TASKS = "playoffBracketRescoreTasks";
async function enqueuePlayoffBracketRescoreChain(db, season) {
    const s = season.trim();
    if (!s)
        return;
    await db.collection(exports.PLAYOFF_BRACKET_RESCORE_TASKS).add({
        season: s,
        startAfterDocId: null,
        enqueuedAt: firestore_1.FieldValue.serverTimestamp(),
    });
}
/**
 * Score one page of playoffBrackets. Always reads fresh playoffResults/{season}.
 */
async function processPlayoffBracketRescorePage(db, season, startAfterDocId) {
    var _a, _b, _c;
    const s = season.trim();
    if (!s)
        return { processed: 0, nextStartAfterDocId: null };
    const resultsSnap = await db.collection("playoffResults").doc(s).get();
    if (!resultsSnap.exists) {
        return { processed: 0, nextStartAfterDocId: null };
    }
    const results = ((_b = (_a = resultsSnap.data()) === null || _a === void 0 ? void 0 : _a.results) !== null && _b !== void 0 ? _b : {});
    let q = db
        .collection("playoffBrackets")
        .where("season", "==", s)
        .orderBy(firestore_1.FieldPath.documentId())
        .limit(exports.PLAYOFF_BRACKET_RESCORE_PAGE_SIZE);
    if (startAfterDocId) {
        const cursorSnap = await db
            .collection("playoffBrackets")
            .doc(startAfterDocId)
            .get();
        if (cursorSnap.exists) {
            q = q.startAfter(cursorSnap);
        }
    }
    const bracketsSnap = await q.get();
    if (bracketsSnap.empty) {
        return { processed: 0, nextStartAfterDocId: null };
    }
    let batch = db.batch();
    let opCount = 0;
    for (const bracketDoc of bracketsSnap.docs) {
        const data = bracketDoc.data();
        const prediction = ((_c = data.bracket) !== null && _c !== void 0 ? _c : {});
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
        if (opCount >= BATCH_COMMIT_MAX) {
            await batch.commit();
            batch = db.batch();
            opCount = 0;
        }
    }
    if (opCount > 0) {
        await batch.commit();
    }
    const lastDoc = bracketsSnap.docs[bracketsSnap.docs.length - 1];
    const fullPage = bracketsSnap.size >= exports.PLAYOFF_BRACKET_RESCORE_PAGE_SIZE;
    return {
        processed: bracketsSnap.size,
        nextStartAfterDocId: fullPage ? lastDoc.id : null,
    };
}
//# sourceMappingURL=playoffBracketRescoreChunked.js.map