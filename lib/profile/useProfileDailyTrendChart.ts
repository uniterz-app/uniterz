// lib/profile/useProfileDailyTrendChart.ts
"use client";

import { useMemo } from "react";
import { useUserStatsDailyTrend } from "@/lib/stats/useUserStatsDailyTrend";
import type { ProfileDailyTrendRow } from "@/lib/profile/profileDailyTrendRow";
import { resolveProfileDailyTrendContext } from "@/lib/profile/userStatsV2ProfileRollup";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import type { WcRankingStage } from "@/lib/rankings/wcRankingStage";

export type ProfileDailyTrendChartRow = ProfileDailyTrendRow;

export function useProfileDailyTrendChart(
  targetUid: string | null,
  options?: {
    enabled?: boolean;
    /** user-stats API から渡すときは Firestore の日次取得をスキップ */
    seedRows?: ProfileDailyTrendRow[] | null;
    rankingLeague?: RankingLeagueSource;
    wcStage?: WcRankingStage;
  }
) {
  const enabled = options?.enabled ?? true;
  const trendCtx = resolveProfileDailyTrendContext(
    options?.rankingLeague ?? "nba",
    options?.wcStage
  );
  const seedRows = options?.seedRows;
  /** user-stats API は league/wcStage 済みの rows を返すため、seed を優先する */
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
  } = useUserStatsDailyTrend(uidForDailyTrend, fetchEnabled, {
    rankingLeague: trendCtx.rankingLeague,
    wcStage: trendCtx.wcStage,
  });

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
