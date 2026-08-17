// 月次レポート組み立て — 既存データソースから最小コストで MonthlyReport を作る。
// 旧 user_stats_v2_monthly / radar10 / judgeAnalysisType は使わない
// （それらは Pro Stats タブ用に別途稼働中。レポートとは独立）。
//
// 安い読み取り:
// 1) period_ranking_snapshots（月次・各 metric）→ 順位・prevRank
// 2) user_stats_v2_daily を月で合算 → posts/points/wins/scorer/upset
// 3) pickup 分母 → activityRate / sampleEligible
// 4) monthlyRadarJudge → strengths / analysisTypeId
// Units は ledger 未接続のため 0 / null stub

import type { AnalysisTypeId } from "@/shared/analysis/types";
import type {
  MonthlyReport,
  MonthlyReportMetric,
  MonthlyReportMetricKey,
  MonthlyReportOutlook,
  MonthlyReportRadar,
  MonthlyReportRadarAxisKey,
} from "@/lib/reports/monthlyReportTypes";
import {
  buildMonthlyRadarPercentiles,
  collectMonthlyRadarStrengths,
  judgeMonthlyAnalysisType,
  type MonthlyRadarStrengthInput,
} from "@/lib/reports/monthlyRadarJudge";
import { MONTHLY_REPORT_RADAR_STRENGTH_P } from "@/lib/reports/monthlyReportTypes";

export type MonthlyReportRankBundle = {
  /** totalPoints 順位 */
  pointsRank: number;
  prevPointsRank: number | null;
  participantCount: number;
  /** 指標内順位（posts/winRate は UI 非表示なので null 可） */
  metricRanks: Partial<Record<MonthlyReportMetricKey, number | null>>;
};

export type MonthlyReportValueBundle = {
  posts: number;
  wins: number;
  points: number;
  /** 0–1 */
  winRate: number;
  goalScorerHits: number;
  upsetPoints: number;
  upsetOpportunity: number;
  pickupPosts: number;
  pickupGameCount: number;
  maxLoseStreak: number;
  unitsEarned: number;
  unitsEarnedRank: number | null;
};

export type MonthlyReportBenchmarkBundle = {
  median: Partial<Record<MonthlyReportMetricKey, number | null>>;
  top10: Partial<Record<MonthlyReportMetricKey, number | null>>;
  scorerHitsMedian: number;
  upsetPointsMedian: number;
  prevValues: Partial<Record<MonthlyReportMetricKey, number | null>>;
};

export type BuildMonthlyReportInput = {
  monthKey: string;
  values: MonthlyReportValueBundle;
  ranks: MonthlyReportRankBundle;
  benchmarks: MonthlyReportBenchmarkBundle;
  /**
   * コホート内パーセンタイル 0–100（呼び出し側で daily 合算コホートから算出）。
   * I/O しない組み立て層なので、ここには既算の % を渡す。
   */
  radarPercentiles: MonthlyReportRadar;
  habits?: MonthlyReport["habits"];
  teamAffinity?: MonthlyReport["teamAffinity"];
  highlights?: MonthlyReport["highlights"];
  unitsBreakdown?: MonthlyReport["unitsBreakdown"];
  outlook?: MonthlyReportOutlook;
};

function activityRate(v: MonthlyReportValueBundle): number {
  if (v.pickupGameCount <= 0) return 0;
  return Math.min(1, v.pickupPosts / v.pickupGameCount);
}

function delta(cur: number, prev: number | null | undefined): number | null {
  if (prev == null || !Number.isFinite(prev)) return null;
  return cur - prev;
}

function metricRow(
  key: MonthlyReportMetricKey,
  value: number,
  input: BuildMonthlyReportInput,
  showRank: boolean
): MonthlyReportMetric {
  const { benchmarks, ranks } = input;
  return {
    key,
    value,
    prevDelta: delta(value, benchmarks.prevValues[key]),
    median: benchmarks.median[key] ?? null,
    top10: benchmarks.top10[key] ?? null,
    rank: showRank ? ranks.metricRanks[key] ?? null : null,
  };
}

