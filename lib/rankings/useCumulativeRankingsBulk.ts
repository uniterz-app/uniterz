"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  CUMULATIVE_RANKING_INVALIDATE_EVENT,
  CUMULATIVE_RANKING_PATCH_MY_COUNTRY_EVENT,
  clearRankCountrySessionOverride,
  readRankCountrySessionOverride,
  type CumulativeRankingPatchMyCountryDetail,
} from "@/lib/rankings/cumulativeRankingInvalidate";
import type { RankingPhase } from "@/lib/rankings/rankingPhase";
import type { PlayoffRoundKey } from "@/lib/rankings/playoffRound";
import type { WcRankingStage } from "@/lib/rankings/wcRankingStage";
import type { MyRankMetricValueDeltas } from "@/lib/rankings/myRankMetricValueDeltas";
import {
  allRankingMetricsParam,
  isMetricListBundleLoaded,
} from "@/lib/rankings/rankingBulkMetrics";
import { isNewerSnapshotGeneration } from "@/lib/rankings/rankingSnapshotGeneration";

type BulkFetchResult = {
  byMetric: Record<string, BulkMetricPayload>;
  myMetricValueDeltas: MyRankMetricValueDeltas | null;
  snapshotGeneration: string | null;
};

export const INITIAL_RANKING_METRICS = "totalPoints";
const DEFERRED_RANKING_METRICS_NBA = [
  "totalGoalScorerHits",
  "totalUpset",
] as const;
const DEFERRED_RANKING_METRICS_WC = [
  "totalExactHits",
  "totalUpset",
] as const;

function refetchAllMetrics(wcStage: WcRankingStage | null): string {
  return allRankingMetricsParam(wcStage);
}

export type BulkMetricPayload = {
  ok: boolean;
  /** 未設定 = 一覧未取得（personalOnly プリフェッチのみ） */
  rows?: unknown[];
  count: number;
  myRank: number | null;
  myRow: Record<string, unknown> | null;
  myRankDeltaPlaces: number | null;
};

const ANON_KEY = "__anon__";
/** 一覧は日次不変 — 世代が進むまでメモリ再利用 */
const BULK_CACHE_TTL_MS = 12 * 60 * 60 * 1000;

type BulkCacheEntry = {
  at: number;
  bundles: Record<string, BulkMetricPayload>;
  deltas: MyRankMetricValueDeltas | null;
  appliedUid: string;
  snapshotGeneration: string | null;
};

const bulkCache = new Map<string, BulkCacheEntry>();
const inflightListKeys = new Set<string>();

function bulkCacheKey(
  phase: RankingPhase,
  round: PlayoffRoundKey,
  wcStage: WcRankingStage | null,
  uidKey: string
): string {
  return `${phase}:${round}:${wcStage ?? "-"}:${uidKey}`;
}

function readBulkCache(
  phase: RankingPhase,
  round: PlayoffRoundKey,
  wcStage: WcRankingStage | null,
  uidKey: string
): BulkCacheEntry | null {
  const cached = bulkCache.get(bulkCacheKey(phase, round, wcStage, uidKey));
  if (!cached) return null;
  if (Date.now() - cached.at > BULK_CACHE_TTL_MS) return null;
  return cached;
}

function writeBulkCache(
  phase: RankingPhase,
  round: PlayoffRoundKey,
  wcStage: WcRankingStage | null,
  entry: Omit<BulkCacheEntry, "at">
): void {
  bulkCache.set(bulkCacheKey(phase, round, wcStage, entry.appliedUid), {
    ...entry,
    at: Date.now(),
  });
}

function clearBulkCacheScope(
  phase: RankingPhase,
  round: PlayoffRoundKey,
  wcStage: WcRankingStage | null
): void {
  const prefix = `${phase}:${round}:${wcStage ?? "-"}:`;
  for (const key of bulkCache.keys()) {
    if (key.startsWith(prefix)) bulkCache.delete(key);
  }
}

