import { NextResponse } from "next/server";
import { clientErrorResponse } from "@/lib/security/clientErrorResponse";
import { unstable_cache } from "next/cache";
import { getAdminDb } from "@/lib/firebaseAdmin";
import type { PredictProBrief } from "@/lib/predict/predictProBrief";
import { sanitizeProBriefForDisplay } from "@/lib/predict/validateProBrief";
import {
  readProInsightNarrativeMeta,
  resolveProInsightNarrativeStatus,
  sanitizeProInsightNarrativeForDisplay,
} from "@/lib/predict/validateProInsightNarrative";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { assertProUser } from "@/lib/pro/assertProUser";
import {
  MATCHUP_INSIGHT_CACHE_REVALIDATE_SEC,
  MATCHUP_INSIGHT_CACHE_TAG,
} from "@/lib/nba/predict/matchupInsightCache";
import { loadGameProInsight } from "@/lib/nba/insights/gameProInsightStore";
import { buildProInsightPreviewTeaser } from "@/lib/predict/proInsightPreviewTeaser";
import {
  SMART_MONEY_MARKETS_COLLECTION,
  sanitizeSmartMoneyMarket,
  type SmartMoneyMarket,
} from "@/lib/predict/smartMoneyMarket";
import { smartMoneyCohortWeekLabel } from "@/lib/predict/smartMoneyMarketServer";

async function loadMatchupInsightPayload(gameId: string) {
  const db = getAdminDb();
  const snap = await db.collection("games").doc(gameId).get();
  if (!snap.exists) return { kind: "not_found" as const };

  const game = snap.data() as Record<string, unknown>;
  if (String(game.league ?? "").toLowerCase() !== "nba") {
    return { kind: "not_nba" as const };
  }
  const data = await loadGameProInsight(db, gameId, game);

  const narrative = sanitizeProInsightNarrativeForDisplay(
    data.proInsightNarrative
  );
  const narrativeMeta = readProInsightNarrativeMeta(
    data.proInsightNarrative,
    data.proInsightFacts
  );
  const status = resolveProInsightNarrativeStatus({
    narrative,
    pendingBatch: narrativeMeta.pendingBatch === true,
  });

  const brief = sanitizeProBriefForDisplay(
    data.proBrief as PredictProBrief | null | undefined
  );

  const updatedAtMs =
    (typeof narrativeMeta.generatedAtMs === "number"
      ? narrativeMeta.generatedAtMs
      : null) ??
    (data.proBriefUpdatedAt &&
    typeof (data.proBriefUpdatedAt as { toMillis?: () => number }).toMillis ===
      "function"
      ? (data.proBriefUpdatedAt as { toMillis: () => number }).toMillis()
      : null);

  return {
    kind: "ok" as const,
    body: {
      ok: true,
      gameId,
      status,
      narrative,
      narrativeMeta,
      /** @deprecated 旧 HOME/AWAY。新 UI は narrative を使う */
      brief,
      updatedAt:
        updatedAtMs != null ? new Date(updatedAtMs).toISOString() : null,
    },
  };
}

/** 先週 TOP 5% の予想分布。投稿で毎回動くのでナラティブのキャッシュには入れない */
async function loadSmartMoneyMarket(gameId: string): Promise<SmartMoneyMarket | null> {
  try {
    const snap = await getAdminDb()
      .collection(SMART_MONEY_MARKETS_COLLECTION)
      .doc(gameId)
      .get();
    if (!snap.exists) return null;
    const d = snap.data() ?? {};
    if (d.weekLabel !== smartMoneyCohortWeekLabel()) return null;
    const pick =
      d.pickCounts && typeof d.pickCounts === "object"
        ? (d.pickCounts as Record<string, unknown>)
        : {};
    return sanitizeSmartMoneyMarket({
      weekLabel: d.weekLabel,
      home: pick.home,
      away: pick.away,
      draw: pick.draw,
      cohortSize: d.cohortSize,
    });
  } catch (e) {
    console.error("[matchup-insight] smart money market", e);
    return null;
  }
}

/**
 * GET /api/nba/matchup-insight?gameId=
 *
 * Pro のみ `smartMarket`: `nbaSmartMoneyMarkets/{gameId}`（先週 Pick Up 週間 TOP 5% の予想分布）。
 *
 * Firestore gameProInsights/{id}（クライアント読み取り不可）:
 *   - proInsightNarrative … 新 UI（試合共通スナップショット · Pro 限定）
 *   - proBrief … 旧 HOME/AWAY テンプレ（互換のため残す）
 *
 * クライアントは narrative を優先。未生成は status: "empty" | "pending"。
 * Free + `teaser=1`: PREVIEW の第 1 段落だけ `{ locked: true, teaser }`。PREVIEW の無い試合は 403。
 * Pro 判定は毎回。試合共通部分は unstable_cache（書き込み側 ingest で tag を捨てる）。
 */
export async function GET(req: Request) {
  try {
    let uid: string;
    try {
      uid = await requireUidFromRequest(req);
    } catch {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const isPro = await assertProUser(uid);
    const wantsTeaser = searchParams.get("teaser") === "1";
    if (!isPro && !wantsTeaser) {
      return NextResponse.json(
        { ok: false, error: "pro_required", locked: true },
        { status: 403 }
      );
    }

    const gameId = (searchParams.get("gameId") ?? "").trim();
    if (!gameId) {
      return NextResponse.json(
        { ok: false, error: "gameId_required" },
        { status: 400 }
      );
    }

    const result = await unstable_cache(
      () => loadMatchupInsightPayload(gameId),
      ["matchup-insight", gameId],
      {
        revalidate: MATCHUP_INSIGHT_CACHE_REVALIDATE_SEC,
        tags: [MATCHUP_INSIGHT_CACHE_TAG],
      }
    )();

    if (result.kind !== "ok") {
      return NextResponse.json(
        { ok: false, error: result.kind },
        { status: 404 }
      );
    }

    if (!isPro) {
      const teaser = buildProInsightPreviewTeaser(result.body.narrative);
      if (!teaser) {
        return NextResponse.json(
          { ok: false, error: "pro_required", locked: true },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { ok: true, gameId, locked: true, teaser },
        { headers: { "Cache-Control": "private, no-store" } }
      );
    }

    const smartMarket = await loadSmartMoneyMarket(gameId);

    return NextResponse.json({ ...result.body, smartMarket }, {
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    return clientErrorResponse(e, "GET /api/nba/matchup-insight");
  }
}
