import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { League } from "@/lib/leagues";

export type MarketBiasFallback = {
  homePct: number;
  awayPct: number;
};

export type GamePredictionCounts = {
  homeCount: number;
  awayCount: number;
  drawCount: number;
};

export type GameMarketPcts = {
  homePct: number;
  awayPct: number;
  drawPct: number;
  total: number;
  fromFallback: boolean;
};

export function isSoccerMarketLeague(league: League | string): boolean {
  return league === "j1" || league === "pl" || league === "wc";
}

/** 市場タブ（GamePredictionDistribution）と同じ posts 集計 */
export async function fetchGamePredictionCounts(
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

export function computeGameMarketPcts(
  counts: GamePredictionCounts,
  isSoccer: boolean,
  fallback?: MarketBiasFallback | null,
  options?: { excludeDraw?: boolean }
): GameMarketPcts {
  // ノックアウト等、引き分けが存在しない試合では引き分けを母数から除外する
  const drawEnabled = isSoccer && !options?.excludeDraw;
  const total = drawEnabled
    ? counts.homeCount + counts.awayCount + counts.drawCount
    : counts.homeCount + counts.awayCount;

  if (total > 0) {
    return {
      total,
      fromFallback: false,
      homePct: (counts.homeCount / total) * 100,
      awayPct: (counts.awayCount / total) * 100,
      drawPct: drawEnabled ? (counts.drawCount / total) * 100 : 0,
    };
  }

  const sumFb = (fallback?.homePct ?? 0) + (fallback?.awayPct ?? 0);
  if (sumFb <= 0) {
    return {
      total: 0,
      fromFallback: false,
      homePct: 0,
      awayPct: 0,
      drawPct: 0,
    };
  }

  const h = Math.max(0, fallback?.homePct ?? 0);
  const a = Math.max(0, fallback?.awayPct ?? 0);
  const s = Math.max(1e-6, h + a);

  return {
    total: 0,
    fromFallback: true,
    homePct: (h / s) * 100,
    awayPct: (a / s) * 100,
    drawPct: 0,
  };
}
