import type { MyRankMetricDeltaKey } from "@/lib/rankings/myRankMetricValueDeltas";
import { formatMetricDayDeltaLabel } from "@/lib/rankings/myRankMetricValueDeltas";

export type ProfileMetricDeltaKey =
  | "winRate"
  | "totalPoints"
  | "scorePrecision"
  | "upset";

const DELTA_KEY_MAP: Record<ProfileMetricDeltaKey, MyRankMetricDeltaKey> = {
  winRate: "winRate",
  totalPoints: "totalScore",
  scorePrecision: "marginPrecision",
  upset: "upsetScore",
};

export function formatProfileMetricDayDelta(
  key: ProfileMetricDeltaKey,
  delta: number | null | undefined,
  opts?: { integer?: boolean }
): string | null {
  if (delta == null || !Number.isFinite(delta) || delta === 0) return null;
  const metricKey = DELTA_KEY_MAP[key];
  const label = formatMetricDayDeltaLabel(metricKey, delta, {
    integer: opts?.integer && key === "scorePrecision",
  });
  if (!label || label === "0" || label === "0.0") return null;

  if (key === "winRate") {
    return `${label}%`;
  }
  return label;
}

export function profileMetricDeltaTone(
  delta: number | null | undefined
): "up" | "down" | null {
  if (delta == null || !Number.isFinite(delta) || delta === 0) return null;
  return delta > 0 ? "up" : "down";
}
