// lib/stats/buildBadgesV2.ts
import {
  evaluateWinRateV2,
  evaluatePrecisionV2,
  evaluateUpsetV2,
  type HighlightV2,
} from "./thresholdsV2";

type InputV2 = {
  winRate: number;      // 0..1
  avgPrecision: number; // 0..15
  avgUpset: number;     // 0..10
};

/** V2 仕様：3つのハイライトを返す */
export function buildBadgesV2(input: InputV2): {
  win?: HighlightV2;
  precision?: HighlightV2;
  upset?: HighlightV2;
} {
  const { winRate, avgPrecision, avgUpset } = input;

  return {
    win: evaluateWinRateV2(winRate),
    precision: evaluatePrecisionV2(avgPrecision),
    upset: evaluateUpsetV2(avgUpset),
  };
}
