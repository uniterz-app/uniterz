"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onPostCreated = void 0;
// functions/src/onPostCreated.ts
const firestore_1 = require("firebase-functions/v2/firestore");
const firestore_2 = require("firebase-admin/firestore");
const updateUserStats_1 = require("./updateUserStats");
const db = (0, firestore_2.getFirestore)();
/**
 * posts/{postId} 新規作成時：
 * - user_stats_daily/{uid_YYYY-MM-DD}.createdPosts を +1
 * - 7d/30d/all を再集計
 */
exports.onPostCreated = (0, firestore_1.onDocumentCreated)({
    document: "posts/{postId}",
    region: "asia-northeast1",
}, async (event) => {
    var _a;
    const data = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!data)
        return;
    const uid = data.authorUid;
    const createdAt = data.createdAt;
    if (!uid || !createdAt)
        return;
    // JST YYYY-MM-DD キーを生成
    const d = createdAt.toDate();
    const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const yyyy = j.getUTCFullYear();
    const mm = String(j.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(j.getUTCDate()).padStart(2, "0");
    const dateKey = `${yyyy}-${mm}-${dd}`;
    const dailyRef = db.doc(`user_stats_daily/${uid}_${dateKey}`);
    // createdPosts の増加だけ（hit/miss計算は onGameFinal が行う）
    await dailyRef.set({
        date: dateKey,
        createdPosts: firestore_2.FieldValue.increment(1),
        updatedAt: firestore_2.FieldValue.serverTimestamp(),
    }, { merge: true });
    // 7d / 30d / all を最新化
    await (0, updateUserStats_1.recomputeUserStatsFromDaily)(uid);
});
//# sourceMappingURL=onPostCreated.js.map