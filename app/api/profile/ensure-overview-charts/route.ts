/**
 * profileCharts が揃っていなければソースから埋めて cumulative_stats に書き戻す。
 * 欠け補完は公開可。force 再構築は本人 Bearer のみ（コスト爆弾防止）。
 */
import { NextResponse } from "next/server";
import { ensureProfileChartsBundle } from "@/lib/profile/ensureProfileChartsBundle";
import { profileOverviewSeasonKey } from "@/lib/profile/profileOverviewSeason";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";

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
    if (force) {
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
