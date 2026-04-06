// app/api/cumulative-ranking/bulk/route.ts
// 5指標を1回のAPI呼び出しで取得（サーバー側 unstable_cache で Function への負荷を抑制）

import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { CUMULATIVE_RANKING_REVALIDATE_SEC } from "@/lib/rankings/cumulativeRankingCache";

export const runtime = "nodejs";

const METRICS = [
  "totalPoints",
  "totalPrecision",
  "totalUpset",
  "activeWinStreak",
  "winRate",
] as const;

async function fetchBulkFromFunctions(uid: string | undefined) {
  const baseUrl =
    process.env.CUMULATIVE_RANKING_FUNCTION_URL ??
    process.env.NEXT_PUBLIC_CUMULATIVE_RANKING_FUNCTION_URL;

  if (!baseUrl) {
    throw new Error("CUMULATIVE_RANKING_FUNCTION_URL is not set");
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
        return {
          metric,
          ok: false,
          rows: [],
          count: 0,
          myRank: null,
          myRow: null,
        };
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

  const byMetric = Object.fromEntries(results.map((r) => [r.metric, r]));

  return { ok: true as const, byMetric };
}

const getCachedBulk = unstable_cache(
  async (uidKey: string) => {
    const uid = uidKey === "__anon__" ? undefined : uidKey;
    return fetchBulkFromFunctions(uid);
  },
  ["cumulative-ranking-bulk-v1"],
  { revalidate: CUMULATIVE_RANKING_REVALIDATE_SEC }
);

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

    const data = await getCachedBulk(uid ?? "__anon__");

    const maxAge = Math.min(120, CUMULATIVE_RANKING_REVALIDATE_SEC);
    const cacheControl = uid
      ? `private, max-age=${maxAge}, s-maxage=${CUMULATIVE_RANKING_REVALIDATE_SEC}`
      : `public, max-age=${maxAge}, s-maxage=${CUMULATIVE_RANKING_REVALIDATE_SEC}, stale-while-revalidate=${CUMULATIVE_RANKING_REVALIDATE_SEC * 4}`;

    return NextResponse.json(data, {
      status: 200,
      headers: { "Cache-Control": cacheControl },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "unexpected error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
