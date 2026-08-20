"use client";

import { useCallback, useEffect, useState } from "react";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { getNbaPlayerStatLeadersMock } from "@/lib/predict/nbaPlayerStatLeadersMocks";
import { fetchPlayerStatLeaders } from "@/lib/nba/playerStatLeaders/fetchPlayerStatLeadersClient";
import type {
  NbaPlayerStatLeadersApiPayload,
  NbaPlayerStatLeadersSnapshotSource,
} from "@/lib/nba/playerStatLeaders/playerStatLeadersTypes";
import type { NbaPlayerStatLeadersBundle } from "@/lib/predict/nbaPlayerStatLeadersMocks";

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
  const [bundle, setBundle] = useState<NbaPlayerStatLeadersBundle>(() =>
    getNbaPlayerStatLeadersMock()
  );
  const [source, setSource] =
    useState<NbaPlayerStatLeadersSnapshotSource>("mock");
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
        const data: NbaPlayerStatLeadersApiPayload = await fetchPlayerStatLeaders({
          apiBaseUrl: options.apiBaseUrl,
          season,
          signal: ac.signal,
        });
        if (cancelled) return;
        setBundle(data.bundle);
        setSource(data.source);
        setUpdatedAt(data.updatedAt);
      } catch (e) {
        if (cancelled || ac.signal.aborted) return;
        const msg = e instanceof Error ? e.message : "load failed";
        setError(msg);
        setBundle(getNbaPlayerStatLeadersMock());
        setSource("mock");
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
