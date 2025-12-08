"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onPostDeletedV2 = void 0;
// functions/src/onPostDeletedV2.ts
const firestore_1 = require("firebase-functions/v2/firestore");
const firestore_2 = require("firebase-admin/firestore");
const updateUserStatsV2_1 = require("./updateUserStatsV2");
exports.onPostDeletedV2 = (0, firestore_1.onDocumentDeleted)({
    document: "posts/{postId}",
    region: "asia-northeast1",
}, async (event) => {
    var _a, _b, _c, _d;
    const snap = event.data;
    if (!snap)
        return;
    const before = snap.data();
    if (!before)
        return;
    const uid = before.authorUid;
    const createdAt = before.createdAt;
    const stats = before.stats;
    if (!uid || !createdAt || !stats)
        return;
    const db = (0, firestore_2.getFirestore)();
    // ===== JSTの日付キー =====
    const d = createdAt.toDate();
    const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const yyyy = j.getUTCFullYear();
    const mm = String(j.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(j.getUTCDate()).padStart(2, "0");
    const dateKey = `${yyyy}-${mm}-${dd}`;
    const dailyRef = db.doc(`user_stats_v2_daily/${uid}_${dateKey}`);
    const postMarkerRef = dailyRef.collection("applied_posts").doc(snap.id);
    const isWin = stats.isWin === true;
    const scoreError = (_a = stats.scoreError) !== null && _a !== void 0 ? _a : 0;
    const brier = (_b = stats.brier) !== null && _b !== void 0 ? _b : 0;
    const upset = isWin ? ((_c = stats.upsetScore) !== null && _c !== void 0 ? _c : 0) : 0;
    const precision = (_d = stats.scorePrecision) !== null && _d !== void 0 ? _d : 0;
    // ===== daily の逆操作 =====
    await db.runTransaction(async (tx) => {
        var _a, _b;
        const dailySnap = await tx.get(dailyRef);
        if (!dailySnap.exists)
            return;
        const inc = {
            posts: firestore_2.FieldValue.increment(-1),
            wins: firestore_2.FieldValue.increment(isWin ? -1 : 0),
            scoreErrorSum: firestore_2.FieldValue.increment(-scoreError),
            brierSum: firestore_2.FieldValue.increment(-brier),
            upsetScoreSum: firestore_2.FieldValue.increment(-upset),
            scorePrecisionSum: firestore_2.FieldValue.increment(-precision),
            updatedAt: firestore_2.FieldValue.serverTimestamp(),
        };
        // all に適用
        tx.set(dailyRef, { all: inc }, { merge: true });
        // leagues に適用
        const leagueKey = (_b = (_a = before.game) === null || _a === void 0 ? void 0 : _a.league) !== null && _b !== void 0 ? _b : null;
        if (leagueKey) {
            tx.set(dailyRef, { leagues: { [leagueKey]: inc } }, { merge: true });
        }
        tx.delete(postMarkerRef);
    });
    // ===== user_stats_v2 の再計算 =====
    await (0, updateUserStatsV2_1.recomputeUserStatsV2FromDaily)(uid);
});
//# sourceMappingURL=onPostDeleted.js.map