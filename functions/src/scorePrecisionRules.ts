// functions/src/calcScorePrecision/scorePrecisionRules.ts

/**
 * バスケ向け 3段階ルール
 * 0〜6 → 5pt
 * 7〜13 → 2pt
 * 14+ → 0pt
 */
const basketballPoint = (diff: number): number => {
  if (diff <= 6) return 5;
  if (diff <= 13) return 2;
  return 0;
};

/**
 * サッカー向け 3段階ルール
 * 0 → 5pt
 * 1 → 2pt
 * 2+ → 0pt
 */
const footballPoint = (diff: number): number => {
  if (diff === 0) return 5;
  if (diff === 1) return 2;
  return 0;
};

export const scorePrecisionRules = {
  basketball: {
    pointByHome: basketballPoint,
    pointByAway: basketballPoint,
    pointByDiff: basketballPoint,
  },
  football: {
    pointByHome: footballPoint,
    pointByAway: footballPoint,
    pointByDiff: footballPoint,
  },
} as const;
