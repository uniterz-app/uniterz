import { unstable_cache } from "next/cache";
import { CUMULATIVE_RANKING_REVALIDATE_SEC } from "@/lib/rankings/cumulativeRankingCache";
import type { PlayoffRoundKey } from "@/lib/rankings/playoffRound";
import type { RankingPhase } from "@/lib/rankings/rankingPhase";

const ALLOWED_METRICS = [
  "totalPoints",
  "totalPrecision",
  "totalUpset",
  "activeWinStreak",
  "winRate",
] as const;

export type CumulativeRankingApiMetric = (typeof ALLOWED_METRICS)[number];

export function isCumulativeRankingApiMetric(
  v: string
): v is CumulativeRankingApiMetric {
  return (ALLOWED_METRICS as readonly string[]).includes(v);
}

type OkPayload = {
  ok: true;
  metric: CumulativeRankingApiMetric;
  phase: RankingPhase;
  round: PlayoffRoundKey;
  count: number;
  rows: unknown[];
  myRank: unknown;
  myRow: unknown | null;
  myRankDeltaPlaces: unknown | null;
};

type ErrPayload = {
  ok: false;
  status: number;
  error: string;
};

async function fetchSingleRanking(
  metric: CumulativeRankingApiMetric,
  uid: string | null,
  phase: RankingPhase,
  round: PlayoffRoundKey
): Promise<OkPayload | ErrPayload> {
  const baseUrl =
    process.env.CUMULATIVE_RANKING_FUNCTION_URL ??
    process.env.NEXT_PUBLIC_CUMULATIVE_RANKING_FUNCTION_URL;

  if (!baseUrl) {
    throw new Error("CUMULATIVE_RANKING_FUNCTION_URL is not set");
  }

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
      ok: false as const,
      status: res.status,
      error: json?.error ?? "failed to fetch ranking",
    };
  }

  return {
    ok: true as const,
    metric,
    phase,
    round,
    count: json?.count ?? 0,
    rows: json?.rows ?? [],
    myRank: json?.myRank ?? null,
    myRow: json?.myRow ?? null,
    myRankDeltaPlaces: json?.myRankDeltaPlaces ?? null,
  };
}

const getCachedAnonRanking = unstable_cache(
  async (metric: CumulativeRankingApiMetric, phase: RankingPhase) => {
    return fetchSingleRanking(metric, null, phase, "overall");
  },
  ["cumulative-ranking-single-v4"],
  {
    revalidate: CUMULATIVE_RANKING_REVALIDATE_SEC,
    tags: ["cumulative-ranking"],
  }
);

export async function getCachedCumulativeRanking(
  metric: CumulativeRankingApiMetric,
  uidKey: string,
  phase: RankingPhase,
  round: PlayoffRoundKey
): Promise<OkPayload | ErrPayload> {
  if (uidKey === "__anon__") {
    if (round === "overall") {
      return getCachedAnonRanking(metric, phase);
    }
    return fetchSingleRanking(metric, null, phase, round);
  }

  return fetchSingleRanking(metric, uidKey, phase, round);
}
