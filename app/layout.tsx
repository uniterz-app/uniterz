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
import AppChrome from "@/app/component/AppChrome";

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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const maintenance = false;

  return (
    <html lang="ja">
      <head>
        <link
          rel="preload"
          href="/logo/uniterz-logo.glb"
          as="fetch"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${jp.className} ${authCondensed.variable}`}
        style={{
          backgroundColor: "#081116",
          margin: 0,
          padding: 0,
        }}
      >
        {maintenance ? (
          <MaintenanceOverlay />
        ) : (
          <>
            <EventGate />

            <div
              style={{
                perspective: "1400px",
                width: "100%",
                minHeight: "100vh",
              }}
            >
              <AppProviders>
                <WebOrMobileSplash>
                  <AppChrome />
                  {children}
                </WebOrMobileSplash>
              </AppProviders>
            </div>

            <ToastHost />
          </>
        )}
      </body>
    </html>
  );
}