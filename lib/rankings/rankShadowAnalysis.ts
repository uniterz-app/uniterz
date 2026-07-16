/**
 * Rank Intel — Shadow（匿名ライバル帯）分析の純粋ロジック。
 */

import type { Language } from "@/lib/i18n/language";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import type { MyRankProgressPoint } from "@/lib/rankings/myRankRankingProgress";
import {
  buildShadowRivalRoster,
  type RankShadowRivalEntry,
} from "@/lib/rankings/rankShadowRivalRoster";
import type { RankGapStatsSlice } from "@/lib/rankings/readRankGapBonusSlice";
import {
  computeShadowWeeklySlice,
  type RankShadowAnchorMetrics,
} from "@/lib/rankings/readRankShadowAnchorMetrics";
import {
  SHADOW_TOP30_THRESHOLD,
  type resolveShadowBandRange,
} from "@/lib/rankings/rankShadowBand";

export type RankShadowMovement = {
  /** 順位上昇（rankDelta > 0） */
  rose: number;
  /** 横ばい（rankDelta === 0） */
  flat: number;
  /** 順位下落（rankDelta < 0） */
  fell: number;
  /** 上昇者のうち TOP30 圏内へ入った人数（補足用） */
  roseToTop30: number;
};

export type RankShadowTraitId = "highVolume" | "upsetHeavy" | "lowExact";

export type RankShadowTrait = {
  id: RankShadowTraitId;
};

export type RankShadowCompareId =
  | "rank"
  | "totalPoints"
  | "exactHits"
  | "streakBonus"
  | "upsetBonus"
  | "goalScorerBonus";

export type RankShadowCompareRow = {
  id: RankShadowCompareId;
  self: number;
  cohortAvg: number;
  delta: number;
  /** 0–100 — 自分と同帯平均の比（順位は低いほど良いので反転） */
  barPct: number;
  tag: "weakness" | "strength" | "neutral";
};

export type RankShadowAnalysis = {
  ok: true;
  currentRank: number;
  priorRank: number;
  priorBandLow: number;
  priorBandHigh: number;
  weekAnchorDateKey: string;
  cohortSize: number;
  movement: RankShadowMovement;
  traits: RankShadowTrait[];
  compareRows: RankShadowCompareRow[];
  showGoalScorer: boolean;
  /** 同帯比較の一言サマリー */
  compareAdvice: string;
  bandTypeLabel: string;
  rankProgressPoints: MyRankProgressPoint[];
  rivalRoster: RankShadowRivalEntry[];
};

export const SHADOW_RANK_PROGRESS_DAYS = 7;

type CohortMember = {
  uid: string;
  /** 先週帯アンカー（日曜）時点の順位 */
  priorRank: number;
  /** 今週開始（日曜）時点の順位 — 動き・順位変動用 */
  weekStartRank: number;
  currentRank: number;
  /** 帯の特徴用（累計） */
  slice: RankGapStatsSlice;
  anchorMetrics: RankShadowAnchorMetrics | null;
  displayName?: string;
  photoURL?: string | null;
  progressPoints?: MyRankProgressPoint[];
};

function weeklyRankGain(priorRank: number, currentRank: number): number {
  return priorRank - currentRank;
}

function averageWeeklyField(
  members: CohortMember[],
  pick: (weekly: RankGapStatsSlice) => number
): number {
  if (members.length === 0) return 0;
  let sum = 0;
  for (const m of members) {
    sum += pick(computeShadowWeeklySlice(m.slice, m.anchorMetrics));
  }
  return sum / members.length;
}

function averageRankGain(members: CohortMember[]): number {
  if (members.length === 0) return 0;
  let sum = 0;
  for (const m of members) {
    sum += weeklyRankGain(m.weekStartRank, m.currentRank);
  }
  return sum / members.length;
}

