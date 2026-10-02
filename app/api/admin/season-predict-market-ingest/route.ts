export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireAdminUid } from "@/lib/admin/requireAdminUid";
import { checkJobSecret } from "@/lib/security/assertJobSecret";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { ingestSeasonPredictMarket } from "@/lib/predict/seasonPredictMarketServer";

/**
 * POST /api/admin/season-predict-market-ingest
 * 提出済み season standings / awards を集計 → Firestore `seasonPredictMarkets/{season}`。
 * 運用: 提出締切後に手動で 1 回。認証は Admin UID または job secret。
 *
 * body: { season?: "2026-27", force?: boolean }
 * force=true で締切前でも集計（テスト用）。
 */
export async function POST(req: Request) {
  try {
    if (!checkJobSecret(req)) {
      await requireAdminUid(req);
    }

    const body = (await req.json().catch(() => ({}))) as {
      season?: string;
      force?: boolean;
    };
    const season =
      typeof body.season === "string" && body.season.trim()
        ? body.season.trim()
        : CURRENT_NBA_SEASON_KEY;

    const result = await ingestSeasonPredictMarket(getAdminDb(), {
      season,
      force: body.force === true,
    });

    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "unauthorized" || msg === "forbidden") {
      return NextResponse.json({ ok: false, error: msg }, { status: 401 });
    }
    console.error("[season-predict-market-ingest]", e);
    return NextResponse.json(
      { ok: false, error: "ingest_failed", message: msg },
      { status: 500 }
    );
  }
}
