"use client";

import { useEffect, useState } from "react";
import { nameBebas } from "@/lib/fonts";
import { useScrambleDecode } from "@/lib/hooks/useScrambleDecode";
import { PROFILE_SHELL_GRID_STYLE } from "@/lib/profile/profileShellGrid";

type Props = {
  season: string;
  totalEntries: number;
};

function useCountUp(target: number, run: boolean, durationMs = 1100) {
  const [value, setValue] = useState(run ? 0 : target);

  useEffect(() => {
    let cancelled = false;
    if (!run) {
      setValue(target);
      return;
    }

    setValue(0);
    const start = performance.now();

    const tick = (now: number) => {
      if (cancelled) return;
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - t) ** 3;
      setValue(Math.round(target * eased));
      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        setValue(target);
      }
    };

    requestAnimationFrame(tick);
    return () => {
      cancelled = true;
    };
  }, [target, run, durationMs]);

  return value;
}

export default function PlayoffBracketMarketHeader({
  season,
  totalEntries,
}: Props) {
  const titleText = `${season} NBA PLAYOFF`;
  const titleDisplay = useScrambleDecode(titleText, true);
  const bracketCount = useCountUp(totalEntries, true, 1200);

  return (
    <header className="relative overflow-hidden rounded-2xl bg-[#050814]/80 px-6 py-2 text-white shadow-[0_10px_30px_rgba(0,0,0,0.55)]">
      <div
        className="pointer-events-none absolute inset-0 z-0 rounded-2xl opacity-[0.32]"
        style={PROFILE_SHELL_GRID_STYLE}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 z-1 opacity-40">
        <div className="absolute left-0 top-0 h-full w-full bg-[radial-gradient(circle_at_top,rgba(80,120,255,0.25),transparent_60%)]" />
      </div>

      <div className="relative z-2 flex flex-col items-center gap-1">
        <h1
          className={[
            "text-[36px] leading-none tracking-[0.04em]",
            nameBebas.className,
          ].join(" ")}
          style={{
            color: "#ffffff",
            textShadow:
              "0 0 8px rgba(255,255,255,0.35), 0 0 18px rgba(255,255,255,0.2), 0 0 34px rgba(255,255,255,0.1)",
          }}
        >
          {titleDisplay}
        </h1>

        <div className="mt-0 flex items-baseline gap-2">
          <span className="text-[12px] md:text-[14px] tracking-[0.25em] text-white/50">
            BRACKETS
          </span>

          <span className="text-3xl font-black tabular-nums text-cyan-300 md:text-5xl">
            {bracketCount}
          </span>
        </div>
      </div>
    </header>
  );
}
