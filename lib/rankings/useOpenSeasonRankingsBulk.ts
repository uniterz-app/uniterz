"use client";

/**
 * NBA 無差別級シーズンランキング（Pro 限定）の取得。
 * 認証後のレスポンス本体は全員共通（uid クエリなし）。
 */

import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { BulkMetricPayload } from "@/lib/rankings/useCumulativeRankingsBulk";
import { allRankingMetricsParam } from "@/lib/rankings/rankingBulkMetrics";

export function useOpenSeasonRankingsBulk(enabled: boolean) {
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);
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
      const token = await auth.currentUser?.getIdToken().catch(() => null);
      const params = new URLSearchParams({
        division: "open",
        metrics: allRankingMetricsParam(null),
      });
      const res = await fetch(`/api/cumulative-ranking/bulk?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        cache: "no-store",
      });
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
  }, [enabled]);

  useEffect(() => {
    void load();
  }, [load, uid]);

  const ensureMetric = useCallback((_metric: string) => {
    /* open season bulk loads all metrics at once */
  }, []);

  return {
    listReady: enabled ? listReady : true,
    personalPending: false,
    myUid: uid,
    byMetric: enabled ? byMetric : {},
    myMetricValueDeltas: null as null,
    ensureMetric,
    proRequired,
  };
}
