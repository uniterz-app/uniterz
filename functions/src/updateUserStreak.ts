// functions/src/updateUserStreak.ts

import { FieldValue } from "firebase-admin/firestore";
import { judgeWin } from "./judgeWin";

/**
 * games/{gameId}: set `suppressStreakIncrementV2: true` to skip all streak writes for that game (no stats updates, no per-user markers).
 * Typical use: after the first streak apply, flip this on before re-finalizing to avoid a second increment.
 * If true before the first finalize, this game never updates streaks.
 */
export const SUPPRESS_STREAK_INCREMENT_V2_FIELD = "suppressStreakIncrementV2";

export type UpdatedUserStreakResult = {
  uid: string;
  didWin: boolean;
  currentStreak: number;
  activeWinStreak: number;
  maxWinStreak: number;
  maxLoseStreak: number;
};

function streakResultFromUserSnap(
  uid: string,
  didWin: boolean,
  snap: FirebaseFirestore.DocumentSnapshot
): UpdatedUserStreakResult {
  const current = snap.get("currentStreak") ?? 0;
  const maxWin = snap.get("maxWinStreak") ?? 0;
  const maxLose = snap.get("maxLoseStreak") ?? 0;
  const activeWinStreak = current > 0 ? current : 0;
  return {
    uid,
    didWin,
    currentStreak: current,
    activeWinStreak,
    maxWinStreak: maxWin,
    maxLoseStreak: maxLose,
  };
}

/** 試合ごとの連勝反映済み（onGameFinalV2再実行時の二重加算防止） */
function streakApplyMarkerRef(
  db: FirebaseFirestore.Firestore,
  gameId: string,
  uid: string
) {
  return db.doc(`games/${gameId}/streak_apply_v2/${uid}`);
}

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

  const gameSnap = await db.doc(`games/${gameId}`).get();
  const suppressStreakForGame =
    gameSnap.get(SUPPRESS_STREAK_INCREMENT_V2_FIELD) === true;

  if (suppressStreakForGame) {
    const entries = [...userResult.entries()];
    await Promise.all(
      entries.map(async ([uid, didWin]) => {
        const snap = await db.doc(`user_stats_v2/${uid}`).get();
        updatedMap.set(uid, streakResultFromUserSnap(uid, didWin, snap));
      })
    );
    return updatedMap;
  }

  for (const [uid, didWin] of userResult.entries()) {
    const userRef = db.doc(`user_stats_v2/${uid}`);
    const cumulativeRef = db.doc(`cumulative_stats/${uid}`);
    const publicUserRef = db.doc(`users/${uid}`);
    const markerRef = streakApplyMarkerRef(db, gameId, uid);

    const updated = await db.runTransaction<UpdatedUserStreakResult>(
      async (tx) => {
        const markerSnap = await tx.get(markerRef);
        if (markerSnap.exists) {
          const snap = await tx.get(userRef);
          return streakResultFromUserSnap(uid, didWin, snap);
        }

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

        tx.set(markerRef, {
          appliedAt: FieldValue.serverTimestamp(),
        });

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