/** Web `.profile-edit-kinetik-card--compact` の CSS 変数と同値 */
export const KINETIK_AVATAR_MOBILE = {
  size: 64,
  edgeLen: 32,
  innerInset: 6,
  glyphSize: 24,
  ribLen: 36,
  ribThick: 4,
  marchScale: 0.81,
} as const;

export type KinetikAvatarColorSet = {
  green: string;
  greenSoft: string;
  greenMid: string;
  greenDim: string;
  march: string;
  plate: string;
  plateInner: string;
};

const GREEN_STREAK: KinetikAvatarColorSet = {
  green: "#ccff00",
  greenSoft: "rgba(204, 255, 0, 0.5)",
  greenMid: "rgba(204, 255, 0, 0.36)",
  greenDim: "rgba(204, 255, 0, 0.08)",
  march: "rgba(204, 255, 0, 0.85)",
  plate: "#121416",
  plateInner: "#0a0c0e",
};

const CYAN_STREAK: KinetikAvatarColorSet = {
  green: "#22d3ee",
  greenSoft: "rgba(34, 211, 238, 0.52)",
  greenMid: "rgba(34, 211, 238, 0.38)",
  greenDim: "rgba(34, 211, 238, 0.1)",
  march: "rgba(34, 211, 238, 0.88)",
  plate: "#121416",
  plateInner: "#0a0c0e",
};

const RED_STREAK: KinetikAvatarColorSet = {
  green: "#f87171",
  greenSoft: "rgba(248, 113, 113, 0.55)",
  greenMid: "rgba(248, 113, 113, 0.4)",
  greenDim: "rgba(248, 113, 113, 0.1)",
  march: "rgba(248, 113, 113, 0.9)",
  plate: "#121416",
  plateInner: "#0a0c0e",
};

const ACCENT_COLORS: Record<string, KinetikAvatarColorSet> = {
  "rank-1": {
    green: "#ffd65a",
    greenSoft: "rgba(255, 214, 90, 0.52)",
    greenMid: "rgba(255, 214, 90, 0.38)",
    greenDim: "rgba(255, 214, 90, 0.1)",
    march: "rgba(255, 214, 90, 0.85)",
    plate: "#121416",
    plateInner: "#0a0c0e",
  },
  "rank-2": {
    green: "#b8c4d8",
    greenSoft: "rgba(184, 196, 216, 0.52)",
    greenMid: "rgba(184, 196, 216, 0.38)",
    greenDim: "rgba(184, 196, 216, 0.1)",
    march: "rgba(184, 196, 216, 0.85)",
    plate: "#121416",
    plateInner: "#0a0c0e",
  },
  "rank-3": {
    green: "#cd7f32",
    greenSoft: "rgba(205, 127, 50, 0.52)",
    greenMid: "rgba(205, 127, 50, 0.38)",
    greenDim: "rgba(205, 127, 50, 0.1)",
    march: "rgba(205, 127, 50, 0.85)",
    plate: "#121416",
    plateInner: "#0a0c0e",
  },
  legend: {
    green: "#fcd34d",
    greenSoft: "rgba(252, 211, 77, 0.52)",
    greenMid: "rgba(252, 211, 77, 0.38)",
    greenDim: "rgba(252, 211, 77, 0.1)",
    march: "rgba(252, 211, 77, 0.85)",
    plate: "#121416",
    plateInner: "#0a0c0e",
  },
  elite: {
    green: "#c084fc",
    greenSoft: "rgba(192, 132, 252, 0.52)",
    greenMid: "rgba(192, 132, 252, 0.38)",
    greenDim: "rgba(192, 132, 252, 0.1)",
    march: "rgba(192, 132, 252, 0.85)",
    plate: "#121416",
    plateInner: "#0a0c0e",
  },
  pro: {
    green: "#00f5ff",
    greenSoft: "rgba(0, 245, 255, 0.52)",
    greenMid: "rgba(0, 245, 255, 0.38)",
    greenDim: "rgba(0, 245, 255, 0.1)",
    march: "rgba(0, 245, 255, 0.85)",
    plate: "#121416",
    plateInner: "#0a0c0e",
  },
  analyst: {
    green: "#a8ff2a",
    greenSoft: "rgba(168, 255, 42, 0.52)",
    greenMid: "rgba(168, 255, 42, 0.38)",
    greenDim: "rgba(168, 255, 42, 0.1)",
    march: "rgba(168, 255, 42, 0.85)",
    plate: "#121416",
    plateInner: "#0a0c0e",
  },
  rising: {
    green: "#fb923c",
    greenSoft: "rgba(251, 146, 60, 0.52)",
    greenMid: "rgba(251, 146, 60, 0.38)",
    greenDim: "rgba(251, 146, 60, 0.1)",
    march: "rgba(251, 146, 60, 0.85)",
    plate: "#121416",
    plateInner: "#0a0c0e",
  },
  default: {
    green: "rgba(255, 255, 255, 0.72)",
    greenSoft: "rgba(255, 255, 255, 0.38)",
    greenMid: "rgba(255, 255, 255, 0.24)",
    greenDim: "rgba(255, 255, 255, 0.08)",
    march: "rgba(255, 255, 255, 0.55)",
    plate: "#121416",
    plateInner: "#0a0c0e",
  },
};

export function resolveKinetikAvatarColors(input: {
  streakActive: boolean;
  streakTier: number;
  accentKey: string;
}): KinetikAvatarColorSet {
  if (input.streakActive) {
    if (input.streakTier >= 4) return RED_STREAK;
    if (input.streakTier === 3) return CYAN_STREAK;
    return GREEN_STREAK;
  }
  return ACCENT_COLORS[input.accentKey] ?? ACCENT_COLORS.default;
}

export function kinetikMarchDurationMs(streakTier: number): number {
  if (streakTier >= 4) return 1600;
  if (streakTier === 3) return 2000;
  if (streakTier === 2) return 2400;
  return 2800;
}
