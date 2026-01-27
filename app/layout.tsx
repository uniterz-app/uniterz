import "@/app/globals.css";
import type { Metadata, Viewport } from "next";
import ToastHost from "@/app/component/ui/ToastHost";
import WebOrMobileSplash from "@/app/WebOrMobileSplash";
import AppActivityTracker from "@/app/component/common/AppActivityTracker";
import EventGate from "@/app/component/common/EventGate";
import MaintenanceOverlay from "@/app/component/common/maintenance";
import NavBar from "@/app/component/NavBar";

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
          backgroundImage: "url('/splash/splash-1170x2532.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: "#000",
          margin: 0,
          padding: 0,
        }}
      >
        {maintenance ? (
          <MaintenanceOverlay />
        ) : (
          <>
            {/* transform / perspective の外 */}
            <NavBar />

            <AppActivityTracker />
            <EventGate />

            {/* アプリ本体 */}
            <div
              style={{
                perspective: "1400px",
                minHeight: "100vh",
                paddingBottom: "96px",
              }}
            >
              <WebOrMobileSplash>{children}</WebOrMobileSplash>
            </div>

            <ToastHost />
          </>
        )}
      </body>
    </html>
  );
}
