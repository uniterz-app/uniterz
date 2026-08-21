"use client";

import { useEffect, useState } from "react";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import {
  EMPTY_NBA_CONFERENCE_STANDINGS,
  type NbaConferenceStandingsBoard,
} from "@/lib/nba/nbaConferenceStandings";
import { fetchNbaConferenceStandings } from "@/lib/nba/standings/fetchNbaConferenceStandingsClient";
import type { NbaConferenceStandingsSource } from "@/lib/nba/standings/nbaConferenceStandingsTypes";

export type UseNbaConferenceStandingsOptions = {
  apiBaseUrl?: string | null;
};

export function useNbaConferenceStandings(
  options: UseNbaConferenceStandingsOptions = {}
): {
  board: NbaConferenceStandingsBoard;
  asOfLabel: string;
  source: NbaConferenceStandingsSource | null;
  loading: boolean;
  error: string | null;
} {
  const [board, setBoard] = useState<NbaConferenceStandingsBoard>(
    EMPTY_NBA_CONFERENCE_STANDINGS
  );
  const [asOfLabel, setAsOfLabel] = useState("");
  const [source, setSource] = useState<NbaConferenceStandingsSource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    setBoard(EMPTY_NBA_CONFERENCE_STANDINGS);
    setAsOfLabel("");
    setSource(null);

    void fetchNbaConferenceStandings({
      apiBaseUrl: options.apiBaseUrl,
      season: CURRENT_NBA_SEASON_KEY,
      signal: ac.signal,
    })
      .then((data) => {
        if (cancelled) return;
        setBoard(data.board);
        setAsOfLabel(data.asOfLabel);
        setSource(data.source);
      })
      .catch((e) => {
        if (cancelled || ac.signal.aborted) return;
        setError(e instanceof Error ? e.message : "standings load failed");
        setBoard(EMPTY_NBA_CONFERENCE_STANDINGS);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [options.apiBaseUrl]);

  return { board, asOfLabel, source, loading, error };
}
