import { useCallback, useEffect, useState } from "react";
import { fetchNbaLeagueHub } from "../../../../../../lib/nba/leagueHub/fetchNbaLeagueHubClient";
import type { NbaLeagueHubDoc } from "../../../../../../lib/nba/leagueHub/leagueHubTypes";
import { getUniterzApiBaseUrl } from "../submitPredictionApi";

const STALE_MS = 5 * 60 * 1000;
let cached: { hub: NbaLeagueHubDoc | null; at: number } | null = null;
/** LEAGUE タブの複数パネルが同時にマウントしても 1 回だけ取る */
let inflight: Promise<NbaLeagueHubDoc | null> | null = null;

function loadHubShared(): Promise<NbaLeagueHubDoc | null> {
  if (inflight) return inflight;
  inflight = fetchNbaLeagueHub({ apiBaseUrl: getUniterzApiBaseUrl() })
    .then((data) => {
      cached = { hub: data.hub, at: Date.now() };
      return data.hub;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

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
    let alive = true;
    setLoading(true);
    setError(null);
    loadHubShared()
      .then((next) => {
        if (alive) setHub(next);
      })
      .catch((e: unknown) => {
        if (alive) setError(e instanceof Error ? e.message : "load failed");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [tick]);

  return { hub, loading, error, reload };
}
