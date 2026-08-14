// functions/src/updateUserStreak.ts

import { FieldValue } from "firebase-admin/firestore";
import { predictionWin } from "./predictionWin";
import type { SettlementGameInput } from "./settlementGame";
import { leagueToSport } from "./settlementGame";
import {
  streakApplyMarkerRef,
  streakResultFromUserSnap,
} from "./updateUserStreakInternals";
import { nbaSeasonKeyFromDateJST } from "./rankings/nbaSeason";

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

function toGameStartDate(v: unknown): Date | null {
  if (v && typeof v === "object" && typeof (v as { toDate?: () => Date }).toDate === "function") {
    try {
      return (v as { toDate: () => Date }).toDate();
    } catch {
      return null;
    }
  }
  if (v instanceof Date && Number.isFinite(v.getTime())) return v;
  if (typeof v === "number" && Number.isFinite(v)) return new Date(v);
  return null;
}

export async function updateUserStreak({
  db,
  gameId,
  settlementGame,
  postsSnap: postsSnapInput,
}: {
  db: FirebaseFirestore.Firestore;
  gameId: string;
  settlementGame: SettlementGameInput;
  /** fetchGameContext で取得済みの posts — 省略時のみ再クエリ */
  postsSnap?: FirebaseFirestore.QuerySnapshot;
}): Promise<Map<string, UpdatedUserStreakResult>> {
  const postsSnap =
    postsSnapInput ??
    (await db
      .collection("posts")
      .where("gameId", "==", gameId)
      .where("schemaVersion", "==", 2)
      .get());

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

  const sportKey = leagueToSport(settlementGame.league);
  const basketballSeasonKey = nbaSeasonKeyFromDateJST(
    toGameStartDate(gameSnap.get("startAt")) ??
      toGameStartDate(gameSnap.get("startAtMs")) ??
      new Date()
  );

  if (suppressStreakForGame) {
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
          return streakResultFromUserSnap(uid, didWin, snap, sportKey);
        }

        const snap = await tx.get(userRef);

        let maxLose = snap.get("maxLoseStreak") ?? 0;

        const st = migrateStreakBySport(snap);
        let curB = st.basketball;
        let curF = st.football;
        let maxB = st.maxBasketball;
        let maxF = st.maxFootball;

        /** NBA 連勝はシーズンをまたがない（26-27 に前シーズンを持ち込まない） */
        if (sportKey === "basketball") {
          const storedSeason = String(snap.get("streakSeasonKeyBasketball") ?? "");
          if (storedSeason !== basketballSeasonKey) {
            curB = 0;
          }
        }

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
        const basketballSeasonPatch =
          sportKey === "basketball"
            ? { streakSeasonKeyBasketball: basketballSeasonKey }
            : {};

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
            ...basketballSeasonPatch,
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
            ...basketballSeasonPatch,
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
            ...basketballSeasonPatch,
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

  return updatedMap;
}
