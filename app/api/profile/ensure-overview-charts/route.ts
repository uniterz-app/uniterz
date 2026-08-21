/**
 * 欠けた profileCharts をソースから埋めて cumulative_stats/profileCharts に書き戻す。
 * プロフィール画面のホットパスからは呼ばない（backfill / force 再構築用）。
 */
import { NextResponse } from "next/server";
import { ensureProfileChartsBundle } from "@/lib/profile/ensureProfileChartsBundle";
import { profileOverviewSeasonKey } from "@/lib/profile/profileOverviewSeason";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { checkJobSecret } from "@/lib/security/assertJobSecret";

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
    const jobOk = checkJobSecret(req);
    if (!jobOk) {
      let caller: string;
      try {
        caller = await requireUidFromRequest(req);
      } catch {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }
      if (caller !== uid) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
    }
    const seasonKey =
      (url.searchParams.get("seasonKey") ?? "").trim() ||
      profileOverviewSeasonKey();

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
