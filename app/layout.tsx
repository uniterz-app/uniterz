import "@/app/globals.css";
import type { Metadata, Viewport } from "next";
import ToastHost from "@/app/component/ui/ToastHost";
import WebOrMobileSplash from "@/app/WebOrMobileSplash";
import { useSplashBackground } from "@/lib/useSplashBackground";

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
  const showSplashBg = useSplashBackground();

  return (
    <html lang="ja">
      <body className={showSplashBg ? "splash-bg" : "bg-black"}>
        <WebOrMobileSplash>{children}</WebOrMobileSplash>
        <ToastHost />
      </body>
    </html>
  );
}

