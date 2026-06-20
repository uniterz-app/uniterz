/** Web `.result-card-streak-sweep--*` の conic-gradient 色停止（SweepGradient 用 0–1） */

export type ResultFrameBorderSweepVariant =
  | "perfect"
  | "streakSilver"
  | "streakPlatinum"
  | "streakGold"
  | "upset"
  | "default";

export type ResultFrameBorderSweepTheme = {
  colors: string[];
  positions: number[];
  /** Web `animation-duration` ms */
  durationMs: number;
  /** Web `.result-card-border-sweep` padding px → strokeWidth = padding * 2 */
  paddingPx: number;
};

/** Web `.result-card-streak-sweep--perfect .result-card-streak-sweep__spin` */
export const RESULT_PERFECT_BORDER_SWEEP: ResultFrameBorderSweepTheme = {
  paddingPx: 4,
  durationMs: 5000,
  colors: [
    "rgba(255,255,255,0)",
    "rgba(255,255,255,0)",
    "rgba(255,255,255,0.28)",
    "rgba(255,255,255,0.92)",
    "#ffffff",
    "#ffffff",
    "rgba(255,255,255,0.92)",
    "rgba(255,255,255,0.28)",
    "rgba(255,255,255,0)",
  ],
  positions: [0, 0.672, 0.728, 0.783, 0.822, 0.85, 0.889, 0.939, 1],
};

/** Web `.result-card-streak-sweep--silver` */
export const RESULT_STREAK_SILVER_BORDER_SWEEP: ResultFrameBorderSweepTheme = {
  paddingPx: 4,
  durationMs: 5000,
  colors: [
    "rgba(255,255,255,0)",
    "rgba(255,255,255,0)",
    "rgba(226,232,240,0.34)",
    "rgba(255,255,255,0.92)",
    "#ffffff",
    "rgba(255,255,255,0.92)",
    "rgba(203,213,225,0.34)",
    "rgba(255,255,255,0)",
  ],
  positions: [0, 0.678, 0.733, 0.789, 0.828, 0.867, 0.917, 1],
};

/** Web `.result-card-streak-sweep--platinum` */
export const RESULT_STREAK_PLATINUM_BORDER_SWEEP: ResultFrameBorderSweepTheme = {
  paddingPx: 4,
  durationMs: 5000,
  colors: [
    "rgba(255,255,255,0)",
    "rgba(255,255,255,0)",
    "rgba(34,211,238,0.34)",
    "rgba(255,255,255,0.94)",
    "#ffffff",
    "rgba(255,255,255,0.94)",
    "rgba(34,211,238,0.36)",
    "rgba(255,255,255,0)",
  ],
  positions: [0, 0.672, 0.728, 0.783, 0.822, 0.861, 0.911, 1],
};

/** Web `.result-card-streak-sweep--gold` */
export const RESULT_STREAK_GOLD_BORDER_SWEEP: ResultFrameBorderSweepTheme = {
  paddingPx: 4,
  durationMs: 5000,
  colors: [
    "rgba(255,255,255,0)",
    "rgba(255,255,255,0)",
    "rgba(251,191,36,0.38)",
    "rgba(255,255,255,0.96)",
    "#ffffff",
    "rgba(255,255,255,0.96)",
    "rgba(249,115,22,0.4)",
    "rgba(255,255,255,0)",
  ],
  positions: [0, 0.667, 0.722, 0.778, 0.817, 0.856, 0.906, 1],
};

/** Web `.result-card-streak-sweep--upset .result-card-streak-sweep__spin` */
export const RESULT_UPSET_BORDER_SWEEP: ResultFrameBorderSweepTheme = {
  paddingPx: 4,
  durationMs: 5000,
  colors: [
    "rgba(255,255,255,0)",
    "rgba(255,255,255,0)",
    "rgba(248,113,113,0.28)",
    "rgba(255,255,255,0.92)",
    "#ffffff",
    "#ffffff",
    "rgba(255,255,255,0.92)",
    "rgba(248,113,113,0.28)",
    "rgba(255,255,255,0)",
  ],
  positions: [0, 0.672, 0.728, 0.783, 0.822, 0.85, 0.889, 0.939, 1],
};

export function resultFrameBorderSweepTheme(
  variant: ResultFrameBorderSweepVariant
): ResultFrameBorderSweepTheme {
  if (variant === "perfect") return RESULT_PERFECT_BORDER_SWEEP;
  if (variant === "upset") return RESULT_UPSET_BORDER_SWEEP;
  if (variant === "streakSilver") return RESULT_STREAK_SILVER_BORDER_SWEEP;
  if (variant === "streakPlatinum") return RESULT_STREAK_PLATINUM_BORDER_SWEEP;
  if (variant === "streakGold") return RESULT_STREAK_GOLD_BORDER_SWEEP;
  return RESULT_PERFECT_BORDER_SWEEP;
}

export function resultStreakBorderSweepVariant(
  tier: "silver" | "platinum" | "gold"
): ResultFrameBorderSweepVariant {
  if (tier === "gold") return "streakGold";
  if (tier === "platinum") return "streakPlatinum";
  return "streakSilver";
}
