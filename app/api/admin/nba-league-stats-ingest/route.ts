export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireAdminUid } from "@/lib/admin/requireAdminUid";
import { checkJobSecret } from "@/lib/security/assertJobSecret";
import {
  ingestNbaLeagueStatsFromProvider,
  NBA_LEAGUE_STATS_SEASON_LOOKBACK,
} from "@/lib/nba/ingest/nbaLeagueStatsIngest";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

/**
 * POST /api/admin/nba-league-stats-ingest
 * BDL → Firestore 共有スナップショット（Team + Player Leaders）。
 * 認証: Admin UID または job secret。
 *
 * body: {
 *   seasonKey?: "2025-26",
 *   lookbackSeasons?: number  // 例: 5 → 今季から5シーズン（regular+playoffs）
 * }
 */
export async function POST(req: Request) {
  try {
    if (!checkJobSecret(req)) {
      await requireAdminUid(req);
    }

    const body = (await req.json().catch(() => ({}))) as {
      seasonKey?: string;
      lookbackSeasons?: number;
    };
    const seasonKey =
      typeof body.seasonKey === "string" && body.seasonKey.trim()
        ? body.seasonKey.trim()
        : CURRENT_NBA_SEASON_KEY;
    const lookbackSeasons =
      typeof body.lookbackSeasons === "number" &&
      Number.isFinite(body.lookbackSeasons)
        ? body.lookbackSeasons
        : undefined;

    const result = await ingestNbaLeagueStatsFromProvider(getAdminDb(), {
      seasonKey,
      lookbackSeasons,
    });

    return NextResponse.json({
      ...result,
      defaultLookback: NBA_LEAGUE_STATS_SEASON_LOOKBACK,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "unauthorized" || msg === "forbidden") {
      return NextResponse.json({ ok: false, error: msg }, { status: 401 });
    }
    console.error("[nba-league-stats-ingest]", e);
    return NextResponse.json(
      { ok: false, error: "ingest_failed", message: msg },
      { status: 500 }
    );
  }
}
