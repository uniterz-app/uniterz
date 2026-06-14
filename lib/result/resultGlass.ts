/**
 * リザルト画面のガラストークン。
 * 装飾を削ぎ落としたニュートラルな曇りガラス + 深い浮遊影で構成する。
 * ネオン・HUD装飾は使わず、状態は縁色と微かな残光だけで表現する。
 */

import { normalizeWinStreak } from "@/lib/ui/winStreakBadge";

export type ResultCardBadge = "hit" | "perfect" | "upset" | "miss" | "streak" | null;

/** HIT / PERFECT 用の角切り枠を付けるバッジか */
export function isResultWinFrameBadge(badge: ResultCardBadge): boolean {
  return badge === "hit" || badge === "perfect";
}

export function isResultHitFrameBadge(badge: ResultCardBadge): boolean {
  return badge === "hit";
}

export function isResultPerfectFrameBadge(badge: ResultCardBadge): boolean {
  return badge === "perfect";
}

export function isResultStreakFrameBadge(badge: ResultCardBadge): boolean {
  return badge === "streak";
}

export function isResultUpsetFrameBadge(badge: ResultCardBadge): boolean {
  return badge === "upset";
}

/** 角切りシェル（丸角なし）を使う outcome バッジか */
export function isResultCyberClipFrameBadge(badge: ResultCardBadge): boolean {
  return (
    isResultWinFrameBadge(badge) ||
    isResultStreakFrameBadge(badge) ||
    isResultUpsetFrameBadge(badge) ||
    badge === "miss"
  );
}

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
    "relative overflow-hidden",
    RESULT_HIT_CYBER_CLIP,
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
      frameBorder: "",
      edge: "border-red-400/45",
      shadow: RESULT_UPSET_FRAME_SHELL_SHADOW,
    };
  }
  if (badge === "streak") {
    const tokens = resultStreakFrameTokens(activeWinStreak);
    if (!tokens) return { edge: "", shadow: "" };
    return {
      frameBorder: "",
      edge: tokens.edge,
      shadow: tokens.shellShadow,
    };
  }
  if (badge === "hit") {
    return {
      frameBorder: "",
      edge: "border-yellow-300/40",
      shadow: RESULT_HIT_FRAME_SHELL_SHADOW,
    };
  }
  if (badge === "perfect") {
    return {
      frameBorder: "",
      edge: "border-violet-300/45",
      shadow: RESULT_PERFECT_FRAME_SHELL_SHADOW,
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
  const tokens = resultStreakFrameTokens(activeWinStreak);
  if (!tokens) return null;
  return { sweepClass: tokens.sweepClass };
}

export type ResultStreakFrameTokens = {
  tier: ResultStreakTier;
  frameBorder: string;
  frameGlow: string;
  shellShadow: string;
  topLine: string;
  overlayGradient: string;
  cornerClass: string;
  sweepClass: string;
  edge: string;
};

/** 連勝ティア別のサイバー枠トークン */
export function resultStreakFrameTokens(
  activeWinStreak: unknown
): ResultStreakFrameTokens | null {
  const tier = resultStreakTier(activeWinStreak);
  if (!tier) return null;

  if (tier === "gold") {
    return {
      tier,
      frameBorder: "border border-amber-400/88",
      frameGlow:
        "shadow-[0_0_14px_rgba(251,191,36,0.48),0_0_28px_-8px_rgba(249,115,22,0.34),inset_0_0_0_1px_rgba(253,224,71,0.52),inset_0_1px_0_rgba(255,237,180,0.34)]",
      shellShadow:
        "shadow-[0_2px_10px_rgba(0,0,0,0.28),0_28px_64px_-16px_rgba(0,0,0,0.60),0_0_16px_rgba(251,191,36,0.38),0_0_32px_-10px_rgba(249,115,22,0.26),inset_0_0_0_1px_rgba(253,224,71,0.46),inset_0_1px_0_rgba(255,237,180,0.28)]",
      topLine:
        "bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.92)_38%,rgba(253,224,71,0.95)_58%,transparent_100%)]",
      overlayGradient:
        "bg-[linear-gradient(180deg,rgba(251,191,36,0.2)_0%,rgba(249,115,22,0.1)_42%,transparent_70%)]",
      cornerClass: "border-amber-300/92",
      sweepClass: "result-card-streak-sweep--gold",
      edge: "border-amber-300/50",
    };
  }

  if (tier === "platinum") {
    return {
      tier,
      frameBorder: "border border-cyan-400/86",
      frameGlow:
        "shadow-[0_0_14px_rgba(34,211,238,0.44),0_0_28px_-8px_rgba(0,245,255,0.3),inset_0_0_0_1px_rgba(103,232,249,0.5),inset_0_1px_0_rgba(186,250,255,0.32)]",
      shellShadow:
        "shadow-[0_2px_10px_rgba(0,0,0,0.28),0_28px_64px_-16px_rgba(0,0,0,0.60),0_0_16px_rgba(34,211,238,0.36),0_0_32px_-10px_rgba(0,245,255,0.24),inset_0_0_0_1px_rgba(103,232,249,0.44),inset_0_1px_0_rgba(186,250,255,0.26)]",
      topLine:
        "bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.9)_38%,rgba(125,211,252,0.95)_58%,transparent_100%)]",
      overlayGradient:
        "bg-[linear-gradient(180deg,rgba(34,211,238,0.18)_0%,rgba(8,145,178,0.1)_42%,transparent_70%)]",
      cornerClass: "border-cyan-300/90",
      sweepClass: "result-card-streak-sweep--platinum",
      edge: "border-cyan-300/48",
    };
  }

  return {
    tier: "silver",
    frameBorder: "border border-slate-300/82",
    frameGlow:
      "shadow-[0_0_12px_rgba(148,163,184,0.38),0_0_24px_-8px_rgba(100,116,139,0.28),inset_0_0_0_1px_rgba(226,232,240,0.48),inset_0_1px_0_rgba(248,250,252,0.3)]",
    shellShadow:
      "shadow-[0_2px_10px_rgba(0,0,0,0.28),0_28px_64px_-16px_rgba(0,0,0,0.60),0_0_14px_rgba(148,163,184,0.32),0_0_28px_-10px_rgba(100,116,139,0.2),inset_0_0_0_1px_rgba(226,232,240,0.42),inset_0_1px_0_rgba(248,250,252,0.24)]",
    topLine:
      "bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.88)_38%,rgba(226,232,240,0.92)_58%,transparent_100%)]",
    overlayGradient:
      "bg-[linear-gradient(180deg,rgba(148,163,184,0.16)_0%,rgba(71,85,105,0.08)_42%,transparent_70%)]",
    cornerClass: "border-slate-200/88",
    sweepClass: "result-card-streak-sweep--silver",
    edge: "border-slate-200/45",
  };
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

/** HIT カード：角切りクリップ（丸角なし） */
export const RESULT_HIT_CYBER_CLIP = "result-hit-cyber-clip";

/** HIT バッジ：小さめ角切り */
export const RESULT_HIT_CYBER_CLIP_SM = "result-hit-cyber-clip-sm";

const RESULT_CYBER_BADGE_BASE =
  "pointer-events-auto shrink-0 rounded-none font-bold uppercase backdrop-blur-md";

function resultCyberBadgeSize(
  compact: boolean,
  subtle?: boolean
): string {
  if (subtle) {
    return compact
      ? "text-[8px] px-2 py-0.5 tracking-[0.12em]"
      : "text-[9px] px-2.5 py-0.5 tracking-[0.12em]";
  }
  return compact
    ? "text-[9px] px-2.5 py-[3px] tracking-[0.14em]"
    : "text-[10px] px-3 py-[3px] tracking-[0.14em]";
}

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

/** PERFECT カード外枠（1px） */
export const RESULT_PERFECT_FRAME_BORDER = "border border-violet-400/80";

/** PERFECT 枠オーバーレイ */
export const RESULT_PERFECT_FRAME_GLOW =
  "shadow-[0_0_12px_rgba(167,139,250,0.42),0_0_24px_-8px_rgba(139,92,246,0.3),inset_0_0_0_1px_rgba(196,181,253,0.48),inset_0_1px_0_rgba(221,214,254,0.3)]";

/** PERFECT シェル影 */
export const RESULT_PERFECT_FRAME_SHELL_SHADOW =
  "shadow-[0_2px_10px_rgba(0,0,0,0.28),0_28px_64px_-16px_rgba(0,0,0,0.60),0_0_14px_rgba(167,139,250,0.34),0_0_28px_-10px_rgba(139,92,246,0.22),inset_0_0_0_1px_rgba(196,181,253,0.42),inset_0_1px_0_rgba(221,214,254,0.24)]";

/** PERFECT カード上部のハイライトライン */
export const RESULT_PERFECT_TOP_LINE =
  "bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.95)_42%,rgba(216,180,254,0.88)_58%,transparent_100%)]";

/** PERFECT カード内側のパープルティント */
export const RESULT_PERFECT_OVERLAY_GRADIENT =
  "bg-[linear-gradient(180deg,rgba(167,139,250,0.18)_0%,rgba(124,58,237,0.1)_42%,transparent_70%)]";

/** UPSET カード外枠（1px） */
export const RESULT_UPSET_FRAME_BORDER = "border border-red-500/82";

/** UPSET 枠オーバーレイ */
export const RESULT_UPSET_FRAME_GLOW =
  "shadow-[0_0_12px_rgba(248,113,113,0.44),0_0_24px_-8px_rgba(239,68,68,0.3),inset_0_0_0_1px_rgba(252,165,165,0.48),inset_0_1px_0_rgba(254,202,202,0.3)]";

/** UPSET シェル影 */
export const RESULT_UPSET_FRAME_SHELL_SHADOW =
  "shadow-[0_2px_10px_rgba(0,0,0,0.28),0_28px_64px_-16px_rgba(0,0,0,0.60),0_0_14px_rgba(248,113,113,0.34),0_0_28px_-10px_rgba(239,68,68,0.22),inset_0_0_0_1px_rgba(252,165,165,0.42),inset_0_1px_0_rgba(254,202,202,0.24)]";

/** UPSET カード上部のハイライトライン */
export const RESULT_UPSET_TOP_LINE =
  "bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.92)_42%,rgba(252,165,165,0.88)_58%,transparent_100%)]";

/** UPSET カード内側のレッドティント */
export const RESULT_UPSET_OVERLAY_GRADIENT =
  "bg-[linear-gradient(180deg,rgba(248,113,113,0.18)_0%,rgba(185,28,28,0.1)_42%,transparent_70%)]";

/** HIT バッジ：ゴールド・サイバー角切り */
export function resultHitBadgeClass(
  compact: boolean,
  opts?: { subtle?: boolean }
): string {
  const subtle = opts?.subtle === true;
  return [
    RESULT_CYBER_BADGE_BASE,
    RESULT_HIT_CYBER_CLIP_SM,
    resultCyberBadgeSize(compact, subtle),
    "border border-amber-400/62",
    "bg-[linear-gradient(180deg,rgba(251,191,36,0.3)_0%,rgba(120,53,15,0.16)_40%,rgba(0,0,0,0.42)_100%)]",
    "text-amber-50",
    subtle
      ? "shadow-[inset_3px_0_0_rgba(253,224,71,0.5),inset_0_1px_0_rgba(255,255,255,0.16),0_0_10px_rgba(251,191,36,0.24)]"
      : "shadow-[inset_3px_0_0_rgba(253,224,71,0.58),inset_0_1px_0_rgba(255,255,255,0.2),0_0_12px_rgba(251,191,36,0.3)]",
  ].join(" ");
}

/** PERFECT バッジ：スコア完全一致 — バイオレット・サイバー角切り */
export function resultPerfectBadgeClass(
  compact: boolean,
  opts?: { subtle?: boolean }
): string {
  const subtle = opts?.subtle === true;
  const size = subtle
    ? compact
      ? "text-[7px] px-2 py-0.5 tracking-[0.06em]"
      : "text-[8px] px-2.5 py-0.5 tracking-[0.08em]"
    : compact
      ? "text-[8px] px-2.5 py-[3px] tracking-[0.08em]"
      : "text-[9px] px-3 py-[3px] tracking-[0.1em]";

  return [
    RESULT_CYBER_BADGE_BASE,
    RESULT_HIT_CYBER_CLIP_SM,
    size,
    "border border-violet-400/78",
    "bg-[linear-gradient(180deg,rgba(167,139,250,0.4)_0%,rgba(124,58,237,0.34)_44%,rgba(30,27,75,0.48)_100%)]",
    "text-violet-50",
    subtle
      ? "shadow-[inset_3px_0_0_rgba(196,181,253,0.6),inset_0_1px_0_rgba(255,255,255,0.18),0_0_12px_rgba(167,139,250,0.32)]"
      : "shadow-[inset_3px_0_0_rgba(216,180,254,0.68),inset_0_1px_0_rgba(255,255,255,0.22),0_0_14px_rgba(139,92,246,0.36)]",
  ].join(" ");
}

/** MISS バッジ：スレート・サイバー角切り */
export function resultMissBadgeClass(
  compact: boolean,
  opts?: { subtle?: boolean }
): string {
  const subtle = opts?.subtle === true;
  return [
    RESULT_CYBER_BADGE_BASE,
    RESULT_HIT_CYBER_CLIP_SM,
    resultCyberBadgeSize(compact, subtle),
    "border border-slate-400/50",
    "bg-[linear-gradient(180deg,rgba(148,163,184,0.26)_0%,rgba(71,85,105,0.16)_42%,rgba(0,0,0,0.44)_100%)]",
    "text-slate-100",
    subtle
      ? "shadow-[inset_3px_0_0_rgba(148,163,184,0.42),inset_0_1px_0_rgba(255,255,255,0.12),0_0_8px_rgba(100,116,139,0.2)]"
      : "shadow-[inset_3px_0_0_rgba(148,163,184,0.5),inset_0_1px_0_rgba(255,255,255,0.14),0_0_10px_rgba(100,116,139,0.24)]",
  ].join(" ");
}

/** UPSET バッジ：レッド・サイバー角切り（HIT / PERFECT と同系） */
export function resultUpsetBadgeClass(
  compact: boolean,
  opts?: { subtle?: boolean }
): string {
  const subtle = opts?.subtle === true;
  return [
    RESULT_CYBER_BADGE_BASE,
    RESULT_HIT_CYBER_CLIP_SM,
    resultCyberBadgeSize(compact, subtle),
    "border border-red-400/72",
    "bg-[linear-gradient(180deg,rgba(248,113,113,0.38)_0%,rgba(185,28,28,0.34)_44%,rgba(69,10,10,0.48)_100%)]",
    "text-red-50",
    subtle
      ? "shadow-[inset_3px_0_0_rgba(252,165,165,0.58),inset_0_1px_0_rgba(255,255,255,0.16),0_0_12px_rgba(239,68,68,0.28)]"
      : "shadow-[inset_3px_0_0_rgba(254,202,202,0.65),inset_0_1px_0_rgba(255,255,255,0.2),0_0_14px_rgba(239,68,68,0.36)]",
  ].join(" ");
}

/** LIVE バッジ：レッド・サイバー角切り（HIT / MISS / UPSET と同系） */
export function resultLiveBadgeClass(
  compact: boolean,
  opts?: { subtle?: boolean }
): string {
  const subtle = opts?.subtle === true;
  return [
    RESULT_CYBER_BADGE_BASE,
    RESULT_HIT_CYBER_CLIP_SM,
    resultCyberBadgeSize(compact, subtle),
    "border border-red-500/78",
    "bg-[linear-gradient(180deg,rgba(239,68,68,0.4)_0%,rgba(185,28,28,0.36)_44%,rgba(69,10,10,0.5)_100%)]",
    "text-red-50",
    subtle
      ? "shadow-[inset_3px_0_0_rgba(252,165,165,0.55),inset_0_1px_0_rgba(255,255,255,0.14),0_0_8px_rgba(239,68,68,0.22)]"
      : "shadow-[inset_3px_0_0_rgba(254,202,202,0.62),inset_0_1px_0_rgba(255,255,255,0.18),0_0_10px_rgba(239,68,68,0.28)]",
  ].join(" ");
}

function resultStreakBadgeSize(
  compact: boolean,
  subtle?: boolean
): string {
  if (subtle) {
    return compact
      ? "text-[9px] px-2.5 py-0.5 tracking-[0.1em]"
      : "text-[10px] px-3 py-0.5 tracking-[0.11em]";
  }
  return compact
    ? "text-[10px] px-3 py-1 tracking-[0.11em]"
    : "text-[11px] px-3.5 py-1 tracking-[0.12em]";
}

/** 連勝バッジ：ティア別サイバー角切り（HIT より大きく・明るく） */
export function resultStreakBadgeClass(
  activeWinStreak: unknown,
  compact: boolean,
  opts?: { subtle?: boolean }
): string | null {
  const tier = resultStreakTier(activeWinStreak);
  if (!tier) return null;

  const subtle = opts?.subtle === true;
  const size = resultStreakBadgeSize(compact, subtle);
  const shell = [
    RESULT_CYBER_BADGE_BASE,
    RESULT_HIT_CYBER_CLIP_SM,
    "inline-flex max-w-full min-w-0 items-center",
    compact ? "gap-1" : "gap-1.5",
    size,
  ];

  if (tier === "gold") {
    return [
      ...shell,
      "border border-amber-300/84",
      "bg-[linear-gradient(180deg,rgba(251,191,36,0.52)_0%,rgba(234,88,12,0.38)_48%,rgba(69,26,3,0.5)_100%)]",
      "text-amber-50",
      "shadow-[inset_3px_0_0_rgba(255,237,180,0.72),inset_0_1px_0_rgba(255,255,255,0.24),0_0_16px_rgba(251,191,36,0.42),0_0_28px_-4px_rgba(249,115,22,0.28)]",
    ].join(" ");
  }

  if (tier === "platinum") {
    return [
      ...shell,
      "border border-cyan-300/82",
      "bg-[linear-gradient(180deg,rgba(34,211,238,0.46)_0%,rgba(8,145,178,0.36)_48%,rgba(15,23,42,0.5)_100%)]",
      "text-cyan-50",
      "shadow-[inset_3px_0_0_rgba(186,250,255,0.68),inset_0_1px_0_rgba(255,255,255,0.22),0_0_16px_rgba(34,211,238,0.38),0_0_28px_-4px_rgba(0,245,255,0.26)]",
    ].join(" ");
  }

  return [
    ...shell,
    "border border-slate-200/78",
    "bg-[linear-gradient(180deg,rgba(226,232,240,0.34)_0%,rgba(100,116,139,0.28)_48%,rgba(15,23,42,0.5)_100%)]",
    "text-slate-50",
    "shadow-[inset_3px_0_0_rgba(248,250,252,0.62),inset_0_1px_0_rgba(255,255,255,0.2),0_0_14px_rgba(148,163,184,0.34),0_0_24px_-4px_rgba(100,116,139,0.22)]",
  ].join(" ");
}

export function resultStreakBadgeIconClass(
  activeWinStreak: unknown
): string {
  const tier = resultStreakTier(activeWinStreak);
  if (tier === "gold") return "text-amber-200";
  if (tier === "platinum") return "text-cyan-100";
  return "text-slate-100";
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
