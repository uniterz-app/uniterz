/** Web `resultGlass.ts` の outcome / streak / LIVE バッジ配色 */

export type ResultCyberBadgeKind =
  | "hit"
  | "perfect"
  | "miss"
  | "upset"
  | "streakGold"
  | "streakPlatinum"
  | "streakSilver"
  | "live";

export type ResultCyberBadgeTheme = {
  gradient: readonly [string, string, string];
  gradientLocations: readonly [number, number, number];
  borderColor: string;
  leftAccent: string;
  topHighlight: string;
  textColor: string;
  shadowColor: string;
  shadowOpacity: number;
  shadowRadius: number;
};

export const RESULT_CYBER_BADGE_THEMES: Record<
  ResultCyberBadgeKind,
  ResultCyberBadgeTheme
> = {
  hit: {
    gradient: [
      "rgba(251,191,36,0.3)",
      "rgba(120,53,15,0.16)",
      "rgba(0,0,0,0.42)",
    ],
    gradientLocations: [0, 0.4, 1],
    borderColor: "rgba(251,191,36,0.62)",
    leftAccent: "rgba(253,224,71,0.58)",
    topHighlight: "rgba(255,255,255,0.2)",
    textColor: "#fffbeb",
    shadowColor: "rgba(251,191,36,0.3)",
    shadowOpacity: 0.34,
    shadowRadius: 12,
  },
  perfect: {
    gradient: [
      "rgba(167,139,250,0.4)",
      "rgba(124,58,237,0.34)",
      "rgba(30,27,75,0.48)",
    ],
    gradientLocations: [0, 0.44, 1],
    borderColor: "rgba(167,139,250,0.78)",
    leftAccent: "rgba(216,180,254,0.68)",
    topHighlight: "rgba(255,255,255,0.22)",
    textColor: "#f5f3ff",
    shadowColor: "rgba(139,92,246,0.36)",
    shadowOpacity: 0.36,
    shadowRadius: 14,
  },
  miss: {
    gradient: [
      "rgba(148,163,184,0.26)",
      "rgba(71,85,105,0.16)",
      "rgba(0,0,0,0.44)",
    ],
    gradientLocations: [0, 0.42, 1],
    borderColor: "rgba(148,163,184,0.5)",
    leftAccent: "rgba(148,163,184,0.5)",
    topHighlight: "rgba(255,255,255,0.14)",
    textColor: "#f1f5f9",
    shadowColor: "rgba(100,116,139,0.24)",
    shadowOpacity: 0.28,
    shadowRadius: 10,
  },
  upset: {
    gradient: [
      "rgba(248,113,113,0.38)",
      "rgba(185,28,28,0.34)",
      "rgba(69,10,10,0.48)",
    ],
    gradientLocations: [0, 0.44, 1],
    borderColor: "rgba(248,113,113,0.72)",
    leftAccent: "rgba(254,202,202,0.65)",
    topHighlight: "rgba(255,255,255,0.2)",
    textColor: "#fef2f2",
    shadowColor: "rgba(239,68,68,0.36)",
    shadowOpacity: 0.34,
    shadowRadius: 14,
  },
  streakGold: {
    gradient: [
      "rgba(251,191,36,0.52)",
      "rgba(234,88,12,0.38)",
      "rgba(69,26,3,0.5)",
    ],
    gradientLocations: [0, 0.48, 1],
    borderColor: "rgba(252,211,77,0.84)",
    leftAccent: "rgba(255,237,180,0.72)",
    topHighlight: "rgba(255,255,255,0.24)",
    textColor: "#fffbeb",
    shadowColor: "rgba(251,191,36,0.42)",
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  streakPlatinum: {
    gradient: [
      "rgba(34,211,238,0.46)",
      "rgba(8,145,178,0.36)",
      "rgba(15,23,42,0.5)",
    ],
    gradientLocations: [0, 0.48, 1],
    borderColor: "rgba(103,232,249,0.82)",
    leftAccent: "rgba(186,250,255,0.68)",
    topHighlight: "rgba(255,255,255,0.22)",
    textColor: "#ecfeff",
    shadowColor: "rgba(34,211,238,0.38)",
    shadowOpacity: 0.38,
    shadowRadius: 16,
  },
  streakSilver: {
    gradient: [
      "rgba(226,232,240,0.34)",
      "rgba(100,116,139,0.28)",
      "rgba(15,23,42,0.5)",
    ],
    gradientLocations: [0, 0.48, 1],
    borderColor: "rgba(226,232,240,0.78)",
    leftAccent: "rgba(248,250,252,0.62)",
    topHighlight: "rgba(255,255,255,0.2)",
    textColor: "#f8fafc",
    shadowColor: "rgba(148,163,184,0.34)",
    shadowOpacity: 0.32,
    shadowRadius: 14,
  },
  live: {
    gradient: [
      "rgba(239,68,68,0.4)",
      "rgba(185,28,28,0.36)",
      "rgba(69,10,10,0.5)",
    ],
    gradientLocations: [0, 0.44, 1],
    borderColor: "rgba(239,68,68,0.78)",
    leftAccent: "rgba(254,202,202,0.62)",
    topHighlight: "rgba(255,255,255,0.18)",
    textColor: "#fef2f2",
    shadowColor: "rgba(239,68,68,0.28)",
    shadowOpacity: 0.32,
    shadowRadius: 10,
  },
};

export function resultCyberBadgeMetrics(
  kind: ResultCyberBadgeKind,
  compact: boolean,
  subtle: boolean
) {
  const isPerfect = kind === "perfect";
  const isStreak = kind.startsWith("streak");

  if (isPerfect) {
    return {
      fontSize: subtle ? (compact ? 7 : 8) : compact ? 8 : 9,
      letterSpacing: subtle ? 0.48 : compact ? 0.64 : 0.8,
      paddingH: subtle ? 8 : compact ? 10 : 12,
      paddingV: subtle ? 2 : 3,
      gap: 0,
    };
  }

  if (isStreak) {
    return {
      fontSize: subtle ? (compact ? 9 : 10) : compact ? 10 : 11,
      letterSpacing: subtle ? 1 : compact ? 1.1 : 1.2,
      paddingH: subtle ? 10 : compact ? 12 : 14,
      paddingV: subtle ? 2 : compact ? 4 : 4,
      gap: compact ? 4 : 6,
    };
  }

  return {
    fontSize: subtle ? (compact ? 8 : 9) : compact ? 9 : 10,
    letterSpacing: subtle ? 0.96 : compact ? 1.12 : 1.2,
    paddingH: subtle ? 8 : compact ? 10 : 12,
    paddingV: subtle ? 2 : 3,
    gap: 0,
  };
}
