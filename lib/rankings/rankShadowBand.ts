/** 先週の順位を中心にした Shadow 帯の半幅（±N 位） */
export const SHADOW_BAND_HALF_WIDTH = 5;

export const SHADOW_LOOKBACK_DAYS = 7;

export const SHADOW_TOP30_THRESHOLD = 30;

export function resolveShadowBandRange(priorRank: number): {
  low: number;
  high: number;
} {
  const center = Math.max(1, Math.floor(priorRank));
  return {
    low: Math.max(1, center - SHADOW_BAND_HALF_WIDTH),
    high: center + SHADOW_BAND_HALF_WIDTH,
  };
}

export function isRankInShadowBand(
  rank: number,
  band: { low: number; high: number }
): boolean {
  return rank >= band.low && rank <= band.high;
}
