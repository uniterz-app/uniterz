"use client";

/**
 * 選んだ生成画像の PRO タグ。
 * tone="gold" は本番 ProCyberBadge と同じ金をマスクで載せる。
 */
import {
  UNITERZ_PRO_BADGE_ASSET,
  UNITERZ_PRO_BADGE_GOLD,
} from "@/lib/units/uniterzProBadge";

export type UniterzProBadgeProps = {
  height?: number | string;
  width?: number | string;
  className?: string;
  title?: string;
  fill?: string;
  /** gold = 今のバッジと同じ金 */
  tone?: "plain" | "gold";
};

export default function UniterzProBadge({
  height = 20,
  width,
  className,
  title = "PRO",
  fill = "currentColor",
  tone = "plain",
}: UniterzProBadgeProps) {
  const { aspectRatio, webPngPath } = UNITERZ_PRO_BADGE_ASSET;
  const numericHeight = typeof height === "number" ? height : undefined;
  const numericWidth =
    typeof width === "number"
      ? width
      : numericHeight != null
        ? numericHeight * aspectRatio
        : undefined;
  const gold = tone === "gold";
  const src = `${webPngPath}?v=gen-tag-2026-08-15`;

  return (
    <span
      className={["inline-block shrink-0 align-middle", className]
        .filter(Boolean)
        .join(" ")}
      style={{
        width: numericWidth ?? width ?? "100%",
        height: numericHeight ?? height,
        aspectRatio: numericHeight == null && width == null ? String(aspectRatio) : undefined,
        backgroundImage: gold ? UNITERZ_PRO_BADGE_GOLD.wordCss : undefined,
        backgroundColor: gold ? undefined : fill,
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
      role="img"
      aria-label={title}
    />
  );
}
