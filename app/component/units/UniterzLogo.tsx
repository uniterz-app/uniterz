"use client";

/**
 * 確定版 UNITERZ ロゴ — 白塗り PNG（ベクター原稿由来）。
 * Native は `UniterzLogoNative`。
 */
import Image from "next/image";
import { UNITERZ_LOGO_ASSET } from "@/lib/units/uniterzLogoAsset";

export type UniterzLogoProps = {
  width?: number | string;
  height?: number | string;
  className?: string;
  title?: string;
};

export default function UniterzLogo({
  width = "100%",
  height,
  className,
  title = "UNITERZ",
}: UniterzLogoProps) {
  const { width: aw, height: ah, webPath, aspectRatio } = UNITERZ_LOGO_ASSET;
  const numericWidth = typeof width === "number" ? width : undefined;
  const numericHeight =
    typeof height === "number"
      ? height
      : numericWidth != null
        ? numericWidth / aspectRatio
        : undefined;

  return (
    <span
      className={["relative inline-block max-w-full", className]
        .filter(Boolean)
        .join(" ")}
      style={{
        width: width ?? "100%",
        height: height ?? "auto",
        aspectRatio: height == null ? String(aspectRatio) : undefined,
      }}
      role="img"
      aria-label={title}
    >
      <Image
        src={`${webPath}?v=vector-fill-2026-08`}
        alt={title}
        width={aw}
        height={ah}
        sizes="(max-width: 480px) 100vw, 420px"
        className="h-auto w-full object-contain"
        style={
          numericHeight != null
            ? { width: numericWidth, height: numericHeight }
            : { width: "100%", height: "auto" }
        }
        priority
        unoptimized
      />
    </span>
  );
}