function readScopeSnapshotGeneration(
  phase: RankingPhase,
  round: PlayoffRoundKey,
  wcStage: WcRankingStage | null
): string | null {
  for (const key of bulkCache.keys()) {
    if (!key.startsWith(`${phase}:${round}:${wcStage ?? "-"}:`)) continue;
    const gen = bulkCache.get(key)?.snapshotGeneration;
    if (gen) return gen;
  }
  return null;
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
  const out = { ...(prev ?? {}) };
  for (const [k, incoming] of Object.entries(patch)) {
    const inc = incoming as BulkMetricPayload;
    const old = out[k];
    if (
      old &&
      (inc.myRank == null || inc.myRow == null) &&
      (old.myRank != null || old.myRow != null)
    ) {
      out[k] = {
        ...inc,
        myRank: inc.myRank ?? old.myRank,
        myRow: (inc.myRow ?? old.myRow) as Record<string, unknown> | null,
        myRankDeltaPlaces:
          inc.myRankDeltaPlaces ?? old.myRankDeltaPlaces ?? null,
      };
    } else {
      out[k] = inc;
    }
  }
  return out;
}

function patchCountryInBundles(
  prev: Record<string, BulkMetricPayload> | null,
  uid: string,
  countryCode: string | null
): Record<string, BulkMetricPayload> | null {
  if (!prev) return prev;
  const next: Record<string, BulkMetricPayload> = {};
  for (const [key, bundle] of Object.entries(prev)) {
    const b = bundle as BulkMetricPayload;
    const rows = Array.isArray(b.rows)
      ? b.rows.map((row) => {
          const r = row as { uid?: string };
          if (r?.uid === uid) return { ...r, countryCode };
          return row;
        })
      : b.rows;
    const my = b.myRow as { uid?: string } | null | undefined;
    const myRow =
      my && typeof my.uid === "string" && my.uid === uid
        ? ({ ...my, countryCode } as Record<string, unknown>)
        : b.myRow;
    next[key] = { ...b, rows, myRow };
  }
  return next;
}

function applySessionCountryOverride(
  bundles: Record<string, BulkMetricPayload> | null,
  uid: string | null
): Record<string, BulkMetricPayload> | null {
  if (!bundles || !uid) return bundles;
  const stored = readRankCountrySessionOverride(uid);
  if (stored === undefined) return bundles;
  return patchCountryInBundles(bundles, uid, stored);
}

function maybeClearSessionCountryAfterFetch(
  partial: Record<string, BulkMetricPayload>,
  uid: string
): void {
  const stored = readRankCountrySessionOverride(uid);
  if (stored === undefined) return;

  const tp = partial.totalPoints;
  if (!tp) return;
  const rows = tp?.rows as
    | Array<{ uid?: string; countryCode?: string | null }>
    | undefined;
  const myRow = tp?.myRow as { uid?: string; countryCode?: string | null } | null;
  const mine = rows?.find((r) => r?.uid === uid);
  const serverCode =
    mine?.countryCode ??
    (myRow?.uid === uid ? myRow.countryCode : undefined) ??
    null;

  if (stored === null && (serverCode == null || serverCode === "")) {
    clearRankCountrySessionOverride(uid);
  } else if (typeof stored === "string" && serverCode === stored) {
    clearRankCountrySessionOverride(uid);
  }
}

async function fetchBulkMetrics(
  metrics: string,
  _uid: string | null,
  phase: RankingPhase,
  round: PlayoffRoundKey,
  wcStage: WcRankingStage | null,
  opts?: { personalOnly?: boolean }
): Promise<BulkFetchResult | null> {
  const params = new URLSearchParams();
  params.set("metrics", metrics);
  params.set("phase", phase);
  params.set("round", round);
  if (wcStage) params.set("wcStage", wcStage);
  // 一覧は全員共通。uid / personalOnly は付けない（My Rank は client 直読）
  void opts;
  const res = await fetch(`/api/cumulative-ranking/bulk?${params.toString()}`, {
    cache: "force-cache",
  });
  const json = await res.json();
  if (!json?.ok || !json?.byMetric) return null;
  if (wcStage != null && json.wcStage !== wcStage) return null;
  const snapshotGeneration =
    typeof json.snapshotGeneration === "string"
      ? json.snapshotGeneration
      : null;
  return {
    byMetric: json.byMetric as Record<string, BulkMetricPayload>,
    myMetricValueDeltas: null,
    snapshotGeneration,
  };
}

