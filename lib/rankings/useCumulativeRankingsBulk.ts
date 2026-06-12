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

type BulkFetchResult = {
  byMetric: Record<string, BulkMetricPayload>;
  myMetricValueDeltas: MyRankMetricValueDeltas | null;
};

const REFETCH_ALL_METRICS_NBA =
  "totalPoints,totalPrecision,totalUpset,activeWinStreak,winRate";
const REFETCH_ALL_METRICS_WC =
  "totalPoints,totalPrecision,totalUpset,activeWinStreak,winRate,totalGoalScorerHits";
const INITIAL_RANKING_METRICS = "totalPoints,totalPrecision,totalUpset";

function refetchAllMetrics(wcStage: WcRankingStage | null): string {
  return wcStage ? REFETCH_ALL_METRICS_WC : REFETCH_ALL_METRICS_NBA;
}

export type BulkMetricPayload = {
  ok: boolean;
  rows: unknown[];
  count: number;
  myRank: number | null;
  myRow: Record<string, unknown> | null;
  myRankDeltaPlaces: number | null;
};

const ANON_KEY = "__anon__";
const BULK_CACHE_TTL_MS = 5 * 60 * 1000;

type BulkCacheEntry = {
  at: number;
  bundles: Record<string, BulkMetricPayload>;
  deltas: MyRankMetricValueDeltas | null;
  appliedUid: string;
};

const bulkCache = new Map<string, BulkCacheEntry>();

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
  uid: string | null,
  phase: RankingPhase,
  round: PlayoffRoundKey,
  wcStage: WcRankingStage | null
): Promise<BulkFetchResult | null> {
  const params = new URLSearchParams();
  params.set("metrics", metrics);
  params.set("phase", phase);
  params.set("round", round);
  if (wcStage) params.set("wcStage", wcStage);
  if (uid) params.set("uid", uid);
  const res = await fetch(`/api/cumulative-ranking/bulk?${params.toString()}`, {
    cache: uid ? "no-store" : "default",
  });
  const json = await res.json();
  if (!json?.ok || !json?.byMetric) return null;
  if (wcStage != null && json.wcStage !== wcStage) return null;
  return {
    byMetric: json.byMetric as Record<string, BulkMetricPayload>,
    myMetricValueDeltas:
      (json.myMetricValueDeltas as MyRankMetricValueDeltas | null | undefined) ??
      null,
  };
}

