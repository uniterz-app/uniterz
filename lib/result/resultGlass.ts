/**
 * リザルト画面のガラストークン。
 * 装飾を削ぎ落としたニュートラルな曇りガラス + 深い浮遊影で構成する。
 * ネオン・HUD装飾は使わず、状態は縁色と微かな残光だけで表現する。
 */

import { normalizeWinStreak } from "@/lib/ui/winStreakBadge";

export type ResultCardBadge = "hit" | "upset" | "miss" | "streak" | null;

/** winStreakBadge と同じ3段階（3–4: シルバー / 5–6: プラチナ / 7+: ゴールド） */
export type ResultStreakTier = "silver" | "platinum" | "gold";

export function resultStreakTier(
  activeWinStreak: unknown
): ResultStreakTier | null {
  const v = normalizeWinStreak(activeWinStreak);
  if (v >= 7) return "gold";
  if (v >= 5) return "platinum";
  if (v >= 3) return "silver";
  return null;
}

/** ガラス面の塗り（ニュートラル・無彩色） */
export const RESULT_GLASS_FILL =
  "bg-[linear-gradient(172deg,rgba(255,255,255,0.09)_0%,rgba(255,255,255,0.04)_40%,rgba(255,255,255,0.015)_100%)] backdrop-blur-2xl";

/** モバイル向け：ブラー強度をやや抑える */
export const RESULT_GLASS_FILL_MOBILE =
  "bg-[linear-gradient(172deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.035)_45%,rgba(255,255,255,0.015)_100%)] backdrop-blur-xl";

export const RESULT_GLASS_BORDER = "border border-white/10";

/** 浮遊感：接地影 + 深いアンビエント + 上辺ハイライトのみ。色は混ぜない */
export const RESULT_GLASS_SHADOW =
  "shadow-[0_2px_10px_rgba(0,0,0,0.28),0_28px_64px_-16px_rgba(0,0,0,0.60),inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-1px_0_rgba(255,255,255,0.03)]";

/** Web ホバー時のリフト影 */
export const RESULT_GLASS_SHADOW_HOVER =
  "hover:shadow-[0_6px_16px_rgba(0,0,0,0.30),0_40px_84px_-16px_rgba(0,0,0,0.66),inset_0_1px_0_rgba(255,255,255,0.16),inset_0_-1px_0_rgba(255,255,255,0.04)]";

/** 一覧カード用：ホバーリフト */
export const RESULT_GLASS_LIFT =
  "result-glass-lift transition-[transform,box-shadow] duration-300 ease-out md:hover:-translate-y-1";

