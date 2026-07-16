/**
 * Rank Intel — Gap（差の構造）分析の純粋ロジック。
 */

import type { Language } from "@/lib/i18n/language";
import {
  buildRankTierGapHint,
  resolveNextRankTierMilestone,
  type RankTierGapHint,
  type RankTierMilestone,
} from "@/lib/rankings/rankTierMilestone";
import type { RankGapStatsSlice } from "@/lib/rankings/readRankGapBonusSlice";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import type { RankGapDonutSliceId } from "@/lib/rankings/rankGapDonut";

export type RankGapAxisId =
  | "totalPoints"
  | "base"
  | "exactHits"
  | "upsetBonus"
  | "streakBonus"
  | "goalScorerBonus";

export type RankGapAxisRow = {
  id: RankGapAxisId;
  self: number;
  cohortAvg: number;
  delta: number;
  /** 0–100 — 自分と帯平均の大きい方を基準 */
  barPct: number;
  tag: "weakness" | "strength" | "neutral";
};

export type RankGapAnalysis = {
  ok: true;
  currentRank: number;
  targetTier: RankTierMilestone | null;
  tierLabel: string;
  cohortSize: number;
  self: RankGapStatsSlice;
  cohort: RankGapStatsSlice;
  axes: RankGapAxisRow[];
  advice: string;
  rankTierGap: RankTierGapHint | null;
  showGoalScorer: boolean;
  /** 帯内での指標別 TOP%（小さいほど上位） */
  cohortMetricTopPercent: Partial<Record<RankGapDonutSliceId, number>>;
};

const COHORT_MAX = 100;

const DONUT_SLICE_IDS: RankGapDonutSliceId[] = [
  "base",
  "upsetBonus",
  "streakBonus",
  "goalScorerBonus",
];

function metricValueForDonutSlice(
  slice: RankGapStatsSlice,
  id: RankGapDonutSliceId
): number {
  switch (id) {
    case "base":
      return slice.basePointsSum;
    case "upsetBonus":
      return slice.upsetBonusSum;
    case "streakBonus":
      return slice.streakBonusSum;
    case "goalScorerBonus":
      return slice.goalScorerBonusSum;
    default:
      return 0;
  }
}

/** 帯コホート内での TOP%（My Rank の順位 TOP% と同じ定義） */
export function computeCohortMetricTopPercent(
  selfValue: number,
  cohortSlices: RankGapStatsSlice[],
  id: RankGapDonutSliceId
): number | null {
  if (cohortSlices.length === 0) return null;
  const values = cohortSlices.map((s) => metricValueForDonutSlice(s, id));
  const betterCount = values.filter((v) => v > selfValue).length;
  const rank = betterCount + 1;
  return (rank / values.length) * 100;
}

export function formatGapCohortTopPercent(pct: number): string {
  const clamped = Math.min(100, Math.max(0.1, pct));
  return clamped < 10 ? clamped.toFixed(1) : String(Math.round(clamped));
}

export function buildCohortMetricTopPercents(
  self: RankGapStatsSlice,
  cohortSlices: RankGapStatsSlice[],
  showGoalScorer: boolean
): Partial<Record<RankGapDonutSliceId, number>> {
  const ids = showGoalScorer
    ? DONUT_SLICE_IDS
    : DONUT_SLICE_IDS.filter((id) => id !== "goalScorerBonus");
  const out: Partial<Record<RankGapDonutSliceId, number>> = {};
  for (const id of ids) {
    const pct = computeCohortMetricTopPercent(
      metricValueForDonutSlice(self, id),
      cohortSlices,
      id
    );
    if (pct != null) out[id] = pct;
  }
  return out;
}

export function resolveRankGapCohortSize(targetRank: number): number {
  return Math.min(Math.max(1, Math.floor(targetRank)), COHORT_MAX);
}

function axisThreshold(id: RankGapAxisId, cohortAvg: number): number {
  if (id === "exactHits") return 0.35;
  return Math.max(4, Math.abs(cohortAvg) * 0.08);
}

function buildAxisRow(
  id: RankGapAxisId,
  self: number,
  cohortAvg: number
): RankGapAxisRow {
  const delta = self - cohortAvg;
  const threshold = axisThreshold(id, cohortAvg);
  const tag: RankGapAxisRow["tag"] =
    delta <= -threshold
      ? "weakness"
      : delta >= threshold
        ? "strength"
        : "neutral";
  const max = Math.max(self, cohortAvg, 1);
  return {
    id,
    self,
    cohortAvg,
    delta,
    barPct: Math.round((self / max) * 100),
    tag,
  };
}

export function computeRankGapAxes(
  self: RankGapStatsSlice,
  cohort: RankGapStatsSlice,
  showGoalScorer: boolean
): RankGapAxisRow[] {
  const axes: RankGapAxisRow[] = [
    buildAxisRow("totalPoints", self.pointsSumV3, cohort.pointsSumV3),
    buildAxisRow("base", self.basePointsSum, cohort.basePointsSum),
    buildAxisRow("exactHits", self.exactHitCount, cohort.exactHitCount),
    buildAxisRow("upsetBonus", self.upsetBonusSum, cohort.upsetBonusSum),
    buildAxisRow("streakBonus", self.streakBonusSum, cohort.streakBonusSum),
  ];
  if (showGoalScorer) {
    axes.push(
      buildAxisRow(
        "goalScorerBonus",
        self.goalScorerBonusSum,
        cohort.goalScorerBonusSum
      )
    );
  }
  return axes;
}

function fmtDelta(n: number, decimals = 0): string {
  const abs = Math.abs(n);
  const rounded =
    decimals > 0 ? abs.toFixed(decimals) : String(Math.round(abs));
  if (n > 0) return `+${rounded}`;
  if (n < 0) return `-${rounded}`;
  return "±0";
}

