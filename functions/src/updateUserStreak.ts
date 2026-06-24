// functions/src/updateUserStreak.ts

import { FieldValue } from "firebase-admin/firestore";
import { predictionWin } from "./predictionWin";
import type { SettlementGameInput } from "./settlementGame";
import { leagueToSport } from "./settlementGame";
import {
  applyWcSlotStreakWhenComplete,
  isWcLeague,
  resolveTriggerKickoffMs,
  rescoreEarlierWcSlotPosts,
  wcSlotActiveForUser,
  wcSlotStreakDeferredMap,
  type WcSlotStreakApplyResult,
} from "./wc/wcSlotStreak";
import {
  streakApplyMarkerRef,
  streakResultFromUserSnap,
} from "./updateUserStreakInternals";

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

type StreakBySportState = {
  basketball: number;
  football: number;
  maxBasketball: number;
  maxFootball: number;
};

function migrateStreakBySport(
  snap: FirebaseFirestore.DocumentSnapshot
): StreakBySportState {
  const sb = snap.get("streakBySport") as
    | { basketball?: number; football?: number }
    | undefined;
  const mb = snap.get("maxWinStreakBySport") as
    | { basketball?: number; football?: number }
    | undefined;

  if (sb && typeof sb === "object") {
    return {
      basketball: Number(sb.basketball ?? 0),
      football: Number(sb.football ?? 0),
      maxBasketball:
        typeof mb?.basketball === "number"
          ? mb.basketball
          : Number(snap.get("maxWinStreak") ?? 0),
      maxFootball:
        typeof mb?.football === "number" ? mb.football : 0,
    };
  }

  const legacy = snap.get("currentStreak") ?? 0;
  const maxLegacy = snap.get("maxWinStreak") ?? 0;
  return {
    basketball: typeof legacy === "number" ? legacy : 0,
    football: 0,
    maxBasketball: typeof maxLegacy === "number" ? maxLegacy : 0,
    maxFootball: 0,
  };
}

export type UpdateUserStreakOutcome = {
  streakResultMap: Map<string, UpdatedUserStreakResult>;
  wcSlotRescore: Pick<WcSlotStreakApplyResult, "perUserPerGameActive"> | null;
};

export async function updateUserStreak({
  db,
  gameId,
  settlementGame,
}: {
  db: FirebaseFirestore.Firestore;
  gameId: string;
  settlementGame: SettlementGameInput;
}): Promise<UpdateUserStreakOutcome> {
  const postsSnap = await db
    .collection("posts")
    .where("gameId", "==", gameId)
    .where("schemaVersion", "==", 2)
    .get();

  const userResult = new Map<string, boolean>();

  postsSnap.docs.forEach((d) => {
    const p = d.data();
    if (!p.authorUid) return;
    if (userResult.has(p.authorUid)) return;

    const isWin = predictionWin(p.prediction, settlementGame);
    userResult.set(p.authorUid, isWin);
  });

  const updatedMap = new Map<string, UpdatedUserStreakResult>();

  const gameSnap = await db.doc(`games/${gameId}`).get();
  const suppressStreakForGame =
    gameSnap.get(SUPPRESS_STREAK_INCREMENT_V2_FIELD) === true;

  if (suppressStreakForGame) {
    const sportKey = leagueToSport(settlementGame.league);
    const entries = [...userResult.entries()];
    await Promise.all(
      entries.map(async ([uid, didWin]) => {
        const snap = await db.doc(`user_stats_v2/${uid}`).get();
        updatedMap.set(
          uid,
          streakResultFromUserSnap(uid, didWin, snap, sportKey)
        );
      })
    );
    return { streakResultMap: updatedMap, wcSlotRescore: null };
  }

  const sportKey = leagueToSport(settlementGame.league);

  /** WC: 同時キックオフスロット単位で連勝を一括反映 */
  if (sportKey === "football" && isWcLeague(settlementGame.league)) {
    const kickoffMs = resolveTriggerKickoffMs(gameSnap);
    if (kickoffMs != null) {
      const { resultMap, perUserPerGameActive, slotCompleted } =
        await applyWcSlotStreakWhenComplete(
          db,
          gameId,
          kickoffMs,
          userResult
        );

      for (const [uid, base] of resultMap) {
        const active = wcSlotActiveForUser(
          perUserPerGameActive,
          uid,
          gameId,
          base.activeWinStreak
        );
        updatedMap.set(uid, {
          ...base,
          activeWinStreak: active,
        });
      }
      return {
        streakResultMap: updatedMap,
        wcSlotRescore: slotCompleted
          ? { perUserPerGameActive }
          : null,
      };
    }

    const deferred = await wcSlotStreakDeferredMap(db, userResult);
    deferred.forEach((v, k) => updatedMap.set(k, v));
    return { streakResultMap: updatedMap, wcSlotRescore: null };
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
          return streakResultFromUserSnap(uid, didWin, snap, sportKey);
        }

        const snap = await tx.get(userRef);

        let maxLose = snap.get("maxLoseStreak") ?? 0;

        const st = migrateStreakBySport(snap);
        let curB = st.basketball;
        let curF = st.football;
        let maxB = st.maxBasketball;
        let maxF = st.maxFootball;

        if (sportKey === "football") {
          if (didWin) {
            curF = curF > 0 ? curF + 1 : 1;
            if (curF > maxF) maxF = curF;
          } else {
            curF = curF < 0 ? curF - 1 : -1;
            if (Math.abs(curF) > maxLose) {
              maxLose = Math.abs(curF);
            }
          }
        } else {
          if (didWin) {
            curB = curB > 0 ? curB + 1 : 1;
            if (curB > maxB) maxB = curB;
          } else {
            curB = curB < 0 ? curB - 1 : -1;
            if (Math.abs(curB) > maxLose) {
              maxLose = Math.abs(curB);
            }
          }
        }

        const activeWinStreak =
          sportKey === "football"
            ? curF > 0
              ? curF
              : 0
            : curB > 0
              ? curB
              : 0;

        const currentForSport = sportKey === "football" ? curF : curB;
        const activeWinStreakBasketball = curB > 0 ? curB : 0;
        const activeWinStreakFootball = curF > 0 ? curF : 0;

        tx.set(
          userRef,
          {
            streakBySport: { basketball: curB, football: curF },
            maxWinStreakBySport: { basketball: maxB, football: maxF },
            currentStreak: curB,
            streakFootball: curF,
            maxWinStreak: maxB,
            maxWinStreakFootball: maxF,
            maxLoseStreak: maxLose,
            maxStreak: maxB,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        tx.set(
          publicUserRef,
          {
            streakBySport: { basketball: curB, football: curF },
            currentStreak: curB,
            streakFootball: curF,
            maxStreak: maxB,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        tx.set(
          cumulativeRef,
          {
            streakBySport: { basketball: curB, football: curF },
            currentStreak: curB,
            streakFootball: curF,
            activeWinStreak,
            activeWinStreakBasketball,
            activeWinStreakFootball,
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
          currentStreak: currentForSport,
          activeWinStreak,
          maxWinStreak: sportKey === "football" ? maxF : maxB,
          maxLoseStreak: maxLose,
        };
      }
    );

    updatedMap.set(uid, updated);
  }

  return { streakResultMap: updatedMap, wcSlotRescore: null };
}
