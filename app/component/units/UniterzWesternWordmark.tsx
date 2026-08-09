"use client";

/**
 * UNITERZ ウェスタン調ワードマーク（アウトライン SVG）
 */
import {
  UNITERZ_WESTERN_GLYPH_VIEW,
  type UniterzWesternVariantId,
  uniterzWesternWordPaths,
} from "@/lib/units/uniterzWesternGlyphs";

type Props = {
  variant?: UniterzWesternVariantId;
  /** 全体幅の目安 */
  width?: number;
  className?: string;
  /** 現在の UNITERZ シアン寄り色 */
  fill?: string;
  gap?: number;
  arched?: boolean;
  arch?: number;
};

export default function UniterzWesternWordmark({
  variant = "a",
  width = 280,
  className,
  fill = "#e8f7ff",
  gap = 12,
  arched = true,
  arch = 12,
}: Props) {
  const glyphs = uniterzWesternWordPaths(variant);
  const { width: gw, height: gh } = UNITERZ_WESTERN_GLYPH_VIEW;
  const n = glyphs.length;
  const totalW = n * gw + Math.max(0, n - 1) * gap;
  const totalH = gh + (arched ? arch : 0);
  const scale = width / totalW;
  const height = totalH * scale;

  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox={`0 0 ${totalW} ${totalH}`}
      role="img"
      aria-label="UNITERZ"
      style={{ overflow: "visible" }}
    >
      {glyphs.map((g, i) => {
        const t = n === 1 ? 0.5 : i / (n - 1);
        const rise = arched ? arch * Math.sin(Math.PI * t) : 0;
        const x = i * (gw + gap);
        const y = arch - rise;
        return (
          <g key={`${g.char}-${i}`} transform={`translate(${x} ${y})`}>
            <path d={g.d} fill={fill} fillRule="evenodd" />
          </g>
        );
      })}
    </svg>
  );
}
