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

export type SummaryRanksV2 = {
  totalPrecision: number | null;
  totalUpset: number | null;
  totalPoints: number | null;
};

const CACHE_TTL_MS = 5 * 60 * 1000;

/** 初回は stats + playoffs 集計 + チャート用 trend を取得 */
const PARTS_INITIAL = "stats,phase,trend";

type CacheEntry = {
  at: number;
  summary: SummaryForCardsV2 | null;
  summaryRanks: SummaryRanksV2 | null;
  stats: Record<string, unknown> | null;
  dailyTrend: ProfileDailyTrendRow[] | null;
};

const statsCache = new Map<string, CacheEntry>();

export function useUserStatsV2(uid?: string | null) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SummaryForCardsV2 | null>(null);
  const [summaryRanks, setSummaryRanks] = useState<SummaryRanksV2 | null>(null);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [dailyTrend, setDailyTrend] = useState<ProfileDailyTrendRow[] | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;

    if (!uid) {
      setSummary(null);
      setSummaryRanks(null);
      setStats(null);
      setDailyTrend(null);
      setLoading(false);
      return;
    }

    const safeUid = uid;

    async function run() {
      const cached = statsCache.get(safeUid);
      const now = Date.now();
      if (
        cached &&
        now - cached.at < CACHE_TTL_MS &&
        cached.summary != null &&
        cached.stats != null
      ) {
        if (cancelled) return;
        setStats(cached.stats);
        setSummary(cached.summary);
        setSummaryRanks(cached.summaryRanks ?? null);
        setDailyTrend(cached.dailyTrend ?? null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const qs = new URLSearchParams({
          uid: safeUid,
          parts: PARTS_INITIAL,
          phase: "playoffs",
        });
        const res = await fetch(`/api/profile/user-stats?${qs.toString()}`, {
          method: "GET",
        });
        const json = await res.json();

        if (!res.ok || !json?.ok) {
          throw new Error(json?.error ?? "failed to fetch profile stats");
        }

        if (cancelled) return;

        const nextStats = (json?.stats as Record<string, unknown>) ?? null;
        const nextSummary = (json?.summary as SummaryForCardsV2) ?? null;
        const nextSummaryRanks = (json?.summaryRanks as SummaryRanksV2) ?? null;
        const nextDailyTrend = Array.isArray(json?.dailyTrend)
          ? (json.dailyTrend as ProfileDailyTrendRow[])
          : null;

        statsCache.set(safeUid, {
          at: Date.now(),
          summary: nextSummary,
          summaryRanks: nextSummaryRanks,
          stats: nextStats,
          dailyTrend: nextDailyTrend,
        });

        setStats(nextStats);
        setSummary(nextSummary);
        setSummaryRanks(nextSummaryRanks);
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

  const statsLoading = loading;

  return {
    loading,
    extending: false,
    summary,
    summaryRanks,
    stats,
    dailyTrend,
    statsLoading,
  };
}
