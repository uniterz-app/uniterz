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
import {
  patchProInsightNarrativesIfInjuryChanged,
  pollProInsightNarrativeBatches,
  submitProInsightNarrativeBatch,
} from "@/lib/nba/insights/proInsightLlm/ingestProInsightNarrativeBatch";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

type RouteMode =
  | NbaProBriefIngestMode
  | "batch_submit"
  | "batch_poll"
  | "narrative_patch";

/**
 * POST /api/admin/nba-pro-brief-ingest
 *
 * body: {
 *   seasonKey?: "2026-27",
 *   mode?: "full" | "patch" | "batch_submit" | "batch_poll" | "narrative_patch",
 *   fullHorizonHours?: number,
 *   gameIds?: string[],
 *   rebuildPriorRecords?: boolean,
 *   includePreseason?: boolean,
 *   syncChat?: boolean
 * }
 *
 * full / patch … 旧テンプレ proBrief
 * batch_submit … 毎日 20:00 ナラティブ Batch 投入
 *   includePreseason + syncChat … admin スモーク（通常 cron では使わない）
 * batch_poll … Batch 完了ポーリング
 * narrative_patch … tip 1h 前 · injury 指紋が変わった試合だけ Chat 再生成
 */
export async function POST(req: Request) {
  try {
    if (!checkJobSecret(req)) {
      await requireAdminUid(req);
    }

    const body = (await req.json().catch(() => ({}))) as {
      seasonKey?: string;
      mode?: RouteMode;
      fullHorizonHours?: number;
      gameIds?: string[];
      rebuildPriorRecords?: boolean;
      includePreseason?: boolean;
      syncChat?: boolean;
    };

    const seasonKey =
      typeof body.seasonKey === "string" && body.seasonKey.trim()
        ? body.seasonKey.trim()
        : CURRENT_NBA_SEASON_KEY;

    const mode: RouteMode =
      body.mode === "patch"
        ? "patch"
        : body.mode === "batch_submit"
          ? "batch_submit"
          : body.mode === "batch_poll"
            ? "batch_poll"
            : body.mode === "narrative_patch"
              ? "narrative_patch"
              : body.mode === "full"
                ? "full"
                : "full";

    const db = getAdminDb();

    if (mode === "batch_poll") {
      const result = await pollProInsightNarrativeBatches(db);
      return NextResponse.json(result, { status: result.ok ? 200 : 207 });
    }

    if (mode === "batch_submit") {
      const result = await submitProInsightNarrativeBatch(db, {
        seasonKey,
        fullHorizonHours:
          typeof body.fullHorizonHours === "number"
            ? body.fullHorizonHours
            : undefined,
        gameIds: Array.isArray(body.gameIds)
          ? body.gameIds.filter((x) => typeof x === "string" && x.trim())
          : undefined,
        includePreseason: body.includePreseason === true,
        syncChat: body.syncChat === true,
      });
      return NextResponse.json(result, { status: result.ok ? 200 : 207 });
    }

    if (mode === "narrative_patch") {
      const result = await patchProInsightNarrativesIfInjuryChanged(db, {
        seasonKey,
        gameIds: Array.isArray(body.gameIds)
          ? body.gameIds.filter((x) => typeof x === "string" && x.trim())
          : undefined,
      });
      return NextResponse.json(result, { status: result.ok ? 200 : 207 });
    }

    const result = await ingestNbaProBriefs(db, {
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
