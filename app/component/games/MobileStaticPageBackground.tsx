"use client";

import RisingMotesLayer from "@/app/component/games/RisingMotesLayer";

/**
 * モバイル向けの軽量固定背景。
 * オーロラ等の多層アニメは使わず、静的グラデ＋上昇バーティクルのみ。
 */
export default function MobileStaticPageBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #021208 0%, #020e09 52%, #010805 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.55,
          background: `
            radial-gradient(ellipse 72% 48% at 18% 6%, rgba(52,211,153,0.14) 0%, transparent 62%),
            radial-gradient(ellipse 58% 42% at 82% 14%, rgba(34,211,238,0.08) 0%, transparent 65%),
            radial-gradient(ellipse 80% 40% at 50% 100%, rgba(45,212,191,0.1) 0%, transparent 68%)
          `,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.35,
          backgroundImage: `
            radial-gradient(circle, rgba(134,210,180,0.14) 0.55px, transparent 0.65px)
          `,
          backgroundSize: "20px 20px",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 95% 88% at 50% 44%, transparent 0%, rgba(0,0,0,0.2) 68%, rgba(0,0,0,0.45) 100%)
          `,
        }}
      />
      <RisingMotesLayer lite />
    </div>
  );
}
