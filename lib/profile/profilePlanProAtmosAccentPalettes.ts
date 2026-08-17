/** PRO atmos 背景 — 枠 accent に合わせた図形色パレット */

import type { KinetikProfileAccentKey } from "@/app/component/profile/edit/kinetikRankBadge";

/** Web `--kinetik-frame-strong` / `--kinetik-frame-dim` と同値 */
const ACCENT_FRAME_STRONG: Record<KinetikProfileAccentKey, string> = {
  default: "rgba(255, 255, 255, 0.88)",
  "rank-1": "rgba(255, 214, 90, 0.92)",
  "rank-2": "rgba(184, 196, 216, 0.92)",
  "rank-3": "rgba(205, 127, 50, 0.92)",
  legend: "rgba(252, 211, 77, 0.92)",
  elite: "rgba(192, 132, 252, 0.92)",
  pro: "rgba(0, 245, 255, 0.92)",
  analyst: "rgba(168, 255, 42, 0.92)",
  rising: "rgba(251, 146, 60, 0.92)",
  "streak-1": "rgba(204, 255, 0, 0.92)",
  "streak-2": "rgba(204, 255, 0, 0.92)",
  "streak-3": "rgba(34, 211, 238, 0.92)",
  "streak-4": "rgba(248, 113, 113, 0.92)",
};

const ACCENT_FRAME_DIM: Record<KinetikProfileAccentKey, string> = {
  default: "rgba(255, 255, 255, 0.28)",
  "rank-1": "rgba(255, 214, 90, 0.22)",
  "rank-2": "rgba(184, 196, 216, 0.22)",
  "rank-3": "rgba(205, 127, 50, 0.22)",
  legend: "rgba(252, 211, 77, 0.22)",
  elite: "rgba(192, 132, 252, 0.22)",
  pro: "rgba(0, 245, 255, 0.22)",
  analyst: "rgba(168, 255, 42, 0.22)",
  rising: "rgba(251, 146, 60, 0.22)",
  "streak-1": "rgba(204, 255, 0, 0.22)",
  "streak-2": "rgba(204, 255, 0, 0.22)",
  "streak-3": "rgba(34, 211, 238, 0.22)",
  "streak-4": "rgba(248, 113, 113, 0.22)",
};

export type AtmosShapePalette = {
  /** 六角 stroke — `rgba(${rgb},opacity)` 用の "r,g,b" */
  hexStrokes: readonly string[];
  /** HUD 主色 — `rgba(r,g,b,` まで（opacity は呼び出し側） */
  hudPrimary: string;
  /** HUD 副色 */
  hudSecondary: string;
};

function parseRgbTriplet(rgba: string): string {
  const m = rgba.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!m) return "129,140,248";
  return `${m[1]},${m[2]},${m[3]}`;
}

function mixTriplet(a: string, b: string, t: number): string {
  const pa = a.split(",").map(Number);
  const pb = b.split(",").map(Number);
  return pa
    .map((v, i) => Math.round(v + (pb[i]! - v) * t))
    .join(",");
}

/** 枠 accent から図形用パレットを生成 */
export function getAtmosShapePalette(accent: KinetikProfileAccentKey): AtmosShapePalette {
  const strong = parseRgbTriplet(ACCENT_FRAME_STRONG[accent] ?? ACCENT_FRAME_STRONG.default);
  const dim = parseRgbTriplet(ACCENT_FRAME_DIM[accent] ?? ACCENT_FRAME_DIM.default);
  const mid = mixTriplet(strong, dim, 0.45);
  const bright = mixTriplet(strong, "255,255,255", 0.18);

  return {
    hexStrokes: [strong, mid, dim, strong, bright, mid],
    hudPrimary: `rgba(${strong},`,
    hudSecondary: `rgba(${dim},`,
  };
}