export function buildRadarStrengthInputFromValues(
  values: MonthlyReportValueBundle,
  percentiles: MonthlyReportRadar,
  benchmarks: Pick<
    MonthlyReportBenchmarkBundle,
    "scorerHitsMedian" | "upsetPointsMedian"
  >
): MonthlyRadarStrengthInput {
  return {
    win: {
      percentile: percentiles.win,
      winRate: values.winRate,
    },
    scorer: {
      percentile: percentiles.scorer,
      scorerHits: values.goalScorerHits,
      scorerMedian: benchmarks.scorerHitsMedian,
    },
    upset: {
      percentile: percentiles.upset,
      upsetPoints: values.upsetPoints,
      upsetMedian: benchmarks.upsetPointsMedian,
      upsetOpportunity: values.upsetOpportunity,
    },
    activity: {
      percentile: percentiles.activity,
      activityRate: activityRate(values),
    },
    consistency: {
      percentile: percentiles.consistency,
      maxLoseStreak: values.maxLoseStreak,
    },
  };
}

/**
 * 既に取得済みの順位・合算値・ベンチマーク・レーダー% から MonthlyReport を組み立てる。
 * Firestore I/O はしない。
 */
export function buildMonthlyReportFromSources(
  input: BuildMonthlyReportInput
): MonthlyReport & {
  sampleEligible: boolean;
  strengths: MonthlyReportRadarAxisKey[];
} {
  const { values, ranks, benchmarks, monthKey, radarPercentiles } = input;
  const rate = activityRate(values);
  const sampleEligible = rate >= 0.5 && values.pickupGameCount > 0;

  const strengthInput = buildRadarStrengthInputFromValues(
    values,
    radarPercentiles,
    benchmarks
  );
  const strengths = sampleEligible
    ? collectMonthlyRadarStrengths(strengthInput)
    : [];
  const analysisTypeId: AnalysisTypeId = judgeMonthlyAnalysisType({
    strengths,
    sampleEligible,
  });

  const metrics: MonthlyReportMetric[] = [
    metricRow("posts", values.posts, input, false),
    metricRow("winRate", values.winRate * 100, input, false),
    metricRow("units", values.unitsEarned, input, true),
    metricRow("points", values.points, input, true),
    metricRow("goalScorerHits", values.goalScorerHits, input, true),
    metricRow("upsetPoints", values.upsetPoints, input, true),
  ];

  const prevRank = ranks.prevPointsRank;
  const rankDeltaPlaces =
    prevRank != null && Number.isFinite(prevRank)
      ? prevRank - ranks.pointsRank
      : null;

  const topPercent =
    ranks.participantCount > 0
      ? (ranks.pointsRank / ranks.participantCount) * 100
      : null;

  const report: MonthlyReport = {
    league: "nba",
    monthKey,
    participantCount: ranks.participantCount,
    rank: ranks.pointsRank,
    prevRank,
    rankDeltaPlaces,
    topPercent,
    totalPoints: values.points,
    totalPosts: values.posts,
    totalWins: values.wins,
    unitsEarned: values.unitsEarned,
    unitsEarnedRank: values.unitsEarnedRank,
    analysisTypeId,
    metrics,
    unitsBreakdown: input.unitsBreakdown ?? [],
    radar: buildMonthlyRadarPercentiles(strengthInput),
    habits: input.habits ?? null,
    teamAffinity: input.teamAffinity ?? { strong: [], weak: [] },
    highlights: input.highlights ?? [],
    outlook: input.outlook ?? {
      summary: "",
    },
  };

  return { ...report, sampleEligible, strengths };
}

/** コホート配列からパーセンタイル 0–100 */
export function percentileInSorted(sortedAsc: number[], value: number): number {
  if (sortedAsc.length === 0) return 0;
  let below = 0;
  let equal = 0;
  for (const v of sortedAsc) {
    if (v < value) below++;
    else if (v === value) equal++;
  }
  return ((below + equal * 0.5) / sortedAsc.length) * 100;
}

export function medianOfSorted(sortedAsc: number[]): number {
  if (sortedAsc.length === 0) return 0;
  const mid = Math.floor(sortedAsc.length / 2);
  if (sortedAsc.length % 2 === 1) return sortedAsc[mid]!;
  return (sortedAsc[mid - 1]! + sortedAsc[mid]!) / 2;
}

/** 上位 10% の平均（昇順配列） */
export function top10MeanOfSorted(sortedAsc: number[]): number {
  if (sortedAsc.length === 0) return 0;
  const n = Math.max(1, Math.ceil(sortedAsc.length * 0.1));
  const slice = sortedAsc.slice(-n);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

export { MONTHLY_REPORT_RADAR_STRENGTH_P };
