export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { loadNbaDisciplineHistory } from "@/lib/nba/discipline/nbaDisciplineHistory";
import { NBA_DISCIPLINE_CDN_TAG_HEADER } from "@/lib/nba/discipline/nbaDisciplineApiCache";
import { nbaStatsSnapshotCacheControl } from "@/lib/nba/nbaStatsSnapshotCacheControl";

/**
 * GET /api/nba/discipline-history?team=nba-pistons&to=2025-26
 * GET /api/nba/discipline-history?player=3547267&to=2025-26
 *
 * DISCIPLINE のシーズン推移（2020-21〜`to`）。Firestore `nbaDiscipline/{season}` のみ。
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const teamId = (url.searchParams.get("team") ?? "").trim();
    const playerId = (url.searchParams.get("player") ?? "").trim();
    const to = (url.searchParams.get("to") ?? "").trim();
    const subject = teamId ? "team" : playerId ? "player" : null;
    if (!subject || !/^\d{4}-\d{2}$/.test(to)) {
      return NextResponse.json(
        { ok: false, error: "team or player, and to required" },
        { status: 400 }
      );
    }
    const points = await loadNbaDisciplineHistory(getAdminDb(), {
      subject,
      id: subject === "team" ? teamId : playerId,
      toSeason: to,
    });
    return NextResponse.json(
      { ok: true, points },
      {
        headers: {
          ...NBA_DISCIPLINE_CDN_TAG_HEADER,
          "Cache-Control": nbaStatsSnapshotCacheControl({
            source: points.length > 0 ? "firestore" : "empty",
            updatedAt: null,
          }),
        },
      }
    );
  } catch (e) {
    console.error("[api/nba/discipline-history]", e);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
