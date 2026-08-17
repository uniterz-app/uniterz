"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import Header from "@/app/component/Header";
import { isGuestLegalPath } from "@/lib/guestLegalPaths";
import { isGuestPreviewPath } from "@/lib/guestPreviewPaths";
import { isPublicLpPath } from "@/lib/lp/publicLpPaths";
import {
  getAppBrandShelfHidden,
  subscribeAppBrandShelfHidden,
} from "@/lib/ui/appBrandShelfVisibility";
import {
  getTutorialWelcomeBrandHidden,
  subscribeTutorialWelcomeBrandHidden,
} from "@/lib/tutorial/tutorialWelcomeChrome";
import {
  getTutorialRestartCover,
  getTutorialRestartCoverColor,
  subscribeTutorialRestartCover,
} from "@/lib/tutorial/tutorialRestartCover";

export default function AppChrome() {
  const pathname = usePathname() ?? "";
  const brandShelfHidden = useSyncExternalStore(
    subscribeAppBrandShelfHidden,
    getAppBrandShelfHidden,
    () => false
  );
  const welcomeBrandHidden = useSyncExternalStore(
    subscribeTutorialWelcomeBrandHidden,
    getTutorialWelcomeBrandHidden,
    () => false
  );
  const restartCover = useSyncExternalStore(
    subscribeTutorialRestartCover,
    getTutorialRestartCover,
    () => false
  );

  const shouldHideAll =
    pathname === "/" ||
    isPublicLpPath(pathname) ||
    pathname === "/web" ||
    pathname === "/mobile" ||
    pathname === "/web/login" ||
    pathname === "/mobile/login" ||
    pathname === "/web/signup" ||
    pathname === "/mobile/signup" ||
    pathname === "/web/reset" ||
    pathname === "/mobile/reset" ||
    isGuestPreviewPath(pathname) ||
    isGuestLegalPath(pathname);

  const shouldHideHeader =
    pathname === "/web/rankings" ||
    pathname === "/mobile/rankings" ||
    pathname.startsWith("/web/communities/") ||
    pathname.startsWith("/mobile/communities/") ||
    brandShelfHidden ||
    welcomeBrandHidden;

  const cover = restartCover ? (
    <div
      aria-hidden
      className="fixed inset-0"
      style={{
        background: getTutorialRestartCoverColor(),
        zIndex: 200000,
        pointerEvents: "auto",
      }}
    />
  ) : null;

  if (shouldHideAll) return cover;

  // 下部ナビは WebOrMobileSplash でのみ描画（二重 portal 防止）
  return (
    <>
      {cover}
      {!shouldHideHeader ? <Header /> : null}
    </>
  );
}
