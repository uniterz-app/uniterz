export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminDb, getAdminAuth } from "@/lib/firebaseAdmin";
import { consumeUidActionRateLimit } from "@/lib/security/consumeUidRateLimit";
import {
  createPredictionPostV2,
  loadPredictionAuthorContext,
} from "@/lib/predict/createPredictionPostV2";
import { sanitizePredictionBody } from "@/lib/predict/batchPredict";

async function requireUid(req: Request): Promise<string> {
  const authz = req.headers.get("authorization") || req.headers.get("Authorization");
  const token = authz?.startsWith("Bearer ") ? authz.slice(7) : null;
  if (!token) throw new Error("unauthorized");
  const decoded = await getAdminAuth().verifyIdToken(token);
  return decoded.uid;
}

/* ========= POST /api/posts_v2 ========= */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
    }

    const parsed = sanitizePredictionBody(body);
    if (!parsed.ok) {
      return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
    }

    let uid: string;
    try {
      uid = await requireUid(req);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "unauthorized") {
        return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
      }
      console.error("[POST /api/posts_v2] auth", e);
      return NextResponse.json(
        {
          ok: false,
          error: "auth_config",
          message:
            process.env.NODE_ENV === "development"
              ? msg
              : "サーバー設定を確認してください（Firebase Admin）",
        },
        { status: 500 }
      );
    }

    const adminDb = getAdminDb();
    const rate = await consumeUidActionRateLimit(adminDb, uid, "posts_v2", 120);
    if (!rate.ok) {
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }

    const author = await loadPredictionAuthorContext(adminDb, uid);
    const created = await createPredictionPostV2({
      adminDb,
      uid,
      author,
      gameId: parsed.gameId,
      comment: parsed.comment,
      rawPrediction: parsed.rawPrediction,
      touchReferral: true,
    });
    if (!created.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: created.error,
          ...(created.existingId ? { existingId: created.existingId } : {}),
        },
        { status: created.status }
      );
    }
    return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
  } catch (e: unknown) {
    console.error("[POST /api/posts_v2] fatal", e);
    return NextResponse.json(
      {
        ok: false,
        error: "server_error",
        message:
          process.env.NODE_ENV === "development"
            ? String(e instanceof Error ? e.message : e)
            : undefined,
      },
      { status: 500 }
    );
  }
}
