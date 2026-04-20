import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { resolveUidByHandleCached } from "@/lib/profile/resolveUidByHandleCached";
import { coerceTotalPointsRank } from "@/lib/profile/resolvePlayoffTotalPointsRank";
import { isRankingPhase, type RankingPhase } from "@/lib/rankings/rankingPhase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** ランキングスナップショット最新 N 件（「過去 N 日」ではない） */
const MAX_POINTS = 10;

export type RankPlayoffTrendPoint = {
  dateKey: string;
  rank: number;
};

/**
 * cumulative_stats/{uid}/rankSnapshotHistory の各 snapshot doc から
 * 指定 phase ブロックの totalPoints（順位）のみを返す。
 * ?phase=play_in|playoffs（省略時は playoffs）。
 */
export async function GET(req: Request) {
  try {
    const adminDb = getAdminDb();
    const { searchParams } = new URL(req.url);
    const rawPhase = searchParams.get("phase")?.trim() ?? "";
    const phase: RankingPhase = isRankingPhase(rawPhase)
      ? rawPhase
      : "playoffs";
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

    /**
     * orderBy(documentId) は環境によってインデックス・挙動で取りこぼすことがある。
     * サブコレクションは日次で件数が少ない想定なので全件取得し、ドキュメント ID（YYYY-MM-DD）でソートして直近 MAX_POINTS 件に絞る。
     */
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
      const data = d.data() as {
        play_in?: Record<string, unknown>;
        playoffs?: Record<string, unknown>;
      };
      const rank =
        phase === "play_in"
          ? coerceTotalPointsRank(data?.play_in?.totalPoints)
          : coerceTotalPointsRank(data?.playoffs?.totalPoints);
      if (rank != null) {
        points.push({ dateKey: d.id, rank });
      }
    });

    points.reverse();

    return NextResponse.json({
      ok: true,
      resolvedUid,
      phase,
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
