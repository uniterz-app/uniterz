"use client";

import { useEffect } from "react";

export default function NbaSeasonRestartMaintenanceOverlay() {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return (
    <div
      className="
        fixed inset-0 z-[9999]
        bg-black/80 backdrop-blur-sm
        flex items-center justify-center
        text-center text-white
        p-8
      "
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal
      aria-labelledby="nba-season-restart-title"
    >
      <div className="bg-white/10 border border-white/20 rounded-2xl p-8 max-w-md w-full">
        <h1 id="nba-season-restart-title" className="text-xl font-bold mb-4">
          再開のお知らせ
        </h1>

        <div className="text-sm opacity-90 leading-relaxed space-y-3">
          <p>遊んでくれてありがとうございます。</p>
          <p>
            NBA 26-27シーズンの開幕に向けて、もっといいユーザー体験を提供できるよう開発を進めています。
          </p>
          <p>再開の時期はまた動画やXで告知します。</p>
        </div>
      </div>
    </div>
  );
}
