import { useEffect, useState } from "react";

export function useCountUp(
  target: number,
  duration = 600,
  enabled = true
) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setValue(target);
      return;
    }

    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const next = Math.round(target * progress);
      setValue(next);

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }, [target, duration, enabled]);

  return value;
}