/** スナップショット世代が進んでいたらスコープキャッシュを捨て、必要なら全指標を再取得 */
async function resolveBulkFetch(
  metrics: string,
  uid: string | null,
  phase: RankingPhase,
  round: PlayoffRoundKey,
  wcStage: WcRankingStage | null,
  opts?: { personalOnly?: boolean }
): Promise<BulkFetchResult | null> {
  const partial = await fetchBulkMetrics(
    metrics,
    uid,
    phase,
    round,
    wcStage,
    opts
  );
  if (!partial || opts?.personalOnly) return partial;

  const scopeGen = readScopeSnapshotGeneration(phase, round, wcStage);
  if (!isNewerSnapshotGeneration(partial.snapshotGeneration, scopeGen)) {
    return partial;
  }

  clearBulkCacheScope(phase, round, wcStage);
  const allMetrics = refetchAllMetrics(wcStage);
  if (metrics === allMetrics) return partial;

  return fetchBulkMetrics(allMetrics, uid, phase, round, wcStage, opts);
}

function applyBulkResult(
  partial: BulkFetchResult,
  uid: string | null
): {
  bundles: Record<string, BulkMetricPayload>;
  deltas: MyRankMetricValueDeltas | null;
  appliedUid: string;
  snapshotGeneration: string | null;
} {
  const merged = mergeMetricBundles(null, partial.byMetric);
  const bundles =
    applySessionCountryOverride(merged, uid) ?? merged;
  if (uid) maybeClearSessionCountryAfterFetch(partial.byMetric, uid);
  return {
    bundles,
    deltas: partial.myMetricValueDeltas,
    appliedUid: uid ?? ANON_KEY,
    snapshotGeneration: partial.snapshotGeneration,
  };
}

function applyCacheResult(
  cached: BulkCacheEntry,
  uid: string | null
): BulkCacheEntry {
  const bundles =
    applySessionCountryOverride(cached.bundles, uid) ?? cached.bundles;
  return { ...cached, bundles };
}

function listInflightKey(
  phase: RankingPhase,
  round: PlayoffRoundKey,
  wcStage: WcRankingStage | null
): string {
  return bulkCacheKey(phase, round, wcStage, ANON_KEY);
}

/** ランキングタブ遷移前に匿名 totalPoints を温める */
export function prefetchCumulativeRankingsList(
  phase: RankingPhase = "playoffs",
  round: PlayoffRoundKey = "overall",
  wcStage: WcRankingStage | null = "overall"
): void {
  if (readBulkCache(phase, round, wcStage, ANON_KEY)) return;
  const inflightKey = listInflightKey(phase, round, wcStage);
  if (inflightListKeys.has(inflightKey)) return;
  inflightListKeys.add(inflightKey);

  void resolveBulkFetch(INITIAL_RANKING_METRICS, null, phase, round, wcStage)
    .then((partial) => {
      if (!partial) return;
      const applied = applyBulkResult(partial, null);
      writeBulkCache(phase, round, wcStage, {
        bundles: applied.bundles,
        deltas: applied.deltas,
        appliedUid: ANON_KEY,
        snapshotGeneration: applied.snapshotGeneration,
      });
    })
    .finally(() => {
      inflightListKeys.delete(inflightKey);
    });
}

