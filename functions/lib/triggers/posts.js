"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onPostDeletedDec = exports.onPostCreatedInc = void 0;
// functions/src/triggers/posts.ts
const firestore_1 = require("firebase-functions/v2/firestore");
const firestore_2 = require("firebase-admin/firestore");
const updateUserStats_1 = require("../updateUserStats");
// initializeApp は index.ts でやっている想定。未初期化でも getFirestore は安全。
const db = (0, firestore_2.getFirestore)();
/** JST（日付切り）用のキー生成: YYYY-MM-DD */
function toDateKeyJSTFromTs(ts) {
    const d = ts.toDate();
    const j = new Date(d.getTime() + 9 * 60 * 60 * 1000); // UTC+9
    const yyyy = j.getUTCFullYear();
    const mm = String(j.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(j.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}
/**
 * posts/{postId} 作成 → users/{authorUid}.counts.posts を +1
 *                      → user_stats_daily の createdPosts を +1
 *                      → user_stats（7d/30d/all）も再集計
 */
exports.onPostCreatedInc = (0, firestore_1.onDocumentCreated)("posts/{postId}", async (event) => {
    var _a;
    try {
        const data = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
        const authorUid = data === null || data === void 0 ? void 0 : data.authorUid;
        if (!authorUid)
            return;
        // 1) ユーザー通算投稿数を +1
        await db.doc(`users/${authorUid}`).set({ counts: { posts: firestore_2.FieldValue.increment(1) } }, { merge: true });
        // 2) daily の createdPosts を +1
        const createdAt = (data === null || data === void 0 ? void 0 : data.createdAt) || firestore_2.Timestamp.now();
        const dateKey = toDateKeyJSTFromTs(createdAt);
        const dailyDoc = db.doc(`user_stats_daily/${authorUid}_${dateKey}`);
        await db.doc(dailyDoc.path).set({
            date: dateKey,
            createdPosts: firestore_2.FieldValue.increment(1),
            updatedAt: firestore_2.FieldValue.serverTimestamp(),
        }, { merge: true });
        // 3) 7d/30d/all を最新状態に再集計
        await (0, updateUserStats_1.recomputeUserStatsFromDaily)(authorUid);
    }
    catch (e) {
        console.error("[onPostCreatedInc] failed:", e);
    }
});
/**
 * posts/{postId} 削除 → users/{authorUid}.counts.posts を -1
 * ※ いまは createdPosts のマイナスはしていない（必要になれば後で対応）
 */
exports.onPostDeletedDec = (0, firestore_1.onDocumentDeleted)("posts/{postId}", async (event) => {
    var _a;
    try {
        const data = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
        const authorUid = data === null || data === void 0 ? void 0 : data.authorUid;
        if (!authorUid)
            return;
        await db.doc(`users/${authorUid}`).set({ counts: { posts: firestore_2.FieldValue.increment(-1) } }, { merge: true });
    }
    catch (e) {
        console.error("[onPostDeletedDec] failed:", e);
    }
});
//# sourceMappingURL=posts.js.map