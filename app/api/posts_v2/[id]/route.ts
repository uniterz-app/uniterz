// app/api/posts_v2/[id]/route.ts
export const runtime = "nodejs";

import { NextResponse, NextRequest } from "next/server";
import { getAdminDb, getAdminAuth } from "@/lib/firebaseAdmin";
import {
  normalizeNbaTopScorerCandidates,
  validateNbaTopScorerPickForGame,
} from "@/lib/nba/topScorer";
import {
  normalizeWcGoalScorerPick,
  validateWcGoalScorerPickForGame,
  type WcGoalScorerPick,
} from "@/lib/legacyWcWebShims";
import { isWcKnockoutGame } from "@/lib/legacyWcWebShims";
import {
  parsePredictionPayload,
  type ParsedPredictionPayload,
} from "@/lib/predict/parsePredictionPayload";
import { FieldValue } from "firebase-admin/firestore";
import { loadGameKickoffLock } from "@/lib/predict/gameKickoffLock";

/* ========= 認証 ========= */
async function requireUid(req: NextRequest): Promise<string> {
  const authz =
    req.headers.get("authorization") ||
    req.headers.get("Authorization");

  const token = authz?.startsWith("Bearer ") ? authz.slice(7) : null;
  if (!token) throw new Error("unauthorized");

  const decoded = await getAdminAuth().verifyIdToken(token);
  return decoded.uid;
}

async function assertPostUnlockedByLiveGame(
  gameId: unknown,
  fallbackStartAtMillis?: unknown
): Promise<void> {
  const id = String(gameId ?? "").trim();
  if (id) {
    const lock = await loadGameKickoffLock(getAdminDb(), id);
    if (!lock.ok) {
      const err: any = new Error(lock.error);
      err.status = 403;
      throw err;
    }
    if (lock.locked) {
      const err: any = new Error("locked");
      err.status = 403;
      throw err;
    }
    return;
  }
  // gameId 欠落は fail-closed
  if (typeof fallbackStartAtMillis === "number" && Date.now() < fallbackStartAtMillis) {
    return;
  }
  const err: any = new Error("locked");
  err.status = 403;
  throw err;
}

/* ========= 投稿取得（削除チェック） ========= */
async function getPostForDelete(uid: string, postId: string) {
  if (!postId || typeof postId !== "string" || postId.startsWith("(")) {
    const err: any = new Error("invalid id");
    err.status = 400;
    throw err;
  }

  const ref = getAdminDb().collection("posts").doc(postId);
  const snap = await ref.get();

  if (!snap.exists) {
    const err: any = new Error("not found");
    err.status = 404;
    throw err;
  }

  const data = snap.data() || {};

  if (data.authorUid !== uid) {
    const err: any = new Error("forbidden");
    err.status = 403;
    throw err;
  }

  await assertPostUnlockedByLiveGame(data.gameId, data.startAtMillis);

  return ref;
}

/* ========= GET ========= */
export async function GET(req: NextRequest, ctx: any) {
  const params = await ctx.params; // ★ここ重要
  try {
    const uid = await requireUid(req);

    const ref = getAdminDb().collection("posts").doc(params.id);
    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json({ ok: true, exists: false });
    }

    const data = snap.data() || {};
    const mine = data.authorUid === uid;

    let editable = false;
    if (mine && Number(data.schemaVersion) === 2) {
      try {
        await assertPostUnlockedByLiveGame(data.gameId, data.startAtMillis);
        editable = true;
      } catch {
        editable = false;
      }
    }

    const payload: Record<string, unknown> = {
      ok: true,
      exists: true,
      mine,
      editable,
    };
    if (mine) {
      if (data.prediction) payload.prediction = data.prediction;
      if (typeof data.comment === "string") payload.comment = data.comment;
    }
    return NextResponse.json(payload);
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message },
      { status: e?.status ?? 500 }
    );
  }
}

type PredictionPatch = ParsedPredictionPayload & {
  goalScorer?: WcGoalScorerPick;
};

