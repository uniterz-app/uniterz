export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireAdminUid } from "@/lib/admin/requireAdminUid";
import { normalizeLiveGameStatsDoc } from "@/lib/games/liveGameStats";

/**
 * NBA ライブ/最終スタッツの ingest 用 admin API。
 * 外部データソースから取得したチームスタッツ・ボックススコアを
 * games/{gameId}.liveStats に保存する（クライアントは /api/games/live-stats で読む）。
 */

/** GET: 保存済み liveStats の確認 */
export async function GET(req: Request) {
  try {
    await requireAdminUid(req);
    const url = new URL(req.url);
    const gameId = url.searchParams.get("gameId")?.trim() ?? "";
    if (!gameId) {
      return NextResponse.json(
        { ok: false, error: "gameId required" },
        { status: 400 }
      );
    }

    const snap = await getAdminDb().collection("games").doc(gameId).get();
    if (!snap.exists) {
      return NextResponse.json(
        { ok: false, error: "game not found" },
        { status: 404 }
      );
    }
    const data = snap.data() as Record<string, unknown>;
    return NextResponse.json({
      ok: true,
      gameId,
      liveStats: normalizeLiveGameStatsDoc(data.liveStats),
    });
  } catch (e: unknown) {
    const err = e as { status?: number; message?: string };
    return NextResponse.json(
      { ok: false, error: err?.message ?? "error" },
      { status: err?.status ?? 500 }
    );
  }
}

/** PATCH: liveStats を上書き保存。liveStats: null で削除 */
export async function PATCH(req: Request) {
  try {
    await requireAdminUid(req);
    const body = (await req.json().catch(() => null)) as {
      gameId?: string;
      liveStats?: unknown;
    } | null;

    const gameId = String(body?.gameId ?? "").trim();
    if (!gameId) {
      return NextResponse.json(
        { ok: false, error: "gameId required" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const ref = db.collection("games").doc(gameId);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json(
        { ok: false, error: "game not found" },
        { status: 404 }
      );
    }
    const data = snap.data() as Record<string, unknown>;
    if (String(data.league ?? "").toLowerCase() !== "nba") {
      return NextResponse.json(
        { ok: false, error: "not an nba game" },
        { status: 400 }
      );
    }

    if (body?.liveStats === null) {
      await ref.update({
        liveStats: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ ok: true, gameId, liveStats: null });
    }

    const live = normalizeLiveGameStatsDoc(body?.liveStats);
    if (!live) {
      return NextResponse.json(
        { ok: false, error: "invalid liveStats payload (phase required)" },
        { status: 400 }
      );
    }

    await ref.update({
      liveStats: live,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true, gameId, liveStats: live });
  } catch (e: unknown) {
    const err = e as { status?: number; message?: string };
    return NextResponse.json(
      { ok: false, error: err?.message ?? "error" },
      { status: err?.status ?? 500 }
    );
  }
}
