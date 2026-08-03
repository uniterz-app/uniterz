/**
 * SQUAD BATTLE — GOLD LEGION ビジュアルトークン。
 * A 方針（黒鉄 × 金箔）。機能ロジックとは独立。
 */

export const SQUAD_GOLD = {
  bg: "#0A0805",
  panelGrad:
    "linear-gradient(164deg, rgba(38,28,10,0.92) 0%, rgba(12,9,4,0.99) 55%)",
  panelFlat: "rgba(24,18,7,0.92)",
  sheen: "rgba(255,236,179,0.14)",
  line: "rgba(251,191,36,0.42)",
  lineSoft: "rgba(251,191,36,0.18)",
  ink: "#FFF7E0",
  mut: "#C9B27E",
  mutFaint: "rgba(201,178,126,0.5)",
  acc: "#FBBF24",
  accDeep: "#B45309",
  accOn: "#1A1002",
  /** CSS / RN 共通のグロー用 */
  glowRgb: "251,191,36",
  up: "#FDE68A",
  down: "#B45309",
  /** 既存コード互換エイリアス */
  amber: "#FBBF24",
} as const;

/** 10px 角切り（GOLD LEGION） */
export const SQUAD_GOLD_CHAMFER =
  "polygon(10px 0%, 100% 0%, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0% 100%, 0% 10px)";

/** 六角メダリオン（アバター） */
export const SQUAD_GOLD_MEDALLION =
  "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

export const squadGoldGlow = (alpha = 0.35) =>
  `0 0 18px rgba(${SQUAD_GOLD.glowRgb},${alpha})`;

export const squadGoldTextShadow = (alpha = 0.4) =>
  `0 0 16px rgba(${SQUAD_GOLD.glowRgb},${alpha})`;

/** Native StyleSheet 向けの色だけ抜き出し */
export const SQUAD_GOLD_NATIVE = {
  bg: SQUAD_GOLD.bg,
  panel: "#181207",
  line: "rgba(251,191,36,0.42)",
  lineSoft: "rgba(251,191,36,0.18)",
  ink: SQUAD_GOLD.ink,
  mut: SQUAD_GOLD.mut,
  acc: SQUAD_GOLD.acc,
  accDeep: SQUAD_GOLD.accDeep,
  accOn: SQUAD_GOLD.accOn,
  up: SQUAD_GOLD.up,
  down: SQUAD_GOLD.down,
  glow: SQUAD_GOLD.acc,
} as const;
