export const runtime = "nodejs";
export const maxDuration = 300;

import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { revalidateNbaDocCache } from "@/lib/nba/nbaPublicReadDb";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireAdminUid } from "@/lib/admin/requireAdminUid";
import { checkJobSecret } from "@/lib/security/assertJobSecret";
import { ingestNbaCleanRatingsFromBdl } from "@/lib/nba/ingest/nbaCleanRatingsIngest";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

/**
 * POST /api/admin/nba-clean-ratings-ingest
 * BDL play-by-play → `nbaGameCleanRatings/{bdlGameId}` → `nbaTeamCleanRatings/{seasonKey}`（ガベージタイム抜きのレーティング）。
 * 認証: Admin UID または job secret。
 *
 * body: { seasonKey?: "2026-27", maxGames?: number, force?: boolean }
 */
export async function POST(req: Request) {
  try {
    if (!checkJobSecret(req)) {
      await requireAdminUid(req);
    }

    const body = (await req.json().catch(() => ({}))) as {
      seasonKey?: string;
      maxGames?: number;
      force?: boolean;
    };
    const seasonKey =
      typeof body.seasonKey === "string" && body.seasonKey.trim()
        ? body.seasonKey.trim()
        : CURRENT_NBA_SEASON_KEY;

    const result = await ingestNbaCleanRatingsFromBdl(getAdminDb(), {
      seasonKey,
      maxGames: typeof body.maxGames === "number" ? body.maxGames : undefined,
      force: body.force === true,
    });
    revalidateNbaDocCache(["nbaTeamCleanRatings"]);
    revalidateTag(`nba-lts:${seasonKey}`, { expire: 0 });
    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "unauthorized" || msg === "forbidden") {
      return NextResponse.json({ ok: false, error: msg }, { status: 401 });
    }
    console.error("[nba-clean-ratings-ingest]", e);
    return NextResponse.json(
      { ok: false, error: "ingest_failed", message: msg },
      { status: 500 }
    );
  }
}
