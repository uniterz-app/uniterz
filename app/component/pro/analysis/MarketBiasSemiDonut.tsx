"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  favorableWinRate: number;    // 順当 勝率（0–1）
  contrarianWinRate: number;   // 逆張り 勝率（0–1）
  favorableShare: number;      // 順当 構造比（0–1）
  contrarianShare: number;     // 逆張り 構造比（0–1）
};

export default function MarketBiasBars({
  favorableWinRate,
  contrarianWinRate,
  favorableShare,
  contrarianShare,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

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

  const favWinPct = Math.round(favorableWinRate * 100);
  const conWinPct = Math.round(contrarianWinRate * 100);

  const favSharePct = Math.round(favorableShare * 100);
  const conSharePct = Math.round(contrarianShare * 100);

  return (
    <div
      ref={ref}
      className="rounded-2xl border border-white/15 bg-[#050814]/80 p-4
                 shadow-[0_14px_40px_rgba(0,0,0,0.55)] space-y-4"
    >
      {/* ================= 勝率 ================= */}
      <div>
        <div className="mb-1 text-sm font-semibold text-white">
          市場志向 勝率
        </div>

        <div className="mb-1 flex justify-between text-xs text-white/60">
          <span>逆張り {conWinPct}%</span>
          <span>順当 {favWinPct}%</span>
        </div>

        <div className="relative h-3 w-full rounded-full bg-white/10 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-full w-[1px] bg-white/30" />

          <div
            className="absolute right-1/2 top-0 h-full bg-blue-600 transition-all"
            style={{
              width: visible ? `${conWinPct / 2}%` : "0%",
              transitionDuration: "1400ms",
            }}
          />

          <div
            className="absolute left-1/2 top-0 h-full bg-orange-600 transition-all"
            style={{
              width: visible ? `${favWinPct / 2}%` : "0%",
              transitionDuration: "1400ms",
              transitionDelay: "120ms",
            }}
          />
        </div>
      </div>

      {/* ================= 構造比 ================= */}
      <div>
        <div className="mb-1 text-sm font-semibold text-white">
          市場志向 構造比
        </div>

        <div className="mb-1 flex justify-between text-xs text-white/60">
          <span>逆張り {conSharePct}%</span>
          <span>順当 {favSharePct}%</span>
        </div>

        <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden flex">
          <div
            className="h-full bg-blue-600 transition-all"
            style={{
              width: visible ? `${conSharePct}%` : "0%",
              transitionDuration: "1400ms",
            }}
          />
          <div
            className="h-full bg-orange-600 transition-all"
            style={{
              width: visible ? `${favSharePct}%` : "0%",
              transitionDuration: "1400ms",
            }}
          />
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-white/50">
        ※ 上段は勝率、下段は投稿構造比を示しています
      </p>
    </div>
  );
}
