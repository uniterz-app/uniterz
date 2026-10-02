/**
 * ジャージ ドット密度。既定は coarse（一覧・詳細とも）。
 * step = cssSize * STEP_FACTOR * densityScale
 */

export type JerseyDotDensity = "fine" | "coarse";

/** fine = 現行の細かいドット */
export const JERSEY_DENSITY_SCALE_FINE = 1;

/** coarse = 旧寄り（約 0.028/0.021 ≈ 1.33）より少し荒く */
export const JERSEY_DENSITY_SCALE_COARSE = 1.55;

export const JERSEY_STEP_FACTOR = 0.021;

export function jerseyDensityScale(density: JerseyDotDensity = "coarse"): number {
  return density === "coarse"
    ? JERSEY_DENSITY_SCALE_COARSE
    : JERSEY_DENSITY_SCALE_FINE;
}

export function jerseyBodyStep(cssSize: number, density: JerseyDotDensity = "coarse"): number {
  const scale = jerseyDensityScale(density);
  if (density === "coarse") {
    return Math.max(2.4, Math.min(3.6, cssSize * JERSEY_STEP_FACTOR * scale));
  }
  return Math.max(1.7, Math.min(2.7, cssSize * JERSEY_STEP_FACTOR * scale));
}
