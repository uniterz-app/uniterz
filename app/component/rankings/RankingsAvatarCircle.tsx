"use client";

import { alfa } from "@/lib/fonts";
import { useEffect, useRef, useState } from "react";

/** 「You」などフォールバック名ではイニシャルを出さない（Y 表示を防ぐ） */
function shouldUseInitialLetter(displayName: string): boolean {
  const t = displayName.trim();
  if (!t) return false;
  const lower = t.toLowerCase();
  if (lower === "you") return false;
  return true;
}

type Props = {
  photoURL?: string | null;
  displayName: string;
  boxClassName: string;
  initialTextClassName?: string;
  /** false の間はプレースホルダー非表示（My rank の loading など） */
  gateReady?: boolean;
  onDisplayReadyChange?: (ok: boolean) => void;
  shape?: "circle" | "square";
};

/**
 * My rank と同じく #0f2d35 + ring-2。写真は decode 後に表示、未取得時はイニシャル。
 */
export function RankingsAvatarCircle({
  photoURL,
  displayName,
  boxClassName,
  initialTextClassName = "text-[18px]",
  gateReady = true,
  onDisplayReadyChange,
  shape = "circle",
}: Props) {
  const useLetter = shouldUseInitialLetter(displayName);
  const initial = (displayName?.slice(0, 1) ?? "?").toUpperCase();
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
  const showInitial = gateReady && !photoURL && useLetter;
  const showSolidShell = showPhoto || showInitial;
  const showPulse =
    gateReady &&
    !showSolidShell &&
    (Boolean(photoURL) ? !imgLoaded : !useLetter);

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
        isSquare ? "rounded-none" : "rounded-full",
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
          loading="eager"
          decoding="async"
          onLoad={() => setImgLoaded(true)}
        />
      ) : showInitial ? (
        <div
          className={[
            "grid h-full w-full place-items-center font-black text-white/90",
            alfa.className,
            initialTextClassName,
          ].join(" ")}
        >
          {initial}
        </div>
      ) : null}
    </div>
  );
}
