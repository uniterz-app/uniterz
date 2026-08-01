"use client";

/**
 * サイバー数字コンポーネント。
 * 字体: Alfa Slab One（太く角張った表示）+ 斜め + ソフトグロー。
 * suffix（pts など）は本体より小さめ・シアン固定。
 */

import cn from "clsx";
import { cyberNumberDisplay } from "@/lib/fonts";

export const CYBER_NUMBER_COLORS = {
  main: "#22D3EE",
  highlight: "#C8F7FF",
  glow: "#008CFF",
  background: "#020609",
  /** pts など単位ラベル（常にシアン） */
  suffix: "#22D3EE",
} as const;

type SizeToken = "sm" | "md" | "lg";

const SIZE_PX: Record<SizeToken, number> = {
  sm: 15,
  md: 20,
  lg: 28,
};

export type CyberNumberProps = {
  value: number | string;
  /** sm / md / lg、または px 指定 */
  size?: SizeToken | number;
  /** 0〜1 */
  glowIntensity?: number;
  className?: string;
  /** 例: "#" → #6 */
  prefix?: string;
  /** 例: "pts" → 本体より小さめ・シアン */
  suffix?: string;
  /** 数字本体の右上に小さく置く記号（例: "+"）。prefix とは別 */
  cornerSign?: string;
  /** 数値のときカンマ区切り（既定 true） */
  format?: boolean;
  /** 本体数字の色（順位パレットなど）。未指定はシアン */
  color?: string;
};

function resolveBody(
  value: number | string,
  prefix: string,
  format: boolean
): string {
  if (typeof value === "number") {
    const body = format
      ? Math.round(value).toLocaleString("en-US")
      : String(Math.round(value));
    return `${prefix}${body}`;
  }
  return `${prefix}${value}`;
}

/** Alfa Slab One の角張ったサイバー数字 */
export default function CyberNumber({
  value,
  size = "md",
  glowIntensity = 0.72,
  className,
  prefix = "",
  suffix = "",
  cornerSign = "",
  format = true,
  color,
}: CyberNumberProps) {
  const body = resolveBody(value, prefix, format);
  const fontSize = typeof size === "number" ? size : SIZE_PX[size];
  const intensity = Math.min(1, Math.max(0, glowIntensity));
  const bodyColor = color ?? CYBER_NUMBER_COLORS.main;
  const isWhiteish =
    bodyColor === "#FFFFFF" ||
    bodyColor.startsWith("rgba(255, 255, 255") ||
    bodyColor.startsWith("rgba(255,255,255");
  const glow = isWhiteish
    ? `0 0 1px rgba(255,255,255,${0.25 * intensity})`
    : [
        `0 0 ${1 + intensity}px ${bodyColor}`,
        `0 0 ${4 + 3 * intensity}px ${bodyColor}44`,
      ].join(", ");

  return (
    <span
      className={cn("cyber-neo-number", cyberNumberDisplay.className, className)}
      style={{ fontSize }}
    >
      <span
        className="cyber-neo-number__body relative inline-block"
        style={{ color: bodyColor, textShadow: glow }}
      >
        {body}
        {cornerSign ? (
          <span
            aria-hidden
            className="pointer-events-none absolute left-[calc(100%-0.05em)] top-0 -translate-y-[42%] text-[0.58em] leading-none"
            style={{ color: bodyColor, textShadow: glow }}
          >
            {cornerSign}
          </span>
        ) : null}
      </span>
      {suffix ? (
        <span
          className="cyber-neo-number__suffix"
          style={{
            fontSize: Math.max(9, Math.round(fontSize * 0.58)),
            color: CYBER_NUMBER_COLORS.suffix,
            textShadow: [
              `0 0 ${2 + 2 * intensity}px rgba(0,140,255,${0.45 * intensity})`,
              `0 0 ${6 + 4 * intensity}px rgba(0,140,255,${0.22 * intensity})`,
            ].join(", "),
          }}
        >
          {suffix}
        </span>
      ) : null}
    </span>
  );
}
