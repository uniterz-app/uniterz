"use client";

import { useCallback, useEffect, useState } from "react";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { enrichLeagueTeamStatsBundle } from "@/lib/predict/nbaLeagueTeamStatsMocks";
import { fetchLeagueTeamStats } from "@/lib/nba/leagueTeamStats/fetchLeagueTeamStatsClient";
import {
  createSnapshotFetchCache,
  nbaSnapshotCacheKey,
  NBA_SNAPSHOT_CACHE_TTL_MS,
} from "@/lib/nba/snapshotFetchCache";
import type {
  NbaLeagueTeamStatsApiPayload,
  NbaLeagueTeamStatsSnapshotSource,
} from "@/lib/nba/leagueTeamStats/leagueTeamStatsTypes";
import type { NbaLeagueTeamStatsBundle } from "@/lib/predict/nbaLeagueTeamStatsMocks";

const EMPTY_BUNDLE: NbaLeagueTeamStatsBundle = {
  season: [],
  last10: [],
  asOfLabel: "UNAVAILABLE",
};

/**
 * STATS ハブでは検索バーと各パネルが同じ bundle を要求するため、
 * season 単位で 1 リクエストに畳む。
 */
const cache = createSnapshotFetchCache<NbaLeagueTeamStatsApiPayload>(
  NBA_SNAPSHOT_CACHE_TTL_MS
);

export type UseLeagueTeamStatsBundleOptions = {
  apiBaseUrl?: string | null;
  season?: string;
  /** false のときは取得しない（未選択タブの先読みを止める） */
  enabled?: boolean;
};

export type UseLeagueTeamStatsBundleState = {
  bundle: NbaLeagueTeamStatsBundle;
  source: NbaLeagueTeamStatsSnapshotSource;
  updatedAt: string | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
};

type Resolved = {
  bundle: NbaLeagueTeamStatsBundle;
  source: NbaLeagueTeamStatsSnapshotSource;
  updatedAt: string | null;
};

function resolvePayload(data: NbaLeagueTeamStatsApiPayload): Resolved {
  return {
    bundle: enrichLeagueTeamStatsBundle(data.bundle, data.source),
    source: data.source,
    updatedAt: data.updatedAt,
  };
}

const EMPTY_RESOLVED: Resolved = {
  bundle: EMPTY_BUNDLE,
  source: "empty",
  updatedAt: null,
};

export function useLeagueTeamStatsBundle(
  options: UseLeagueTeamStatsBundleOptions = {}
): UseLeagueTeamStatsBundleState {
  const season = options.season ?? CURRENT_NBA_SEASON_KEY;
  const enabled = options.enabled ?? true;
  const key = nbaSnapshotCacheKey(options.apiBaseUrl, season);

  const cached = enabled ? cache.peek(key) : null;
  const [resolved, setResolved] = useState<Resolved>(() =>
    cached ? resolvePayload(cached) : EMPTY_RESOLVED
  );
  const [loading, setLoading] = useState(enabled && !cached);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => {
    cache.invalidate(key);
    setTick((t) => t + 1);
  }, [key]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const hit = cache.peek(key);
    if (hit) {
      setResolved(resolvePayload(hit));
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    cache
      .load(key, () =>
        fetchLeagueTeamStats({
          apiBaseUrl: options.apiBaseUrl,
          season,
        })
      )
      .then(async (data) => {
        if (cancelled) return;
        setResolved(resolvePayload(data));
        if (data.source === "empty") {
          const { trackAppEvent } = await import(
            "@/lib/observability/trackAppEvent"
          );
          trackAppEvent({ name: "stats_empty", props: { kind: "team", season } });
        }
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "load failed");
        setResolved(EMPTY_RESOLVED);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, key, options.apiBaseUrl, season, tick]);

  return {
    bundle: resolved.bundle,
    source: resolved.source,
    updatedAt: resolved.updatedAt,
    loading,
    error,
    reload,
  };
}
