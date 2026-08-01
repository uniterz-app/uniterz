// 月次レポート集計スキーム — 入力 / 中間 / 出力の契約。
// docs/pro-subscription-plan.md § 月次レポート集計スキーム
// functions の builder はこの型に沿って user_reports/{uid}_monthly_{YYYY-MM} を書く。

import type { AnalysisTypeId } from "@/shared/analysis/types";
import type {
  MonthlyReport,
  MonthlyReportMetricKey,
  MonthlyReportRadarAxisKey,
} from "@/lib/reports/monthlyReportTypes";
import type { MonthlyRadarAxisMetrics } from "@/lib/reports/monthlyRadarJudge";

/** 集計対象月 YYYY-MM */
export type MonthlyReportMonthKey = string;

/**
 * Step 0 — 月の範囲とピックアップ分母
 * pickupGameIds = その月に tip-off がある試合のうち pickupWeekKey があるもの
 * （または該当 weekKey 群の gameIds 和集合）
 */
export type MonthlyReportScope = {
  league: "nba";
  monthKey: MonthlyReportMonthKey;
  /** 月の初日〜末日 JST dateKey */
  dateKeys: string[];
  /** ピックアップ試合 ID（分母） */
  pickupGameIds: string[];
  pickupGameCount: number;
};

/**
 * Step 1 — ユーザー単位の生集計（試合・投稿から）
 * 既存 daily / posts を月で畳んだ結果。
 */
export type MonthlyReportUserRaw = {
  uid: string;
  /** 月内の全予想数（ピックアップ外も含む。数字セクション用） */
  posts: number;
  wins: number;
  pointsSum: number;
  winRate: number;
  goalScorerHits: number;
  upsetPointsSum: number;
  upsetOpportunity: number;
  /** ピックアップ試合への予想数 */
  pickupPosts: number;
  /** pickupPosts / pickupGameCount（分母0なら 0） */
  activityRate: number;
  maxWinStreak: number;
  maxLoseStreak: number;
  /** 今月獲得 Unit（別ソース。未接続なら 0） */
  unitsEarned: number;
  /** 月間総合得点ランキング順位（接続後） */
  pointsRank: number | null;
  prevPointsRank: number | null;
  unitsEarnedRank: number | null;
};

/**
 * Step 2 — コホート統計（サンプル対象ユーザーのみで中央値・パーセンタイル）
 * サンプル対象 = pickup 半分以上（activityRate >= 0.5）
 */
export type MonthlyReportCohortBenchmarks = {
  /** 数字セクション用（絶対値の中央値 / 上位10%平均） */
  metricMedian: Partial<Record<MonthlyReportMetricKey, number>>;
  metricTop10: Partial<Record<MonthlyReportMetricKey, number>>;
  /** レーダー用パーセンタイル計算の母集団サイズ */
  radarCohortSize: number;
  scorerHitsMedian: number;
  upsetPointsMedian: number;
};

/**
 * Step 3 — ユーザーのレーダー入力（相対は後段で埋める）
 */
export type MonthlyReportUserRadarRaw = Record<
  MonthlyReportRadarAxisKey,
  Omit<MonthlyRadarAxisMetrics, "percentile"> & {
    /** パーセンタイル算出用の raw（軸ごとに意味が違う） */
    rawForPercentile: number;
  }
>;

/**
 * 集計パイプラインの段階（実装チェックリスト）
 *
 * 1. resolveScope(monthKey) → Scope（ピックアップ分母）
 * 2. aggregateUserRaws(scope) → UserRaw[]
 * 3. buildCohort(raws) → CohortBenchmarks + sampleEligible フラグ
 * 4. buildRadarInputs(raw, cohort) → StrengthInput（percentile 埋め）
 * 5. collectStrengths + judgeMonthlyAnalysisType
 * 6. buildMetrics / cover / habits / affinity / highlights / outlook
 * 7. write user_reports/{uid}_monthly_{monthKey}
 */
export const MONTHLY_REPORT_AGGREGATION_STEPS = [
  "resolveScope",
  "aggregateUserRaws",
  "buildCohort",
  "buildRadarAndType",
  "buildMetricsAndCover",
  "buildNarrativeSections",
  "writeReportDoc",
] as const;

export type MonthlyReportAggregationStep =
  (typeof MONTHLY_REPORT_AGGREGATION_STEPS)[number];

/** builder が最終的に書く doc（UI の MonthlyReport + メタ） */
export type MonthlyReportDoc = MonthlyReport & {
  uid: string;
  status: "final";
  builtAt: string;
  analysisTypeId: AnalysisTypeId;
  sampleEligible: boolean;
  strengths: MonthlyReportRadarAxisKey[];
};

/**
 * レーダー各軸の rawForPercentile の定義（集計側の正）
 *
 * | 軸 | raw |
 * |---|---|
 * | win | winRate (0–1) |
 * | scorer | goalScorerHits（的中数） |
 * | upset | upsetPointsSum |
 * | activity | activityRate (0–1) または pickupPosts |
 * | consistency | stamina raw（連勝+, 連敗- の既存合成で可） |
 */
export const MONTHLY_RADAR_RAW_SPEC = {
  win: "winRate",
  scorer: "goalScorerHits",
  upset: "upsetPointsSum",
  activity: "activityRate",
  consistency: "staminaRaw",
} as const;
