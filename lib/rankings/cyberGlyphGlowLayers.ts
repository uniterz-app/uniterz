/** RN textShadow の矩形グロー代替 — Web drop-shadow / textShadow 多層を字形レイヤーで近似 */

export type CyberGlyphGlowLayer = {
  color: string;
  opacity: number;
  /** 1 より大きいほど外側に広がる */
  scale: number;
};

/** Web `cyberRankPalette().glowFilter` 相当 */
export function cyberRankNumGlowLayers(rank: number): CyberGlyphGlowLayer[] {
  if (rank === 1) {
    return [
      { color: "#FBBF24", opacity: 0.55, scale: 1.04 },
      { color: "rgba(251,191,36,0.82)", opacity: 0.38, scale: 1.1 },
      { color: "rgba(255,214,90,0.38)", opacity: 0.28, scale: 1.18 },
    ];
  }
  if (rank === 2) {
    return [
      { color: "rgba(251,191,36,0.5)", opacity: 0.42, scale: 1.08 },
      { color: "rgba(255,43,214,0.22)", opacity: 0.32, scale: 1.14 },
    ];
  }
  if (rank === 3) {
    return [
      { color: "rgba(255,43,214,0.48)", opacity: 0.4, scale: 1.08 },
      { color: "rgba(255,43,214,0.18)", opacity: 0.3, scale: 1.14 },
    ];
  }
  const t = Math.min(1, (rank - 4) / 14);
  const outerAlpha = 0.16 - t * 0.1;
  const innerAlpha = 0.42 - t * 0.28;
  return [
    { color: `rgba(255,43,214,${innerAlpha})`, opacity: 0.38, scale: 1.06 + t * 0.02 },
    { color: `rgba(255,43,214,${outerAlpha})`, opacity: 0.26, scale: 1.12 + t * 0.04 },
  ];
}

/** Web `cyberScoreGlow()` 相当 */
export function cyberScoreGlowLayers(rank: number): CyberGlyphGlowLayer[] {
  if (rank === 1) {
    return [
      { color: "rgba(255,214,90,0.55)", opacity: 0.45, scale: 1.06 },
      { color: "rgba(255,43,214,0.25)", opacity: 0.32, scale: 1.12 },
    ];
  }
  if (rank <= 3) {
    return [{ color: "rgba(255,43,214,0.42)", opacity: 0.38, scale: 1.08 }];
  }
  const t = Math.min(1, (rank - 4) / 14);
  const alpha = 0.38 - t * 0.22;
  return [{ color: `rgba(255,43,214,${alpha})`, opacity: 0.34, scale: 1.06 + t * 0.04 }];
}
