"use client";

import { useCallback, useEffect, useState } from "react";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import {
  NBA_PLAYER_STAT_LEADER_METRICS,
  type NbaPlayerLeaderMetricId,
  type NbaPlayerStatLeaderRow,
  type NbaPlayerStatLeadersBundle,
} from "@/lib/predict/nbaPlayerStatLeadersMocks";
import { NBA_PLAYER_ADVANCED_LEADER_METRICS } from "@/lib/predict/nbaPlayerStatLeadersAdvanced";
import { fetchPlayerStatLeaders } from "@/lib/nba/playerStatLeaders/fetchPlayerStatLeadersClient";
import {
  createSnapshotFetchCache,
  nbaSnapshotCacheKey,
  NBA_SNAPSHOT_CACHE_TTL_MS,
} from "@/lib/nba/snapshotFetchCache";
import type {
  NbaPlayerStatLeadersApiPayload,
  NbaPlayerStatLeadersSnapshotSource,
} from "@/lib/nba/playerStatLeaders/playerStatLeadersTypes";

function emptyPlayerLeadersBoard(): Record<
  NbaPlayerLeaderMetricId,
  NbaPlayerStatLeaderRow[]
> {
  const board: Partial<
    Record<NbaPlayerLeaderMetricId, NbaPlayerStatLeaderRow[]>
  > = {};
  for (const m of NBA_PLAYER_STAT_LEADER_METRICS) {
    board[m.id] = [];
  }
  for (const m of NBA_PLAYER_ADVANCED_LEADER_METRICS) {
    board[m.id] = [];
  }
  return board as Record<NbaPlayerLeaderMetricId, NbaPlayerStatLeaderRow[]>;
}

const EMPTY_BUNDLE: NbaPlayerStatLeadersBundle = {
  season: emptyPlayerLeadersBoard(),
  last10: emptyPlayerLeadersBoard(),
  asOfLabel: "UNAVAILABLE",
};

/** 検索バー・リーダーボード・プレイヤー詳細が同じ bundle を要求するため共有する */
const cache = createSnapshotFetchCache<NbaPlayerStatLeadersApiPayload>(
  NBA_SNAPSHOT_CACHE_TTL_MS
);

export type UsePlayerStatLeadersBundleOptions = {
  apiBaseUrl?: string | null;
  season?: string;
  /** false のときは取得しない（未選択タブの先読みを止める） */
  enabled?: boolean;
};

export type UsePlayerStatLeadersBundleState = {
  bundle: NbaPlayerStatLeadersBundle;
  source: NbaPlayerStatLeadersSnapshotSource;
  updatedAt: string | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
};

type Resolved = {
  bundle: NbaPlayerStatLeadersBundle;
  source: NbaPlayerStatLeadersSnapshotSource;
  updatedAt: string | null;
};

const EMPTY_RESOLVED: Resolved = {
  bundle: EMPTY_BUNDLE,
  source: "empty",
  updatedAt: null,
};

function resolvePayload(data: NbaPlayerStatLeadersApiPayload): Resolved {
  return {
    bundle: data.bundle,
    source: data.source,
    updatedAt: data.updatedAt,
  };
}

export function usePlayerStatLeadersBundle(
  options: UsePlayerStatLeadersBundleOptions = {}
): UsePlayerStatLeadersBundleState {
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
        fetchPlayerStatLeaders({
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
          trackAppEvent({
            name: "stats_empty",
            props: { kind: "player", season },
          });
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
