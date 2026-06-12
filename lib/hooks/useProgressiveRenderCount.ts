"use client";

import { useEffect, useState } from "react";

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

export function useProgressiveRenderCount(
  total: number,
  resetKey: string,
  initialCount = 24,
  batchSize = 24
) {
  const [visibleCount, setVisibleCount] = useState(() =>
    Math.min(total, initialCount)
  );

  useEffect(() => {
    const firstCount = Math.min(total, initialCount);
    setVisibleCount(firstCount);
    if (total <= firstCount) return;

    let cancelled = false;
    let idleHandle: number | null = null;
    let timeoutHandle: number | null = null;

    const schedule = (work: () => void) => {
      const idleWindow =
        typeof window === "undefined" ? null : (window as IdleWindow);
      if (idleWindow?.requestIdleCallback) {
        idleHandle = idleWindow.requestIdleCallback(work, { timeout: 180 });
        return;
      }
      timeoutHandle = window.setTimeout(work, 80);
    };

    const pump = () => {
      if (cancelled) return;
      setVisibleCount((current) => {
        const next = Math.min(total, current + batchSize);
        if (next < total) schedule(pump);
        return next;
      });
    };

    schedule(pump);

    return () => {
      cancelled = true;
      const idleWindow =
        typeof window === "undefined" ? null : (window as IdleWindow);
      if (idleHandle != null) idleWindow?.cancelIdleCallback?.(idleHandle);
      if (timeoutHandle != null) window.clearTimeout(timeoutHandle);
    };
  }, [total, resetKey, initialCount, batchSize]);

  return visibleCount;
}
