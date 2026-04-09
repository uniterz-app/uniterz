"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import SplashLoadingIndicator from "@/app/component/common/SplashLoadingIndicator";

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

  const [fadeDone, setFadeDone] = useState(
    () => !(forceSplash || status === "loading")
  );

  const doneCalledRef = useRef(false);

  useEffect(() => {
    if (!fadeDone) {
      document.body.classList.remove("bg-black");
      document.body.classList.add("splash-bg");
    }
  }, [shouldShowSplash, fadeDone]);

  useLayoutEffect(() => {
    if (shouldShowSplash || fadeDone) return;

    document.body.classList.remove("splash-bg");
    document.body.classList.add("bg-black");
    setFadeDone(true);

    if (!doneCalledRef.current) {
      doneCalledRef.current = true;
      onDone?.();
    }
  }, [shouldShowSplash, fadeDone, onDone]);

  const showSplashUi = shouldShowSplash || !fadeDone;

  if (showSplashUi) {
    return (
      <div className="relative flex h-screen w-screen items-center justify-center splash-screen-bg">
        <div className="mt-27 ml-4">
          <SplashLoadingIndicator />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
