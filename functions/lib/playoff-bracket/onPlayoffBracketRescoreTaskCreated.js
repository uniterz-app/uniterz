"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onPlayoffBracketRescoreTaskCreated = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const firestore_2 = require("firebase-admin/firestore");
const firebase_1 = require("../firebase");
const playoffBracketRescoreChunked_1 = require("./playoffBracketRescoreChunked");
/**
 * One task scores one page; enqueues the next task if more brackets remain.
 */
exports.onPlayoffBracketRescoreTaskCreated = (0, firestore_1.onDocumentCreated)({
    document: `${playoffBracketRescoreChunked_1.PLAYOFF_BRACKET_RESCORE_TASKS}/{taskId}`,
    region: "asia-northeast1",
}, async (event) => {
    var _a;
    const snap = event.data;
    if (!snap)
        return;
    const season = String((_a = snap.get("season")) !== null && _a !== void 0 ? _a : "").trim();
    const startRaw = snap.get("startAfterDocId");
    const startAfterDocId = typeof startRaw === "string" && startRaw.trim() ? startRaw.trim() : null;
    if (!season) {
        await snap.ref.delete().catch(() => { });
        return;
    }
    try {
        const { nextStartAfterDocId } = await (0, playoffBracketRescoreChunked_1.processPlayoffBracketRescorePage)(firebase_1.db, season, startAfterDocId);
        if (nextStartAfterDocId) {
            await firebase_1.db.collection(playoffBracketRescoreChunked_1.PLAYOFF_BRACKET_RESCORE_TASKS).add({
                season,
                startAfterDocId: nextStartAfterDocId,
                enqueuedAt: firestore_2.FieldValue.serverTimestamp(),
            });
        }
    }
    catch (e) {
        console.error(`[onPlayoffBracketRescoreTaskCreated] season=${season} startAfter=${startAfterDocId !== null && startAfterDocId !== void 0 ? startAfterDocId : "null"}`, e);
        return;
    }
    await snap.ref.delete().catch(() => { });
});
//# sourceMappingURL=onPlayoffBracketRescoreTaskCreated.js.map