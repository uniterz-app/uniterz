"use client";

import { useEffect, useState } from "react";

const GLYPHS =
  "0123456789░▒▓█▀▄╱╲ΞØ§¤∆0123456789";

type Props = {
  active: boolean;
  length: number;
  className?: string;
};

/**
 * ランキングの数値・順位待ち用の短い「解読風」テキスト。reduce-motion 時は親で非表示にする。
 */
export default function RankingScrambleText({
  active,
  length,
  className,
}: Props) {
  const [text, setText] = useState(() =>
    Array.from({ length }, () => GLYPHS[0]).join("")
  );

  useEffect(() => {
    if (!active || length <= 0) return;

    const tick = () => {
      setText(
        Array.from({ length }, () => {
          const i = Math.floor(Math.random() * GLYPHS.length);
          return GLYPHS[i] ?? "0";
        }).join("")
      );
    };

    tick();
    const id = window.setInterval(tick, 52);
    return () => clearInterval(id);
  }, [active, length]);

  if (!active) return null;

  return (
    <span
      className={className}
      aria-hidden
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {text}
    </span>
  );
}
