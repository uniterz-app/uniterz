/**
 * Web `GamesPageBackground` / Native `GamesPageBackgroundNative` 共通仕様。
 * Web の globals.css キーフレームと色値を単一ソースにする。
 */

export const GAMES_PAGE_BG_GRADIENT = {
  top: "#021208",
  mid: "#020e09",
  bottom: "#010805",
  locations: [0, 0.52, 1] as const,
} as const;

export const GAMES_PAGE_BG_TINTS = {
  green: {
    colors: ["#031810", "#02140c", "#020a07"] as const,
    locations: [0, 0.48, 1] as const,
  },
  blue: {
    colors: ["#021018", "#031228", "#020814"] as const,
    locations: [0, 0.52, 1] as const,
  },
  violet: {
    colors: ["#08051a", "#0c0818", "#060410"] as const,
    locations: [0, 0.52, 1] as const,
  },
} as const;

export const GAMES_PAGE_FIELD = {
  dotOpacityLite: 0.42,
  dotOpacity: 0.55,
  gridOpacityLite: 0.16,
  gridOpacity: 0.22,
  depthOpacityLite: 0.24,
  depthOpacity: 0.32,
  driftPx: 32,
  driftMsLite: 28000,
  driftMs: 20000,
} as const;

export const GAMES_AURORA_CYCLE_MS = 28000;
export const GAMES_AURORA_CYCLE_LITE_MS = 42000;

/** Web `auroraA` */
export function gamesAuroraPeak(lite: boolean): number {
  return lite ? 0.2 : 0.27;
}

export type AuroraRgbStops = [string, string, string];

export function gamesAuroraPhaseStops(lite: boolean): {
  green: AuroraRgbStops;
  blue: AuroraRgbStops;
  violet: AuroraRgbStops;
  amber: AuroraRgbStops;
} {
  const a = gamesAuroraPeak(lite);
  return {
    green: [
      `rgba(52,211,153,${a})`,
      `rgba(132,204,22,${lite ? 0.12 : 0.17})`,
      `rgba(45,212,191,${lite ? 0.15 : 0.2})`,
    ],
    blue: [
      `rgba(34,211,238,${a})`,
      `rgba(59,130,246,${lite ? 0.11 : 0.15})`,
      `rgba(14,165,233,${lite ? 0.13 : 0.17})`,
    ],
    violet: [
      `rgba(168,85,247,${lite ? 0.16 : 0.21})`,
      `rgba(217,70,239,${lite ? 0.1 : 0.13})`,
      `rgba(139,92,246,${lite ? 0.12 : 0.15})`,
    ],
    amber: [
      `rgba(251,191,36,${lite ? 0.13 : 0.16})`,
      `rgba(245,158,11,${lite ? 0.09 : 0.11})`,
      `rgba(251,146,60,${lite ? 0.11 : 0.14})`,
    ],
  };
}

/** Web globals.css `@keyframes gamesAuroraGreen` 等 */
export const GAMES_AURORA_OPACITY_KEYFRAMES = {
  green: {
    input: [0, 0.2, 0.28, 0.88, 0.96, 1],
    output: [1, 0.92, 0.03, 0.03, 0.88, 1],
  },
  blue: {
    input: [0, 0.16, 0.25, 0.38, 0.46, 1],
    output: [0.03, 0.03, 1, 1, 0.03, 0.03],
  },
  violet: {
    input: [0, 0.41, 0.5, 0.63, 0.71, 1],
    output: [0.03, 0.03, 1, 1, 0.03, 0.03],
  },
  amber: {
    input: [0, 0.66, 0.75, 0.88, 0.96, 1],
    output: [0.03, 0.03, 1, 1, 0.03, 0.03],
  },
} as const;

/** Web globals.css `@keyframes gamesBaseTint*` */
export const GAMES_BASE_TINT_OPACITY_KEYFRAMES = {
  green: {
    input: [0, 0.5, 1],
    output: [0.58, 0.16, 0.58],
  },
  blue: {
    input: [0, 0.5, 1],
    output: [0.12, 0.5, 0.12],
  },
  violet: {
    input: [0, 0.24, 0.5, 0.76, 1],
    output: [0.1, 0.1, 0.46, 0.1, 0.1],
  },
} as const;

/**
 * Web CSS radial-gradient 楕円配置（幅・高さは画面比、位置は左上基準）
 * ellipse 68% 50% at 14% 4% など
 */
export const GAMES_AURORA_BLOB_LAYOUT = [
  { cx: 0.14, cy: 0.04, w: 0.68, h: 0.5 },
  { cx: 0.88, cy: 0.18, w: 0.58, h: 0.46 },
  { cx: 0.5, cy: 1.08, w: 0.8, h: 0.44 },
] as const;

/** Web 上空ハイライト: ellipse 90% 55% at 50% -8% */
export const GAMES_TOP_HIGHLIGHT_LAYOUT = {
  cx: 0.5,
  cy: -0.08,
  w: 0.9,
  h: 0.55,
  color: "rgba(187,247,208,0.06)",
} as const;

export function gamesPageBgTintCss(kind: keyof typeof GAMES_PAGE_BG_TINTS): string {
  const tint = GAMES_PAGE_BG_TINTS[kind];
  const [c0, c1, c2] = tint.colors;
  const [l0, l1, l2] = tint.locations;
  const pct = (n: number) => `${Math.round(n * 100)}%`;
  return `linear-gradient(180deg, ${c0} ${pct(l0)}, ${c1} ${pct(l1)}, ${c2} ${pct(l2)})`;
}

export function gamesAuroraPhaseCss(stops: AuroraRgbStops): string {
  const [a, b, c] = stops;
  return `
    radial-gradient(ellipse 68% 50% at 14% 4%, ${a} 0%, transparent 66%),
    radial-gradient(ellipse 58% 46% at 88% 18%, ${b} 0%, transparent 68%),
    radial-gradient(ellipse 80% 44% at 50% 108%, ${c} 0%, transparent 70%)
  `;
}

export function gamesTopHighlightCss(): string {
  const { w, h, cx, cy, color } = GAMES_TOP_HIGHLIGHT_LAYOUT;
  return `radial-gradient(ellipse ${w * 100}% ${h * 100}% at ${cx * 100}% ${cy * 100}%, ${color} 0%, transparent 70%)`;
}