function compareThreshold(
  id: RankShadowCompareId,
  cohortAvg: number
): number {
  if (id === "rank") return 2;
  if (id === "exactHits") return 0.2;
  return Math.max(2, Math.abs(cohortAvg) * 0.15);
}

function compareTag(
  id: RankShadowCompareId,
  delta: number,
  cohortAvg: number
): RankShadowCompareRow["tag"] {
  const threshold = compareThreshold(id, cohortAvg);
  if (delta <= -threshold) return "weakness";
  if (delta >= threshold) return "strength";
  return "neutral";
}

/** 同帯比の符号付き差（+ = 自分が有利） */
function compareAdvantageDelta(
  _id: RankShadowCompareId,
  self: number,
  cohortAvg: number
): number {
  return self - cohortAvg;
}

function buildCompareRow(
  id: RankShadowCompareId,
  self: number,
  cohortAvg: number
): RankShadowCompareRow {
  const delta = compareAdvantageDelta(id, self, cohortAvg);
  const max = Math.max(Math.abs(self), Math.abs(cohortAvg), 1);
  const barPct = Math.round((Math.max(self, 0) / max) * 100);
  return {
    id,
    self,
    cohortAvg,
    delta,
    barPct,
    tag: compareTag(id, delta, cohortAvg),
  };
}

function fmtAdviceDelta(n: number, decimals = 0): string {
  const abs = Math.abs(n);
  const rounded =
    decimals > 0 ? abs.toFixed(decimals) : String(Math.round(abs));
  if (n > 0) return `+${rounded}`;
  if (n < 0) return `-${rounded}`;
  return "±0";
}

function weaknessMagnitude(row: RankShadowCompareRow): number {
  return -row.delta;
}

export function buildShadowCompareAdvice(
  rows: RankShadowCompareRow[],
  language: Language
): string {
  const weaknesses = rows
    .filter((r) => r.tag === "weakness")
    .sort((a, b) => weaknessMagnitude(b) - weaknessMagnitude(a));
  const strengths = rows
    .filter((r) => r.tag === "strength")
    .sort((a, b) => weaknessMagnitude(a) - weaknessMagnitude(b));

  if (language === "en") {
    if (weaknesses.length > 0) {
      const top = weaknesses[0]!;
      if (top.id === "rank") {
        return `Rank gain this week trails the band (${fmtAdviceDelta(top.delta)} places).`;
      }
      if (top.id === "totalPoints") {
        return `Points gained this week are the main gap vs the band (${fmtAdviceDelta(top.delta)}pt).`;
      }
      if (top.id === "exactHits") {
        return `Exact hits this week are the main gap vs the band (${fmtAdviceDelta(top.delta, 1)}).`;
      }
      if (top.id === "goalScorerBonus") {
        return `Goal-scorer bonus gained this week is where the band pulled ahead (${fmtAdviceDelta(top.delta)}pt).`;
      }
      if (top.id === "streakBonus") {
        return `Streak bonus gained this week is where the band pulled ahead (${fmtAdviceDelta(top.delta)}pt).`;
      }
      return `Upset bonus gained this week is where the band pulled ahead (${fmtAdviceDelta(top.delta)}pt).`;
    }
    if (strengths.length > 0) {
      const top = strengths[0]!;
      if (top.id === "rank") {
        return `Rank gain this week is where you're ahead of the band (${fmtAdviceDelta(top.delta)} places).`;
      }
      if (top.id === "totalPoints") {
        return `Points gained this week are where you're beating the band (${fmtAdviceDelta(top.delta)}pt).`;
      }
      if (top.id === "exactHits") {
        return `Exact hits this week are where you're beating the band (${fmtAdviceDelta(top.delta, 1)}).`;
      }
      if (top.id === "goalScorerBonus") {
        return `Goal-scorer bonus gained this week is where you're ahead of the band (${fmtAdviceDelta(top.delta)}pt).`;
      }
      if (top.id === "streakBonus") {
        return `Streak bonus gained this week is where you're ahead of the band (${fmtAdviceDelta(top.delta)}pt).`;
      }
      return `Upset bonus gained this week is where you're ahead of the band (${fmtAdviceDelta(top.delta)}pt).`;
    }
    return "You're even with last week's band on the key metrics.";
  }

  if (weaknesses.length > 0) {
    const top = weaknesses[0]!;
    if (top.id === "rank") {
      return "今週の順位上昇が先週同帯平均より少なく、差の主因です。";
    }
    if (top.id === "totalPoints") {
      return "今週の総合得点の積み上げが先週同帯平均を下回り、差の主因です。";
    }
    if (top.id === "exactHits") {
      return "今週の完全的中が先週同帯平均より少なく、差の主因です。";
    }
    if (top.id === "goalScorerBonus") {
      return "今週の得点者ボーナスが先週同帯に届いておらず、差の主因です。";
    }
    if (top.id === "streakBonus") {
      return "今週の連勝ボーナスが先週同帯に届いておらず、差の主因です。";
    }
    return "今週のUpsetボーナスが先週同帯平均を下回り、差の主因です。";
  }
  if (strengths.length > 0) {
    const top = strengths[0]!;
    if (top.id === "rank") {
      return "今週の順位上昇で先週同帯に差をつけています。";
    }
    if (top.id === "totalPoints") {
      return "今週の総合得点の積み上げで先週同帯に差をつけています。";
    }
    if (top.id === "exactHits") {
      return "今週の完全的中で先週同帯に差をつけています。";
    }
    if (top.id === "goalScorerBonus") {
      return "今週の得点者ボーナスで先週同帯に差をつけています。";
    }
    if (top.id === "streakBonus") {
      return "今週の連勝ボーナスで先週同帯に差をつけています。";
    }
    return "今週のUpsetボーナスで先週同帯に差をつけています。";
  }
  return "今週の主要指標は先週同帯と同水準です。";
}

