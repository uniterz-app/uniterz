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

/** MyRankCard 外枠 — 順位変動でライム / シアン / ニュートラル */
export function MyRankCardFrame({
  children,
  className = "",
  tone = "up",
}: {
  children: ReactNode;
  className?: string;
  tone?: MyRankCardFrameTone;
}) {
  return (
    <div
      className={["my-rank-card-frame relative", TONE_CLASS[tone], className]
        .filter(Boolean)
        .join(" ")}
    >
      <div aria-hidden className="my-rank-card-frame__grid pointer-events-none absolute inset-0" />
      <div aria-hidden className="my-rank-card-frame__edge pointer-events-none absolute inset-0" />
      <div aria-hidden className="my-rank-card-frame__corner-tl pointer-events-none absolute left-0 top-0" />
      <div aria-hidden className="my-rank-card-frame__corner-tr pointer-events-none absolute right-0 top-0" />
      <div aria-hidden className="my-rank-card-frame__corner-bl pointer-events-none absolute bottom-0 left-0" />
      <div aria-hidden className="my-rank-card-frame__corner-br pointer-events-none absolute bottom-0 right-0" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
