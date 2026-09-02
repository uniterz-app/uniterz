export const runtime = "nodejs";
export const maxDuration = 300;

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireAdminUid } from "@/lib/admin/requireAdminUid";
import { checkJobSecret } from "@/lib/security/assertJobSecret";
import {
  ingestNbaProBriefs,
  type NbaProBriefIngestMode,
} from "@/lib/nba/insights/ingestProBriefs";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

/**
 * POST /api/admin/nba-pro-brief-ingest
 *
 * body: {
 *   seasonKey?: "2026-27",
 *   mode?: "full" | "patch",
 *   fullHorizonHours?: number,
 *   gameIds?: string[]
 * }
 *
 * full … 翌日窓の試合をフル生成（前日 19:00）
 * patch … tip 1h 前の試合に Firestore injury スナップショットを反映した完全版
 */
export async function POST(req: Request) {
  try {
    if (!checkJobSecret(req)) {
      await requireAdminUid(req);
    }

    const body = (await req.json().catch(() => ({}))) as {
      seasonKey?: string;
      mode?: NbaProBriefIngestMode;
      fullHorizonHours?: number;
      gameIds?: string[];
      rebuildPriorRecords?: boolean;
    };

    const seasonKey =
      typeof body.seasonKey === "string" && body.seasonKey.trim()
        ? body.seasonKey.trim()
        : CURRENT_NBA_SEASON_KEY;
    const mode: NbaProBriefIngestMode =
      body.mode === "patch" ? "patch" : "full";

    const result = await ingestNbaProBriefs(getAdminDb(), {
      seasonKey,
      mode,
      fullHorizonHours:
        typeof body.fullHorizonHours === "number"
          ? body.fullHorizonHours
          : undefined,
      gameIds: Array.isArray(body.gameIds)
        ? body.gameIds.filter((x) => typeof x === "string" && x.trim())
        : undefined,
      rebuildPriorRecords: body.rebuildPriorRecords === true,
    });

    return NextResponse.json(result, { status: result.ok ? 200 : 207 });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