function applyBulkResult(
  partial: BulkFetchResult,
  uid: string | null
): {
  bundles: Record<string, BulkMetricPayload>;
  deltas: MyRankMetricValueDeltas | null;
  appliedUid: string;
} {
  const merged = mergeMetricBundles(null, partial.byMetric);
  const bundles =
    applySessionCountryOverride(merged, uid) ?? merged;
  if (uid) maybeClearSessionCountryAfterFetch(partial.byMetric, uid);
  return {
    bundles,
    deltas: partial.myMetricValueDeltas,
    appliedUid: uid ?? ANON_KEY,
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

  const fetchSeqRef = useRef(0);
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
      void (async () => {
        const uid = auth.currentUser?.uid ?? null;
        try {
          const partial = await fetchBulkMetrics(
            refetchAllMetrics(wcStage),
            uid,
            phase,
            round,
            wcStage
          );
          if (seq !== invalidateSeqRef.current || !partial) return;
          const applied = applyBulkResult(partial, uid);
          setByMetric(applied.bundles);
          setMyMetricValueDeltas(applied.deltas);
          setAppliedTotalPointsUid(applied.appliedUid);
          writeBulkCache(phase, round, wcStage, {
            bundles: applied.bundles,
            deltas: applied.deltas,
            appliedUid: applied.appliedUid,
          });
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
    let lastFetchUidKey: string | undefined;

    const currentUidKey = myUid ?? ANON_KEY;
    const visibleCache = readBulkCache(phase, round, wcStage, currentUidKey);
    if (visibleCache) {
      const applied = applyCacheResult(visibleCache, myUid);
      setByMetric(applied.bundles);
      setMyMetricValueDeltas(applied.deltas);
      setAppliedTotalPointsUid(applied.appliedUid);
      setLoading(false);
    } else {
      setByMetric(null);
      setMyMetricValueDeltas(null);
      setAppliedTotalPointsUid(null);
      setLoading(true);
    }

    const runFetch = async (uid: string | null, seq: number) => {
      try {
        const partial = await fetchBulkMetrics(
          INITIAL_RANKING_METRICS,
          uid,
          phase,
          round,
          wcStage
        );
        if (cancelled || seq !== fetchSeqRef.current) return;

        if (partial) {
          const applied = applyBulkResult(partial, uid);
          setByMetric(applied.bundles);
          setMyMetricValueDeltas(applied.deltas);
          setAppliedTotalPointsUid(applied.appliedUid);
          writeBulkCache(phase, round, wcStage, {
            bundles: applied.bundles,
            deltas: applied.deltas,
            appliedUid: applied.appliedUid,
          });
        } else {
          const appliedUid = uid ?? ANON_KEY;
          const fallback =
            applySessionCountryOverride(
              mergeMetricBundles(null, { totalPoints: emptyBulkMetric() }),
              uid
            ) ?? mergeMetricBundles(null, { totalPoints: emptyBulkMetric() });
          setByMetric(fallback);
          setAppliedTotalPointsUid(appliedUid);
          writeBulkCache(phase, round, wcStage, {
            bundles: fallback,
            deltas: null,
            appliedUid,
          });
        }
      } catch {
        if (cancelled || seq !== fetchSeqRef.current) return;
        const appliedUid = uid ?? ANON_KEY;
        const fallback =
          applySessionCountryOverride(
            mergeMetricBundles(null, { totalPoints: emptyBulkMetric() }),
            uid
          ) ?? mergeMetricBundles(null, { totalPoints: emptyBulkMetric() });
        setByMetric(fallback);
        setAppliedTotalPointsUid(appliedUid);
        writeBulkCache(phase, round, wcStage, {
          bundles: fallback,
          deltas: null,
          appliedUid,
        });
      } finally {
        if (!cancelled && seq === fetchSeqRef.current) {
          setLoading(false);
        }
      }
    };

    const unsub = onAuthStateChanged(auth, (user) => {
      if (cancelled) return;

      const uid = user?.uid ?? null;
      const uidKey = uid ?? ANON_KEY;
      setMyUid(uid);
      setAuthReady(true);

      if (lastFetchUidKey === uidKey) return;
      lastFetchUidKey = uidKey;

      const cached = readBulkCache(phase, round, wcStage, uidKey);
      if (cached) {
        const applied = applyCacheResult(cached, uid);
        setByMetric(applied.bundles);
        setMyMetricValueDeltas(applied.deltas);
        setAppliedTotalPointsUid(applied.appliedUid);
        setLoading(false);
        return;
      }

      const seq = ++fetchSeqRef.current;
      void runFetch(uid, seq);
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
      if (byMetric?.[metric]) return;

      const uidForMetric = myUid;
      if (uidForMetric) {
        if (appliedTotalPointsUid !== uidForMetric) return;
      } else if (appliedTotalPointsUid !== ANON_KEY) {
        return;
      }

      const genAtStart = phaseRoundGenRef.current;
      const seq = ++metricReqSeqRef.current;
      try {
        const partial = await fetchBulkMetrics(
          metric,
          uidForMetric,
          phase,
          round,
          wcStage
        );
        if (genAtStart !== phaseRoundGenRef.current) return;
        if (seq !== metricReqSeqRef.current) return;
        if (partial) {
          setByMetric((p) => {
            const merged =
              applySessionCountryOverride(
                mergeMetricBundles(p, partial.byMetric),
                uidForMetric
              ) ?? mergeMetricBundles(p, partial.byMetric);
            writeBulkCache(phase, round, wcStage, {
              bundles: merged,
              deltas: partial.myMetricValueDeltas ?? myMetricValueDeltas,
              appliedUid: uidForMetric ?? ANON_KEY,
            });
            return merged;
          });
          if (partial.myMetricValueDeltas) {
            setMyMetricValueDeltas(partial.myMetricValueDeltas);
          }
          if (uidForMetric) {
            maybeClearSessionCountryAfterFetch(partial.byMetric, uidForMetric);
          }
        } else {
          setByMetric((p) => {
            const merged =
              applySessionCountryOverride(
                mergeMetricBundles(p, { [metric]: emptyBulkMetric() }),
                uidForMetric
              ) ?? mergeMetricBundles(p, { [metric]: emptyBulkMetric() });
            writeBulkCache(phase, round, wcStage, {
              bundles: merged,
              deltas: myMetricValueDeltas,
              appliedUid: uidForMetric ?? ANON_KEY,
            });
            return merged;
          });
        }
      } catch {
        if (seq !== metricReqSeqRef.current) return;
        setByMetric((p) => {
          const merged =
            applySessionCountryOverride(
              mergeMetricBundles(p, { [metric]: emptyBulkMetric() }),
              uidForMetric
            ) ?? mergeMetricBundles(p, { [metric]: emptyBulkMetric() });
          writeBulkCache(phase, round, wcStage, {
            bundles: merged,
            deltas: myMetricValueDeltas,
            appliedUid: uidForMetric ?? ANON_KEY,
          });
          return merged;
        });
      }
    },
    [
      authReady,
      byMetric,
      myUid,
      appliedTotalPointsUid,
      phase,
      round,
      wcStage,
      myMetricValueDeltas,
    ]
  );

  const listReady = byMetric?.totalPoints != null;
  const personalPending =
    myUid != null &&
    appliedTotalPointsUid != null &&
    appliedTotalPointsUid !== myUid;

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
