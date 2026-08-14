"use client";

import { usePathname } from "next/navigation";
import { Geist, Geist_Mono, Montserrat } from "next/font/google";
import "@/app/globals.css";
import WebAppSeasonMaintenanceOverlay from "@/app/component/common/WebAppSeasonMaintenanceOverlay";
import {
  APP_WEB_APP_MAINTENANCE,
  isWebAppMaintenancePath,
} from "@/lib/app/maintenanceMode";

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
  const showSeasonMaintenance =
    APP_WEB_APP_MAINTENANCE && isWebAppMaintenancePath(pathname);

  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} antialiased min-h-screen`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="relative z-10">{children}</div>
      {showSeasonMaintenance ? <WebAppSeasonMaintenanceOverlay /> : null}
    </div>
  );
}
