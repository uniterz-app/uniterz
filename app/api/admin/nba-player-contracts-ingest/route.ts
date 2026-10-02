export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireAdminUid } from "@/lib/admin/requireAdminUid";
import { checkJobSecret } from "@/lib/security/assertJobSecret";
import { ingestNbaPlayerContractsFromBdl } from "@/lib/nba/ingest/nbaPlayerContractsIngest";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

/**
 * POST /api/admin/nba-player-contracts-ingest
 * BDL → Firestore `nbaPlayerContracts/{season}/players/{playerId}`。
 * 認証: Admin UID または job secret。
 *
 * body: { seasonKey?: "2026-27", playerIds?: string[], maxPlayers?: number }
 */
export async function POST(req: Request) {
  try {
    if (!checkJobSecret(req)) {
      await requireAdminUid(req);
    }

    const body = (await req.json().catch(() => ({}))) as {
      seasonKey?: string;
      playerIds?: string[];
      maxPlayers?: number;
    };
    const seasonKey =
      typeof body.seasonKey === "string" && body.seasonKey.trim()
        ? body.seasonKey.trim()
        : CURRENT_NBA_SEASON_KEY;

    const result = await ingestNbaPlayerContractsFromBdl(getAdminDb(), {
      seasonKey,
      playerIds: Array.isArray(body.playerIds) ? body.playerIds : undefined,
      maxPlayers:
        typeof body.maxPlayers === "number" ? body.maxPlayers : undefined,
    });

    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "unauthorized" || msg === "forbidden") {
      return NextResponse.json({ ok: false, error: msg }, { status: 401 });
    }
    console.error("[nba-player-contracts-ingest]", e);
    return NextResponse.json(
      { ok: false, error: "ingest_failed", message: msg },
      { status: 500 }
    );
  }
}
