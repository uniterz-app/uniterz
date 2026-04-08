// lib/profile/useProfileDailyTrendChart.ts
"use client";

import { useMemo } from "react";
import { useUserStatsDailyTrend } from "@/lib/stats/useUserStatsDailyTrend";

export type ProfileDailyTrendChartRow = {
  date: string;
  posts: number;
  wins: number;
  pointsV3: number;
  scorePrecision: number;
  upsetPoints: number;
};

export function useProfileDailyTrendChart(targetUid: string | null) {
  const uidForDailyTrend = targetUid ?? undefined;

  const {
    data: dailyTrend,
    loading,
  } = useUserStatsDailyTrend(uidForDailyTrend);

  const chartData: ProfileDailyTrendChartRow[] = useMemo(() => {
    return (dailyTrend ?? []).map((row: any) => ({
      date: row.date ?? row.dateKey ?? "",
      posts: row.posts ?? 0,
      wins: row.wins ?? row.hitCount ?? 0,
      pointsV3: row.pointsV3 ?? row.totalPoints ?? row.pointsSumV3 ?? 0,
      scorePrecision: row.scorePrecision ?? row.scorePrecisionSum ?? 0,
      upsetPoints: row.upsetPoints ?? row.upsetPointsSum ?? 0,
    }));
  }, [dailyTrend]);

  return {
    chartData,
    loading,
    rawDailyTrend: dailyTrend ?? [],
  };
}