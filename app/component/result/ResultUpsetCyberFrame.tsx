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
};

const CORNER = "pointer-events-none absolute z-[9] border-red-400/88";

/** UPSET 用サイバー角切り枠（赤 + 白い走査光は常時） */
export default function ResultUpsetCyberFrame({ className = "" }: Props) {
  return (
    <>
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

      <div
        className={[
          "pointer-events-none absolute inset-0 z-[8] overflow-hidden",
          RESULT_HIT_CYBER_CLIP,
          "result-card-border-sweep result-card-streak-sweep result-card-streak-sweep--upset",
        ].join(" ")}
        aria-hidden
      >
        <div className="result-card-border-sweep__spin result-card-streak-sweep__spin" />
      </div>

      <div
        className={`${CORNER} left-0 top-0 h-2.5 w-2.5 border-l-2 border-t-2`}
        aria-hidden
      />
      <div
        className={`${CORNER} right-0 top-0 h-2.5 w-2.5 border-r-2 border-t-2`}
        aria-hidden
      />
      <div
        className={`${CORNER} bottom-0 left-0 h-2.5 w-2.5 border-b-2 border-l-2`}
        aria-hidden
      />
      <div
        className={`${CORNER} bottom-0 right-0 h-2.5 w-2.5 border-b-2 border-r-2`}
        aria-hidden
      />

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
