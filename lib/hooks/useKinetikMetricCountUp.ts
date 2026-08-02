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
 * キネティック指標カード用: pending 中は "—"、表示時はカウントアップ。
 */
export function useKinetikMetricCountUp(
  pending: boolean,
  target: number,
  format: KinetikMetricCountFormat,
  decimals = 0,
  reduceMotion = false,
  duration = 900
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

  if (pending) return "—";
  if (reduceMotion) {
    return formatKinetikMetricCount(safeTarget, format, decimals);
  }
  return formatKinetikMetricCount(n, format, decimals);
}
