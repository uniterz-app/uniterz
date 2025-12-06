"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onPostCreatedV2 = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const firestore_2 = require("firebase-admin/firestore");
const db = (0, firestore_2.getFirestore)();
exports.onPostCreatedV2 = (0, firestore_1.onDocumentCreated)("posts/{postId}", async (event) => {
    var _a;
    const post = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!post)
        return;
    // ✅ v2のみ対象
    if (post.schemaVersion !== 2)
        return;
    if (!post.authorUid)
        return;
    // 👉 集計は onGameFinalV2 側でやるので、ここでは何もしない
});
//# sourceMappingURL=posts_v2.js.map