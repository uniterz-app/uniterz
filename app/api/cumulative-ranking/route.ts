// app/api/cumulative-ranking/route.ts

import { NextResponse } from "next/server";
import { CUMULATIVE_RANKING_REVALIDATE_SEC } from "@/lib/rankings/cumulativeRankingCache";
import { mergeUserPlansIntoSingleRanking } from "@/lib/rankings/mergeUserPlanIntoRankingPayload";
import { isRankingPhase, type RankingPhase } from "@/lib/rankings/rankingPhase";
import {
  getCachedCumulativeRanking,
  isCumulativeRankingApiMetric,
  type CumulativeRankingApiMetric,
} from "@/lib/rankings/server/fetchCumulativeRankingPayload";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const rawMetric = searchParams.get("metric") ?? "totalPoints";
    const uid = searchParams.get("uid");
    const rawPhase = searchParams.get("phase");

    const metric: CumulativeRankingApiMetric = isCumulativeRankingApiMetric(
      rawMetric
    )
      ? rawMetric
      : "totalPoints";
    const phase: RankingPhase = isRankingPhase(rawPhase)
      ? rawPhase
      : "playoffs";

    const baseUrl =
      process.env.CUMULATIVE_RANKING_FUNCTION_URL ??
      process.env.NEXT_PUBLIC_CUMULATIVE_RANKING_FUNCTION_URL;

    if (!baseUrl) {
      return NextResponse.json(
        {
          ok: false,
          error: "CUMULATIVE_RANKING_FUNCTION_URL is not set",
        },
        { status: 500 }
      );
    }

    const payload = await getCachedCumulativeRanking(
      metric,
      uid ?? "__anon__",
      phase
    );

    if (!payload.ok) {
      return NextResponse.json(
        { ok: false, error: payload.error },
        { status: payload.status }
      );
    }

    const body =
      typeof structuredClone === "function"
        ? structuredClone(payload)
        : (JSON.parse(JSON.stringify(payload)) as typeof payload);
    await mergeUserPlansIntoSingleRanking({
      rows: body.rows,
      myRow: body.myRow,
    });

    const maxAge = Math.min(120, CUMULATIVE_RANKING_REVALIDATE_SEC);
    const cacheControl = uid
      ? `private, max-age=${maxAge}, s-maxage=${CUMULATIVE_RANKING_REVALIDATE_SEC}`
      : `public, max-age=${maxAge}, s-maxage=${CUMULATIVE_RANKING_REVALIDATE_SEC}, stale-while-revalidate=${CUMULATIVE_RANKING_REVALIDATE_SEC * 4}`;

    return NextResponse.json(
      {
        ok: true,
        metric: body.metric,
        phase: body.phase,
        count: body.count,
        rows: body.rows,
        myRank: body.myRank,
        myRow: body.myRow,
      },
      { status: 200, headers: { "Cache-Control": cacheControl } }
    );
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        error: e?.message ?? "unexpected error",
      },
      { status: 500 }
    );
  }
}