"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { computeAllScopeMetrics } from "@/lib/profile/profileStreakPostsCompute";
import { loadProfileSettledPosts } from "@/lib/profile/profileStreakPostsCache";
import {
  resolveProfileStreakScopeKey,
  type ProfileStatsStreakContext,
} from "@/lib/profile/profileStreakScope";
import type { StreakMetrics } from "@/lib/profile/computeStreakMetrics";

export type { StreakMetrics } from "@/lib/profile/computeStreakMetrics";

const CACHE_TTL_MS = 5 * 60 * 1000;
const METRICS_CACHE_VERSION = 2;

type ScopeCacheEntry = {
  at: number;
  byScope: ReturnType<typeof computeAllScopeMetrics>;
};

const metricsCache = new Map<string, ScopeCacheEntry>();

function metricsCacheKey(uid: string): string {
  return `${uid}:v${METRICS_CACHE_VERSION}`;
}

function readMetricsCache(uid: string): ScopeCacheEntry | null {
  const hit = metricsCache.get(metricsCacheKey(uid));
  if (!hit) return null;
  if (Date.now() - hit.at >= CACHE_TTL_MS) return null;
  return hit;
}

const EMPTY: StreakMetrics = { currentStreak: 0, maxWinStreak: 0 };

export function useProfileScopedStreak(
  uid: string | null | undefined,
  ctx: ProfileStatsStreakContext
) {
  const scopeKey = resolveProfileStreakScopeKey(ctx);

  /**
   * WC 全体（overall）の連勝は ProfilePageBaseV2 がサーバー API のライブ値を採用するため、
   * ここでは確定投稿スキャン（最大 400 件）を行わない。初回プロフィール描画の
   * クリティカルパスから重い読み込みを外し、必要な Last20 トラッカー描画時まで遅延させる。
   */
  const skipPostScan = scopeKey === "wc:overall";

  const [metrics, setMetrics] = useState<StreakMetrics>(() => {
    if (!uid || skipPostScan) return EMPTY;
    const cached = readMetricsCache(uid);
    return cached?.byScope[scopeKey] ?? EMPTY;
  });
  const [loading, setLoading] = useState(() => {
    if (!uid || skipPostScan) return false;
    return readMetricsCache(uid) == null;
  });

  useLayoutEffect(() => {
    if (!uid || skipPostScan) {
      setMetrics(EMPTY);
      setLoading(false);
      return;
    }
    const cached = readMetricsCache(uid);
    if (cached) {
      setMetrics(cached.byScope[scopeKey] ?? EMPTY);
      setLoading(false);
      return;
    }
    setLoading(true);
  }, [scopeKey, uid, skipPostScan]);

  useEffect(() => {
    if (!uid || skipPostScan) return;

    let alive = true;
    const safeUid = uid;

    async function run() {
      const existing = readMetricsCache(safeUid);
      if (existing) {
        if (!alive) return;
        setMetrics(existing.byScope[scopeKey] ?? EMPTY);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const rows = await loadProfileSettledPosts(safeUid);
        const byScope = computeAllScopeMetrics(rows);
        metricsCache.set(metricsCacheKey(safeUid), { at: Date.now(), byScope });
        if (!alive) return;
        setMetrics(byScope[scopeKey] ?? EMPTY);
      } catch (e) {
        console.error("[useProfileScopedStreak]", e);
        if (alive) setMetrics(EMPTY);
      } finally {
        if (alive) setLoading(false);
      }
    }

    void run();
    return () => {
      alive = false;
    };
  }, [scopeKey, uid, skipPostScan]);

  return useMemo(
    () => ({
      scopeKey,
      currentStreak: metrics.currentStreak,
      maxWinStreak: metrics.maxWinStreak,
      loading,
    }),
    [loading, metrics.currentStreak, metrics.maxWinStreak, scopeKey]
  );
}