/** 詳細パネル用シェル（角丸・オーバーフロー込み） */
export function resultDetailPanelClass(opts?: {
  padding?: string;
  minHeight?: string;
  mobile?: boolean;
}): string {
  const fill = opts?.mobile ? RESULT_GLASS_FILL_MOBILE : RESULT_GLASS_FILL;
  return [
    "relative overflow-hidden rounded-2xl",
    RESULT_GLASS_BORDER,
    fill,
    RESULT_GLASS_SHADOW,
    opts?.padding ?? "p-5",
    opts?.minHeight ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

/** 日付帯・チップ用の小型ガラス */
export const RESULT_GLASS_CHIP =
  "rounded-md border border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.09)_0%,rgba(255,255,255,0.03)_100%)] backdrop-blur-md shadow-[0_4px_18px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.10)]";

/** スタッツ区切り：無彩色のヘアライン */
export const RESULT_HAIRLINE =
  "h-px w-full bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.16)_50%,transparent_100%)]";

export type ResultBadgeAccent = {
  /** 内側オーバーレイ用の縁（二重枠の内側） */
  edge: string;
  /** パネル本体の border（未指定時は RESULT_GLASS_BORDER） */
  frameBorder?: string;
  shadow: string;
};

/**
 * 状態別の縁色と影。
 * frameBorder: カード外枠の色 / edge: 内側の補強 / shadow: 浮遊影 + 残光
 */
export function resultBadgeAccent(
  badge: ResultCardBadge,
  activeWinStreak = 0
): ResultBadgeAccent {
  if (badge === "upset") {
    return {
      edge: "",
      frameBorder: "border-2 border-red-500/75",
      shadow: "",
    };
  }
  if (badge === "streak") {
    const tier = resultStreakTier(activeWinStreak);
    if (tier === "gold") {
      return {
        edge: "",
        frameBorder: "border-2 border-amber-400/60",
        shadow: "",
      };
    }
    if (tier === "platinum") {
      return {
        edge: "",
        frameBorder: "border-2 border-cyan-400/55",
        shadow: "",
      };
    }
    if (tier === "silver") {
      return {
        edge: "",
        frameBorder: "border-2 border-slate-300/55",
        shadow: "",
      };
    }
  }
  if (badge === "hit") {
    return {
      // 枠は ResultHitCyberFrame の角切りオーバーレイで描画
      frameBorder: "",
      edge: "border-yellow-300/40",
      shadow: RESULT_HIT_FRAME_SHELL_SHADOW,
    };
  }
  if (badge === "miss") {
    return {
      frameBorder: "border border-white/8",
      edge: "border-white/6",
      shadow: "",
    };
  }
  return { edge: "", shadow: "" };
}

/** 連勝カード：枠を走る光のティア別クラス */
export function resultStreakShellAccent(activeWinStreak: unknown): {
  sweepClass: string;
} | null {
  const tier = resultStreakTier(activeWinStreak);
  if (!tier) return null;
  if (tier === "gold") {
    return { sweepClass: "result-card-streak-sweep--gold" };
  }
  if (tier === "platinum") {
    return { sweepClass: "result-card-streak-sweep--platinum" };
  }
  return { sweepClass: "result-card-streak-sweep--silver" };
}

/** UPSET：カード上部の目立つリボン（角バッジより視認性優先） */
export function resultUpsetRibbonClass(compact: boolean): string {
  return [
    "inline-flex items-center justify-center font-semibold uppercase text-red-100",
    "tracking-[0.28em]",
    "rounded-full",
    "border border-red-400/60",
    "bg-red-950/55 backdrop-blur-sm",
    "shadow-[0_2px_8px_rgba(0,0,0,0.35)]",
    compact ? "px-3 py-0.5 text-[9px]" : "px-4 py-1 text-[10px]",
  ].join(" ");
}

/** UPSET バッジ：HIT と同じ右上角（サイズ・形状を揃える） */
export function resultUpsetBadgeClass(compact: boolean): string {
  return [
    "pointer-events-auto shrink-0 rounded-full font-medium uppercase",
    "tracking-[0.14em]",
    "border border-red-300/45",
    "bg-[linear-gradient(180deg,rgba(248,113,113,0.22)_0%,rgba(0,0,0,0.42)_100%)]",
    "text-red-100/95",
    "backdrop-blur-md",
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_2px_6px_rgba(0,0,0,0.28)]",
    compact ? "text-[9px] px-2.5 py-[3px]" : "text-[10px] px-3 py-[3px]",
  ].join(" ");
}

/** HIT カード：角切りクリップ（丸角なし） */
export const RESULT_HIT_CYBER_CLIP = "result-hit-cyber-clip";

/** HIT バッジ：小さめ角切り */
export const RESULT_HIT_CYBER_CLIP_SM = "result-hit-cyber-clip-sm";

/** HIT カード外枠（1px） */
export const RESULT_HIT_FRAME_BORDER = "border border-yellow-400/76";

/** HIT 枠オーバーレイ：内側ハイライト + 控えめな外側グロー */
export const RESULT_HIT_FRAME_GLOW =
  "shadow-[0_0_11px_rgba(251,191,36,0.36),0_0_22px_-8px_rgba(253,224,71,0.24),inset_0_0_0_1px_rgba(253,224,71,0.42),inset_0_1px_0_rgba(253,224,71,0.26)]";

/** @deprecated ResultHitCyberFrame を使用 */
export const RESULT_HIT_FRAME_OVERLAY = [
  RESULT_HIT_CYBER_CLIP,
  RESULT_HIT_FRAME_BORDER,
  RESULT_HIT_FRAME_GLOW,
].join(" ");

/** ガラス面の rounded-2xl を HIT 用角切りに差し替え */
export function withResultHitCyberClip(glassClass: string): string {
  return glassClass.replace(/\brounded-2xl\b/, RESULT_HIT_CYBER_CLIP);
}

/** HIT シェル影：接地影 + 浅い外側グロー + inset */
export const RESULT_HIT_FRAME_SHELL_SHADOW =
  "shadow-[0_2px_10px_rgba(0,0,0,0.28),0_28px_64px_-16px_rgba(0,0,0,0.60),0_0_12px_rgba(251,191,36,0.30),0_0_24px_-10px_rgba(253,224,71,0.18),inset_0_0_0_1px_rgba(253,224,71,0.38),inset_0_1px_0_rgba(253,224,71,0.22)]";

/** HIT カード上部のハイライトライン */
export const RESULT_HIT_TOP_LINE =
  "bg-[linear-gradient(90deg,transparent_0%,rgba(253,224,71,0.92)_50%,transparent_100%)]";

/** HIT カード内側のゴールドティント（上部中心） */
export const RESULT_HIT_OVERLAY_GRADIENT =
  "bg-[linear-gradient(180deg,rgba(252,211,77,0.18)_0%,rgba(251,191,36,0.09)_42%,transparent_70%)]";

/** HIT バッジ：ゴールドチップ */
export function resultHitBadgeClass(
  compact: boolean,
  opts?: { subtle?: boolean }
): string {
  const subtle = opts?.subtle === true;
  return [
    "pointer-events-auto shrink-0 rounded-none font-semibold uppercase",
    RESULT_HIT_CYBER_CLIP_SM,
    subtle ? "tracking-[0.12em]" : "tracking-[0.14em]",
    "border border-yellow-300/70",
    "bg-[linear-gradient(180deg,rgba(253,224,71,0.42)_0%,rgba(251,191,36,0.20)_48%,rgba(0,0,0,0.38)_100%)]",
    "text-yellow-50",
    "backdrop-blur-md",
    subtle
      ? "shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_0_8px_rgba(251,191,36,0.22),0_1px_4px_rgba(0,0,0,0.24)]"
      : "shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_0_10px_rgba(251,191,36,0.28),0_2px_6px_rgba(0,0,0,0.28)]",
    subtle
      ? compact
        ? "text-[8px] px-2 py-0.5"
        : "text-[9px] px-2.5 py-0.5"
      : compact
        ? "text-[9px] px-2.5 py-[3px]"
        : "text-[10px] px-3 py-[3px]",
  ].join(" ");
}

/** 日付帯用ガラス */
export function resultDayStripPanelClass(isMobile: boolean): string {
  return [
    "group relative w-full overflow-hidden rounded-lg",
    RESULT_GLASS_BORDER,
    isMobile ? RESULT_GLASS_FILL_MOBILE : RESULT_GLASS_FILL,
    RESULT_GLASS_SHADOW,
    isMobile ? "px-3 py-2.5" : "px-4 py-3.5 sm:px-5",
  ].join(" ");
}
