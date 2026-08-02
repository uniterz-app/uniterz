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
import { isWcRankingStage, type WcRankingStage } from "@/lib/rankings/wcRankingStage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type { RankPlayoffTrendPoint };

/**
 * cumulative_stats/{uid}/rankSnapshotHistory の各 snapshot doc から
 * 総合得点順位の推移を返す。
 * NBA: 現行シーズン（seasons.<CURRENT_NBA_SEASON_KEY>）固定
 * WC: ?league=worldcup&wcStage=overall|qualifying|main
 */
export async function GET(req: Request) {
  try {
    const adminDb = getAdminDb();
    const { searchParams } = new URL(req.url);
    const rawLeague = searchParams.get("league");
    const rankingLeague: RankingLeagueSource = isRankingLeagueSource(rawLeague)
      ? rawLeague
      : "nba";
    const rawWcStage = searchParams.get("wcStage");
    const wcStage: WcRankingStage =
      rankingLeague === "worldcup" && isWcRankingStage(rawWcStage)
        ? rawWcStage
        : "overall";
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
      wcStage,
    });

    return NextResponse.json({
      ok: true,
      resolvedUid,
      seasonKey: rankingLeague === "worldcup" ? null : CURRENT_NBA_SEASON_KEY,
      rankingLeague,
      wcStage: rankingLeague === "worldcup" ? wcStage : null,
      points,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "unexpected error";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
