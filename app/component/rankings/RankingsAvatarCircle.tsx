"use client";

import { KinetikAvatarGlyph } from "@/app/component/common/KinetikAvatarGlyph";
import { useEffect, useRef, useState } from "react";

type Props = {
  photoURL?: string | null;
  displayName: string;
  boxClassName: string;
  initialTextClassName?: string;
  /** false の間はプレースホルダー非表示（My rank の loading など） */
  gateReady?: boolean;
  onDisplayReadyChange?: (ok: boolean) => void;
  shape?: "circle" | "square";
  imageLoading?: "lazy" | "eager";
};

/**
 * My rank と同じく #0f2d35 + ring-2。写真は decode 後に表示、未取得時は Kinetik 三角グリフ。
 */
export function RankingsAvatarCircle({
  photoURL,
  displayName,
  boxClassName,
  gateReady = true,
  onDisplayReadyChange,
  shape = "circle",
  imageLoading = "eager",
}: Props) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!photoURL) {
      setImgLoaded(true);
      return;
    }
    setImgLoaded(false);
    const el = imgRef.current;
    if (el?.complete) setImgLoaded(true);
  }, [photoURL]);

  const showPhoto = Boolean(photoURL && imgLoaded);
  const showGlyph = gateReady && !photoURL;
  const showSolidShell = showPhoto || showGlyph;
  const showPulse = gateReady && Boolean(photoURL) && !imgLoaded;

  const ok = gateReady && (!photoURL || imgLoaded);

  useEffect(() => {
    onDisplayReadyChange?.(ok);
  }, [ok, onDisplayReadyChange]);

  const isSquare = shape === "square";
  const ringClass = isSquare
    ? ""
    : showSolidShell
      ? "ring-2 ring-[#0f2d35]"
      : showPulse
        ? "ring-1 ring-white/18 skeleton-scan"
        : "";

  return (
    <div
      className={[
        "relative shrink-0 overflow-hidden",
        isSquare ? "rounded-sm" : "rounded-full",
        boxClassName,
        showSolidShell ? (isSquare ? "bg-[#0a0c14]" : "bg-[#0f2d35]") : "",
        ringClass,
        showPulse ? "bg-white/10 skeleton-scan" : "",
        !showSolidShell && !showPulse ? "bg-transparent" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {photoURL ? (
        <img
          ref={imgRef}
          key={photoURL}
          src={photoURL}
          alt=""
          className={[
            "h-full w-full object-cover",
            imgLoaded ? "opacity-100" : "opacity-0",
          ].join(" ")}
          loading={imageLoading}
          decoding="async"
          onLoad={() => setImgLoaded(true)}
        />
      ) : showGlyph ? (
        <>
          <KinetikAvatarGlyph size="62%" />
          <span className="sr-only">{displayName}</span>
        </>
      ) : null}
    </div>
  );
}