function averageSliceField(
  members: CohortMember[],
  pick: (s: RankGapStatsSlice) => number
): number {
  if (members.length === 0) return 0;
  let sum = 0;
  for (const m of members) sum += pick(m.slice);
  return sum / members.length;
}

export function computeShadowMovement(
  members: Array<{
    priorRank: number;
    weekStartRank: number;
    currentRank: number;
  }>
): RankShadowMovement {
  let rose = 0;
  let flat = 0;
  let fell = 0;
  let roseToTop30 = 0;

  for (const m of members) {
    const rankDelta = weeklyRankGain(m.weekStartRank, m.currentRank);
    if (rankDelta > 0) rose += 1;
    else if (rankDelta < 0) fell += 1;
    else flat += 1;

    if (
      m.weekStartRank > SHADOW_TOP30_THRESHOLD &&
      m.currentRank <= SHADOW_TOP30_THRESHOLD
    ) {
      roseToTop30 += 1;
    }
  }

  return { rose, flat, fell, roseToTop30 };
}

export function computeShadowTraits(
  members: CohortMember[]
): RankShadowTrait[] {
  if (members.length === 0) return [];

  const avgPosts = averageSliceField(members, (s) => s.posts);
  const avgExact = averageSliceField(members, (s) => s.exactHitCount);
  let upsetShareSum = 0;
  let upsetShareN = 0;
  for (const m of members) {
    if (m.slice.pointsSumV3 > 0) {
      upsetShareSum += m.slice.upsetBonusSum / m.slice.pointsSumV3;
      upsetShareN += 1;
    }
  }
  const avgUpsetShare = upsetShareN > 0 ? upsetShareSum / upsetShareN : 0;

  const traits: RankShadowTrait[] = [];
  if (avgPosts >= 4) traits.push({ id: "highVolume" });
  if (avgUpsetShare >= 0.28) traits.push({ id: "upsetHeavy" });
  if (avgExact < 2.5) traits.push({ id: "lowExact" });

  if (traits.length === 0) traits.push({ id: "highVolume" });

  return traits.slice(0, 3);
}

