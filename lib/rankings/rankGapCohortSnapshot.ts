/**
 * Gap 分析 — TOP20 帯平均のランキングスナップショット埋め込み。
 */

import {
  averageRankGapSlices,
  type RankGapStatsSlice,
} from "@/lib/rankings/readRankGapBonusSlice";

export const RANK_GAP_COHORT_BAND_SIZE = 20;

export type RankGapCohortBandSnapshot = {
  size: number;
  avg: RankGapStatsSlice;
  /** 帯内 TOP% 用 — 順位昇順の匿名スライス（最大20） */
  slices: RankGapStatsSlice[];
};

function safeNum(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function safeInt(v: unknown): number {
  return Math.max(0, Math.floor(safeNum(v)));
}

function parseRankGapStatsSlice(raw: unknown): RankGapStatsSlice | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const posts = safeInt(o.posts);
  if (posts <= 0) return null;
  return {
    pointsSumV3: safeNum(o.pointsSumV3),
    basePointsSum: safeNum(o.basePointsSum),
    upsetBonusSum: safeNum(o.upsetBonusSum),
    streakBonusSum: safeNum(o.streakBonusSum),
    goalScorerBonusSum: safeNum(o.goalScorerBonusSum),
    exactHitCount: safeNum(o.exactHitCount),
    winRate: safeNum(o.winRate),
    posts,
  };
}

export function buildRankGapCohortBandSnapshot(
  slices: RankGapStatsSlice[]
): RankGapCohortBandSnapshot | null {
  if (slices.length === 0) return null;
  const avg = averageRankGapSlices(slices);
  if (!avg) return null;
  return {
    size: slices.length,
    avg,
    slices,
  };
}

/** `cumulative_ranking_snapshots/*_totalPoints` の `gapCohortTop20` を読む */
export function readRankGapCohortBandFromSnapshot(
  snapData: Record<string, unknown> | null | undefined,
  bandSize = RANK_GAP_COHORT_BAND_SIZE
): RankGapCohortBandSnapshot | null {
  if (bandSize !== RANK_GAP_COHORT_BAND_SIZE) return null;
  const raw = snapData?.gapCohortTop20;
  if (!raw || typeof raw !== "object") return null;
  const block = raw as Record<string, unknown>;
  const avg = parseRankGapStatsSlice(block.avg);
  if (!avg) return null;

  const slicesRaw = Array.isArray(block.slices) ? block.slices : [];
  const slices: RankGapStatsSlice[] = [];
  for (const item of slicesRaw) {
    const slice = parseRankGapStatsSlice(item);
    if (slice) slices.push(slice);
  }
  if (slices.length === 0) return null;

  const size = safeInt(block.size);
  return {
    size: size > 0 ? size : slices.length,
    avg,
    slices,
  };
}
