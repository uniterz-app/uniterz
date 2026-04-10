"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import AnimatedSplashScreen from "@/app/component/splash/AnimatedSplashScreen";
import { useMinimumSplashVisible } from "@/app/component/splash/useMinimumSplashVisible";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { usePathname, useRouter } from "next/navigation";

function isWebPublicPath(pathname: string | null): boolean {
  if (!pathname?.startsWith("/web")) return false;
  if (pathname === "/web/login" || pathname === "/web/signup") return true;
  if (pathname.startsWith("/web/reset")) return true;
  return false;
}

function isMobilePublicPath(pathname: string | null): boolean {
  if (!pathname?.startsWith("/mobile")) return false;
  if (pathname === "/mobile/login" || pathname === "/mobile/signup") return true;
  if (pathname.startsWith("/mobile/reset")) return true;
  return false;
}

type AuthGateProps = {
  children: React.ReactNode;
  platform: "web" | "mobile";
};

/**
 * /web/* /mobile/* のうち、ログイン不要なのは login / signup / reset のみ。
 * 未ログインは各プラットフォームの LP へ送る。
 */
export default function AuthGate({ children, platform }: AuthGateProps) {
  const { status } = useFirebaseUser();
  const pathname = usePathname();
  const router = useRouter();

  const isPublic =
    platform === "web"
      ? isWebPublicPath(pathname)
      : isMobilePublicPath(pathname);

  const lpHref = platform === "web" ? "/lp" : "/mobile/lp";

  const mustBlockForGuest = status === "guest" && !isPublic;
  const blocking = status === "loading" || mustBlockForGuest;
  const showBlockingSplash = useMinimumSplashVisible(blocking);

  useEffect(() => {
    if (status !== "guest" || isPublic) return;
    router.replace(lpHref);
  }, [status, isPublic, lpHref, router]);

  return (
    <AnimatePresence mode="wait">
      {showBlockingSplash ? (
        <motion.div
          key="auth-splash"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[100]"
        >
          <AnimatedSplashScreen />
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
  );
}
