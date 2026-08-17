// 月次能力チャート — 強み判定 + 分析タイプ（純関数）。
// docs/pro-subscription-plan.md §4.3
// UI / preview / 将来の monthly report builder が共有する。

import type { AnalysisTypeId } from "@/shared/analysis/types";
import type { MonthlyReportRadarAxisKey } from "@/lib/reports/monthlyReportTypes";
import { MONTHLY_REPORT_RADAR_STRENGTH_P } from "@/lib/reports/monthlyReportTypes";

export const MONTHLY_RADAR_AXIS_ORDER: MonthlyReportRadarAxisKey[] = [
  "win",
  "scorer",
  "upset",
  "activity",
  "consistency",
];

/** 絶対下限（V1 仮置き） */
export const MONTHLY_RADAR_ABSOLUTE_FLOOR = {
  /** WIN: 勝率 */
  winRateMin: 0.52,
  /** UPSET: 最低機会数 */
  upsetOpportunityMin: 5,
  /** ACTIVITY: ピックアップ参加率 */
  activityRateMin: 0.5,
  /** CONSISTENCY: 最大連敗の上限（以下なら絶対クリア） */
  maxLoseStreakMax: 5,
} as const;

export type MonthlyRadarAxisMetrics = {
  /** コホート内パーセンタイル 0–100 */
  percentile: number;
  /** WIN 絶対: 勝率 0–1 */
  winRate?: number | null;
  /** SCORER 絶対: 的中数 */
  scorerHits?: number | null;
  /** SCORER 絶対: コホート中央値 */
  scorerMedian?: number | null;
  /** UPSET 絶対: pt 合計 */
  upsetPoints?: number | null;
  /** UPSET 絶対: コホート中央値 */
  upsetMedian?: number | null;
  /** UPSET 絶対: 機会数 */
  upsetOpportunity?: number | null;
  /** ACTIVITY 絶対: ピックアップ参加率 0–1 */
  activityRate?: number | null;
  /** CONSISTENCY 絶対: 最大連敗 */
  maxLoseStreak?: number | null;
};

export type MonthlyRadarStrengthInput = Record<
  MonthlyReportRadarAxisKey,
  MonthlyRadarAxisMetrics
>;

function finite(n: number | null | undefined): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

/** 相対 ∩ 絶対。両方満たしたら強み。 */
export function isMonthlyRadarAxisStrength(
  axis: MonthlyReportRadarAxisKey,
  m: MonthlyRadarAxisMetrics
): boolean {
  if (!finite(m.percentile) || m.percentile < MONTHLY_REPORT_RADAR_STRENGTH_P) {
    return false;
  }

  switch (axis) {
    case "win":
      return finite(m.winRate) && m.winRate >= MONTHLY_RADAR_ABSOLUTE_FLOOR.winRateMin;
    case "scorer":
      return (
        finite(m.scorerHits) &&
        finite(m.scorerMedian) &&
        m.scorerHits >= m.scorerMedian
      );
    case "upset":
      return (
        finite(m.upsetPoints) &&
        finite(m.upsetMedian) &&
        finite(m.upsetOpportunity) &&
        m.upsetPoints >= m.upsetMedian &&
        m.upsetOpportunity >= MONTHLY_RADAR_ABSOLUTE_FLOOR.upsetOpportunityMin
      );
    case "activity":
      return (
        finite(m.activityRate) &&
        m.activityRate >= MONTHLY_RADAR_ABSOLUTE_FLOOR.activityRateMin
      );
    case "consistency":
      return (
        finite(m.maxLoseStreak) &&
        m.maxLoseStreak <= MONTHLY_RADAR_ABSOLUTE_FLOOR.maxLoseStreakMax
      );
    default:
      return false;
  }
}

export function collectMonthlyRadarStrengths(
  input: MonthlyRadarStrengthInput
): MonthlyReportRadarAxisKey[] {
  return MONTHLY_RADAR_AXIS_ORDER.filter((axis) =>
    isMonthlyRadarAxisStrength(axis, input[axis])
  );
}

/** 二軸コンボ → タイプ（軸名を辞書順でキー化） */
const DUAL_TYPE: Record<string, AnalysisTypeId> = {
  "scorer+win": "TWO_WAY_PLAYER",
  "upset+win": "BIG_GAME_HUNTER",
  "activity+win": "WALKING_BUCKET",
  "consistency+win": "HIGH_FLOOR",
  "scorer+upset": "CLUTCH",
  "activity+scorer": "DEEP_BAG",
  "consistency+scorer": "SHARPSHOOTER",
  "activity+upset": "CHAOS_RUNNER",
  "consistency+upset": "CHAOS_ANCHOR",
  "activity+consistency": "SPARK_PLUG",
};

const SINGLE_TYPE: Record<MonthlyReportRadarAxisKey, AnalysisTypeId> = {
  win: "FINISHER",
  scorer: "LASER",
  upset: "CHAOS_TAKER",
  activity: "HIGH_MOTOR",
  consistency: "IRON_MAN",
};

function dualKey(a: MonthlyReportRadarAxisKey, b: MonthlyReportRadarAxisKey): string {
  return [a, b].sort().join("+");
}

/**
 * ハイブリッド分析タイプ判定。
 * - サンプル未達 → Prospect
 * - 強み 5 → GOAT / 4 → Complete Player / 3 → All-Rounder
 * - 強み 2 → 二軸表 / 1 → 単軸表 / 0 → Prospect
 */
export function judgeMonthlyAnalysisType(input: {
  strengths: readonly MonthlyReportRadarAxisKey[];
  /** ピックアップ半分以上。false なら Prospect */
  sampleEligible: boolean;
}): AnalysisTypeId {
  if (!input.sampleEligible) return "PROSPECT";

  const strengths = MONTHLY_RADAR_AXIS_ORDER.filter((a) =>
    input.strengths.includes(a)
  );
  const n = strengths.length;

  if (n >= 5) return "GOAT";
  if (n === 4) return "COMPLETE_PLAYER";
  if (n === 3) return "ALL_ROUNDER";

  if (n === 2) {
    const id = DUAL_TYPE[dualKey(strengths[0]!, strengths[1]!)];
    return id ?? "PROSPECT";
  }

  if (n === 1) {
    return SINGLE_TYPE[strengths[0]!] ?? "PROSPECT";
  }

  return "PROSPECT";
}

/** レーダー表示用パーセンタイル Record（0–100） */
export function buildMonthlyRadarPercentiles(
  input: MonthlyRadarStrengthInput
): Record<MonthlyReportRadarAxisKey, number> {
  const out = {} as Record<MonthlyReportRadarAxisKey, number>;
  for (const axis of MONTHLY_RADAR_AXIS_ORDER) {
    const p = input[axis]?.percentile;
    out[axis] = finite(p) ? Math.max(0, Math.min(100, p)) : 0;
  }
  return out;
}
