import type {
  KinetikMenuAccentKey,
  KinetikProfileAccentKey,
  KinetikRankBadgeTier,
} from "../../../../../../app/component/profile/edit/kinetikRankBadge";

export const KINETIK_GREEN = "#a8ff2a";
export const KINETIK_MAGENTA = "#ff2bd6";
export const KINETIK_CYAN = "#22d3ee";
export const KINETIK_RED = "#ff4757";

export type KinetikMetricAccent = "green" | "magenta" | "cyan" | "red";

export const KINETIK_METRIC_ACCENT: Record<
  KinetikMetricAccent,
  { line: string; fill: string; glow: string }
> = {
  green: { line: KINETIK_GREEN, fill: KINETIK_GREEN, glow: "rgba(168,255,42,0.35)" },
  magenta: { line: KINETIK_MAGENTA, fill: KINETIK_MAGENTA, glow: "rgba(255,43,214,0.35)" },
  cyan: { line: KINETIK_CYAN, fill: KINETIK_CYAN, glow: "rgba(34,211,238,0.35)" },
  red: { line: KINETIK_RED, fill: KINETIK_RED, glow: "rgba(255,71,87,0.35)" },
};

/** Web `--kinetik-frame`（`profile-kinetik-panel--accent-*`）と同値 */
const ACCENT_BORDER: Record<KinetikProfileAccentKey, string> = {
  default: "rgba(255, 255, 255, 0.22)",
  "rank-1": "rgba(255, 214, 90, 0.3)",
  "rank-2": "rgba(184, 196, 216, 0.3)",
  "rank-3": "rgba(205, 127, 50, 0.3)",
  legend: "rgba(252, 211, 77, 0.3)",
  elite: "rgba(192, 132, 252, 0.3)",
  pro: "rgba(0, 245, 255, 0.3)",
  analyst: "rgba(168, 255, 42, 0.3)",
  rising: "rgba(251, 146, 60, 0.3)",
  "streak-1": "rgba(204, 255, 0, 0.3)",
  "streak-2": "rgba(204, 255, 0, 0.3)",
  "streak-3": "rgba(34, 211, 238, 0.3)",
  "streak-4": "rgba(248, 113, 113, 0.3)",
};

export function kinetikPanelBorderColor(accent: KinetikProfileAccentKey): string {
  return ACCENT_BORDER[accent] ?? ACCENT_BORDER.default;
}

export function kinetikMenuBorderColor(accent: KinetikMenuAccentKey): string {
  return ACCENT_BORDER[accent as KinetikProfileAccentKey] ?? ACCENT_BORDER.default;
}

/** Web `.profile-edit-kinetik-slant-tab--rank-*` / `--streak-*` */
export type KinetikSlantTabTheme = {
  accent: string;
  glow: string;
  fillText: string;
};

export const KINETIK_SLANT_TAB_RANK: Record<KinetikRankBadgeTier, KinetikSlantTabTheme> = {
  legend: { accent: "#fcd34d", glow: "rgba(252, 211, 77, 0.45)", fillText: "#1a1200" },
  elite: { accent: "#b57cff", glow: "rgba(181, 124, 255, 0.34)", fillText: "#0d0612" },
  pro: { accent: "#00f5ff", glow: "rgba(0, 245, 255, 0.42)", fillText: "#050508" },
  analyst: { accent: "#a8ff2a", glow: "rgba(168, 255, 42, 0.38)", fillText: "#0a1004" },
  rising: { accent: "#fb923c", glow: "rgba(251, 146, 60, 0.42)", fillText: "#140a02" },
};

export const KINETIK_SLANT_TAB_STREAK: Record<
  1 | 2 | 3 | 4,
  Pick<KinetikSlantTabTheme, "accent" | "glow">
> = {
  1: { accent: "#ccff00", glow: "rgba(204, 255, 0, 0.35)" },
  2: { accent: "#ccff00", glow: "rgba(204, 255, 0, 0.35)" },
  3: { accent: "#22d3ee", glow: "rgba(34, 211, 238, 0.38)" },
  4: { accent: "#f87171", glow: "rgba(248, 113, 113, 0.38)" },
};

/** Web `.profile-edit-kinetik-card--compact` の `--kinetik-tab-row-h: 26px` */
export const KINETIK_SLANT_TAB_ROW_H = 26;
