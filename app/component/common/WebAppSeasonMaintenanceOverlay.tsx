"use client";

import { useEffect } from "react";

export default function WebAppSeasonMaintenanceOverlay() {
  useEffect(() => {
    const { overflow, touchAction } = document.body.style;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    return () => {
      document.body.style.overflow = overflow;
      document.body.style.touchAction = touchAction;
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483646,
        background: "#050508",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        color: "#fff",
        padding: 32,
        pointerEvents: "auto",
        touchAction: "none",
        overscrollBehavior: "none",
      }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal
      aria-labelledby="web-season-maintenance-title"
    >
      <div className="bg-white/10 border border-white/20 rounded-2xl p-8 max-w-md w-full">
        <h1
          id="web-season-maintenance-title"
          className="text-xl font-bold mb-4"
        >
          メンテナンス中
        </h1>
        <p className="text-sm opacity-90 leading-relaxed">
          現在、来季に向けてメンテナンスを行っています。
          <br />
          復旧までしばらくお待ちください。
          <br />
          ご不便をおかけして申し訳ありません。
        </p>
        <p className="mt-5 text-xs opacity-60 leading-relaxed">
          The app is currently under maintenance for next season.
          <br />
          Please check back later.
        </p>
        <a
          href="/lp"
          className="mt-6 inline-flex text-sm font-semibold text-cyan-300 underline-offset-4 hover:underline"
        >
          公式サイトへ
        </a>
      </div>
    </div>
  );
}
