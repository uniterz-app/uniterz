import { formatMetricDecimals } from "@/lib/format/metricDecimals";
import { useCountUp } from "@/lib/hooks/useCountUp";

export type KinetikMetricCountFormat = "percent" | "locale" | "fixed" | "int";

export function formatKinetikMetricCount(
  n: number,
  format: KinetikMetricCountFormat,
  decimals = 0
): string {
  switch (format) {
    case "percent":
      return `${formatMetricDecimals(n, decimals)}%`;
    case "locale":
      return Math.floor(n).toLocaleString();
    case "fixed":
      return formatMetricDecimals(n, decimals);
    case "int":
      return String(Math.max(0, Math.floor(n)));
  }
}

/**
 * キネティック指標カード用:
 * pending 中は 0 表示（「—」で穴を空けない）→ 本値が来たら 0 からカウントアップ。
 * 到着が遅れても「わざと数えてる」感じで待ちをごまかせる。
 */
export function useKinetikMetricCountUp(
  pending: boolean,
  target: number,
  format: KinetikMetricCountFormat,
  decimals = 0,
  reduceMotion = false,
  /** 遅い stats 到着を隠すため、入場は少し長め */
  duration = 1100
): string {
  const safeTarget = Number.isFinite(target) ? target : 0;
  const countEnabled = !pending && !reduceMotion;
  const whenDisabled = reduceMotion && !pending ? "target" : "zero";
  const n = useCountUp(
    pending ? 0 : safeTarget,
    duration,
    countEnabled,
    format === "percent" || format === "fixed" ? decimals : 0,
    whenDisabled
  );

  if (pending) {
    return formatKinetikMetricCount(0, format, decimals);
  }
  if (reduceMotion) {
    return formatKinetikMetricCount(safeTarget, format, decimals);
  }
  return formatKinetikMetricCount(n, format, decimals);
}
