"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
  championPick?: string | null;
};

type ApiResponse = {
  ok: boolean;
  season?: string;
  count?: number;
  totalCount?: number;
  rows?: BracketLeaderboardRow[];
  myRow?: BracketLeaderboardRow | null;
  hasMore?: boolean;
  nextCursor?: string | null;
  error?: string;
};

/** First request page size (must match BracketLeaderboardSection UX). */
export const BRACKET_LEADERBOARD_FIRST_LIMIT = 30;
export const BRACKET_LEADERBOARD_PAGE_LIMIT = 20;

type UseBracketLeaderboardParams = {
  season: string;
  uid?: string | null;
  enabled?: boolean;
};

type UseBracketLeaderboardResult = {
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  rows: BracketLeaderboardRow[];
  myRow: BracketLeaderboardRow | null;
  totalCount: number;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
};

export default function useBracketLeaderboard(
  params: UseBracketLeaderboardParams
): UseBracketLeaderboardResult {
  const { season, uid = null, enabled = true } = params;

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [rows, setRows] = useState<BracketLeaderboardRow[]>([]);
  const [myRow, setMyRow] = useState<BracketLeaderboardRow | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const rowsRef = useRef<BracketLeaderboardRow[]>([]);
  const nextCursorRef = useRef<string | null>(null);
  const hasMoreRef = useRef(false);
  const loadingMoreLock = useRef(false);

  rowsRef.current = rows;
  nextCursorRef.current = nextCursor;
  hasMoreRef.current = hasMore;

  const fetchFirstPage = useCallback(
    async (signal?: AbortSignal) => {
      if (!enabled) {
        setLoading(false);
        setLoadingMore(false);
        setRows([]);
        setMyRow(null);
        setTotalCount(0);
        setError(null);
        setHasMore(false);
        setNextCursor(null);
        return;
      }

      if (!season || !/^\d{4}$/.test(season)) {
        setLoading(false);
        setRows([]);
        setMyRow(null);
        setTotalCount(0);
        setError("invalid season");
        setHasMore(false);
        setNextCursor(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const q = new URLSearchParams({
          season,
          limit: "50",
          startRank: "1",
        });
        if (uid) q.set("uid", uid);
        const res = await fetch(`/api/bracket-leaderboard?${q}`, {
          method: "GET",
          cache: "no-store",
          signal,
        });

        const json: ApiResponse = await res.json();

        if (!res.ok || !json.ok) {
          throw new Error(json?.error ?? "failed to fetch bracket leaderboard");
        }

        const nextRows = Array.isArray(json.rows) ? json.rows : [];
        setRows(nextRows);
        setMyRow(json.myRow ?? null);
        setTotalCount(
          typeof json.totalCount === "number" && Number.isFinite(json.totalCount)
            ? Math.max(0, Math.floor(json.totalCount))
            : 0
        );
        setHasMore(Boolean(json.hasMore));
        setNextCursor(json.nextCursor ?? null);
        setError(null);
      } catch (e: unknown) {
        if (e instanceof Error && e.name === "AbortError") return;
        setRows([]);
        setMyRow(null);
        setTotalCount(0);
        setHasMore(false);
        setNextCursor(null);
        setError(
          e instanceof Error ? e.message : "failed to fetch bracket leaderboard"
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [season, enabled, uid]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchFirstPage(controller.signal);
    return () => controller.abort();
  }, [fetchFirstPage]);

  const loadMore = useCallback(async () => {
    if (!enabled || !season || !/^\d{4}$/.test(season)) return;
    if (!hasMoreRef.current || loadingMoreLock.current) return;
    const cursor = nextCursorRef.current;
    if (!cursor) return;

    loadingMoreLock.current = true;
    setLoadingMore(true);
    setError(null);

    try {
      const startRank = rowsRef.current.length + 1;
      const q = new URLSearchParams({
        season,
        limit: String(BRACKET_LEADERBOARD_PAGE_LIMIT),
        startRank: String(startRank),
        cursor,
      });
      const res = await fetch(`/api/bracket-leaderboard?${q}`, {
        method: "GET",
        cache: "no-store",
      });
      const json: ApiResponse = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json?.error ?? "failed to fetch bracket leaderboard");
      }
      const chunk = Array.isArray(json.rows) ? json.rows : [];
      setRows((prev) => [...prev, ...chunk]);
      setHasMore(Boolean(json.hasMore));
      setNextCursor(json.nextCursor ?? null);
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : "failed to fetch bracket leaderboard"
      );
    } finally {
      loadingMoreLock.current = false;
      setLoadingMore(false);
    }
  }, [season, enabled]);

  const refetch = useCallback(async () => {
    await fetchFirstPage();
  }, [fetchFirstPage]);

  return {
    loading,
    loadingMore,
    error,
    rows,
    myRow,
    totalCount,
    hasMore,
    loadMore,
    refetch,
  };
}
