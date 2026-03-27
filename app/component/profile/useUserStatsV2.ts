// app/component/profile/useUserStatsV2.ts
"use client";

import { useEffect, useState } from "react";

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

  // Upset補助
  upsetChanceCount: number;
  upsetHitCount: number;
};

export function useUserStatsV2(uid?: string | null) {
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState<
    Record<"7d" | "30d" | "all", SummaryForCardsV2> | null
  >(null);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!uid) {
      setSummaries(null);
      setStats(null);
      setLoading(false);
      return;
    }

    const safeUid = uid;

    async function run() {
      try {
        setLoading(true);
        const qs = new URLSearchParams({ uid: safeUid });
        const res = await fetch(`/api/profile/user-stats?${qs.toString()}`, {
          method: "GET",
          cache: "no-store",
        });
        const json = await res.json();

        if (!res.ok || !json?.ok) {
          throw new Error(json?.error ?? "failed to fetch profile stats");
        }

        if (cancelled) return;

        setStats((json?.stats as Record<string, unknown>) ?? null);
        setSummaries(
          (json?.summaries as Record<"7d" | "30d" | "all", SummaryForCardsV2>) ??
            null
        );
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

  return { loading, summaries, stats };
}
