import { useEffect, useState } from "react";
import { roundMetricDecimals } from "@/lib/format/metricDecimals";

/**
 * @param whenDisabled - `target`: アニメ無効時は最終値を即表示（期間切替など）。`zero`: 0 を表示（ビューポート入場まで非表示相当）。後者は `enabled` が false→true になったとき 0 からカウントアップする。
 */
export function useCountUp(
  target: number,
  duration = 600,
  enabled = true,
  decimals = 0,
  whenDisabled: "target" | "zero" = "target"
) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setValue(
        whenDisabled === "zero"
          ? roundMetricDecimals(0, decimals)
          : roundMetricDecimals(target, decimals)
      );
      return;
    }

    let cancelled = false;
    let raf = 0;
    const startTime = performance.now();

    const tick = (now: number) => {
      if (cancelled) return;
      const progress = Math.min((now - startTime) / duration, 1);
      const next = target * progress;
      setValue(roundMetricDecimals(next, decimals));
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [target, duration, enabled, decimals, whenDisabled]);

  return value;
}
