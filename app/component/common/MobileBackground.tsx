"use client";

import { useEffect, useState } from "react";

export default function MobileBackground() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsMobile(true);
    }
  }, []);

  if (!isMobile) return null;

  return (
    <div
      style={{
        pointerEvents: "none",
        position: "fixed",
        inset: 0,
        zIndex: -1,
        backgroundImage: "url('/splash/splash-1170x2532.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    />
  );
}
