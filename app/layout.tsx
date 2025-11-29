import "@/app/globals.css";
import type { Metadata, Viewport } from "next";
import ToastHost from "@/app/component/ui/ToastHost";
import WebOrMobileSplash from "@/app/WebOrMobileSplash";

export const metadata: Metadata = {
  title: "Uniterz",
  description: "Sports prediction platform",
  manifest: "/manifest.json",
  icons: {
    apple: "/icon/icon-192.png",
    icon: "/icon/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      {/* ⭐ 白飛び防止の固定背景は body の外に置く */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -1,
          backgroundImage: "url('/splash/splash-1170x2532.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: "black",
        }}
      />

      <body className="bg-black">
        <WebOrMobileSplash>{children}</WebOrMobileSplash>
        <ToastHost />
      </body>
    </html>
  );
}
