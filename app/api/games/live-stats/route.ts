export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { clientErrorResponse } from "@/lib/security/clientErrorResponse";
import { unstable_cache } from "next/cache";
import { getAdminDb } from "@/lib/firebaseAdmin";
import {
  buildLiveGameStatsReport,
  normalizeLiveGameStatsDoc,
  type LiveGameStatsReport,
} from "@/lib/games/liveGameStats";

type LiveStatsLoadResult =
  | { found: false }
  | { found: true; report: LiveGameStatsReport | null };

async function loadLiveStatsReport(gameId: string): Promise<LiveStatsLoadResult> {
  const snap = await getAdminDb().collection("games").doc(gameId).get();
  if (!snap.exists) return { found: false };
  const game = snap.data() as Record<string, unknown>;
  if (String(game.league ?? "").toLowerCase() !== "nba") {
    return { found: true, report: null };
  }
  const live = normalizeLiveGameStatsDoc(game.liveStats);
  if (!live) return { found: true, report: null };
  return { found: true, report: buildLiveGameStatsReport(gameId, game, live) };
}

/**
 * GET /api/games/live-stats?gameId=...
 * games/{gameId}.liveStats（admin ingest 経由で保存）から表示用レポートを返す。
 * データが無い試合は report: null（クライアントはパネル非表示）。
 * CDN はリージョンごとに別キャッシュのため、Firestore 読みは unstable_cache（60 秒）で 1 本化する。
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

    const result = await unstable_cache(
      () => loadLiveStatsReport(gameId),
      ["games-live-stats", gameId],
      { revalidate: 60, tags: ["games-live-stats"] }
    )();

    if (!result.found) {
      return NextResponse.json(
        { ok: false, error: "game not found" },
        { status: 404 }
      );
    }

    const report = result.report;
    const cacheControl = !report
      ? "public, s-maxage=30, stale-while-revalidate=60"
      : report.phase === "final"
        ? "public, s-maxage=300, stale-while-revalidate=600"
        : "public, s-maxage=30, stale-while-revalidate=30";

    return NextResponse.json(
      { ok: true, report },
      { headers: { "Cache-Control": cacheControl } }
    );
  } catch (e: unknown) {
    return clientErrorResponse(e, "GET /api/games/live-stats");
  }
}
