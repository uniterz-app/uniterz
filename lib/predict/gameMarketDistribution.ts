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

/** posts 全件 read は廃止（常に 0）。UI は game.pointsDistribution へ移行。 */
export async function fetchGamePredictionCounts(
  _gameId: string
): Promise<GamePredictionCounts> {
  return { homeCount: 0, awayCount: 0, drawCount: 0 };
}

export function computeGameMarketPcts(
  counts: GamePredictionCounts,
  isSoccer: boolean,
  fallback?: MarketBiasFallback | null,
  options?: { excludeDraw?: boolean }
): GameMarketPcts {
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
