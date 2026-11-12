/**
 * 予想投稿 1 件の作成。`POST /api/posts_v2` と一括提出が共有する。
 */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { resultLeagueFlagPatchForPost } from "@/lib/result/userResultLeagueFlags";
import { resolveWcStageFromGame } from "@/lib/legacyWcWebShims";
import { isWcKnockoutGame } from "@/lib/legacyWcWebShims";
import { normalizeLeague, type League } from "@/lib/leagues";
import { parsePredictionPayload } from "@/lib/predict/parsePredictionPayload";
import {
  normalizeNbaTopScorerCandidates,
  normalizeNbaTopScorerPick,
  validateNbaTopScorerPickForGame,
} from "@/lib/nba/topScorer";
import {
  normalizeWcGoalScorerPick,
  validateWcGoalScorerPickForGame,
  type WcGoalScorerPick,
} from "@/lib/legacyWcWebShims";
import { touchReferralPredictDay } from "@/lib/referral/touchReferralPredictDay";
import { settleReferralRelationWithRetries } from "@/lib/referral/settleReferralRelation";
import {
  deterministicPostV2Id,
  gameKickoffLockFromData,
} from "@/lib/predict/gameKickoffLock";
import {
  applyLiveMarketDelta,
  parseMarketSide,
  readLiveMarketCounts,
} from "@/lib/predict/liveGameMarket";
import { isNbaPickupGame } from "@/lib/nba/isPickupGame";
import { GAME_PREDICTORS_COLLECTION } from "@/lib/games/server/gamePredictors";

type Status = "scheduled" | "live" | "final";

type PredictionPayloadV2 = {
  winner: "home" | "away" | "draw";
  score: { home: number; away: number };
  goalScorer?: WcGoalScorerPick;
};

export type PredictionAuthorContext = {
  authorDisplayName: string;
  authorPhotoURL: string | null;
  authorHandle: string | null;
  referredByUid: string | null;
  referralSettled: boolean;
  userFlags: Record<string, unknown> | null;
};

export type CreatePredictionPostResult =
  | { ok: true; id: string }
  | { ok: false; status: number; error: string; existingId?: string };

function resolvePostLeagueFromGame(g: Record<string, unknown>, gameId: string): League {
  const rawLeague = g?.league;
  if (String(rawLeague ?? "").trim()) return normalizeLeague(rawLeague);
  if (gameId.startsWith("wc-")) return "wc";
  if (gameId.startsWith("nba-")) return "nba";
  return normalizeLeague(rawLeague);
}

function toAdminTimestamp(v: unknown): Timestamp | null {
  if (v instanceof Timestamp) return v;
  if (v && typeof v === "object" && typeof (v as { toMillis?: () => number }).toMillis === "function") {
    try {
      return Timestamp.fromMillis((v as { toMillis: () => number }).toMillis());
    } catch {
      return null;
    }
  }
  if (typeof v === "number" && Number.isFinite(v)) {
    return Timestamp.fromMillis(v);
  }
  if (typeof v === "string") {
    const ms = Date.parse(v);
    if (!Number.isNaN(ms)) return Timestamp.fromMillis(ms);
  }
  return null;
}

export async function loadPredictionAuthorContext(
  adminDb: Firestore,
  uid: string
): Promise<PredictionAuthorContext> {
  const ctx: PredictionAuthorContext = {
    authorDisplayName: "ユーザー",
    authorPhotoURL: null,
    authorHandle: null,
    referredByUid: null,
    referralSettled: false,
    userFlags: null,
  };
  try {
    const userDoc = await adminDb.collection("users").doc(uid).get();
    if (!userDoc.exists) return ctx;
    const u = userDoc.data() || {};
    ctx.userFlags = u;
    ctx.authorDisplayName = u.displayName || ctx.authorDisplayName;
    ctx.authorPhotoURL = u.photoURL || u.avatarUrl || null;
    ctx.authorHandle = u.handle || u.username || u.slug || null;
    const rawRef = u.referredByUid;
    if (typeof rawRef === "string" && rawRef.trim()) {
      ctx.referredByUid = rawRef.trim();
    }
    ctx.referralSettled = Boolean(u.referralSettledAt);
  } catch {
    /* 表示名が取れなくても投稿は続ける */
  }
  return ctx;
}

