export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { nbaStatsSnapshotCacheControl } from "@/lib/nba/nbaStatsSnapshotCacheControl";
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
    const db = getAdminDb();

    if (team) {
      const payload = await loadTeamInjury(db, season, team);
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
    }

    const payload = await loadTeamInjuriesSnapshot(db, season);
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": nbaStatsSnapshotCacheControl({
          source: payload.source,
          updatedAt: payload.updatedAt ? new Date(payload.updatedAt) : null,
        }),
      },
    });
  } catch (e: unknown) {
    console.error("[api/nba/team-injuries]", e);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
