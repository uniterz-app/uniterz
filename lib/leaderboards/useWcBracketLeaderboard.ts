"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WcBracketPredictMatchId } from "@/lib/wc/wc-knockout-bracket";
import { WC_KNOCKOUT_SEASON } from "@/lib/wc/wc-knockout-bracket";

export type WcBracketLeaderboardRow = {
  uid: string;
  displayName: string;
  handle: string | null;
  photoURL: string | null;
  plan?: "free" | "pro";
  rank: number;
  alive: boolean;
  survivedRounds: number;
  firstMissMatchId: WcBracketPredictMatchId | null;
  championPick?: string | null;
};

type ApiResponse = {
  ok: boolean;
  season?: string;
  count?: number;
  totalCount?: number;
  rows?: WcBracketLeaderboardRow[];
  myRow?: WcBracketLeaderboardRow | null;
  hasMore?: boolean;
  nextCursor?: string | null;
  error?: string;
};

export const WC_BRACKET_LEADERBOARD_FIRST_LIMIT = 30;
export const WC_BRACKET_LEADERBOARD_PAGE_LIMIT = 20;

type Params = {
  season?: string;
  uid?: string | null;
  enabled?: boolean;
};

export default function useWcBracketLeaderboard(params: Params = {}) {
  const {
    season = WC_KNOCKOUT_SEASON,
    uid = null,
    enabled = true,
  } = params;

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [rows, setRows] = useState<WcBracketLeaderboardRow[]>([]);
  const [myRow, setMyRow] = useState<WcBracketLeaderboardRow | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const rowsRef = useRef<WcBracketLeaderboardRow[]>([]);
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

      if (!season) {
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
        const res = await fetch(`/api/wc-bracket-leaderboard?${q}`, {
          method: "GET",
          cache: "no-store",
          signal,
        });
        const json: ApiResponse = await res.json();
        if (!res.ok || !json.ok) {
          throw new Error(json?.error ?? "failed to fetch wc bracket leaderboard");
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
          e instanceof Error ? e.message : "failed to fetch wc bracket leaderboard"
        );
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [season, enabled, uid]
  );

  useEffect(() => {
    const controller = new AbortController();
    void fetchFirstPage(controller.signal);
    return () => controller.abort();
  }, [fetchFirstPage]);

  const loadMore = useCallback(async () => {
    if (!enabled || !season) return;
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
        limit: String(WC_BRACKET_LEADERBOARD_PAGE_LIMIT),
        startRank: String(startRank),
        cursor,
      });
      const res = await fetch(`/api/wc-bracket-leaderboard?${q}`, {
        method: "GET",
        cache: "no-store",
      });
      const json: ApiResponse = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json?.error ?? "failed to fetch wc bracket leaderboard");
      }
      const chunk = Array.isArray(json.rows) ? json.rows : [];
      setRows((prev) => [...prev, ...chunk]);
      setHasMore(Boolean(json.hasMore));
      setNextCursor(json.nextCursor ?? null);
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : "failed to fetch wc bracket leaderboard"
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
