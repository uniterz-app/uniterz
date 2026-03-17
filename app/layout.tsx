import "@/app/globals.css";
import type { Metadata, Viewport } from "next";
import ToastHost from "@/app/component/ui/ToastHost";
import WebOrMobileSplash from "@/app/WebOrMobileSplash";
import AppActivityTracker from "@/app/component/common/AppActivityTracker";
import EventGate from "@/app/component/common/EventGate";
import MaintenanceOverlay from "@/app/component/common/maintenance";
import AppChrome from "@/app/component/AppChrome";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const maintenance = false;

  return (
    <html lang="ja">
      <body
        style={{
          backgroundColor: "#040A14",
          margin: 0,
          padding: 0,
        }}
      >
        {maintenance ? (
          <MaintenanceOverlay />
        ) : (
          <>
            <AppActivityTracker />
            <EventGate />

            <div
              style={{
                perspective: "1400px",
                width: "100%",
                minHeight: "100vh",
              }}
            >
              <WebOrMobileSplash>
                <AppChrome />
                {children}
              </WebOrMobileSplash>
            </div>

            <ToastHost />
          </>
        )}
      </body>
    </html>
  );
}