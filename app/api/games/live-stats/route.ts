export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import {
  buildLiveGameStatsReport,
  normalizeLiveGameStatsDoc,
} from "@/lib/games/liveGameStats";

/**
 * GET /api/games/live-stats?gameId=...
 * games/{gameId}.liveStats（admin ingest 経由で保存）から表示用レポートを返す。
 * データが無い試合は report: null（クライアントはパネル非表示）。
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const gameId = url.searchParams.get("gameId")?.trim() ?? "";
    if (!gameId) {
      return NextResponse.json(
        { ok: false, error: "gameId required" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const snap = await db.collection("games").doc(gameId).get();
    if (!snap.exists) {
      return NextResponse.json(
        { ok: false, error: "game not found" },
        { status: 404 }
      );
    }

    const game = snap.data() as Record<string, unknown>;
    if (String(game.league ?? "").toLowerCase() !== "nba") {
      return NextResponse.json({ ok: true, report: null });
    }

    const live = normalizeLiveGameStatsDoc(game.liveStats);
    if (!live) {
      return NextResponse.json({ ok: true, report: null });
    }

    const report = buildLiveGameStatsReport(gameId, game, live);
    // 終了試合は長めに CDN キャッシュ、ライブ中は短く
    const cacheControl =
      live.phase === "final"
        ? "public, s-maxage=300, stale-while-revalidate=600"
        : "public, s-maxage=15, stale-while-revalidate=30";

    return NextResponse.json(
      { ok: true, report },
      { headers: { "Cache-Control": cacheControl } }
    );
  } catch (e: unknown) {
    const err = e as { message?: string };
    return NextResponse.json(
      { ok: false, error: err?.message ?? "error" },
      { status: 500 }
    );
  }
}
