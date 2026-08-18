"use client";

/**
 * 確定版 UNITERZ ワードマークのアーチなし版。
 * Native は後で `UniterzLogoFlatNative`。
 */
import {
  UNITERZ_LOGO_FLAT_LETTERS,
  UNITERZ_LOGO_FLAT_VIEWBOX,
} from "@/lib/units/uniterzLogoFlat";

export type UniterzLogoFlatProps = {
  width?: number | string;
  className?: string;
  title?: string;
  fill?: string;
};

export default function UniterzLogoFlat({
  width = "100%",
  className,
  title = "UNITERZ",
  fill = "currentColor",
}: UniterzLogoFlatProps) {
  const { width: vw, height: vh, aspectRatio } = UNITERZ_LOGO_FLAT_VIEWBOX;
  const dimW = typeof width === "number" ? `${width}px` : width;

  return (
    <svg
      className={className}
      width={dimW}
      viewBox={`0 0 ${vw} ${vh}`}
      role="img"
      aria-label={title}
      style={{ height: "auto", aspectRatio: String(aspectRatio) }}
    >
      <title>{title}</title>
      {UNITERZ_LOGO_FLAT_LETTERS.map((letter) => (
        <g key={letter.id} id={`letter-${letter.id}`}>
          {letter.paths.map((d) => (
            <path key={d} d={d} fill={fill} />
          ))}
        </g>
      ))}
    </svg>
  );
}
