import { useEffect, useState } from "react";
import { roundMetricDecimals } from "@/lib/format/metricDecimals";

export function useCountUp(
  target: number,
  duration = 600,
  enabled = true,
  decimals = 0
) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setValue(roundMetricDecimals(target, decimals));
      return;
    }

    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const next = target * progress;
      setValue(roundMetricDecimals(next, decimals));

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }, [target, duration, enabled, decimals]);

  return value;
}
