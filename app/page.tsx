"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AnimatedSplashScreen from "@/app/component/splash/AnimatedSplashScreen";
import { MIN_SPLASH_DURATION_MS } from "@/app/component/splash/splashTiming";
import { useMinimumSplashVisible } from "@/app/component/splash/useMinimumSplashVisible";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { getUserDocDataCached } from "@/lib/user/userDocCache";

export default function Page() {
  const router = useRouter();
  const { status, fUser } = useFirebaseUser();
  const [introVisible, setIntroVisible] = useState(true);
  const [introExitDone, setIntroExitDone] = useState(false);
  const [handle, setHandle] = useState<string | null>(null);
  const [handleResolved, setHandleResolved] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIntroVisible(false), MIN_SPLASH_DURATION_MS);
    return () => clearTimeout(t);
  }, []);

  const secondPhaseNeedSplash = Boolean(
    introExitDone &&
      (status === "loading" ||
        (status === "ready" && fUser != null && !handleResolved))
  );
  const showSecondSplash = useMinimumSplashVisible(secondPhaseNeedSplash);

  useEffect(() => {
    if (!fUser) {
      setHandle(null);
      setHandleResolved(true);
      return;
    }
    setHandleResolved(false);
    let cancelled = false;
    (async () => {
      const data = await getUserDocDataCached(fUser.uid);
      if (cancelled) return;
      const h = data?.handle || data?.slug || null;
      setHandle(h);
      setHandleResolved(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [fUser]);

  useEffect(() => {
    if (!introExitDone) return;
    if (status === "loading") return;
    if (status === "ready" && fUser && !handleResolved) return;

    const isMobile = window.innerWidth < 768;

    if (status === "ready" && fUser && handle) {
      router.replace(isMobile ? `/mobile/u/${handle}` : `/web/u/${handle}`);
      return;
    }

    if (status === "guest") {
      router.replace(isMobile ? "/mobile/lp" : "/lp");
      return;
    }

    router.replace(isMobile ? "/mobile/games" : "/web/games");
  }, [
    introExitDone,
    status,
    fUser,
    handle,
    handleResolved,
    router,
  ]);

  if (!introExitDone) {
    return (
      <AnimatePresence onExitComplete={() => setIntroExitDone(true)}>
        {introVisible && (
          <motion.div
            key="root-intro-splash"
            className="fixed inset-0 z-[100]"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <AnimatedSplashScreen />
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  if (showSecondSplash) {
    return <AnimatedSplashScreen />;
  }

  return null;
}
