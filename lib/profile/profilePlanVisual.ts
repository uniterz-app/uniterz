/** PRO プラン加入者プロフィールカード — Web / Native 共通ビジュアル定数 */

export const PROFILE_PLAN_PRO_CLASS = "profile-kinetik-panel--plan-pro";

/** PRO メトリクスカード共通クラス */
export const PROFILE_PLAN_PRO_METRIC_CARD_CLASS = "profile-plan-pro-metric-card";

export const PROFILE_PLAN_PRO_CYAN = "#22d3ee";
export const PROFILE_PLAN_PRO_PURPLE = "#a78bfa";

export const PROFILE_PLAN_PRO_FRAME = {
  strong: "rgba(34, 211, 238, 0.92)",
  border: "rgba(34, 211, 238, 0.38)",
  dim: "rgba(167, 139, 250, 0.28)",
} as const;

export const PROFILE_PLAN_PRO_SHADOW =
  "0 8px 28px rgba(0,0,0,0.42), 0 0 0 1px rgba(34,211,238,0.18), 0 0 24px rgba(34,211,238,0.22), 0 0 48px rgba(167,139,250,0.12)";

export const PROFILE_PLAN_PRO_NAME_GLOW =
  "drop-shadow(0 0 1px rgba(34,211,238,0.9)) drop-shadow(0 0 5px rgba(34,211,238,0.38)) drop-shadow(0 0 12px rgba(167,139,250,0.22))";

export const PROFILE_PLAN_PRO_AVATAR = {
  edge: PROFILE_PLAN_PRO_CYAN,
  soft: "rgba(34, 211, 238, 0.52)",
  mid: "rgba(34, 211, 238, 0.38)",
  dim: "rgba(167, 139, 250, 0.14)",
} as const;

/** Native 枠 shadow */
export const PROFILE_PLAN_PRO_NATIVE_SHADOW = {
  shadowColor: PROFILE_PLAN_PRO_CYAN,
  shadowOffset: { width: 0, height: 8 } as const,
  shadowOpacity: 0.35,
  shadowRadius: 20,
  elevation: 8,
} as const;

/** 背景アニメ周期（Web CSS / Native Reanimated 共通） */
export const PROFILE_PLAN_PRO_BG = {
  auroraPulseMs: 5000,
  /** atmos 図形 — 入場のみ（ループなし）。opacity + translateY（scale/filter なし） */
  atmosEnterMs: 680,
  atmosEnterHudDelayMs: 140,
  atmosEnterYOffsetPx: 14,
  /** scale は使わない（SVG 再ラスタでカクつく）。互換のため 1 固定 */
  atmosEnterScaleFrom: 1,
} as const;

/** Skia SweepGradient — 将来の枠演出用（プロフィールカードでは未使用） */
export const PROFILE_PLAN_PRO_BORDER_SWEEP = {
  paddingPx: 3,
  durationMs: 4800,
  colors: [
    "rgba(255,255,255,0)",
    "rgba(255,255,255,0)",
    "rgba(34,211,238,0.32)",
    "rgba(167,139,250,0.55)",
    "rgba(236,254,255,0.95)",
    "rgba(167,139,250,0.55)",
    "rgba(34,211,238,0.32)",
    "rgba(255,255,255,0)",
  ],
  positions: [0, 0.67, 0.73, 0.78, 0.82, 0.87, 0.93, 1],
} as const;
