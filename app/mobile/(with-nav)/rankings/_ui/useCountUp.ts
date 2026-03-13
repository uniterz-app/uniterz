"use client";

import { useEffect, useState } from "react";

export function useCountUp(target: number, duration = 650, enabled = true) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setValue(target);
      return;
    }

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    if (prefersReduced) {
      setValue(target);
      return;
    }

    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      // 少し気持ちいい減速
      const eased = 1 - Math.pow(1 - t, 3);

      const next = Math.round(target * eased);
      setValue(next);

      if (t < 1) raf = requestAnimationFrame(tick);
    };

    setValue(0);
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [target, duration, enabled]);

  return value;
}
