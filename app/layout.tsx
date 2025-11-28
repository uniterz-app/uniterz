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

    // --- iPhone 用スプラッシュ画像 ---
    "apple-touch-startup-image-640x1136": "/splash/splash-640x1136.png",
    "apple-touch-startup-image-1170x2532": "/splash/splash-1170x2532.png",

    // fallback
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
      <body
        style={{
          margin: 0,
          padding: 0,
          // ⭐ 白飛び防止：最初からスプラッシュ画像を背景にする
          backgroundImage: "url('/splash/splash-1170x2532.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* web/mobile スプラッシュ切替（ロジックはそのまま） */}
        <WebOrMobileSplash>{children}</WebOrMobileSplash>

        <ToastHost />
      </body>
    </html>
  );
}
