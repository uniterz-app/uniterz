// app/component/auth/AuthBackdrop.tsx
"use client";
import React from "react";

type Props = {
  children: React.ReactNode;
  accent?: "blueMagenta" | "tealBlue";
};

export default function AuthBackdrop({ children, accent = "blueMagenta" }: Props) {
  // パレット（主=左下, サブ=右下, アクセント=右上）
  const palette =
    accent === "tealBlue"
      ? {
          main: "rgba(0, 220, 200, 0.75)",
          sub: "rgba(16, 120, 255, 0.65)",
          acc: "rgba(0, 180, 255, 0.45)",
        }
      : {
          main: "rgba(0, 200, 255, 0.70)",
          sub: "rgba(0, 90, 255, 0.65)",
          acc: "rgba(230, 0, 255, 0.35)",
        };

  return (
    <main
      style={{
        position: "relative",
        minHeight: "100vh",
        background:
          // ベース（やや青みの黒）
          "radial-gradient(120% 120% at 50% 0%, rgba(8,12,20,0.9) 0%, rgba(6,10,16,0.95) 40%, #070b10 70%)",
        overflow: "hidden",
        color: "white",
      }}
    >
      {/* ソフトオーブ（ブラー弱め＝形が出る） */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `
            radial-gradient(48% 42% at 12% 78%, ${palette.main} 0%, rgba(0,0,0,0) 62%),
            radial-gradient(45% 40% at 90% 86%, ${palette.sub} 0%, rgba(0,0,0,0) 64%),
            radial-gradient(32% 28% at 86% 14%, ${palette.acc} 0%, rgba(0,0,0,0) 70%),
            radial-gradient(16% 12% at 12% 22%, rgba(255,255,255,0.16) 0%, rgba(0,0,0,0) 70%)
          `,
          filter: "blur(20px) saturate(120%)", // 形が見える程度にブラー弱め
          opacity: 0.95,
        }}
      />
      {/* 微細ドット＋ビネット（視線を中央へ） */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(70% 54% at 50% 40%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.35) 100%),
            radial-gradient(1px 1px at 8px 8px, rgba(255,255,255,0.08) 0, transparent 1px)
          `,
          backgroundSize: "100% 100%, 24px 24px",
          mixBlendMode: "overlay",
          opacity: 0.45,
          pointerEvents: "none",
        }}
      />
      {/* コンテンツ枠 */}
      <div
        style={{
          position: "relative",
          display: "grid",
          placeItems: "center",
          minHeight: "100vh",
          padding: "24px",
        }}
      >
        {children}
      </div>
    </main>
  );
}
