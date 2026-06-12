"use client";

import { useState, useEffect } from "react";
import CandleChartLoader from "@/app/component/common/CandleChartLoader";
import ProAnalysisView from "@/app/component/pro/analysis/ProAnalysisView";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserMonthlyStatsV2 } from "@/lib/stats/useUserMonthlyStatsV2";
import { useMonthlyGlobalStatsV2 } from "@/lib/stats/useMonthlyGlobalStatsV2";
import { TEAM_NAME_BY_ID } from "@/lib/team-name-by-id";
import { useUserPlan } from "@/hooks/useUserPlan";
import ProPreview from "@/app/component/pro/analysis/ProPreview";
import { useUserMonthlyListV2 } from "@/lib/stats/useUserMonthlyListV2";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import {
  score10ToLevel,
  type RadarAxisLevels,
} from "@/app/component/pro/analysis/radarLevelUtils";
import type { AnalysisTypeId } from "@/shared/analysis/types";

const isLevel = (v: unknown): v is "S" | "M" | "W" =>
  v === "S" || v === "M" || v === "W";

function radarAxisLevelsFromStats(stats: any): RadarAxisLevels {
  const al = stats?.analysisLevels;
  const r = stats?.radar10;
  if (
    al &&
    isLevel(al.winRate) &&
    isLevel(al.precision) &&
    isLevel(al.upset) &&
    isLevel(al.volume) &&
    isLevel(al.streak)
  ) {
    return {
      winRate: al.winRate,
      precision: al.precision,
      upset: al.upset,
      volume: al.volume,
      streak: al.streak,
    };
  }
  return {
    winRate: score10ToLevel(r?.winRate ?? 0),
    precision: score10ToLevel(r?.precision ?? 0),
    upset: score10ToLevel(r?.upset ?? 0),
    volume: score10ToLevel(r?.volume ?? 0),
    streak: score10ToLevel(r?.streak ?? 0),
  };
}

const normalizeTeams = (arr: any[]) =>
  arr.map((t) => ({
    teamId: t.teamId,
    teamName: TEAM_NAME_BY_ID[t.teamId] ?? t.teamId,
    games: t.posts,
    winRate: t.winRate,
  }));

function extractPointsSumBenchmarks(data: any | null): {
  mean: number;
  median: number;
  p90: number;
  max: number;
} | null {
  const pb = data?.pointsSumV3Benchmarks as
    | { mean: number; median: number; p90: number; max: number }
    | undefined;
  if (
    pb != null &&
    Number.isFinite(pb.mean) &&
    Number.isFinite(pb.median) &&
    Number.isFinite(pb.p90) &&
    Number.isFinite(pb.max)
  ) {
    return { mean: pb.mean, median: pb.median, p90: pb.p90, max: pb.max };
  }
  return null;
}

/** Firestore に style が無い場合は homeAway / market 件数から近似 */
function computeStyleBiases(stats: any): {
  homeAwayBias: number;
  marketBias: number;
} {
  if (
    stats?.style &&
    typeof stats.style.homeAwayBias === "number" &&
    typeof stats.style.marketBias === "number"
  ) {
    return {
      homeAwayBias: stats.style.homeAwayBias,
      marketBias: stats.style.marketBias,
    };
  }
  const h = stats?.homeAway?.home?.posts ?? 0;
  const a = stats?.homeAway?.away?.posts ?? 0;
  const tot = h + a;
  const homeAwayBias = tot > 0 ? (h - a) / tot : 0;
  const fav = stats?.marketBias?.favoritePickCount ?? 0;
  const und = stats?.marketBias?.underdogPickCount ?? 0;
  const mt = fav + und;
  const favRate = mt > 0 ? fav / mt : 0.5;
  const marketBias = (0.5 - favRate) * 2;
  return { homeAwayBias, marketBias };
}

