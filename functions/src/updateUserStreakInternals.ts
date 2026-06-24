/** updateUserStreak から参照（循環 import 回避） */
import type { UpdatedUserStreakResult } from "./updateUserStreak";

export type { UpdatedUserStreakResult };

export function streakApplyMarkerRef(
  db: FirebaseFirestore.Firestore,
  gameId: string,
  uid: string
) {
  return db.doc(`games/${gameId}/streak_apply_v2/${uid}`);
}

export function streakResultFromUserSnap(
  uid: string,
  didWin: boolean,
  snap: FirebaseFirestore.DocumentSnapshot,
  sportKey: "basketball" | "football"
): UpdatedUserStreakResult {
  const sb = snap.get("streakBySport") as
    | { basketball?: number; football?: number }
    | undefined;
  const mb = snap.get("maxWinStreakBySport") as
    | { basketball?: number; football?: number }
    | undefined;

  let current = 0;
  let maxWin = 0;
  if (sportKey === "football") {
    current =
      typeof sb?.football === "number"
        ? sb.football
        : typeof snap.get("streakFootball") === "number"
          ? snap.get("streakFootball")
          : 0;
    maxWin =
      typeof mb?.football === "number"
        ? mb.football
        : typeof snap.get("maxWinStreakFootball") === "number"
          ? snap.get("maxWinStreakFootball")
          : 0;
  } else {
    current =
      typeof sb?.basketball === "number"
        ? sb.basketball
        : typeof snap.get("currentStreak") === "number"
          ? snap.get("currentStreak")
          : 0;
    maxWin =
      typeof mb?.basketball === "number"
        ? mb.basketball
        : typeof snap.get("maxWinStreak") === "number"
          ? snap.get("maxWinStreak")
          : 0;
  }

  const activeWinStreak = current > 0 ? current : 0;
  const maxLose = snap.get("maxLoseStreak") ?? 0;

  return {
    uid,
    didWin,
    currentStreak: current,
    activeWinStreak,
    maxWinStreak: maxWin,
    maxLoseStreak: maxLose,
  };
}
