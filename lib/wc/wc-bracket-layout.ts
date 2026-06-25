import type { WcBracketPredictMatchId } from "@/lib/wc/wc-knockout-bracket";
import { listWcR32MatchesForDisplay } from "@/lib/wc/wc-knockout-bracket";

/** モバイル縦ブラケットのデザイン座標（NBA PlayoffFullBracketMobile と同様に scale 適用） */
export const WC_BRACKET_DESIGN_W = 520;
export const WC_BRACKET_DESIGN_H = 640;

export const WC_BRACKET_COL_X = {
  leftR32: 0,
  leftR16: 72,
  leftQF: 132,
  leftSF: 192,
  center: 252,
  rightSF: 312,
  rightQF: 372,
  rightR16: 432,
  rightR32: 492,
} as const;

const R32_COUNT = 8;
const R32_SPAN = 56;
const R32_START = 12;

export function wcR32Y(index: number): number {
  return R32_START + index * R32_SPAN;
}

export function wcR16Y(index: number): number {
  return wcR32Y(index * 2) + R32_SPAN / 2 - 10;
}

export function wcQfY(index: number): number {
  return wcR16Y(index * 2) + R32_SPAN - 8;
}

export const WC_BRACKET_LEFT_R16: readonly WcBracketPredictMatchId[] = [
  "M89",
  "M90",
  "M91",
  "M92",
];
export const WC_BRACKET_RIGHT_R16: readonly WcBracketPredictMatchId[] = [
  "M93",
  "M94",
  "M95",
  "M96",
];
export const WC_BRACKET_LEFT_QF: readonly WcBracketPredictMatchId[] = [
  "M97",
  "M99",
];
export const WC_BRACKET_RIGHT_QF: readonly WcBracketPredictMatchId[] = [
  "M98",
  "M100",
];

export function wcLeftR32MatchIds(): WcBracketPredictMatchId[] {
  return listWcR32MatchesForDisplay("left").map((m) => m.id as WcBracketPredictMatchId);
}

export function wcRightR32MatchIds(): WcBracketPredictMatchId[] {
  return listWcR32MatchesForDisplay("right").map((m) => m.id as WcBracketPredictMatchId);
}

export const WC_BRACKET_CENTER_FINAL_Y = 280;
export const WC_BRACKET_SLOT_GAP = 13;
