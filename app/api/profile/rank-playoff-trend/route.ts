import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { resolveUidByHandleCached } from "@/lib/profile/resolveUidByHandleCached";
import { loadRankSnapshotHistoryDocsWalkBack } from "@/lib/rankings/server/loadRankSnapshotHistoryDocs";
import { coerceTotalPointsRank } from "@/lib/profile/resolvePlayoffTotalPointsRank";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import {
  isRankingLeagueSource,
  type RankingLeagueSource,
} from "@/lib/rankings/rankingLeagueSource";
import { isWcRankingStage, type WcRankingStage } from "@/lib/rankings/wcRankingStage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** ランキングスナップショット最新 N 件（「過去 N 日」ではない） */
const MAX_POINTS = 10;

export type RankPlayoffTrendPoint = {
  dateKey: string;
  rank: number;
};

type HistoryDoc = {
  seasons?: Partial<Record<string, Record<string, unknown>>>;
  wc?: Partial<Record<WcRankingStage, Record<string, unknown>>>;
};

function rankFromHistoryDoc(
  data: HistoryDoc | undefined,
  opts: {
    rankingLeague: RankingLeagueSource;
    wcStage: WcRankingStage;
  }
): number | null {
  if (!data) return null;
  if (opts.rankingLeague === "worldcup") {
    const block = data.wc?.[opts.wcStage];
    return coerceTotalPointsRank(block?.totalPoints);
  }
  // NBA は現行シーズンの seasons ブロックのみ（旧シーズンの順位は混ぜない）
  return coerceTotalPointsRank(
    data.seasons?.[CURRENT_NBA_SEASON_KEY]?.totalPoints
  );
}

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

    const historyDocs = await loadRankSnapshotHistoryDocsWalkBack(resolvedUid, {
      maxDocs: MAX_POINTS,
      maxLookbackDays: 90,
    });

    const points: RankPlayoffTrendPoint[] = [];
    historyDocs.forEach((d) => {
      const data = d.data as HistoryDoc;
      const rank = rankFromHistoryDoc(data, {
        rankingLeague,
        wcStage,
      });
      if (rank != null) {
        points.push({ dateKey: d.id, rank });
      }
    });

    points.reverse();

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
