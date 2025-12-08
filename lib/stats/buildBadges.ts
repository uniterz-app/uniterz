// lib/stats/buildBadgesV2.ts
import {
  evaluateWinRateV2,
  evaluatePrecisionV2,
  evaluateAccuracyV2,
  evaluateUpsetV2,
  type HighlightV2,
} from "./thresholdsV2";

type InputV2 = {
  winRate: number;        // 0..1
  avgPrecision: number;   // 0..15
  avgBrier: number;       // 0..1 → accuracy に変換
  avgUpset: number;       // 0..10
};

/** V2 仕様：4つのハイライトを返す */
export function buildBadgesV2(input: InputV2): {
  win?: HighlightV2;
  precision?: HighlightV2;
  accuracy?: HighlightV2;
  upset?: HighlightV2;
} {
  const { winRate, avgPrecision, avgBrier, avgUpset } = input;

  // Accuracy = (1 - avgBrier) * 100
  const accuracyPct = (1 - avgBrier) * 100;

  return {
    win: evaluateWinRateV2(winRate),
    precision: evaluatePrecisionV2(avgPrecision),
    accuracy: evaluateAccuracyV2(accuracyPct),
    upset: evaluateUpsetV2(avgUpset),
  };
}
