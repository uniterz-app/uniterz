"use client";

import { useEffect, useState } from "react";

export type BracketLeaderboardRow = {
  uid: string;
  displayName: string;
  handle: string | null;
  photoURL: string | null;
  plan?: "free" | "pro";
  totalScore: number;
  winnerPoints: number;
  gamesPoints: number;
  rank: number;
};

type ApiResponse = {
  ok: boolean;
  season?: string;
  count?: number;
  rows?: BracketLeaderboardRow[];
  error?: string;
};

type UseBracketLeaderboardParams = {
  season: string;
  enabled?: boolean;
};

type UseBracketLeaderboardResult = {
  loading: boolean;
  error: string | null;
  rows: BracketLeaderboardRow[];
  refetch: () => Promise<void>;
};

export default function useBracketLeaderboard(
  params: UseBracketLeaderboardParams
): UseBracketLeaderboardResult {
  const { season, enabled = true } = params;

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<BracketLeaderboardRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async (signal?: AbortSignal) => {
    if (!enabled) {
      setLoading(false);
      setRows([]);
      setError(null);
      return;
    }

    if (!season || !/^\d{4}$/.test(season)) {
      setLoading(false);
      setRows([]);
      setError("invalid season");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/bracket-leaderboard?season=${encodeURIComponent(season)}`,
        { method: "GET", cache: "no-store", signal }
      );

      const json: ApiResponse = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json?.error ?? "failed to fetch bracket leaderboard");
      }

      const nextRows = Array.isArray(json.rows) ? json.rows : [];
      setRows(nextRows);
      setError(null);
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") return;
      setRows([]);
      setError(e instanceof Error ? e.message : "failed to fetch bracket leaderboard");
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchLeaderboard(controller.signal);
    return () => controller.abort();
  }, [season, enabled]);

  return {
    loading,
    error,
    rows,
    refetch: () => fetchLeaderboard(),
  };
}
