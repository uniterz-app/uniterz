"use client";

import { usePathname } from "next/navigation";
import { APP_WEB_APP_MAINTENANCE } from "@/lib/app/maintenanceMode";
import { isShareGuestPath } from "@/lib/share/shareGuestPaths";
import { useFirebaseUser } from "@/lib/useFirebaseUser";

/** 共有ページで、アプリ本体の代わりに共有用の画面を出すか（未ログイン or Web メンテ中） */
export function useShareLandingMode(): boolean {
  const pathname = usePathname();
  const { status } = useFirebaseUser();
  if (!isShareGuestPath(pathname)) return false;
  return APP_WEB_APP_MAINTENANCE || status === "guest";
}
