"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  homeRate: number;   // 勝率（0–1）
  awayRate: number;   // 勝率（0–1）
  homeShare: number;  // 投稿構造比（0–1）
  awayShare: number;  // 投稿構造比（0–1）
};

export default function HomeAwayWinRateBar({
  homeRate,
  awayRate,
  homeShare,
  awayShare,
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

  const homeSharePct = Math.round(homeShare * 100);
  const awaySharePct = Math.round(awayShare * 100);

  return (
    <div
      ref={ref}
      className="rounded-2xl border border-white/15 bg-[#050814]/80 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.55)]"
    >
      <div className="mb-3 text-sm font-semibold text-white">
        Home / Away 分析
      </div>

      {/* ===== 勝率 ===== */}
      <div className="mb-1 flex justify-between text-xs text-white/60">
        <span>Away 勝率 {awayPct}%</span>
        <span>Home 勝率 {homePct}%</span>
      </div>

      <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/10">
        <div className="absolute left-1/2 top-0 h-full w-[1px] bg-white/30" />

        <div
          className="absolute right-1/2 top-0 h-full bg-rose-400 transition-all ease-out"
          style={{
            width: visible ? `${awayPct / 2}%` : "0%",
            transitionDuration: "1400ms",
          }}
        />

        <div
          className="absolute left-1/2 top-0 h-full bg-emerald-400 transition-all ease-out"
          style={{
            width: visible ? `${homePct / 2}%` : "0%",
            transitionDuration: "1400ms",
            transitionDelay: "120ms",
          }}
        />
      </div>

      {/* ===== 構造比（左右分割） ===== */}
      <div className="mt-4">
        <div className="mb-1 text-sm font-semibold text-white">
          Home / Away 比率
        </div>

        <div className="mb-1 flex justify-between text-xs text-white/60">
          <span>Away 投稿比 {awaySharePct}%</span>
          <span>Home 投稿比 {homeSharePct}%</span>
        </div>

        <div className="h-3 w-full overflow-hidden rounded-full bg-white/10 flex">
          <div
            className="h-full bg-rose-400/70 transition-all ease-out"
            style={{
              width: visible ? `${awaySharePct}%` : "0%",
              transitionDuration: "1400ms",
            }}
          />
          <div
            className="h-full bg-emerald-400/70 transition-all ease-out"
            style={{
              width: visible ? `${homeSharePct}%` : "0%",
              transitionDuration: "1400ms",
              transitionDelay: "120ms",
            }}
          />
        </div>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-white/50">
        ※ 上段：勝率 / 下段：投稿構造比（どちらを多く選んでいるか）
      </p>
    </div>
  );
}
