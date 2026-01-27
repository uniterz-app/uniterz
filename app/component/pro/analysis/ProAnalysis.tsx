"use client";

import { useState, useEffect } from "react";
import ProAnalysisView from "@/app/component/pro/analysis/ProAnalysisView";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserMonthlyStatsV2 } from "@/lib/stats/useUserMonthlyStatsV2";
import { useMonthlyGlobalStatsV2 } from "@/lib/stats/useMonthlyGlobalStatsV2";
import { useUserMonthlyTrendV2 } from "@/lib/stats/useUserMonthlyTrendV2";
import { TEAM_NAME_BY_ID } from "@/lib/team-name-by-id";
import { useUserPlan } from "@/hooks/useUserPlan";
import ProPreview from "@/app/component/pro/analysis/ProPreview";
import { useUserMonthlyListV2 } from "@/lib/stats/useUserMonthlyListV2";

const normalizeTeams = (arr: any[]) =>
  arr.map((t) => ({
    teamId: t.teamId,
    teamName: TEAM_NAME_BY_ID[t.teamId] ?? t.teamId,
    games: t.posts,
    winRate: t.winRate,
  }));

export default function ProAnalysisPage() {
  const { fUser, status } = useFirebaseUser();
  const uid = fUser?.uid;
  const { plan, loading: planLoading } = useUserPlan(uid);

  const { months, loading: monthsLoading } = useUserMonthlyListV2(uid);

  const [month, setMonth] = useState<string | null>(null);

  useEffect(() => {
    if (!month && months.length > 0) {
      setMonth(months[months.length - 1]);
    }
  }, [months, month]);

  const currentMonthIndex = month ? months.indexOf(month) : -1;
  const prevMonth =
    currentMonthIndex > 0 ? months[currentMonthIndex - 1] : undefined;

  const {
    stats,
    prevStats,
    loading: userLoading,
  } = useUserMonthlyStatsV2(uid, month ?? undefined, prevMonth);

  const {
    data: global,
    loading: globalLoading,
  } = useMonthlyGlobalStatsV2(month ?? undefined);

  const { data: monthlyTrend, loading: monthlyLoading } =
    useUserMonthlyTrendV2(uid);

  if (
    status !== "ready" ||
    planLoading ||
    monthsLoading ||
    userLoading ||
    globalLoading ||
    monthlyLoading ||
    !month
  ) {
    return <div className="p-4 text-white/60">loading...</div>;
  }

  if (!uid || plan === "free") {
    return <ProPreview />;
  }

  if (!stats || !global) {
    return <div className="p-4 text-white/60">データがありません</div>;
  }

  const comparisonRows = [
    {
      label: "投稿数",
      format: (v: number) => `${Math.round(v)}`,
      self: stats.raw.posts,
      avg: global.avg.volume,
      top10: global.top10.volume,
    },
    {
      label: "勝率",
      format: (v: number) => `${Math.round(v * 100)}%`,
      self: stats.raw.winRate,
      avg: global.avg.winRate,
      top10: global.top10.winRate,
    },
    {
      label: "予測精度",
      format: (v: number) => `${Math.round(v * 100)}%`,
      self: stats.raw.accuracy,
      avg: global.avg.accuracy,
      top10: global.top10.accuracy,
    },
    {
      label: "スコア精度",
      format: (v: number) => v.toFixed(1),
      self: stats.raw.avgPrecision,
      avg: global.avg.precision,
      top10: global.top10.precision,
    },
    {
      label: "Upset指数",
      format: (v: number) => v.toFixed(2),
      self: stats.raw.avgUpset,
      avg: global.avg.upset,
      top10: global.top10.upset,
    },
  ];

  return (
    <ProAnalysisView
      month={month}
      months={months}
      onChangeMonth={setMonth}
      radar={stats.radar10}
      analysisTypeId={stats.analysisTypeId}
      percentiles={stats.percentiles}
      comparisonRows={comparisonRows}
      comparisonUserCount={global.users}
      comparisonTop10UserCount={global.top10EligibleUsers}
      upset={{
        nba: {
          totalGames: global.raw.totalGames,
          upsetGames: global.raw.upsetGames,
        },
        user: {
          analyzedGames: stats.raw.posts,
          upsetGames: stats.upset.games,
          upsetHitRate: stats.upset.hitRate,
          shareOfAllUpsets: stats.upset.shareOfAll,
        },
      }}
      styleMapPoints={[
        {
          homeAwayBias: stats.style.homeAwayBias,
          marketBias: stats.style.marketBias,
          winRate: stats.raw.winRate,
          key: month,
        },
      ]}
      streak={{
        maxWin: stats.streak.maxWin,
        maxLose: stats.streak.maxLose,
      }}
      prevStreak={prevStats?.streak}
      homeAway={{
        homeRate: stats.homeAway.home.winRate,
        awayRate: stats.homeAway.away.winRate,
        homeShare: stats.homeAway.home.share,
        awayShare: stats.homeAway.away.share,
      }}
      marketBias={{
        favorableWinRate: stats.marketBias.favorable.winRate,
        contrarianWinRate: stats.marketBias.contrarian.winRate,
        favorableShare: stats.marketBias.favorable.share,
        contrarianShare: stats.marketBias.contrarian.share,
      }}
      teamAffinity={{
        strong: normalizeTeams(stats.teamStats.strong),
        weak: normalizeTeams(stats.teamStats.weak),
      }}
      monthlyTrend={monthlyTrend}
    />
  );
}
