/**
 * Gap カード — サイバーパンク多色パレット（軸 ID 固定割当）。
 */

import type { RankGapStatsSlice } from "@/lib/rankings/readRankGapBonusSlice";

export type RankGapDonutSliceId =
  | "base"
  | "upsetBonus"
  | "streakBonus"
  | "goalScorerBonus";

export type RankGapDonutSlice = {
  id: RankGapDonutSliceId;
  points: number;
  ratio: number;
  color: string;
  glow: string;
  cohortPoints: number;
  cohortDelta: number;
  /** 帯内 TOP%（小さいほど上位） */
  cohortTopPercent: number | null;
};

const SLICE_ORDER: RankGapDonutSliceId[] = [
  "base",
  "upsetBonus",
  "streakBonus",
  "goalScorerBonus",
];

/** 参考 UI — シアン / マゼンタ / パープル / インディゴ */
export const RANK_GAP_SLICE_COLORS: Record<
  RankGapDonutSliceId,
  { fill: string; glow: string }
> = {
  base: { fill: "#00FFFF", glow: "rgba(0,255,255,0.32)" },
  upsetBonus: { fill: "#FF00FF", glow: "rgba(255,0,255,0.32)" },
  streakBonus: { fill: "#A020F0", glow: "rgba(160,32,240,0.3)" },
  goalScorerBonus: { fill: "#5B21B6", glow: "rgba(91,33,182,0.28)" },
};

export const RANK_GAP_CYBER = {
  cyan: "#00FFFF",
  magenta: "#FF00FF",
  purple: "#A020F0",
  indigo: "#5B21B6",
  neon: "#00FFFF",
  neonBorder: "rgba(255,0,255,0.55)",
  neonBorderStrong: "rgba(255,0,255,0.82)",
  cardBg: "#000000",
  cardBgElevated: "#0a0812",
  trackRing: "rgba(255,255,255,0.06)",
  divider: "rgba(255,255,255,0.08)",
  labelMuted: "rgba(170,170,180,0.55)",
  feedMuted: "rgba(255,255,255,0.38)",
  textGlow: "0 0 10px rgba(0,255,255,0.28)",
  cardOuterGlow: "0 0 24px rgba(255,0,255,0.08)",
  badgeBg: "rgba(255,255,255,0.03)",
  deltaPillBorder: "rgba(0,255,255,0.4)",
  deltaPillBorderWeak: "rgba(255,255,255,0.15)",
  deltaPillBg: "rgba(255,255,255,0.04)",
  dotMuted: "rgba(255,255,255,0.2)",
  chamferCut: 14,
} as const;

export const RANK_GAP_CHAMFER_CLIP = `polygon(
  0 0,
  calc(100% - ${RANK_GAP_CYBER.chamferCut}px) 0,
  100% ${RANK_GAP_CYBER.chamferCut}px,
  100% 100%,
  ${RANK_GAP_CYBER.chamferCut}px 100%,
  0 calc(100% - ${RANK_GAP_CYBER.chamferCut}px)
)`;

export function cohortPointsForDonutSlice(
  id: RankGapDonutSliceId,
  cohort: RankGapStatsSlice
): number {
  switch (id) {
    case "base":
      return cohort.basePointsSum;
    case "upsetBonus":
      return cohort.upsetBonusSum;
    case "streakBonus":
      return cohort.streakBonusSum;
    case "goalScorerBonus":
      return cohort.goalScorerBonusSum;
    default:
      return 0;
  }
}

export function colorForRankGapSlice(id: RankGapDonutSliceId) {
  return RANK_GAP_SLICE_COLORS[id];
}

export function buildRankGapDonutSlices(
  self: RankGapStatsSlice,
  cohort: RankGapStatsSlice,
  showGoalScorer: boolean,
  cohortMetricTopPercent: Partial<Record<RankGapDonutSliceId, number>> = {}
): RankGapDonutSlice[] {
  const ids = showGoalScorer
    ? SLICE_ORDER
    : SLICE_ORDER.filter((id) => id !== "goalScorerBonus");

  const pointsById: Record<RankGapDonutSliceId, number> = {
    base: self.basePointsSum,
    upsetBonus: self.upsetBonusSum,
    streakBonus: self.streakBonusSum,
    goalScorerBonus: self.goalScorerBonusSum,
  };

  const positive = ids.filter((id) => pointsById[id] > 0);
  const total = Math.max(
    self.pointsSumV3,
    positive.reduce((sum, id) => sum + pointsById[id], 0),
    1
  );

  return positive.map((id) => {
    const palette = RANK_GAP_SLICE_COLORS[id];
    const points = pointsById[id];
    const cohortPoints = cohortPointsForDonutSlice(id, cohort);
    return {
      id,
      points,
      ratio: points / total,
      color: palette.fill,
      glow: palette.glow,
      cohortPoints,
      cohortDelta: points - cohortPoints,
      cohortTopPercent: cohortMetricTopPercent[id] ?? null,
    };
  });
}
