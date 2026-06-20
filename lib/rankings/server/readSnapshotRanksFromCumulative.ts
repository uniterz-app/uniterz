import { coerceTotalPointsRank } from "@/lib/profile/resolvePlayoffTotalPointsRank";
import type { PlayoffRoundKey } from "@/lib/rankings/playoffRound";
import type { RankingPhase } from "@/lib/rankings/rankingPhase";
import type { WcRankingStage } from "@/lib/rankings/wcRankingStage";

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
  play_in?: MetricRankMap;
  playoffs?: MetricRankMap;
  playoffRounds?: Partial<Record<PlayoffRoundKey, MetricRankMap>>;
  wc?: Partial<Record<WcRankingStage, MetricRankMap>>;
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

/**
 * Firestore dot-path 書き込み（snapshotRanks.wc 等）と
 * nested snapshotRanks.wc の両方を解決する。
 */
export function readSnapshotRanksRoot(
  data: Record<string, unknown> | null | undefined
): SnapshotRanksRoot {
  if (!data) return {};
  const nested = data.snapshotRanks as Record<string, unknown> | undefined;

  return {
    play_in: pickBlock(nested?.play_in, data["snapshotRanks.play_in"]) as
      | MetricRankMap
      | undefined,
    playoffs: pickBlock(nested?.playoffs, data["snapshotRanks.playoffs"]) as
      | MetricRankMap
      | undefined,
    playoffRounds: pickBlock(
      nested?.playoffRounds,
      data["snapshotRanks.playoffRounds"]
    ) as Partial<Record<PlayoffRoundKey, MetricRankMap>> | undefined,
    wc: pickBlock(nested?.wc, data["snapshotRanks.wc"]) as
      | Partial<Record<WcRankingStage, MetricRankMap>>
      | undefined,
  };
}

export function readStoredRankFromSnapshotRanks(
  data: Record<string, unknown> | null | undefined,
  metric: SnapshotRankMetric,
  phase: RankingPhase,
  round: PlayoffRoundKey,
  wcStage: WcRankingStage | null
): number | null {
  const snapshotRanks = readSnapshotRanksRoot(data);

  let raw: unknown;
  if (wcStage) {
    raw = snapshotRanks.wc?.[wcStage]?.[metric];
    if (metric === "totalExactHits" && raw == null) {
      raw = snapshotRanks.wc?.[wcStage]?.totalPrecision;
    }
  } else if (phase === "playoffs" && round !== "overall") {
    raw = snapshotRanks.playoffRounds?.[round]?.[metric];
  } else {
    raw = snapshotRanks[phase]?.[metric];
  }

  return coerceTotalPointsRank(raw);
}
