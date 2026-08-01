import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { getUniterzApiBaseUrl } from "../games/submitPredictionApi";
import type { RankingPhase } from "../../../../../lib/rankings/rankingPhase";
import type { PlayoffRoundKey } from "../../../../../lib/rankings/playoffRound";
import type { WcRankingStage } from "../../../../../lib/rankings/wcRankingStage";
import {
  allRankingMetricsParam,
  isMetricListBundleLoaded,
  mergePersonalRankPrefetch,
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

const ANON_KEY = "__anon__";
const INITIAL_RANKING_METRICS = "totalPoints";
const DEFERRED_RANKING_METRICS_NBA = [
  "totalGoalScorerHits",
  "totalUpset",
] as const;
const DEFERRED_RANKING_METRICS_WC = [
  "totalExactHits",
  "totalUpset",
] as const;

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
  for (const [key, incoming] of Object.entries(patch)) {
    const inc = incoming;
    const old = out[key];
    if (
      old &&
      (inc.myRank == null || inc.myRow == null) &&
      (old.myRank != null || old.myRow != null)
    ) {
      out[key] = {
        ...inc,
        myRank: inc.myRank ?? old.myRank,
        myRow: (inc.myRow ?? old.myRow) as Record<string, unknown> | null,
        myRankDeltaPlaces: inc.myRankDeltaPlaces ?? old.myRankDeltaPlaces ?? null,
      };
    } else {
      out[key] = inc;
    }
  }
  return out;
}

/** 匿名一覧で個人 myRank / myRow を消さない（Web useCumulativeRankingsBulk と同系） */
function mergeAnonListBundles(
  prev: Record<string, BulkMetricPayload> | null,
  bundles: Record<string, BulkMetricPayload>
): Record<string, BulkMetricPayload> {
  const out: Record<string, BulkMetricPayload> = { ...bundles };
  if (!prev) return out;
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
        myRow: (kept.myRow ?? incoming.myRow) as Record<string, unknown> | null,
        myRankDeltaPlaces:
          kept.myRankDeltaPlaces ?? incoming.myRankDeltaPlaces ?? null,
      };
    }
  }
  return out;
}

function applyAnonListToState(
  setByMetric: Dispatch<
    SetStateAction<Record<string, BulkMetricPayload> | null>
  >,
  setAppliedTotalPointsUid: Dispatch<SetStateAction<string | null>>,
  bundles: Record<string, BulkMetricPayload>
): void {
  setByMetric((prev) => mergeAnonListBundles(prev, bundles));
  setAppliedTotalPointsUid((prev) =>
    prev && prev !== ANON_KEY ? prev : ANON_KEY
  );
}

async function fetchBulkMetrics(
  metrics: string,
  uid: string | null,
  phase: RankingPhase,
  round: PlayoffRoundKey,
  wcStage: WcRankingStage | null,
  opts?: { personalOnly?: boolean }
): Promise<BulkFetchResult | null> {
  const base = getUniterzApiBaseUrl();
  if (!base) return null;

  const params = new URLSearchParams();
  params.set("metrics", metrics);
  params.set("phase", phase);
  params.set("round", round);
  if (wcStage) params.set("wcStage", wcStage);
  if (uid) params.set("uid", uid);
  if (opts?.personalOnly) params.set("personalOnly", "1");

  const res = await fetch(`${base}/api/cumulative-ranking/bulk?${params.toString()}`, {
    cache: "no-store",
  });
  const json = (await res.json()) as {
    ok?: boolean;
    byMetric?: Record<string, BulkMetricPayload>;
    wcStage?: WcRankingStage;
    snapshotGeneration?: string;
  };
  if (!json?.ok || !json.byMetric) return null;
  if (wcStage != null && json.wcStage !== wcStage) return null;
  const snapshotGeneration =
    typeof json.snapshotGeneration === "string"
      ? json.snapshotGeneration
      : null;
  return { byMetric: json.byMetric, snapshotGeneration };
}

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
  if (!partial || opts?.personalOnly) {
    if (partial?.snapshotGeneration) {
      writeScopeSnapshotGeneration(
        phase,
        round,
        wcStage,
        partial.snapshotGeneration
      );
    }
    return partial;
  }

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
  const allMetrics = allRankingMetricsParam(wcStage);
  if (metrics === allMetrics) {
    writeScopeSnapshotGeneration(
      phase,
      round,
      wcStage,
      partial.snapshotGeneration
    );
    return partial;
  }

  const refreshed = await fetchBulkMetrics(
    allMetrics,
    uid,
    phase,
    round,
    wcStage,
    opts
  );
  if (refreshed?.snapshotGeneration) {
    writeScopeSnapshotGeneration(
      phase,
      round,
      wcStage,
      refreshed.snapshotGeneration
    );
  }
  return refreshed;
}

