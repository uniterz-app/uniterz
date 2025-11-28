// app/lib/stats/thresholds.ts

/** 集計レンジ */
export type RangeValue = "7d" | "30d" | "all";

/** ハイライト段階 */
export type HighlightLevel = "none" | "yellow" | "strong";

/** 判定結果（UI側で色やアイコンを決めるための最小情報） */
export type Highlight = {
  level: HighlightLevel;           // 文字色の強さ
  icon?: "crown" | "fire";         // 追加アイコン（👑 / 🔥）
  reason?: string;                 // デバッグやツールチップ用
};

/** サンプル最小件数（これ未満ならハイライトしない） */
export const MIN_SAMPLES: Record<Extract<RangeValue, "7d" | "30d">, number> = {
  "7d": 3,
  "30d": 10,
};

/** サンプル件数を満たしているか（allは制約なしでtrue） */
export function hasEnoughSamples(range: RangeValue, sampleCount: number): boolean {
  if (range === "7d" || range === "30d") {
    const min = MIN_SAMPLES[range];
    return Number(sampleCount || 0) >= min;
  }
  return true; // "all" は最小件数制約なし
}

/* ======================
 * 勝率（0..1）しきい値
 *  - 52% 以上 → yellow
 *  - 57% 以上 → strong
 * ====================== */
export function evaluateWinRate(
  range: RangeValue,
  winRate01: number,
  sampleCount: number
): Highlight {
  if (!hasEnoughSamples(range, sampleCount)) {
    return { level: "none", reason: "sample_insufficient" };
  }
  const r = Number(winRate01);
  if (!Number.isFinite(r) || r <= 0) return { level: "none" };

  if (r >= 0.57) return { level: "strong", reason: "winrate>=57%" };
  if (r >= 0.52) return { level: "yellow", reason: "winrate>=52%" };
  return { level: "none" };
}

/* ======================
 * 平均オッズしきい値
 *  - 2.2 以上 → yellow
 *  - 3.0 以上 → strong
 *  - 5.0 以上 → yellow + crown（👑）
 *    ※ 5.0 は “王冠”を付けつつ levelはyellow（色味は強すぎない前提）
 * ====================== */
export function evaluateAvgOdds(
  range: RangeValue,
  avgOdds: number,
  sampleCount: number
): Highlight {
  if (!hasEnoughSamples(range, sampleCount)) {
    return { level: "none", reason: "sample_insufficient" };
  }
  const v = Number(avgOdds);
  if (!Number.isFinite(v) || v <= 0) return { level: "none" };

  if (v >= 5.0) return { level: "yellow", icon: "crown", reason: "avgOdds>=5.0" };
  if (v >= 3.0) return { level: "strong", reason: "avgOdds>=3.0" };
  if (v >= 2.2) return { level: "yellow", reason: "avgOdds>=2.2" };
  return { level: "none" };
}

/* ======================
 * 獲得ユニットしきい値
 *  - 7日：+5.00 以上 → yellow / +10.00 以上 → strong + 🔥
 *  - 30日：+15.00 以上 → yellow / +30.00 以上 → strong + 🔥
 *  - all は現状しきい値なし（必要なら後で拡張）
 * ====================== */
export function evaluateUnits(
  range: RangeValue,
  units: number,
  sampleCount: number
): Highlight {
  if (!hasEnoughSamples(range, sampleCount)) {
    return { level: "none", reason: "sample_insufficient" };
  }
  const u = Number(units);
  if (!Number.isFinite(u)) return { level: "none" };

  if (range === "7d") {
    if (u >= 10.0) return { level: "strong", icon: "fire", reason: "units>=10@7d" };
    if (u >= 5.0)  return { level: "yellow", reason: "units>=5@7d" };
    return { level: "none" };
  }
  if (range === "30d") {
    if (u >= 30.0) return { level: "strong", icon: "fire", reason: "units>=30@30d" };
    if (u >= 15.0) return { level: "yellow", reason: "units>=15@30d" };
    return { level: "none" };
  }
  // "all" は今回しきい値なし
  return { level: "none" };
}

/* ======================
 * 便利：最も強い方を採用する合成ヘルパ（必要なら使用）
 * ====================== */
export function pickStronger(a: Highlight, b: Highlight): Highlight {
  const rank = (lvl: HighlightLevel) => (lvl === "strong" ? 2 : lvl === "yellow" ? 1 : 0);
  if (rank(a.level) > rank(b.level)) return a;
  if (rank(a.level) < rank(b.level)) return b;

  // 同ランクの場合、アイコン優先度 crown > fire > undefined
  const prio = (i?: Highlight["icon"]) => (i === "crown" ? 2 : i === "fire" ? 1 : 0);
  if (prio(a.icon) >= prio(b.icon)) return a;
  return b;
}
