/**
 * Native: posts 全件購読は廃止。空分布のみ返す。
 */
import { useEffect, useState } from "react";

export type PostDistribution = {
  home: number;
  away: number;
  draw: number;
};

const EMPTY: PostDistribution = { home: 0, away: 0, draw: 0 };

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
