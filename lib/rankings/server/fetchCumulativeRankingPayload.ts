import { unstable_cache } from "next/cache";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { coerceTotalPointsRank } from "@/lib/profile/resolvePlayoffTotalPointsRank";
import { CUMULATIVE_RANKING_REVALIDATE_SEC } from "@/lib/rankings/cumulativeRankingCache";
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
  count: number;
  rows: unknown[];
  myRank: unknown;
  myRow: unknown | null;
};

type ErrPayload = {
  ok: false;
  status: number;
  error: string;
};

async function fetchSingleRanking(
  metric: CumulativeRankingApiMetric,
  uid: string | null,
  phase: RankingPhase
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
    count: json?.count ?? 0,
    rows: json?.rows ?? [],
    myRank: json?.myRank ?? null,
    myRow: json?.myRow ?? null,
  };
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

async function applyTotalPointsSnapshot(
  uid: string,
  phase: RankingPhase,
  payload: OkPayload
): Promise<OkPayload> {
  const { latestRank } = await loadLatestAndPrevSnapshotRank(uid, phase);
  if (latestRank == null) return payload;

  const myRow =
    payload.myRow && typeof payload.myRow === "object"
      ? {
          ...(payload.myRow as Record<string, unknown>),
          rank: latestRank,
        }
      : payload.myRow;

  return {
    ...payload,
    myRank: latestRank,
    myRow,
  };
}

const getCachedAnonRanking = unstable_cache(
  async (metric: CumulativeRankingApiMetric, phase: RankingPhase) => {
    return fetchSingleRanking(metric, null, phase);
  },
  ["cumulative-ranking-single-v3"],
  {
    revalidate: CUMULATIVE_RANKING_REVALIDATE_SEC,
    tags: ["cumulative-ranking"],
  }
);

export async function getCachedCumulativeRanking(
  metric: CumulativeRankingApiMetric,
  uidKey: string,
  phase: RankingPhase
): Promise<OkPayload | ErrPayload> {
  if (uidKey === "__anon__") {
    return getCachedAnonRanking(metric, phase);
  }

  const fresh = await fetchSingleRanking(metric, uidKey, phase);
  if (!fresh.ok) return fresh;
  if (metric === "totalPoints") {
    return applyTotalPointsSnapshot(uidKey, phase, fresh);
  }
  return fresh;
}
