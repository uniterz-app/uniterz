"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import WebAppSeasonMaintenanceOverlay from "@/app/component/common/WebAppSeasonMaintenanceOverlay";
import {
  APP_WEB_APP_MAINTENANCE,
  isMaintenanceExemptPath,
} from "@/lib/app/maintenanceMode";
import { normalizeRoutePath } from "@/lib/profileSetupRoute";
import { useFirebaseUser } from "@/lib/useFirebaseUser";

/**
 * Web メンテ中はアプリ（ナビ・試合・chrome）をマウントしない。
 * LP・法務・ゲストの `/` スプラッシュだけ通す。
 */
export default function WebAppMaintenanceShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { status } = useFirebaseUser();

  if (!APP_WEB_APP_MAINTENANCE) return <>{children}</>;
  if (isMaintenanceExemptPath(pathname)) return <>{children}</>;

  const path = normalizeRoutePath(pathname);
  if (path.startsWith("/admin")) return <>{children}</>;

  const isRoot = !path || path === "/";
  if (isRoot && status !== "ready") return <>{children}</>;

  return <WebAppSeasonMaintenanceOverlay />;
}
