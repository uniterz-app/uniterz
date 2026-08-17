/** Kinetik 2×2 セル向け — アップセット（ⓘ で日本語説明） */
export const KINETIK_UPSET_METRIC_LABEL = "UPSET";

/** ラベルに uppercase / 広い letter-spacing を付けるか（CJK は折り返し・欠けを防ぐ） */
export function kinetikMetricLabelUsesLatinUppercase(label: string): boolean {
  return !/[\u3040-\u30ff\u3400-\u9fff]/.test(label);
}

/** 総合 1 位バッジ — 数字と単位を分離（JA: 1 + 位 / EN: #1） */
export function parseKinetikApexRankLabel(
  rankLabel: string,
  language: "ja" | "en"
): { num: string; suffix: string } | { hash: string } {
  if (language === "ja" && rankLabel.endsWith("位")) {
    return { num: rankLabel.slice(0, -1), suffix: "位" };
  }
  return { hash: rankLabel };
}
