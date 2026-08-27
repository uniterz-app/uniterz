export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { nbaStatsSnapshotCacheControl } from "@/lib/nba/nbaStatsSnapshotCacheControl";
import { loadPlayerCareerSeasons } from "@/lib/nba/playerDetail/loadPlayerCareerSeasons";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

/**
 * GET /api/nba/player-career-seasons?playerId=175&season=2026-27
 *
 * 認証不要。Firestore `nbaPlayerCareerSeasons` のみ（BDL ライブ禁止）。
 * データ投入は POST /api/admin/nba-player-career-seasons-ingest。
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

    const payload = await loadPlayerCareerSeasons(getAdminDb(), {
      playerId,
      seasonKey: season,
    });

    const hasRows =
      payload.careerSeasons.regular.length > 0 ||
      payload.careerSeasons.playoffs.length > 0;

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": nbaStatsSnapshotCacheControl({
          source: hasRows ? "firestore" : "empty",
          updatedAt: payload.updatedAt
            ? new Date(payload.updatedAt)
            : null,
        }),
      },
    });
  } catch (e) {
    console.error("[api/nba/player-career-seasons]", e);
    return NextResponse.json(
      {
        ok: false,
        error: "internal",
      },
      { status: 500 }
    );
  }
}
