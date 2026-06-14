import type { PlayoffRoundKey } from "@/lib/rankings/playoffRound";
import type { RankingPhase } from "@/lib/rankings/rankingPhase";
import type { WcRankingStage } from "@/lib/rankings/wcRankingStage";

export const PROFILE_SUMMARY_RANK_METRICS = [
  "totalPoints",
  "totalPrecision",
  "totalUpset",
] as const;

export type BulkRankingMetric =
  | (typeof PROFILE_SUMMARY_RANK_METRICS)[number]
  | "activeWinStreak"
  | "winRate"
  | "totalGoalScorerHits"
  | "totalExactHits";

export type BulkMetricPayload = {
  ok: boolean;
  rows: unknown[];
  count: number;
  myRank: unknown;
  myRow: unknown;
  myRankDeltaPlaces: unknown;
};

async function fetchOneMetricFromFunctions(
  baseUrl: string,
  uid: string | undefined,
  metric: BulkRankingMetric,
  phase: RankingPhase,
  round: PlayoffRoundKey,
  wcStage: WcRankingStage | null
): Promise<BulkMetricPayload & { metric: BulkRankingMetric }> {
  const url = new URL(baseUrl);
  url.searchParams.set("metric", metric);
  url.searchParams.set("phase", phase);
  url.searchParams.set("round", round);
  if (wcStage) url.searchParams.set("wcStage", wcStage);
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

/** Rankings bulk API / profile summary ranks — same Functions payload as `/api/cumulative-ranking/bulk`. */
export async function fetchBulkFromFunctions(
  uid: string | undefined,
  metrics: BulkRankingMetric[],
  phase: RankingPhase,
  round: PlayoffRoundKey,
  wcStage: WcRankingStage | null
): Promise<{ ok: true; byMetric: Record<string, BulkMetricPayload> }> {
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
  if (wcStage) combinedUrl.searchParams.set("wcStage", wcStage);
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
    const byMetric: Record<string, BulkMetricPayload> = {};
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
    return { ok: true, byMetric };
  }

  const results = await Promise.all(
    metrics.map((metric) =>
      fetchOneMetricFromFunctions(baseUrl, uid, metric, phase, round, wcStage)
    )
  );

  const byMetric = Object.fromEntries(
    results.map((r) => [r.metric, r])
  ) as Record<string, BulkMetricPayload>;

  return { ok: true, byMetric };
}