export function useCumulativeRankingsBulk(
  phase: RankingPhase = "playoffs",
  round: PlayoffRoundKey = "overall",
  wcStage: WcRankingStage | null = null
) {
  const [authReady, setAuthReady] = useState(false);
  const [myUid, setMyUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [byMetric, setByMetric] = useState<Record<
    string,
    BulkMetricPayload
  > | null>(null);
  const [myMetricValueDeltas, setMyMetricValueDeltas] =
    useState<MyRankMetricValueDeltas | null>(null);
  const [appliedTotalPointsUid, setAppliedTotalPointsUid] = useState<
    string | null
  >(null);

  const listFetchSeqRef = useRef(0);
  const phaseRoundGenRef = useRef(0);
  const metricReqSeqRef = useRef(0);
  const invalidateSeqRef = useRef(0);

  useEffect(() => {
    const onPatchMyCountry = (ev: Event) => {
      const d = (ev as CustomEvent<CumulativeRankingPatchMyCountryDetail>)
        .detail;
      if (!d?.uid) return;
      setByMetric((prev) => patchCountryInBundles(prev, d.uid, d.countryCode));
    };
    window.addEventListener(
      CUMULATIVE_RANKING_PATCH_MY_COUNTRY_EVENT,
      onPatchMyCountry
    );
    return () => {
      window.removeEventListener(
        CUMULATIVE_RANKING_PATCH_MY_COUNTRY_EVENT,
        onPatchMyCountry
      );
    };
  }, []);

  useEffect(() => {
    const onInvalidate = () => {
      const seq = ++invalidateSeqRef.current;
      clearBulkCacheScope(phase, round, wcStage);
      void (async () => {
        const uid = auth.currentUser?.uid ?? null;
        try {
          const partial = await resolveBulkFetch(
            refetchAllMetrics(wcStage),
            null,
            phase,
            round,
            wcStage
          );
          if (seq !== invalidateSeqRef.current || !partial) return;
          const applied = applyBulkResult(partial, null);
          setByMetric(applied.bundles);
          setMyMetricValueDeltas(null);
          setAppliedTotalPointsUid(ANON_KEY);
          writeBulkCache(phase, round, wcStage, {
            bundles: applied.bundles,
            deltas: null,
            appliedUid: ANON_KEY,
            snapshotGeneration: applied.snapshotGeneration,
          });
          void uid;
        } catch {
          if (seq !== invalidateSeqRef.current) return;
        }
      })();
    };

    window.addEventListener(CUMULATIVE_RANKING_INVALIDATE_EVENT, onInvalidate);
    return () => {
      invalidateSeqRef.current += 1;
      window.removeEventListener(
        CUMULATIVE_RANKING_INVALIDATE_EVENT,
        onInvalidate
      );
    };
  }, [phase, round, wcStage]);

  useEffect(() => {
    phaseRoundGenRef.current += 1;
    metricReqSeqRef.current += 1;
    let cancelled = false;

    const applyAnonList = (bundles: Record<string, BulkMetricPayload>) => {
      setByMetric((prev) => {
        const out: Record<string, BulkMetricPayload> = { ...bundles };
        if (prev) {
          for (const key of Object.keys(out)) {
            const incoming = out[key]!;
            const kept = prev[key];
            if (
              kept &&
              (kept.myRank != null ||
                kept.myRow != null ||
                kept.myRankDeltaPlaces != null)
            ) {
              out[key] = {
                ...incoming,
                myRank: kept.myRank ?? incoming.myRank,
                myRow: (kept.myRow ?? incoming.myRow) as Record<
                  string,
                  unknown
                > | null,
                myRankDeltaPlaces:
                  kept.myRankDeltaPlaces ?? incoming.myRankDeltaPlaces ?? null,
              };
            }
          }
        }
        return out;
      });
      setAppliedTotalPointsUid(ANON_KEY);
      setLoading(false);
    };

    const runListFetch = async (seq: number) => {
      const inflightKey = listInflightKey(phase, round, wcStage);
      inflightListKeys.add(inflightKey);
      try {
        const partial = await resolveBulkFetch(
          INITIAL_RANKING_METRICS,
          null,
          phase,
          round,
          wcStage
        );
        if (cancelled || seq !== listFetchSeqRef.current) return;

        if (partial) {
          const applied = applyBulkResult(partial, null);
          applyAnonList(applied.bundles);
          writeBulkCache(phase, round, wcStage, {
            bundles: applied.bundles,
            deltas: null,
            appliedUid: ANON_KEY,
            snapshotGeneration: applied.snapshotGeneration,
          });
        } else {
          const fallback = mergeMetricBundles(null, {
            totalPoints: emptyBulkMetric(),
          });
          applyAnonList(fallback);
          writeBulkCache(phase, round, wcStage, {
            bundles: fallback,
            deltas: null,
            appliedUid: ANON_KEY,
            snapshotGeneration: null,
          });
        }
      } catch {
        if (cancelled || seq !== listFetchSeqRef.current) return;
        const fallback = mergeMetricBundles(null, {
          totalPoints: emptyBulkMetric(),
        });
        applyAnonList(fallback);
      } finally {
        inflightListKeys.delete(inflightKey);
        if (!cancelled && seq === listFetchSeqRef.current) {
          setLoading(false);
        }
      }
    };

    const anonCache = readBulkCache(phase, round, wcStage, ANON_KEY);

    if (anonCache) {
      const applied = applyCacheResult(anonCache, null);
      setByMetric(applied.bundles);
      setMyMetricValueDeltas(null);
      setAppliedTotalPointsUid(ANON_KEY);
      setLoading(false);
      const seq = ++listFetchSeqRef.current;
      void runListFetch(seq);
    } else {
      setByMetric(null);
      setMyMetricValueDeltas(null);
      setAppliedTotalPointsUid(null);
      setLoading(true);
      const seq = ++listFetchSeqRef.current;
      void runListFetch(seq);
    }

    const unsub = onAuthStateChanged(auth, (user) => {
      if (cancelled) return;
      setMyUid(user?.uid ?? null);
      setAuthReady(true);
      setAppliedTotalPointsUid(ANON_KEY);
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [phase, round, wcStage]);

  const ensureMetric = useCallback(
    async (metric: string) => {
      if (!authReady) return;
      if (!byMetric?.totalPoints) return;
      if (isMetricListBundleLoaded(byMetric?.[metric])) return;

      const genAtStart = phaseRoundGenRef.current;
      const seq = ++metricReqSeqRef.current;
      try {
        const partial = await resolveBulkFetch(
          metric,
          null,
          phase,
          round,
          wcStage
        );
        if (genAtStart !== phaseRoundGenRef.current) return;
        if (seq !== metricReqSeqRef.current) return;
        if (partial) {
          setByMetric((p) => {
            const merged = mergeMetricBundles(p, partial.byMetric);
            writeBulkCache(phase, round, wcStage, {
              bundles: merged,
              deltas: null,
              appliedUid: ANON_KEY,
              snapshotGeneration: partial.snapshotGeneration,
            });
            return merged;
          });
        } else {
          setByMetric((p) => {
            const merged = mergeMetricBundles(p, {
              [metric]: emptyBulkMetric(),
            });
            writeBulkCache(phase, round, wcStage, {
              bundles: merged,
              deltas: null,
              appliedUid: ANON_KEY,
              snapshotGeneration: readScopeSnapshotGeneration(
                phase,
                round,
                wcStage
              ),
            });
            return merged;
          });
        }
      } catch {
        if (seq !== metricReqSeqRef.current) return;
        setByMetric((p) => {
          const merged = mergeMetricBundles(p, {
            [metric]: emptyBulkMetric(),
          });
          writeBulkCache(phase, round, wcStage, {
            bundles: merged,
            deltas: null,
            appliedUid: ANON_KEY,
            snapshotGeneration: readScopeSnapshotGeneration(
              phase,
              round,
              wcStage
            ),
          });
          return merged;
        });
      }
    },
    [authReady, byMetric, phase, round, wcStage]
  );

  const listReady = byMetric?.totalPoints != null;

  useEffect(() => {
    if (!listReady || loading) return;

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

    let idleId: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    if (typeof requestIdleCallback !== "undefined") {
      idleId = requestIdleCallback(loadDeferred, { timeout: 2500 });
    } else {
      timeoutId = setTimeout(loadDeferred, 400);
    }

    return () => {
      cancelled = true;
      if (idleId != null && typeof cancelIdleCallback !== "undefined") {
        cancelIdleCallback(idleId);
      }
      if (timeoutId != null) clearTimeout(timeoutId);
    };
  }, [listReady, loading, ensureMetric, phase, round, wcStage]);
  const personalPending = false;

  return {
    loading,
    listReady,
    personalPending,
    myUid,
    byMetric,
    myMetricValueDeltas,
    authReady,
    ensureMetric,
  };
}
