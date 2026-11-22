/**
 * 試合確定後の得点サマリー（中央値・最高・自分）。
 * `/api/games/doc` の pointsSummary（なければ旧 pointsDistribution）。
 * posts 全件読みはしない。分布 bins は使わない。
 */
"use client";

import { useEffect, useState } from "react";
import { fetchPublicGameDoc } from "@/lib/games/fetchPublicGameDoc";
import { resolveGamePointsSummary } from "@/lib/results/gamePointsSummary";

export type GamePointsSummaryStats = {
  mean: number | null;
  median: number | null;
  max: number | null;
  myScore: number | null;
  n: number;
  ready: boolean;
};

const idle: GamePointsSummaryStats = {
  mean: null,
  median: null,
  max: null,
  myScore: null,
  n: 0,
  ready: false,
};

export function useGamePointsSummaryStats(input: {
  gameId: string | null | undefined;
  enabled?: boolean;
  /** 自分の pointsV3（親が既に持っていれば渡す） */
  myScore?: number | null;
}): GamePointsSummaryStats {
  const enabled = input.enabled ?? true;
  const gameId = input.gameId;
  const myScore =
    typeof input.myScore === "number" && Number.isFinite(input.myScore)
      ? input.myScore
      : null;

  const [state, setState] = useState<GamePointsSummaryStats>(idle);

  useEffect(() => {
    if (!enabled || !gameId?.trim()) {
      setState({ ...idle, ready: true, myScore });
      return;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, ready: false }));

    void (async () => {
      try {
        const { exists, game } = await fetchPublicGameDoc({
          gameId: gameId.trim(),
          view: "slim",
          includePeers: false,
        });
        if (cancelled) return;
        if (!exists || !game) {
          setState({ ...idle, ready: true, myScore });
          return;
        }
        const summary = resolveGamePointsSummary(game);
        if (!summary) {
          setState({ ...idle, ready: true, myScore });
          return;
        }
        setState({
          mean: null,
          median: summary.median,
          max: summary.max,
          myScore,
          n: summary.n,
          ready: true,
        });
      } catch {
        if (!cancelled) setState({ ...idle, ready: true, myScore });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, gameId, myScore]);

  return state;
}
