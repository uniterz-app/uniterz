"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onWcBracketRescoreTaskCreated = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const wcBracketRescoreChunked_1 = require("./wcBracketRescoreChunked");
/**
 * ユーザー WC ブラケット survivor 再採点 — 廃止（2026-07）。
 * キューに残ったタスクは削除するだけ（読み取りなし）。
 */
exports.onWcBracketRescoreTaskCreated = (0, firestore_1.onDocumentCreated)({
    document: `${wcBracketRescoreChunked_1.WC_BRACKET_RESCORE_TASKS}/{taskId}`,
    region: "asia-northeast1",
}, async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    console.log(`[onWcBracketRescoreTaskCreated] discarded legacy task ${snap.id} (bracket rescore disabled)`);
    await snap.ref.delete().catch(() => { });
});
//# sourceMappingURL=onWcBracketRescoreTaskCreated.js.map