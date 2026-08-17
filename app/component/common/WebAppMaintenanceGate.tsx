"use client";

import { usePathname } from "next/navigation";
import WebAppSeasonMaintenanceOverlay from "@/app/component/common/WebAppSeasonMaintenanceOverlay";
import {
  APP_WEB_APP_MAINTENANCE,
  isMaintenanceExemptPath,
} from "@/lib/app/maintenanceMode";
import { useFirebaseUser } from "@/lib/useFirebaseUser";

/**
 * `/` でログイン済みならアプリへ進まずメンテ画面だけ出す。
 * （ゲストはスプラッシュから LP へ）
 */
export default function WebAppMaintenanceGate() {
  const pathname = usePathname();
  const { fUser } = useFirebaseUser();

  if (!APP_WEB_APP_MAINTENANCE) return null;
  if (isMaintenanceExemptPath(pathname)) return null;
  if (pathname !== "/" && pathname !== "") return null;
  if (!fUser) return null;

  return <WebAppSeasonMaintenanceOverlay />;
}
