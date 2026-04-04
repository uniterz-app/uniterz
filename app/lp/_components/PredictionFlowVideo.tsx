"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useMemo, useState } from "react";

type Props = {
  src: string;
  poster?: string;
  alt: string;
  /** lp-data の cacheKey。同名 MP4 を差し替えたときに更新する */
  cacheKey?: string;
};

function withCacheBust(path: string, key?: string) {
  if (!key) return path;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}v=${encodeURIComponent(key)}`;
}

/** Safari 向け：WebkitFilter 併記。中央寄せは transform にまとめる（class と競合させない） */
const bgBlurStyle = (): CSSProperties => ({
  filter: "blur(56px) saturate(1.45) brightness(1.12)",
  WebkitFilter: "blur(56px) saturate(1.45) brightness(1.12)",
  transform: "translate(-50%, -50%) translateZ(0)",
});

const posterBlurStyle = (posterUrl: string): CSSProperties => ({
  backgroundImage: `url("${posterUrl}")`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  filter: "blur(44px) saturate(1.5) brightness(1.15)",
  WebkitFilter: "blur(44px) saturate(1.5) brightness(1.15)",
  transform: "translateZ(0) scale(1.35)",
});

/** 左右の細い黒帯だけ抑えつつ、上下の見切れを減らす（以前 1.38 は強すぎた） */
const foregroundZoomClass =
  "absolute inset-0 h-full w-full origin-center object-cover object-center scale-[1.08] sm:scale-[1.06] motion-reduce:scale-100";

/**
 * LP 用フロー動画（想定：PC の横型スクリーンレコーディング）。
 * 背面：ポスターぼかし ＋ 同動画のぼかし。前面：object-cover ＋ 軽いズームでピラーボックスを切る。
 */
export default function PredictionFlowVideo({ src, poster, alt, cacheKey }: Props) {
  const [failed, setFailed] = useState(false);
  const videoSrc = useMemo(() => withCacheBust(src, cacheKey), [src, cacheKey]);
  const fallbackSrc = useMemo(() => poster || src, [poster, src]);

  const shellClass =
    "relative aspect-video w-full overflow-hidden rounded-[inherit] bg-[linear-gradient(180deg,#122032_0%,#0c1828_50%,#081018_100%)]";

  return (
    <div className={shellClass}>
      {failed ? (
        <div className="absolute inset-0 z-[2] overflow-hidden">
          <Image
            src={fallbackSrc}
            alt={alt}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className={foregroundZoomClass}
          />
        </div>
      ) : (
        <>
          {/* 最奥：poster のぼかし（動画 filter 不調時も色が残る。静止画のため reduced-motion でも表示） */}
          {poster ? (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
            >
              <div
                className="absolute -inset-[18%] opacity-[0.85]"
                style={posterBlurStyle(poster)}
              />
            </div>
          ) : null}

          {/* 背面動画：拡大＋ぼかし（暗くしない） */}
          <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden motion-reduce:hidden">
            <video
              key={`${videoSrc}-bg`}
              aria-hidden
              className="absolute left-1/2 top-1/2 h-[115%] min-h-full w-[115%] min-w-full object-cover object-center opacity-[0.72]"
              style={bgBlurStyle()}
              src={videoSrc}
              muted
              autoPlay
              loop
              playsInline
              preload="auto"
            />
          </div>

          {/* 前面：ズームでフレーム内の左右黒をクリップ（上下もわずかに切れる） */}
          <div className="absolute inset-0 z-[2] overflow-hidden">
            <video
              key={videoSrc}
              src={videoSrc}
              poster={poster}
              aria-label={alt}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              onError={() => setFailed(true)}
              className={foregroundZoomClass}
            />
          </div>
        </>
      )}

      <div
        className="pointer-events-none absolute inset-0 z-[3] bg-[radial-gradient(ellipse_at_50%_50%,transparent_58%,rgba(0,0,0,0.06)_100%)]"
        aria-hidden
      />
    </div>
  );
}
