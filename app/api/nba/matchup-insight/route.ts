import { NextResponse } from "next/server";
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

async function loadMatchupInsightPayload(gameId: string) {
  const snap = await getAdminDb().collection("games").doc(gameId).get();
  if (!snap.exists) return { kind: "not_found" as const };

  const data = snap.data() as Record<string, unknown>;
  if (String(data.league ?? "").toLowerCase() !== "nba") {
    return { kind: "not_nba" as const };
  }

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

/**
 * GET /api/nba/matchup-insight?gameId=
 *
 * Firestore games/{id}:
 *   - proInsightNarrative … 新 UI（試合共通スナップショット · Pro 限定）
 *   - proBrief … 旧 HOME/AWAY テンプレ（互換のため残す）
 *
 * クライアントは narrative を優先。未生成は status: "empty" | "pending"。
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

    const isPro = await assertProUser(uid);
    if (!isPro) {
      return NextResponse.json(
        { ok: false, error: "pro_required", locked: true },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
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

    return NextResponse.json(result.body, {
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
