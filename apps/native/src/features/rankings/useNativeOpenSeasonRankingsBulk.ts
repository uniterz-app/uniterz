/**
 * Web `useOpenSeasonRankingsBulk` 相当 — NBA 無差別級シーズン（Pro 限定）
 * 世代キー付きキャッシュ。uid hydrate での二重取得を抑える。
 */

import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { getUniterzApiBaseUrl } from "../games/submitPredictionApi";
import type { BulkMetricPayload } from "./useNativeCumulativeRankingsBulk";
import { allRankingMetricsParam } from "../../../../../lib/rankings/rankingBulkMetrics";
import {
  appendRankingSnapshotGenerationParam,
  fetchRankingSnapshotGeneration,
} from "../../../../../lib/rankings/rankingSnapshotGenerationClient";

type OpenSeasonResult = {
  byMetric: Record<string, BulkMetricPayload>;
  proRequired: boolean;
  snapshotGeneration: string | null;
};

const OPEN_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
let openCache: { at: number; value: OpenSeasonResult } | null = null;
let openInflight: Promise<OpenSeasonResult> | null = null;

export function clearNativeOpenSeasonRankingsClientCache(): void {
  openCache = null;
  openInflight = null;
}

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
    if (!uid) {
      setListReady(false);
      return;
    }

    const base = getUniterzApiBaseUrl();
    if (
      openCache &&
      Date.now() - openCache.at < OPEN_CACHE_TTL_MS &&
      !openCache.value.proRequired
    ) {
      const generation = await fetchRankingSnapshotGeneration(base);
      if (
        openCache.value.snapshotGeneration &&
        openCache.value.snapshotGeneration === generation
      ) {
        setByMetric(openCache.value.byMetric);
        setProRequired(false);
        setListReady(true);
        return;
      }
      openCache = null;
    }

    setListReady(false);
    setProRequired(false);

    const run =
      openInflight ??
      (async (): Promise<OpenSeasonResult> => {
        try {
          if (!base) {
            return {
              byMetric: {},
              proRequired: false,
              snapshotGeneration: null,
            };
          }
          const token = await auth.currentUser?.getIdToken().catch(() => null);
          const generation = await fetchRankingSnapshotGeneration(base);
          const params = new URLSearchParams({
            division: "open",
            metrics: allRankingMetricsParam(),
          });
          appendRankingSnapshotGenerationParam(params, generation);
          const res = await fetch(
            `${base}/api/cumulative-ranking/bulk?${params.toString()}`,
            {
              headers: token
                ? { Authorization: `Bearer ${token}` }
                : undefined,
              cache: "force-cache",
            }
          );
          const json = (await res.json()) as {
            ok?: boolean;
            error?: string;
            byMetric?: Record<string, BulkMetricPayload>;
            snapshotGeneration?: string;
          };
          if (res.status === 403 || json?.error === "pro_required") {
            return {
              byMetric: {},
              proRequired: true,
              snapshotGeneration: null,
            };
          }
          if (!res.ok || !json?.ok) {
            return {
              byMetric: {},
              proRequired: false,
              snapshotGeneration: null,
            };
          }
          return {
            byMetric: json.byMetric ?? {},
            proRequired: false,
            snapshotGeneration: generation,
          };
        } catch {
          return {
            byMetric: {},
            proRequired: false,
            snapshotGeneration: null,
          };
        }
      })().finally(() => {
        openInflight = null;
      });

    openInflight = run;

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
