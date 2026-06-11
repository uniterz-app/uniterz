"use client";

import clsx from "clsx";
import { useMemo } from "react";
import DotJerseyCanvas from "@/app/component/games/DotJerseyCanvas";

export type HalftoneJerseyMarkProps = {
  /** チーム主色（グラデーション開始側） */
  accent: string;
  /** チーム副色（指定時はドットを二色グラデーション） */
  accentEnd?: string;
  /** 枠のサイズ（従来の Jersey SVG と同じユーティリティを渡す） */
  className?: string;
  /** 試合カード用：ドットを裾から一度だけ現す */
  enableDotReveal?: boolean;
  /** ドット開幕のディレイ（ms） */
  dotRevealDelayMs?: number;
  /** ホログラム台座内：黒い落ち影を付けない */
  hologram?: boolean;
};

type Rgb = { r: number; g: number; b: number };

const DEFAULT_GLOW: Rgb = { r: 34, g: 211, b: 238 };

/** 1色分の hex → RGB（グロー用） */
function accentRgbForGlowSingle(accent: string): Rgb {
  const hex = accent.trim().replace(/^#/, "");
  let r = DEFAULT_GLOW.r;
  let g = DEFAULT_GLOW.g;
  let b = DEFAULT_GLOW.b;
  if (hex.length === 6) {
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
    if ([r, g, b].some((n) => Number.isNaN(n))) return { ...DEFAULT_GLOW };
  } else if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
    if ([r, g, b].some((n) => Number.isNaN(n))) return { ...DEFAULT_GLOW };
  }
  return { r, g, b };
}

/** グローは主色＋副色の中間（副色未指定時は主色のみ） */
function accentRgbForGlow(accent: string, accentEnd?: string): Rgb {
  const a = accentRgbForGlowSingle(accent);
  if (!accentEnd) return a;
  const b = accentRgbForGlowSingle(accentEnd);
  if (
    a.r === b.r &&
    a.g === b.g &&
    a.b === b.b
  ) {
    return a;
  }
  return {
    r: Math.round((a.r + b.r) / 2),
    g: Math.round((a.g + b.g) / 2),
    b: Math.round((a.b + b.b) / 2),
  };
}

/**
 * NBA / B1 向け：SVG ユニフォームの代わりに Canvas ドット表現を表示する。
 */
export default function HalftoneJerseyMark({
  accent,
  accentEnd,
  className,
  enableDotReveal = false,
  dotRevealDelayMs = 0,
  hologram = false,
}: HalftoneJerseyMarkProps) {
  const glowFilter = useMemo(() => {
    if (hologram) return "none";
    const { r, g, b } = accentRgbForGlow(accent, accentEnd);
    // ドット開幕中は canvas が毎フレーム更新されるため、filter 層は最小限に抑える
    return [
      `drop-shadow(0 0 4px rgba(${r},${g},${b},0.55))`,
      `drop-shadow(0 0 12px rgba(${r},${g},${b},0.26))`,
      "drop-shadow(0 1px 4px rgba(0,0,0,0.42))",
    ].join(" ");
  }, [accent, accentEnd, hologram]);

  return (
    <div
      className={clsx("relative shrink-0", className)}
      style={{ filter: glowFilter }}
      aria-hidden
    >
      <DotJerseyCanvas
        accent={accent}
        accentEnd={accentEnd}
        enableDotReveal={enableDotReveal}
        dotRevealDelayMs={dotRevealDelayMs}
      />
    </div>
  );
}
