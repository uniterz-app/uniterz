"use client";

/** 予想オーバーレイ MatchCard 内のトップビーム */
export default function PredictOverlayCyberDecor() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-5 top-0 z-[3] h-px bg-linear-to-r from-transparent via-cyan-400/55 to-transparent"
      style={{ boxShadow: "0 0 10px rgba(0,245,255,0.35)" }}
    />
  );
}
