"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  homeRate: number; // 0–1
  awayRate: number; // 0–1
};

export default function HomeAwayWinRateBar({
  homeRate,
  awayRate,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  /* =========================
   * Intersection Observer
   * ========================= */
  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const homePct = Math.round(homeRate * 100);
  const awayPct = Math.round(awayRate * 100);

  return (
    <div
      ref={ref}
      className="rounded-2xl border border-white/15 bg-[#050814]/80 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.55)]"
    >
      <div className="mb-2 text-sm font-semibold text-white">
        Home / Away 勝率
      </div>

      {/* ラベル */}
      <div className="mb-1 flex justify-between text-xs text-white/60">
        <span>Away {awayPct}%</span>
        <span>Home {homePct}%</span>
      </div>

      {/* バー */}
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/10">
        {/* 中央ライン */}
        <div className="absolute left-1/2 top-0 h-full w-[1px] bg-white/30" />

        {/* Away（左） */}
        <div
          className="absolute right-1/2 top-0 h-full bg-rose-400 transition-all ease-out"
          style={{
            width: visible ? `${awayPct / 2}%` : "0%",
            transitionDuration: "1400ms",
          }}
        />

        {/* Home（右） */}
        <div
          className="absolute left-1/2 top-0 h-full bg-emerald-400 transition-all ease-out"
          style={{
            width: visible ? `${homePct / 2}%` : "0%",
            transitionDuration: "1400ms",
            transitionDelay: "120ms",
          }}
        />
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-white/50">
        ※ 中央を基準に、左右で Home / Away の勝率を比較しています
      </p>
    </div>
  );
}
