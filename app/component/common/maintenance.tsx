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
        <h1 className="text-xl font-bold mb-4">アップデートのお知らせ</h1>

        <p className="text-sm opacity-90 leading-relaxed">
          プレーオフに向けたアップデートを行っています。
          <br />
          約1ヶ月ほどお時間をいただきます。
          <br />
          再開の際はXやYouTubeで告知いたします。
          <br />
          ご協力よろしくお願いいたします。
        </p>
      </div>
    </div>
  );
}
