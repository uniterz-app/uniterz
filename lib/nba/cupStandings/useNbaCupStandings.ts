"use client";

import { useEffect, useState } from "react";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { fetchNbaCupStandings } from "./fetchNbaCupStandingsClient";
import {
  EMPTY_NBA_CUP_STANDINGS,
  type NbaCupStandingsBoard,
} from "./nbaCupStandingsTypes";

export type UseNbaCupStandingsOptions = {
  apiBaseUrl?: string | null;
  season?: string;
};

export function useNbaCupStandings(options: UseNbaCupStandingsOptions = {}): {
  board: NbaCupStandingsBoard;
  asOfLabel: string;
  loading: boolean;
  error: string | null;
} {
  const [board, setBoard] = useState<NbaCupStandingsBoard>(EMPTY_NBA_CUP_STANDINGS);
  const [asOfLabel, setAsOfLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void fetchNbaCupStandings({
      apiBaseUrl: options.apiBaseUrl,
      season: options.season?.trim() || CURRENT_NBA_SEASON_KEY,
    })
      .then((data) => {
        if (cancelled) return;
        setBoard(data.board);
        setAsOfLabel(data.asOfLabel);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "cup standings load failed");
        setBoard(EMPTY_NBA_CUP_STANDINGS);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [options.apiBaseUrl, options.season]);

  return { board, asOfLabel, loading, error };
}
