// app/api/cumulative-ranking/route.ts

import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { CUMULATIVE_RANKING_REVALIDATE_SEC } from "@/lib/rankings/cumulativeRankingCache";

export const runtime = "nodejs";

const ALLOWED_METRICS = [
  "totalPoints",
  "totalPrecision",
  "totalUpset",
  "activeWinStreak",
  "winRate",
] as const;

type RankingMetric = (typeof ALLOWED_METRICS)[number];

function isRankingMetric(v: string): v is RankingMetric {
  return ALLOWED_METRICS.includes(v as RankingMetric);
}

async function fetchSingleRanking(metric: RankingMetric, uid: string | null) {
  const baseUrl =
    process.env.CUMULATIVE_RANKING_FUNCTION_URL ??
    process.env.NEXT_PUBLIC_CUMULATIVE_RANKING_FUNCTION_URL;

  if (!baseUrl) {
    throw new Error("CUMULATIVE_RANKING_FUNCTION_URL is not set");
  }

  const url = new URL(baseUrl);
  url.searchParams.set("metric", metric);
  if (uid) url.searchParams.set("uid", uid);

  const res = await fetch(url.toString(), {
    method: "GET",
    cache: "no-store",
  });

  const json = await res.json();

  if (!res.ok) {
    return {
      ok: false as const,
      status: res.status,
      error: json?.error ?? "failed to fetch ranking",
    };
  }

  return {
    ok: true as const,
    metric,
    count: json?.count ?? 0,
    rows: json?.rows ?? [],
    myRank: json?.myRank ?? null,
    myRow: json?.myRow ?? null,
  };
}

const getCachedSingle = unstable_cache(
  async (metric: RankingMetric, uidKey: string) => {
    const uid = uidKey === "__anon__" ? null : uidKey;
    return fetchSingleRanking(metric, uid);
  },
  ["cumulative-ranking-single-v1"],
  { revalidate: CUMULATIVE_RANKING_REVALIDATE_SEC }
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const rawMetric = searchParams.get("metric") ?? "totalPoints";
    const uid = searchParams.get("uid");

    const metric: RankingMetric = isRankingMetric(rawMetric)
      ? rawMetric
      : "totalPoints";

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

    const payload = await getCachedSingle(metric, uid ?? "__anon__");

    if (!payload.ok) {
      return NextResponse.json(
        { ok: false, error: payload.error },
        { status: payload.status }
      );
    }

    const maxAge = Math.min(120, CUMULATIVE_RANKING_REVALIDATE_SEC);
    const cacheControl = uid
      ? `private, max-age=${maxAge}, s-maxage=${CUMULATIVE_RANKING_REVALIDATE_SEC}`
      : `public, max-age=${maxAge}, s-maxage=${CUMULATIVE_RANKING_REVALIDATE_SEC}, stale-while-revalidate=${CUMULATIVE_RANKING_REVALIDATE_SEC * 4}`;

    return NextResponse.json(
      {
        ok: true,
        metric: payload.metric,
        count: payload.count,
        rows: payload.rows,
        myRank: payload.myRank,
        myRow: payload.myRow,
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