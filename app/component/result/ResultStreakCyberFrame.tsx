"use client";

import {
  RESULT_HIT_CYBER_CLIP,
  resultStreakFrameTokens,
} from "@/lib/result/resultGlass";

type Props = {
  activeWinStreak: unknown;
  className?: string;
};

/** 連勝用サイバー角切り枠（ティア色 + 白い走査光は常時） */
export default function ResultStreakCyberFrame({
  activeWinStreak,
  className = "",
}: Props) {
  const tokens = resultStreakFrameTokens(activeWinStreak);
  if (!tokens) return null;

  const corner = `pointer-events-none absolute z-[9] ${tokens.cornerClass}`;

  return (
    <>
      <div
        className={[
          "pointer-events-none absolute inset-0 z-[4]",
          RESULT_HIT_CYBER_CLIP,
          tokens.frameBorder,
          tokens.frameGlow,
          className,
        ].join(" ")}
        aria-hidden
      />

      <div
        className={[
          "pointer-events-none absolute inset-0 z-[8] overflow-hidden",
          RESULT_HIT_CYBER_CLIP,
          "result-card-border-sweep result-card-streak-sweep",
          tokens.sweepClass,
        ].join(" ")}
        aria-hidden
      >
        <div className="result-card-border-sweep__spin result-card-streak-sweep__spin" />
      </div>

      <div className={`${corner} left-0 top-0 h-2.5 w-2.5 border-l-2 border-t-2`} aria-hidden />
      <div className={`${corner} right-0 top-0 h-2.5 w-2.5 border-r-2 border-t-2`} aria-hidden />
      <div
        className={`${corner} bottom-0 left-0 h-2.5 w-2.5 border-b-2 border-l-2`}
        aria-hidden
      />
      <div
        className={`${corner} bottom-0 right-0 h-2.5 w-2.5 border-b-2 border-r-2`}
        aria-hidden
      />

      <div
        className={[
          "pointer-events-none absolute inset-x-4 top-0 z-[3] h-[2px]",
          tokens.topLine,
        ].join(" ")}
        aria-hidden
      />
      <div
        className={[
          "pointer-events-none absolute inset-x-0 top-0 z-[1] h-[42%]",
          RESULT_HIT_CYBER_CLIP,
          tokens.overlayGradient,
        ].join(" ")}
        aria-hidden
      />
    </>
  );
}
