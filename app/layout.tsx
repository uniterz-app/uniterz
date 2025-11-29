import "@/app/globals.css";
import type { Metadata, Viewport } from "next";
import ToastHost from "@/app/component/ui/ToastHost";
import WebOrMobileSplash from "@/app/WebOrMobileSplash"; // ← web/mobile スプラッシュ切替
import { useEffect, useState } from "react";

export const metadata: Metadata = {
  title: "Uniterz",
  description: "Sports prediction platform",
  manifest: "/manifest.json",
  icons: {
    apple: "/icon/icon-192.png",
    icon: "/icon/icon-192.png",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black",
    "apple-touch-startup-image-640x1136": "/splash/splash-640x1136.png",
    "apple-touch-startup-image-1170x2532": "/splash/splash-1170x2532.png",
    "apple-touch-startup-image": "/splash/splash-1170x2532.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-black">
        <MobileBackground />
        <WebOrMobileSplash>{children}</WebOrMobileSplash>
        <ToastHost />
      </body>
    </html>
  );
}

/* ============================================
   ★ Client Component：背景画像を後から追加する
   （← これなら window が必ず存在する）
=============================================== */
"use client";
function MobileBackground() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (window.innerWidth < 768) {
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
