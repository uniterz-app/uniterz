"use strict";
// functions/src/updateUserStreak.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserStreak = updateUserStreak;
const firestore_1 = require("firebase-admin/firestore");
const judgeWin_1 = require("./judgeWin");
async function updateUserStreak({ db, gameId, final, }) {
    const postsSnap = await db
        .collection("posts")
        .where("gameId", "==", gameId)
        .where("schemaVersion", "==", 2)
        .get();
    // ユーザーごとに1回だけ判定
    const userResult = new Map();
    postsSnap.docs.forEach((d) => {
        const p = d.data();
        if (!p.authorUid)
            return;
        if (userResult.has(p.authorUid))
            return;
        const isWin = (0, judgeWin_1.judgeWin)(p.prediction, final);
        userResult.set(p.authorUid, isWin);
    });
    const updatedMap = new Map();
    for (const [uid, didWin] of userResult.entries()) {
        const userRef = db.doc(`user_stats_v2/${uid}`);
        const cumulativeRef = db.doc(`cumulative_stats/${uid}`);
        const publicUserRef = db.doc(`users/${uid}`);
        const updated = await db.runTransaction(async (tx) => {
            var _a, _b, _c;
            const snap = await tx.get(userRef);
            let current = (_a = snap.get("currentStreak")) !== null && _a !== void 0 ? _a : 0;
            let maxWin = (_b = snap.get("maxWinStreak")) !== null && _b !== void 0 ? _b : 0;
            let maxLose = (_c = snap.get("maxLoseStreak")) !== null && _c !== void 0 ? _c : 0;
            if (didWin) {
                current = current > 0 ? current + 1 : 1;
                if (current > maxWin)
                    maxWin = current;
            }
            else {
                current = current < 0 ? current - 1 : -1;
                if (Math.abs(current) > maxLose) {
                    maxLose = Math.abs(current);
                }
            }
            const activeWinStreak = current > 0 ? current : 0;
            // user_stats_v2 更新（maxStreak はプロフィール等の既存名と揃えたエイリアス）
            tx.set(userRef, {
                currentStreak: current,
                maxWinStreak: maxWin,
                maxLoseStreak: maxLose,
                maxStreak: maxWin,
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            }, { merge: true });
            // 公開プロフィール（useProfile）と整合：試合確定と同時に連勝をミラー
            tx.set(publicUserRef, {
                currentStreak: current,
                maxStreak: maxWin,
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            }, { merge: true });
            // cumulative_stats 更新
            tx.set(cumulativeRef, {
                currentStreak: current,
                activeWinStreak,
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            }, { merge: true });
            return {
                uid,
                didWin,
                currentStreak: current,
                activeWinStreak,
                maxWinStreak: maxWin,
                maxLoseStreak: maxLose,
            };
        });
        updatedMap.set(uid, updated);
    }
    return updatedMap;
}
//# sourceMappingURL=updateUserStreak.js.map