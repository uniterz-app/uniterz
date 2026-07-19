/**
 * Shadow 週次比較 — rankSnapshotHistory のアンカー日 metricValues を読む。
 */

import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import type { RankGapStatsSlice } from "@/lib/rankings/readRankGapBonusSlice";
import type { RankHistoryContext } from "@/lib/rankings/readRankFromSnapshotHistory";
import type { WcRankingStage } from "@/lib/rankings/wcRankingStage";

export type RankShadowAnchorMetrics = {
  totalPoints: number;
  exactHitCount: number;
  upsetBonusSum: number;
  streakBonusSum: number;
  goalScorerBonusSum: number;
};

type SnapshotMetricValues = {
  totalPoints?: number;
  totalPrecision?: number;
  totalUpset?: number;
  exactHitCount?: number;
  upsetBonusSum?: number;
  streakBonusSum?: number;
  goalScorerBonusSum?: number;
};

type HistoryMetricValuesBlock = {
  seasons?: Partial<Record<string, SnapshotMetricValues>>;
  wc?: Partial<Record<WcRankingStage, SnapshotMetricValues>>;
};

function safeNum(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function pickSnapshotMetricValues(
  block: HistoryMetricValuesBlock | undefined,
  context: {
    rankingLeague: RankingLeagueSource;
    wcStage: WcRankingStage;
  }
): SnapshotMetricValues | null {
  if (!block) return null;
  if (context.rankingLeague === "worldcup") {
    return block.wc?.[context.wcStage] ?? null;
  }
  return block.seasons?.[CURRENT_NBA_SEASON_KEY] ?? null;
}

export function readRankShadowAnchorMetrics(
  doc: Record<string, unknown> | null | undefined,
  context: RankHistoryContext & { rankingLeague: RankingLeagueSource }
): RankShadowAnchorMetrics | null {
  const mv = doc?.metricValues as HistoryMetricValuesBlock | undefined;
  const picked = pickSnapshotMetricValues(mv, {
    rankingLeague: context.rankingLeague,
    wcStage: context.wcStage ?? "overall",
  });
  if (!picked) return null;

  const exactHitCount =
    context.rankingLeague === "worldcup"
      ? safeNum(picked.exactHitCount ?? picked.totalPrecision)
      : safeNum(picked.totalPrecision);

  return {
    totalPoints: safeNum(picked.totalPoints),
    exactHitCount,
    upsetBonusSum: safeNum(picked.upsetBonusSum ?? picked.totalUpset),
    streakBonusSum: safeNum(picked.streakBonusSum),
    goalScorerBonusSum: safeNum(picked.goalScorerBonusSum),
  };
}

const EMPTY_ANCHOR: RankShadowAnchorMetrics = {
  totalPoints: 0,
  exactHitCount: 0,
  upsetBonusSum: 0,
  streakBonusSum: 0,
  goalScorerBonusSum: 0,
};

function weeklyDelta(current: number, anchor: number): number {
  const d = current - anchor;
  return Number.isFinite(d) ? Math.max(0, d) : 0;
}

/** 現在の累計 slice とアンカー日の metricValues から、今週の積み上げを算出 */
export function computeShadowWeeklySlice(
  current: RankGapStatsSlice,
  anchor: RankShadowAnchorMetrics | null
): RankGapStatsSlice {
  const a = anchor ?? EMPTY_ANCHOR;
  const pointsSumV3 = weeklyDelta(current.pointsSumV3, a.totalPoints);
  const upsetBonusSum = weeklyDelta(current.upsetBonusSum, a.upsetBonusSum);
  const streakBonusSum = weeklyDelta(current.streakBonusSum, a.streakBonusSum);
  const goalScorerBonusSum = weeklyDelta(
    current.goalScorerBonusSum,
    a.goalScorerBonusSum
  );
  const exactHitCount = weeklyDelta(current.exactHitCount, a.exactHitCount);

  return {
    pointsSumV3,
    upsetBonusSum,
    streakBonusSum,
    goalScorerBonusSum,
    exactHitCount,
    basePointsSum: Math.max(
      0,
      pointsSumV3 - upsetBonusSum - streakBonusSum - goalScorerBonusSum
    ),
    winRate: 0,
    posts: 0,
  };
}
