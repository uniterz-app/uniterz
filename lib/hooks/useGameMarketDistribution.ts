"use client";

import { useEffect, useMemo, useState } from "react";
import type { League } from "@/lib/leagues";
import {
  computeGameMarketPcts,
  isSoccerMarketLeague,
  type GamePredictionCounts,
  type MarketBiasFallback,
} from "@/lib/predict/gameMarketDistribution";

const EMPTY_COUNTS: GamePredictionCounts = {
  homeCount: 0,
  awayCount: 0,
  drawCount: 0,
};

/**
 * posts 全件 getDocs は廃止。
 * フォールバック bias があるときだけ％を出し、無ければ空。
 */
export function useGameMarketDistribution(
  gameId: string | null | undefined,
  league: League | string,
  fallbackMarketBias?: MarketBiasFallback | null,
  options?: { excludeDraw?: boolean }
) {
  const [loading, setLoading] = useState(Boolean(gameId));
  const excludeDraw = options?.excludeDraw ?? false;
  const isSoccer = isSoccerMarketLeague(league);

  useEffect(() => {
    setLoading(false);
  }, [gameId]);

  const counts = EMPTY_COUNTS;
  const market = useMemo(
    () =>
      computeGameMarketPcts(counts, isSoccer, fallbackMarketBias, {
        excludeDraw,
      }),
    [counts, fallbackMarketBias, isSoccer, excludeDraw]
  );

  return {
    loading,
    isSoccer,
    counts,
    ...market,
  };
}
