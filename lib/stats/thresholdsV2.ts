// app/lib/stats/thresholdsV2.ts

/** UI 側で使うハイライト段階 */
export type HighlightV2 = {
  level: "none" | "yellow" | "strong";
  icon?: "crown" | "fire";
  reason?: string;
};

export type PeriodV2 = "7d" | "30d" | "all";

type ThresholdPair = { yellow: number; strong: number };

/* =============================
 * 期間別・合計指標用の閾値（厳しめ）
 * ============================= */
const SUM_THRESHOLDS = {
  scorePrecisionSum: {
    "7d": { yellow: 50, strong: 100 },
    "30d": { yellow: 200, strong: 300 },
    "all": { yellow: 140, strong: 180 },
  } satisfies Record<PeriodV2, ThresholdPair>,

  upsetPointsSum: {
    "7d": { yellow: 10, strong: 20 },
    "30d": { yellow: 30, strong: 55 },
    "all": { yellow: 80, strong: 130 },
  } satisfies Record<PeriodV2, ThresholdPair>,

  pointsSumV3: {
    "7d": { yellow: 50, strong: 100 },
    "30d": { yellow: 200, strong: 300 },
    "all": { yellow: 150, strong: 210 },
  } satisfies Record<PeriodV2, ThresholdPair>,
} as const;

function evalSumByPeriod(
  sum: number,
  period: PeriodV2,
  t: Record<PeriodV2, ThresholdPair>,
  opts?: { strongIcon?: HighlightV2["icon"]; yellowIcon?: HighlightV2["icon"]; metric?: string }
): HighlightV2 {
  const v = Number(sum);
  if (!Number.isFinite(v) || v <= 0) return { level: "none" };

  const th = t[period];
  const metric = opts?.metric ?? "sum";

  if (v >= th.strong) {
    return {
      level: "strong",
      icon: opts?.strongIcon,
      reason: `${metric}>=${th.strong} (${period})`,
    };
  }

  if (v >= th.yellow) {
    return {
      level: "yellow",
      icon: opts?.yellowIcon,
      reason: `${metric}>=${th.yellow} (${period})`,
    };
  }

  return { level: "none" };
}

/* =============================
 * 勝率（WinRate）
 * ============================= */
export function evaluateWinRateV2(winRate01: number): HighlightV2 {
  const r = Number(winRate01);
  if (!Number.isFinite(r) || r <= 0) return { level: "none" };

  // yellow: 65% / strong: 78%
  if (r >= 0.78) return { level: "strong", reason: "winrate>=78%" };
  if (r >= 0.65) return { level: "yellow", reason: "winrate>=65%" };
  return { level: "none" };
}

/* =============================
 * スコア精度（合計：scorePrecisionSum）
 * ============================= */
export function evaluateScorePrecisionSumV2(
  scorePrecisionSum: number,
  period: PeriodV2
): HighlightV2 {
  return evalSumByPeriod(scorePrecisionSum, period, SUM_THRESHOLDS.scorePrecisionSum, {
    strongIcon: "crown",
    metric: "scorePrecisionSum",
  });
}

/* =============================
 * UPSET得点（合計：upsetPointsSum）
 * ============================= */
export function evaluateUpsetPointsSumV2(
  upsetPointsSum: number,
  period: PeriodV2
): HighlightV2 {
  return evalSumByPeriod(upsetPointsSum, period, SUM_THRESHOLDS.upsetPointsSum, {
    strongIcon: "fire",
    metric: "upsetPointsSum",
  });
}

/* =============================
 * 総合得点（合計：pointsSumV3）
 * ============================= */
export function evaluatePointsSumV3V2(
  pointsSumV3: number,
  period: PeriodV2
): HighlightV2 {
  return evalSumByPeriod(pointsSumV3, period, SUM_THRESHOLDS.pointsSumV3, {
    strongIcon: "crown",
    metric: "pointsSumV3",
  });
}

/* =============================
 * 連勝（maxStreak）
 * yellow: 7以上 / strong: 10以上
 * ============================= */
export function evaluateMaxStreakV2(maxStreak: number): HighlightV2 {
  const v = Math.max(0, Math.floor(Number(maxStreak)));
  if (v >= 10) return { level: "strong", reason: "streak>=10" };
  if (v >= 7) return { level: "yellow", reason: "streak>=7" };
  return { level: "none" };
}

/* =============================
 * （互換用：古いAPIを残す）
 * - 旧 evaluatePrecisionV2 は平均前提だったので常に none に寄せる
 * - 旧 evaluateUpsetV2 は 0-100 前提だったので常に none に寄せる
 *   ※ UI 側の置換が完了したら削除でOK
 * ============================= */
export function evaluatePrecisionV2(_avgPrecision: number): HighlightV2 {
  return { level: "none", reason: "deprecated: use evaluateScorePrecisionSumV2" };
}

export function evaluateUpsetV2(_legacy: number): HighlightV2 {
  return { level: "none", reason: "deprecated: use evaluateUpsetPointsSumV2" };
}

/* =============================
 * 強弱比較ヘルパ
 * ============================= */
export function pickStrongerV2(a: HighlightV2, b: HighlightV2): HighlightV2 {
  const rank = (lvl: HighlightV2["level"]) =>
    lvl === "strong" ? 2 : lvl === "yellow" ? 1 : 0;

  if (rank(a.level) > rank(b.level)) return a;
  if (rank(a.level) < rank(b.level)) return b;

  const prio = (i?: HighlightV2["icon"]) =>
    i === "crown" ? 2 : i === "fire" ? 1 : 0;

  return prio(a.icon) >= prio(b.icon) ? a : b;
}
