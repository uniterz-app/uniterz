import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../lib/firebase";
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

async function fetchGamePredictionCountsNative(
  gameId: string
): Promise<GamePredictionCounts> {
  const q = query(
    collection(db, "posts"),
    where("gameId", "==", gameId),
    where("schemaVersion", "==", 2)
  );
  const snap = await getDocs(q);
  let homeCount = 0;
  let awayCount = 0;
  let drawCount = 0;

  snap.docs.forEach((docSnap) => {
    const data = docSnap.data() as {
      prediction?: { winner?: string };
      winner?: string;
    };
    const winner = data?.prediction?.winner ?? data?.winner ?? null;
    if (winner === "home") homeCount += 1;
    else if (winner === "away") awayCount += 1;
    else if (winner === "draw") drawCount += 1;
  });

  return { homeCount, awayCount, drawCount };
}

/** Web `useGameMarketDistribution` のネイティブ版 */
export function useGameMarketDistributionNative(
  gameId: string | null | undefined,
  league: string,
  fallbackMarketBias?: MarketBiasFallback | null
) {
  const [counts, setCounts] = useState<GamePredictionCounts>(EMPTY_COUNTS);
  const [loading, setLoading] = useState(true);
  const isSoccer = isSoccerMarketLeague(league);

  useEffect(() => {
    if (!gameId) {
      setCounts(EMPTY_COUNTS);
      setLoading(false);
      return;
    }

    let alive = true;
    setLoading(true);

    fetchGamePredictionCountsNative(String(gameId))
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
    () => computeGameMarketPcts(counts, isSoccer, fallbackMarketBias),
    [counts, fallbackMarketBias, isSoccer]
  );

  return {
    loading,
    isSoccer,
    counts,
    ...market,
  };
}
