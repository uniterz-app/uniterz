import { useCallback, useEffect, useState } from "react";
import { fetchNbaLeagueHub } from "../../../../../../lib/nba/leagueHub/fetchNbaLeagueHubClient";
import type { NbaLeagueHubDoc } from "../../../../../../lib/nba/leagueHub/leagueHubTypes";
import { getUniterzApiBaseUrl } from "../submitPredictionApi";

const STALE_MS = 5 * 60 * 1000;
let cached: { hub: NbaLeagueHubDoc | null; at: number } | null = null;

export function useNbaLeagueHubNative() {
  const fresh = cached && Date.now() - cached.at < STALE_MS ? cached : null;
  const [hub, setHub] = useState<NbaLeagueHubDoc | null>(cached?.hub ?? null);
  const [loading, setLoading] = useState(!fresh);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => {
    cached = null;
    setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    if (cached && Date.now() - cached.at < STALE_MS) {
      setHub(cached.hub);
      setLoading(false);
      return;
    }
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    fetchNbaLeagueHub({ apiBaseUrl: getUniterzApiBaseUrl(), signal: ac.signal })
      .then((data) => {
        cached = { hub: data.hub, at: Date.now() };
        setHub(data.hub);
      })
      .catch((e: unknown) => {
        if (ac.signal.aborted) return;
        setError(e instanceof Error ? e.message : "load failed");
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });
    return () => ac.abort();
  }, [tick]);

  return { hub, loading, error, reload };
}
