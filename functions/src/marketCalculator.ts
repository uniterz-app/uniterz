// functions/src/shared/market/marketCalculator.ts

export type MarketPick = "home" | "away" | "draw";

export type MajoritySide = "home" | "away" | "draw";

export type MarketResult = {
  homeCount: number;
  awayCount: number;
  drawCount: number;
  total: number;

  homeRate: number;
  awayRate: number;
  drawRate: number;

  majoritySide: MajoritySide;
  majorityRatio: number;
};

export function marketCalculator(picks: MarketPick[]): MarketResult {
  let homeCount = 0;
  let awayCount = 0;
  let drawCount = 0;

  for (const p of picks) {
    if (p === "home") homeCount++;
    else if (p === "away") awayCount++;
    else drawCount++;
  }

  const total = homeCount + awayCount + drawCount;

  let majoritySide: MajoritySide = "home";
  let majorityCount = homeCount;

  if (awayCount >= homeCount && awayCount >= drawCount) {
    majoritySide = "away";
    majorityCount = awayCount;
  } else if (drawCount >= homeCount && drawCount >= awayCount) {
    majoritySide = "draw";
    majorityCount = drawCount;
  }

  return {
    homeCount,
    awayCount,
    drawCount,
    total,

    homeRate: total ? homeCount / total : 0,
    awayRate: total ? awayCount / total : 0,
    drawRate: total ? drawCount / total : 0,

    majoritySide,
    majorityRatio: total ? majorityCount / total : 0,
  };
}
