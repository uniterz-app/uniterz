export const runtime = "nodejs";
export const maxDuration = 300;

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireAdminUid } from "@/lib/admin/requireAdminUid";
import { checkJobSecret } from "@/lib/security/assertJobSecret";
import {
  runNbaStatsDailyIngest,
  type NbaStatsDailyIngestMode,
} from "@/lib/nba/ingest/nbaStatsDailyIngest";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

/**
 * POST /api/admin/nba-stats-daily-ingest
 *
 * 日次スタッツ更新のまとめ実行（BDL → Firestore）。
 * 認証: Admin UID または job secret。
 *
 * body: {
 *   seasonKey?: "2026-27",
 *   mode?: "daily" | "heavy",
 *   playerGameLogMaxPlayers?: number
 * }
 */
export async function POST(req: Request) {
  try {
    if (!checkJobSecret(req)) {
      await requireAdminUid(req);
    }

    const body = (await req.json().catch(() => ({}))) as {
      seasonKey?: string;
      mode?: NbaStatsDailyIngestMode;
      playerGameLogMaxPlayers?: number;
    };

    const seasonKey =
      typeof body.seasonKey === "string" && body.seasonKey.trim()
        ? body.seasonKey.trim()
        : CURRENT_NBA_SEASON_KEY;

    const result = await runNbaStatsDailyIngest(getAdminDb(), {
      seasonKey,
      mode: body.mode === "heavy" ? "heavy" : "daily",
      playerGameLogMaxPlayers: body.playerGameLogMaxPlayers,
    });

    return NextResponse.json(result, { status: result.ok ? 200 : 207 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "unauthorized" || msg === "forbidden") {
      return NextResponse.json({ ok: false, error: msg }, { status: 401 });
    }
    console.error("[nba-stats-daily-ingest]", e);
    return NextResponse.json(
      { ok: false, error: "ingest_failed", message: msg },
      { status: 500 }
    );
  }
}
