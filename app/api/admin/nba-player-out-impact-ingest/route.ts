export const runtime = "nodejs";
export const maxDuration = 300;

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireAdminUid } from "@/lib/admin/requireAdminUid";
import { checkJobSecret } from "@/lib/security/assertJobSecret";
import { ingestNbaPlayerOutImpact } from "@/lib/nba/injuryImpact/ingestNbaPlayerOutImpact";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

/**
 * POST /api/admin/nba-player-out-impact-ingest
 * 選手欠場の影響（点）→ Firestore `nbaPlayerOutImpact/{seasonKey}`。
 * 認証: Admin UID または job secret。
 *
 * body: { seasonKey?: "2025-26" }
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

    const result = await ingestNbaPlayerOutImpact(getAdminDb(), { seasonKey });
    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "unauthorized" || msg === "forbidden") {
      return NextResponse.json({ ok: false, error: msg }, { status: 401 });
    }
    console.error("[nba-player-out-impact-ingest]", e);
    return NextResponse.json(
      { ok: false, error: "ingest_failed", message: msg },
      { status: 500 }
    );
  }
}
