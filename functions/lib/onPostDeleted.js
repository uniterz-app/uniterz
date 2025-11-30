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
    var _a, _b;
    // ★ 型を any にキャストして before を正しく読む
    const before = (_b = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before) === null || _b === void 0 ? void 0 : _b.data();
    if (!before)
        return;
    const uid = before.authorUid;
    const createdAt = before.createdAt;
    if (!uid || !createdAt)
        return;
    // JST YYYY-MM-DD を生成
    const d = createdAt.toDate();
    const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const yyyy = j.getUTCFullYear();
    const mm = String(j.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(j.getUTCDate()).padStart(2, "0");
    const dateKey = `${yyyy}-${mm}-${dd}`;
    const db = (0, firestore_2.getFirestore)();
    const dailyRef = db.doc(`user_stats_daily/${uid}_${dateKey}`);
    // createdPosts -1
    await dailyRef.set({
        date: dateKey,
        createdPosts: firestore_2.FieldValue.increment(-1),
        updatedAt: firestore_2.FieldValue.serverTimestamp(),
    }, { merge: true });
    await (0, updateUserStats_1.recomputeUserStatsFromDaily)(uid);
});
//# sourceMappingURL=onPostDeleted.js.map