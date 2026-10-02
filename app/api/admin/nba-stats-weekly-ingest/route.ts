export const runtime = "nodejs";
export const maxDuration = 300;

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireAdminUid } from "@/lib/admin/requireAdminUid";
import { checkJobSecret } from "@/lib/security/assertJobSecret";
import { runNbaStatsWeeklyIngest } from "@/lib/nba/ingest/nbaStatsWeeklyIngest";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

/**
 * POST /api/admin/nba-stats-weekly-ingest
 * ペイロール + プレイヤー契約（キャリアは別途手動）。
 * 認証: Admin UID または job secret。
 *
 * body: { seasonKey?: string, contractMaxPlayers?: number }
 */
export async function POST(req: Request) {
  try {
    if (!checkJobSecret(req)) {
      await requireAdminUid(req);
    }

    const body = (await req.json().catch(() => ({}))) as {
      seasonKey?: string;
      contractMaxPlayers?: number;
    };

    const seasonKey =
      typeof body.seasonKey === "string" && body.seasonKey.trim()
        ? body.seasonKey.trim()
        : CURRENT_NBA_SEASON_KEY;

    const result = await runNbaStatsWeeklyIngest(getAdminDb(), {
      seasonKey,
      contractMaxPlayers: body.contractMaxPlayers,
    });

    return NextResponse.json(result, { status: result.ok ? 200 : 207 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "unauthorized" || msg === "forbidden") {
      return NextResponse.json({ ok: false, error: msg }, { status: 401 });
    }
    console.error("[nba-stats-weekly-ingest]", e);
    return NextResponse.json(
      { ok: false, error: "ingest_failed", message: msg },
      { status: 500 }
    );
  }
}
