"use client";

import { useEffect, useRef, useState } from "react";
import { roundMetricDecimals } from "@/lib/format/metricDecimals";

export function useRankCountUp(
  target: number,
  duration = 900,
  decimals = 0,
  enabled = true,
  onDone?: () => void
) {
  const [value, setValue] = useState(() =>
    enabled ? 0 : roundMetricDecimals(target, decimals)
  );
  const doneRef = useRef(false);

  useEffect(() => {
    doneRef.current = false;

    if (!enabled) {
      setValue(roundMetricDecimals(target, decimals));
      return;
    }

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    if (prefersReduced) {
      setValue(roundMetricDecimals(target, decimals));
      if (!doneRef.current) {
        doneRef.current = true;
        onDone?.();
      }
      return;
    }

    let raf = 0;
    const from = 0;
    setValue(from);
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (target - from) * eased;

      setValue(roundMetricDecimals(next, decimals));

      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else if (!doneRef.current) {
        doneRef.current = true;
        onDone?.();
      }
    };

    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [target, duration, decimals, enabled, onDone]);

  return value;
}