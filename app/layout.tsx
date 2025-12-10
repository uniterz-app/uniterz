import "@/app/globals.css";
import type { Metadata, Viewport } from "next";
import ToastHost from "@/app/component/ui/ToastHost";
import WebOrMobileSplash from "@/app/WebOrMobileSplash";
import AppActivityTracker from "@/app/component/common/AppActivityTracker";

// ★ 追加：メンテナンス表示コンポーネント
import MaintenanceOverlay from "@/app/component/common/maintenance";

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
  // ★ 今だけ true にしてメンテナンスモードを強制
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
        {/* ★ maintenance が true の間はアプリを覆う */}
        {maintenance ? (
          <MaintenanceOverlay />
        ) : (
          <>
            <AppActivityTracker />
            <WebOrMobileSplash>{children}</WebOrMobileSplash>
            <ToastHost />
          </>
        )}
      </body>
    </html>
  );
}

