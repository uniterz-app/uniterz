export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { nbaStatsSnapshotCacheControl } from "@/lib/nba/nbaStatsSnapshotCacheControl";
import { loadMatchupDetailBundle } from "@/lib/nba/predict/loadMatchupDetailBundle";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

/**
 * GET /api/nba/matchup-detail?home=&away=&season=
 *
 * 試合カード予想ツール用。Firestore のみ。
 * Injury + Roster + Stats を 1 レスポンス（Insight は別・auth）。
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const home = (url.searchParams.get("home") ?? "").trim();
    const away = (url.searchParams.get("away") ?? "").trim();
    const season =
      (url.searchParams.get("season") ?? CURRENT_NBA_SEASON_KEY).trim() ||
      CURRENT_NBA_SEASON_KEY;

    if (!home || !away) {
      return NextResponse.json(
        { ok: false, error: "home and away required" },
        { status: 400 }
      );
    }

    const payload = await loadMatchupDetailBundle(getAdminDb(), {
      homeTeamId: home,
      awayTeamId: away,
      seasonKey: season,
    });

    const hasRoster =
      (payload.rosterHome?.players?.length ?? 0) > 0 ||
      (payload.rosterAway?.players?.length ?? 0) > 0;
    // ロスター欠落時は短 TTL（シーズン切替で空が CDN に残らないように）
    const cacheSource = hasRoster ? payload.source : "empty";

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": nbaStatsSnapshotCacheControl({
          source: cacheSource,
          updatedAt: payload.updatedAt
            ? new Date(payload.updatedAt)
            : null,
        }),
      },
    });
  } catch (e) {
    console.error("[api/nba/matchup-detail]", e);
    return NextResponse.json(
      { ok: false, error: "internal" },
      { status: 500 }
    );
  }
}
