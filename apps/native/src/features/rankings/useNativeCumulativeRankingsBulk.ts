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
import {
  isNewerSnapshotGeneration,
  scoreGenerationFromListToken,
} from "../../../../../lib/rankings/rankingSnapshotGeneration";
import {
  appendRankingSnapshotGenerationParam,
  fetchRankingSnapshotGeneration,
} from "../../../../../lib/rankings/rankingSnapshotGenerationClient";
import {
  subscribeCumulativeRankingInvalidate,
  subscribeCumulativeRankingPatchMyProSkin,
} from "../../../../../lib/rankings/cumulativeRankingInvalidate";

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
/** 同一 scope の同時 totalPoints 取得を1本に */
const listInflight = new Map<string, Promise<BulkFetchResult | null>>();

/** Pro Skin 装備後など — 一覧メモリを捨てて次表示で取り直す */
export function clearNativeCumulativeRankingsListCache(): void {
  listCache.clear();
  listInflight.clear();
  scopeSnapshotGeneration.clear();
}

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

function patchProSkinInBundles(
  prev: Record<string, BulkMetricPayload> | null,
  uid: string,
  planProBgVariant: string
): Record<string, BulkMetricPayload> | null {
  if (!prev) return prev;
  const next: Record<string, BulkMetricPayload> = {};
  for (const [key, bundle] of Object.entries(prev)) {
    const b = bundle;
    const rows = Array.isArray(b.rows)
      ? b.rows.map((row) => {
          const r = row as { uid?: string };
          if (r?.uid === uid) {
            return { ...r, plan: "pro", planProBgVariant };
          }
          return row;
        })
      : b.rows;
    const my = b.myRow as { uid?: string } | null | undefined;
    const myRow =
      my && typeof my.uid === "string" && my.uid === uid
        ? ({ ...my, plan: "pro", planProBgVariant } as Record<string, unknown>)
        : b.myRow;
    next[key] = { ...b, rows, myRow };
  }
  return next;
}

/** 装備直後 — メモリ一覧も同スキンに揃える（再マウントで旧 CDN を出さない） */
function patchProSkinInListCaches(
  uid: string,
  planProBgVariant: string
): void {
  for (const [key, entry] of listCache.entries()) {
    const byMetric = patchProSkinInBundles(
      entry.byMetric,
      uid,
      planProBgVariant
    );
    if (!byMetric) continue;
    listCache.set(key, { ...entry, byMetric, at: Date.now() });
  }
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
  const generation = await fetchRankingSnapshotGeneration(base);
  appendRankingSnapshotGenerationParam(params, generation);

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
    // score|ui token（CDN 切替用）。API の score 世代だけにはしない
    snapshotGeneration: generation,
  };
}

async function resolveSharedList(
  metrics: string,
  phase: RankingPhase,
  round: PlayoffRoundKey,
  wcStage: WcRankingStage | null
): Promise<BulkFetchResult | null> {
  const inflightKey =
    metrics === INITIAL_RANKING_METRICS
      ? `${scopeKey(phase, round, wcStage)}|${INITIAL_RANKING_METRICS}`
      : null;
  if (inflightKey) {
    const pending = listInflight.get(inflightKey);
    if (pending) return pending;
  }

  const run = (async (): Promise<BulkFetchResult | null> => {
    const partial = await fetchSharedList(metrics, phase, round, wcStage);
    if (!partial) return null;

    const cachedGen = readScopeSnapshotGeneration(phase, round, wcStage);
    const incomingScore = scoreGenerationFromListToken(
      partial.snapshotGeneration
    );
    if (!isNewerSnapshotGeneration(incomingScore, cachedGen)) {
      writeScopeSnapshotGeneration(
        phase,
        round,
        wcStage,
        incomingScore ?? partial.snapshotGeneration
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
        incomingScore ?? partial.snapshotGeneration
      );
      return partial;
    }

    const refreshed = await fetchSharedList(allMetrics, phase, round, wcStage);
    const refreshedScore = scoreGenerationFromListToken(
      refreshed?.snapshotGeneration
    );
    if (refreshedScore || refreshed?.snapshotGeneration) {
      writeScopeSnapshotGeneration(
        phase,
        round,
        wcStage,
        refreshedScore ?? refreshed?.snapshotGeneration ?? null
      );
    }
    return refreshed ?? partial;
  })();

  if (inflightKey) {
    listInflight.set(inflightKey, run);
    try {
      return await run;
    } finally {
      listInflight.delete(inflightKey);
    }
  }
  return run;
}

/** ランキングタブ押下前に匿名 totalPoints を温める（Web prefetchCumulativeRankingsList 相当） */
export function prefetchNativeCumulativeRankingsList(
  phase: RankingPhase = "playoffs",
  round: PlayoffRoundKey = "overall",
  wcStage: WcRankingStage | null = null
): void {
  void (async () => {
    const base = getUniterzApiBaseUrl();
    const generation = await fetchRankingSnapshotGeneration(base);
    const cached = readListCache(phase, round, wcStage);
    if (
      cached &&
      cached.snapshotGeneration &&
      cached.snapshotGeneration === generation
    ) {
      return;
    }
    const inflightKey = `${scopeKey(phase, round, wcStage)}|${INITIAL_RANKING_METRICS}`;
    if (listInflight.has(inflightKey)) return;
    const partial = await resolveSharedList(
      INITIAL_RANKING_METRICS,
      phase,
      round,
      wcStage
    );
    if (!partial) return;
    writeListCache(phase, round, wcStage, {
      byMetric: partial.byMetric,
      snapshotGeneration: partial.snapshotGeneration,
    });
  })();
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
    return subscribeCumulativeRankingPatchMyProSkin((d) => {
      if (!d?.uid || !d.planProBgVariant) return;
      patchProSkinInListCaches(d.uid, d.planProBgVariant);
      setByMetric((prev) =>
        patchProSkinInBundles(prev, d.uid, d.planProBgVariant)
      );
    });
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const unsub = subscribeCumulativeRankingInvalidate(() => {
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
          if (!partial) return;
          setByMetric(partial.byMetric);
          writeListCache(phase, round, wcStage, {
            byMetric: partial.byMetric,
            snapshotGeneration: partial.snapshotGeneration,
          });
        } catch {
          /* keep current */
        }
      })();
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [enabled, phase, round, wcStage]);

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
      const g = ++mountPrimaryGenRef.current;
      void (async () => {
        const base = getUniterzApiBaseUrl();
        const generation = await fetchRankingSnapshotGeneration(base);
        if (cancelled || g !== mountPrimaryGenRef.current) return;
        if (
          cached.snapshotGeneration &&
          cached.snapshotGeneration === generation
        ) {
          return;
        }
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
          /* keep cached */
        }
      })();
      return () => {
        cancelled = true;
      };
    }

    setByMetric(null);
    setLoading(true);

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
