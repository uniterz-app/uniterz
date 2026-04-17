// app/component/profile/useUserStatsV2.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import type { ProfileDailyTrendRow } from "@/lib/profile/profileDailyTrendRow";

export type SummaryForCardsV2 = {
  posts: number;
  fullPosts: number;
  recent3Posts: number;

  // 的中数
  wins: number;

  // ① 勝率
  winRate: number;

  // ② スコア精度（期間合計）
  scorePrecisionSum: number;

  // ③ アップセット得点（期間合計）
  upsetPointsSum: number;

  // ④ 総合得点（期間合計）
  pointsSumV3: number;

  /** pointsV3 = base + upsetBonus + streakBonus */
  basePointsSum: number;
  upsetBonusSum: number;
  streakBonusSum: number;

  upsetChanceCount: number;
  upsetHitCount: number;
};

const CACHE_TTL_MS = 5 * 60 * 1000;

/** 初回は 7d + チャート用 trend +連勝用 stats のみ（30d / all / cumulative はタブ選択時） */
const PARTS_INITIAL = "stats,7d,trend";

type CacheEntry = {
  at: number;
  summaries: Partial<Record<"7d" | "30d" | "all", SummaryForCardsV2>>;
  stats: Record<string, unknown> | null;
  dailyTrend: ProfileDailyTrendRow[] | null;
};

const statsCache = new Map<string, CacheEntry>();

function mergeSummaries(
  prev: Partial<Record<"7d" | "30d" | "all", SummaryForCardsV2>> | null,
  next: Partial<Record<"7d" | "30d" | "all", SummaryForCardsV2>> | undefined
): Partial<Record<"7d" | "30d" | "all", SummaryForCardsV2>> {
  return { ...(prev ?? {}), ...(next ?? {}) };
}

export function useUserStatsV2(uid?: string | null) {
  const [loading, setLoading] = useState(true);
  const [extending, setExtending] = useState(false);
  const [summaries, setSummaries] = useState<
    Partial<Record<"7d" | "30d" | "all", SummaryForCardsV2>> | null
  >(null);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [dailyTrend, setDailyTrend] = useState<ProfileDailyTrendRow[] | null>(
    null
  );

  const preloadRange = useCallback(
    async (range: "7d" | "30d" | "all") => {
      if (!uid) return;
      if (range === "7d") return;

      const now = Date.now();
      const cached = statsCache.get(uid);
      if (cached && now - cached.at < CACHE_TTL_MS && cached.summaries[range]) {
        setSummaries((p) =>
          mergeSummaries(p, { [range]: cached.summaries[range] })
        );
        return;
      }

      const parts = range === "30d" ? "30d" : "all";
      setExtending(true);
      try {
        const qs = new URLSearchParams({ uid, parts });
        const res = await fetch(`/api/profile/user-stats?${qs.toString()}`, {
          method: "GET",
        });
        const json = await res.json();
        if (!res.ok || !json?.ok) {
          throw new Error(json?.error ?? "failed to fetch profile stats");
        }

        const nextSummaries =
          (json?.summaries as Partial<
            Record<"7d" | "30d" | "all", SummaryForCardsV2>
          >) ?? {};
        const nextStats = (json?.stats as Record<string, unknown>) ?? null;
        const nextTrend = Array.isArray(json?.dailyTrend)
          ? (json.dailyTrend as ProfileDailyTrendRow[])
          : null;

        setSummaries((p) => mergeSummaries(p, nextSummaries));
        if (nextStats) setStats(nextStats);
        if (nextTrend && nextTrend.length > 0) setDailyTrend(nextTrend);

        const prevCache = statsCache.get(uid);
        statsCache.set(uid, {
          at: Date.now(),
          summaries: mergeSummaries(prevCache?.summaries ?? null, nextSummaries),
          stats: nextStats ?? prevCache?.stats ?? null,
          dailyTrend: nextTrend ?? prevCache?.dailyTrend ?? null,
        });
      } catch {
        // keep previous values
      } finally {
        setExtending(false);
      }
    },
    [uid]
  );

  useEffect(() => {
    let cancelled = false;

    if (!uid) {
      setSummaries(null);
      setStats(null);
      setDailyTrend(null);
      setLoading(false);
      setExtending(false);
      return;
    }

    const safeUid = uid;

    async function run() {
      const cached = statsCache.get(safeUid);
      const now = Date.now();
      if (
        cached &&
        now - cached.at < CACHE_TTL_MS &&
        cached.summaries["7d"] &&
        cached.stats != null
      ) {
        if (cancelled) return;
        setStats(cached.stats);
        setSummaries(cached.summaries);
        setDailyTrend(cached.dailyTrend ?? null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const qs = new URLSearchParams({ uid: safeUid, parts: PARTS_INITIAL });
        const res = await fetch(`/api/profile/user-stats?${qs.toString()}`, {
          method: "GET",
        });
        const json = await res.json();

        if (!res.ok || !json?.ok) {
          throw new Error(json?.error ?? "failed to fetch profile stats");
        }

        if (cancelled) return;

        const nextStats = (json?.stats as Record<string, unknown>) ?? null;
        const nextSummaries =
          (json?.summaries as Partial<
            Record<"7d" | "30d" | "all", SummaryForCardsV2>
          >) ?? {};
        const nextDailyTrend = Array.isArray(json?.dailyTrend)
          ? (json.dailyTrend as ProfileDailyTrendRow[])
          : null;

        statsCache.set(safeUid, {
          at: Date.now(),
          summaries: nextSummaries,
          stats: nextStats,
          dailyTrend: nextDailyTrend,
        });

        setStats(nextStats);
        setSummaries(nextSummaries);
        setDailyTrend(nextDailyTrend);
      } catch {
        if (cancelled) return;
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [uid]);

  const statsLoading = loading || extending;

  return {
    loading,
    extending,
    summaries,
    stats,
    dailyTrend,
    statsLoading,
    preloadRange,
  };
}
