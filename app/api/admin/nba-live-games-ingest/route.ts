export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireAdminUid } from "@/lib/admin/requireAdminUid";
import { checkJobSecret } from "@/lib/security/assertJobSecret";
import { ingestNbaLiveGamesFromBdl } from "@/lib/nba/ingest/nbaLiveGamesIngest";

/**
 * POST /api/admin/nba-live-games-ingest
 * BDL live/当日 box → Firestore games（スコア + liveStats）。
 * 認証: Admin UID または job secret。
 *
 * body: { dryRun?: boolean, dates?: string[] }
 */
export async function POST(req: Request) {
  try {
    if (!checkJobSecret(req)) {
      await requireAdminUid(req);
    }

    const body = (await req.json().catch(() => ({}))) as {
      dryRun?: boolean;
      dates?: string[];
    };

    const result = await ingestNbaLiveGamesFromBdl(getAdminDb(), {
      dryRun: body.dryRun === true,
      dates: Array.isArray(body.dates) ? body.dates : undefined,
    });

    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "unauthorized" || msg === "forbidden") {
      return NextResponse.json({ ok: false, error: msg }, { status: 401 });
    }
    console.error("[nba-live-games-ingest]", e);
    return NextResponse.json(
      { ok: false, error: "ingest_failed", message: msg },
      { status: 500 }
    );
  }
}
