"use client";

import { useEffect, useRef, useState } from "react";
import { MIN_SPLASH_DURATION_MS } from "@/app/component/splash/splashTiming";

/**
 * shouldShow が false になっても、表示開始から MIN_SPLASH_DURATION_MS 未満なら
 * その分だけオーバーレイを残す（3D など重いコンテンツ向け）。
 */
export function useMinimumSplashVisible(shouldShow: boolean): boolean {
  const [visible, setVisible] = useState(shouldShow);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (shouldShow) {
      setVisible(true);
      if (startedAtRef.current === null) {
        startedAtRef.current = Date.now();
      }
      return;
    }

    if (startedAtRef.current === null) {
      setVisible(false);
      return;
    }

    const elapsed = Date.now() - startedAtRef.current;
    const remaining = Math.max(0, MIN_SPLASH_DURATION_MS - elapsed);

    const finish = () => {
      setVisible(false);
      startedAtRef.current = null;
    };

    if (remaining === 0) {
      finish();
      return;
    }

    const t = setTimeout(finish, remaining);
    return () => clearTimeout(t);
  }, [shouldShow]);

  return visible;
}
