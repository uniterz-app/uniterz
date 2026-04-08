// app/component/pro/analysis/StreakSummaryCard.tsx
"use client";

import { Flame, CloudRain } from "lucide-react";
import { useEffect, useState } from "react";
import { ShellGridOverlay } from "@/app/component/ui/ShellGridOverlay";
import { resultStatsMetricNumClass } from "@/lib/fonts";
import { roundMetricDecimals } from "@/lib/format/metricDecimals";
import { useInViewOnce } from "@/lib/hooks/useInViewOnce";

function useVisibleCountUp(target: number, enabled: boolean, duration = 700) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setValue(0);
      return;
    }
    const start = performance.now();
    let rafId = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setValue(roundMetricDecimals(target * progress, 0));
      if (progress < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, enabled, duration]);

  return value;
}

type Props = {
  maxWinStreak: number;
  maxLoseStreak: number;
  periodLabel?: string;
  lastMaxWinStreak?: number;
  lastMaxLoseStreak?: number;
};

export default function StreakSummaryCard({
  maxWinStreak,
  maxLoseStreak,
  periodLabel,
  lastMaxWinStreak,
  lastMaxLoseStreak,
}: Props) {
  const iv = useInViewOnce({ threshold: 0.2 });
  const cuWin = useVisibleCountUp(maxWinStreak, iv.inView, 760);
  const cuLose = useVisibleCountUp(maxLoseStreak, iv.inView, 760);

  return (
    <div
      ref={iv.ref}
      className="relative overflow-hidden rounded-2xl border border-cyan-300/20 bg-[#050814]/85 p-3 shadow-[0_14px_40px_rgba(0,0,0,0.55),0_0_20px_rgba(34,211,238,0.08)]"
    >
      <ShellGridOverlay roundedClassName="rounded-2xl" />
      <div className="relative z-1">
        <div className="mb-2 text-[11px] text-white/60 md:text-[14px]">
          {periodLabel ? `${periodLabel} の連勝 / 連敗` : "今月の連勝 / 連敗"}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-fuchsia-300/20 bg-[#050814]/65 p-3 shadow-[0_0_14px_rgba(217,70,239,0.08)]">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 ring-1 ring-white/10 md:h-8 md:w-8">
                <Flame className="h-3.5 w-3.5 text-cyan-300 md:h-4 md:w-4" />
              </div>
              <div className="text-xs text-white/70 md:text-[15px]">最大連勝</div>
            </div>

            <div
              className={[
                resultStatsMetricNumClass,
                "mt-2 text-[1.7rem] tabular-nums text-cyan-300 md:text-[2rem]",
              ].join(" ")}
            >
              {cuWin}
            </div>

            {lastMaxWinStreak !== undefined && (
              <div className="mt-0.5 text-[11px] text-white/45 md:text-[13px]">
                先月 {lastMaxWinStreak}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-cyan-300/20 bg-[#050814]/65 p-3 shadow-[0_0_14px_rgba(34,211,238,0.08)]">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 ring-1 ring-white/10 md:h-8 md:w-8">
                <CloudRain className="h-3.5 w-3.5 text-fuchsia-400 md:h-4 md:w-4" />
              </div>
              <div className="text-xs text-white/70 md:text-[15px]">最大連敗</div>
            </div>

            <div
              className={[
                resultStatsMetricNumClass,
                "mt-2 text-[1.7rem] tabular-nums text-fuchsia-400 md:text-[2rem]",
              ].join(" ")}
            >
              {cuLose}
            </div>

            {lastMaxLoseStreak !== undefined && (
              <div className="mt-0.5 text-[11px] text-white/45 md:text-[13px]">
                先月 {lastMaxLoseStreak}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}