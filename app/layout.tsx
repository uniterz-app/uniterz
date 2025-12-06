import "@/app/globals.css";
import type { Metadata, Viewport } from "next";
import ToastHost from "@/app/component/ui/ToastHost";
import WebOrMobileSplash from "@/app/WebOrMobileSplash";
import AppActivityTracker from "@/app/component/common/AppActivityTracker";

// 🔥 ここだけ切り替えれば管理できる
const MAINTENANCE = true;

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
  // ====================================================
  // 🔥 メンテナンスモードなら強制的にこの画面のみ
  // ====================================================
  if (MAINTENANCE) {
    return (
      <html lang="ja">
        <body
          style={{
            backgroundColor: "#000",
            color: "#fff",
            width: "100vw",
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            textAlign: "center",
          }}
        >
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "16px" }}>
              現在、大幅な仕様変更中です
            </h1>
            <p style={{ fontSize: "14px", opacity: 0.8, lineHeight: 1.6 }}>
              ご意見を受けて、より良いアプリにするため作業を進めています。
              <br />
              完了まで <strong>1週間ほど</strong> お時間をいただきます。
            </p>
            <p style={{ fontSize: "14px", opacity: 0.8, marginTop: "16px", lineHeight: 1.6 }}>
              せっかく来ていただいたのに申し訳ありません。
              <br />
              少しだけ時間をください。
            </p>
          </div>
        </body>
      </html>
    );
  }

  // ====================================================
  // 🔥 通常モード
  // ====================================================
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
        <AppActivityTracker />
        <WebOrMobileSplash>{children}</WebOrMobileSplash>
        <ToastHost />
      </body>
    </html>
  );
}

