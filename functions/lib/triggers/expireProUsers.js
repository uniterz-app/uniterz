"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expireProUsers = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firestore_1 = require("firebase-admin/firestore");
const firebase_1 = require("../firebase");
const db = firebase_1.admin.firestore();
/**
 * Pro期限切れユーザーを Free に戻す Cron
 * - 毎日 03:00 JST
 */
exports.expireProUsers = (0, scheduler_1.onSchedule)({
    schedule: "every day 03:00",
    timeZone: "Asia/Tokyo",
}, async () => {
    const now = firestore_1.Timestamp.now();
    const snap = await db
        .collection("users")
        .where("plan", "==", "pro")
        .where("cancelAtPeriodEnd", "==", true)
        .where("proUntil", "<=", now)
        .get();
    if (snap.empty)
        return;
    const batch = db.batch();
    snap.docs.forEach(doc => {
        batch.update(doc.ref, {
            plan: "free",
            planType: null,
            proUntil: null,
            cancelAtPeriodEnd: false,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
    });
    await batch.commit();
});
//# sourceMappingURL=expireProUsers.js.map