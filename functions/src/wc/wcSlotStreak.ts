import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { calcStreakBonus } from "../calcStreakBonus";
import { predictionWin } from "../predictionWin";
import type { SettlementGameInput } from "../settlementGame";
import type { UpdatedUserStreakResult } from "../updateUserStreak";
import { streakApplyMarkerRef } from "../updateUserStreakInternals";
import { resolveWcStageFromGame } from "./resolveWcStage";
import {
  computeWcSlotStreakOutcome,
  resolveKickoffMsFromFields,
  type WcKickoffSlotGameOutcome,
} from "./wcKickoffSlot";
import { replayFootballEntryBeforeKickoff } from "./wcSlotStreakEntry";

type SlotGameDoc = {
  id: string;
  final: boolean;
  data: FirebaseFirestore.DocumentData;
};

function toTimestamp(kickoffMs: number): Timestamp {
  return Timestamp.fromMillis(kickoffMs);
}

function toDateKeyJST(ts: Timestamp): string {
  const d = ts.toDate();
  const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const yyyy = j.getUTCFullYear();
  const mm = String(j.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(j.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function migrateEntryCurF(snap: FirebaseFirestore.DocumentSnapshot): number {
  const sb = snap.get("streakBySport") as
    | { football?: number }
    | undefined;
  if (sb && typeof sb.football === "number") return sb.football;
  const legacy = snap.get("streakFootball");
  if (typeof legacy === "number") return legacy;
  return 0;
}

function migrateMaxFootball(snap: FirebaseFirestore.DocumentSnapshot): number {
  const mb = snap.get("maxWinStreakBySport") as
    | { football?: number }
    | undefined;
  if (typeof mb?.football === "number") return mb.football;
  const legacy = snap.get("maxWinStreakFootball");
  if (typeof legacy === "number") return legacy;
  return 0;
}

function migrateBasketballState(snap: FirebaseFirestore.DocumentSnapshot) {
  const sb = snap.get("streakBySport") as
    | { basketball?: number }
    | undefined;
  const mb = snap.get("maxWinStreakBySport") as
    | { basketball?: number }
    | undefined;
  return {
    basketball:
      typeof sb?.basketball === "number"
        ? sb.basketball
        : typeof snap.get("currentStreak") === "number"
          ? snap.get("currentStreak")
          : 0,
    maxBasketball:
      typeof mb?.basketball === "number"
        ? mb.basketball
        : typeof snap.get("maxWinStreak") === "number"
          ? snap.get("maxWinStreak")
          : 0,
  };
}

export async function loadWcGamesInKickoffSlot(
  db: FirebaseFirestore.Firestore,
  kickoffMs: number
): Promise<SlotGameDoc[]> {
  const snap = await db
    .collection("games")
    .where("league", "==", "wc")
    .where("startAtJst", "==", toTimestamp(kickoffMs))
    .get();

  const games = snap.docs.map((doc) => ({
    id: doc.id,
    final: doc.get("final") === true,
    data: doc.data(),
  }));

  return refreshSlotGamesFinal(db, games);
}

async function refreshSlotGamesFinal(
  db: FirebaseFirestore.Firestore,
  slotGames: SlotGameDoc[]
): Promise<SlotGameDoc[]> {
  if (slotGames.length === 0) return slotGames;

  return Promise.all(
    slotGames.map(async (game) => {
      const snap = await db.doc(`games/${game.id}`).get();
      if (!snap.exists) return game;
      return {
        id: game.id,
        final: snap.get("final") === true,
        data: snap.data()!,
      };
    })
  );
}

function activeForTriggerGame(
  slotOutcome: ReturnType<typeof computeWcSlotStreakOutcome>,
  triggerGameId: string
): number {
  return (
    slotOutcome.perGameActiveWinStreak.get(triggerGameId) ??
    slotOutcome.finalActiveWinStreak
  );
}

function resultFromSlotOutcome(
  uid: string,
  didWin: boolean,
  snap: FirebaseFirestore.DocumentSnapshot,
  slotOutcome: ReturnType<typeof computeWcSlotStreakOutcome>,
  triggerGameId: string
): UpdatedUserStreakResult {
  const maxF = migrateMaxFootball(snap);
  const maxLose = snap.get("maxLoseStreak") ?? 0;
  return {
    uid,
    didWin,
    currentStreak: slotOutcome.finalCurF,
    activeWinStreak: activeForTriggerGame(slotOutcome, triggerGameId),
    maxWinStreak: Math.max(maxF, slotOutcome.finalActiveWinStreak),
    maxLoseStreak: maxLose,
  };
}

function buildSettlementGame(
  data: FirebaseFirestore.DocumentData
): SettlementGameInput | null {
  const homeScore = data.homeScore;
  const awayScore = data.awayScore;
  if (homeScore == null || awayScore == null) return null;
  return {
    homeScore,
    awayScore,
    league: data.league,
    homeTeamId: data.homeTeamId,
    awayTeamId: data.awayTeamId,
    regulationEtScore: data.regulationEtScore ?? null,
    advancingTeamId: data.advancingTeamId ?? null,
    knockout: data.knockout === true,
    goalScorers: data.goalScorers,
  };
}

async function loadUserOutcomesInSlot(
  db: FirebaseFirestore.Firestore,
  slotGameIds: string[]
): Promise<Map<string, WcKickoffSlotGameOutcome[]>> {
  const perUser = new Map<string, WcKickoffSlotGameOutcome[]>();
  if (slotGameIds.length === 0) return perUser;

  for (const gameId of slotGameIds) {
    const gameSnap = await db.doc(`games/${gameId}`).get();
    if (!gameSnap.exists) continue;
    const settlement = buildSettlementGame(gameSnap.data()!);
    if (!settlement) continue;

    const postsSnap = await db
      .collection("posts")
      .where("gameId", "==", gameId)
      .where("schemaVersion", "==", 2)
      .get();

    postsSnap.docs.forEach((doc) => {
      const p = doc.data();
      const uid = String(p.authorUid ?? "").trim();
      if (!uid) return;
      const list = perUser.get(uid) ?? [];
      if (list.some((o) => o.gameId === gameId)) return;
      list.push({
        gameId,
        didWin: predictionWin(p.prediction, settlement),
      });
      perUser.set(uid, list);
    });
  }

  return perUser;
}

function deferredResultFromSnap(
  uid: string,
  didWin: boolean,
  snap: FirebaseFirestore.DocumentSnapshot
): UpdatedUserStreakResult {
  const curF = migrateEntryCurF(snap);
  const maxF = migrateMaxFootball(snap);
  const active = curF > 0 ? curF : 0;
  const maxLose = snap.get("maxLoseStreak") ?? 0;
  return {
    uid,
    didWin,
    currentStreak: curF,
    activeWinStreak: active,
    maxWinStreak: maxF,
    maxLoseStreak: maxLose,
  };
}

/** スロット未確定: DB は更新せず、ボーナス用に現状連勝を返す */
export async function wcSlotStreakDeferredMap(
  db: FirebaseFirestore.Firestore,
  userResult: Map<string, boolean>
): Promise<Map<string, UpdatedUserStreakResult>> {
  const out = new Map<string, UpdatedUserStreakResult>();
  await Promise.all(
    [...userResult.entries()].map(async ([uid, didWin]) => {
      const snap = await db.doc(`user_stats_v2/${uid}`).get();
      out.set(uid, deferredResultFromSnap(uid, didWin, snap));
    })
  );
  return out;
}

async function patchPostStreakFields(
  db: FirebaseFirestore.Firestore,
  postRef: FirebaseFirestore.DocumentReference,
  activeWinStreak: number,
  streakBonus: number,
  pointsV3: number
) {
  const snap = await postRef.get();
  if (!snap.exists) return { dPoints: 0, dStreakBonus: 0, dateKey: null as string | null, wcStage: null as string | null };

  const post = snap.data()!;
  const stats = (post.stats ?? {}) as Record<string, unknown>;
  const detail = (stats.pointsV3Detail ?? {}) as Record<string, unknown>;
  const storedPoints = Number(stats.pointsV3 ?? 0);
  const storedBonus = Number(stats.streakBonus ?? 0);
  const dPoints = pointsV3 - storedPoints;
  const dStreakBonus = streakBonus - storedBonus;

  if (dPoints === 0 && dStreakBonus === 0 && Number(detail.activeWinStreak ?? 0) === activeWinStreak) {
    return { dPoints: 0, dStreakBonus: 0, dateKey: null, wcStage: null };
  }

  await postRef.update({
    stats: {
      ...stats,
      streakBonus,
      pointsV3,
      pointsV3Detail: {
        ...detail,
        streakBonus,
        activeWinStreak,
      },
    },
    updatedAt: FieldValue.serverTimestamp(),
  });

  const gameId = String(post.gameId ?? "");
  const gameSnap = gameId ? await db.doc(`games/${gameId}`).get() : null;
  const game = gameSnap?.exists ? gameSnap.data()! : null;
  const startAt =
    (post.startAtJst as Timestamp | undefined) ??
    (post.startAt as Timestamp | undefined) ??
    (game?.startAtJst as Timestamp | undefined) ??
    (game?.startAt as Timestamp | undefined) ??
    null;
  const dateKey = startAt ? toDateKeyJST(startAt) : null;
  const wcStage = game
    ? resolveWcStageFromGame({
        knockout: game.knockout === true,
        roundLabel: typeof game.roundLabel === "string" ? game.roundLabel : null,
        wcStage: typeof game.wcStage === "string" ? game.wcStage : null,
      })
    : null;

  return { dPoints, dStreakBonus, dateKey, wcStage };
}

async function applyDailyStreakDeltas(
  db: FirebaseFirestore.Firestore,
  uid: string,
  dailyDeltas: Map<string, { dPoints: number; dStreakBonus: number; wcStage: string | null }>
) {
  const cumulativeRef = db.doc(`cumulative_stats/${uid}`);
  let cumulativeDPoints = 0;
  let cumulativeDStreakBonus = 0;
  const wcStageIncrements = new Map<string, { dPoints: number; dStreakBonus: number }>();

  for (const [dateKey, { dPoints, dStreakBonus, wcStage }] of dailyDeltas) {
    if (dPoints === 0 && dStreakBonus === 0) continue;

    cumulativeDPoints += dPoints;
    cumulativeDStreakBonus += dStreakBonus;

    const dailyRef = db.doc(`user_stats_v2_daily/${uid}_${dateKey}`);
    const inc: Record<string, FirebaseFirestore.FieldValue> = {};
    if (dPoints !== 0) inc.pointsSumV3 = FieldValue.increment(dPoints);
    if (dStreakBonus !== 0) inc.streakBonusSum = FieldValue.increment(dStreakBonus);
    const patch: Record<string, unknown> = {
      date: dateKey,
      updatedAt: FieldValue.serverTimestamp(),
      all: inc,
      ranking: inc,
    };
    if (wcStage) {
      patch.rankingByWcStage = {
        overall: inc,
        ...(wcStage === "qualifying" ? { qualifying: inc } : {}),
        ...(wcStage === "main" ? { main: inc } : {}),
      };
      for (const stage of ["overall", wcStage]) {
        const prev = wcStageIncrements.get(stage) ?? { dPoints: 0, dStreakBonus: 0 };
        wcStageIncrements.set(stage, {
          dPoints: prev.dPoints + dPoints,
          dStreakBonus: prev.dStreakBonus + dStreakBonus,
        });
      }
    }
    await dailyRef.set(patch, { merge: true });
  }

  if (cumulativeDPoints === 0 && cumulativeDStreakBonus === 0) return;

  const cumulativePatch: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
    cumulativeLiveUpdates: true,
  };
  if (cumulativeDPoints !== 0) {
    cumulativePatch.totalPoints = FieldValue.increment(cumulativeDPoints);
    cumulativePatch["ranking.totalPoints"] = FieldValue.increment(cumulativeDPoints);
  }
  if (cumulativeDStreakBonus !== 0) {
    cumulativePatch.streakBonusSum = FieldValue.increment(cumulativeDStreakBonus);
    cumulativePatch["ranking.streakBonusSum"] =
      FieldValue.increment(cumulativeDStreakBonus);
  }
  for (const [stage, { dPoints, dStreakBonus }] of wcStageIncrements) {
    const w = `rankingByWcStage.${stage}`;
    if (dPoints !== 0) {
      cumulativePatch[`${w}.totalPoints`] = FieldValue.increment(dPoints);
    }
    if (dStreakBonus !== 0) {
      cumulativePatch[`${w}.streakBonusSum`] = FieldValue.increment(dStreakBonus);
    }
  }
  await cumulativeRef.set(cumulativePatch, { merge: true });
}

export type WcSlotStreakApplyResult = {
  resultMap: Map<string, UpdatedUserStreakResult>;
  perUserPerGameActive: Map<string, Map<string, number>>;
  /** スロット確定で連勝を反映した（再採点は finalize 後） */
  slotCompleted: boolean;
};

/**
 * スロット全試合 final 後に連勝を一括反映する。
 * 先に決済済み投稿の再採点は onGameFinalV2 から rescoreEarlierWcSlotPosts を呼ぶ。
 */
export async function applyWcSlotStreakWhenComplete(
  db: FirebaseFirestore.Firestore,
  triggerGameId: string,
  kickoffMs: number,
  triggerUserResult: Map<string, boolean>
): Promise<WcSlotStreakApplyResult> {
  const slotGames = await loadWcGamesInKickoffSlot(db, kickoffMs);
  const slotGameIds = slotGames.map((g) => g.id);
  const isConcurrentSlot = slotGameIds.length >= 2;
  const allFinal =
    slotGames.length > 0 && slotGames.every((g) => g.final);
  const excludeGameIds = new Set(slotGameIds);

  const triggerGameDoc =
    slotGames.find((g) => g.id === triggerGameId) ?? slotGames[0];
  const triggerWcStage = triggerGameDoc
    ? resolveWcStageFromGame({
        knockout: triggerGameDoc.data.knockout === true,
        roundLabel:
          typeof triggerGameDoc.data.roundLabel === "string"
            ? triggerGameDoc.data.roundLabel
            : null,
        wcStage:
          typeof triggerGameDoc.data.wcStage === "string"
            ? triggerGameDoc.data.wcStage
            : null,
      })
    : null;
  const stageKey =
    triggerWcStage === "qualifying" || triggerWcStage === "main"
      ? triggerWcStage
      : null;

  const resultMap = new Map<string, UpdatedUserStreakResult>();
  const perUserPerGameActive = new Map<string, Map<string, number>>();

  if (!allFinal) {
    const deferred = await wcSlotStreakDeferredMap(db, triggerUserResult);
    deferred.forEach((v, k) => resultMap.set(k, v));
    return { resultMap, perUserPerGameActive, slotCompleted: false };
  }

  const userOutcomes = await loadUserOutcomesInSlot(db, slotGameIds);
  const uids = new Set<string>([
    ...userOutcomes.keys(),
    ...triggerUserResult.keys(),
  ]);

  for (const uid of uids) {
    const outcomes = userOutcomes.get(uid) ?? [];
    const didWin = triggerUserResult.get(uid) ?? outcomes.find((o) => o.gameId === triggerGameId)?.didWin ?? false;

    const entryOverall = await replayFootballEntryBeforeKickoff(
      db,
      uid,
      kickoffMs,
      excludeGameIds
    );
    const entryStage = stageKey
      ? await replayFootballEntryBeforeKickoff(
          db,
          uid,
          kickoffMs,
          excludeGameIds,
          stageKey
        )
      : entryOverall;
    const slotOutcome = computeWcSlotStreakOutcome(entryOverall, outcomes);
    const slotOutcomeStage = stageKey
      ? computeWcSlotStreakOutcome(entryStage, outcomes)
      : slotOutcome;
    perUserPerGameActive.set(
      uid,
      stageKey
        ? slotOutcomeStage.perGameActiveWinStreak
        : slotOutcome.perGameActiveWinStreak
    );

    const anySlotMarker = await Promise.all(
      slotGameIds.map((gid) => streakApplyMarkerRef(db, gid, uid).get())
    );
    if (anySlotMarker.some((s) => s.exists)) {
      const snap = await db.doc(`user_stats_v2/${uid}`).get();
      resultMap.set(
        uid,
        resultFromSlotOutcome(uid, didWin, snap, slotOutcome, triggerGameId)
      );
      continue;
    }

    const userRef = db.doc(`user_stats_v2/${uid}`);
    const cumulativeRef = db.doc(`cumulative_stats/${uid}`);
    const publicUserRef = db.doc(`users/${uid}`);

    const updated = await db.runTransaction(async (tx) => {
      for (const gid of slotGameIds) {
        const markerSnap = await tx.get(streakApplyMarkerRef(db, gid, uid));
        if (markerSnap.exists) {
          return { alreadyApplied: true as const };
        }
      }

      const snap = await tx.get(userRef);
      let maxF = migrateMaxFootball(snap);
      let maxLose = snap.get("maxLoseStreak") ?? 0;
      const bb = migrateBasketballState(snap);
      const curF = slotOutcome.finalCurF;
      if (slotOutcome.finalActiveWinStreak > maxF) {
        maxF = slotOutcome.finalActiveWinStreak;
      }
      if (curF < 0 && Math.abs(curF) > maxLose) {
        maxLose = Math.abs(curF);
      }

      const activeWinStreak = slotOutcome.finalActiveWinStreak;
      const activeWinStreakFootball = activeWinStreak;
      const activeWinStreakBasketball = bb.basketball > 0 ? bb.basketball : 0;

      tx.set(
        userRef,
        {
          streakBySport: { basketball: bb.basketball, football: curF },
          maxWinStreakBySport: { basketball: bb.maxBasketball, football: maxF },
          currentStreak: bb.basketball,
          streakFootball: curF,
          maxWinStreak: bb.maxBasketball,
          maxWinStreakFootball: maxF,
          maxLoseStreak: maxLose,
          maxStreak: bb.maxBasketball,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      tx.set(
        publicUserRef,
        {
          streakBySport: { basketball: bb.basketball, football: curF },
          currentStreak: bb.basketball,
          streakFootball: curF,
          maxStreak: bb.maxBasketball,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      tx.set(
        cumulativeRef,
        {
          streakBySport: { basketball: bb.basketball, football: curF },
          currentStreak: bb.basketball,
          streakFootball: curF,
          activeWinStreak,
          activeWinStreakBasketball,
          activeWinStreakFootball,
          updatedAt: FieldValue.serverTimestamp(),
          ...(stageKey
            ? {
                [`rankingByWcStage.${stageKey}.activeWinStreak`]:
                  slotOutcomeStage.finalActiveWinStreak,
              }
            : {}),
        },
        { merge: true }
      );

      if (stageKey) {
        const stageCurF = slotOutcomeStage.finalCurF;
        const stageActive = slotOutcomeStage.finalActiveWinStreak;
        const maxByWcStage = (snap.get("maxWinStreakByWcStage") ?? {}) as Record<
          string,
          number
        >;
        let maxStage = Number(maxByWcStage[stageKey] ?? 0);
        if (stageActive > maxStage) maxStage = stageActive;

        tx.set(
          userRef,
          {
            streakByWcStage: { [stageKey]: stageCurF },
            activeWinStreakByWcStage: { [stageKey]: stageActive },
            maxWinStreakByWcStage: { [stageKey]: maxStage },
          },
          { merge: true }
        );
      }

      for (const gid of slotGameIds) {
        tx.set(streakApplyMarkerRef(db, gid, uid), {
          appliedAt: FieldValue.serverTimestamp(),
          kickoffSlotMs: kickoffMs,
        });
      }

      return {
        alreadyApplied: false as const,
        uid,
        didWin,
        currentStreak: curF,
        activeWinStreak,
        maxWinStreak: maxF,
        maxLoseStreak: maxLose,
        perGame: slotOutcome.perGameActiveWinStreak,
      };
    });

    if (updated.alreadyApplied) {
      const snap = await db.doc(`user_stats_v2/${uid}`).get();
      resultMap.set(
        uid,
        resultFromSlotOutcome(uid, didWin, snap, slotOutcome, triggerGameId)
      );
      continue;
    }

    resultMap.set(uid, {
      uid: updated.uid,
      didWin: updated.didWin,
      currentStreak: updated.currentStreak,
      activeWinStreak: activeForTriggerGame(slotOutcome, triggerGameId),
      maxWinStreak: updated.maxWinStreak,
      maxLoseStreak: updated.maxLoseStreak,
    });
  }

  for (const [uid, didWin] of triggerUserResult) {
    if (resultMap.has(uid)) continue;
    const snap = await db.doc(`user_stats_v2/${uid}`).get();
    resultMap.set(uid, deferredResultFromSnap(uid, didWin, snap));
  }

  return {
    resultMap,
    perUserPerGameActive,
    slotCompleted: isConcurrentSlot && perUserPerGameActive.size > 0,
  };
}

/** スロット内の先に決済済み投稿を、確定後の連勝で再採点（トリガー試合の finalize 後に呼ぶ） */
export async function rescoreEarlierWcSlotPosts(
  db: FirebaseFirestore.Firestore,
  triggerGameId: string,
  perUserPerGameActive: Map<string, Map<string, number>>
) {
  for (const [uid, perGame] of perUserPerGameActive) {
    const dailyDeltas = new Map<
      string,
      { dPoints: number; dStreakBonus: number; wcStage: string | null }
    >();

    for (const [gameId, activeWinStreak] of perGame) {
      if (gameId === triggerGameId) continue;

      const postsSnap = await db
        .collection("posts")
        .where("gameId", "==", gameId)
        .where("authorUid", "==", uid)
        .where("schemaVersion", "==", 2)
        .limit(5)
        .get();
      const postDoc = postsSnap.docs[0];
      if (!postDoc) continue;

      const stats = (postDoc.data().stats ?? {}) as Record<string, unknown>;
      const detail = (stats.pointsV3Detail ?? {}) as Record<string, unknown>;
      const basePoints = Number(detail.basePoints ?? 0);
      const upsetBonus = Number(detail.upsetBonus ?? stats.upsetBonus ?? 0);
      const goalScorerBonus = Number(
        detail.goalScorerBonus ?? stats.goalScorerBonus ?? 0
      );
      const streakBonus = calcStreakBonus(activeWinStreak);
      const pointsV3 = basePoints + upsetBonus + streakBonus + goalScorerBonus;

      const { dPoints, dStreakBonus, dateKey, wcStage } = await patchPostStreakFields(
        db,
        postDoc.ref,
        activeWinStreak,
        streakBonus,
        pointsV3
      );

      if (dateKey && (dPoints !== 0 || dStreakBonus !== 0)) {
        const prev = dailyDeltas.get(dateKey) ?? {
          dPoints: 0,
          dStreakBonus: 0,
          wcStage,
        };
        prev.dPoints += dPoints;
        prev.dStreakBonus += dStreakBonus;
        dailyDeltas.set(dateKey, prev);
      }
    }

    await applyDailyStreakDeltas(db, uid, dailyDeltas);
  }
}

export function wcSlotActiveForUser(
  perUserPerGameActive: Map<string, Map<string, number>>,
  uid: string,
  gameId: string,
  fallback: number
): number {
  return perUserPerGameActive.get(uid)?.get(gameId) ?? fallback;
}

export function resolveTriggerKickoffMs(
  gameSnap: FirebaseFirestore.DocumentSnapshot
): number | null {
  return resolveKickoffMsFromFields(gameSnap.data());
}

export function isWcLeague(league?: string | null): boolean {
  return String(league ?? "").trim().toLowerCase() === "wc";
}
