"use client";

import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import CssAnimatedSplashScreen from "@/app/component/splash/CssAnimatedSplashScreen";
import { useMinimumSplashVisible } from "@/app/component/splash/useMinimumSplashVisible";
import { isPerfDebugSplashWebglDisabled } from "@/lib/perf/mobilePerfDebug";

const WebAnimatedSplashScreen = dynamic(
  () => import("@/app/component/splash/AnimatedSplashScreen"),
  { ssr: false },
);
import { sanitizeInternalNext } from "@/lib/auth/safeNextRedirect";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { usePathname, useRouter } from "next/navigation";

const WEB_GUEST_LEGAL_PREFIXES = [
  "/web/help",
  "/web/privacy",
  "/web/terms",
  "/web/contact",
  "/web/contacts",
] as const;

const MOBILE_GUEST_LEGAL_PREFIXES = [
  "/mobile/help",
  "/mobile/privacy",
  "/mobile/terms",
  "/mobile/contact",
] as const;

function isWebPublicPath(pathname: string | null): boolean {
  if (!pathname?.startsWith("/web")) return false;
  if (pathname === "/web/login" || pathname === "/web/signup") return true;
  if (pathname.startsWith("/web/reset")) return true;
  return WEB_GUEST_LEGAL_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

function isMobilePublicPath(pathname: string | null): boolean {
  if (!pathname?.startsWith("/mobile")) return false;
  if (pathname === "/mobile/login" || pathname === "/mobile/signup") return true;
  if (pathname.startsWith("/mobile/reset")) return true;
  return MOBILE_GUEST_LEGAL_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

type AuthGateProps = {
  children: React.ReactNode;
  platform: "web" | "mobile";
};

/**
 * /web/* /mobile/* のうち、ログイン不要なのは login / signup / reset、およびヘルプ・法務・お問い合わせなど。未ログインのそれ以外は各プラットフォームのサインアップへ送る。
 */
export default function AuthGate({ children, platform }: AuthGateProps) {
  const { status } = useFirebaseUser();
  const pathname = usePathname();
  const router = useRouter();

  const isPublic =
    platform === "web"
      ? isWebPublicPath(pathname)
      : isMobilePublicPath(pathname);

  const guestSignupHref =
    platform === "web" ? "/web/signup" : "/mobile/signup";

  const mustBlockForGuest = status === "guest" && !isPublic;
  const blocking = status === "loading" || mustBlockForGuest;
  const showBlockingSplash = useMinimumSplashVisible(blocking);

  const SplashScreen =
    platform === "mobile" || isPerfDebugSplashWebglDisabled()
      ? CssAnimatedSplashScreen
      : WebAnimatedSplashScreen;

  useEffect(() => {
    if (status !== "guest" || isPublic) return;
    const pathOnly = pathname ?? "";
    const safe = sanitizeInternalNext(pathOnly);
    const qs = safe ? `?next=${encodeURIComponent(safe)}` : "";
    router.replace(`${guestSignupHref}${qs}`);
  }, [status, isPublic, guestSignupHref, router, pathname]);

  return (
    <div className="min-h-dvh">
      <AnimatePresence mode="wait">
        {showBlockingSplash ? (
          <motion.div
            key="auth-splash"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-100"
          >
            <SplashScreen />
          </motion.div>
        ) : (
          <motion.div
            key="auth-main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex min-h-dvh w-full flex-1 flex-col"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
