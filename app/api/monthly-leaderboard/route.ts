// app/api/monthly-leboard/route.ts

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_METRICS = [
  "totalPoints",
  "winRate",
  "totalPrecision",
  "totalUpset",
] as const;

type RankingMetric = (typeof ALLOWED_METRICS)[number];

function isRankingMetric(v: string): v is RankingMetric {
  return ALLOWED_METRICS.includes(v as RankingMetric);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const league = searchParams.get("league") ?? "nba";
    const month = searchParams.get("month");
    const rawMetric = searchParams.get("metric") ?? "totalPoints";

    const metric: RankingMetric = isRankingMetric(rawMetric)
      ? rawMetric
      : "totalPoints";

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        {
          ok: false,
          error: "month is required (YYYY-MM)",
        },
        { status: 400 }
      );
    }

    const baseUrl =
      process.env.MONTHLY_LEADERBOARD_FUNCTION_URL ??
      process.env.NEXT_PUBLIC_MONTHLY_LEADERBOARD_FUNCTION_URL;

    if (!baseUrl) {
      return NextResponse.json(
        {
          ok: false,
          error: "MONTHLY_LEADERBOARD_FUNCTION_URL is not set",
        },
        { status: 500 }
      );
    }

    const url = new URL(baseUrl);
    url.searchParams.set("league", league);
    url.searchParams.set("month", month);
    url.searchParams.set("metric", metric);

    const res = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store",
    });

    const json = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: json?.error ?? "failed to fetch monthly leaderboard",
        },
        { status: res.status }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        league,
        month,
        metric,
        count: json?.count ?? 0,
        rows: json?.rows ?? [],
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