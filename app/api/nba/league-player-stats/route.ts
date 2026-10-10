export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { playerStatLeadersCacheControl } from "@/lib/nba/playerStatLeaders/playerStatLeadersCacheControl";
import {
  loadPlayerStatLeadersSnapshot,
  normalizePlayerStatLeadersSeasonKey,
} from "@/lib/nba/playerStatLeaders/loadPlayerStatLeadersSnapshot";
import { resolveNbaStatsDisplaySeasonKey } from "@/lib/nba/resolveNbaStatsDisplaySeason";
import { loadNbaDisciplineSnapshot } from "@/lib/nba/discipline/nbaDisciplineSnapshot";
import { applyDisciplineToPlayerLeadersBundle } from "@/lib/nba/discipline/applyDisciplineToLeagueBundles";

/**
 * GET /api/nba/league-player-stats?season=2025-26
 * 認証不要。Firestore 共有スナップショット。
 *
 * - `season` 明示時: そのキーだけ読む（空なら empty。前期へ落とさない）
 * - `season` 未指定: 今季データ無ければ前期へフォールバック
 * HTTP Cache-Control のみ（unstable_cache は薄い doc を掴み続けるため使わない）。
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const db = getAdminDb();
    const rawSeason = url.searchParams.get("season");
    const hasExplicitSeason = rawSeason != null && rawSeason.trim() !== "";
    const season = hasExplicitSeason
      ? normalizePlayerStatLeadersSeasonKey(rawSeason)
      : (await resolveNbaStatsDisplaySeasonKey(db, null)).seasonKey;

    const [base, discipline] = await Promise.all([
      loadPlayerStatLeadersSnapshot(db, season),
      loadNbaDisciplineSnapshot(db, season),
    ]);
    const payload = {
      ...base,
      bundle: applyDisciplineToPlayerLeadersBundle(base.bundle, discipline),
    };
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": playerStatLeadersCacheControl({
          source: payload.source,
          updatedAt: payload.updatedAt ? new Date(payload.updatedAt) : null,
        }),
      },
    });
  } catch (e: unknown) {
    console.error("[api/nba/league-player-stats]", e);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
