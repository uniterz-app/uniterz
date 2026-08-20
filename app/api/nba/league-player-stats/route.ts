export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { playerStatLeadersCacheControl } from "@/lib/nba/playerStatLeaders/playerStatLeadersCacheControl";
import {
  loadPlayerStatLeadersSnapshot,
  normalizePlayerStatLeadersSeasonKey,
} from "@/lib/nba/playerStatLeaders/loadPlayerStatLeadersSnapshot";

/**
 * GET /api/nba/league-player-stats?season=2025-26
 * 認証不要。Firestore 共有スナップショット（未作成時はサーバー側モック fallback）。
 * 実データ書き込みは `ingestNbaLeagueStatsFromProvider`（ゲート B）。
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const season = normalizePlayerStatLeadersSeasonKey(
      url.searchParams.get("season")
    );

    const cached = unstable_cache(
      async () => loadPlayerStatLeadersSnapshot(getAdminDb(), season),
      ["nba-league-player-stats", season],
      { revalidate: 300, tags: ["nba-league-player-stats", `nba-lps:${season}`] }
    );

    const payload = await cached();
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": playerStatLeadersCacheControl({
          source: payload.source,
          updatedAt: payload.updatedAt ? new Date(payload.updatedAt) : null,
        }),
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "error";
    console.error("[api/nba/league-player-stats]", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
