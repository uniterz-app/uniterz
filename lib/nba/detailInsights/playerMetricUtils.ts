import type { NbaPlayerLeaderMetricId } from "@/lib/predict/nbaPlayerStatLeadersMocks";
import type { NbaPlayerSeasonMetricCell } from "@/lib/nba/playerSeasonMetrics/playerSeasonMetricsTypes";
import {
  scoreFromBottomRank,
  scoreFromHighRank,
  scoreFromLowRank,
} from "@/lib/nba/detailInsights/rankBuckets";

export function playerMetricRank(
  metrics: Partial<Record<NbaPlayerLeaderMetricId, NbaPlayerSeasonMetricCell>>,
  id: NbaPlayerLeaderMetricId
): number | null {
  const cell = metrics[id];
  if (!cell || !Number.isFinite(cell.rank) || cell.rank < 1) return null;
  return cell.rank;
}

export function playerMetricValue(
  metrics: Partial<Record<NbaPlayerLeaderMetricId, NbaPlayerSeasonMetricCell>>,
  id: NbaPlayerLeaderMetricId
): number | null {
  const cell = metrics[id];
  if (!cell || !Number.isFinite(cell.value)) return null;
  return cell.value;
}

export function rankInRange(rank: number | null, min: number, max: number): boolean {
  return rank != null && rank >= min && rank <= max;
}

export { scoreFromHighRank, scoreFromLowRank, scoreFromBottomRank };

export function isBigPosition(position: string): boolean {
  const p = position.trim().toUpperCase();
  return p.includes("C") || p.includes("PF") || p === "F-C" || p === "C-F";
}
