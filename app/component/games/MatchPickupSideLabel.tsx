"use client";

import { type Ref } from "react";

/** Native 左辺 `PICK UP` 相当。縦積みの実ラベル（説明用の偽物は置かない） */

type Props = {
  color: string;
  tutorialTarget?: string;
  measureRef?: Ref<HTMLSpanElement>;
};

export default function MatchPickupSideLabel({
  color,
  tutorialTarget,
  measureRef,
}: Props) {
  return (
    <div className="pointer-events-none absolute inset-y-0 left-0 z-[4] flex w-4 -translate-x-2 items-center justify-center">
      <span
        ref={measureRef}
        className="flex flex-col items-center justify-center"
        style={{ color, textShadow: "0 0 6px rgba(0,0,0,0.85), 0 1px 0 rgba(0,0,0,0.7)" }}
        aria-label="PICK UP"
        data-tutorial-target={tutorialTarget}
      >
        {"PICK UP".split("").map((ch, i) =>
          ch === " " ? (
            <span key={`sp-${i}`} className="h-1" aria-hidden />
          ) : (
            <span
              key={`${ch}-${i}`}
              className="text-[12px] font-extrabold leading-[13px] tracking-normal"
            >
              {ch}
            </span>
          )
        )}
      </span>
    </div>
  );
}
