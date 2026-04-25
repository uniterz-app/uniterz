// app/api/cumulative-ranking/bulk/route.ts
// 指標をまとめて取得（metrics 省略時は全5指標）。サーバー側 unstable_cache で Function 負荷を抑制。

import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { CUMULATIVE_RANKING_REVALIDATE_SEC } from "@/lib/rankings/cumulativeRankingCache";
import { mergeUserPlansIntoBulkByMetric } from "@/lib/rankings/mergeUserPlanIntoRankingPayload";
import {
  isPlayoffRoundKey,
  type PlayoffRoundKey,
} from "@/lib/rankings/playoffRound";
import { isRankingPhase, type RankingPhase } from "@/lib/rankings/rankingPhase";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { coerceTotalPointsRank } from "@/lib/profile/resolvePlayoffTotalPointsRank";

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

function dateKeyJST(now: Date = new Date()): string {
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = jst.getUTCFullYear();
  const m = String(jst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(jst.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

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

async function loadLatestAndPrevSnapshotRank(
  uid: string,
  phase: RankingPhase
): Promise<{ latestRank: number | null; deltaPlaces: number | null }> {
  const adminDb = getAdminDb();
  const snap = await adminDb
    .collection("cumulative_stats")
    .doc(uid)
    .collection("rankSnapshotHistory")
    .get();

  if (snap.empty) return { latestRank: null, deltaPlaces: null };

  const sorted = [...snap.docs].sort((a, b) => a.id.localeCompare(b.id));
  const latest = sorted[sorted.length - 1];
  const prev = sorted.length >= 2 ? sorted[sorted.length - 2] : null;
  if (!latest) return { latestRank: null, deltaPlaces: null };

  const latestData = latest.data() as
    | { play_in?: Record<string, unknown>; playoffs?: Record<string, unknown> }
    | undefined;
  const prevData = prev?.data() as
    | { play_in?: Record<string, unknown>; playoffs?: Record<string, unknown> }
    | undefined;

  const latestRankRaw =
    phase === "play_in"
      ? latestData?.play_in?.totalPoints
      : latestData?.playoffs?.totalPoints;
  const prevRankRaw =
    phase === "play_in"
      ? prevData?.play_in?.totalPoints
      : prevData?.playoffs?.totalPoints;

  const latestRank = coerceTotalPointsRank(latestRankRaw);
  const prevRank = coerceTotalPointsRank(prevRankRaw);
  if (latestRank == null) return { latestRank: null, deltaPlaces: null };
  const deltaPlaces =
    prevRank != null && prevRank !== latestRank ? prevRank - latestRank : null;

  return { latestRank, deltaPlaces };
}

async function fetchOneMetricFromFunctions(
  baseUrl: string,
  uid: string | undefined,
  metric: BulkRankingMetric,
  phase: RankingPhase,
  round: PlayoffRoundKey
) {
  const url = new URL(baseUrl);
  url.searchParams.set("metric", metric);
  url.searchParams.set("phase", phase);
  url.searchParams.set("round", round);
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
      rows: [] as unknown[],
      count: 0,
      myRank: null,
      myRow: null,
      myRankDeltaPlaces: null,
    };
  }

  return {
    metric,
    ok: true,
    rows: json?.rows ?? [],
    count: json?.count ?? 0,
    myRank: json?.myRank ?? null,
    myRow: json?.myRow ?? null,
    myRankDeltaPlaces: json?.myRankDeltaPlaces ?? null,
  };
}

async function fetchBulkFromFunctions(
  uid: string | undefined,
  metrics: BulkRankingMetric[],
  phase: RankingPhase,
  round: PlayoffRoundKey
) {
  const baseUrl =
    process.env.CUMULATIVE_RANKING_FUNCTION_URL ??
    process.env.NEXT_PUBLIC_CUMULATIVE_RANKING_FUNCTION_URL;

  if (!baseUrl) {
    throw new Error("CUMULATIVE_RANKING_FUNCTION_URL is not set");
  }

  const combinedUrl = new URL(baseUrl);
  combinedUrl.searchParams.set("metrics", metrics.join(","));
  combinedUrl.searchParams.set("phase", phase);
  combinedUrl.searchParams.set("round", round);
  if (uid) combinedUrl.searchParams.set("uid", uid);

  const combinedRes = await fetch(combinedUrl.toString(), {
    method: "GET",
    cache: "no-store",
  });
  const combinedJson = await combinedRes.json();

  if (
    combinedRes.ok &&
    combinedJson?.ok &&
    combinedJson?.byMetric &&
    typeof combinedJson.byMetric === "object"
  ) {
    const byMetric: Record<
      string,
      {
        ok: boolean;
        rows: unknown[];
        count: number;
        myRank: unknown;
        myRow: unknown;
        myRankDeltaPlaces: unknown;
      }
    > = {};
    for (const metric of metrics) {
      const b = combinedJson.byMetric[metric];
      byMetric[metric] = {
        ok: true,
        rows: b?.rows ?? [],
        count: b?.count ?? 0,
        myRank: b?.myRank ?? null,
        myRow: b?.myRow ?? null,
        myRankDeltaPlaces: b?.myRankDeltaPlaces ?? null,
      };
    }
    return { ok: true as const, byMetric };
  }

  const results = await Promise.all(
    metrics.map((metric) =>
      fetchOneMetricFromFunctions(baseUrl, uid, metric, phase, round)
    )
  );

  const byMetric = Object.fromEntries(results.map((r) => [r.metric, r]));

  return { ok: true as const, byMetric };
}

const getCachedBulk = unstable_cache(
  async (
    uidKey: string,
    metricsKey: string,
    phase: RankingPhase,
    round: PlayoffRoundKey,
    dayKey: string
  ) => {
    const uid = uidKey === "__anon__" ? undefined : uidKey;
    const parts = metricsKey
      .split(",")
      .filter((m): m is BulkRankingMetric => METRIC_SET.has(m));
    const metrics = (
      parts.length ? parts : [...BULK_METRICS]
    ) as BulkRankingMetric[];
    // dayKey は unstable_cache のキー分離用（当日中は同一キーで再利用）
    void dayKey;
    return fetchBulkFromFunctions(uid, metrics, phase, round);
  },
  ["cumulative-ranking-bulk-v3"],
  {
    revalidate: CUMULATIVE_RANKING_REVALIDATE_SEC,
    tags: ["cumulative-ranking"],
  }
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get("uid") ?? undefined;
    const metricsList = parseMetricsParam(searchParams.get("metrics"));
    const rawPhase = searchParams.get("phase");
    const phase: RankingPhase = isRankingPhase(rawPhase)
      ? rawPhase
      : "playoffs";
    const rawRound = searchParams.get("round");
    const round: PlayoffRoundKey = isPlayoffRoundKey(rawRound)
      ? rawRound
      : "overall";
    const metricsKey = metricsToKey(metricsList);
    const todayKey = dateKeyJST();

    const baseUrl =
      process.env.CUMULATIVE_RANKING_FUNCTION_URL ??
      process.env.NEXT_PUBLIC_CUMULATIVE_RANKING_FUNCTION_URL;

    if (!baseUrl) {
      return NextResponse.json(
        { ok: false, error: "CUMULATIVE_RANKING_FUNCTION_URL is not set" },
        { status: 500 }
      );
    }

    /**
     * myRank（uid 付き）は最新性を優先して毎回 Functions 取得。
     * 一覧のみ（uid なし）は dayKey 単位キャッシュを使う。
     */
    const source = uid
      ? await fetchBulkFromFunctions(uid, metricsList, phase, round)
      : await getCachedBulk("__anon__", metricsKey, phase, round, todayKey);

    const data =
      typeof structuredClone === "function"
        ? structuredClone(source)
        : (JSON.parse(JSON.stringify(source)) as typeof source);
    await mergeUserPlansIntoBulkByMetric(data.byMetric);

    /**
     * Ranking Progress と同じ「最新 snapshot」を Your Rank（totalPoints）にも反映する。
     * これで画面内で latest の見え方を一致させる。
     */
    if (uid && round === "overall" && data.byMetric?.totalPoints) {
      const { latestRank, deltaPlaces } = await loadLatestAndPrevSnapshotRank(
        uid,
        phase
      );
      if (latestRank != null) {
        data.byMetric.totalPoints.myRank = latestRank;
        data.byMetric.totalPoints.myRankDeltaPlaces = deltaPlaces;
        const myRow = data.byMetric.totalPoints.myRow as
          | Record<string, unknown>
          | null
          | undefined;
        if (myRow && typeof myRow === "object") {
          data.byMetric.totalPoints.myRow = { ...myRow, rank: latestRank };
        }
      }
    }

    const maxAge = 0;
    const cacheControl = uid
      ? "private, no-store"
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
