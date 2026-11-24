export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getNbaPublicReadDb } from "@/lib/nba/nbaPublicReadDb";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import {
  parseNbaStatsWindowId,
  nbaStatsWindowId,
} from "@/lib/nba/nbaStatsWindow";
import { normalizeLeagueTeamStatsSeasonKey } from "@/lib/nba/leagueTeamStats/loadLeagueTeamStatsSnapshot";
import { loadTeamWindowRows } from "@/lib/nba/leagueTeamStats/loadTeamWindowSnapshot";

/**
 * GET /api/nba/league-team-window?season=2026-27&window=last10
 * ingest 済みの期間スナップショット。BDL なし・30 チーム明細は読まない。
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const season = normalizeLeagueTeamStatsSeasonKey(
      url.searchParams.get("season") || CURRENT_NBA_SEASON_KEY
    );
    const window = parseNbaStatsWindowId(
      url.searchParams.get("window") ?? "last10"
    );
    if (window.kind === "season") {
      return NextResponse.json(
        { ok: false, error: "use league-team-stats" },
        { status: 400 }
      );
    }
    const db = getNbaPublicReadDb();
    const rows = await loadTeamWindowRows(db, season, window);
    return NextResponse.json(
      {
        ok: true as const,
        season,
        window: nbaStatsWindowId(window),
        rows,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (e: unknown) {
    console.error("[api/nba/league-team-window]", e);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
