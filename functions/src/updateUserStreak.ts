// functions/src/updateUserStreak.ts

import { FieldValue } from "firebase-admin/firestore";
import { judgeWin } from "./judgeWin";

export type UpdatedUserStreakResult = {
  uid: string;
  didWin: boolean;
  currentStreak: number;
  activeWinStreak: number;
  maxWinStreak: number;
  maxLoseStreak: number;
};

export async function updateUserStreak({
  db,
  gameId,
  final,
}: {
  db: FirebaseFirestore.Firestore;
  gameId: string;
  final: { home: number; away: number };
}): Promise<Map<string, UpdatedUserStreakResult>> {
  const postsSnap = await db
    .collection("posts")
    .where("gameId", "==", gameId)
    .where("schemaVersion", "==", 2)
    .get();

  // ユーザーごとに1回だけ判定
  const userResult = new Map<string, boolean>();

  postsSnap.docs.forEach((d) => {
    const p = d.data();
    if (!p.authorUid) return;
    if (userResult.has(p.authorUid)) return;

    const isWin = judgeWin(p.prediction, final);
    userResult.set(p.authorUid, isWin);
  });

  const updatedMap = new Map<string, UpdatedUserStreakResult>();

  for (const [uid, didWin] of userResult.entries()) {
    const userRef = db.doc(`user_stats_v2/${uid}`);
    const cumulativeRef = db.doc(`cumulative_stats/${uid}`);
    const publicUserRef = db.doc(`users/${uid}`);

    const updated = await db.runTransaction<UpdatedUserStreakResult>(
      async (tx) => {
        const snap = await tx.get(userRef);

        let current = snap.get("currentStreak") ?? 0;
        let maxWin = snap.get("maxWinStreak") ?? 0;
        let maxLose = snap.get("maxLoseStreak") ?? 0;

        if (didWin) {
          current = current > 0 ? current + 1 : 1;
          if (current > maxWin) maxWin = current;
        } else {
          current = current < 0 ? current - 1 : -1;
          if (Math.abs(current) > maxLose) {
            maxLose = Math.abs(current);
          }
        }

        const activeWinStreak = current > 0 ? current : 0;

        // user_stats_v2 更新（maxStreak はプロフィール等の既存名と揃えたエイリアス）
        tx.set(
          userRef,
          {
            currentStreak: current,
            maxWinStreak: maxWin,
            maxLoseStreak: maxLose,
            maxStreak: maxWin,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        // 公開プロフィール（useProfile）と整合：試合確定と同時に連勝をミラー
        tx.set(
          publicUserRef,
          {
            currentStreak: current,
            maxStreak: maxWin,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        // cumulative_stats 更新
        tx.set(
          cumulativeRef,
          {
            currentStreak: current,
            activeWinStreak,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        return {
          uid,
          didWin,
          currentStreak: current,
          activeWinStreak,
          maxWinStreak: maxWin,
          maxLoseStreak: maxLose,
        };
      }
    );

    updatedMap.set(uid, updated);
  }

  return updatedMap;
}