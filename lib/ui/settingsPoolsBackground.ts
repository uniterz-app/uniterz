/**
 * 設定画面（SETTINGS）採用背景 — プレビュー `dual-pool` / Pools。
 * Web は CSS クラス、Native は SettingsPoolsBackdropNative で同等表現。
 */

export const SETTINGS_POOLS_BG_BASE = "#050b14";

/** CSS `background-image` レイヤー（下ほど後ろ） */
export const SETTINGS_POOLS_BG_IMAGE = [
  "radial-gradient(ellipse 48% 38% at 12% 78%, rgba(0,245,255,0.1), transparent 62%)",
  "radial-gradient(ellipse 52% 40% at 92% 88%, rgba(167,139,250,0.12), transparent 65%)",
  "radial-gradient(ellipse 62% 32% at 50% -10%, rgba(34,211,238,0.08), transparent 60%)",
].join(", ");

/** globals.css のクラス名 */
export const SETTINGS_POOLS_BG_CLASS = "settings-bg-pools";
