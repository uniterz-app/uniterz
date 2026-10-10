export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { leagueTeamStatsCacheControl } from "@/lib/nba/leagueTeamStats/leagueTeamStatsCacheControl";
import {
  loadLeagueTeamStatsSnapshot,
  normalizeLeagueTeamStatsSeasonKey,
} from "@/lib/nba/leagueTeamStats/loadLeagueTeamStatsSnapshot";
import { resolveNbaStatsDisplaySeasonKey } from "@/lib/nba/resolveNbaStatsDisplaySeason";
import { loadNbaDisciplineSnapshot } from "@/lib/nba/discipline/nbaDisciplineSnapshot";
import { applyDisciplineToLeagueTeamBundle } from "@/lib/nba/discipline/applyDisciplineToLeagueBundles";

/**
 * GET /api/nba/league-team-stats?season=2025-26
 * 認証不要。Firestore 共有スナップショット。
 *
 * - `season` 明示時: そのキーだけ読む（空なら empty。前期へ落とさない）
 * - `season` 未指定: 今季データ無ければ前期へフォールバック
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const db = getAdminDb();
    const rawSeason = url.searchParams.get("season");
    const hasExplicitSeason = rawSeason != null && rawSeason.trim() !== "";
    const season = hasExplicitSeason
      ? normalizeLeagueTeamStatsSeasonKey(rawSeason)
      : (await resolveNbaStatsDisplaySeasonKey(db, null)).seasonKey;

    const cached = unstable_cache(
      async () => {
        const adminDb = getAdminDb();
        const [base, discipline] = await Promise.all([
          loadLeagueTeamStatsSnapshot(adminDb, season),
          loadNbaDisciplineSnapshot(adminDb, season),
        ]);
        return {
          ...base,
          bundle: applyDisciplineToLeagueTeamBundle(base.bundle, discipline),
        };
      },
      ["nba-league-team-stats", season],
      { revalidate: 300, tags: ["nba-league-team-stats", `nba-lts:${season}`] }
    );

    const payload = await cached();
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": leagueTeamStatsCacheControl({
          source: payload.source,
          updatedAt: payload.updatedAt ? new Date(payload.updatedAt) : null,
        }),
      },
    });
  } catch (e: unknown) {
    console.error("[api/nba/league-team-stats]", e);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
