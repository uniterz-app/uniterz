/**
 * Web `useOpenSeasonRankingsBulk` 相当 — NBA 無差別級シーズン（Pro 限定）
 */

import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { getUniterzApiBaseUrl } from "../games/submitPredictionApi";
import type { BulkMetricPayload } from "./useNativeCumulativeRankingsBulk";
import { allRankingMetricsParam } from "../../../../../lib/rankings/rankingBulkMetrics";

export function useNativeOpenSeasonRankingsBulk(enabled: boolean) {
  const [uid, setUid] = useState<string | null>(null);
  const [listReady, setListReady] = useState(false);
  const [byMetric, setByMetric] = useState<Record<string, BulkMetricPayload>>(
    {}
  );
  const [proRequired, setProRequired] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null));
  }, []);

  const load = useCallback(async () => {
    if (!enabled) {
      setByMetric({});
      setProRequired(false);
      setListReady(true);
      return;
    }
    setListReady(false);
    setProRequired(false);
    try {
      const base = getUniterzApiBaseUrl();
      if (!base) {
        setByMetric({});
        return;
      }
      const token = await auth.currentUser?.getIdToken().catch(() => null);
      const params = new URLSearchParams({
        division: "open",
        metrics: allRankingMetricsParam(null),
      });
      if (uid) params.set("uid", uid);
      const res = await fetch(
        `${base}/api/cumulative-ranking/bulk?${params.toString()}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          cache: "no-store",
        }
      );
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        byMetric?: Record<string, BulkMetricPayload>;
      };
      if (res.status === 403 && json?.error === "pro_required") {
        setByMetric({});
        setProRequired(true);
        return;
      }
      if (!res.ok || !json?.ok) {
        setByMetric({});
        return;
      }
      setByMetric(json.byMetric ?? {});
    } catch {
      setByMetric({});
    } finally {
      setListReady(true);
    }
  }, [enabled, uid]);

  useEffect(() => {
    void load();
  }, [load]);

  const ensureMetric = useCallback((_metric: string) => {
    /* open season bulk loads all metrics at once */
  }, []);

  return {
    listReady: enabled ? listReady : true,
    personalPending: false,
    myUid: uid,
    byMetric: enabled ? byMetric : {},
    ensureMetric,
    proRequired,
  };
}
