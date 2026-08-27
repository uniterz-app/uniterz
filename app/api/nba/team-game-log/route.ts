export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { nbaStatsSnapshotCacheControl } from "@/lib/nba/nbaStatsSnapshotCacheControl";
import {
  loadTeamGameLog,
  normalizeTeamGameLogSeasonKey,
} from "@/lib/nba/teamGameLog/loadTeamGameLog";

/**
 * GET /api/nba/team-game-log?season=2026-27&team=nba-thunder
 *
 * Firestore `nbaTeamGameLogs/{season}` スナップショットを読む。
 * 開幕前・未 ingest は空・0（モックなし）。
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const season = normalizeTeamGameLogSeasonKey(
      url.searchParams.get("season")
    );
    const team = (url.searchParams.get("team") ?? "").trim();
    if (!team) {
      return NextResponse.json(
        { ok: false, error: "team_required" },
        { status: 400 }
      );
    }

    const payload = await loadTeamGameLog(getAdminDb(), season, team);
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
  } catch (e: unknown) {
    console.error("[api/nba/team-game-log]", e);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
