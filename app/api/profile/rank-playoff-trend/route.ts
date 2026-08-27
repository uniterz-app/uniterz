import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { resolveUidByHandleCached } from "@/lib/profile/resolveUidByHandleCached";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import {
  buildRankPlayoffTrendPoints,
  type RankPlayoffTrendPoint,
} from "@/lib/rankings/server/buildRankPlayoffTrendPoints";
import {
  isRankingLeagueSource,
  type RankingLeagueSource,
} from "@/lib/rankings/rankingLeagueSource";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type { RankPlayoffTrendPoint };

/**
 * cumulative_stats/{uid}/rankSnapshotHistory の各 snapshot doc から
 * 総合得点順位の推移を返す。
 * NBA: 現行シーズン（seasons.<CURRENT_NBA_SEASON_KEY>）固定
 */
export async function GET(req: Request) {
  try {
    const adminDb = getAdminDb();
    const { searchParams } = new URL(req.url);
    const rawLeague = searchParams.get("league");
    const rankingLeague: RankingLeagueSource = isRankingLeagueSource(rawLeague)
      ? rawLeague
      : "nba";
    const uidParam = searchParams.get("uid")?.trim() ?? "";
    const handleParam = searchParams.get("handle")?.trim() ?? "";

    let resolvedUid = uidParam;
    if (!resolvedUid && handleParam) {
      resolvedUid = (await resolveUidByHandleCached(adminDb, handleParam)) ?? "";
    }

    if (!resolvedUid) {
      if (handleParam) {
        return NextResponse.json(
          { ok: false, error: "user not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { ok: false, error: "uid or handle is required" },
        { status: 400 }
      );
    }

    const points = await buildRankPlayoffTrendPoints(resolvedUid, {
      rankingLeague,
    });

    return NextResponse.json({
      ok: true,
      resolvedUid,
      seasonKey: CURRENT_NBA_SEASON_KEY,
      rankingLeague,
      wcStage: null,
      points,
    });
  } catch (e: unknown) {
    console.error("[api/profile/rank-playoff-trend]", e);
    return NextResponse.json(
      { ok: false, error: "internal" },
      { status: 500 }
    );
  }
}
