"use client";

import { useEffect, useRef, useState } from "react";
import { ShellGridOverlay } from "@/app/component/ui/ShellGridOverlay";

type Props = {
  homeRate: number;
  awayRate: number;
  homeShare: number;
  awayShare: number;
  /**
   * Pro Stats: after parent SummaryCardReveal, animate top bar then bottom bar.
   * When false, use viewport intersection (default).
   */
  orchestrateWithParent?: boolean;
  /** orchestrateWithParent 時、ラッパー入場アニメ後に true */
  parentRevealDone?: boolean;
};

export default function HomeAwayWinRateBar({
  homeRate,
  awayRate,
  homeShare,
  awayShare,
  orchestrateWithParent = false,
  parentRevealDone = false,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [ioVisible, setIoVisible] = useState(false);
  /** orchestrate 時: 1 = 勝率バー, 2 = 構造比バー */
  const [rowStage, setRowStage] = useState(0);

  useEffect(() => {
    if (orchestrateWithParent) return;
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIoVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [orchestrateWithParent]);

  useEffect(() => {
    if (!orchestrateWithParent) return;
    if (!parentRevealDone) {
      setRowStage(0);
      return;
    }
    setRowStage(1);
    const t = window.setTimeout(() => setRowStage(2), 440);
    return () => window.clearTimeout(t);
  }, [orchestrateWithParent, parentRevealDone]);

  const winRateVisible = orchestrateWithParent ? rowStage >= 1 : ioVisible;
  const shareVisible = orchestrateWithParent ? rowStage >= 2 : ioVisible;

  const homePct = Math.round(homeRate * 100);
  const awayPct = Math.round(awayRate * 100);

  const homeSharePct = Math.round(homeShare * 100);
  const awaySharePct = Math.round(awayShare * 100);

  return (
    <div
      ref={ref}
      className="relative overflow-hidden rounded-2xl border border-cyan-300/20 bg-[#050814]/85 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.55),0_0_24px_rgba(34,211,238,0.08)]"
    >
      <ShellGridOverlay roundedClassName="rounded-2xl" />
      <div className="relative z-1">
      {/* タイトル */}
      <div className="mb-3 text-sm md:text-base font-semibold text-white">
        Home / Away 分析
      </div>

      {/* ===== 勝率 ===== */}
      <div className="mb-1 flex justify-between text-xs md:text-sm text-white/60">
        <span>Away 勝率 {awayPct}%</span>
        <span>Home 勝率 {homePct}%</span>
      </div>

      <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/10">
        <div className="absolute left-1/2 top-0 h-full w-px bg-white/30" />

        <div
          className="absolute right-1/2 top-0 h-full transition-all ease-out"
          style={{
            width: winRateVisible ? `${awayPct / 2}%` : "0%",
            transitionDuration: "1200ms",
            transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
            background:
              "linear-gradient(90deg, rgba(217,70,239,0.45) 0%, rgba(244,114,182,0.92) 55%, rgba(251,113,133,0.98) 100%)",
            boxShadow:
              "0 0 12px rgba(232,121,249,0.45), inset 0 0 6px rgba(255,255,255,0.12)",
          }}
        />

        <div
          className="absolute left-1/2 top-0 h-full transition-all ease-out"
          style={{
            width: winRateVisible ? `${homePct / 2}%` : "0%",
            transitionDuration: "1200ms",
            transitionDelay: orchestrateWithParent ? "90ms" : "120ms",
            transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
            background:
              "linear-gradient(90deg, rgba(34,211,238,0.98) 0%, rgba(45,212,191,0.9) 55%, rgba(56,189,248,0.72) 100%)",
            boxShadow:
              "0 0 12px rgba(103,232,249,0.45), inset 0 0 6px rgba(255,255,255,0.12)",
          }}
        />
      </div>

      {/* ===== 構造比 ===== */}
      <div className="mt-4">
        <div className="mb-1 text-sm md:text-base font-semibold text-white">
          Home / Away 比率
        </div>

        <div className="mb-1 flex justify-between text-xs md:text-sm text-white/60">
          <span>Away 投稿比 {awaySharePct}%</span>
          <span>Home 投稿比 {homeSharePct}%</span>
        </div>

        <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/10">
          <div className="absolute left-1/2 top-0 h-full w-px bg-white/30" />
          <div
            className="absolute right-1/2 top-0 h-full transition-all ease-out"
            style={{
              width: shareVisible ? `${awaySharePct / 2}%` : "0%",
              transitionDuration: "1200ms",
              transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
              background:
                "linear-gradient(90deg, rgba(192,38,211,0.7) 0%, rgba(236,72,153,0.9) 100%)",
              boxShadow:
                "0 0 10px rgba(232,121,249,0.35), inset 0 0 5px rgba(255,255,255,0.1)",
            }}
          />
          <div
            className="absolute left-1/2 top-0 h-full transition-all ease-out"
            style={{
              width: shareVisible ? `${homeSharePct / 2}%` : "0%",
              transitionDuration: "1200ms",
              transitionDelay: orchestrateWithParent ? "90ms" : "120ms",
              transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
              background:
                "linear-gradient(90deg, rgba(6,182,212,0.95) 0%, rgba(20,184,166,0.78) 100%)",
              boxShadow:
                "0 0 10px rgba(103,232,249,0.35), inset 0 0 5px rgba(255,255,255,0.1)",
            }}
          />
        </div>
      </div>

      {/* 説明 */}
      <p className="mt-2 text-[11px] leading-relaxed text-white/50 lg:text-[12px]">
        ※ 上段：勝率 / 下段：投稿構造比（どちらを多く選んでいるか）
      </p>
      </div>
    </div>
  );
}