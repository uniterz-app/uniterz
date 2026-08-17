"use client";

/**
 * 試合の posts 全件購読は廃止（コスト爆発のため）。
 * 勝敗％分布は使わない。呼び出し側は game.pointsDistribution の数値統計へ移行済み。
 */
import { useEffect, useState } from "react";

export type PostDistribution = {
  home: number;
  away: number;
  draw: number;
};

const EMPTY: PostDistribution = { home: 0, away: 0, draw: 0 };

export function countPostDistribution(
  _docs: ReadonlyArray<{ data: () => unknown }>
): PostDistribution {
  return EMPTY;
}

export function usePredictionPostDistribution(
  _gameId: string | null | undefined,
  enabled = true
) {
  const [loading, setLoading] = useState(Boolean(enabled));

  useEffect(() => {
    setLoading(false);
  }, [enabled]);

  return {
    data: EMPTY,
    loading,
    error: null as string | null,
    applyOptimistic: (_winner: "home" | "away" | "draw") => {},
  };
}
