import { useCallback, useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { getUniterzApiBaseUrl } from "../games/submitPredictionApi";
import type { RankingPhase } from "../../../../../lib/rankings/rankingPhase";
import type { PlayoffRoundKey } from "../../../../../lib/rankings/playoffRound";
import type { WcRankingStage } from "../../../../../lib/rankings/wcRankingStage";
import {
  allRankingMetricsParam,
  isMetricListBundleLoaded,
} from "../../../../../lib/rankings/rankingBulkMetrics";
import { isNewerSnapshotGeneration } from "../../../../../lib/rankings/rankingSnapshotGeneration";

export type BulkMetricPayload = {
  ok: boolean;
  rows?: unknown[];
  count: number;
  myRank: number | null;
  myRow: Record<string, unknown> | null;
  myRankDeltaPlaces: number | null;
};

type BulkFetchResult = {
  byMetric: Record<string, BulkMetricPayload>;
  snapshotGeneration: string | null;
};

const INITIAL_RANKING_METRICS = "totalPoints";
const DEFERRED_RANKING_METRICS_NBA = [
  "totalGoalScorerHits",
  "totalUpset",
] as const;
const DEFERRED_RANKING_METRICS_WC = [
  "totalExactHits",
  "totalUpset",
] as const;

/** 16:00 まで変わらない前提 — 世代が同じならメモリ再利用 */
const LIST_CACHE_TTL_MS = 12 * 60 * 60 * 1000;

type ListCacheEntry = {
  at: number;
  byMetric: Record<string, BulkMetricPayload>;
  snapshotGeneration: string | null;
};

const listCache = new Map<string, ListCacheEntry>();
const scopeSnapshotGeneration = new Map<string, string>();

function scopeKey(
  phase: RankingPhase,
  round: PlayoffRoundKey,
  wcStage: WcRankingStage | null
): string {
  return `${phase}:${round}:${wcStage ?? "-"}`;
}

function readScopeSnapshotGeneration(
  phase: RankingPhase,
  round: PlayoffRoundKey,
  wcStage: WcRankingStage | null
): string | null {
  return scopeSnapshotGeneration.get(scopeKey(phase, round, wcStage)) ?? null;
}

function writeScopeSnapshotGeneration(
  phase: RankingPhase,
  round: PlayoffRoundKey,
  wcStage: WcRankingStage | null,
  generation: string | null
): void {
  if (!generation) return;
  scopeSnapshotGeneration.set(scopeKey(phase, round, wcStage), generation);
}

function clearScopeSnapshotGeneration(
  phase: RankingPhase,
  round: PlayoffRoundKey,
  wcStage: WcRankingStage | null
): void {
  scopeSnapshotGeneration.delete(scopeKey(phase, round, wcStage));
  listCache.delete(scopeKey(phase, round, wcStage));
}

function readListCache(
  phase: RankingPhase,
  round: PlayoffRoundKey,
  wcStage: WcRankingStage | null
): ListCacheEntry | null {
  const cached = listCache.get(scopeKey(phase, round, wcStage));
  if (!cached) return null;
  if (Date.now() - cached.at > LIST_CACHE_TTL_MS) return null;
  return cached;
}

function writeListCache(
  phase: RankingPhase,
  round: PlayoffRoundKey,
  wcStage: WcRankingStage | null,
  entry: Omit<ListCacheEntry, "at">
): void {
  listCache.set(scopeKey(phase, round, wcStage), {
    ...entry,
    at: Date.now(),
  });
}

function emptyBulkMetric(): BulkMetricPayload {
  return {
    ok: true,
    rows: [],
    count: 0,
    myRank: null,
    myRow: null,
    myRankDeltaPlaces: null,
  };
}

function mergeMetricBundles(
  prev: Record<string, BulkMetricPayload> | null,
  patch: Record<string, BulkMetricPayload>
): Record<string, BulkMetricPayload> {
  return { ...(prev ?? {}), ...patch };
}

async function fetchSharedList(
  metrics: string,
  phase: RankingPhase,
  round: PlayoffRoundKey,
  wcStage: WcRankingStage | null
): Promise<BulkFetchResult | null> {
  const base = getUniterzApiBaseUrl();
  if (!base) return null;

  const params = new URLSearchParams();
  params.set("metrics", metrics);
  params.set("phase", phase);
  params.set("round", round);
  if (wcStage) params.set("wcStage", wcStage);

  const res = await fetch(
    `${base}/api/cumulative-ranking/bulk?${params.toString()}`,
    { cache: "force-cache" }
  );
  const json = (await res.json()) as {
    ok?: boolean;
    byMetric?: Record<string, BulkMetricPayload>;
    wcStage?: WcRankingStage;
    snapshotGeneration?: string;
  };
  if (!json?.ok || !json.byMetric) return null;
  if (wcStage != null && json.wcStage !== wcStage) return null;
  return {
    byMetric: json.byMetric,
    snapshotGeneration:
      typeof json.snapshotGeneration === "string"
        ? json.snapshotGeneration
        : null,
  };
}

async function resolveSharedList(
  metrics: string,
  phase: RankingPhase,
  round: PlayoffRoundKey,
  wcStage: WcRankingStage | null
): Promise<BulkFetchResult | null> {
  const partial = await fetchSharedList(metrics, phase, round, wcStage);
  if (!partial) return null;

  const cachedGen = readScopeSnapshotGeneration(phase, round, wcStage);
  if (!isNewerSnapshotGeneration(partial.snapshotGeneration, cachedGen)) {
    writeScopeSnapshotGeneration(
      phase,
      round,
      wcStage,
      partial.snapshotGeneration
    );
    return partial;
  }

  clearScopeSnapshotGeneration(phase, round, wcStage);
  const allMetrics = allRankingMetricsParam();
  if (metrics === allMetrics) {
    writeScopeSnapshotGeneration(
      phase,
      round,
      wcStage,
      partial.snapshotGeneration
    );
    return partial;
  }

  const refreshed = await fetchSharedList(allMetrics, phase, round, wcStage);
  if (refreshed?.snapshotGeneration) {
    writeScopeSnapshotGeneration(
      phase,
      round,
      wcStage,
      refreshed.snapshotGeneration
    );
  }
  return refreshed ?? partial;
}

export function useNativeCumulativeRankingsBulk(
  phase: RankingPhase = "playoffs",
  round: PlayoffRoundKey = "overall",
  wcStage: WcRankingStage | null = null,
  /** false のとき取得しない（週次/月次/open ボード表示中） */
  enabled = true
) {
  const [authReady, setAuthReady] = useState(false);
  const [myUid, setMyUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [byMetric, setByMetric] = useState<Record<
    string,
    BulkMetricPayload
  > | null>(null);

  const mountPrimaryGenRef = useRef(0);
  const metricReqSeqRef = useRef(0);
  const phaseRoundGenRef = useRef(0);
  const byMetricRef = useRef(byMetric);
  byMetricRef.current = byMetric;
  /** 空 rows でも同じ指標を連打取得しない */
  const attemptedMetricsRef = useRef(new Set<string>());

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setMyUid(user?.uid ?? null);
      setAuthReady(true);
    });
    return unsub;
  }, []);

  useEffect(() => {
    phaseRoundGenRef.current += 1;
    metricReqSeqRef.current += 1;
    attemptedMetricsRef.current = new Set();
    let cancelled = false;

    if (!enabled) {
      setByMetric(null);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const cached = readListCache(phase, round, wcStage);
    if (cached) {
      setByMetric(cached.byMetric);
      setLoading(false);
    } else {
      setByMetric(null);
      setLoading(true);
    }

    void (async () => {
      const g = ++mountPrimaryGenRef.current;
      try {
        const partial = await resolveSharedList(
          INITIAL_RANKING_METRICS,
          phase,
          round,
          wcStage
        );
        if (cancelled || g !== mountPrimaryGenRef.current) return;
        const bundles = partial?.byMetric ?? {
          totalPoints: emptyBulkMetric(),
        };
        setByMetric(bundles);
        writeListCache(phase, round, wcStage, {
          byMetric: bundles,
          snapshotGeneration: partial?.snapshotGeneration ?? null,
        });
      } catch {
        if (cancelled || g !== mountPrimaryGenRef.current) return;
        setByMetric({ totalPoints: emptyBulkMetric() });
      } finally {
        if (!cancelled && g === mountPrimaryGenRef.current) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [phase, round, wcStage, enabled]);

  const ensureMetric = useCallback(
    async (metric: string) => {
      if (!enabled) return;
      if (metric === "totalPoints") return;
      if (!authReady) return;
      const current = byMetricRef.current;
      if (!current?.totalPoints) return;
      if (isMetricListBundleLoaded(current[metric])) return;
      if (attemptedMetricsRef.current.has(metric)) return;
      attemptedMetricsRef.current.add(metric);

      const genAtStart = phaseRoundGenRef.current;
      const seq = ++metricReqSeqRef.current;
      try {
        const partial = await resolveSharedList(
          metric,
          phase,
          round,
          wcStage
        );
        if (genAtStart !== phaseRoundGenRef.current) return;
        if (seq !== metricReqSeqRef.current) return;
        setByMetric((prev) => {
          const next = mergeMetricBundles(
            prev,
            partial?.byMetric ?? { [metric]: emptyBulkMetric() }
          );
          writeListCache(phase, round, wcStage, {
            byMetric: next,
            snapshotGeneration:
              partial?.snapshotGeneration ??
              readScopeSnapshotGeneration(phase, round, wcStage),
          });
          return next;
        });
      } catch {
        if (seq !== metricReqSeqRef.current) return;
        setByMetric((prev) =>
          mergeMetricBundles(prev, { [metric]: emptyBulkMetric() })
        );
      }
    },
    [authReady, enabled, phase, round, wcStage]
  );

  const listReady = enabled ? byMetric?.totalPoints != null : true;

  useEffect(() => {
    if (!enabled || !listReady || loading) return;

    let cancelled = false;
    const loadDeferred = () => {
      if (cancelled) return;
      const deferred = wcStage
        ? DEFERRED_RANKING_METRICS_WC
        : DEFERRED_RANKING_METRICS_NBA;
      for (const metric of deferred) {
        void ensureMetric(metric);
      }
    };

    const timeoutId = setTimeout(loadDeferred, 400);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [enabled, listReady, loading, wcStage, ensureMetric]);

  return {
    loading: enabled ? loading : false,
    listReady,
    /** My Rank は cardFast 側。一覧は共有のため常に false */
    personalPending: false,
    myUid,
    byMetric: enabled ? byMetric : null,
    ensureMetric,
  };
}
