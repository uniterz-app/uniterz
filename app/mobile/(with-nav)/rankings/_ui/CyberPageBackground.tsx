"use client";

import UniterzLogo3DBackground from "@/app/component/background/UniterzLogo3DBackground";

export default function CyberPageBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#081116]" />
      <UniterzLogo3DBackground />
    </div>
  );
}