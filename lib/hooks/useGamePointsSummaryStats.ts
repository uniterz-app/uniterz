/**
 * 試合確定後の得点サマリー（平均・中央値・最高・自分）。
 * games/{id}.pointsDistribution 1 read + 自分の post 得点（親から渡す）。
 * posts コレクションの全件読みはしない。
 */
"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  parseGamePointsDistributionV1,
  rawPointsDistributionFromGameDoc,
} from "@/lib/results/gamePointsDistribution";

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
        const snap = await getDoc(doc(db, "games", gameId.trim()));
        if (cancelled) return;
        const raw = rawPointsDistributionFromGameDoc(
          snap.exists() ? (snap.data() as Record<string, unknown>) : null
        );
        const dist = parseGamePointsDistributionV1(raw);
        if (!dist) {
          setState({ ...idle, ready: true, myScore });
          return;
        }
        const maxFromBins =
          dist.max ??
          (dist.bins.length
            ? Math.max(
                ...dist.bins.flatMap((b) =>
                  b.count > 0 ? [b.hi === b.lo ? b.lo : b.hi - 0.01] : []
                ),
                0
              )
            : null);
        setState({
          mean: dist.mean,
          median: dist.median,
          max:
            typeof dist.max === "number" && Number.isFinite(dist.max)
              ? dist.max
              : maxFromBins != null && Number.isFinite(maxFromBins)
                ? maxFromBins
                : null,
          myScore,
          n: dist.n,
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
