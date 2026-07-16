/**
 * Gap 分析 — cumulative_stats から得点分解を読む（Functions 用）。
 */

import type { WcRankingStage } from "./wcRankingStage";

export type RankGapStatsSlice = {
  pointsSumV3: number;
  basePointsSum: number;
  upsetBonusSum: number;
  streakBonusSum: number;
  goalScorerBonusSum: number;
  exactHitCount: number;
  winRate: number;
  posts: number;
};

export type GapStatsReadContext =
  | { kind: "wc"; stage: WcRankingStage }
  | { kind: "phase"; phase: RankingPhase }
  | { kind: "round"; round: PlayoffRoundKey };

type RankingPhase = "play_in" | "playoffs";

type PlayoffRoundKey = "overall" | "r1" | "r2" | "cf" | "finals";

function safeNum(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function safeInt(v: unknown): number {
  return Math.max(0, Math.floor(safeNum(v)));
}

function sliceFromBlock(
  block: Record<string, unknown> | undefined,
  opts: { wcStage: boolean }
): RankGapStatsSlice | null {
  if (!block || typeof block !== "object") return null;
  const posts = safeInt(block.totalPosts);
  if (posts <= 0) return null;

  const wins = safeInt(block.totalWins);
  const pointsSumV3 = safeNum(block.totalPoints);
  const upsetBonusSum = safeNum(block.upsetBonusSum);
  const streakBonusSum = safeNum(block.streakBonusSum);
  const goalScorerBonusSum = safeNum(block.goalScorerBonusSum);
  const winRateRaw = safeNum(block.winRate);
  const exactHitCount = opts.wcStage
    ? safeInt(block.exactHitCount ?? block.totalPrecision)
    : safeNum(block.totalPrecision);

  return {
    pointsSumV3,
    upsetBonusSum,
    streakBonusSum,
    goalScorerBonusSum,
    basePointsSum: Math.max(
      0,
      pointsSumV3 - upsetBonusSum - streakBonusSum - goalScorerBonusSum
    ),
    exactHitCount,
    winRate:
      posts > 0 ? wins / posts : winRateRaw <= 1 ? winRateRaw : winRateRaw / 100,
    posts,
  };
}

export function readRankGapStatsSlice(
  cumulative: Record<string, unknown> | null | undefined,
  context: GapStatsReadContext
): RankGapStatsSlice | null {
  if (!cumulative) return null;

  if (context.kind === "wc") {
    const block = (
      cumulative.rankingByWcStage as
        | Record<string, Record<string, unknown>>
        | undefined
    )?.[context.stage];
    return sliceFromBlock(block, { wcStage: true });
  }

  if (context.kind === "phase") {
    const block = (
      cumulative.rankingByPhase as
        | Record<string, Record<string, unknown>>
        | undefined
    )?.[context.phase];
    return sliceFromBlock(block, { wcStage: false });
  }

  const block = (
    cumulative.rankingByPlayoffRound as
      | Record<string, Record<string, unknown>>
      | undefined
  )?.[context.round];
  return sliceFromBlock(block, { wcStage: false });
}

export function averageRankGapSlices(
  slices: RankGapStatsSlice[]
): RankGapStatsSlice | null {
  if (slices.length === 0) return null;
  let pointsSumV3 = 0;
  let basePointsSum = 0;
  let upsetBonusSum = 0;
  let streakBonusSum = 0;
  let goalScorerBonusSum = 0;
  let exactHitCount = 0;
  let winRate = 0;
  let posts = 0;

  for (const s of slices) {
    pointsSumV3 += s.pointsSumV3;
    basePointsSum += s.basePointsSum;
    upsetBonusSum += s.upsetBonusSum;
    streakBonusSum += s.streakBonusSum;
    goalScorerBonusSum += s.goalScorerBonusSum;
    exactHitCount += s.exactHitCount;
    winRate += s.winRate;
    posts += s.posts;
  }

  const n = slices.length;
  return {
    pointsSumV3: pointsSumV3 / n,
    basePointsSum: basePointsSum / n,
    upsetBonusSum: upsetBonusSum / n,
    streakBonusSum: streakBonusSum / n,
    goalScorerBonusSum: goalScorerBonusSum / n,
    exactHitCount: exactHitCount / n,
    winRate: winRate / n,
    posts: posts / n,
  };
}

export function buildRankGapCohortBandSnapshot(
  slices: RankGapStatsSlice[]
): { size: number; avg: RankGapStatsSlice; slices: RankGapStatsSlice[] } | null {
  if (slices.length === 0) return null;
  const avg = averageRankGapSlices(slices);
  if (!avg) return null;
  return { size: slices.length, avg, slices };
}
