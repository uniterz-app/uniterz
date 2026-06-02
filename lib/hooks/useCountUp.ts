import { useEffect, useRef, useState } from "react";
import { roundMetricDecimals } from "@/lib/format/metricDecimals";

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

function finalStepValue(target: number, decimals: number): number {
  return roundMetricDecimals(target, decimals);
}

/** アニメ中の表示値（小数は桁固定、整数は floor で桁が暴れないようにする） */
function stepDisplayValue(
  raw: number,
  decimals: number,
  done: boolean,
  target: number
): number {
  if (done) return finalStepValue(target, decimals);
  if (decimals <= 0) return Math.floor(raw);
  return roundMetricDecimals(raw, decimals);
}

/**
 * @param whenDisabled - `target`: アニメ無効時は最終値を即表示。`zero`: 0 を表示（入場まで）。
 */
export function useCountUp(
  target: number,
  duration = 600,
  enabled = true,
  decimals = 0,
  whenDisabled: "target" | "zero" = "target"
) {
  const safeTarget = Number.isFinite(target) ? target : 0;
  const displayRef = useRef(0);
  const animGenRef = useRef(0);

  const [value, setValue] = useState(() => {
    if (!enabled) {
      return whenDisabled === "zero"
        ? 0
        : finalStepValue(safeTarget, decimals);
    }
    return 0;
  });

  useEffect(() => {
    if (!enabled) {
      const v =
        whenDisabled === "zero"
          ? 0
          : finalStepValue(safeTarget, decimals);
      displayRef.current = v;
      setValue(v);
      return;
    }

    const gen = ++animGenRef.current;
    const endValue = finalStepValue(safeTarget, decimals);
    const startValue = displayRef.current;
    const countingUp = endValue >= startValue;
    const startTime = performance.now();

    let raf = 0;
    const tick = (now: number) => {
      if (gen !== animGenRef.current) return;

      const linear = Math.min((now - startTime) / duration, 1);
      const eased = easeOutCubic(linear);
      const raw = startValue + (endValue - startValue) * eased;
      const done = linear >= 1;

      let next = stepDisplayValue(raw, decimals, done, safeTarget);
      if (countingUp) {
        next = Math.max(displayRef.current, next);
      } else {
        next = Math.min(displayRef.current, next);
      }

      displayRef.current = next;
      setValue(next);

      if (!done) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => {
      animGenRef.current += 1;
      cancelAnimationFrame(raf);
    };
  }, [safeTarget, duration, enabled, decimals, whenDisabled]);

  return value;
}
