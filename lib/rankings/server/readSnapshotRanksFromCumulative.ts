import { coerceTotalPointsRank } from "@/lib/profile/resolvePlayoffTotalPointsRank";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

export type SnapshotRankMetric =
  | "winRate"
  | "totalPoints"
  | "totalPrecision"
  | "totalExactHits"
  | "totalUpset"
  | "activeWinStreak"
  | "totalGoalScorerHits";

type MetricRankMap = Partial<Record<SnapshotRankMetric, unknown>>;

export type SnapshotRanksRoot = {
  seasons?: Partial<Record<string, MetricRankMap>>;
};

function isNonEmptyObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && Object.keys(v as object).length > 0;
}

function pickBlock(
  nested: unknown,
  dot: unknown
): Record<string, unknown> | undefined {
  if (isNonEmptyObject(dot)) return dot;
  if (isNonEmptyObject(nested)) return nested;
  return undefined;
}

/** Firestore dot-path と nested snapshotRanks.seasons を解決 */
export function readSnapshotRanksRoot(
  data: Record<string, unknown> | null | undefined
): SnapshotRanksRoot {
  if (!data) return {};
  const nested = data.snapshotRanks as Record<string, unknown> | undefined;

  return {
    seasons: pickBlock(nested?.seasons, data["snapshotRanks.seasons"]) as
      | Partial<Record<string, MetricRankMap>>
      | undefined,
  };
}

export function readStoredRankFromSnapshotRanks(
  data: Record<string, unknown> | null | undefined,
  metric: SnapshotRankMetric
): number | null {
  const snapshotRanks = readSnapshotRanksRoot(data);
  const raw = snapshotRanks.seasons?.[CURRENT_NBA_SEASON_KEY]?.[metric];
  return coerceTotalPointsRank(raw);
}