export default function ProAnalysisPage() {
  const { fUser, status } = useFirebaseUser();
  const uid = fUser?.uid;
  const { language } = useUserLanguage(uid);
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
  const prevPrevMonth =
    currentMonthIndex > 1 ? months[currentMonthIndex - 2] : undefined;

  const {
    stats,
    prevStats,
    prevPrevStats,
    loading: userLoading,
  } = useUserMonthlyStatsV2(
    uid,
    month ?? undefined,
    prevMonth,
    prevPrevMonth
  );

  const { data: globalCurrentMonth, loading: globalLoading } =
    useMonthlyGlobalStatsV2(month ?? undefined);

  const prevMonthSummary =
    prevMonth && prevStats
      ? {
          monthKey: prevMonth,
          stats: prevStats,
          olderStats: prevPrevStats ?? null,
        }
      : null;

  const { data: globalPrevMonth, loading: globalPrevMonthLoading } =
    useMonthlyGlobalStatsV2(prevMonthSummary?.monthKey);

  if (
    status !== "ready" ||
    planLoading ||
    monthsLoading ||
    userLoading ||
    globalLoading ||
    (prevMonthSummary != null && globalPrevMonthLoading) ||
    !month
  ) {
    return (
      <div className="flex justify-center p-4">
        <CandleChartLoader />
      </div>
    );
  }

  if (!uid || plan === "free") {
    return <ProPreview />;
  }

  /** 先月サマリーが無い場合は選択月の指標を同じカードで出す（初月など） */
  const summaryForTopCard =
    prevMonthSummary ?? {
      monthKey: month,
      stats: stats ?? {},
      olderStats: prevStats ?? null,
    };

  const noMonthlyData = !stats;

  const styleBiases = stats ? computeStyleBiases(stats) : { homeAwayBias: 0, marketBias: 0 };

  const hPosts = stats?.homeAway?.home?.posts ?? 0;
  const aPosts = stats?.homeAway?.away?.posts ?? 0;
  const pickTot = hPosts + aPosts;
  const homeShare = pickTot > 0 ? hPosts / pickTot : 0.5;
  const awayShare = pickTot > 0 ? aPosts / pickTot : 0.5;

  const favCt = stats?.marketBias?.favoritePickCount ?? 0;
  const undCt = stats?.marketBias?.underdogPickCount ?? 0;
  const mTot = favCt + undCt;
  const favorableShare = mTot > 0 ? favCt / mTot : 0.5;
  const contrarianShare = mTot > 0 ? undCt / mTot : 0.5;

  const radarPayload = stats
    ? {
        ...stats.radar10,
        upsetValid:
          typeof stats.upsetValid === "boolean"
            ? stats.upsetValid
            : (stats.raw?.upsetOpportunity ?? 0) >= 5,
        radarEligible:
          typeof stats.radarEligible === "boolean"
            ? stats.radarEligible
            : (stats.raw?.posts ?? 0) >= 10,
      }
    : {
        winRate: 0,
        precision: 0,
        upset: 0,
        volume: 0,
        streak: 0,
        upsetValid: false,
        radarEligible: false,
      };

  const prevMonthPointsSumBenchmarks = prevMonthSummary
    ? extractPointsSumBenchmarks(globalPrevMonth)
    : extractPointsSumBenchmarks(globalCurrentMonth);

  return (
    <ProAnalysisView
      month={month}
      months={months}
      onChangeMonth={setMonth}
      language={language}
      prevMonthSummary={summaryForTopCard}
      prevMonthPointsSumBenchmarks={prevMonthPointsSumBenchmarks}
      noMonthlyData={noMonthlyData}
      radar={radarPayload}
      radarAxisLevels={
        stats && radarPayload.radarEligible !== false
          ? radarAxisLevelsFromStats(stats)
          : null
      }
      analysisTypeId={(stats?.analysisTypeId as AnalysisTypeId) ?? "PROSPECT"}
      styleMapPoints={[
        {
          homeAwayBias: styleBiases.homeAwayBias,
          marketBias: styleBiases.marketBias,
          winRate: stats?.raw?.winRate ?? 0,
          key: month,
        },
      ]}
      streak={{
        maxWin: stats?.streak?.maxWin ?? 0,
        maxLose: stats?.streak?.maxLose ?? 0,
      }}
      prevStreak={prevStats?.streak}
      homeAway={{
        homeRate: stats?.homeAway?.home?.winRate ?? 0,
        awayRate: stats?.homeAway?.away?.winRate ?? 0,
        homeShare,
        awayShare,
      }}
      marketBias={{
        favorableWinRate: stats?.marketBias?.favoriteWinRate ?? 0,
        contrarianWinRate: stats?.marketBias?.underdogWinRate ?? 0,
        favorableShare,
        contrarianShare,
      }}
      teamAffinity={{
        strong: normalizeTeams(stats?.teamStats?.strong ?? []),
        weak: normalizeTeams(stats?.teamStats?.weak ?? []),
      }}
    />
  );
}