"use client";

import { useEffect, useMemo, useState } from "react";
import type { League } from "@/lib/leagues";
import {
  computeGameMarketPcts,
  fetchGamePredictionCounts,
  isSoccerMarketLeague,
  type GamePredictionCounts,
  type MarketBiasFallback,
} from "@/lib/predict/gameMarketDistribution";

const EMPTY_COUNTS: GamePredictionCounts = {
  homeCount: 0,
  awayCount: 0,
  drawCount: 0,
};

export function useGameMarketDistribution(
  gameId: string | null | undefined,
  league: League | string,
  fallbackMarketBias?: MarketBiasFallback | null,
  options?: { excludeDraw?: boolean }
) {
  const [counts, setCounts] = useState<GamePredictionCounts>(EMPTY_COUNTS);
  const [loading, setLoading] = useState(true);

  const excludeDraw = options?.excludeDraw ?? false;
  const isSoccer = isSoccerMarketLeague(league);

  useEffect(() => {
    if (!gameId) {
      setCounts(EMPTY_COUNTS);
      setLoading(false);
      return;
    }

    let alive = true;
    setLoading(true);

    fetchGamePredictionCounts(String(gameId))
      .then((next) => {
        if (!alive) return;
        setCounts(next);
      })
      .catch(() => {
        if (!alive) return;
        setCounts(EMPTY_COUNTS);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [gameId]);

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
