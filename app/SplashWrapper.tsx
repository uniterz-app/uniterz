"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useFirebaseUser } from "@/lib/useFirebaseUser";

export default function SplashWrapper({
  children,
  forceSplash = false,
  onDone,
}: {
  children?: React.ReactNode;
  forceSplash?: boolean;
  onDone?: () => void;
}) {
  const { status } = useFirebaseUser();
  const shouldShowSplash = forceSplash || status === "loading";

  const [fadeDone, setFadeDone] = useState(
    () => !(forceSplash || status === "loading")
  );

  const doneCalledRef = useRef(false);

  useEffect(() => {
    if (shouldShowSplash && !fadeDone) {
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
        <div className="mt-27 ml-4 animate-pulse text-sm text-white/80">
          Loading...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
