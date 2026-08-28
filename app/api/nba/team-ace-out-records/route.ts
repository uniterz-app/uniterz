export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { loadTeamAceOutRecordsApiPayload } from "@/lib/nba/insights/loadAceOutRecordsApi";
import {
  previousNbaSeasonKey,
  CURRENT_NBA_SEASON_KEY,
} from "@/lib/rankings/nbaSeason";

/**
 * GET /api/nba/team-ace-out-records?season=2025-26
 * Firestore `nbaTeamAceOutRecords` を読むだけ。
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const raw = (searchParams.get("season") ?? "").trim();
    const season = raw || previousNbaSeasonKey(CURRENT_NBA_SEASON_KEY);

    const payload = await loadTeamAceOutRecordsApiPayload(getAdminDb(), season);
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
