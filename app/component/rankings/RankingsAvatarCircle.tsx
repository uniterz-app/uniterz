"use client";

import { alfa } from "@/lib/fonts";
import { useEffect, useRef, useState } from "react";

type Props = {
  photoURL?: string | null;
  displayName: string;
  boxClassName: string;
  initialTextClassName?: string;
  /** false の間はプレースホルダー非表示（My rank の loading など） */
  gateReady?: boolean;
  onDisplayReadyChange?: (ok: boolean) => void;
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
}: Props) {
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

  const showInitial = gateReady && !photoURL;
  const showPhoto = Boolean(photoURL && imgLoaded);
  const showRing = showPhoto || showInitial;
  const ok = gateReady && (!photoURL || imgLoaded);

  useEffect(() => {
    onDisplayReadyChange?.(ok);
  }, [ok, onDisplayReadyChange]);

  return (
    <div
      className={[
        "relative shrink-0 overflow-hidden rounded-full",
        boxClassName,
        showRing ? "bg-[#0f2d35] ring-2 ring-[#0f2d35]" : "bg-transparent",
      ].join(" ")}
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
            "grid h-full w-full place-items-center font-black",
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
