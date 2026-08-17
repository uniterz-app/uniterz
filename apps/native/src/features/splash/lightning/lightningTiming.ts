/**
 * 雷スプラッシュのタイムライン定数（合計 2400ms）。
 * progress 0→1 は線形。雷点滅は別 SharedValue で駆動。
 */

export const LIGHTNING_SPLASH = {
  bg: "#010306",
  accent: "#7EC8FF",
  accentCore: "#FFFFFF",
  accentCyan: "#A8E4FF",
  flashTint: "rgba(200, 230, 255, 1)",
  totalMs: 2400,

  /** 暗い序盤 */
  darkEndMs: 350,

  /** プレストライク */
  preStrikeMs: 350,
  preStrikeDurationMs: 55,

  /** メイン落雷ウィンドウ */
  mainStartMs: 580,
  mainEndMs: 1400,

  /** ロゴ完全出現の安定開始 */
  logoSettleMs: 1400,

  /** 最終ホールド */
  holdMs: 500,
} as const;

/** progress (0..1) 換算 */
export const LIGHTNING_T = {
  darkEnd: LIGHTNING_SPLASH.darkEndMs / LIGHTNING_SPLASH.totalMs,
  preStrike: LIGHTNING_SPLASH.preStrikeMs / LIGHTNING_SPLASH.totalMs,
  preStrikeEnd:
    (LIGHTNING_SPLASH.preStrikeMs + LIGHTNING_SPLASH.preStrikeDurationMs) /
    LIGHTNING_SPLASH.totalMs,
  mainStart: LIGHTNING_SPLASH.mainStartMs / LIGHTNING_SPLASH.totalMs,
  mainEnd: LIGHTNING_SPLASH.mainEndMs / LIGHTNING_SPLASH.totalMs,
  logoSettle: LIGHTNING_SPLASH.logoSettleMs / LIGHTNING_SPLASH.totalMs,
} as const;

/**
 * メイン落雷の不規則点滅シーケンス（ms）。
 * 一定周期にしない。
 */
export const MAIN_BOLT_FLICKER: readonly {
  on: boolean;
  durationMs: number;
}[] = [
  { on: true, durationMs: 50 },
  { on: false, durationMs: 30 },
  { on: true, durationMs: 25 },
  { on: false, durationMs: 40 },
  { on: true, durationMs: 70 },
  { on: false, durationMs: 22 },
  { on: true, durationMs: 35 },
  { on: false, durationMs: 55 },
  { on: true, durationMs: 45 },
  { on: false, durationMs: 28 },
  { on: true, durationMs: 60 },
  { on: false, durationMs: 90 },
  { on: true, durationMs: 30 },
  { on: false, durationMs: 200 },
  { on: true, durationMs: 40 },
  { on: false, durationMs: 0 },
] as const;
