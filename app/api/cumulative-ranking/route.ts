// app/api/cumulative-ranking/route.ts

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    const url = new URL(baseUrl);
    url.searchParams.set("metric", metric);

    if (uid) {
      url.searchParams.set("uid", uid);
    }

    const res = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store",
    });

    const json = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: json?.error ?? "failed to fetch ranking",
        },
        { status: res.status }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        metric,
        count: json?.count ?? 0,
        rows: json?.rows ?? [],
        myRank: json?.myRank ?? null,
        myRow: json?.myRow ?? null,
      },
      { status: 200 }
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