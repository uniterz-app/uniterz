/** Web `DayStrip` dense モバイル（size=md, visibleCount=6, wideItemGap）相当 */
export const DAY_STRIP_VISIBLE_COUNT = 6;
export const DAY_STRIP_CHIP_SIZE = 48;
export const DAY_STRIP_GAP_PX = 12;
export const DAY_STRIP_H_PAD = 8;

/** Web `DayStrip` snap 抑制（初回 align 820ms / 通常 450ms） */
export const DAY_STRIP_SUPPRESS_SNAP_INIT_MS = 820;
export const DAY_STRIP_SUPPRESS_SNAP_MS = 450;

export const DAY_CHIP_BORDER_DEFAULT = "rgba(255,255,255,0.16)";
export const DAY_CHIP_BORDER_SELECTED = "rgba(34,211,238,0.62)";
export const DAY_CHIP_BORDER_TODAY = "rgba(250,204,21,0.75)";

export const DAY_CHIP_GRADIENT_SELECTED = [
  "rgba(34,211,238,0.42)",
  "rgba(8,145,178,0.36)",
] as const;

export const DAY_CHIP_GRADIENT_DEFAULT = [
  "rgba(255,255,255,0.08)",
  "rgba(255,255,255,0.03)",
] as const;
