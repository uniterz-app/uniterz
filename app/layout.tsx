import "@/app/globals.css";
import type { Metadata, Viewport } from "next";
import { Bebas_Neue } from "next/font/google";
import { jp } from "@/lib/fonts";

const authCondensed = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-auth-condensed",
});
import AppProviders from "@/app/AppProviders";
import ToastHost from "@/app/component/ui/ToastHost";
import WebOrMobileSplash from "@/app/WebOrMobileSplash";
import EventGate from "@/app/component/common/EventGate";
import MaintenanceOverlay from "@/app/component/common/maintenance";
import { APP_MAINTENANCE_MODE } from "@/lib/app/maintenanceMode";
import AppChrome from "@/app/component/AppChrome";
import AppContentShell from "@/app/component/AppContentShell";
import AppPageBackground from "@/app/component/AppPageBackground";
import SplashGlbPreload from "@/app/component/splash/SplashGlbPreload";

export const metadata: Metadata = {
  title: "Uniterz",
  description: "Sports prediction platform",
  manifest: "/manifest.json",
  icons: {
    apple: "/icon-new/Icon-new192.png",
    icon: "/icon-new/Icon-new192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  /** キーボード表示でレイアウト viewport を縮めない（入力時の画面ヨレ防止） */
  interactiveWidget: "overlays-content",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const maintenance = APP_MAINTENANCE_MODE;

  return (
    <html lang="ja">
      <head />
      <body
        className={`${jp.className} ${authCondensed.variable}`}
        style={{
          backgroundColor: "#021208",
          margin: 0,
          padding: 0,
        }}
      >
        {maintenance ? (
          <MaintenanceOverlay />
        ) : (
          <>
            <SplashGlbPreload />
            <AppPageBackground />
            <EventGate />

            <AppContentShell>
              <AppProviders>
                <WebOrMobileSplash>
                  <AppChrome />
                  {children}
                </WebOrMobileSplash>
              </AppProviders>
            </AppContentShell>

            <ToastHost />
          </>
        )}
      </body>
    </html>
  );
}