/**
 * Web `useGameMarketDistribution` 相当 — posts 全件読みはしない。
 */
import { useEffect, useMemo, useState } from "react";
import type { League } from "../../../../../lib/leagues";
import {
  computeGameMarketPcts,
  isSoccerMarketLeague,
  type GamePredictionCounts,
  type MarketBiasFallback,
} from "../../../../../lib/predict/gameMarketDistribution";

const EMPTY_COUNTS: GamePredictionCounts = {
  homeCount: 0,
  awayCount: 0,
  drawCount: 0,
};

export function useGameMarketDistributionNative(
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

  const market = useMemo(
    () =>
      computeGameMarketPcts(EMPTY_COUNTS, isSoccer, fallbackMarketBias, {
        excludeDraw,
      }),
    [fallbackMarketBias, isSoccer, excludeDraw]
  );

  return {
    loading,
    isSoccer,
    counts: EMPTY_COUNTS,
    ...market,
  };
}
