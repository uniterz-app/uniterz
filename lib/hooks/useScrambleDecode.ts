"use client";

import { useEffect, useState } from "react";

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function randomScrambleChar() {
  return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]!;
}

function scrambleOf(text: string) {
  return text
    .split("")
    .map((ch) => (ch === " " ? " " : randomScrambleChar()))
    .join("");
}

/**
 * タイトル等の文字列をランダム文字から左→右へ解読していく演出。
 */
export function useScrambleDecode(finalText: string, run: boolean) {
  const [display, setDisplay] = useState(() =>
    run ? scrambleOf(finalText) : finalText
  );

  useEffect(() => {
    let cancelled = false;
    if (!run) {
      setDisplay(finalText);
      return;
    }

    setDisplay(scrambleOf(finalText));

    const len = finalText.length;
    const durationMs = 1600;
    const start = performance.now();

    const tick = (now: number) => {
      if (cancelled) return;
      const t = Math.min(1, (now - start) / durationMs);

      const next = finalText
        .split("")
        .map((ch, i) => {
          if (ch === " ") return " ";
          const revealStart = 0.08 + (i / Math.max(1, len - 1)) * 0.72;
          if (t >= revealStart) return ch;
          return randomScrambleChar();
        })
        .join("");

      setDisplay(next);

      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        setDisplay(finalText);
      }
    };

    requestAnimationFrame(tick);
    return () => {
      cancelled = true;
    };
  }, [finalText, run]);

  return display;
}
