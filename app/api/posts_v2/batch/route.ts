export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";
import { consumeUidActionRateLimit } from "@/lib/security/consumeUidRateLimit";
import {
  createPredictionPostV2,
  loadPredictionAuthorContext,
} from "@/lib/predict/createPredictionPostV2";
import {
  BATCH_PREDICT_MAX_ITEMS,
  batchPredictGameDayKey,
  sanitizePredictionBody,
} from "@/lib/predict/batchPredict";
import { assertProUser } from "@/lib/pro/assertProUser";

function gameStartMillis(v: unknown): number | null {
  if (v && typeof v === "object" && typeof (v as { toMillis?: unknown }).toMillis === "function") {
    const ms = (v as { toMillis: () => number }).toMillis();
    return Number.isFinite(ms) ? ms : null;
  }
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const ms = Date.parse(v);
    return Number.isNaN(ms) ? null : ms;
  }
  return null;
}

/**
 * 入力済みの複数試合を1リクエストで提出する。
 * 空の試合はクライアントが送らない。試合ごとの成否を返す。
 * 1 試合日分まで（複数日にまたがる場合は 1 件も作らず multiple_days）。
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const items = (body as { items?: unknown } | null)?.items;
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ ok: false, error: "items required" }, { status: 400 });
    }
    if (items.length > BATCH_PREDICT_MAX_ITEMS) {
      return NextResponse.json(
        { ok: false, error: "too many items" },
        { status: 400 }
      );
    }

    const authz = req.headers.get("authorization") || req.headers.get("Authorization");
    const token = authz?.startsWith("Bearer ") ? authz.slice(7) : null;
    if (!token) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    let uid: string;
    try {
      const decoded = await getAdminAuth().verifyIdToken(token);
      uid = decoded.uid;
    } catch (e: unknown) {
      console.error("[POST /api/posts_v2/batch] auth", e);
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    if (!(await assertProUser(uid))) {
      return NextResponse.json({ ok: false, error: "pro_required" }, { status: 403 });
    }

    const adminDb = getAdminDb();

    const gameIds = [
      ...new Set(
        items
          .map((item) => sanitizePredictionBody(item))
          .flatMap((parsed) => (parsed.ok ? [parsed.gameId] : []))
      ),
    ];
    if (gameIds.length > 0) {
      const snaps = await adminDb.getAll(
        ...gameIds.map((id) => adminDb.collection("games").doc(id))
      );
      const dayKeys = new Set<string>();
      for (const snap of snaps) {
        if (!snap.exists) continue;
        const g = snap.data() as Record<string, unknown>;
        const startMs = gameStartMillis(g.startAtJst) ?? gameStartMillis(g.startAt);
        if (startMs == null) continue;
        dayKeys.add(batchPredictGameDayKey(g.league, startMs));
      }
      if (dayKeys.size > 1) {
        return NextResponse.json(
          { ok: false, error: "multiple_days" },
          { status: 400 }
        );
      }
    }

    const author = await loadPredictionAuthorContext(adminDb, uid);
    const results: Array<{
      gameId: string;
      ok: boolean;
      id?: string;
      error?: string;
    }> = [];
    let touchedReferral = false;

    for (const item of items) {
      const parsed = sanitizePredictionBody(item);
      if (!parsed.ok) {
        const gameId =
          item && typeof item === "object" && "gameId" in item
            ? String((item as { gameId?: unknown }).gameId ?? "")
            : "";
        results.push({ gameId, ok: false, error: parsed.error });
        continue;
      }

      const rate = await consumeUidActionRateLimit(adminDb, uid, "posts_v2", 120);
      if (!rate.ok) {
        results.push({ gameId: parsed.gameId, ok: false, error: "rate_limited" });
        continue;
      }

      const created = await createPredictionPostV2({
        adminDb,
        uid,
        author,
        gameId: parsed.gameId,
        comment: parsed.comment,
        rawPrediction: parsed.rawPrediction,
        touchReferral: !touchedReferral,
      });
      if (created.ok) {
        touchedReferral = true;
        results.push({ gameId: parsed.gameId, ok: true, id: created.id });
      } else {
        results.push({
          gameId: parsed.gameId,
          ok: false,
          error: created.error,
          ...(created.existingId ? { id: created.existingId } : {}),
        });
      }
    }

    const submitted = results.filter((r) => r.ok).length;
    return NextResponse.json({ ok: submitted > 0, submitted, results });
  } catch (e: unknown) {
    console.error("[POST /api/posts_v2/batch] fatal", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
