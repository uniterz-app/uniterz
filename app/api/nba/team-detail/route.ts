export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { nbaStatsSnapshotCacheControl } from "@/lib/nba/nbaStatsSnapshotCacheControl";
import { loadTeamDetailBundle } from "@/lib/nba/teamDetail/loadTeamDetailBundle";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

/**
 * GET /api/nba/team-detail?team=nba-warriors&season=2026-27
 *
 * 認証不要。Firestore のみ（BDL ライブ禁止）。
 * roster / payroll / game-log / standings row / injury / strength /
 * ace-out / shape edges を 1 レスポンスに寄せる（player-detail と同型）。
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const teamId = (url.searchParams.get("team") ?? "").trim();
    const season =
      (url.searchParams.get("season") ?? CURRENT_NBA_SEASON_KEY).trim() ||
      CURRENT_NBA_SEASON_KEY;

    if (!teamId) {
      return NextResponse.json(
        { ok: false, error: "team required" },
        { status: 400 }
      );
    }

    const payload = await loadTeamDetailBundle(getAdminDb(), {
      teamId,
      seasonKey: season,
    });

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": nbaStatsSnapshotCacheControl({
          source: payload.source,
          updatedAt: payload.updatedAt
            ? new Date(payload.updatedAt)
            : null,
        }),
      },
    });
  } catch (e) {
    console.error("[api/nba/team-detail]", e);
    return NextResponse.json(
      { ok: false, error: "internal" },
      { status: 500 }
    );
  }
}
