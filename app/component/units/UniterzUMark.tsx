"use client";

/**
 * 確定版 UNITERZ ロゴの U マーク（ワードマークのアーチを戻した直立形）。
 */
import {
  UNITERZ_U_MARK_PATHS,
  UNITERZ_U_MARK_VIEWBOX,
} from "@/lib/units/uniterzUMark";

export type UniterzUMarkProps = {
  size?: number | string;
  className?: string;
  title?: string;
  fill?: string;
};

export default function UniterzUMark({
  size = 120,
  className,
  title = "UNITERZ U",
  fill = "currentColor",
}: UniterzUMarkProps) {
  const dim = typeof size === "number" ? `${size}px` : size;
  return (
    <svg
      className={className}
      width={dim}
      height={dim}
      viewBox={`0 0 ${UNITERZ_U_MARK_VIEWBOX} ${UNITERZ_U_MARK_VIEWBOX}`}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      {UNITERZ_U_MARK_PATHS.map((d) => (
        <path key={d} d={d} fill={fill} />
      ))}
    </svg>
  );
}
