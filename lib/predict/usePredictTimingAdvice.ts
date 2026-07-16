"use client";

import { useMemo } from "react";
import type { MatchCardProps } from "@/app/component/games/MatchCard";
import { useUserPlan } from "@/hooks/useUserPlan";
import type { Language } from "@/lib/i18n/language";
import {
  buildPredictTimingAdvice,
  type PredictTimingAdvice,
} from "@/lib/predict/buildPredictTimingAdvice";
import { dateKeyJST } from "@/lib/rankings/rankSnapshotDate";
import { useUserMonthlyStatsV2 } from "@/lib/stats/useUserMonthlyStatsV2";
import { useMonthlyGlobalStatsV2 } from "@/lib/stats/useMonthlyGlobalStatsV2";

export function usePredictTimingAdvice(input: {
  uid?: string | null;
  game: MatchCardProps;
  language: Language;
  isKnockout: boolean;
  enabled?: boolean;
}): PredictTimingAdvice | null {
  const { isPro, loading: planLoading } = useUserPlan(input.uid ?? undefined);
  const monthKey = dateKeyJST().slice(0, 7);
  const { stats, loading: statsLoading } = useUserMonthlyStatsV2(
    input.enabled !== false && isPro ? input.uid : null,
    monthKey
  );
  const { data: globalStats, loading: globalLoading } = useMonthlyGlobalStatsV2(
    input.enabled !== false && isPro ? monthKey : undefined
  );

  return useMemo(() => {
    if (input.enabled === false || !input.uid || !isPro) return null;
    if (planLoading || statsLoading || globalLoading) return null;

    return buildPredictTimingAdvice({
      language: input.language,
      homeTeamId: input.game.home?.teamId,
      awayTeamId: input.game.away?.teamId,
      homeTeamName: input.game.home?.name ?? "Home",
      awayTeamName: input.game.away?.name ?? "Away",
      isKnockout: input.isKnockout,
      monthlyStats: stats,
      globalAvgWinRate: globalStats?.avg?.winRate ?? null,
      shadowCompareRows: null,
    });
  }, [
    globalLoading,
    globalStats?.avg?.winRate,
    input.enabled,
    input.game.away?.name,
    input.game.away?.teamId,
    input.game.home?.name,
    input.game.home?.teamId,
    input.isKnockout,
    input.language,
    input.uid,
    isPro,
    planLoading,
    stats,
    statsLoading,
  ]);
}
