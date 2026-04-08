// app/api/cumulative-ranking/bulk/route.ts
// 指標をまとめて取得（metrics 省略時は全5指標）。サーバー側 unstable_cache で Function 負荷を抑制。

import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { CUMULATIVE_RANKING_REVALIDATE_SEC } from "@/lib/rankings/cumulativeRankingCache";

export const runtime = "nodejs";

const BULK_METRICS = [
  "totalPoints",
  "totalPrecision",
  "totalUpset",
  "activeWinStreak",
  "winRate",
] as const;

type BulkRankingMetric = (typeof BULK_METRICS)[number];

const METRIC_SET = new Set<string>(BULK_METRICS);

function parseMetricsParam(raw: string | null): BulkRankingMetric[] {
  if (!raw?.trim()) return [...BULK_METRICS];
  const parts = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const picked: BulkRankingMetric[] = [];
  for (const p of parts) {
    if (METRIC_SET.has(p)) picked.push(p as BulkRankingMetric);
  }
  if (picked.length === 0) return [...BULK_METRICS];
  return [...new Set(picked)].sort() as BulkRankingMetric[];
}

function metricsToKey(metrics: BulkRankingMetric[]): string {
  return [...new Set(metrics)].sort().join(",");
}

async function fetchBulkFromFunctions(
  uid: string | undefined,
  metrics: BulkRankingMetric[]
) {
  const baseUrl =
    process.env.CUMULATIVE_RANKING_FUNCTION_URL ??
    process.env.NEXT_PUBLIC_CUMULATIVE_RANKING_FUNCTION_URL;

  if (!baseUrl) {
    throw new Error("CUMULATIVE_RANKING_FUNCTION_URL is not set");
  }

  const results = await Promise.all(
    metrics.map(async (metric) => {
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
  async (uidKey: string, metricsKey: string) => {
    const uid = uidKey === "__anon__" ? undefined : uidKey;
    const parts = metricsKey
      .split(",")
      .filter((m): m is BulkRankingMetric => METRIC_SET.has(m));
    const metrics = (
      parts.length ? parts : [...BULK_METRICS]
    ) as BulkRankingMetric[];
    return fetchBulkFromFunctions(uid, metrics);
  },
  ["cumulative-ranking-bulk-v2"],
  { revalidate: CUMULATIVE_RANKING_REVALIDATE_SEC }
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get("uid") ?? undefined;
    const metricsList = parseMetricsParam(searchParams.get("metrics"));
    const metricsKey = metricsToKey(metricsList);

    const baseUrl =
      process.env.CUMULATIVE_RANKING_FUNCTION_URL ??
      process.env.NEXT_PUBLIC_CUMULATIVE_RANKING_FUNCTION_URL;

    if (!baseUrl) {
      return NextResponse.json(
        { ok: false, error: "CUMULATIVE_RANKING_FUNCTION_URL is not set" },
        { status: 500 }
      );
    }

    const data = await getCachedBulk(uid ?? "__anon__", metricsKey);

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
