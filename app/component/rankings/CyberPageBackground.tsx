"use client";

import UniterzLogo3DBackground from "@/app/component/background/UniterzLogo3DBackground";

export default function CyberPageBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 w-screen overflow-hidden bg-app"
      style={{
        /* スクロールしてもビューポートに張り付き、3D が常に画面中央基準で見える */
        height: "100dvh",
        minHeight: "100lvh",
      }}
    >
      <div className="absolute inset-0">
        <UniterzLogo3DBackground />
      </div>
    </div>
  );
}