"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserStreak = updateUserStreak;
// functions/src/updateUserStreak.ts
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
        if (userResult.has(p.authorUid))
            return;
        const isWin = (0, judgeWin_1.judgeWin)(p.prediction, final);
        userResult.set(p.authorUid, isWin);
    });
    for (const [uid, didWin] of userResult.entries()) {
        const ref = db.doc(`user_stats_v2/${uid}`);
        await db.runTransaction(async (tx) => {
            var _a, _b, _c;
            const snap = await tx.get(ref);
            let current = (_a = snap.get("currentStreak")) !== null && _a !== void 0 ? _a : 0;
            let maxWin = (_b = snap.get("maxWinStreak")) !== null && _b !== void 0 ? _b : 0;
            let maxLose = (_c = snap.get("maxLoseStreak")) !== null && _c !== void 0 ? _c : 0;
            if (didWin) {
                // 勝ち
                current = current > 0 ? current + 1 : 1;
                if (current > maxWin)
                    maxWin = current;
            }
            else {
                // 負け
                current = current < 0 ? current - 1 : -1;
                if (Math.abs(current) > maxLose) {
                    maxLose = Math.abs(current);
                }
            }
            tx.set(ref, {
                currentStreak: current, // +連勝 / -連敗
                maxWinStreak: maxWin, // 最大連勝
                maxLoseStreak: maxLose, // 最大連敗
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            }, { merge: true });
        });
    }
}
//# sourceMappingURL=updateUserStreak.js.map