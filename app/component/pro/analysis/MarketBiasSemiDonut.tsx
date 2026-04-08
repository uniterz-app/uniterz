"use client";

import { useEffect, useRef, useState } from "react";
import { ShellGridOverlay } from "@/app/component/ui/ShellGridOverlay";

type Props = {
  favorableWinRate: number;
  contrarianWinRate: number;
  favorableShare: number;
  contrarianShare: number;
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
      className="relative space-y-4 overflow-hidden rounded-2xl border border-cyan-300/20 bg-[#050814]/85 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.55),0_0_24px_rgba(56,189,248,0.08)]"
    >
      <ShellGridOverlay roundedClassName="rounded-2xl" />
      <div className="relative z-1 space-y-4">
      {/* ================= 勝率 ================= */}
      <div>
        <div className="mb-1 text-sm font-semibold text-white md:text-base">
          市場志向 勝率
        </div>

        <div className="mb-1 flex justify-between text-xs text-white/60 md:text-sm">
          <span>逆張り {conWinPct}%</span>
          <span>順当 {favWinPct}%</span>
        </div>

        <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/10">
          <div className="absolute left-1/2 top-0 h-full w-px bg-white/30" />

          <div
            className="absolute right-1/2 top-0 h-full transition-all"
            style={{
              width: visible ? `${conWinPct / 2}%` : "0%",
              transitionDuration: "1200ms",
              transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
              background:
                "linear-gradient(90deg, rgba(14,116,255,0.55) 0%, rgba(34,211,238,0.95) 100%)",
              boxShadow:
                "0 0 12px rgba(34,211,238,0.45), inset 0 0 6px rgba(255,255,255,0.12)",
            }}
          />

          <div
            className="absolute left-1/2 top-0 h-full transition-all"
            style={{
              width: visible ? `${favWinPct / 2}%` : "0%",
              transitionDuration: "1200ms",
              transitionDelay: "120ms",
              transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
              background:
                "linear-gradient(90deg, rgba(217,70,239,0.95) 0%, rgba(249,115,22,0.9) 100%)",
              boxShadow:
                "0 0 12px rgba(217,70,239,0.45), inset 0 0 6px rgba(255,255,255,0.12)",
            }}
          />
        </div>
      </div>

      {/* ================= 構造比 ================= */}
      <div>
        <div className="mb-1 text-sm font-semibold text-white md:text-base">
          市場志向 構造比
        </div>

        <div className="mb-1 flex justify-between text-xs text-white/60 md:text-sm">
          <span>逆張り {conSharePct}%</span>
          <span>順当 {favSharePct}%</span>
        </div>

        <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full transition-all"
            style={{
              width: visible ? `${conSharePct}%` : "0%",
              transitionDuration: "1200ms",
              transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
              background:
                "linear-gradient(90deg, rgba(14,116,255,0.78) 0%, rgba(34,211,238,0.95) 100%)",
              boxShadow:
                "0 0 10px rgba(34,211,238,0.4), inset 0 0 5px rgba(255,255,255,0.1)",
            }}
          />
          <div
            className="h-full transition-all"
            style={{
              width: visible ? `${favSharePct}%` : "0%",
              transitionDuration: "1200ms",
              transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
              background:
                "linear-gradient(90deg, rgba(217,70,239,0.88) 0%, rgba(249,115,22,0.92) 100%)",
              boxShadow:
                "0 0 10px rgba(217,70,239,0.4), inset 0 0 5px rgba(255,255,255,0.1)",
            }}
          />
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-white/50 md:text-[13px]">
        ※ 上段は勝率、下段は投稿構造比を示しています
      </p>
      </div>
    </div>
  );
}