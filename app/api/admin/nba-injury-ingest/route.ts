export const runtime = "nodejs";
export const maxDuration = 120;

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireAdminUid } from "@/lib/admin/requireAdminUid";
import { checkJobSecret } from "@/lib/security/assertJobSecret";
import {
  runNbaInjuryIngestSchedule,
  type NbaInjuryIngestBaselineSlot,
  type NbaInjuryIngestTrigger,
} from "@/lib/nba/teamInjuries/runNbaInjuryIngestSchedule";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

/**
 * POST /api/admin/nba-injury-ingest
 *
 * BDL player_injuries → Firestore（専用スケジュール用）。
 * 認証: Admin UID または job secret。
 *
 * body: {
 *   seasonKey?: "2026-27",
 *   trigger: "baseline" | "pregame",
 *   baselineSlot?: "16" | "23"
 * }
 */
export async function POST(req: Request) {
  try {
    if (!checkJobSecret(req)) {
      await requireAdminUid(req);
    }

    const body = (await req.json().catch(() => ({}))) as {
      seasonKey?: string;
      trigger?: NbaInjuryIngestTrigger;
      baselineSlot?: NbaInjuryIngestBaselineSlot;
    };

    const trigger: NbaInjuryIngestTrigger =
      body.trigger === "pregame" ? "pregame" : "baseline";
    const seasonKey =
      typeof body.seasonKey === "string" && body.seasonKey.trim()
        ? body.seasonKey.trim()
        : CURRENT_NBA_SEASON_KEY;
    const baselineSlot =
      body.baselineSlot === "16" || body.baselineSlot === "23"
        ? body.baselineSlot
        : undefined;

    const result = await runNbaInjuryIngestSchedule(getAdminDb(), {
      seasonKey,
      trigger,
      baselineSlot,
    });

    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "unauthorized" || msg === "forbidden") {
      return NextResponse.json({ ok: false, error: msg }, { status: 401 });
    }
    console.error("[nba-injury-ingest]", e);
    return NextResponse.json(
      { ok: false, error: "ingest_failed", message: msg },
      { status: 500 }
    );
  }
}
