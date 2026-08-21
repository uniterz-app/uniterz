"use client";

/**
 * NBA 無差別級シーズンランキング（Pro 限定）の取得。
 * 認証後のレスポンス本体は全員共通（uid クエリなし）。
 * 短い TTL + inflight。uid の再 hydrate で二重取得しない。
 */

import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { BulkMetricPayload } from "@/lib/rankings/useCumulativeRankingsBulk";
import { allRankingMetricsParam } from "@/lib/rankings/rankingBulkMetrics";

type OpenSeasonResult = {
  byMetric: Record<string, BulkMetricPayload>;
  proRequired: boolean;
};

const OPEN_CACHE_TTL_MS = 5 * 60 * 1000;
let openCache: { at: number; value: OpenSeasonResult } | null = null;
let openInflight: Promise<OpenSeasonResult> | null = null;

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
    if (!uid) {
      setListReady(false);
      return;
    }

    if (
      openCache &&
      Date.now() - openCache.at < OPEN_CACHE_TTL_MS &&
      !openCache.value.proRequired
    ) {
      setByMetric(openCache.value.byMetric);
      setProRequired(false);
      setListReady(true);
      return;
    }

    setListReady(false);
    setProRequired(false);

    const run =
      openInflight ??
      (async (): Promise<OpenSeasonResult> => {
        try {
          const token = await auth.currentUser?.getIdToken().catch(() => null);
          const params = new URLSearchParams({
            division: "open",
            metrics: allRankingMetricsParam(),
          });
          const res = await fetch(`/api/cumulative-ranking/bulk?${params}`, {
            headers: token
              ? { Authorization: `Bearer ${token}` }
              : undefined,
            cache: "force-cache",
          });
          const json = (await res.json()) as {
            ok?: boolean;
            error?: string;
            byMetric?: Record<string, BulkMetricPayload>;
          };
          if (res.status === 403 && json?.error === "pro_required") {
            return { byMetric: {}, proRequired: true };
          }
          if (!res.ok || !json?.ok) {
            return { byMetric: {}, proRequired: false };
          }
          return {
            byMetric: json.byMetric ?? {},
            proRequired: false,
          };
        } catch {
          return { byMetric: {}, proRequired: false };
        }
      })().finally(() => {
        openInflight = null;
      });

    if (!openInflight) openInflight = run;

    try {
      const value = await run;
      if (!value.proRequired) {
        openCache = { at: Date.now(), value };
      }
      setByMetric(value.byMetric);
      setProRequired(value.proRequired);
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
    myMetricValueDeltas: null as null,
    ensureMetric,
    proRequired,
  };
}
