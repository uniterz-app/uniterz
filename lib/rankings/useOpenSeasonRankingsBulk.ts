"use client";

/**
 * NBA 無差別級シーズンランキング（Pro 限定）の取得。
 * 認証後のレスポンス本体は全員共通（uid クエリなし）。
 * 世代キー付きキャッシュ。uid の再 hydrate で二重取得しない。
 */

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { BulkMetricPayload } from "@/lib/rankings/useCumulativeRankingsBulk";
import { allRankingMetricsParam } from "@/lib/rankings/rankingBulkMetrics";
import {
  appendRankingSnapshotGenerationParam,
  fetchRankingSnapshotGeneration,
} from "@/lib/rankings/rankingSnapshotGenerationClient";

type OpenSeasonResult = {
  byMetric: Record<string, BulkMetricPayload>;
  proRequired: boolean;
  snapshotGeneration: string | null;
};

const OPEN_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
let openCache: { at: number; value: OpenSeasonResult } | null = null;
let openInflight: Promise<OpenSeasonResult> | null = null;

export function clearOpenSeasonRankingsClientCache(): void {
  openCache = null;
  openInflight = null;
}

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

  /** enable 切替で空 byMetric + listReady=true の隙間を作らない */
  useLayoutEffect(() => {
    if (!enabled) {
      setByMetric({});
      setProRequired(false);
      setListReady(false);
      return;
    }
    setListReady(false);
    setByMetric({});
    setProRequired(false);
  }, [enabled]);

  const load = useCallback(async (): Promise<OpenSeasonResult> => {
    if (!enabled || !uid) {
      return {
        byMetric: {},
        proRequired: false,
        snapshotGeneration: null,
      };
    }

    if (
      openCache &&
      Date.now() - openCache.at < OPEN_CACHE_TTL_MS &&
      !openCache.value.proRequired
    ) {
      const generation = await fetchRankingSnapshotGeneration();
      if (
        openCache.value.snapshotGeneration &&
        openCache.value.snapshotGeneration === generation
      ) {
        return openCache.value;
      }
      openCache = null;
    }

    const run =
      openInflight ??
      (async (): Promise<OpenSeasonResult> => {
        try {
          const token = await auth.currentUser?.getIdToken().catch(() => null);
          const generation = await fetchRankingSnapshotGeneration();
          const params = new URLSearchParams({
            division: "open",
            metrics: allRankingMetricsParam(),
          });
          appendRankingSnapshotGenerationParam(params, generation);
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

    const value = await run;
    if (!value.proRequired) {
      openCache = { at: Date.now(), value };
    }
    return value;
  }, [enabled, uid]);

  useEffect(() => {
    if (!enabled) return;
    if (!uid) {
      setListReady(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      const value = await load();
      if (cancelled) return;
      setByMetric(value.byMetric);
      setProRequired(value.proRequired);
      setListReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [load, enabled, uid]);

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
