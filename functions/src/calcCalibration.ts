// functions/src/calcCalibration.ts

type Bin = {
  min: number;
  max: number;
};

type Item = {
  prob: number;   // 0〜1
  result: 0 | 1;  // 勝ち=1, 負け=0
};

const BINS: Bin[] = [
  { min: 0.50, max: 0.59 },
  { min: 0.60, max: 0.69 },
  { min: 0.70, max: 0.79 },
  { min: 0.80, max: 0.89 },
  { min: 0.90, max: 1.00 },
];

export function calcCalibrationError(items: Item[]) {
  let totalWeightedError = 0;
  let totalCount = 0;

  for (const bin of BINS) {
    const grouped = items.filter(
      i => i.prob >= bin.min && i.prob <= bin.max
    );

    if (grouped.length === 0) continue;

    const avgProb =
      grouped.reduce((a, b) => a + b.prob, 0) / grouped.length;

    const winRate =
      grouped.reduce((a, b) => a + b.result, 0) / grouped.length;

    const error = Math.abs(avgProb - winRate);

    totalWeightedError += error * grouped.length;
    totalCount += grouped.length;
  }

  // 対象ゼロ（評価不能）
  if (totalCount === 0) return null;

  return totalWeightedError / totalCount;
}

/**
 * UI 用：一致度（%）
 */
export function toConsistencyPercent(calibrationError: number | null) {
  if (calibrationError == null) return null;

  return Math.max(0, Math.min(100, Math.round((1 - calibrationError) * 100)));
}
