"use client";

import {
  RESULT_HIT_CYBER_CLIP,
  RESULT_HIT_FRAME_BORDER,
  RESULT_HIT_FRAME_GLOW,
  RESULT_HIT_OVERLAY_GRADIENT,
  RESULT_HIT_TOP_LINE,
} from "@/lib/result/resultGlass";

type Props = {
  /** 詳細ヘッダー等：枠を走るゴールド光 */
  showSweep?: boolean;
  className?: string;
};

const CORNER =
  "pointer-events-none absolute z-[12] border-yellow-300/88";

/** HIT 用サイバー角切り枠（丸角なし） */
export default function ResultHitCyberFrame({
  showSweep = false,
  className = "",
}: Props) {
  return (
    <>
      <div
        className={[
          "pointer-events-none absolute inset-0 z-[4]",
          RESULT_HIT_CYBER_CLIP,
          RESULT_HIT_FRAME_BORDER,
          RESULT_HIT_FRAME_GLOW,
          className,
        ].join(" ")}
        aria-hidden
      />

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

      {showSweep ? (
        <div
          className={[
            "pointer-events-none absolute inset-0 z-[11] overflow-hidden",
            RESULT_HIT_CYBER_CLIP,
            "result-card-border-sweep result-card-streak-sweep result-card-streak-sweep--gold",
          ].join(" ")}
          aria-hidden
        >
          <div className="result-card-border-sweep__spin result-card-streak-sweep__spin" />
        </div>
      ) : null}

      <div
        className={[
          "pointer-events-none absolute inset-x-4 top-0 z-[3] h-[2px]",
          RESULT_HIT_TOP_LINE,
        ].join(" ")}
        aria-hidden
      />
      <div
        className={[
          "pointer-events-none absolute inset-x-0 top-0 z-[1] h-[42%]",
          RESULT_HIT_CYBER_CLIP,
          RESULT_HIT_OVERLAY_GRADIENT,
        ].join(" ")}
        aria-hidden
      />
    </>
  );
}
