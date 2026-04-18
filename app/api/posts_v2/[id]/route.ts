// app/api/posts_v2/[id]/route.ts
export const runtime = "nodejs";

import { NextResponse, NextRequest } from "next/server";
import { getAdminDb, getAdminAuth } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

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

  // 試合前のみ削除可
  if (
    typeof data.startAtMillis === "number" &&
    Date.now() >= data.startAtMillis
  ) {
    const err: any = new Error("locked");
    err.status = 403;
    throw err;
  }

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

    const editable =
      mine &&
      Number(data.schemaVersion) === 2 &&
      typeof data.startAtMillis === "number" &&
      Date.now() < data.startAtMillis;

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

function isSoccerLeague(league: unknown): boolean {
  const s = String(league ?? "").toLowerCase();
  return s === "pl" || s === "j1" || s.includes("premier");
}

/** 予想 PATCH 用（POST /api/posts_v2 と同趣旨の検証） */
function parsePredictionPatch(
  raw: unknown,
  league: unknown
): { ok: true; prediction: { winner: "home" | "away" | "draw"; score: { home: number; away: number } } } | { ok: false; error: string } {
  const soccer = isSoccerLeague(league);
  const p = (raw as any)?.prediction ?? raw;
  if (!p || typeof p !== "object")
    return { ok: false, error: "prediction required" };
  const winner = (p as any).winner;
  if (!["home", "away", "draw"].includes(winner))
    return { ok: false, error: "prediction.winner must be home/away/draw" };
  const s = (p as any).score ?? {};
  const home = Number(s.home);
  const away = Number(s.away);
  if (
    !Number.isInteger(home) ||
    !Number.isInteger(away) ||
    home < 0 ||
    away < 0
  )
    return { ok: false, error: "score invalid" };
  if (!soccer && winner === "draw")
    return { ok: false, error: "draw not allowed for this league" };
  if (winner === "home" && home <= away)
    return { ok: false, error: "home win requires home score > away" };
  if (winner === "away" && away <= home)
    return { ok: false, error: "away win requires away score > home" };
  if (soccer && winner === "draw" && home !== away)
    return { ok: false, error: "draw requires equal scores" };
  return {
    ok: true,
    prediction: {
      winner: winner as "home" | "away" | "draw",
      score: { home, away },
    },
  };
}

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

    if (typeof data.startAtMillis === "number" && Date.now() >= data.startAtMillis)
      return NextResponse.json({ ok: false, error: "locked" }, { status: 403 });

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object")
      return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });

    if (body.prediction != null) {
      const parsed = parsePredictionPatch(body.prediction, data.league);
      if (!parsed.ok) {
        return NextResponse.json(
          { ok: false, error: parsed.error },
          { status: 400 }
        );
      }
      const updates: Record<string, unknown> = {
        prediction: parsed.prediction,
        updatedAt: FieldValue.serverTimestamp(),
      };
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
