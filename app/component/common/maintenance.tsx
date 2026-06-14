"use client";

import { useEffect } from "react";

export default function MaintenanceOverlay() {
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
    >
      <div className="bg-white/10 border border-white/20 rounded-2xl p-8 max-w-md w-full">
        <h1 className="text-xl font-bold mb-4">メンテナンス中</h1>

        <p className="text-sm opacity-90 leading-relaxed">
          ランキング機能に不具合が発生しているため、現在メンテナンス中です。
          <br />
          復旧までしばらくお待ちください。
          <br />
          ご不便をおかけして申し訳ありません。
        </p>

        <p className="mt-5 text-xs opacity-60 leading-relaxed">
          Rankings are temporarily unavailable due to maintenance.
          <br />
          Please check back later.
        </p>
      </div>
    </div>
  );
}
