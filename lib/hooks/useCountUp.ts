import { useEffect, useState } from "react";

export function useCountUp(
  target: number,
  duration = 600,
  enabled = true,
  decimals = 0
) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setValue(target);
      return;
    }

    const startTime = performance.now();
    const p = Math.pow(10, decimals);

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const next = target * progress;
      setValue(Math.round(next * p) / p);

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }, [target, duration, enabled, decimals]);

  return value;
}
