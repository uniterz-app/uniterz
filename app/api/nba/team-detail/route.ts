export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getNbaPublicReadDb, nbaDocCacheTags } from "@/lib/nba/nbaPublicReadDb";
import { nbaStatsSnapshotCacheControl } from "@/lib/nba/nbaStatsSnapshotCacheControl";
import { loadTeamDetailBundle } from "@/lib/nba/teamDetail/loadTeamDetailBundle";
import { NBA_DISCIPLINE_CDN_TAG_HEADER } from "@/lib/nba/discipline/nbaDisciplineApiCache";
import {
  NBA_INJURY_API_CACHE_REVALIDATE_SEC,
  NBA_INJURY_API_CACHE_TAG,
} from "@/lib/nba/teamInjuries/nbaInjuryApiCache";
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

    const payload = await unstable_cache(
      () =>
        loadTeamDetailBundle(getNbaPublicReadDb(), {
          teamId,
          seasonKey: season,
        }),
      ["nba-team-detail", season, teamId],
      {
        revalidate: NBA_INJURY_API_CACHE_REVALIDATE_SEC,
        tags: [
          ...nbaDocCacheTags([
            "nbaTeamRosters",
            "nbaTeamPayrolls",
            "nbaTeamInjuries",
            "nbaTeamGameLogs",
            "nbaStandings",
            "nbaTeamSeasonRecords",
            "nbaTeamShapeRecords",
            "nbaTeamAceOutRecords",
            "nbaTeamOffseasonMoves",
            "nbaDiscipline",
          ]),
          NBA_INJURY_API_CACHE_TAG,
        ],
      }
    )();

    return NextResponse.json(payload, {
      headers: {
        ...NBA_DISCIPLINE_CDN_TAG_HEADER,
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
