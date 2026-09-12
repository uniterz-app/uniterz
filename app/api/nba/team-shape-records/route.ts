export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { loadTeamShapeRecordsApiPayload } from "@/lib/nba/teamShapes/loadTeamShapeRecordsApi";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

/**
 * GET /api/nba/team-shape-records?season=2026-27&team=nba-warriors
 * Firestore `nbaTeamShapeRecords` を読むだけ。
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const season =
      (searchParams.get("season") ?? "").trim() || CURRENT_NBA_SEASON_KEY;
    const team = (searchParams.get("team") ?? "").trim() || null;

    const payload = await loadTeamShapeRecordsApiPayload(
      getAdminDb(),
      season,
      team
    );
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
