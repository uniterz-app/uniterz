"use client";

import { useCallback, useState } from "react";

type Props = {
  src: string;
  poster?: string;
  alt: string;
};

/**
 * メタデータで取得した縦横比に外枠を合わせ、object-contain でトリミングしない
 */
export default function LPMediaSlotVideo({ src, poster, alt }: Props) {
  const [aspectRatio, setAspectRatio] = useState<string | null>(null);

  const onMeta = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    if (v.videoWidth > 0 && v.videoHeight > 0) {
      setAspectRatio(`${v.videoWidth} / ${v.videoHeight}`);
    }
  }, []);

  return (
    <div
      className="w-full overflow-hidden rounded-2xl border border-white/10 bg-black"
      style={
        aspectRatio
          ? { aspectRatio }
          : { minHeight: "12rem" }
      }
    >
      <video
        src={src}
        poster={poster}
        aria-label={alt}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        onLoadedMetadata={onMeta}
        className="h-full w-full bg-black object-contain object-center"
      />
    </div>
  );
}
