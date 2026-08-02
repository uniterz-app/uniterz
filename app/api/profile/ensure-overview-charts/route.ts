/**
 * profileCharts が揃っていなければソースから埋めて cumulative_stats に書き戻す。
 * 公開チャートなので uid 指定で誰でも ensure 可（欠けているときだけ書込）。
 */
import { NextResponse } from "next/server";
import { ensureProfileChartsBundle } from "@/lib/profile/ensureProfileChartsBundle";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const uid = (url.searchParams.get("uid") ?? "").trim();
    if (!uid) {
      return NextResponse.json({ error: "uid required" }, { status: 400 });
    }
    const force = url.searchParams.get("force") === "1";
    const seasonKey =
      (url.searchParams.get("seasonKey") ?? "").trim() || CURRENT_NBA_SEASON_KEY;

    const bundle = await ensureProfileChartsBundle(uid, {
      seasonKey,
      forceRebuild: force,
    });
    return NextResponse.json({
      ok: true,
      seasonKey: bundle.seasonKey,
      dailyTrend: bundle.dailyTrend,
      rankTrend: bundle.rankTrend,
      last20: bundle.last20,
      builtAtMs: bundle.builtAtMs,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ensure failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
