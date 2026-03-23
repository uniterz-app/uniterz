"use client";

import UniterzLogo3DBackground from "@/app/component/background/UniterzLogo3DBackground";

export default function CyberPageBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* base color */}
      <div className="absolute inset-0 bg-app" />

      {/* 3D background */}
      <div className="absolute inset-0">
        <UniterzLogo3DBackground />
      </div>
    </div>
  );
}