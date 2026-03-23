// app/api/cumulative-ranking/bulk/route.ts
// 5指標を1回のAPI呼び出しで取得

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const METRICS = [
  "totalPoints",
  "totalPrecision",
  "totalUpset",
  "activeWinStreak",
  "winRate",
] as const;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get("uid") ?? undefined;

    const baseUrl =
      process.env.CUMULATIVE_RANKING_FUNCTION_URL ??
      process.env.NEXT_PUBLIC_CUMULATIVE_RANKING_FUNCTION_URL;

    if (!baseUrl) {
      return NextResponse.json(
        { ok: false, error: "CUMULATIVE_RANKING_FUNCTION_URL is not set" },
        { status: 500 }
      );
    }

    const results = await Promise.all(
      METRICS.map(async (metric) => {
        const url = new URL(baseUrl);
        url.searchParams.set("metric", metric);
        if (uid) url.searchParams.set("uid", uid);

        const res = await fetch(url.toString(), {
          method: "GET",
          cache: "no-store",
        });
        const json = await res.json();

        if (!res.ok) {
          return { metric, ok: false, rows: [], count: 0, myRank: null, myRow: null };
        }

        return {
          metric,
          ok: true,
          rows: json?.rows ?? [],
          count: json?.count ?? 0,
          myRank: json?.myRank ?? null,
          myRow: json?.myRow ?? null,
        };
      })
    );

    const byMetric = Object.fromEntries(
      results.map((r) => [r.metric, r])
    );

    return NextResponse.json({
      ok: true,
      byMetric,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "unexpected error";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
