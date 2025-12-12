"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onPostCreatedV2 = void 0;
// functions/src/onPostCreatedV2.ts
const firestore_1 = require("firebase-functions/v2/firestore");
const firestore_2 = require("firebase-admin/firestore");
const db = (0, firestore_2.getFirestore)();
/**
 * V2: posts/{postId} 新規作成時（軽量版）
 *
 * やること：
 * ① user_stats_v2_daily/{uid_YYYY-MM-DD}.all.posts を +1
 *
 * ※勝敗・精度などの stats は onGameFinalV2 でのみ処理する。
 */
exports.onPostCreatedV2 = (0, firestore_1.onDocumentCreated)({
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
    // JST 日付キー
    const d = createdAt.toDate();
    const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const yyyy = j.getUTCFullYear();
    const mm = String(j.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(j.getUTCDate()).padStart(2, "0");
    const dateKey = `${yyyy}-${mm}-${dd}`;
    const dailyRef = db.doc(`user_stats_v2_daily/${uid}_${dateKey}`);
    // ※ 再集計は不要（軽量化方針）
});
//# sourceMappingURL=onPostCreated.js.map