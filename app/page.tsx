"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AnimatedSplashScreen from "@/app/component/splash/AnimatedSplashScreen";
import { MIN_SPLASH_DURATION_MS } from "@/app/component/splash/splashTiming";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { getUserDocDataCached } from "@/lib/user/userDocCache";

export default function Page() {
  const router = useRouter();
  const { status, fUser } = useFirebaseUser();
  const [splashVisible, setSplashVisible] = useState(true);
  const [splashExitDone, setSplashExitDone] = useState(false);
  const openedAtRef = useRef(Date.now());
  const [handle, setHandle] = useState<string | null>(null);
  const [handleResolved, setHandleResolved] = useState(false);

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

  /** Firebase とハンドル解決が終わり、遷移先が決められる状態 */
  const navigateReady =
    status !== "loading" &&
    !(status === "ready" && fUser != null && !handleResolved);

  // 1 枚のスプラッシュで待つ：遷移可能になってから最低 MIN_SPLASH_DURATION_MS 経過後にフェードアウト
  useEffect(() => {
    if (!splashVisible) return;
    if (!navigateReady) return;

    const elapsed = Date.now() - openedAtRef.current;
    const wait = Math.max(0, MIN_SPLASH_DURATION_MS - elapsed);
    const t = setTimeout(() => {
      setSplashVisible(false);
    }, wait);
    return () => clearTimeout(t);
  }, [navigateReady, splashVisible]);

  useEffect(() => {
    if (!splashExitDone) return;

    const isMobile = window.innerWidth < 768;

    if (status === "ready" && fUser && handle) {
      router.replace(isMobile ? `/mobile/u/${handle}` : `/web/u/${handle}`);
      return;
    }

    if (status === "guest") {
      router.replace(isMobile ? "/mobile/signup" : "/web/signup");
      return;
    }

    router.replace(isMobile ? "/mobile/games" : "/web/games");
  }, [splashExitDone, status, fUser, handle, router]);

  return (
    <>
      {/* スプラッシュ切替・ルート遷移の隙間で白背景が見えないように下地を固定 */}
      <div className="pointer-events-none fixed inset-0 z-90 bg-app" aria-hidden />
      <AnimatePresence onExitComplete={() => setSplashExitDone(true)}>
        {splashVisible && (
          <motion.div
            key="root-splash"
            className="fixed inset-0 z-100"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <AnimatedSplashScreen />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
