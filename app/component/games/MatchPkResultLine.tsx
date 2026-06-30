"use client";

import { resolvePkShootoutWinnerSide } from "@/lib/games/pkScore";
import type { PkScore } from "@/lib/games/pkScore";
import { matchScoreClass } from "@/lib/fonts";

type Props = {
  pkScore: PkScore;
  /** 一覧カード（小） / オーバーレイ（やや大） */
  density?: "card" | "overlay";
  className?: string;
};

export default function MatchPkResultLine({
  pkScore,
  density = "card",
  className = "",
}: Props) {
  const winner = resolvePkShootoutWinnerSide(pkScore);
  const sizeClass =
    density === "overlay"
      ? "text-[11px] leading-none md:text-[12px]"
      : "text-[11px] leading-none sm:text-[12px]";
  const numClass = [matchScoreClass, sizeClass].join(" ");

  return (
    <div
      className={[
        "flex max-w-full flex-nowrap items-baseline justify-center gap-1 whitespace-nowrap",
        className,
      ].join(" ")}
    >
      <span className={[numClass, "shrink-0 text-white/78"].join(" ")}>PK</span>
      <span
        className={[
          numClass,
          "shrink-0",
          winner === "home" ? "text-yellow-300" : "text-white/72",
        ].join(" ")}
      >
        {pkScore.home}
      </span>
      <span className={[numClass, "shrink-0 text-white/55"].join(" ")}>-</span>
      <span
        className={[
          numClass,
          "shrink-0",
          winner === "away" ? "text-yellow-300" : "text-white/72",
        ].join(" ")}
      >
        {pkScore.away}
      </span>
    </div>
  );
}
