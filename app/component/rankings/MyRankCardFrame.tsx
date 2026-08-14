"use client";

import type { ReactNode } from "react";

/** 前日比順位 — 枠アクセント（上昇=ライム / 下降=シアン / 変動なし=ニュートラル） */
export type MyRankCardFrameTone = "up" | "down" | "neutral";

export function resolveMyRankCardFrameTone(
  rankDeltaPlaces?: number | null
): MyRankCardFrameTone {
  if (
    typeof rankDeltaPlaces !== "number" ||
    !Number.isFinite(rankDeltaPlaces) ||
    rankDeltaPlaces === 0
  ) {
    return "neutral";
  }
  return rankDeltaPlaces > 0 ? "up" : "down";
}

const TONE_CLASS: Record<MyRankCardFrameTone, string> = {
  up: "",
  down: "my-rank-card-frame--rank-down",
  neutral: "my-rank-card-frame--rank-neutral",
};

/** MyRankCard 外枠 — Pro は金枠・中黒。Free はニュートラル枠。 */
export function MyRankCardFrame({
  children,
  className = "",
  tone = "up",
  proSpec = false,
  hideLeftEdge = false,
}: {
  children: ReactNode;
  className?: string;
  tone?: MyRankCardFrameTone;
  /** Pro 仕様 — 金の連続枠 + 黒塗り */
  proSpec?: boolean;
  /** Free — 左端アクセント色を出さない */
  hideLeftEdge?: boolean;
}) {
  const frameClass = [
    "my-rank-card-frame relative",
    TONE_CLASS[tone],
    proSpec ? "my-rank-card-frame--pro-spec" : "",
    hideLeftEdge ? "my-rank-card-frame--no-left-edge" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={frameClass}>
      {proSpec ? null : (
        <>
          <div
            aria-hidden
            className="my-rank-card-frame__grid pointer-events-none absolute inset-0"
          />
          <div
            aria-hidden
            className="my-rank-card-frame__edge pointer-events-none absolute inset-0"
          />
        </>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
