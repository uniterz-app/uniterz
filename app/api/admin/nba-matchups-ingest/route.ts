export const runtime = "nodejs";
export const maxDuration = 300;

import { NextResponse } from "next/server";
import { revalidateNbaDocCache } from "@/lib/nba/nbaPublicReadDb";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireAdminUid } from "@/lib/admin/requireAdminUid";
import { checkJobSecret } from "@/lib/security/assertJobSecret";
import { ingestNbaMatchupsFromBdl } from "@/lib/nba/ingest/nbaMatchupIngest";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

/**
 * POST /api/admin/nba-matchups-ingest
 * BDL matchups → `nbaGameMatchups/{bdlGameId}` → `nbaAceGuard/{seasonKey}`。
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

    const result = await ingestNbaMatchupsFromBdl(getAdminDb(), {
      seasonKey,
      maxGames: typeof body.maxGames === "number" ? body.maxGames : undefined,
      force: body.force === true,
    });
    // ace guard は hub 経由。hub は別途回す想定だが、キャッシュは両方捨てる
    revalidateNbaDocCache(["nbaLeagueHub", "nbaLeagueHubDetail"]);
    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "unauthorized" || msg === "forbidden") {
      return NextResponse.json({ ok: false, error: msg }, { status: 401 });
    }
    console.error("[nba-matchups-ingest]", e);
    return NextResponse.json(
      { ok: false, error: "ingest_failed", message: msg },
      { status: 500 }
    );
  }
}
