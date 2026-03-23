// app/lib/profile/useProfileDailyTrend.ts
"use client";

import { useMemo } from "react";
import { useUserDailyTrendV2 } from "@/lib/stats/useUserDailyTrendV2";

export type ProfileDailyTrendChartRow = {
  date: string;
  posts: number;
  wins: number;
  pointsV3: number;
  scorePrecision: number;
  upsetPoints: number;
};

export function useProfileDailyTrend(targetUid: string | null) {
  const uidForDailyTrend = targetUid ?? undefined;

  const {
    data: dailyTrend,
    loading,
  } = useUserDailyTrendV2(uidForDailyTrend);

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