export function useNativeCumulativeRankingsBulk(
  phase: RankingPhase = "playoffs",
  round: PlayoffRoundKey = "overall",
  wcStage: WcRankingStage | null = null
) {
  const [authReady, setAuthReady] = useState(false);
  const [myUid, setMyUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [byMetric, setByMetric] = useState<Record<string, BulkMetricPayload> | null>(null);
  const [appliedTotalPointsUid, setAppliedTotalPointsUid] = useState<string | null>(null);

  const mountPrimaryGenRef = useRef(0);
  const uidPrimarySeqRef = useRef(0);
  const metricReqSeqRef = useRef(0);
  const phaseRoundGenRef = useRef(0);

  const schedulePersonalRankPrefetch = useCallback(
    (uid: string) => {
      const prefetchGen = phaseRoundGenRef.current;
      void (async () => {
        const ranks = await fetchBulkMetrics(
          allRankingMetricsParam(wcStage),
          uid,
          phase,
          round,
          wcStage,
          { personalOnly: true }
        );
        if (prefetchGen !== phaseRoundGenRef.current || !ranks) return;
        setByMetric((prev) => mergePersonalRankPrefetch(prev, ranks.byMetric));
        writeScopeSnapshotGeneration(
          phase,
          round,
          wcStage,
          ranks.snapshotGeneration
        );
      })();
    },
    [phase, round, wcStage]
  );

  useEffect(() => {
    phaseRoundGenRef.current += 1;
    metricReqSeqRef.current += 1;
    let cancelled = false;
    setByMetric(null);
    setAppliedTotalPointsUid(null);
    setLoading(true);

    void (async () => {
      const g = ++mountPrimaryGenRef.current;
      try {
        const partial = await resolveBulkFetch(
          INITIAL_RANKING_METRICS,
          null,
          phase,
          round,
          wcStage
        );
        if (cancelled || g !== mountPrimaryGenRef.current) return;
        if (partial) {
          applyAnonListToState(setByMetric, setAppliedTotalPointsUid, partial.byMetric);
        } else {
          applyAnonListToState(setByMetric, setAppliedTotalPointsUid, {
            totalPoints: emptyBulkMetric(),
          });
        }
      } catch {
        if (cancelled || g !== mountPrimaryGenRef.current) return;
        applyAnonListToState(setByMetric, setAppliedTotalPointsUid, {
          totalPoints: emptyBulkMetric(),
        });
      } finally {
        if (!cancelled && g === mountPrimaryGenRef.current) {
          setLoading(false);
        }
      }
    })();

    const unsub = onAuthStateChanged(auth, (user) => {
      const uid = user?.uid ?? null;
      setMyUid(uid);
      setAuthReady(true);

      if (!uid) {
        const g = ++mountPrimaryGenRef.current;
        void (async () => {
          try {
            const partial = await resolveBulkFetch(
              INITIAL_RANKING_METRICS,
              null,
              phase,
              round,
              wcStage
            );
            if (cancelled || g !== mountPrimaryGenRef.current) return;
            if (partial) {
              applyAnonListToState(setByMetric, setAppliedTotalPointsUid, partial.byMetric);
            } else {
              applyAnonListToState(setByMetric, setAppliedTotalPointsUid, {
                totalPoints: emptyBulkMetric(),
              });
            }
          } catch {
            if (cancelled || g !== mountPrimaryGenRef.current) return;
            applyAnonListToState(setByMetric, setAppliedTotalPointsUid, {
              totalPoints: emptyBulkMetric(),
            });
          }
        })();
        return;
      }

      const uq = ++uidPrimarySeqRef.current;
      void (async () => {
        try {
          const partial = await resolveBulkFetch(
            INITIAL_RANKING_METRICS,
            uid,
            phase,
            round,
            wcStage
          );
          if (cancelled || uq !== uidPrimarySeqRef.current) return;
          if (partial) {
            setByMetric((prev) => mergeMetricBundles(prev, partial.byMetric));
            setAppliedTotalPointsUid(uid);
            schedulePersonalRankPrefetch(uid);
          } else {
            setAppliedTotalPointsUid(uid);
          }
        } catch {
          if (cancelled || uq !== uidPrimarySeqRef.current) return;
          setAppliedTotalPointsUid(uid);
        }
      })();
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [phase, round, wcStage, schedulePersonalRankPrefetch]);

  const ensureMetric = useCallback(
    async (metric: string) => {
      if (metric === "totalPoints") return;
      if (!authReady) return;
      if (!byMetric?.totalPoints) return;
      if (isMetricListBundleLoaded(byMetric?.[metric])) return;

      const uidForMetric = myUid;
      if (uidForMetric) {
        if (appliedTotalPointsUid !== uidForMetric) return;
      } else if (appliedTotalPointsUid !== ANON_KEY) {
        return;
      }

      const genAtStart = phaseRoundGenRef.current;
      const seq = ++metricReqSeqRef.current;
      try {
        const partial = await resolveBulkFetch(
          metric,
          uidForMetric,
          phase,
          round,
          wcStage
        );
        if (genAtStart !== phaseRoundGenRef.current) return;
        if (seq !== metricReqSeqRef.current) return;
        if (partial) {
          setByMetric((prev) => mergeMetricBundles(prev, partial.byMetric));
        } else {
          setByMetric((prev) => mergeMetricBundles(prev, { [metric]: emptyBulkMetric() }));
        }
      } catch {
        if (seq !== metricReqSeqRef.current) return;
        setByMetric((prev) => mergeMetricBundles(prev, { [metric]: emptyBulkMetric() }));
      }
    },
    [authReady, byMetric, myUid, appliedTotalPointsUid, phase, round, wcStage]
  );

  const listReady = byMetric?.totalPoints != null;
  const personalPending =
    myUid != null && appliedTotalPointsUid != null && appliedTotalPointsUid !== myUid;

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

    const timeoutId = setTimeout(loadDeferred, 1200);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [listReady, loading, wcStage, ensureMetric]);

  return {
    loading,
    listReady,
    personalPending,
    myUid,
    byMetric,
    ensureMetric,
  };
}
