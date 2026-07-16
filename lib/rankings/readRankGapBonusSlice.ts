/**
 * Gap 分析 — cumulative_stats からランキング文脈の得点分解を読む。
 */

import type { PlayoffRoundKey } from "@/lib/rankings/playoffRound";
import type { RankingPhase } from "@/lib/rankings/rankingPhase";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import type { WcRankingStage } from "@/lib/rankings/wcRankingStage";

export type RankGapStatsSlice = {
  pointsSumV3: number;
  basePointsSum: number;
  upsetBonusSum: number;
  streakBonusSum: number;
  goalScorerBonusSum: number;
  /** WC: 完全的中数 / NBA: scorePrecisionSum */
  exactHitCount: number;
  winRate: number;
  posts: number;
};

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
  context: {
    rankingLeague: RankingLeagueSource;
    phase: RankingPhase;
    round: PlayoffRoundKey;
    wcStage: WcRankingStage | null;
  }
): RankGapStatsSlice | null {
  if (!cumulative) return null;

  if (context.rankingLeague === "worldcup") {
    const stage = context.wcStage ?? "overall";
    const block = (
      cumulative.rankingByWcStage as
        | Record<string, Record<string, unknown>>
        | undefined
    )?.[stage];
    return sliceFromBlock(block, { wcStage: true });
  }

  if (context.phase === "playoffs" && context.round !== "overall") {
    const block = (
      cumulative.rankingByPlayoffRound as
        | Record<string, Record<string, unknown>>
        | undefined
    )?.[context.round];
    const fromRound = sliceFromBlock(block, { wcStage: false });
    if (fromRound) return fromRound;
  }

  const block = (
    cumulative.rankingByPhase as
      | Record<string, Record<string, unknown>>
      | undefined
  )?.[context.phase];
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
