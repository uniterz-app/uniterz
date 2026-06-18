"use client";

import {
  RESULT_HIT_CYBER_CLIP,
  RESULT_PERFECT_FRAME_BORDER,
  RESULT_PERFECT_FRAME_GLOW,
  RESULT_PERFECT_OVERLAY_GRADIENT,
  RESULT_PERFECT_TOP_LINE,
} from "@/lib/result/resultGlass";

type Props = {
  className?: string;
  showSweep?: boolean;
};

const CORNER = "pointer-events-none absolute z-[5] border-violet-300/90";

/** PERFECT 用サイバー角切り枠（紫 + 枠走査光） */
export default function ResultPerfectCyberFrame({
  className = "",
  showSweep = true,
}: Props) {
  return (
    <>
      <div
        className={[
          "pointer-events-none absolute inset-0 z-[4]",
          RESULT_HIT_CYBER_CLIP,
          RESULT_PERFECT_FRAME_BORDER,
          RESULT_PERFECT_FRAME_GLOW,
          className,
        ].join(" ")}
        aria-hidden
      />

      {showSweep ? (
        <div
          className={[
            "pointer-events-none absolute inset-0 z-[8] overflow-hidden",
            RESULT_HIT_CYBER_CLIP,
            "result-card-border-sweep result-card-streak-sweep result-card-streak-sweep--perfect",
          ].join(" ")}
          aria-hidden
        >
          <div className="result-card-border-sweep__spin result-card-streak-sweep__spin" />
        </div>
      ) : null}

      <div
        className={`${CORNER} left-0 top-0 z-[9] h-2.5 w-2.5 border-l-2 border-t-2`}
        aria-hidden
      />
      <div
        className={`${CORNER} right-0 top-0 z-[9] h-2.5 w-2.5 border-r-2 border-t-2`}
        aria-hidden
      />
      <div
        className={`${CORNER} bottom-0 left-0 z-[9] h-2.5 w-2.5 border-b-2 border-l-2`}
        aria-hidden
      />
      <div
        className={`${CORNER} bottom-0 right-0 z-[9] h-2.5 w-2.5 border-b-2 border-r-2`}
        aria-hidden
      />

      <div
        className={[
          "pointer-events-none absolute inset-x-4 top-0 z-[3] h-[2px]",
          RESULT_PERFECT_TOP_LINE,
        ].join(" ")}
        aria-hidden
      />
      <div
        className={[
          "pointer-events-none absolute inset-x-0 top-0 z-[1] h-[42%]",
          RESULT_HIT_CYBER_CLIP,
          RESULT_PERFECT_OVERLAY_GRADIENT,
        ].join(" ")}
        aria-hidden
      />
    </>
  );
}
