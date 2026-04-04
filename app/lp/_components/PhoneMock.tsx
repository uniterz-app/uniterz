"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  src: string;
  alt: string;
  mediaType?: "image" | "video";
  posterSrc?: string;
  widthClassName?: string;
  glowClassName?: string;
  imageClassName?: string;
  tiltClassName?: string;
  hideStatusBar?: boolean;
  priority?: boolean;
  frameClassName?: string;
  screenClassName?: string;
  bezelClassName?: string;
  notchClassName?: string;
  imagePosition?: string;
  /** スクショ上部の時刻・電波などをマスク（LP 用） */
  maskScreenshotStatusBar?: boolean;
  /** 動画の待機中に敷く画像（ネイティブ img／黒画面防止） */
  videoBackdropSrc?: string;
};

export default function PhoneMock({
  src,
  alt,
  mediaType = "image",
  posterSrc,
  widthClassName = "w-[320px]",
  glowClassName = "from-cyan-400/12 via-sky-400/8 to-emerald-300/10",
  imageClassName = "",
  tiltClassName = "",
  hideStatusBar = false,
  priority = false,
  frameClassName = "rounded-[40px] p-[8px]",
  screenClassName = "rounded-[32px]",
  bezelClassName = "rounded-[39px]",
  notchClassName = "top-[7px] h-[24px] w-[40%]",
  imagePosition = "center top",
  maskScreenshotStatusBar = false,
  videoBackdropSrc,
}: Props) {
  const [videoFailed, setVideoFailed] = useState(false);
  /** デコード完了までポスターを見せ、切り替え時の黒画面を防ぐ */
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fallbackImageSrc = useMemo(() => posterSrc || src, [posterSrc, src]);
  const shouldRenderVideo = mediaType === "video" && !videoFailed && !!src;

  useEffect(() => {
    setVideoFailed(false);
    setVideoReady(false);
  }, [src, mediaType]);

  useEffect(() => {
    if (!shouldRenderVideo || !videoRef.current) return;
    videoRef.current.load();
  }, [shouldRenderVideo, src]);

  return (
    <div className={`relative mx-auto ${widthClassName}`}>
      <div
        className={`pointer-events-none absolute -inset-5 rounded-[56px] bg-gradient-to-br ${glowClassName} blur-3xl opacity-70`}
      />
      <div className="pointer-events-none absolute inset-x-[12%] top-[4%] h-[14%] rounded-full bg-white/[0.04] blur-2xl" />
      <div className="pointer-events-none absolute inset-x-[18%] bottom-[5%] h-[10%] rounded-full bg-black/25 blur-2xl" />

      <div
        className={[
          "relative isolate overflow-hidden",
          "bg-[linear-gradient(180deg,#1b2330_0%,#0c1219_38%,#030507_100%)]",
          "shadow-[0_34px_90px_rgba(0,0,0,0.58),0_10px_28px_rgba(0,0,0,0.34)]",
          "ring-1 ring-white/[0.09]",
          frameClassName,
          tiltClassName,
        ].join(" ")}
      >
        <div
          className={`pointer-events-none absolute inset-[1px] border border-white/[0.04] ${bezelClassName}`}
        />

        <div className="pointer-events-none absolute inset-x-[2px] top-[2px] h-[20%] rounded-t-[inherit] bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.016)_36%,rgba(255,255,255,0)_82%)]" />

        <div className="pointer-events-none absolute left-[5px] top-[14px] bottom-[14px] w-[1px] bg-gradient-to-b from-white/16 via-white/5 to-transparent" />
        <div className="pointer-events-none absolute right-[5px] top-[14px] bottom-[14px] w-[1px] bg-gradient-to-b from-white/10 via-white/4 to-transparent" />

        <div className="pointer-events-none absolute left-0 top-[18%] h-[18%] w-[3px] rounded-r-full bg-white/[0.05]" />
        <div className="pointer-events-none absolute left-0 top-[40%] h-[10%] w-[3px] rounded-r-full bg-white/[0.04]" />
        <div className="pointer-events-none absolute right-0 top-[28%] h-[14%] w-[3px] rounded-l-full bg-white/[0.04]" />

        <div
          className={[
            "relative overflow-hidden bg-black ring-1 ring-white/[0.05]",
            "aspect-[9/19.5]",
            screenClassName,
          ].join(" ")}
        >
          {shouldRenderVideo ? (
            <div className="relative h-full w-full bg-black">
              {/* videoBackdropSrc があるときは img で即描画（Next/Image の遅延で黒くならない） */}
              {videoBackdropSrc ? (
                // eslint-disable-next-line @next/next/no-img-element -- LP 動画待機用の即時表示
                <img
                  key={videoBackdropSrc}
                  src={videoBackdropSrc}
                  alt=""
                  className={[
                    "absolute inset-0 z-0 h-full w-full object-cover select-none transition-opacity duration-200",
                    imageClassName,
                    videoReady ? "opacity-0" : "opacity-100",
                  ].join(" ")}
                  style={{ objectPosition: imagePosition }}
                  aria-hidden
                />
              ) : (
                <Image
                  key={fallbackImageSrc}
                  src={fallbackImageSrc}
                  alt=""
                  fill
                  priority={priority}
                  sizes="(max-width: 768px) 72vw, 320px"
                  className={[
                    "object-cover select-none transition-opacity duration-200",
                    imageClassName,
                    videoReady ? "opacity-0" : "opacity-100",
                  ].join(" ")}
                  style={{ objectPosition: imagePosition }}
                  aria-hidden
                />
              )}
              <video
                key={src}
                ref={videoRef}
                src={src}
                poster={videoBackdropSrc ?? fallbackImageSrc}
                aria-label={alt}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                onError={() => setVideoFailed(true)}
                onLoadedData={() => setVideoReady(true)}
                onCanPlay={() => setVideoReady(true)}
                className={[
                  "absolute inset-0 z-[1] h-full w-full object-cover select-none transition-opacity duration-200",
                  imageClassName,
                  videoReady ? "opacity-100" : "opacity-0",
                ].join(" ")}
                style={{ objectPosition: imagePosition }}
              />
            </div>
          ) : (
            <div className="relative h-full w-full bg-black">
              <Image
                key={fallbackImageSrc}
                src={fallbackImageSrc}
                alt={alt}
                fill
                priority={priority}
                sizes="(max-width: 768px) 72vw, 320px"
                className={["object-cover select-none", imageClassName].join(
                  " "
                )}
                style={{ objectPosition: imagePosition }}
              />
            </div>
          )}

          {!hideStatusBar ? (
            <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[36px] bg-[linear-gradient(180deg,rgba(0,0,0,0.24)_0%,rgba(0,0,0,0.08)_45%,rgba(0,0,0,0)_100%)]" />
          ) : null}

          {/* スクショに含まれる時刻・ステータス行を塗りつぶし（ノッチ下までなじませる） */}
          {maskScreenshotStatusBar ? (
            <div
              className="pointer-events-none absolute inset-x-0 top-0 z-[22] h-[min(12.5%,52px)] bg-gradient-to-b from-[#05080c] from-[55%] via-[#05080c]/88 to-transparent"
              aria-hidden
            />
          ) : null}

          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[16%] bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.016)_24%,rgba(255,255,255,0)_56%)]" />
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-[9%] bg-[linear-gradient(90deg,rgba(255,255,255,0.016)_0%,rgba(255,255,255,0.005)_36%,rgba(255,255,255,0)_100%)]" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-[7%] bg-[linear-gradient(270deg,rgba(255,255,255,0.012)_0%,rgba(255,255,255,0.004)_34%,rgba(255,255,255,0)_100%)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[10%] bg-gradient-to-t from-black/16 to-transparent" />

          <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.05),transparent_28%)]" />
        </div>

        <div
          className={`pointer-events-none absolute left-1/2 z-30 -translate-x-1/2 rounded-b-[16px] bg-black shadow-[0_6px_14px_rgba(0,0,0,0.4)] ${notchClassName}`}
        >
          <div className="absolute left-1/2 top-[4px] h-[4px] w-[34%] -translate-x-1/2 rounded-full bg-white/[0.08]" />
        </div>

        <div className="pointer-events-none absolute inset-x-[18%] bottom-[8px] h-[4px] rounded-full bg-white/[0.05]" />
      </div>
    </div>
  );
}