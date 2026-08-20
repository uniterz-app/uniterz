"use client";

import { useEffect, useMemo, useState } from "react";
import { useLeagueTeamStatsBundle } from "@/lib/nba/useLeagueTeamStatsBundle";
import { fetchTeamsByLeagueShared } from "@/lib/games/fetchTeamsByLeagueShared";
import {
  buildNbaConferenceStandings,
  type NbaConferenceStandingsBoard,
} from "@/lib/nba/nbaConferenceStandings";
import type { NbaStatsSnapshotSource } from "@/lib/nba/nbaStatsSnapshotCacheControl";

export type UseNbaConferenceStandingsOptions = {
  apiBaseUrl?: string | null;
};

export function useNbaConferenceStandings(
  options: UseNbaConferenceStandingsOptions = {}
): {
  board: NbaConferenceStandingsBoard;
  asOfLabel: string;
  source: NbaStatsSnapshotSource;
  loading: boolean;
  error: string | null;
} {
  const { bundle, source, loading: statsLoading, error: statsError } =
    useLeagueTeamStatsBundle({ apiBaseUrl: options.apiBaseUrl });
  const [teamDocs, setTeamDocs] = useState<Record<string, unknown>[]>([]);
  const [teamsError, setTeamsError] = useState<string | null>(null);
  const [teamsLoading, setTeamsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();
    setTeamsLoading(true);
    setTeamsError(null);
    void fetchTeamsByLeagueShared({
      league: "nba",
      apiBaseUrl: options.apiBaseUrl,
      signal: ac.signal,
    })
      .then((rows) => {
        if (cancelled) return;
        setTeamDocs(rows);
      })
      .catch((e) => {
        if (cancelled || ac.signal.aborted) return;
        setTeamsError(e instanceof Error ? e.message : "teams load failed");
        setTeamDocs([]);
      })
      .finally(() => {
        if (!cancelled) setTeamsLoading(false);
      });
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [options.apiBaseUrl]);

  const board = useMemo(
    () => buildNbaConferenceStandings(bundle, teamDocs),
    [bundle, teamDocs]
  );

  return {
    board,
    asOfLabel: bundle.asOfLabel,
    source,
    loading: statsLoading || teamsLoading,
    error: statsError || teamsError,
  };
}
