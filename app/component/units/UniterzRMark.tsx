"use client";

/**
 * 確定版 UNITERZ ロゴの R マーク（ワードマークのアーチを戻した直立形）。
 */
import {
  UNITERZ_R_MARK_PATH,
  UNITERZ_R_MARK_VIEWBOX,
} from "@/lib/units/uniterzRMark";

export type UniterzRMarkProps = {
  size?: number | string;
  className?: string;
  title?: string;
  fill?: string;
};

export default function UniterzRMark({
  size = 120,
  className,
  title = "UNITERZ R",
  fill = "currentColor",
}: UniterzRMarkProps) {
  const dim = typeof size === "number" ? `${size}px` : size;
  return (
    <svg
      className={className}
      width={dim}
      height={dim}
      viewBox={`0 0 ${UNITERZ_R_MARK_VIEWBOX} ${UNITERZ_R_MARK_VIEWBOX}`}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <path d={UNITERZ_R_MARK_PATH} fill={fill} />
    </svg>
  );
}
