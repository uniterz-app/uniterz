"use client";

import type { MatchCardProps } from "@/app/component/games/MatchCard";
import type { Language } from "@/lib/i18n/language";
import type { PredictTimingAdvice } from "@/lib/predict/buildPredictTimingAdvice";

export function usePredictTimingAdvice(input: {
  uid?: string | null;
  game: MatchCardProps;
  language: Language;
  isKnockout: boolean;
  enabled?: boolean;
}): PredictTimingAdvice | null {
  // チーム別月次実績は旧 user_stats_v2_monthly にしか無いため、旧 cron 停止中は助言を出さない。
  void input;
  return null;
}
