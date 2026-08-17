"use client";

import {
  RESULT_HIT_CYBER_CLIP,
  RESULT_UPSET_FRAME_BORDER,
  RESULT_UPSET_FRAME_GLOW,
  RESULT_UPSET_OVERLAY_GRADIENT,
  RESULT_UPSET_TOP_LINE,
} from "@/lib/result/resultGlass";

type Props = {
  className?: string;
  showSweep?: boolean;
};

/** UPSET 用サイバー角切り枠 — コア線 + drop-shadow ブルーム */
export default function ResultUpsetCyberFrame({
  className = "",
  showSweep = true,
}: Props) {
  return (
    <>
      <div
        className="result-upset-frame-bloom pointer-events-none absolute inset-0 z-[3]"
        aria-hidden
      >
        <div
          className={[
            "absolute inset-0",
            RESULT_HIT_CYBER_CLIP,
            "border border-red-200/90",
          ].join(" ")}
        />
      </div>

      <div
        className={[
          "pointer-events-none absolute inset-0 z-[4]",
          RESULT_HIT_CYBER_CLIP,
          RESULT_UPSET_FRAME_BORDER,
          RESULT_UPSET_FRAME_GLOW,
          className,
        ].join(" ")}
        aria-hidden
      />

      {showSweep ? (
        <div
          className={[
            "pointer-events-none absolute inset-0 z-[11] overflow-hidden",
            RESULT_HIT_CYBER_CLIP,
            "result-card-border-sweep result-card-streak-sweep result-card-streak-sweep--upset",
          ].join(" ")}
          aria-hidden
        >
          <div className="result-card-border-sweep__spin result-card-streak-sweep__spin" />
        </div>
      ) : null}

      <div
        className={[
          "pointer-events-none absolute inset-x-4 top-0 z-[3] h-[2px]",
          RESULT_UPSET_TOP_LINE,
        ].join(" ")}
        aria-hidden
      />
      <div
        className={[
          "pointer-events-none absolute inset-x-0 top-0 z-[1] h-[42%]",
          RESULT_HIT_CYBER_CLIP,
          RESULT_UPSET_OVERLAY_GRADIENT,
        ].join(" ")}
        aria-hidden
      />
    </>
  );
}