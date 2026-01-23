"use client";

import { useState } from "react";
import ProAnalysisView from "@/app/component/pro/analysis/ProAnalysisView";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserMonthlyStatsV2 } from "@/lib/stats/useUserMonthlyStatsV2";
import { useMonthlyGlobalStatsV2 } from "@/lib/stats/useMonthlyGlobalStatsV2";
import { useUserMonthlyTrendV2 } from "@/lib/stats/useUserMonthlyTrendV2";  // 追加
import { TEAM_NAME_BY_ID } from "@/lib/team-name-by-id";
import { useUserPlan } from "@/hooks/useUserPlan";
import ProPreview from "@/app/component/pro/analysis/ProPreview";

const normalizeTeams = (arr: any[]) =>
  arr.map(t => ({
    teamId: t.teamId,
    teamName: TEAM_NAME_BY_ID[t.teamId] ?? t.teamId,
    games: t.posts,
    winRate: t.winRate,
  }));

const MONTHS = ["2025-12"]; // まずは1ヶ月でOK（あとで動的に）

export default function ProAnalysisPage() {
  const { fUser, status } = useFirebaseUser();
  const uid = fUser?.uid;
  const { plan, loading: planLoading } = useUserPlan(uid);

  const [month, setMonth] = useState(MONTHS[0]);
  

  const [activeTab, setActiveTab] =
  useState<"overview" | "pro">("overview");

  const {
    stats,
    loading: userLoading,
  } = useUserMonthlyStatsV2(uid, month);

  const {
    data: global,
    loading: globalLoading,
  } = useMonthlyGlobalStatsV2(month);

  const { data: monthlyTrend, loading: monthlyLoading } = useUserMonthlyTrendV2(uid);

  if (
  status !== "ready" ||
  planLoading ||
  userLoading ||
  globalLoading ||
  monthlyLoading
) {
  return <div className="p-4 text-white/60">loading...</div>;
}

// ② Pro ガード（最重要）
if (!uid || plan === "free") {
  return <ProPreview />;
}

  if (!stats || !global) {
    return <div className="p-4 text-white/60">データがありません</div>;
  }

  // Upset の母数が 5 以上あるか
const upsetValid =
  (stats.raw.upsetOpportunityCount ?? 0) >= 5;

  /* =========================
   * 月間パフォーマンス比較
   * ========================= */
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
    self: stats.raw.accuracy,          // ← 個人
    avg: global.avg.accuracy,          // ← 全体平均
    top10: global.top10.accuracy,      // ← 上位10%
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
      months={MONTHS}
      onChangeMonth={setMonth}
      radar={stats.radar10}
      analysisTypeId={stats.analysisTypeId}
      percentiles={stats.percentiles}
      comparisonRows={comparisonRows}
      comparisonUserCount={global.users}
      comparisonTop10UserCount={global.top10EligibleUsers}
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
      monthlyTrend={monthlyTrend}  // 追加
    />
  );
}
