import type { CSSProperties } from "react";

/** 予想オーバーレイ用 HUD トークン（参照デザインのシアン枠・角ブラケット・フラットパネル） */
export const PREDICT_HUD_HAIRLINE = "rgba(34,211,238,0.22)";

export const PREDICT_HUD_SHELL_CLASS = [
  "relative w-full overflow-hidden",
  "border border-cyan-400/32",
  "bg-[linear-gradient(165deg,rgba(14,24,38,0.94)_0%,rgba(8,13,24,0.97)_52%,rgba(5,9,16,0.99)_100%)]",
  "shadow-[0_20px_52px_rgba(0,0,0,0.58),0_0_28px_rgba(34,211,238,0.09),inset_0_1px_0_rgba(34,211,238,0.2)]",
].join(" ");

export const PREDICT_HUD_PANEL_CLASS =
  "relative w-full overflow-hidden border border-cyan-400/20 bg-[rgba(7,12,22,0.58)] px-4 py-3.5";

export const PREDICT_HUD_PANEL_COMPACT_CLASS =
  "relative w-full overflow-hidden border border-cyan-400/20 bg-[rgba(7,12,22,0.58)] px-3 py-2.5";

export const PREDICT_HUD_TAB_DECK_CLASS = [
  "grid grid-cols-3 overflow-hidden",
  "border border-cyan-400/28 bg-[rgba(6,11,20,0.72)]",
  "divide-x divide-cyan-400/18",
].join(" ");

export function predictHudTabButtonClass(
  active: boolean,
  disabled = false
): string {
  if (disabled) {
    return "flex h-full w-full items-center justify-center px-1.5 text-xs font-semibold text-white/28 cursor-not-allowed sm:text-sm";
  }
  return [
    "flex h-full w-full items-center justify-center px-1.5 font-bold transition-[color,background,box-shadow] duration-200",
    active
      ? "bg-[rgba(0,245,255,0.12)] text-cyan-50 shadow-[inset_0_0_20px_rgba(0,245,255,0.14),0_0_12px_rgba(0,245,255,0.08)]"
      : "text-white/78 hover:bg-[rgba(0,245,255,0.06)] hover:text-white",
  ].join(" ");
}

export function predictHudTeamGlow(color: string): CSSProperties {
  return {
    textShadow: `0 0 16px ${color}aa, 0 0 6px rgba(255,255,255,0.42)`,
  };
}

export function predictHudClockGlow(): CSSProperties {
  return {
    textShadow:
      "0 0 22px rgba(34,211,238,0.55), 0 0 8px rgba(186,230,253,0.45)",
  };
}
