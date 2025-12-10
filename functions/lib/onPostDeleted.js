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
    const stats = before.stats; // 確定投稿のみ存在
    if (!uid || !createdAt)
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
    // ===== ① stats がない（未確定投稿） → 投稿数だけ -1 =====
    if (!stats) {
        await db.runTransaction(async (tx) => {
            var _a;
            const dailySnap = await tx.get(dailyRef);
            if (!dailySnap.exists)
                return;
            const dec = {
                posts: firestore_2.FieldValue.increment(-1),
                createdPosts: firestore_2.FieldValue.increment(-1),
                updatedAt: firestore_2.FieldValue.serverTimestamp(),
            };
            // all
            tx.set(dailyRef, { all: dec }, { merge: true });
            // league（before.game.league があれば）
            const leagueKey = (_a = before.league) !== null && _a !== void 0 ? _a : null;
            if (leagueKey) {
                tx.set(dailyRef, { leagues: { [leagueKey]: dec } }, { merge: true });
            }
        });
        // 集計再計算
        await (0, updateUserStatsV2_1.recomputeUserStatsV2FromDaily)(uid);
        return; // ★ ここで終了
    }
    // ===== ② stats がある（確定投稿） → 今まで通り精度の逆操作 =====
    const isWin = stats.isWin === true;
    const scoreError = (_a = stats.scoreError) !== null && _a !== void 0 ? _a : 0;
    const brier = (_b = stats.brier) !== null && _b !== void 0 ? _b : 0;
    const upset = isWin ? ((_c = stats.upsetScore) !== null && _c !== void 0 ? _c : 0) : 0;
    const precision = (_d = stats.scorePrecision) !== null && _d !== void 0 ? _d : 0;
    await db.runTransaction(async (tx) => {
        var _a;
        const dailySnap = await tx.get(dailyRef);
        if (!dailySnap.exists)
            return;
        const inc = {
            posts: firestore_2.FieldValue.increment(-1),
            createdPosts: firestore_2.FieldValue.increment(-1),
            wins: firestore_2.FieldValue.increment(isWin ? -1 : 0),
            scoreErrorSum: firestore_2.FieldValue.increment(-scoreError),
            brierSum: firestore_2.FieldValue.increment(-brier),
            upsetScoreSum: firestore_2.FieldValue.increment(-upset),
            scorePrecisionSum: firestore_2.FieldValue.increment(-precision),
            updatedAt: firestore_2.FieldValue.serverTimestamp(),
        };
        tx.set(dailyRef, { all: inc }, { merge: true });
        const leagueKey = (_a = before.league) !== null && _a !== void 0 ? _a : null;
        if (leagueKey) {
            tx.set(dailyRef, { leagues: { [leagueKey]: inc } }, { merge: true });
        }
        tx.delete(postMarkerRef);
    });
    await (0, updateUserStatsV2_1.recomputeUserStatsV2FromDaily)(uid);
});
//# sourceMappingURL=onPostDeleted.js.map