/* ========= PATCH ========= */
export async function PATCH(req: NextRequest, ctx: any) {
  const params = await ctx.params; // ★ここ重要
  try {
    const uid = await requireUid(req);

    const ref = getAdminDb().collection("posts").doc(params.id);
    const snap = await ref.get();

    if (!snap.exists)
      return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });

    const data = snap.data()!;
    if (data.authorUid !== uid)
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

    if (Number(data.schemaVersion) !== 2)
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

    try {
      await assertPostUnlockedByLiveGame(data.gameId, data.startAtMillis);
    } catch (e: any) {
      return NextResponse.json(
        { ok: false, error: e?.message ?? "locked" },
        { status: e?.status ?? 403 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object")
      return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });

    if (body.prediction != null) {
      const league = String(data.league ?? "").toLowerCase();
      const gameSnap = await getAdminDb()
        .collection("games")
        .doc(String(data.gameId ?? ""))
        .get();
      const g = gameSnap.exists ? gameSnap.data() : null;
      const homeTeamId = g?.home?.teamId ?? g?.homeTeamId ?? data.home?.teamId ?? null;
      const awayTeamId = g?.away?.teamId ?? g?.awayTeamId ?? data.away?.teamId ?? null;

      const isKnockout = isWcKnockoutGame({
        league,
        knockout: g?.knockout ?? null,
        roundLabel: g?.roundLabel ?? null,
        wcStage: g?.wcStage ?? data.wcStage ?? null,
      });

      const parsed = parsePredictionPayload(body.prediction, data.league, isKnockout);
      if (!parsed.ok) {
        return NextResponse.json(
          { ok: false, error: parsed.error },
          { status: 400 }
        );
      }

      const rawGoalScorer = parsed.rawGoalScorer;
      const goalScorerPick = normalizeWcGoalScorerPick(rawGoalScorer);
      const predRaw = body.prediction;
      const allowsGoalScorer = league === "wc" || league === "nba";
      const hasGoalScorerField =
        allowsGoalScorer &&
        predRaw !== null &&
        typeof predRaw === "object" &&
        "goalScorer" in (predRaw as object);

      if (
        allowsGoalScorer &&
        rawGoalScorer != null &&
        rawGoalScorer !== undefined &&
        !goalScorerPick
      ) {
        return NextResponse.json(
          { ok: false, error: "goalScorer invalid" },
          { status: 400 }
        );
      }
      if (!allowsGoalScorer && goalScorerPick) {
        return NextResponse.json(
          { ok: false, error: "goalScorer only allowed for wc or nba" },
          { status: 400 }
        );
      }
      if (goalScorerPick) {
        if (league === "nba") {
          const candidates = normalizeNbaTopScorerCandidates(
            g?.topScorerCandidates
          );
          const v = validateNbaTopScorerPickForGame(
            goalScorerPick,
            homeTeamId,
            awayTeamId,
            candidates.length > 0 ? candidates : null
          );
          if (!v.ok) {
            return NextResponse.json({ ok: false, error: v.error }, { status: 400 });
          }
        } else {
          const v = validateWcGoalScorerPickForGame(
            goalScorerPick,
            homeTeamId,
            awayTeamId,
            parsed.prediction.score
          );
          if (!v.ok) {
            return NextResponse.json({ ok: false, error: v.error }, { status: 400 });
          }
        }
      }

      const prediction: PredictionPatch = { ...parsed.prediction };
      const updates: Record<string, unknown> = {
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (allowsGoalScorer && hasGoalScorerField) {
        if (goalScorerPick) {
          prediction.goalScorer = goalScorerPick;
          updates.prediction = prediction;
        } else {
          updates.prediction = prediction;
          updates["prediction.goalScorer"] = FieldValue.delete();
        }
      } else {
        updates.prediction = prediction;
      }
      if (typeof body.comment === "string") {
        updates.comment = body.comment.slice(0, 2000);
      }
      await ref.update(updates);
      return NextResponse.json({ ok: true });
    }

    if (typeof body.comment !== "string")
      return NextResponse.json(
        { ok: false, error: "comment required" },
        { status: 400 }
      );

    await ref.update({
      comment: body.comment.slice(0, 2000),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message },
      { status: e?.status ?? 500 }
    );
  }
}

/* ========= DELETE ========= */
export async function DELETE(req: NextRequest, ctx: any) {
  const params = await ctx.params; // ★ここで Promise → { id } に変換

  try {
    console.log("DELETE id =", params.id);

    const uid = await requireUid(req);

    const ref = await getPostForDelete(uid, params.id);

    await ref.delete();

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("DELETE ERROR:", e);
    return NextResponse.json(
      { ok: false, error: e?.message },
      { status: e?.status ?? 500 }
    );
  }
}
