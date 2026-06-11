"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import CssAnimatedSplashScreen from "@/app/component/splash/CssAnimatedSplashScreen";
import { useMinimumSplashVisible } from "@/app/component/splash/useMinimumSplashVisible";
import { useFirebaseUser } from "@/lib/useFirebaseUser";

type SplashWrapperProps = {
  children?: React.ReactNode;
  forceSplash?: boolean;
  /** スプラッシュ終了時（body 背景切り替え後）に一度だけ呼ぶ */
  onDone?: () => void;
};

export default function SplashWrapper({
  children,
  forceSplash = false,
  onDone,
}: SplashWrapperProps) {
  const { status } = useFirebaseUser();
  const shouldShowSplash = forceSplash || status === "loading";

  const showSplashOverlay = useMinimumSplashVisible(shouldShowSplash);

  const [fadeDone, setFadeDone] = useState(
    () => !(forceSplash || status === "loading")
  );

  const doneCalledRef = useRef(false);

  useEffect(() => {
    if (shouldShowSplash) {
      setFadeDone(false);
    }
  }, [shouldShowSplash]);

  useEffect(() => {
    if (!fadeDone) {
      document.body.classList.add("splash-bg");
    } else {
      document.body.classList.remove("splash-bg");
    }
  }, [fadeDone]);

  const handleSplashExitComplete = () => {
    setFadeDone(true);

    if (!doneCalledRef.current) {
      doneCalledRef.current = true;
      onDone?.();
    }
  };

  return (
    <>
      <AnimatePresence onExitComplete={handleSplashExitComplete}>
        {showSplashOverlay && (
          <motion.div
            key="firebase-splash"
            className="fixed inset-0 z-[100] bg-transparent"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <CssAnimatedSplashScreen />
          </motion.div>
        )}
      </AnimatePresence>
      {fadeDone && <>{children}</>}
    </>
  );
}
