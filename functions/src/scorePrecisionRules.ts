// functions/src/calcScorePrecision/scorePrecisionRules.ts

function curvedScore(diff: number, full: number, zeroAt: number, gamma: number) {
  if (diff <= full) return 1;
  if (diff >= zeroAt) return 0;

  const r = 1 - (diff - full) / (zeroAt - full); // 線形
  return Math.pow(r, gamma);                     // 厳しく
}

export const scorePrecisionRules = {
  basketball: {
    // 点差（最大7点）
    pointByDiff(diff: number) {
      const r = curvedScore(diff, 6, 16, 1.6);
      return Math.round(r * 7 * 10) / 10;
    },

    // HOME（最大4点）
    pointByHome(diff: number) {
      const r = curvedScore(diff, 6, 16, 1.6);
      return Math.round(r * 4 * 10) / 10;
    },

    // AWAY（最大4点）
    pointByAway(diff: number) {
      const r = curvedScore(diff, 6, 16, 1.6);
      return Math.round(r * 4 * 10) / 10;
    },
  },
} as const;
