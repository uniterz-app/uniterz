// app/component/profile/useUserStatsV2.ts
"use client";

import { useEffect, useState } from "react";
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

const CACHE_TTL_MS = 45_000;

type CacheEntry = {
  at: number;
  summaries: Record<"7d" | "30d" | "all", SummaryForCardsV2> | null;
  stats: Record<string, unknown> | null;
  dailyTrend: ProfileDailyTrendRow[] | null;
};

const statsCache = new Map<string, CacheEntry>();

export function useUserStatsV2(uid?: string | null) {
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState<
    Record<"7d" | "30d" | "all", SummaryForCardsV2> | null
  >(null);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [dailyTrend, setDailyTrend] = useState<ProfileDailyTrendRow[] | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;

    if (!uid) {
      setSummaries(null);
      setStats(null);
      setDailyTrend(null);
      setLoading(false);
      return;
    }

    const safeUid = uid;

    async function run() {
      const cached = statsCache.get(safeUid);
      const now = Date.now();
      if (cached && now - cached.at < CACHE_TTL_MS) {
        if (cancelled) return;
        setStats(cached.stats);
        setSummaries(cached.summaries);
        setDailyTrend(cached.dailyTrend ?? null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const qs = new URLSearchParams({ uid: safeUid });
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
          (json?.summaries as Record<"7d" | "30d" | "all", SummaryForCardsV2>) ??
          null;
        const nextDailyTrend = Array.isArray(json?.dailyTrend)
          ? (json.dailyTrend as ProfileDailyTrendRow[])
          : null;

        statsCache.set(safeUid, {
          at: Date.now(),
          stats: nextStats,
          summaries: nextSummaries,
          dailyTrend: nextDailyTrend,
        });

        setStats(nextStats);
        setSummaries(nextSummaries);
        setDailyTrend(nextDailyTrend);
      } catch {
        if (cancelled) return;
        // Keep previous values on transient fetch errors.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [uid]);

  return { loading, summaries, stats, dailyTrend };
}
