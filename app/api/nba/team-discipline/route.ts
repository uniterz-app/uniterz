export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { loadTeamDisciplineSlice } from "@/lib/nba/discipline/nbaDisciplineSnapshot";
import { NBA_DISCIPLINE_CDN_TAG_HEADER } from "@/lib/nba/discipline/nbaDisciplineApiCache";
import { nbaStatsSnapshotCacheControl } from "@/lib/nba/nbaStatsSnapshotCacheControl";

/**
 * GET /api/nba/team-discipline?team=nba-warriors&season=2024-25
 *
 * チーム詳細 DISCIPLINE の年切替用。Firestore `nbaDiscipline/{season}` のみ。
 * 表示中シーズンの初期値は `/api/nba/team-detail` に同梱。
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const teamId = (url.searchParams.get("team") ?? "").trim();
    const season = (url.searchParams.get("season") ?? "").trim();
    if (!teamId || !/^\d{4}-\d{2}$/.test(season)) {
      return NextResponse.json(
        { ok: false, error: "team and season required" },
        { status: 400 }
      );
    }
    const discipline = await loadTeamDisciplineSlice(getAdminDb(), season, teamId);
    return NextResponse.json(
      { ok: true, discipline },
      {
        headers: {
          ...NBA_DISCIPLINE_CDN_TAG_HEADER,
          "Cache-Control": nbaStatsSnapshotCacheControl({
            source: discipline ? "firestore" : "empty",
            updatedAt: null,
          }),
        },
      }
    );
  } catch (e) {
    console.error("[api/nba/team-discipline]", e);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
