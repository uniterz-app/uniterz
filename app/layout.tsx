import "@/app/globals.css";
import type { Metadata, Viewport } from "next";
import ToastHost from "@/app/component/ui/ToastHost";
import WebOrMobileSplash from "@/app/WebOrMobileSplash"; // ← web/mobile スプラッシュ切替

export const metadata: Metadata = {
  title: "Uniterz",
  description: "Sports prediction platform",
  manifest: "/manifest.json",
  icons: {
    apple: "/icon/icon-192.png",
    icon: "/icon/icon-192.png",
  },
  other: {
    // --- iOS PWA 設定 ---
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black",

    // --- iPhone 用スプラッシュ画像（現状あなたが持っている2種だけ反映）---

    // iPhone SE（640×1136）
    "apple-touch-startup-image-640x1136": "/splash/splash-640x1136.png",

    // iPhone 12 / 13 / 14 Pro（1170×2532）
    "apple-touch-startup-image-1170x2532": "/splash/splash-1170x2532.png",

    // デフォルト（最後の fallback）
    "apple-touch-startup-image": "/splash/splash-1170x2532.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        {/* web/mobile スプラッシュ切替 */}
        <WebOrMobileSplash>{children}</WebOrMobileSplash>

        <ToastHost />
      </body>
    </html>
  );
}
