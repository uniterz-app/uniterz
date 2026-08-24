"use client";

import { useCallback, useEffect, useState } from "react";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { enrichLeagueTeamStatsBundle } from "@/lib/predict/nbaLeagueTeamStatsMocks";
import { fetchLeagueTeamStats } from "@/lib/nba/leagueTeamStats/fetchLeagueTeamStatsClient";
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

export type UseLeagueTeamStatsBundleOptions = {
  apiBaseUrl?: string | null;
  season?: string;
};

export type UseLeagueTeamStatsBundleState = {
  bundle: NbaLeagueTeamStatsBundle;
  source: NbaLeagueTeamStatsSnapshotSource;
  updatedAt: string | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
};

export function useLeagueTeamStatsBundle(
  options: UseLeagueTeamStatsBundleOptions = {}
): UseLeagueTeamStatsBundleState {
  const season = options.season ?? CURRENT_NBA_SEASON_KEY;
  const [bundle, setBundle] = useState<NbaLeagueTeamStatsBundle>(EMPTY_BUNDLE);
  const [source, setSource] =
    useState<NbaLeagueTeamStatsSnapshotSource>("empty");
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
        const data: NbaLeagueTeamStatsApiPayload = await fetchLeagueTeamStats({
          apiBaseUrl: options.apiBaseUrl,
          season,
          signal: ac.signal,
        });
        if (cancelled) return;
        setBundle(enrichLeagueTeamStatsBundle(data.bundle, data.source));
        setSource(data.source);
        setUpdatedAt(data.updatedAt);
        if (data.source === "empty") {
          const { trackAppEvent } = await import(
            "@/lib/observability/trackAppEvent"
          );
          trackAppEvent({
            name: "stats_empty",
            props: { kind: "team", season },
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
