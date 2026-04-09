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
      {/* Quiet pulse blobs (4 layers, staggered) */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          mixBlendMode: "screen",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "-8%",
            bottom: "8%",
            width: "44vw",
            maxWidth: 520,
            minWidth: 220,
            aspectRatio: "1 / 1",
            borderRadius: "9999px",
            background: `radial-gradient(circle, ${palette.main} 0%, rgba(0,0,0,0) 72%)`,
            filter: "blur(30px)",
            opacity: 0.3,
            animation: "auth-blob-pulse-a 5.2s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: "-10%",
            bottom: "6%",
            width: "42vw",
            maxWidth: 500,
            minWidth: 210,
            aspectRatio: "1 / 1",
            borderRadius: "9999px",
            background: `radial-gradient(circle, ${palette.sub} 0%, rgba(0,0,0,0) 72%)`,
            filter: "blur(32px)",
            opacity: 0.28,
            animation: "auth-blob-pulse-b 5.8s ease-in-out infinite",
            animationDelay: "-1.5s",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: "10%",
            top: "2%",
            width: "28vw",
            maxWidth: 340,
            minWidth: 160,
            aspectRatio: "1 / 1",
            borderRadius: "9999px",
            background: `radial-gradient(circle, ${palette.acc} 0%, rgba(0,0,0,0) 72%)`,
            filter: "blur(26px)",
            opacity: 0.24,
            animation: "auth-blob-pulse-c 6.4s ease-in-out infinite",
            animationDelay: "-2.7s",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "8%",
            top: "18%",
            width: "20vw",
            maxWidth: 240,
            minWidth: 120,
            aspectRatio: "1 / 1",
            borderRadius: "9999px",
            background:
              "radial-gradient(circle, rgba(255,255,255,0.18) 0%, rgba(0,0,0,0) 72%)",
            filter: "blur(20px)",
            opacity: 0.18,
            animation: "auth-blob-pulse-d 4.8s ease-in-out infinite",
            animationDelay: "-0.9s",
          }}
        />
      </div>
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
      <style>{`
        @keyframes auth-blob-pulse-a {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.22; }
          45% { transform: translate3d(0, -16px, 0) scale(1.2); opacity: 0.42; }
          70% { transform: translate3d(5px, 5px, 0) scale(0.9); opacity: 0.26; }
        }
        @keyframes auth-blob-pulse-b {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.2; }
          42% { transform: translate3d(-5px, -14px, 0) scale(1.18); opacity: 0.38; }
          72% { transform: translate3d(5px, 5px, 0) scale(0.9); opacity: 0.24; }
        }
        @keyframes auth-blob-pulse-c {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.16; }
          48% { transform: translate3d(0, -11px, 0) scale(1.16); opacity: 0.31; }
          74% { transform: translate3d(4px, 4px, 0) scale(0.9); opacity: 0.2; }
        }
        @keyframes auth-blob-pulse-d {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.12; }
          50% { transform: translate3d(0, -9px, 0) scale(1.14); opacity: 0.26; }
          78% { transform: translate3d(4px, 4px, 0) scale(0.9); opacity: 0.16; }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="auth-blob-pulse"] {
            animation: none !important;
          }
        }
      `}</style>
    </main>
  );
}
