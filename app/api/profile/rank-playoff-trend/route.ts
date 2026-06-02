import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { resolveUidByHandleCached } from "@/lib/profile/resolveUidByHandleCached";
import { coerceTotalPointsRank } from "@/lib/profile/resolvePlayoffTotalPointsRank";
import { isRankingPhase, type RankingPhase } from "@/lib/rankings/rankingPhase";
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
  play_in?: Record<string, unknown>;
  playoffs?: Record<string, unknown>;
  wc?: Partial<Record<WcRankingStage, Record<string, unknown>>>;
};

function rankFromHistoryDoc(
  data: HistoryDoc | undefined,
  opts: {
    rankingLeague: RankingLeagueSource;
    phase: RankingPhase;
    wcStage: WcRankingStage;
  }
): number | null {
  if (!data) return null;
  if (opts.rankingLeague === "worldcup") {
    const block = data.wc?.[opts.wcStage];
    return coerceTotalPointsRank(block?.totalPoints);
  }
  const raw =
    opts.phase === "play_in" ? data.play_in?.totalPoints : data.playoffs?.totalPoints;
  return coerceTotalPointsRank(raw);
}

/**
 * cumulative_stats/{uid}/rankSnapshotHistory の各 snapshot doc から
 * 総合得点順位の推移を返す。
 * NBA: ?phase=play_in|playoffs
 * WC: ?league=worldcup&wcStage=overall|qualifying|main
 */
export async function GET(req: Request) {
  try {
    const adminDb = getAdminDb();
    const { searchParams } = new URL(req.url);
    const rawPhase = searchParams.get("phase")?.trim() ?? "";
    const phase: RankingPhase = isRankingPhase(rawPhase)
      ? rawPhase
      : "playoffs";
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

    const snap = await adminDb
      .collection("cumulative_stats")
      .doc(resolvedUid)
      .collection("rankSnapshotHistory")
      .get();

    const sortedDocs = [...snap.docs].sort((a, b) =>
      a.id.localeCompare(b.id)
    );
    const recentDocs =
      sortedDocs.length > MAX_POINTS
        ? sortedDocs.slice(-MAX_POINTS)
        : sortedDocs;

    const points: RankPlayoffTrendPoint[] = [];
    recentDocs.forEach((d) => {
      const data = d.data() as HistoryDoc;
      const rank = rankFromHistoryDoc(data, {
        rankingLeague,
        phase,
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
      phase,
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