function tierLabel(target: RankTierMilestone | null, language: Language): string {
  if (target == null) return language === "en" ? "TOP 10" : "TOP10";
  return language === "en" ? `TOP ${target}` : `TOP${target}`;
}

function appendTierPointsGapSuffix(
  message: string,
  pointsGap: number | null,
  tier: string,
  language: Language
): string {
  if (pointsGap == null) return message;
  if (language === "en") {
    const suffix = `(~${pointsGap}pt to ${tier})`;
    return message.endsWith(".")
      ? `${message.slice(0, -1)} ${suffix}.`
      : `${message} ${suffix}.`;
  }
  const suffix = `（あと約${pointsGap}ptで${tier}圏内）`;
  if (message.endsWith("。")) {
    return `${message.slice(0, -1)}${suffix}。`;
  }
  return `${message}${suffix}。`;
}

function buildRankGapAdviceBase(input: {
  axes: RankGapAxisRow[];
  targetTier: RankTierMilestone | null;
  language: Language;
}): string {
  const { axes, targetTier, language } = input;
  const tier = tierLabel(targetTier, language);
  const weaknesses = axes
    .filter((a) => a.tag === "weakness")
    .sort((a, b) => a.delta - b.delta);

  if (language === "en") {
    if (weaknesses.length === 0) {
      return `You are ahead of the ${tier} band on most axes.`;
    }
    const top = weaknesses[0]!;
    if (top.id === "totalPoints") {
      return `Total points vs ${tier} are the main gap (${fmtDelta(top.delta)}pt).`;
    }
    if (top.id === "streakBonus") {
      return `Base points are solid vs ${tier}. Streak bonuses are where you're leaving points on the table.`;
    }
    if (top.id === "goalScorerBonus") {
      return `Score picks are working — goal-scorer bonus vs ${tier} is the main gap.`;
    }
    if (top.id === "upsetBonus") {
      return `Upset bonus vs ${tier} is your biggest gap (${fmtDelta(top.delta)}pt).`;
    }
    if (top.id === "base") {
      return `Base scoring vs ${tier} is the main gap (${fmtDelta(top.delta)}pt).`;
    }
    return `Exact hits vs ${tier} are low (${fmtDelta(top.delta, 1)}). One more perfect score could shift the band.`;
  }

  if (weaknesses.length === 0) {
    return `主要な指標は${tier}帯と同水準以上です。`;
  }

  const top = weaknesses[0]!;
  if (top.id === "totalPoints") {
    return `総合得点が${tier}帯比 ${fmtDelta(top.delta)}pt — 全体の積み上げが課題です。`;
  }
  if (top.id === "streakBonus") {
    return `ベース得点は取れています。${tier}帯との差は連勝ボーナスが主因です。`;
  }
  if (top.id === "goalScorerBonus") {
    return `スコア予想は機能しています。${tier}帯との差は得点者ボーナスが主因です。`;
  }
  if (top.id === "upsetBonus") {
    return `Upsetボーナスが${tier}帯比 ${fmtDelta(top.delta)}pt — いちばんの不足です。`;
  }
  if (top.id === "base") {
    return `ベース得点が${tier}帯比 ${fmtDelta(top.delta)}pt — 土台の積み上げが課題です。`;
  }
  return `完全的中が${tier}帯比 ${fmtDelta(top.delta, 1)}回 — 1試合分の精度が効きます。`;
}

export function buildRankGapAdvice(input: {
  axes: RankGapAxisRow[];
  targetTier: RankTierMilestone | null;
  rankTierGap: RankTierGapHint | null;
  language: Language;
}): string {
  const { axes, targetTier, rankTierGap, language } = input;
  const tier = tierLabel(targetTier, language);
  const pointsGap =
    rankTierGap?.kind === "gap" ? Math.round(rankTierGap.pointsGap) : null;
  const base = buildRankGapAdviceBase({ axes, targetTier, language });
  return appendTierPointsGapSuffix(base, pointsGap, tier, language);
}

export function computeRankGapAnalysis(input: {
  currentRank: number;
  self: RankGapStatsSlice;
  cohortSlices: RankGapStatsSlice[];
  rankingLeague: RankingLeagueSource;
  cutoffRows: Array<{ rank?: number; totalPoints?: number }>;
  language: Language;
}): RankGapAnalysis | { ok: false; reason: string } {
  const cohort = averageFromSlices(input.cohortSlices);
  if (!cohort) {
    return { ok: false, reason: "cohort_empty" };
  }

  const targetTier = resolveNextRankTierMilestone(input.currentRank);
  const showGoalScorer = input.rankingLeague === "worldcup";
  const axes = computeRankGapAxes(input.self, cohort, showGoalScorer);
  const cohortMetricTopPercent = buildCohortMetricTopPercents(
    input.self,
    input.cohortSlices,
    showGoalScorer
  );
  const rankTierGap = buildRankTierGapHint({
    currentRank: input.currentRank,
    myTotalPoints: input.self.pointsSumV3,
    cutoffRows: input.cutoffRows,
  });

  return {
    ok: true,
    currentRank: input.currentRank,
    targetTier,
    tierLabel: tierLabel(targetTier, input.language),
    cohortSize: input.cohortSlices.length,
    self: input.self,
    cohort,
    axes,
    rankTierGap,
    showGoalScorer,
    cohortMetricTopPercent,
    advice: buildRankGapAdvice({
      axes,
      targetTier,
      rankTierGap,
      language: input.language,
    }),
  };
}

function averageFromSlices(
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
