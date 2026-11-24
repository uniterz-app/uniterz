export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getNbaPublicReadDb } from "@/lib/nba/nbaPublicReadDb";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import {
  parseNbaStatsWindowId,
  nbaStatsWindowId,
} from "@/lib/nba/nbaStatsWindow";
import { normalizePlayerStatLeadersSeasonKey } from "@/lib/nba/playerStatLeaders/loadPlayerStatLeadersSnapshot";
import { loadPlayerWindowBoard } from "@/lib/nba/playerStatLeaders/loadPlayerWindowSnapshot";

/**
 * GET /api/nba/league-player-window?season=2026-27&window=m11
 * ingest 済みの期間スナップショット。BDL なし・試合ログ全件は読まない。
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const season = normalizePlayerStatLeadersSeasonKey(
      url.searchParams.get("season") || CURRENT_NBA_SEASON_KEY
    );
    const window = parseNbaStatsWindowId(
      url.searchParams.get("window") ?? "last10"
    );
    if (window.kind === "season") {
      return NextResponse.json(
        { ok: false, error: "use league-player-stats" },
        { status: 400 }
      );
    }
    const db = getNbaPublicReadDb();
    const board = await loadPlayerWindowBoard(db, season, window);
    return NextResponse.json(
      {
        ok: true as const,
        season,
        window: nbaStatsWindowId(window),
        board,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (e: unknown) {
    console.error("[api/nba/league-player-window]", e);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
