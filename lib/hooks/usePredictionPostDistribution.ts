"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type PostDistribution = {
  home: number;
  away: number;
  draw: number;
};

const EMPTY: PostDistribution = { home: 0, away: 0, draw: 0 };

export function countPostDistribution(
  docs: ReadonlyArray<{ data: () => unknown }>
): PostDistribution {
  let home = 0;
  let away = 0;
  let draw = 0;

  for (const docSnap of docs) {
    const data = docSnap.data() as {
      prediction?: { winner?: string };
      winner?: string;
    };
    const winner = data?.prediction?.winner ?? data?.winner ?? null;
    if (winner === "home") home++;
    else if (winner === "away") away++;
    else if (winner === "draw") draw++;
  }

  return { home, away, draw };
}

/**
 * 試合ごとの勝敗予想分布。`posts` をリアルタイム購読する（Web/Native 共通）。
 */
export function usePredictionPostDistribution(
  gameId: string | null | undefined,
  enabled = true
) {
  const [data, setData] = useState<PostDistribution>(EMPTY);
  const [loading, setLoading] = useState(Boolean(enabled && gameId));
  const [error, setError] = useState<string | null>(null);
  const optimisticRef = useRef<PostDistribution>(EMPTY);

  const applyOptimistic = useCallback((winner: "home" | "away" | "draw") => {
    optimisticRef.current = {
      ...optimisticRef.current,
      [winner]: optimisticRef.current[winner] + 1,
    };
    setData((prev) => ({
      ...prev,
      [winner]: prev[winner] + 1,
    }));
  }, []);

  useEffect(() => {
    if (!enabled || !gameId) {
      optimisticRef.current = EMPTY;
      setData(EMPTY);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    optimisticRef.current = EMPTY;

    const q = query(
      collection(db, "posts"),
      where("gameId", "==", gameId),
      where("schemaVersion", "==", 2)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        optimisticRef.current = EMPTY;
        setData(countPostDistribution(snap.docs));
        setLoading(false);
      },
      (err) => {
        setData(EMPTY);
        setError(err?.message ?? "load error");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [enabled, gameId]);

  return { data, loading, error, applyOptimistic };
}
