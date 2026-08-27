export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { nbaStatsSnapshotCacheControl } from "@/lib/nba/nbaStatsSnapshotCacheControl";
import { loadPlayerGameLogs } from "@/lib/nba/playerDetail/loadPlayerGameLogs";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

/**
 * GET /api/nba/player-game-logs?playerId=175&season=2026-27
 *
 * 認証不要。Firestore `nbaPlayerGameLogs` のみ（BDL ライブ禁止）。
 * データ投入は POST /api/admin/nba-player-game-logs-ingest。
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const playerId = (url.searchParams.get("playerId") ?? "").trim();
    const season =
      (url.searchParams.get("season") ?? CURRENT_NBA_SEASON_KEY).trim() ||
      CURRENT_NBA_SEASON_KEY;

    if (!playerId) {
      return NextResponse.json(
        { ok: false, error: "playerId required" },
        { status: 400 }
      );
    }

    const payload = await loadPlayerGameLogs(getAdminDb(), {
      playerId,
      seasonKey: season,
    });

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": nbaStatsSnapshotCacheControl({
          source: payload.gameLogs.length > 0 ? "firestore" : "empty",
          updatedAt: payload.updatedAt
            ? new Date(payload.updatedAt)
            : null,
        }),
      },
    });
  } catch (e) {
    console.error("[api/nba/player-game-logs]", e);
    return NextResponse.json(
      { ok: false, error: "internal" },
      { status: 500 }
    );
  }
}