export function bandTypeLabelFromTraits(
  traits: RankShadowTrait[],
  language: Language
): string {
  const primary = traits[0]?.id ?? "highVolume";
  if (language === "en") {
    if (primary === "upsetHeavy") return "Upset-heavy band";
    if (primary === "lowExact") return "Volume-first band";
    return "High-volume band";
  }
  if (primary === "upsetHeavy") return "Upset型の帯";
  if (primary === "lowExact") return "多投稿型の帯";
  return "堅実型の帯";
}

export function computeRankShadowAnalysis(input: {
  currentRank: number;
  priorRank: number;
  priorBand: ReturnType<typeof resolveShadowBandRange>;
  weekAnchorDateKey: string;
  selfSlice: RankGapStatsSlice;
  selfAnchorMetrics: RankShadowAnchorMetrics | null;
  selfWeekStartRank: number;
  cohortMembers: CohortMember[];
  rankProgressPoints: MyRankProgressPoint[];
  rankingLeague: RankingLeagueSource;
  language: Language;
  selfUid?: string;
}): RankShadowAnalysis | { ok: false; reason: string } {
  const members = input.cohortMembers.filter((m) => m.slice.posts > 0);
  if (members.length === 0) {
    return { ok: false, reason: "cohort_empty" };
  }

  const showGoalScorer = input.rankingLeague === "worldcup";
  const selfWeekly = computeShadowWeeklySlice(
    input.selfSlice,
    input.selfAnchorMetrics
  );
  const selfRankGain = weeklyRankGain(
    input.selfWeekStartRank,
    input.currentRank
  );
  const avgRankGain = averageRankGain(members);
  const avgTotal = averageWeeklyField(members, (w) => w.pointsSumV3);
  const avgExact = averageWeeklyField(members, (w) => w.exactHitCount);
  const avgStreak = averageWeeklyField(members, (w) => w.streakBonusSum);
  const avgUpset = averageWeeklyField(members, (w) => w.upsetBonusSum);
  const avgGoalScorer = averageWeeklyField(
    members,
    (w) => w.goalScorerBonusSum
  );

  const traits = computeShadowTraits(members);
  const movement = computeShadowMovement(members);
  const compareRows: RankShadowCompareRow[] = [
    buildCompareRow("rank", selfRankGain, avgRankGain),
    buildCompareRow("totalPoints", selfWeekly.pointsSumV3, avgTotal),
    buildCompareRow("exactHits", selfWeekly.exactHitCount, avgExact),
    buildCompareRow("streakBonus", selfWeekly.streakBonusSum, avgStreak),
    buildCompareRow("upsetBonus", selfWeekly.upsetBonusSum, avgUpset),
  ];
  if (showGoalScorer) {
    compareRows.push(
      buildCompareRow(
        "goalScorerBonus",
        selfWeekly.goalScorerBonusSum,
        avgGoalScorer
      )
    );
  }

  return {
    ok: true,
    currentRank: input.currentRank,
    priorRank: input.priorRank,
    priorBandLow: input.priorBand.low,
    priorBandHigh: input.priorBand.high,
    weekAnchorDateKey: input.weekAnchorDateKey,
    cohortSize: members.length,
    movement,
    traits,
    bandTypeLabel: bandTypeLabelFromTraits(traits, input.language),
    compareRows,
    showGoalScorer,
    compareAdvice: buildShadowCompareAdvice(compareRows, input.language),
    rankProgressPoints: input.rankProgressPoints.slice(
      -SHADOW_RANK_PROGRESS_DAYS
    ),
    rivalRoster: buildShadowRivalRoster({
      members: members.map((m) => ({
        uid: m.uid,
        priorRank: m.weekStartRank,
        currentRank: m.currentRank,
        displayName: m.displayName,
        photoURL: m.photoURL,
        progressPoints: m.progressPoints,
      })),
      selfUid: input.selfUid,
    }),
  };
}
