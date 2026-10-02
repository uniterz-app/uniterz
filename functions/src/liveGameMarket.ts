/** Web `lib/predict/liveGameMarket` 相当（functions は root lib を import しない） */

export type LiveMarketSide = "home" | "away" | "draw";

export type LiveMarketCounts = {
  home: number;
  away: number;
  draw: number;
};

export type LiveGameMarketPatch = {
  marketPickCounts: LiveMarketCounts;
  market: {
    homeCount: number;
    awayCount: number;
    drawCount: number;
    total: number;
    homeRate: number;
    awayRate: number;
    drawRate: number;
    majority: LiveMarketSide;
    majorityRatio: number;
  };
  marketBias: { homePct: number; awayPct: number };
};

function nonNegInt(v: unknown): number {
  if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) return 0;
  return Math.floor(v);
}

export function readLiveMarketCounts(
  game: Record<string, unknown> | null | undefined
): LiveMarketCounts {
  if (!game) return { home: 0, away: 0, draw: 0 };
  const pickCounts =
    game.marketPickCounts !== null && typeof game.marketPickCounts === "object"
      ? (game.marketPickCounts as Record<string, unknown>)
      : null;
  const market =
    game.market !== null && typeof game.market === "object"
      ? (game.market as Record<string, unknown>)
      : null;

  return {
    home: nonNegInt(
      pickCounts?.home ?? pickCounts?.homeCount ?? market?.homeCount
    ),
    away: nonNegInt(
      pickCounts?.away ?? pickCounts?.awayCount ?? market?.awayCount
    ),
    draw: nonNegInt(
      pickCounts?.draw ?? pickCounts?.drawCount ?? market?.drawCount
    ),
  };
}

export function parseMarketSide(v: unknown): LiveMarketSide | null {
  if (v === "home" || v === "away" || v === "draw") return v;
  return null;
}

export function liveGameMarketFromCounts(
  counts: LiveMarketCounts
): LiveGameMarketPatch {
  const next: LiveMarketCounts = {
    home: Math.max(0, counts.home),
    away: Math.max(0, counts.away),
    draw: Math.max(0, counts.draw),
  };
  const total = next.home + next.away + next.draw;
  const ha = next.home + next.away;
  const homePct = ha > 0 ? (next.home / ha) * 100 : 50;
  const awayPct = ha > 0 ? (next.away / ha) * 100 : 50;

  let majority: LiveMarketSide = "home";
  let majorityCount = next.home;
  if (next.away >= next.home && next.away >= next.draw) {
    majority = "away";
    majorityCount = next.away;
  } else if (next.draw >= next.home && next.draw >= next.away) {
    majority = "draw";
    majorityCount = next.draw;
  }

  return {
    marketPickCounts: next,
    market: {
      homeCount: next.home,
      awayCount: next.away,
      drawCount: next.draw,
      total,
      homeRate: total ? next.home / total : 0,
      awayRate: total ? next.away / total : 0,
      drawRate: total ? next.draw / total : 0,
      majority,
      majorityRatio: total ? majorityCount / total : 0,
    },
    marketBias: {
      homePct: Math.round(homePct * 10) / 10,
      awayPct: Math.round(awayPct * 10) / 10,
    },
  };
}

export function applyLiveMarketDelta(
  counts: LiveMarketCounts,
  side: LiveMarketSide,
  delta: 1 | -1
): LiveGameMarketPatch {
  return liveGameMarketFromCounts({
    home: counts.home + (side === "home" ? delta : 0),
    away: counts.away + (side === "away" ? delta : 0),
    draw: counts.draw + (side === "draw" ? delta : 0),
  });
}
