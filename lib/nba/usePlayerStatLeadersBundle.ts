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

export type UsePlayerStatLeadersBundleOptions = {
  apiBaseUrl?: string | null;
  season?: string;
};

export type UsePlayerStatLeadersBundleState = {
  bundle: NbaPlayerStatLeadersBundle;
  source: NbaPlayerStatLeadersSnapshotSource;
  updatedAt: string | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
};

export function usePlayerStatLeadersBundle(
  options: UsePlayerStatLeadersBundleOptions = {}
): UsePlayerStatLeadersBundleState {
  const season = options.season ?? CURRENT_NBA_SEASON_KEY;
  const [bundle, setBundle] = useState<NbaPlayerStatLeadersBundle>(EMPTY_BUNDLE);
  const [source, setSource] =
    useState<NbaPlayerStatLeadersSnapshotSource>("empty");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const data: NbaPlayerStatLeadersApiPayload = await fetchPlayerStatLeaders(
          {
            apiBaseUrl: options.apiBaseUrl,
            season,
            signal: ac.signal,
          }
        );
        if (cancelled) return;
        setBundle(data.bundle);
        setSource(data.source);
        setUpdatedAt(data.updatedAt);
        if (data.source === "empty") {
          const { trackAppEvent } = await import(
            "@/lib/observability/trackAppEvent"
          );
          trackAppEvent({
            name: "stats_empty",
            props: { kind: "player", season },
          });
        }
      } catch (e) {
        if (cancelled || ac.signal.aborted) return;
        const msg = e instanceof Error ? e.message : "load failed";
        setError(msg);
        setBundle(EMPTY_BUNDLE);
        setSource("empty");
        setUpdatedAt(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [options.apiBaseUrl, season, tick]);

  return { bundle, source, updatedAt, loading, error, reload };
}
