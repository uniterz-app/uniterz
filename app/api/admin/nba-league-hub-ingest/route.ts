export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireAdminUid } from "@/lib/admin/requireAdminUid";
import { checkJobSecret } from "@/lib/security/assertJobSecret";
import { ingestNbaLeagueHub } from "@/lib/nba/leagueHub/nbaLeagueHubIngest";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

/**
 * POST /api/admin/nba-league-hub-ingest
 * 既存スナップショット → Firestore `nbaLeagueHub/{seasonKey}`（BDL なし）。
 * 認証: Admin UID または job secret。
 *
 * body: { seasonKey?: "2026-27" }
 */
export async function POST(req: Request) {
  try {
    if (!checkJobSecret(req)) {
      await requireAdminUid(req);
    }

    const body = (await req.json().catch(() => ({}))) as { seasonKey?: string };
    const seasonKey =
      typeof body.seasonKey === "string" && body.seasonKey.trim()
        ? body.seasonKey.trim()
        : CURRENT_NBA_SEASON_KEY;

    return NextResponse.json(await ingestNbaLeagueHub(getAdminDb(), { seasonKey }));
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "unauthorized" || msg === "forbidden") {
      return NextResponse.json({ ok: false, error: msg }, { status: 401 });
    }
    console.error("[nba-league-hub-ingest]", e);
    return NextResponse.json(
      { ok: false, error: "ingest_failed", message: msg },
      { status: 500 }
    );
  }
}
