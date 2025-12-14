"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rebuildUsersTrend = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const firestore_2 = require("firebase-admin/firestore");
const users_aggregate_1 = require("./users.aggregate");
exports.rebuildUsersTrend = (0, firestore_1.onDocumentWritten)({
    document: "trend_jobs/users",
    region: "asia-northeast1",
}, async (event) => {
    var _a, _b;
    const db = (0, firestore_2.getFirestore)(); // ★ ここで取得
    const afterSnap = (_a = event.data) === null || _a === void 0 ? void 0 : _a.after;
    if (!afterSnap)
        return;
    const after = afterSnap.data();
    if (!(after === null || after === void 0 ? void 0 : after.needsRebuild))
        return;
    try {
        const cacheRef = db.doc("trend_cache/users");
        const cacheSnap = await cacheRef.get();
        const lastUpdated = cacheSnap.exists && cacheSnap.get("updatedAt")
            ? cacheSnap.get("updatedAt").toMillis()
            : 0;
        if (Date.now() - lastUpdated < 60000) {
            await afterSnap.ref.set({
                needsRebuild: false,
                skippedAt: firestore_2.Timestamp.now(),
            }, { merge: true });
            return;
        }
        await (0, users_aggregate_1.aggregateUsersTrend)();
        await afterSnap.ref.set({
            needsRebuild: false,
            rebuiltAt: firestore_2.Timestamp.now(),
            lastGameId: (_b = after.gameId) !== null && _b !== void 0 ? _b : null,
        }, { merge: true });
    }
    catch (err) {
        console.error("[rebuildUsersTrend] failed:", err);
        await afterSnap.ref.set({
            error: String(err),
            erroredAt: firestore_2.Timestamp.now(),
        }, { merge: true });
    }
});
//# sourceMappingURL=users.rebuild.js.map