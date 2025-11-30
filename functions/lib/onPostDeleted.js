"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onPostDeleted = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const firestore_2 = require("firebase-admin/firestore");
const updateUserStats_1 = require("./updateUserStats");
exports.onPostDeleted = (0, firestore_1.onDocumentDeleted)({
    document: "posts/{postId}",
    region: "asia-northeast1",
}, async (event) => {
    // ★ any キャストで TS の誤推論を回避
    const data = event.data;
    const beforeSnap = data === null || data === void 0 ? void 0 : data.before;
    if (!beforeSnap)
        return;
    const before = beforeSnap.data();
    if (!before)
        return;
    const uid = before.authorUid;
    const createdAt = before.createdAt;
    if (!uid || !createdAt)
        return;
    // JST YYYY-MM-DD
    const d = createdAt.toDate();
    const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const yyyy = j.getUTCFullYear();
    const mm = String(j.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(j.getUTCDate()).padStart(2, "0");
    const dateKey = `${yyyy}-${mm}-${dd}`;
    const db = (0, firestore_2.getFirestore)();
    const dailyRef = db.doc(`user_stats_daily/${uid}_${dateKey}`);
    // 投稿数だけ -1（hit/miss は未確定投稿なので不要）
    await dailyRef.set({
        date: dateKey,
        createdPosts: firestore_2.FieldValue.increment(-1),
        updatedAt: firestore_2.FieldValue.serverTimestamp(),
    }, { merge: true });
    await (0, updateUserStats_1.recomputeUserStatsFromDaily)(uid);
});
//# sourceMappingURL=onPostDeleted.js.map