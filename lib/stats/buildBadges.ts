// lib/stats/buildBadges.ts
import {
  RangeValue,
  evaluateWinRate,
  evaluateAvgOdds,
  evaluateUnits,
  type Highlight,
} from "./thresholds";

type Input = {
  period: RangeValue;  // "7d" | "30d" | "all"
  winRate: number;     // 0..1
  avgOdds: number;
  units: number;
  sampleCount?: number; // posts の件数、無ければ 0 として扱う
};

/** ランキング行のバッジをまとめて作る */
export function buildBadges(input: Input): {
  win?: Highlight;
  odds?: Highlight;
  units?: Highlight;
} {
  const {
    period,
    winRate,
    avgOdds,
    units,
    sampleCount = 0,
  } = input;

  return {
    win:  evaluateWinRate(period, winRate, sampleCount),
    odds: evaluateAvgOdds(period, avgOdds, sampleCount),
    units: evaluateUnits(period, units, sampleCount),
  };
}
