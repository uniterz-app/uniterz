"use client";

import type { ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import MatchListLineFrame from "@/app/component/games/MatchListLineFrame";
import {
  myRankCardAccent,
  resolveMyRankCardFrameTone,
  type MyRankCardFrameTone,
} from "@/lib/rankings/myRankCardFocus";

export type { MyRankCardFrameTone };
export { resolveMyRankCardFrameTone };

const TONE_CLASS: Record<MyRankCardFrameTone, string> = {
  up: "",
  down: "my-rank-card-frame--rank-down",
  neutral: "my-rank-card-frame--rank-neutral",
};

const PRO_GOLD = "#E8C66A";

function linePaint(proSpec: boolean, tone: MyRankCardFrameTone) {
  if (proSpec) {
    return { color: PRO_GOLD, glow: "rgba(232,198,106,0.32)" };
  }
  const accent = myRankCardAccent(tone);
  return { color: accent.primary, glow: accent.dim };
}

/** MyRankCard 外枠 — マッチ／リザルトと同じ線枠パス。塗りは透明。 */
export function MyRankCardFrame({
  children,
  className = "",
  tone = "up",
  proSpec = false,
  hideLeftEdge = false,
  animateDraw = true,
  drawKey,
}: {
  children: ReactNode;
  className?: string;
  tone?: MyRankCardFrameTone;
  /** Pro 仕様 — 金の連続枠（塗りは透明） */
  proSpec?: boolean;
  /** Free — 左端アクセント色を出さない（線枠では未使用） */
  hideLeftEdge?: boolean;
  /** マッチカードと同じパス描画 */
  animateDraw?: boolean;
  /** 指標切替などで描画をやり直すキー */
  drawKey?: string;
}) {
  void hideLeftEdge;
  const reduceMotion = useReducedMotion() === true;
  const draw = animateDraw && !reduceMotion;
  const paint = linePaint(proSpec, tone);
  const frameClass = [
    "my-rank-card-frame my-rank-card-frame--line-stroke relative",
    TONE_CLASS[tone],
    proSpec ? "my-rank-card-frame--pro-spec" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={frameClass}>
      <MatchListLineFrame
        key={drawKey ?? "my-rank-frame"}
        flush
        closedTop
        animateDraw={draw}
        paint={paint}
      >
        {proSpec ? null : (
          <div
            aria-hidden
            className="my-rank-card-frame__grid pointer-events-none absolute inset-0"
          />
        )}
        <div className="relative z-10">{children}</div>
      </MatchListLineFrame>
    </div>
  );
}
