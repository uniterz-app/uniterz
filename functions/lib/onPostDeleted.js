"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onPostDeletedV2 = void 0;
// functions/src/onPostDeletedV2.ts
const firestore_1 = require("firebase-functions/v2/firestore");
const firestore_2 = require("firebase-admin/firestore");
exports.onPostDeletedV2 = (0, firestore_1.onDocumentDeleted)({
    document: "posts/{postId}",
    region: "asia-northeast1",
}, async (event) => {
    var _a, _b, _c, _d, _e, _f;
    const snap = event.data;
    if (!snap)
        return;
    const before = snap.data();
    if (!before)
        return;
    const uid = before.authorUid;
    const stats = before.stats; // 確定投稿なら存在
    const startAt = (_b = (_a = before.startAtJst) !== null && _a !== void 0 ? _a : before.startAt) !== null && _b !== void 0 ? _b : before.createdAt;
    if (!uid || !startAt)
        return;
    const db = (0, firestore_2.getFirestore)();
    // JST dateKey
    const d = startAt.toDate();
    const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const yyyy = j.getUTCFullYear();
    const mm = String(j.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(j.getUTCDate()).padStart(2, "0");
    const dateKey = `${yyyy}-${mm}-${dd}`;
    const dailyRef = db.doc(`user_stats_v2_daily/${uid}_${dateKey}`);
    const markerRef = dailyRef.collection("applied_posts").doc(snap.id);
    // stats が無い → 未確定投稿 → posts だけ減らす
    if (!stats) {
        await db.runTransaction(async (tx) => {
            var _a;
            const dailySnap = await tx.get(dailyRef);
            if (!dailySnap.exists)
                return;
            const dec = {
                posts: firestore_2.FieldValue.increment(-1),
                updatedAt: firestore_2.FieldValue.serverTimestamp(),
            };
            tx.set(dailyRef, { all: dec }, { merge: true });
            const leagueKey = (_a = before.league) !== null && _a !== void 0 ? _a : null;
            if (leagueKey) {
                tx.set(dailyRef, { leagues: { [leagueKey]: dec } }, { merge: true });
            }
            tx.delete(markerRef);
        });
        return;
    }
    // stats がある → 確定投稿 → apply の逆操作
    const isWin = stats.isWin === true;
    const scoreError = (_c = stats.scoreError) !== null && _c !== void 0 ? _c : 0;
    const brier = (_d = stats.brier) !== null && _d !== void 0 ? _d : 0;
    const upset = isWin ? ((_e = stats.upsetScore) !== null && _e !== void 0 ? _e : 0) : 0;
    const precision = (_f = stats.scorePrecision) !== null && _f !== void 0 ? _f : 0;
    await db.runTransaction(async (tx) => {
        var _a;
        const dailySnap = await tx.get(dailyRef);
        if (!dailySnap.exists)
            return;
        const dec = {
            posts: firestore_2.FieldValue.increment(-1),
            wins: firestore_2.FieldValue.increment(isWin ? -1 : 0),
            scoreErrorSum: firestore_2.FieldValue.increment(-scoreError),
            brierSum: firestore_2.FieldValue.increment(-brier),
            upsetScoreSum: firestore_2.FieldValue.increment(-upset),
            scorePrecisionSum: firestore_2.FieldValue.increment(-precision),
            updatedAt: firestore_2.FieldValue.serverTimestamp(),
        };
        tx.set(dailyRef, { all: dec }, { merge: true });
        const leagueKey = (_a = before.league) !== null && _a !== void 0 ? _a : null;
        if (leagueKey) {
            tx.set(dailyRef, { leagues: { [leagueKey]: dec } }, { merge: true });
        }
        tx.delete(markerRef);
    });
});
//# sourceMappingURL=onPostDeleted.js.map