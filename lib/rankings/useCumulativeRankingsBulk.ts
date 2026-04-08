"use client";

import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export type BulkMetricPayload = {
  ok: boolean;
  rows: unknown[];
  count: number;
  myRank: number | null;
  myRow: Record<string, unknown> | null;
};

const ANON_KEY = "__anon__";

/** 初回は総合（totalPoints）のみ先読み。他4指標は認証確定後に idle でまとめて取得。 */
const PRIMARY_METRICS = "totalPoints";
const REST_METRICS = "activeWinStreak,totalPrecision,totalUpset,winRate";

function scheduleIdle(cb: () => void): () => void {
  if (typeof requestIdleCallback !== "undefined") {
    const id = requestIdleCallback(cb, { timeout: 2500 });
    return () => cancelIdleCallback(id);
  }
  const t = window.setTimeout(cb, 16);
  return () => clearTimeout(t);
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
      };
    } else {
      out[k] = inc;
    }
  }
  return out;
}

async function fetchBulkMetrics(
  metrics: string,
  uid: string | null
): Promise<Record<string, BulkMetricPayload> | null> {
  const params = new URLSearchParams();
  params.set("metrics", metrics);
  if (uid) params.set("uid", uid);
  const res = await fetch(`/api/cumulative-ranking/bulk?${params.toString()}`);
  const json = await res.json();
  if (!json?.ok || !json?.byMetric) return null;
  return json.byMetric as Record<string, BulkMetricPayload>;
}

export function useCumulativeRankingsBulk() {
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
  const restGenRef = useRef(0);
  const lastRestKeyRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const g = ++mountPrimaryGenRef.current;
      setLoading(true);
      try {
        const partial = await fetchBulkMetrics(PRIMARY_METRICS, null);
        if (cancelled || g !== mountPrimaryGenRef.current) return;
        if (partial) {
          setByMetric((p) => mergeMetricBundles(p, partial));
          setAppliedTotalPointsUid(ANON_KEY);
        } else {
          setByMetric(null);
          setAppliedTotalPointsUid(null);
        }
      } catch {
        if (cancelled || g !== mountPrimaryGenRef.current) return;
        setByMetric(null);
        setAppliedTotalPointsUid(null);
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
        restGenRef.current += 1;
        lastRestKeyRef.current = undefined;
        const g = ++mountPrimaryGenRef.current;
        void (async () => {
          try {
            const partial = await fetchBulkMetrics(PRIMARY_METRICS, null);
            if (cancelled || g !== mountPrimaryGenRef.current) return;
            if (partial) {
              setByMetric((p) => mergeMetricBundles(p, partial));
              setAppliedTotalPointsUid(ANON_KEY);
            }
          } catch {
            /* keep previous */
          }
        })();
        return;
      }

      const uq = ++uidPrimarySeqRef.current;
      void (async () => {
        try {
          const partial = await fetchBulkMetrics(PRIMARY_METRICS, uid);
          if (cancelled || uq !== uidPrimarySeqRef.current) return;
          if (partial) {
            setByMetric((p) => mergeMetricBundles(p, partial));
            setAppliedTotalPointsUid(uid);
          }
        } catch {
          /* keep anon totalPoints */
        }
      })();
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (!byMetric?.totalPoints) return;

    if (myUid) {
      if (appliedTotalPointsUid !== myUid) return;
    } else if (appliedTotalPointsUid !== ANON_KEY) return;

    const restKey = myUid ?? ANON_KEY;
    if (lastRestKeyRef.current === restKey) return;

    const gen = ++restGenRef.current;
    const uidForRest = myUid;
    const captureKey = restKey;

    const cancelIdle = scheduleIdle(() => {
      void (async () => {
        try {
          const partial = await fetchBulkMetrics(REST_METRICS, uidForRest);
          if (gen !== restGenRef.current) return;
          if (partial) {
            setByMetric((p) => mergeMetricBundles(p, partial));
            lastRestKeyRef.current = captureKey;
          }
        } catch {
          /* ignore */
        }
      })();
    });

    return cancelIdle;
  }, [authReady, byMetric?.totalPoints, myUid, appliedTotalPointsUid]);

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
  };
}
