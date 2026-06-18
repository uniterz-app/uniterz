/**
 * ネイティブ背景パレット — Web `gamesPageBackgroundSpec` と同色。
 */
import {
  GAMES_PAGE_BG_GRADIENT,
  GAMES_PAGE_BG_TINTS,
  GAMES_TOP_HIGHLIGHT_LAYOUT,
  gamesAuroraPhaseStops,
} from "../../../../../lib/games/gamesPageBackgroundSpec";

export const NATIVE_BG_GRADIENT = GAMES_PAGE_BG_GRADIENT;

/** ルートフォールバック・カード角の透過先 */
export const NATIVE_PAGE_SURFACE_COLOR = GAMES_PAGE_BG_GRADIENT.top;

export const NATIVE_BG_TINTS = GAMES_PAGE_BG_TINTS;

export const NATIVE_TOP_HIGHLIGHT = GAMES_TOP_HIGHLIGHT_LAYOUT;

export { gamesAuroraPhaseStops as nativeAuroraPhaseStops };

export const NATIVE_FIELD_DOT = "rgba(134,210,180,0.18)";
export const NATIVE_FIELD_GRID_H = "rgba(100,150,130,0.11)";
export const NATIVE_FIELD_GRID_V = "rgba(100,150,130,0.08)";
export const NATIVE_FIELD_DEPTH = "rgba(40,70,60,0.06)";

export const NATIVE_VIGNETTE_STOPS = [
  { offset: "0%", color: "rgba(0,0,0,0)" },
  { offset: "68%", color: "rgba(0,0,0,0.22)" },
  { offset: "100%", color: "rgba(0,0,0,0.48)" },
] as const;

export const NATIVE_VIGNETTE_LINEAR = [
  "rgba(0,0,0,0.28)",
  "transparent",
  "transparent",
  "rgba(0,0,0,0.38)",
] as const;
