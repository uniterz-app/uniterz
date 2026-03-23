"use client";

import { useEffect, useMemo, useState } from "react";

export const MONTHLY_LEADERBOARD_METRICS = [
  "totalPoints",
  "winRate",
  "totalPrecision",
  "totalUpset",
] as const;

export type MonthlyLeaderboardMetric =
  (typeof MONTHLY_LEADERBOARD_METRICS)[number];

export type MonthlyLeaderboardRow = {
  uid: string;
  displayName: string;
  handle: string | null;
  photoURL: string | null;

  league: string;
  posts: number;
  wins: number;

  winRate: number;
  totalPoints: number;
  totalPrecision: number;
  totalUpset: number;

  rank: number;
};

type MonthlyLeaderboardApiResponse = {
  ok: boolean;
  league?: string;
  month?: string;
  metric?: MonthlyLeaderboardMetric;
  count?: number;
  rows?: MonthlyLeaderboardRow[];
  error?: string;
};

type UseMonthlyLeaderboardParams = {
  league: string;
  month: string;
  metric: MonthlyLeaderboardMetric;
  enabled?: boolean;
};

type UseMonthlyLeaderboardResult = {
  loading: boolean;
  error: string | null;
  rows: MonthlyLeaderboardRow[];
  top3: MonthlyLeaderboardRow[];
  restRows: MonthlyLeaderboardRow[];
  refetch: () => Promise<void>;
};

function isValidMonth(month: string) {
  return /^\d{4}-\d{2}$/.test(month);
}

function isValidMetric(metric: string): metric is MonthlyLeaderboardMetric {
  return MONTHLY_LEADERBOARD_METRICS.includes(
    metric as MonthlyLeaderboardMetric
  );
}

export default function useMonthlyLeaderboard(
  params: UseMonthlyLeaderboardParams
): UseMonthlyLeaderboardResult {
  const { league, month, metric, enabled = true } = params;

  const [loading, setLoading] = useState<boolean>(false);
  const [rows, setRows] = useState<MonthlyLeaderboardRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async (signal?: AbortSignal) => {
    if (!enabled) {
      setLoading(false);
      setRows([]);
      setError(null);
      return;
    }

    if (!league || !isValidMonth(month) || !isValidMetric(metric)) {
      setLoading(false);
      setRows([]);
      setError("invalid leaderboard params");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const qs = new URLSearchParams({
        league,
        month,
        metric,
      });

      const res = await fetch(`/api/monthly-leaderboard?${qs.toString()}`, {
        method: "GET",
        cache: "no-store",
        signal,
      });

      const json: MonthlyLeaderboardApiResponse = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json?.error ?? "failed to fetch monthly leaderboard");
      }

      const nextRows = Array.isArray(json.rows) ? json.rows : [];
      setRows(nextRows);
      setError(null);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setRows([]);
      setError(e?.message ?? "failed to fetch monthly leaderboard");
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
  }, [league, month, metric, enabled]);

  const top3 = useMemo(() => rows.slice(0, 3), [rows]);
  const restRows = useMemo(() => rows.slice(3), [rows]);

  return {
    loading,
    error,
    rows,
    top3,
    restRows,
    refetch: async () => {
      await fetchLeaderboard();
    },
  };
}