"use client";

import UniterzLogo3DBackground from "@/app/component/background/UniterzLogo3DBackground";

export default function CyberPageBackground() {
  return (
    <div
      className="pointer-events-none fixed left-0 top-0 z-0 w-full overflow-hidden bg-app"
      style={{
        /* 動的 dvh ではなく large viewport：UI バーの伸縮でキャンバスが縮み、背景が「変わった」ように見えるのを抑える */
        height: "100lvh",
        minHeight: "100lvh",
      }}
    >
      <div className="absolute inset-0">
        <UniterzLogo3DBackground />
      </div>
    </div>
  );
}