// app/lib/stats/thresholdsV2.ts

/** UI 側で使うハイライト段階 */
export type HighlightV2 = {
  level: "none" | "yellow" | "strong";
  icon?: "crown" | "fire";
  reason?: string;
};

/* =============================
 * 勝率（WinRate）
 * ============================= */
export function evaluateWinRateV2(winRate01: number): HighlightV2 {
  const r = Number(winRate01);
  if (!Number.isFinite(r) || r <= 0) return { level: "none" };

  if (r >= 0.57) return { level: "strong", reason: "winrate>=57%" };
  if (r >= 0.52) return { level: "yellow", reason: "winrate>=52%" };
  return { level: "none" };
}

/* =============================
 * 精度（Score Precision：0〜15）
 *
 *  10.5 以上 → strong（濃黄 + 👑）
 *   7.0 以上 → yellow
 * ============================= */
export function evaluatePrecisionV2(avgPrecision: number): HighlightV2 {
  const p = Number(avgPrecision);
  if (!Number.isFinite(p) || p < 0) return { level: "none" };

  if (p >= 10.5)
    return { level: "strong", icon: "crown", reason: "precision>=10.5" };

  if (p >= 7.0)
    return { level: "yellow", reason: "precision>=7" };

  return { level: "none" };
}

/* =============================
 * 自信精度（Accuracy % = (1 - AvgBrier)*100）
 * ============================= */
export function evaluateAccuracyV2(accPct: number): HighlightV2 {
  const a = Number(accPct);
  if (!Number.isFinite(a) || a <= 0) return { level: "none" };

  if (a >= 80) return { level: "strong", reason: "accuracy>=80%" };
  if (a >= 70) return { level: "yellow", reason: "accuracy>=70%" };
  return { level: "none" };
}
/* =============================
 * 一致度（Consistency % = (1 - CalibrationError)*100）
 * ============================= */
export function evaluateConsistencyV2(consistencyPct: number): HighlightV2 {
  const c = Number(consistencyPct);
  if (!Number.isFinite(c) || c <= 0) return { level: "none" };

  // 自信度のズレがほぼない = 本物
  if (c >= 90)
    return { level: "strong", icon: "crown", reason: "consistency>=90%" };

  // かなり安定
  if (c >= 75)
    return { level: "yellow", reason: "consistency>=75%" };

  return { level: "none" };
}

/* =============================
 * UPSET（0〜10 正規化版）
 *
 * 8.0 以上 → strong（🔥）
 * 5.0 以上 → yellow
 * ============================= */
export function evaluateUpsetV2(avgUpset: number): HighlightV2 {
  const u = Number(avgUpset);
  if (!Number.isFinite(u) || u <= 0) return { level: "none" };

  // 旧: 8.0 / 10 → 新: 80 / 100
  if (u >= 80)
    return { level: "strong", icon: "fire", reason: "upset>=80" };

  // 旧: 5.0 / 10 → 新: 50 / 100
  if (u >= 50)
    return { level: "yellow", reason: "upset>=50" };

  return { level: "none" };
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

