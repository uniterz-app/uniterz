"use client";

import { useEffect, useRef, useState } from "react";
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
  const [fadeDone, setFadeDone] = useState(false);
  const doneCalledRef = useRef(false);

  const shouldShowSplash = forceSplash || status === "loading";

  useEffect(() => {
    if (shouldShowSplash && !fadeDone) {
      document.body.classList.remove("bg-black");
      document.body.classList.add("splash-bg");
      return;
    }

    if (!shouldShowSplash && !fadeDone) {
      const timer = setTimeout(() => {
        document.body.classList.remove("splash-bg");
        document.body.classList.add("bg-black");
        setFadeDone(true);

        if (!doneCalledRef.current) {
          doneCalledRef.current = true;
          onDone?.();
        }
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [shouldShowSplash, fadeDone, onDone]);

  if (shouldShowSplash && !fadeDone) {
    return (
      <div className="w-screen h-screen flex items-center justify-center relative splash-screen-bg">
        <div className="mt-[6.75rem] ml-4 text-white/80 text-sm animate-pulse">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}