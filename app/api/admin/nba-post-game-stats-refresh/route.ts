export const runtime = "nodejs";
export const maxDuration = 300;

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireAdminUid } from "@/lib/admin/requireAdminUid";
import { checkJobSecret } from "@/lib/security/assertJobSecret";
import { runNbaPostGameStatsRefresh } from "@/lib/nba/ingest/nbaPostGameStatsRefresh";
import { revalidateNbaDisciplineApiCache } from "@/lib/nba/discipline/nbaDisciplineApiCache";

/**
 * POST /api/admin/nba-post-game-stats-refresh
 *
 * 試合後スタッツ監視（BDL のシーズン集計に終了試合が入ったら即 ingest）。
 * Functions `runNbaLiveGamesIngestCron` が 10 分ごと、監視中の試合があるときだけ呼ぶ。
 * 認証: Admin UID または job secret。
 */
export async function POST(req: Request) {
  try {
    if (!checkJobSecret(req)) {
      await requireAdminUid(req);
    }
    const result = await runNbaPostGameStatsRefresh(getAdminDb());
    if (result.ran) revalidateNbaDisciplineApiCache();
    return NextResponse.json(result, { status: result.ok ? 200 : 207 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "unauthorized" || msg === "forbidden") {
      return NextResponse.json({ ok: false, error: msg }, { status: 401 });
    }
    console.error("[nba-post-game-stats-refresh]", e);
    return NextResponse.json(
      { ok: false, error: "refresh_failed", message: msg },
      { status: 500 }
    );
  }
}
