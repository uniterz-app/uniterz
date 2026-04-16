"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { RankingPhase } from "@/lib/rankings/rankingPhase";

export type BulkMetricPayload = {
  ok: boolean;
  rows: unknown[];
  count: number;
  myRank: number | null;
  myRow: Record<string, unknown> | null;
  myRankDeltaPlaces: number | null;
};

const ANON_KEY = "__anon__";

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

/** 初回は総合（totalPoints）のみ先読み。 */
const PRIMARY_METRICS = "totalPoints";

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

async function fetchBulkMetrics(
  metrics: string,
  uid: string | null,
  phase: RankingPhase
): Promise<Record<string, BulkMetricPayload> | null> {
  const params = new URLSearchParams();
  params.set("metrics", metrics);
  params.set("phase", phase);
  if (uid) params.set("uid", uid);
  const res = await fetch(`/api/cumulative-ranking/bulk?${params.toString()}`);
  const json = await res.json();
  if (!json?.ok || !json?.byMetric) return null;
  return json.byMetric as Record<string, BulkMetricPayload>;
}

export function useCumulativeRankingsBulk(phase: RankingPhase = "playoffs") {
  const [authReady, setAuthReady] = useState(false);
  const [myUid, setMyUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [byMetric, setByMetric] = useState<Record<
    string,
    BulkMetricPayload
  > | null>(null);
  const [appliedTotalPointsUid, setAppliedTotalPointsUid] = useState<
    string | null
  >(null);

  const mountPrimaryGenRef = useRef(0);
  const uidPrimarySeqRef = useRef(0);
  const metricReqSeqRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    // Phase changed: drop previous phase bundles immediately
    setByMetric(null);
    setAppliedTotalPointsUid(null);
    setLoading(true);

    void (async () => {
      const g = ++mountPrimaryGenRef.current;
      try {
        const partial = await fetchBulkMetrics(PRIMARY_METRICS, null, phase);
        if (cancelled || g !== mountPrimaryGenRef.current) return;
        if (partial) {
          setByMetric((p) => mergeMetricBundles(p, partial));
          setAppliedTotalPointsUid(ANON_KEY);
        } else {
          setByMetric(
            mergeMetricBundles(null, { totalPoints: emptyBulkMetric() })
          );
          setAppliedTotalPointsUid(ANON_KEY);
        }
      } catch {
        if (cancelled || g !== mountPrimaryGenRef.current) return;
        setByMetric(
          mergeMetricBundles(null, { totalPoints: emptyBulkMetric() })
        );
        setAppliedTotalPointsUid(ANON_KEY);
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
            const partial = await fetchBulkMetrics(PRIMARY_METRICS, null, phase);
            if (cancelled || g !== mountPrimaryGenRef.current) return;
            if (partial) {
              setByMetric((p) => mergeMetricBundles(p, partial));
              setAppliedTotalPointsUid(ANON_KEY);
            } else {
              setByMetric(
                mergeMetricBundles(null, { totalPoints: emptyBulkMetric() })
              );
              setAppliedTotalPointsUid(ANON_KEY);
            }
          } catch {
            if (cancelled || g !== mountPrimaryGenRef.current) return;
            setByMetric(
              mergeMetricBundles(null, { totalPoints: emptyBulkMetric() })
            );
            setAppliedTotalPointsUid(ANON_KEY);
          }
        })();
        return;
      }

      const uq = ++uidPrimarySeqRef.current;
      void (async () => {
        try {
          const partial = await fetchBulkMetrics(PRIMARY_METRICS, uid, phase);
          if (cancelled || uq !== uidPrimarySeqRef.current) return;
          if (partial) {
            setByMetric((p) => mergeMetricBundles(p, partial));
            setAppliedTotalPointsUid(uid);
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
  }, [phase]);

  const ensureMetric = useCallback(
    async (metric: string) => {
      if (metric === "totalPoints") return;
      if (!authReady) return;
      if (!byMetric?.totalPoints) return;
      if (byMetric?.[metric]) return;

      const uidForMetric = myUid;
      if (uidForMetric) {
        if (appliedTotalPointsUid !== uidForMetric) return;
      } else if (appliedTotalPointsUid !== ANON_KEY) {
        return;
      }

      const seq = ++metricReqSeqRef.current;
      try {
        const partial = await fetchBulkMetrics(metric, uidForMetric, phase);
        if (seq !== metricReqSeqRef.current) return;
        if (partial) {
          setByMetric((p) => mergeMetricBundles(p, partial));
        } else {
          setByMetric((p) =>
            mergeMetricBundles(p, { [metric]: emptyBulkMetric() })
          );
        }
      } catch {
        if (seq !== metricReqSeqRef.current) return;
        setByMetric((p) => mergeMetricBundles(p, { [metric]: emptyBulkMetric() }));
      }
    },
    [authReady, byMetric, myUid, appliedTotalPointsUid, phase]
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
    authReady,
    ensureMetric,
  };
}
