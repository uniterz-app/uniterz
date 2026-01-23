// functions/src/updateUserStreak.ts
import { FieldValue } from "firebase-admin/firestore";
import { judgeWin } from "./judgeWin";

export async function updateUserStreak({
  db,
  gameId,
  final,
}: {
  db: FirebaseFirestore.Firestore;
  gameId: string;
  final: { home: number; away: number };
}) {
  const postsSnap = await db
    .collection("posts")
    .where("gameId", "==", gameId)
    .where("schemaVersion", "==", 2)
    .get();

  // ユーザーごとに1回だけ判定
  const userResult = new Map<string, boolean>();

  postsSnap.docs.forEach((d) => {
    const p = d.data();
    if (userResult.has(p.authorUid)) return;

    const isWin = judgeWin(p.prediction, final);
    userResult.set(p.authorUid, isWin);
  });

  for (const [uid, didWin] of userResult.entries()) {
    const ref = db.doc(`user_stats_v2/${uid}`);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);

      let current = snap.get("currentStreak") ?? 0;
      let maxWin = snap.get("maxWinStreak") ?? 0;
      let maxLose = snap.get("maxLoseStreak") ?? 0;

      if (didWin) {
        // 勝ち
        current = current > 0 ? current + 1 : 1;
        if (current > maxWin) maxWin = current;
      } else {
        // 負け
        current = current < 0 ? current - 1 : -1;
        if (Math.abs(current) > maxLose) {
          maxLose = Math.abs(current);
        }
      }

      tx.set(
        ref,
        {
          currentStreak: current,      // +連勝 / -連敗
          maxWinStreak: maxWin,        // 最大連勝
          maxLoseStreak: maxLose,      // 最大連敗
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });
  }
}
