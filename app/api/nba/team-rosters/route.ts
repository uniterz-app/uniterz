export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { nbaStatsSnapshotCacheControl } from "@/lib/nba/nbaStatsSnapshotCacheControl";
import {
  loadMatchupRosters,
  loadPlayerRosterHit,
  loadTeamRosterSlice,
  loadTeamRostersSnapshot,
  normalizeTeamRostersSeasonKey,
} from "@/lib/nba/teamRosters/loadTeamRostersSnapshot";

/**
 * GET /api/nba/team-rosters?season=2026-27
 * GET /api/nba/team-rosters?season=2026-27&home=nba-pistons&away=nba-celtics
 * GET /api/nba/team-rosters?season=2026-27&team=nba-thunder
 * GET /api/nba/team-rosters?season=2026-27&player=175
 *
 * 認証不要。Firestore のアクティブロスター共有スナップショット。
 * team / player 指定時はレスポンスを絞る（クライアント転送コスト削減）。
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const season = normalizeTeamRostersSeasonKey(
      url.searchParams.get("season")
    );
    const home = (url.searchParams.get("home") ?? "").trim();
    const away = (url.searchParams.get("away") ?? "").trim();
    const team = (url.searchParams.get("team") ?? "").trim();
    const player = (url.searchParams.get("player") ?? "").trim();
    const db = getAdminDb();

    if (home && away) {
      const payload = await loadMatchupRosters(db, season, home, away);
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

    if (player) {
      const payload = await loadPlayerRosterHit(db, season, player);
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

    if (team) {
      const payload = await loadTeamRosterSlice(db, season, team);
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

    const payload = await loadTeamRostersSnapshot(db, season);
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": nbaStatsSnapshotCacheControl({
          source: payload.source,
          updatedAt: payload.updatedAt ? new Date(payload.updatedAt) : null,
        }),
      },
    });
  } catch (e: unknown) {
    console.error("[api/nba/team-rosters]", e);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
