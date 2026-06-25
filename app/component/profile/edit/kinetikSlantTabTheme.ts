import type { KinetikRankBadgeTier } from "./kinetikRankBadge";
import type { KinetikStreakTier } from "./kinetikStreakFx";

/** Web `.profile-edit-kinetik-slant-tab--rank-*` / `--streak-*` と同系 */
export type KinetikSlantTabThemeKey =
  | KinetikRankBadgeTier
  | `streak-${Exclude<KinetikStreakTier, 0>}`;

export type KinetikCyberTooltipTheme = {
  accent: string;
  glow: string;
  title: string;
  body: string;
  bodyMuted: string;
  grid: string;
};

const RANK_THEMES: Record<KinetikRankBadgeTier, KinetikCyberTooltipTheme> = {
  legend: {
    accent: "#fcd34d",
    glow: "rgba(252, 211, 77, 0.45)",
    title: "#fde68a",
    body: "#fef9c3",
    bodyMuted: "rgba(253, 230, 138, 0.72)",
    grid: "rgba(252, 211, 77, 0.07)",
  },
  elite: {
    accent: "#c084fc",
    glow: "rgba(192, 132, 252, 0.42)",
    title: "#e9d5ff",
    body: "#f3e8ff",
    bodyMuted: "rgba(216, 180, 254, 0.75)",
    grid: "rgba(192, 132, 252, 0.07)",
  },
  pro: {
    accent: "#00f5ff",
    glow: "rgba(0, 245, 255, 0.42)",
    title: "#a5f3fc",
    body: "#cffafe",
    bodyMuted: "rgba(103, 232, 249, 0.75)",
    grid: "rgba(0, 245, 255, 0.07)",
  },
  analyst: {
    accent: "#a8ff2a",
    glow: "rgba(168, 255, 42, 0.38)",
    title: "#d9f99d",
    body: "#ecfccb",
    bodyMuted: "rgba(190, 242, 100, 0.72)",
    grid: "rgba(168, 255, 42, 0.07)",
  },
  rising: {
    accent: "#fb923c",
    glow: "rgba(251, 146, 60, 0.42)",
    title: "#fdba74",
    body: "#ffedd5",
    bodyMuted: "rgba(253, 186, 116, 0.75)",
    grid: "rgba(251, 146, 60, 0.07)",
  },
};

const STREAK_THEMES: Record<
  Exclude<KinetikStreakTier, 0>,
  KinetikCyberTooltipTheme
> = {
  1: {
    accent: "#ccff00",
    glow: "rgba(204, 255, 0, 0.35)",
    title: "#eaff8a",
    body: "#f7ffc8",
    bodyMuted: "rgba(217, 249, 157, 0.72)",
    grid: "rgba(204, 255, 0, 0.07)",
  },
  2: {
    accent: "#ccff00",
    glow: "rgba(204, 255, 0, 0.35)",
    title: "#eaff8a",
    body: "#f7ffc8",
    bodyMuted: "rgba(217, 249, 157, 0.72)",
    grid: "rgba(204, 255, 0, 0.07)",
  },
  3: {
    accent: "#22d3ee",
    glow: "rgba(34, 211, 238, 0.38)",
    title: "#a5f3fc",
    body: "#cffafe",
    bodyMuted: "rgba(103, 232, 249, 0.75)",
    grid: "rgba(34, 211, 238, 0.07)",
  },
  4: {
    accent: "#f87171",
    glow: "rgba(248, 113, 113, 0.38)",
    title: "#fecaca",
    body: "#fee2e2",
    bodyMuted: "rgba(252, 165, 165, 0.75)",
    grid: "rgba(248, 113, 113, 0.07)",
  },
};

export const KINETIK_CYBER_TOOLTIP_DEFAULT: KinetikCyberTooltipTheme = {
  accent: "#22d3ee",
  glow: "rgba(34, 211, 238, 0.38)",
  title: "#a5f3fc",
  body: "#cffafe",
  bodyMuted: "rgba(103, 232, 249, 0.75)",
  grid: "rgba(34, 211, 238, 0.07)",
};

export function resolveKinetikCyberTooltipTheme(
  key: KinetikSlantTabThemeKey
): KinetikCyberTooltipTheme {
  if (key.startsWith("streak-")) {
    const tier = Number(key.slice("streak-".length)) as Exclude<
      KinetikStreakTier,
      0
    >;
    return STREAK_THEMES[tier] ?? KINETIK_CYBER_TOOLTIP_DEFAULT;
  }
  return RANK_THEMES[key] ?? KINETIK_CYBER_TOOLTIP_DEFAULT;
}
