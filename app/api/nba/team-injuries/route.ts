export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { nbaInjurySnapshotCacheControl } from "@/lib/nba/nbaStatsSnapshotCacheControl";
import {
  NBA_INJURY_API_CACHE_REVALIDATE_SEC,
  NBA_INJURY_API_CACHE_TAG,
} from "@/lib/nba/teamInjuries/nbaInjuryApiCache";
import {
  loadTeamInjuriesSnapshot,
  loadTeamInjury,
  normalizeTeamInjuriesSeasonKey,
} from "@/lib/nba/teamInjuries/loadTeamInjuriesSnapshot";

/**
 * GET /api/nba/team-injuries?season=2026-27
 * GET /api/nba/team-injuries?season=2026-27&team=nba-thunder
 *
 * 認証不要。Firestore のチーム injury 共有スナップショット。
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const season = normalizeTeamInjuriesSeasonKey(
      url.searchParams.get("season")
    );
    const team = (url.searchParams.get("team") ?? "").trim();
    const cacheOpts = {
      revalidate: NBA_INJURY_API_CACHE_REVALIDATE_SEC,
      tags: [NBA_INJURY_API_CACHE_TAG],
    };

    if (team) {
      const payload = await unstable_cache(
        () => loadTeamInjury(getAdminDb(), season, team),
        ["nba-team-injuries", season, team],
        cacheOpts
      )();
      return NextResponse.json(payload, {
        headers: {
          "Cache-Control": nbaInjurySnapshotCacheControl({ source: payload.source }),
        },
      });
    }

    const payload = await unstable_cache(
      () => loadTeamInjuriesSnapshot(getAdminDb(), season),
      ["nba-team-injuries", season],
      cacheOpts
    )();
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": nbaInjurySnapshotCacheControl({ source: payload.source }),
      },
    });
  } catch (e: unknown) {
    console.error("[api/nba/team-injuries]", e);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
