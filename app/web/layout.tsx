"use client";

import { Geist, Geist_Mono, Montserrat } from "next/font/google";
import { usePathname } from "next/navigation";
import GamesPageBackground from "@/app/component/games/GamesPageBackground";
import "@/app/globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-montserrat",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function WebLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // ランキングは専用の 3D 背景（CyberPageBackground）を持つため除外
  const showCyberBackground = !pathname?.startsWith("/web/rankings");

  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} antialiased bg-app min-h-screen`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {showCyberBackground && <GamesPageBackground />}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
