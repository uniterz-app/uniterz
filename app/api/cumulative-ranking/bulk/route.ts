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
import {
  fetchBulkFromFunctions,
  type BulkRankingMetric,
} from "@/lib/rankings/server/fetchCumulativeRankingBulk";
import { loadSnapshotTotalPointsRankAndDelta } from "@/lib/rankings/server/rankSnapshotHistoryTotalPoints";
import { loadMyRankMetricValueDeltas } from "@/lib/rankings/server/loadMyRankMetricValueDeltas";
import type { MyRankMetricValueDeltas } from "@/lib/rankings/myRankMetricValueDeltas";
import {
  isRankingLeagueSource,
  type RankingLeagueSource,
} from "@/lib/rankings/rankingLeagueSource";
import {
  isWcRankingStage,
  type WcRankingStage,
} from "@/lib/rankings/wcRankingStage";

export const runtime = "nodejs";

const BULK_METRICS = [
  "totalPoints",
  "totalPrecision",
  "totalUpset",
  "activeWinStreak",
  "winRate",
] as const satisfies readonly BulkRankingMetric[];

const WC_BULK_METRICS = [
  ...BULK_METRICS,
  "totalGoalScorerHits",
] as const satisfies readonly BulkRankingMetric[];

const METRIC_SET = new Set<string>([...BULK_METRICS, "totalGoalScorerHits"]);

function dateKeyJST(now: Date = new Date()): string {
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = jst.getUTCFullYear();
  const m = String(jst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(jst.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseMetricsParam(
  raw: string | null,
  wcStage: WcRankingStage | null
): BulkRankingMetric[] {
  const defaults = wcStage ? [...WC_BULK_METRICS] : [...BULK_METRICS];
  if (!raw?.trim()) return defaults;
  const parts = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const picked: BulkRankingMetric[] = [];
  for (const p of parts) {
    if (METRIC_SET.has(p)) picked.push(p as BulkRankingMetric);
  }
  if (picked.length === 0) return defaults;
  return [...new Set(picked)].sort() as BulkRankingMetric[];
}

function metricsToKey(metrics: BulkRankingMetric[]): string {
  return [...new Set(metrics)].sort().join(",");
}

function wcStageCacheKey(wc: WcRankingStage | null): string {
  return wc ?? "__no_wc__";
}

const getCachedBulk = unstable_cache(
  async (
    uidKey: string,
    metricsKey: string,
    phase: RankingPhase,
    round: PlayoffRoundKey,
    wcStageKey: string,
    dayKey: string
  ) => {
    const uid = uidKey === "__anon__" ? undefined : uidKey;
    const parts = metricsKey
      .split(",")
      .filter((m): m is BulkRankingMetric => METRIC_SET.has(m));
    const defaults =
      wcStageKey !== "__no_wc__" ? [...WC_BULK_METRICS] : [...BULK_METRICS];
    const metrics = (parts.length ? parts : defaults) as BulkRankingMetric[];
    const wcStage: WcRankingStage | null =
      wcStageKey === "__no_wc__"
        ? null
        : isWcRankingStage(wcStageKey)
          ? wcStageKey
          : null;
    // dayKey は unstable_cache のキー分離用（当日中は同一キーで再利用）
    void dayKey;
    return fetchBulkFromFunctions(uid, metrics, phase, round, wcStage);
  },
  ["cumulative-ranking-bulk-v4"],
  {
    revalidate: CUMULATIVE_RANKING_REVALIDATE_SEC,
    tags: ["cumulative-ranking"],
  }
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get("uid") ?? undefined;
    const rawWcStage = searchParams.get("wcStage");
    const wcStage: WcRankingStage | null = isWcRankingStage(rawWcStage)
      ? rawWcStage
      : null;
    const metricsList = parseMetricsParam(searchParams.get("metrics"), wcStage);
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
      ? await fetchBulkFromFunctions(uid, metricsList, phase, round, wcStage)
      : await getCachedBulk(
          "__anon__",
          metricsKey,
          phase,
          round,
          wcStageCacheKey(wcStage),
          todayKey
        );

    const data =
      typeof structuredClone === "function"
        ? structuredClone(source)
        : (JSON.parse(JSON.stringify(source)) as typeof source);
    await mergeUserPlansIntoBulkByMetric(data.byMetric);

    let myMetricValueDeltas: MyRankMetricValueDeltas | null = null;

    const snapshotWork =
      uid && data.byMetric?.totalPoints && !wcStage
        ? loadSnapshotTotalPointsRankAndDelta(uid, phase, round)
        : Promise.resolve(null);

    const deltaWork =
      uid && data.byMetric?.totalPoints?.myRow
        ? loadMyRankMetricValueDeltas(
            uid,
            data.byMetric.totalPoints.myRow as {
              totalPoints?: number;
              totalPrecision?: number;
              totalUpset?: number;
              winRate?: number;
            },
            {
              phase,
              round,
              wcStage,
              rankingLeague: isRankingLeagueSource(searchParams.get("league"))
                ? (searchParams.get("league") as RankingLeagueSource)
                : wcStage
                  ? "worldcup"
                  : "nba",
            }
          )
        : Promise.resolve(null);

    const [snapshotResult, deltasResult] = await Promise.all([
      snapshotWork.catch(() => null),
      deltaWork.catch(() => null),
    ]);

    if (snapshotResult) {
      const { latestRank, deltaPlaces } = snapshotResult;
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

    myMetricValueDeltas = deltasResult;

    const maxAge = 0;
    const cacheControl = uid
      ? "private, no-store"
      : `public, max-age=${maxAge}, s-maxage=${CUMULATIVE_RANKING_REVALIDATE_SEC}, stale-while-revalidate=${CUMULATIVE_RANKING_REVALIDATE_SEC * 4}`;

    return NextResponse.json(
      { ...data, wcStage, myMetricValueDeltas },
      {
        status: 200,
        headers: { "Cache-Control": cacheControl },
      }
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "unexpected error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
