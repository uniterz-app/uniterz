"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logUserActive = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
exports.logUserActive = (0, https_1.onCall)(async (req) => {
    var _a;
    const uid = (_a = req.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!uid)
        return { ok: false, error: "unauthenticated" };
    const db = (0, firestore_1.getFirestore)();
    const today = new Date();
    const dateKey = today.toISOString().slice(0, 10); // 例: "2025-12-04"
    // /activityLogs/{uid}_{date}
    await db
        .collection("activityLogs")
        .doc(`${uid}_${dateKey}`)
        .set({
        uid,
        date: dateKey,
        lastActiveAt: Date.now(),
    }, { merge: true });
    return { ok: true };
});
//# sourceMappingURL=logUserActive.js.map