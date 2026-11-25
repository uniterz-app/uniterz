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
import { pollProInsightNarrativeBatches } from "@/lib/nba/insights/proInsightLlm/ingestProInsightNarrativeBatch";
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
 * batch_submit / narrative_patch … ナラティブ（OpenAI）の生成は停止済み。「予想の材料」+ 裏のシミュレーションだけ
 *   計算し直す（変わった試合だけ書く。batch_submit = 19:00 に 24h 以内を作り直す。narrative_patch = 毎時 :15、
 *   開始 24h 以内でまだ無い予想は作る。もうある予想は欠場が変わったとき、またはラインが動いた試合だけ直す）
 * batch_poll … 停止前に投入済みの Batch の完了ポーリング（新しい投入は無いので空振りで終わる）
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
    /** 毎時・15 分ごとの cron が空振りのたびにキャッシュを捨てると Vercel が Firestore を読み直す */
    const respond = <T extends { ok: boolean }>(
      result: T,
      changed: { insight: boolean; teamDocs: boolean }
    ) => {
      if (changed.insight) revalidateMatchupInsightCache();
      if (changed.teamDocs) {
        revalidateNbaDocCache([
          "nbaTeamSeasonRecords",
          "nbaTeamInsightExtras",
          "nbaTeamAceOutRecords",
        ]);
      }
      return NextResponse.json(result, { status: result.ok ? 200 : 207 });
    };

    if (mode === "batch_poll") {
      const result = await pollProInsightNarrativeBatches(db);
      return respond(result, { insight: result.polled > 0, teamDocs: false });
    }

    const refreshKits = async (kitMode: "daily" | "hourly") => {
      try {
        return await refreshPredictKits(db, { seasonKey, mode: kitMode });
      } catch (e) {
        return { error: e instanceof Error ? e.message : String(e) };
      }
    };

    // ナラティブ（OpenAI）は作らない。cron が送るモード名は変えずに予想の材料だけ回す
    if (mode === "batch_submit" || mode === "narrative_patch") {
      const predictKits = await refreshKits(mode === "batch_submit" ? "daily" : "hourly");
      return respond(
        { ok: true, narrative: "stopped", predictKits },
        {
          // 変わっていなくても tag を捨てる（書いた直後に空キャッシュが残らないように）
          insight: true,
          teamDocs: false,
        }
      );
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

    return respond(result, { insight: true, teamDocs: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
