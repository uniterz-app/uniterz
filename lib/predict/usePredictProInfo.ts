"use client";

import { useMemo } from "react";
import type { MatchCardProps } from "@/app/component/games/MatchCard";
import { useUserPlan } from "@/hooks/useUserPlan";
import type { Language } from "@/lib/i18n/language";
import {
  buildPredictProInfo,
  type PredictProInfo,
} from "@/lib/predict/buildPredictProInfo";
import { useUserTournamentPredictionStats } from "@/lib/predict/useUserTournamentPredictionStats";
import { dateKeyJST } from "@/lib/rankings/rankSnapshotDate";
import { useMonthlyGlobalStatsV2 } from "@/lib/stats/useMonthlyGlobalStatsV2";

export function usePredictProInfo(input: {
  uid?: string | null;
  game: MatchCardProps;
  language: Language;
  homeRecord?: MatchCardProps["homeRecord"];
  awayRecord?: MatchCardProps["awayRecord"];
  enabled?: boolean;
}): { data: PredictProInfo | null; isPro: boolean; loading: boolean } {
  const { isPro, loading: planLoading } = useUserPlan(input.uid ?? undefined);
  const active = input.enabled !== false && isPro && Boolean(input.uid);

  const { stats, loading: statsLoading } = useUserTournamentPredictionStats({
    uid: active ? input.uid : null,
    league: input.game.league,
    enabled: active,
  });

  const monthKey = dateKeyJST().slice(0, 7);
  const { data: globalStats, loading: globalLoading } = useMonthlyGlobalStatsV2(
    active ? monthKey : undefined
  );

  const data = useMemo(() => {
    if (!active || !input.uid) return null;
    if (planLoading || statsLoading) return null;

    return buildPredictProInfo({
      homeTeamId: input.game.home?.teamId,
      awayTeamId: input.game.away?.teamId,
      homeTeamName: input.game.home?.name ?? "Home",
      awayTeamName: input.game.away?.name ?? "Away",
      homeRecord: input.homeRecord,
      awayRecord: input.awayRecord,
      stats,
      globalAvgWinRate: globalStats?.avg?.winRate ?? null,
    });
  }, [
    active,
    globalStats?.avg?.winRate,
    input.awayRecord,
    input.game.away?.name,
    input.game.away?.teamId,
    input.game.home?.name,
    input.game.home?.teamId,
    input.homeRecord,
    input.uid,
    planLoading,
    stats,
    statsLoading,
  ]);

  return {
    data,
    isPro,
    loading: planLoading || (active && (statsLoading || globalLoading)),
  };
}
