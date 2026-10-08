"use client";

import { useEffect } from "react";
import { getAppStoreShareUrl } from "@/lib/share/shareAppUrls";

export default function WebAppSeasonMaintenanceOverlay() {
  const appStoreUrl = getAppStoreShareUrl();

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
          UNITERZ はアプリになりました
        </h1>
        <p className="text-sm opacity-90 leading-relaxed">
          今シーズンからはアプリで予想に参加できます。
          <br />
          Web 版のアカウントでそのままログインできます。
        </p>
        <p className="mt-5 text-xs opacity-60 leading-relaxed">
          UNITERZ is now available as an app.
          <br />
          Sign in with your existing account.
        </p>
        {appStoreUrl ? (
          <a
            href={appStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-bold text-black"
          >
            App Store でダウンロード
          </a>
        ) : null}
        <p className="mt-3 text-xs opacity-60">Android 版は近日公開</p>
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
