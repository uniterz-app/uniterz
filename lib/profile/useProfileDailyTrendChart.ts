// lib/profile/useProfileDailyTrendChart.ts
"use client";

import { useMemo } from "react";
import { useUserStatsDailyTrend } from "@/lib/stats/useUserStatsDailyTrend";
import type { ProfileDailyTrendRow } from "@/lib/profile/profileDailyTrendRow";

export type ProfileDailyTrendChartRow = ProfileDailyTrendRow;

export function useProfileDailyTrendChart(
  targetUid: string | null,
  options?: {
    enabled?: boolean;
    /** user-stats API から渡すときは Firestore の日次取得をスキップ */
    seedRows?: ProfileDailyTrendRow[] | null;
  }
) {
  const enabled = options?.enabled ?? true;
  const seedRows = options?.seedRows;
  const useSeed =
    Array.isArray(seedRows) &&
    seedRows.length > 0 &&
    enabled;

  const uidForDailyTrend =
    useSeed || !enabled ? undefined : targetUid ?? undefined;

  const fetchEnabled = enabled && !useSeed && !!targetUid;

  const {
    data: dailyTrend,
    loading,
  } = useUserStatsDailyTrend(uidForDailyTrend, fetchEnabled);

  const sourceRows = useSeed ? seedRows! : (dailyTrend ?? []);

  const chartData: ProfileDailyTrendChartRow[] = useMemo(() => {
    return sourceRows.map((row) => ({
      ...row,
      date: row.date ?? "",
      posts: row.posts ?? 0,
      wins: row.wins ?? 0,
      pointsV3: row.pointsV3 ?? 0,
      scorePrecision: row.scorePrecision ?? 0,
      upsetPoints: row.upsetPoints ?? 0,
      winRate: row.winRate ?? (row.posts > 0 ? row.wins / row.posts : 0),
    }));
  }, [sourceRows]);

  return {
    chartData,
    loading: useSeed ? false : loading,
    rawDailyTrend: sourceRows,
  };
}