export async function createPredictionPostV2(input: {
  adminDb: Firestore;
  uid: string;
  author: PredictionAuthorContext;
  gameId: string;
  comment: string;
  rawPrediction: unknown;
  /** 一括の2件目以降は紹介精算を繰り返さない */
  touchReferral: boolean;
}): Promise<CreatePredictionPostResult> {
  const adminDb = input.adminDb;
  const uid = input.uid;
  const gameSnap = await adminDb.collection("games").doc(input.gameId).get();
  if (!gameSnap.exists) {
    return { ok: false, status: 404, error: "game not found" };
  }

  const g = gameSnap.data() as Record<string, unknown>;
  const league: League = resolvePostLeagueFromGame(g, input.gameId);
  const isKnockout = isWcKnockoutGame({
    league,
    knockout: (g as { knockout?: boolean }).knockout ?? null,
    roundLabel: (g as { roundLabel?: string }).roundLabel ?? null,
    wcStage: (g as { wcStage?: string }).wcStage ?? null,
  });

  const predictionParsed = parsePredictionPayload(
    input.rawPrediction,
    league,
    isKnockout
  );
  if (!predictionParsed.ok) {
    return { ok: false, status: 400, error: predictionParsed.error };
  }

  const startAtTs =
    toAdminTimestamp(g?.startAtJst) ?? toAdminTimestamp(g?.startAt) ?? null;
  if (!startAtTs) {
    return { ok: false, status: 500, error: "invalid game startAt" };
  }

  const startAtMillis = startAtTs.toMillis();
  const startAtIso = new Date(startAtMillis).toISOString();
  const lock = gameKickoffLockFromData(g);
  if (!lock.ok) {
    return { ok: false, status: 500, error: lock.error };
  }
  if (lock.locked) {
    return { ok: false, status: 403, error: "locked: game started" };
  }

  const homeTeamId =
    (g.home as { teamId?: string } | undefined)?.teamId ??
    (g.homeTeamId as string | undefined) ??
    null;
  const awayTeamId =
    (g.away as { teamId?: string } | undefined)?.teamId ??
    (g.awayTeamId as string | undefined) ??
    null;
  const rawGoalScorer = predictionParsed.rawGoalScorer;
  const goalScorerPick =
    league === "nba"
      ? normalizeNbaTopScorerPick(rawGoalScorer)
      : normalizeWcGoalScorerPick(rawGoalScorer);
  const allowsGoalScorer = league === "wc" || league === "nba";
  if (allowsGoalScorer && rawGoalScorer != null && !goalScorerPick) {
    return { ok: false, status: 400, error: "goalScorer invalid" };
  }
  if (!allowsGoalScorer && goalScorerPick) {
    return { ok: false, status: 400, error: "goalScorer only allowed for wc or nba" };
  }
  if (goalScorerPick) {
    if (league === "nba") {
      const candidates = normalizeNbaTopScorerCandidates(
        (g as { topScorerCandidates?: unknown }).topScorerCandidates
      );
      const v = validateNbaTopScorerPickForGame(
        goalScorerPick,
        homeTeamId,
        awayTeamId,
        candidates.length > 0 ? candidates : null
      );
      if (!v.ok) return { ok: false, status: 400, error: v.error };
    } else {
      const v = validateWcGoalScorerPickForGame(
        goalScorerPick,
        homeTeamId,
        awayTeamId,
        predictionParsed.prediction.score
      );
      if (!v.ok) return { ok: false, status: 400, error: v.error };
    }
  }

  const prediction: PredictionPayloadV2 = {
    ...predictionParsed.prediction,
    ...(goalScorerPick ? { goalScorer: goalScorerPick } : {}),
  };

  const dup = await adminDb
    .collection("posts")
    .where("authorUid", "==", uid)
    .where("gameId", "==", input.gameId)
    .where("schemaVersion", "==", 2)
    .limit(1)
    .get();
  if (!dup.empty) {
    return { ok: false, status: 409, error: "duplicate", existingId: dup.docs[0].id };
  }

  const postId = deterministicPostV2Id(uid, input.gameId);
  const author = input.author;
  const data = {
    schemaVersion: 2,
    authorUid: uid,
    authorDisplayName: author.authorDisplayName,
    authorPhotoURL: author.authorPhotoURL,
    authorHandle: author.authorHandle,
    gameId: input.gameId,
    league,
    seasonPhase: g?.seasonPhase ?? null,
    playoffRound: g?.playoffRound ?? null,
    seasonRound: g?.playoffRound ?? g?.seasonRound ?? null,
    roundLabel:
      typeof g?.roundLabel === "string" && g.roundLabel.trim()
        ? g.roundLabel.trim()
        : null,
    wcStage: resolveWcStageFromGame(g) ?? g?.wcStage ?? null,
    isPickup: isNbaPickupGame(g),
    ...(typeof g?.pickupWeekKey === "string" && g.pickupWeekKey.trim()
      ? { pickupWeekKey: g.pickupWeekKey.trim() }
      : {}),
    home: g?.home ?? null,
    away: g?.away ?? null,
    status: (g?.status as Status) || "scheduled",
    startAt: startAtTs,
    startAtMillis,
    startAtIso,
    prediction,
    comment: input.comment,
    result: null,
    stats: null as null,
    likeCount: 0,
    saveCount: 0,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  const ref = adminDb.collection("posts").doc(postId);
  try {
    await ref.create(data);
  } catch (createErr: unknown) {
    const code =
      createErr && typeof createErr === "object" && "code" in createErr
        ? Number((createErr as { code?: number }).code)
        : null;
    if (code === 6) {
      return { ok: false, status: 409, error: "duplicate", existingId: postId };
    }
    console.error("[createPredictionPostV2]", createErr);
    return { ok: false, status: 500, error: "write failed" };
  }

  try {
    const gameRef = adminDb.doc(`games/${input.gameId}`);
    const predictorsRef = adminDb.collection(GAME_PREDICTORS_COLLECTION).doc(input.gameId);
    const side = parseMarketSide(prediction.winner);
    await adminDb.runTransaction(async (tx) => {
      const fresh = await tx.get(gameRef);
      const gameData = (fresh.data() ?? {}) as Record<string, unknown>;
      const patch = side
        ? applyLiveMarketDelta(readLiveMarketCounts(gameData), side, 1)
        : null;
      tx.set(predictorsRef, { uids: FieldValue.arrayUnion(uid) }, { merge: true });
      tx.set(
        gameRef,
        {
          predictorCount: FieldValue.increment(1),
          ...(patch
            ? {
                marketPickCounts: patch.marketPickCounts,
                market: patch.market,
                marketBias: patch.marketBias,
              }
            : {}),
        },
        { merge: true }
      );
    });
  } catch (predErr) {
    console.error("[createPredictionPostV2] predictorUids", predErr);
  }

  const leagueFlagPatch = resultLeagueFlagPatchForPost(league);
  const flagsAlreadySet =
    leagueFlagPatch != null &&
    author.userFlags != null &&
    Object.keys(leagueFlagPatch).every((k) => author.userFlags?.[k] === true);
  if (leagueFlagPatch && !flagsAlreadySet) {
    try {
      await adminDb.collection("users").doc(uid).set(leagueFlagPatch, { merge: true });
      if (author.userFlags) {
        Object.assign(author.userFlags, leagueFlagPatch);
      }
    } catch (flagErr) {
      console.error("[createPredictionPostV2] user league flags", flagErr);
    }
  }

  if (input.touchReferral && author.referredByUid && !author.referralSettled) {
    try {
      const touch = await touchReferralPredictDay(adminDb, uid);
      if (!touch.ok) {
        console.error("[createPredictionPostV2] referral day", touch.error);
      } else if (touch.needsSettle) {
        try {
          const settled = await settleReferralRelationWithRetries(adminDb, uid, 3);
          if (!settled.ok) {
            console.error("[createPredictionPostV2] referral settle", settled.error);
          } else {
            author.referralSettled = true;
          }
        } catch (settleErr) {
          console.error("[createPredictionPostV2] referral settle", settleErr);
        }
      }
    } catch (referralErr) {
      console.error("[createPredictionPostV2] referral day", referralErr);
    }
  }

  return { ok: true, id: postId };
}
