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
import { refreshPredictKits } from "@/lib/nba/insights/predictKit/refreshPredictKits";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { revalidateMatchupInsightCache } from "@/lib/nba/predict/matchupInsightCache";
import { revalidateNbaDocCache } from "@/lib/nba/nbaPublicReadDb";

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
 * batch_submit / narrative_patch のあと「予想の材料」+ 裏のシミュレーションを計算し直す（変わった試合だけ書く。
 *   batch_submit = 20:00 に翌日 24h 分を作る。narrative_patch = もうある予想を欠場が変わったときだけ直す）
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
    const respond = <T extends { ok: boolean }>(result: T) => {
      revalidateMatchupInsightCache();
      revalidateNbaDocCache([
        "nbaTeamSeasonRecords",
        "nbaTeamInsightExtras",
        "nbaTeamAceOutRecords",
      ]);
      return NextResponse.json(result, { status: result.ok ? 200 : 207 });
    };

    if (mode === "batch_poll") {
      const result = await pollProInsightNarrativeBatches(db);
      return respond(result);
    }

    const refreshKits = async (kitMode: "daily" | "hourly") => {
      try {
        return await refreshPredictKits(db, { seasonKey, mode: kitMode });
      } catch (e) {
        return { error: e instanceof Error ? e.message : String(e) };
      }
    };

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
      return respond({ ...result, predictKits: await refreshKits("daily") });
    }

    if (mode === "narrative_patch") {
      const result = await patchProInsightNarrativesIfInjuryChanged(db, {
        seasonKey,
        gameIds: Array.isArray(body.gameIds)
          ? body.gameIds.filter((x) => typeof x === "string" && x.trim())
          : undefined,
      });
      return respond({ ...result, predictKits: await refreshKits("hourly") });
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

    return respond(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
