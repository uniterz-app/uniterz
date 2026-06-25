"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WC_BRACKET_RESCORE_TASKS = exports.WC_BRACKET_RESCORE_PAGE_SIZE = void 0;
exports.enqueueWcBracketRescoreChain = enqueueWcBracketRescoreChain;
exports.processWcBracketRescorePage = processWcBracketRescorePage;
const firestore_1 = require("firebase-admin/firestore");
const scoreWcBracketSurvival_1 = require("./scoreWcBracketSurvival");
exports.WC_BRACKET_RESCORE_PAGE_SIZE = 250;
exports.WC_BRACKET_RESCORE_TASKS = "wcBracketRescoreTasks";
const BATCH_COMMIT_MAX = 400;
async function enqueueWcBracketRescoreChain(db, season) {
    const s = season.trim();
    if (!s)
        return;
    await db.collection(exports.WC_BRACKET_RESCORE_TASKS).add({
        season: s,
        startAfterDocId: null,
        enqueuedAt: firestore_1.FieldValue.serverTimestamp(),
    });
}
async function processWcBracketRescorePage(db, season, startAfterDocId) {
    var _a, _b, _c;
    const s = season.trim();
    if (!s)
        return { processed: 0, nextStartAfterDocId: null };
    const resultsSnap = await db.collection("wcBracketResults").doc(s).get();
    if (!resultsSnap.exists) {
        return { processed: 0, nextStartAfterDocId: null };
    }
    const officialWinners = ((_b = (_a = resultsSnap.data()) === null || _a === void 0 ? void 0 : _a.winners) !== null && _b !== void 0 ? _b : {});
    let q = db
        .collection("wcBrackets")
        .where("season", "==", s)
        .where("isSubmitted", "==", true)
        .orderBy(firestore_1.FieldPath.documentId())
        .limit(exports.WC_BRACKET_RESCORE_PAGE_SIZE);
    if (startAfterDocId) {
        const cursorSnap = await db.collection("wcBrackets").doc(startAfterDocId).get();
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
        const scored = (0, scoreWcBracketSurvival_1.scoreWcBracketSurvival)(prediction, officialWinners);
        batch.set(bracketDoc.ref, {
            alive: scored.alive,
            firstMissMatchId: scored.firstMissMatchId,
            survivedRounds: scored.survivedRounds,
            hitByMatch: scored.hitByMatch,
            survivalRankKey: (0, scoreWcBracketSurvival_1.wcSurvivalRankKey)(scored),
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
    const fullPage = bracketsSnap.size >= exports.WC_BRACKET_RESCORE_PAGE_SIZE;
    return {
        processed: bracketsSnap.size,
        nextStartAfterDocId: fullPage ? lastDoc.id : null,
    };
}
//# sourceMappingURL=wcBracketRescoreChunked.js.map