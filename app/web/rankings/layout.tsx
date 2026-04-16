"use client";

import CyberPageBackground from "@/app/component/rankings/CyberPageBackground";

/**
 * Web ランキング:
 * - 3D 背景はビューポート固定（window 自体は伸びない）
 * - 長いリストは内側のラッパーだけがスクロールし、背景レイヤーにスクロールを持たせない
 */
export default function WebRankingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden">
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-app"
        style={{
          width: "100vw",
          height: "100dvh",
          minHeight: "100svh",
          transform: "translateZ(0)",
          WebkitBackfaceVisibility: "hidden",
          backfaceVisibility: "hidden",
        }}
        aria-hidden
      >
        <CyberPageBackground positionMode="fill" />
      </div>
      <div
        data-web-rankings-scroll
        className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain touch-pan-y"
      >
        {children}
      </div>
    </div>
  );
}
