/**
 * Pro futuristic 背景の共有テーマ（Web / Native 共通）。
 */

export const FUTURISTIC_BG_THEME = {
  background: "#020305",
  navy: "#050c14",
  deepNavy: "#0a1624",

  cyan: "#22d3ee",
  blue: "#3b82f6",
  purple: "#a78bfa",
  magenta: "#e879f9",

  white: {
    soft: "rgba(236, 254, 255, 0.85)",
    mid: "rgba(236, 254, 255, 0.55)",
    faint: "rgba(236, 254, 255, 0.28)",
    whisper: "rgba(236, 254, 255, 0.12)",
  },

  cyanAlpha: {
    strong: "rgba(34, 211, 238, 0.55)",
    mid: "rgba(34, 211, 238, 0.35)",
    soft: "rgba(34, 211, 238, 0.22)",
    dim: "rgba(34, 211, 238, 0.12)",
    faint: "rgba(34, 211, 238, 0.06)",
  },
  blueAlpha: {
    mid: "rgba(59, 130, 246, 0.35)",
    soft: "rgba(59, 130, 246, 0.18)",
    dim: "rgba(59, 130, 246, 0.1)",
  },
  purpleAlpha: {
    mid: "rgba(167, 139, 250, 0.35)",
    soft: "rgba(167, 139, 250, 0.2)",
    dim: "rgba(167, 139, 250, 0.1)",
  },
  magentaAlpha: {
    mid: "rgba(232, 121, 249, 0.35)",
    soft: "rgba(232, 121, 249, 0.18)",
    dim: "rgba(232, 121, 249, 0.1)",
  },
} as const;

export const FUTURISTIC_BG_PREVIEW_CARD = {
  width: 320,
  height: 440,
} as const;

export const FUTURISTIC_BG_VARIANT_META = [
  { id: "eclipse", name: "EclipseBackground" },
  { id: "data-stream", name: "DataStreamBackground" },
] as const;

export type FuturisticBgVariantId =
  (typeof FUTURISTIC_BG_VARIANT_META)[number]["id"];
